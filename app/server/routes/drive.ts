import fs from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LazycatDriveEntry, LazycatDriveListResponse, LazycatDriveScope } from '../../shared/drive';
import type { AppConfig } from '../config';
import { HttpError } from '../errors';
import { resolveHomeFilePath } from '../services/file-store';
import { sendJson } from '../utils/http';

const SUPPORTED_EXTENSIONS = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'odt', 'ods', 'odp']);
const SHARED_CENTER_PATH = '.shared-center';
const FILE_SERVICE_ROOT_BY_SCOPE: Record<Extract<LazycatDriveScope, 'external' | 'mount'>, string> = {
  external: '/.media',
  mount: '/.remotefs'
};

interface FileServiceDirectoryResponse {
  data?: FileServiceEntry[];
  total?: number;
}

interface FileServiceEntry {
  basename?: string;
  filename?: string;
  type?: string;
  size?: number;
  lastmod?: number | string;
  mime?: string;
  owner?: string;
  mountPointPath?: string;
}

export async function handleDriveList(
  request: IncomingMessage,
  response: ServerResponse,
  config: AppConfig,
  requestedPath = '',
  rawScope = 'all'
): Promise<void> {
  const scope = normalizeScope(rawScope);

  if (scope === 'all' || scope === 'shared') {
    return handleLocalDriveList(response, config, requestedPath, scope, resolveDriveOwnerUid(request, config));
  }

  return handleFileServiceDriveList(request, response, config, requestedPath, scope);
}

async function handleLocalDriveList(
  response: ServerResponse,
  config: AppConfig,
  requestedPath: string,
  scope: LazycatDriveScope,
  ownerUid: string
): Promise<void> {
  const relativePath = resolveLocalDrivePath(requestedPath, scope);
  const targetPath = resolveHomeFilePath(relativePath, config, ownerUid);
  const dirents = await fs.readdir(targetPath, { withFileTypes: true });
  const entries = await Promise.all(dirents.map((dirent) => toLocalDriveEntry(dirent, relativePath, targetPath, scope)));
  const visibleEntries = entries
    .filter((entry): entry is LazycatDriveEntry => Boolean(entry))
    .filter((entry) => scope === 'shared' || !entry.name.startsWith('.'))
    .map((entry) => scope === 'shared' ? { ...entry, path: toClientLocalDrivePath(entry.path, scope) } : entry)
    .sort(compareEntries);

  sendJson(response, 200, {
    scope,
    path: toClientLocalDrivePath(relativePath, scope),
    parentPath: toClientLocalDrivePath(getLocalParentPath(relativePath), scope),
    entries: visibleEntries
  } satisfies LazycatDriveListResponse);
}

function resolveDriveOwnerUid(request: IncomingMessage, config: AppConfig): string {
  const headerUserId = firstHeader(request.headers['x-hc-user-id'])?.trim() || '';
  return headerUserId || config.deployUid || '';
}

function resolveLocalDrivePath(requestedPath: string, scope: LazycatDriveScope): string {
  const normalizedPath = requestedPath ? normalizeDrivePath(requestedPath) : '';

  if (scope !== 'shared') {
    return normalizedPath;
  }

  if (!normalizedPath) {
    return SHARED_CENTER_PATH;
  }

  if (normalizedPath === SHARED_CENTER_PATH || normalizedPath.startsWith(`${SHARED_CENTER_PATH}/`)) {
    return normalizedPath;
  }

  return joinDrivePath(SHARED_CENTER_PATH, normalizedPath);
}

function toClientLocalDrivePath(relativePath: string, scope: LazycatDriveScope): string {
  if (scope !== 'shared') {
    return relativePath;
  }

  if (!relativePath || relativePath === SHARED_CENTER_PATH) {
    return '';
  }

  if (relativePath.startsWith(`${SHARED_CENTER_PATH}/`)) {
    return relativePath.slice(SHARED_CENTER_PATH.length + 1);
  }

  return relativePath;
}

async function handleFileServiceDriveList(
  request: IncomingMessage,
  response: ServerResponse,
  config: AppConfig,
  requestedPath: string,
  scope: Extract<LazycatDriveScope, 'external' | 'mount'>
): Promise<void> {
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const fileServicePath = requestedPath ? normalizeFileServicePath(requestedPath, rootPath) : rootPath;
  const fileServiceOrigin = getFileServiceOrigin(request, config);
  const payload = await fetchFileServiceDirectory(fileServiceOrigin, fileServicePath, request.headers.cookie);
  const entries = (payload.data || [])
    .map((entry) => toFileServiceDriveEntry(entry, scope))
    .filter((entry): entry is LazycatDriveEntry => Boolean(entry))
    .sort(compareEntries);

  console.log('[drive] file service list', {
    scope,
    path: fileServicePath,
    origin: fileServiceOrigin,
    count: entries.length,
    total: payload.total ?? entries.length
  });

  sendJson(response, 200, {
    scope,
    path: fileServicePath,
    parentPath: getFileServiceParentPath(fileServicePath, rootPath),
    entries
  } satisfies LazycatDriveListResponse);
}

async function fetchFileServiceDirectory(origin: string, targetPath: string, cookie?: string): Promise<FileServiceDirectoryResponse> {
  const apiUrl = `${origin}/api/webdav/getDirectoryContents`;
  const result = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify({
      path: targetPath,
      page: 1,
      pageSize: 100,
      sort: [],
      type: '',
      mimeType: '',
      includeHidden: false,
      owner: '',
      extname: '',
      ignoreName: ''
    })
  });

  const raw = await result.text();
  if (!result.ok) {
    throw new HttpError(result.status, 'drive_file_service_failed', `Lazycat file service returned ${result.status}: ${raw.slice(0, 200)}`);
  }

  try {
    return JSON.parse(raw) as FileServiceDirectoryResponse;
  } catch {
    throw new HttpError(502, 'drive_file_service_invalid_json', 'Lazycat file service did not return valid JSON.');
  }
}

function normalizeScope(input: string): LazycatDriveScope {
  if (input === 'shared' || input === 'external' || input === 'mount') {
    return input;
  }

  return 'all';
}

async function toLocalDriveEntry(
  dirent: import('node:fs').Dirent,
  currentPath: string,
  targetPath: string,
  scope: LazycatDriveScope
): Promise<LazycatDriveEntry | null> {
  if (!dirent.isDirectory() && !dirent.isFile()) {
    return null;
  }

  const entryPath = joinDrivePath(currentPath, dirent.name);
  const stats = await fs.stat(path.join(targetPath, dirent.name));
  const fileType = dirent.isFile() ? path.posix.extname(dirent.name).replace(/^\./, '').toLowerCase() : '';

  return {
    name: dirent.name,
    path: entryPath,
    type: dirent.isDirectory() ? 'directory' : 'file',
    size: dirent.isFile() ? stats.size : 0,
    modifiedAt: stats.mtime.toISOString(),
    fileType,
    supported: dirent.isFile() && SUPPORTED_EXTENSIONS.has(fileType),
    source: scope
  };
}

function toFileServiceDriveEntry(entry: FileServiceEntry, scope: Extract<LazycatDriveScope, 'external' | 'mount'>): LazycatDriveEntry | null {
  const type = entry.type === 'directory' ? 'directory' : entry.type === 'file' ? 'file' : null;
  const entryPath = normalizeReturnedFileServicePath(entry.filename || '', FILE_SERVICE_ROOT_BY_SCOPE[scope]);
  const name = entry.basename || path.posix.basename(entryPath);

  if (!type || !entryPath || !name) {
    return null;
  }

  const fileType = type === 'file' ? path.posix.extname(name).replace(/^\./, '').toLowerCase() : '';

  return {
    name,
    path: entryPath,
    type,
    size: type === 'file' ? Number(entry.size || 0) : 0,
    modifiedAt: normalizeLastModified(entry.lastmod),
    fileType,
    supported: type === 'file' && SUPPORTED_EXTENSIONS.has(fileType),
    source: scope,
    mime: entry.mime || undefined,
    owner: entry.owner || undefined,
    mountPointPath: entry.mountPointPath || undefined
  };
}

function normalizeDrivePath(input: string): string {
  return path.posix.normalize(`/${input.replace(/\\/g, '/')}`).replace(/^\/+/, '').replace(/^\.$/, '');
}

function normalizeFileServicePath(input: string, rootPath: string): string {
  const raw = input.replace(/\0/g, '').replace(/\\/g, '/');
  const absolutePath = raw.startsWith('/') ? raw : joinDrivePath(rootPath, raw);
  const normalized = path.posix.normalize(absolutePath);

  if (normalized !== rootPath && !normalized.startsWith(`${rootPath}/`)) {
    throw new HttpError(400, 'unsafe_drive_path', 'Drive path escapes the selected Lazycat drive scope.');
  }

  return normalized;
}

function normalizeReturnedFileServicePath(input: string, rootPath: string): string {
  if (!input) {
    return '';
  }

  return normalizeFileServicePath(input, rootPath);
}

function joinDrivePath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

function getLocalParentPath(input: string): string {
  if (!input) {
    return '';
  }

  const parent = path.posix.dirname(input);
  return parent === '.' ? '' : parent;
}

function getFileServiceParentPath(input: string, rootPath: string): string {
  if (!input || input === rootPath) {
    return '';
  }

  const parent = path.posix.dirname(input);
  return parent === rootPath ? '' : parent;
}

function normalizeLastModified(value: number | string | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string' && value) {
    const numeric = Number(value);
    const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  return '';
}

function getFileServiceOrigin(request: IncomingMessage, config: AppConfig): string {
  const fallback = new URL(config.appOrigin);
  const host = firstHeader(request.headers['x-forwarded-host']) || request.headers.host || fallback.host;
  const protocol = firstHeader(request.headers['x-forwarded-proto']) || fallback.protocol.replace(/:$/, '') || 'https';
  const boxDomain = getBoxDomain(host);
  return `${protocol}://file.${boxDomain}`;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getBoxDomain(host: string): string {
  const hostname = host.split(':')[0] || host;
  const parts = hostname.split('.').filter(Boolean);

  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(1).join('.');
}

function compareEntries(a: LazycatDriveEntry, b: LazycatDriveEntry): number {
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1;
  }

  return a.name.localeCompare(b.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
}
