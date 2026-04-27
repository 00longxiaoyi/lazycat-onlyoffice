import fs from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import { HttpError } from '../errors';
import { sendJson } from '../utils/http';
import type { FontFileItem, FontListResponse, FontRefreshResponse, FontUploadResponse } from '../../shared/fonts';

const MAX_FONT_UPLOAD_BYTES = 80 * 1024 * 1024;
const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.ttc']);

export async function handleFontList(_request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  await ensureFontDirs(config);
  const entries = await fs.readdir(config.fontsDir, { withFileTypes: true });
  const items = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && FONT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map(async (entry): Promise<FontFileItem> => {
        const stats = await fs.stat(path.join(config.fontsDir, entry.name));
        return {
          name: entry.name,
          size: stats.size,
          updatedAt: stats.mtime.toISOString()
        };
      })
  );
  items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  sendJson(response, 200, {
    items,
    lastRefreshAt: await readLastRefreshAt(config),
    logs: await readFontRefreshLogs(config)
  } satisfies FontListResponse);
}

export async function handleFontUpload(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  await ensureFontDirs(config);
  const boundary = parseMultipartBoundary(request.headers['content-type'] || '');
  if (!boundary) {
    throw new HttpError(400, 'invalid_upload', '请使用 multipart/form-data 上传字体文件。');
  }

  const body = await readLimitedBody(request, MAX_FONT_UPLOAD_BYTES);
  const file = parseMultipartFile(body, boundary);
  const originalName = sanitizeFontFileName(file.filename);
  validateFontFile(originalName, file.content);

  const targetPath = path.join(config.fontsDir, originalName);
  await fs.writeFile(targetPath, file.content, { mode: 0o644 });
  const stats = await fs.stat(targetPath);

  sendJson(response, 201, {
    item: {
      name: originalName,
      size: stats.size,
      updatedAt: stats.mtime.toISOString()
    }
  } satisfies FontUploadResponse);
}

export async function handleFontRefresh(_request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  await ensureFontDirs(config);
  const refreshRequestedAt = new Date().toISOString();
  await fs.writeFile(path.join(config.fontRefreshDir, 'request'), refreshRequestedAt);
  sendJson(response, 200, { ok: true, refreshRequestedAt } satisfies FontRefreshResponse);
}

export async function handleFontDelete(fontName: string, _request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  await ensureFontDirs(config);
  const safeName = sanitizeFontFileName(fontName);
  const targetPath = path.join(config.fontsDir, safeName);
  await fs.rm(targetPath, { force: true });
  sendJson(response, 200, { ok: true });
}

async function ensureFontDirs(config: AppConfig): Promise<void> {
  await fs.mkdir(config.fontsDir, { recursive: true });
  await fs.mkdir(config.fontRefreshDir, { recursive: true });
}

async function readLastRefreshAt(config: AppConfig): Promise<string | null> {
  try {
    return (await fs.readFile(path.join(config.fontRefreshDir, 'last-success'), 'utf8')).trim() || null;
  } catch {
    return null;
  }
}

async function readFontRefreshLogs(config: AppConfig): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(config.fontRefreshDir, 'fonts.log'), 'utf8');
    return raw.trim().split('\n').slice(-80);
  } catch {
    return [];
  }
}

function parseMultipartBoundary(contentType: string): string | null {
  const match = contentType.match(/(?:^|;)\s*boundary=(?:("([^"]+)")|([^;]+))/i);
  return (match?.[2] || match?.[3] || '').trim() || null;
}

async function readLimitedBody(request: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limit) {
      throw new HttpError(413, 'upload_too_large', '字体文件过大，请上传 80MB 以内的字体文件。');
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function parseMultipartFile(body: Buffer, boundary: string): { filename: string; content: Buffer } {
  const delimiter = Buffer.from(`--${boundary}`);
  let offset = 0;

  while (offset < body.length) {
    const partStart = body.indexOf(delimiter, offset);
    if (partStart < 0) {
      break;
    }

    const headersStart = partStart + delimiter.length;
    if (body.subarray(headersStart, headersStart + 2).toString() === '--') {
      break;
    }

    const contentStart = body.indexOf(Buffer.from('\r\n\r\n'), headersStart);
    if (contentStart < 0) {
      break;
    }

    const headers = body.subarray(headersStart, contentStart).toString('utf8');
    const filename = parseContentDispositionFilename(headers);
    const nextPart = body.indexOf(delimiter, contentStart + 4);
    if (nextPart < 0) {
      break;
    }

    if (filename) {
      let contentEnd = nextPart;
      if (contentEnd >= 2 && body[contentEnd - 2] === 13 && body[contentEnd - 1] === 10) {
        contentEnd -= 2;
      }
      return { filename, content: body.subarray(contentStart + 4, contentEnd) };
    }

    offset = nextPart;
  }

  throw new HttpError(400, 'missing_font_file', '请上传一个字体文件。');
}

function parseContentDispositionFilename(headers: string): string | null {
  const disposition = headers.split('\r\n').find((line) => line.toLowerCase().startsWith('content-disposition:')) || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''));
  }

  const match = disposition.match(/filename="([^"]+)"|filename=([^;]+)/i);
  return (match?.[1] || match?.[2] || '').trim() || null;
}

function sanitizeFontFileName(input: string): string {
  const baseName = path.basename(input).trim().replace(/[\\/:*?"<>|\0]/g, '_');
  if (!baseName || baseName === '.' || baseName === '..') {
    throw new HttpError(400, 'invalid_font_name', '字体文件名无效。');
  }
  if (!FONT_EXTENSIONS.has(path.extname(baseName).toLowerCase())) {
    throw new HttpError(400, 'unsupported_font_type', '仅支持 .ttf、.otf、.ttc 字体文件。');
  }
  return baseName;
}

function validateFontFile(filename: string, content: Buffer): void {
  if (!content.length) {
    throw new HttpError(400, 'empty_font_file', '字体文件不能为空。');
  }

  const extension = path.extname(filename).toLowerCase();
  const signature = content.subarray(0, 4).toString('latin1');
  const isTrueType = content.length >= 4 && content[0] === 0x00 && content[1] === 0x01 && content[2] === 0x00 && content[3] === 0x00;
  const isOpenType = signature === 'OTTO';
  const isTrueTypeCollection = signature === 'ttcf';
  const isAppleTrueType = signature === 'true';

  if (extension === '.ttc' && !isTrueTypeCollection) {
    throw new HttpError(400, 'invalid_font_file', '字体文件格式与扩展名不匹配。');
  }

  if ((extension === '.ttf' || extension === '.otf') && !isTrueType && !isOpenType && !isAppleTrueType) {
    throw new HttpError(400, 'invalid_font_file', '字体文件格式与扩展名不匹配。');
  }
}
