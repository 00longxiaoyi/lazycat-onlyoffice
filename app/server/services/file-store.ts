import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ServerResponse } from 'node:http';
import { HttpError } from '../errors';
import type { AppConfig } from '../config';


export function resolveClientfsFilePath(relativePath: string, config: AppConfig, ownerUid?: string): string {
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const scopedPath = normalizedOwnerUid ? path.join(normalizedOwnerUid, relativePath) : relativePath;
  return resolvePathInRoot(config.clientfsRoot, scopedPath, 'Resolved clientfs path escapes clientfs root.');
}

export function resolveHomeFilePath(relativePath: string, config: AppConfig, ownerUid?: string): string {
  const root = path.resolve(config.homeRoot);
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const scopedPath = normalizedOwnerUid ? path.join(normalizedOwnerUid, relativePath) : relativePath;
  return resolvePathInRoot(root, scopedPath, 'Resolved file path escapes home root.');
}


export function createReadStreamForRelativePath(
  relativePath: string,
  config: AppConfig,
  range?: { start: number; end: number },
  ownerUid?: string,
  root: 'home' | 'clientfs' = 'home'
): fs.ReadStream {
  const target = root === 'clientfs' ? resolveClientfsFilePath(relativePath, config, ownerUid) : resolveHomeFilePath(relativePath, config, ownerUid);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new HttpError(404, 'file_not_found', 'File does not exist.');
  }
  return fs.createReadStream(target, range);
}

export async function saveFromUrl(url: string, relativePath: string, config: AppConfig, ownerUid?: string, root: 'home' | 'clientfs' = 'home'): Promise<void> {
  const target = root === 'clientfs' ? resolveClientfsFilePath(relativePath, config, ownerUid) : resolveHomeFilePath(relativePath, config, ownerUid);
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new HttpError(502, 'callback_download_failed', `Failed to download saved document: ${response.status}`);
  }

  await fs.promises.mkdir(path.dirname(target), { recursive: true });

  if (root === 'clientfs') {
    const body = Buffer.from(await response.arrayBuffer());
    await writeClientfsFile(target, body);
    return;
  }

  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await pipeline(response.body, fs.createWriteStream(tmp));
  await fs.promises.rename(tmp, target);
}


async function writeClientfsFile(target: string, body: Buffer): Promise<void> {
  try {
    await fs.promises.writeFile(target, body);
    return;
  } catch (writeError) {
    try {
      await fs.promises.truncate(target, 0);
      await pipeline(Readable.from(body), fs.createWriteStream(target, { flags: 'r+' }));
      return;
    } catch (streamError) {
      const writeMessage = writeError instanceof Error ? writeError.message : String(writeError);
      const streamMessage = streamError instanceof Error ? streamError.message : String(streamError);
      throw new HttpError(500, 'clientfs_write_failed', `Clientfs write failed: ${writeMessage}; fallback failed: ${streamMessage}`);
    }
  }
}

function normalizeOwnerUid(ownerUid: string | undefined): string {
  if (!ownerUid) {
    return '';
  }

  const normalized = ownerUid.trim();
  if (!normalized) {
    return '';
  }

  if (normalized.includes('/') || normalized.includes('\\') || normalized === '.' || normalized === '..') {
    throw new HttpError(400, 'unsafe_owner_uid', 'Owner UID is invalid.');
  }

  return normalized;
}

function resolvePathInRoot(rootPath: string, relativePath: string, errorMessage: string): string {
  const root = path.resolve(rootPath);
  const target = path.resolve(root, relativePath);

  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new HttpError(400, 'unsafe_file_path', errorMessage);
  }

  return target;
}
