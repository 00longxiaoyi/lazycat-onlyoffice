import type { IncomingMessage, ServerResponse } from 'node:http';
import { pipeline } from 'node:stream/promises';
import type { AppConfig } from '../config';
import { HttpError } from '../errors';
import { getSession } from '../db/session-store';
import { createReadStreamForRelativePath, resolveClientfsFilePath, resolveHomeFilePath, saveFromUrl } from '../services/file-store';
import { readJsonBody, sendJson } from '../utils/http';

interface OnlyOfficeCallbackPayload {
  status?: number;
  url?: string;
  forcesavetype?: number;
  key?: string;
  users?: string[];
}

export async function handleDownload(
  sessionId: string,
  request: IncomingMessage,
  response: ServerResponse,
  config: AppConfig,
  headOnly = false
): Promise<void> {
  const session = await getRequiredSession(sessionId);

  if (session.storageType === 'remote-url') {
    return proxyOriginalFileDownload(session, request, response, headOnly);
  }

  if (session.storageType === 'lazycat-file' || session.fileOrigin) {
    return proxyOriginalFileDownload(session, request, response, headOnly);
  }

  const resolvedPath = session.storageType === 'clientfs'
    ? resolveClientfsFilePath(session.relativePath, config, session.ownerUid)
    : resolveHomeFilePath(session.relativePath, config, session.ownerUid);
  const stats = await import('node:fs').then((fs) => fs.promises.stat(resolvedPath));
  console.log('[download] local request', {
    sessionId,
    title: session.title,
    relativePath: session.relativePath,
    resolvedPath,
    headOnly
  });
  const filename = encodeURIComponent(session.title);

  const range = parseRangeHeader(request.headers.range, stats.size);
  const headers = {
    'content-type': contentTypeFor(session.fileType),
    'content-disposition': `attachment; filename*=UTF-8''${filename}`,
    'content-length': String(range ? range.end - range.start + 1 : stats.size),
    'accept-ranges': 'bytes',
    'cache-control': 'no-store'
  };

  if (range) {
    response.writeHead(206, {
      ...headers,
      'content-range': `bytes ${range.start}-${range.end}/${stats.size}`
    });
  } else {
    response.writeHead(200, headers);
  }

  if (headOnly) {
    response.end();
    return;
  }

  const stream = createReadStreamForRelativePath(
    session.relativePath,
    config,
    range || undefined,
    session.ownerUid,
    session.storageType === 'clientfs' ? 'clientfs' : 'home'
  );
  stream.pipe(response);
}

async function proxyOriginalFileDownload(
  session: Awaited<ReturnType<typeof getRequiredSession>>,
  request: IncomingMessage,
  response: ServerResponse,
  headOnly: boolean
): Promise<void> {
  const upstream = await fetch(session.originalUrl, {
    method: headOnly ? 'HEAD' : 'GET',
    headers: {
      ...(request.headers.range ? { range: request.headers.range } : {}),
      ...(session.storageType === 'lazycat-file' && session.requestCookie ? { cookie: session.requestCookie } : {})
    }
  });

  if (!upstream.ok && upstream.status !== 206) {
    throw new HttpError(upstream.status, 'file_download_failed', `Failed to fetch original file: ${upstream.status}`);
  }

  console.log('[download] proxy request', {
    sessionId: session.id,
    title: session.title,
    relativePath: session.relativePath,
    source: session.originalUrl,
    status: upstream.status,
    headOnly
  });

  const filename = encodeURIComponent(session.title);
  const headers: Record<string, string> = {
    'content-type': upstream.headers.get('content-type') || contentTypeFor(session.fileType),
    'content-disposition': `attachment; filename*=UTF-8''${filename}`,
    'accept-ranges': upstream.headers.get('accept-ranges') || 'bytes',
    'cache-control': 'no-store'
  };

  const contentLength = upstream.headers.get('content-length');
  const contentRange = upstream.headers.get('content-range');
  if (contentLength) headers['content-length'] = contentLength;
  if (contentRange) headers['content-range'] = contentRange;

  response.writeHead(upstream.status, headers);

  if (headOnly) {
    response.end();
    return;
  }

  if (!upstream.body) {
    throw new HttpError(502, 'empty_file_download', 'Original file response body is empty.');
  }

  await pipeline(upstream.body, response);
}

function parseRangeHeader(rangeHeader: string | undefined, size: number): { start: number; end: number } | null {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) {
    return null;
  }

  const [, rawStart, rawEnd] = match;
  let start = rawStart ? Number(rawStart) : 0;
  let end = rawEnd ? Number(rawEnd) : size - 1;

  if (!rawStart && rawEnd) {
    const suffixLength = Number(rawEnd);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}

export async function handleCallback(sessionId: string, request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const session = await getRequiredSession(sessionId);
  const payload = await readJsonBody<OnlyOfficeCallbackPayload>(request);
  const status = Number(payload.status || 0);

  console.log('[callback] onlyoffice save event', {
    sessionId,
    status,
    forcesavetype: payload.forcesavetype,
    hasUrl: Boolean(payload.url),
    key: payload.key,
    users: payload.users,
    title: session.title,
    relativePath: session.relativePath,
    ownerUid: session.ownerUid
  });

  if ((status === 2 || status === 6) && payload.url) {
    if (session.mode !== 'edit' || session.state !== 'active') {
      console.warn('[callback] ignored inactive editor session save', {
        sessionId,
        status,
        mode: session.mode,
        state: session.state,
        supersededBy: session.supersededBy
      });
      return sendJson(response, 200, { error: 0 });
    }

    if (session.storageType === 'remote-url') {
      await saveRemoteDocumentFromUrl(payload.url, session.originalUrl, session.fileType);
      console.log('[callback] saved remote document', {
        sessionId,
        status,
        title: session.title,
        source: session.originalUrl
      });
      return sendJson(response, 200, { error: 0 });
    }

    try {
      await saveFromUrl(
        payload.url,
        session.relativePath,
        config,
        session.ownerUid,
        session.storageType === 'clientfs' ? 'clientfs' : 'home'
      );
    } catch (error) {
      console.error('[callback] failed to save document', {
        sessionId,
        storageType: session.storageType,
        relativePath: session.relativePath,
        ownerUid: session.ownerUid,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
    console.log('[callback] saved document', {
      sessionId,
      status,
      title: session.title,
      relativePath: session.relativePath,
      ownerUid: session.ownerUid
    });
  }

  sendJson(response, 200, { error: 0 });
}

async function saveRemoteDocumentFromUrl(sourceUrl: string, targetUrl: string, fileType: string): Promise<void> {
  const download = await fetch(sourceUrl);
  if (!download.ok) {
    throw new HttpError(502, 'callback_download_failed', `Failed to download saved document: ${download.status}`);
  }

  const body = Buffer.from(await download.arrayBuffer());
  const upload = await fetch(targetUrl, {
    method: 'PUT',
    headers: {
      'content-type': download.headers.get('content-type') || contentTypeFor(fileType),
      'content-length': String(body.byteLength)
    },
    body
  });

  if (!upload.ok) {
    throw new HttpError(upload.status, 'remote_writeback_failed', `Remote URL writeback failed: ${upload.status}`);
  }
}

async function getRequiredSession(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new HttpError(404, 'session_not_found', 'Editor session does not exist.');
  }
  return session;
}

function contentTypeFor(fileType: string): string {
  const ext = fileType.toLowerCase();
  const map: Record<string, string> = {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
    txt: 'text/plain; charset=utf-8',
    csv: 'text/csv; charset=utf-8'
  };
  return map[ext] || 'application/octet-stream';
}
