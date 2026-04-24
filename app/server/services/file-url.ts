import path from 'node:path';
import type { NormalizedLazycatFile } from '../../shared/file';
import { HttpError } from '../errors';

const FILE_PREFIX = '/_lzc/files/home/';

export function normalizeLazycatFileUrl(fileUrl: string): NormalizedLazycatFile {
  if (!fileUrl || typeof fileUrl !== 'string') {
    throw new HttpError(400, 'missing_file_url', 'Missing Lazycat file URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return normalizeLazycatRelativePath(fileUrl);
  }

  if (parsed.protocol !== 'https:') {
    throw new HttpError(400, 'invalid_file_url_protocol', 'File URL must use https.');
  }

  if (!parsed.hostname.startsWith('file.')) {
    throw new HttpError(400, 'invalid_file_host', 'File URL host must start with file.');
  }

  if (!parsed.pathname.startsWith(FILE_PREFIX)) {
    throw new HttpError(400, 'invalid_file_prefix', `File URL path must start with ${FILE_PREFIX}.`);
  }

  const rawRelativePath = decodeURIComponent(parsed.pathname.slice(FILE_PREFIX.length));
  const relativePath = normalizeRelativePath(rawRelativePath);
  const title = path.posix.basename(relativePath) || 'document';
  const fileType = path.posix.extname(title).replace(/^\./, '').toLowerCase();

  if (!fileType) {
    throw new HttpError(415, 'unsupported_file_type', 'File URL does not contain a file extension.');
  }

  return {
    originalUrl: fileUrl,
    fileOrigin: parsed.origin,
    relativePath,
    ownerUid: '',
    title,
    fileType
  };
}

function normalizeLazycatRelativePath(filePath: string): NormalizedLazycatFile {
  const relativePath = normalizeRelativePath(filePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^home\//, ''));
  const title = path.posix.basename(relativePath) || 'document';
  const fileType = path.posix.extname(title).replace(/^\./, '').toLowerCase();

  if (!fileType) {
    throw new HttpError(415, 'unsupported_file_type', 'File path does not contain a file extension.');
  }

  return {
    originalUrl: filePath,
    fileOrigin: '',
    relativePath,
    ownerUid: '',
    title,
    fileType
  };
}

function normalizeRelativePath(input: string): string {
  const withoutNull = input.replace(/\0/g, '');
  const normalized = path.posix.normalize(`/${withoutNull}`).replace(/^\/+/, '');

  if (!normalized || normalized === '.') {
    throw new HttpError(400, 'empty_relative_path', 'File URL does not contain a file path.');
  }

  if (normalized.startsWith('../') || normalized.includes('/../')) {
    throw new HttpError(400, 'unsafe_relative_path', 'File path escapes allowed root.');
  }

  return normalized;
}
