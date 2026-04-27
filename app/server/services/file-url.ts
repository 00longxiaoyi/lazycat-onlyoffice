import path from 'node:path';
import type { NormalizedLazycatFile } from '../../shared/file';
import { HttpError } from '../errors';

const FILE_PREFIX = '/_lzc/files/home/';

export function normalizeLazycatFileUrl(fileUrl: string): NormalizedLazycatFile {
  if (fileUrl.startsWith('clientfs:')) {
    return normalizeClientfsRelativePath(fileUrl.slice('clientfs:'.length));
  }

  if (!fileUrl || typeof fileUrl !== 'string') {
    throw new HttpError(400, 'missing_file_url', 'Missing Lazycat file URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return normalizeLazycatRelativePath(fileUrl);
  }

  if (isRemoteDocumentUrl(parsed)) {
    return normalizeRemoteDocumentUrl(parsed, fileUrl);
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
    fileType,
    storageType: 'lazycat-file'
  };
}

function normalizeRemoteDocumentUrl(parsed: URL, originalUrl: string): NormalizedLazycatFile {
  const title = resolveRemoteDocumentTitle(parsed);
  const fileType = path.posix.extname(title).replace(/^\./, '').toLowerCase();

  if (!fileType) {
    throw new HttpError(415, 'unsupported_file_type', 'Remote URL does not contain a file extension.');
  }

  return {
    originalUrl,
    fileOrigin: parsed.origin,
    relativePath: title,
    ownerUid: '',
    title,
    fileType,
    storageType: 'remote-url'
  };
}

function normalizeClientfsRelativePath(filePath: string): NormalizedLazycatFile {
  const relativePath = normalizeRelativePath(filePath.replace(/\\/g, '/').replace(/^\/+/, ''));
  const title = path.posix.basename(relativePath) || 'document';
  const fileType = path.posix.extname(title).replace(/^\./, '').toLowerCase();

  if (!fileType) {
    throw new HttpError(415, 'unsupported_file_type', 'Client file path does not contain a file extension.');
  }

  return {
    originalUrl: `clientfs:${relativePath}`,
    fileOrigin: '',
    relativePath,
    ownerUid: '',
    title,
    fileType,
    storageType: 'clientfs'
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
    fileType,
    storageType: 'local-path'
  };
}

function isRemoteDocumentUrl(parsed: URL): boolean {
  return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname.startsWith('file.');
}

function resolveRemoteDocumentTitle(parsed: URL): string {
  const rawName = decodeURIComponent(path.posix.basename(parsed.pathname));
  const nameFromPath = sanitizeTitle(rawName);
  if (path.posix.extname(nameFromPath)) {
    return nameFromPath;
  }

  const nameFromQuery = sanitizeTitle(parsed.searchParams.get('filename') || parsed.searchParams.get('name') || '');
  if (path.posix.extname(nameFromQuery)) {
    return nameFromQuery;
  }

  return nameFromPath || nameFromQuery || 'document';
}

function sanitizeTitle(input: string): string {
  const sanitized = input.replace(/[\\/:*?"<>|\0]/g, '_').trim();
  return sanitized || 'document';
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
