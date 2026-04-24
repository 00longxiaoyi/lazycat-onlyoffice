import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { ServerResponse } from 'node:http';
import { HttpError } from '../errors';
import type { AppConfig } from '../config';

export function resolveHomeFilePath(relativePath: string, config: AppConfig, ownerUid?: string): string {
  const root = path.resolve(config.homeRoot);
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const target = normalizedOwnerUid
    ? path.resolve(root, normalizedOwnerUid, relativePath)
    : path.resolve(root, relativePath);

  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new HttpError(400, 'unsafe_file_path', 'Resolved file path escapes home root.');
  }

  return target;
}

export function createReadStreamForRelativePath(
  relativePath: string,
  config: AppConfig,
  range?: { start: number; end: number },
  ownerUid?: string
): fs.ReadStream {
  const target = resolveHomeFilePath(relativePath, config, ownerUid);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new HttpError(404, 'file_not_found', 'File does not exist.');
  }
  return fs.createReadStream(target, range);
}

export async function saveFromUrl(url: string, relativePath: string, config: AppConfig, ownerUid?: string): Promise<void> {
  const target = resolveHomeFilePath(relativePath, config, ownerUid);
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new HttpError(502, 'callback_download_failed', `Failed to download saved document: ${response.status}`);
  }

  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await pipeline(response.body, fs.createWriteStream(tmp));
  await fs.promises.rename(tmp, target);
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
