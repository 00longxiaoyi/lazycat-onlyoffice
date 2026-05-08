import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import type { AppConfig } from '../config';
import { HttpError } from '../errors';
import type { LazycatDriveScope } from '../../shared/drive';

export const FILE_SERVICE_ROOT_BY_SCOPE: Record<Extract<LazycatDriveScope, 'external' | 'mount'>, string> = {
  external: '/.media',
  mount: '/.remotefs'
};

const EXTERNAL_REMOTE_FS_ALIAS = 'RemoteFS';

export interface FileServiceTargetPath {
  rootPath: string;
  relativePath: string;
  serviceRelativePath: string;
  absolutePath: string;
}

export function isFileServiceDriveScope(scope: string): scope is Extract<LazycatDriveScope, 'external' | 'mount'> {
  return scope === 'external' || scope === 'mount';
}

export function normalizeFileServiceRelativePath(input: string, rootPath: string): string {
  const raw = input.replace(/\0/g, '').replace(/\\/g, '/');
  const withoutRoot = raw === rootPath
    ? ''
    : raw.startsWith(`${rootPath}/`)
      ? raw.slice(rootPath.length + 1)
      : raw;
  const normalized = normalizeDrivePath(withoutRoot);

  if (normalized === '..' || normalized.startsWith('../')) {
    throw new HttpError(400, 'unsafe_drive_path', 'Drive path escapes the selected Lazycat drive scope.');
  }

  return normalized;
}

export function toFileServiceAbsolutePath(relativePath: string, rootPath: string): string {
  const absolutePath = relativePath ? joinDrivePath(rootPath, relativePath) : rootPath;
  const normalized = path.posix.normalize(absolutePath);

  if (normalized !== rootPath && !normalized.startsWith(`${rootPath}/`)) {
    throw new HttpError(400, 'unsafe_drive_path', 'Drive path escapes the selected Lazycat drive scope.');
  }

  return normalized;
}

export function resolveFileServiceTargetPath(
  scope: Extract<LazycatDriveScope, 'external' | 'mount'>,
  requestedPath: string
): FileServiceTargetPath {
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const relativePath = requestedPath ? normalizeFileServiceRelativePath(requestedPath, rootPath) : '';

  if (scope === 'external' && isExternalRemoteFsPath(relativePath)) {
    const serviceRelativePath = stripExternalRemoteFsAlias(relativePath);
    const remoteFsRootPath = FILE_SERVICE_ROOT_BY_SCOPE.mount;
    return {
      rootPath: remoteFsRootPath,
      relativePath,
      serviceRelativePath,
      absolutePath: toFileServiceAbsolutePath(serviceRelativePath, remoteFsRootPath)
    };
  }

  return {
    rootPath,
    relativePath,
    serviceRelativePath: relativePath,
    absolutePath: toFileServiceAbsolutePath(relativePath, rootPath)
  };
}

export function toExternalRemoteFsClientPath(serviceRelativePath: string): string {
  return serviceRelativePath ? `${EXTERNAL_REMOTE_FS_ALIAS}/${serviceRelativePath}` : EXTERNAL_REMOTE_FS_ALIAS;
}

export function getFileServiceParentPath(input: string): string {
  if (!input) {
    return '';
  }

  const parent = path.posix.dirname(input);
  return parent === '.' ? '' : parent;
}

export function getFileServiceOrigin(request: IncomingMessage, config: AppConfig): string {
  const fallback = new URL(config.appOrigin);
  const host = firstHeader(request.headers['x-forwarded-host']) || request.headers.host || fallback.host;
  const protocol = firstHeader(request.headers['x-forwarded-proto']) || fallback.protocol.replace(/:$/, '') || 'https';
  const boxDomain = getBoxDomain(host);
  return `${protocol}://file.${boxDomain}`;
}

export async function fetchFileServicePath(
  origin: string,
  targetPath: string,
  ownerUid: string,
  options: {
    method?: 'GET' | 'HEAD' | 'PUT';
    headers?: Record<string, string>;
    body?: BodyInit;
  } = {}
): Promise<Response> {
  const apiUrl = `${origin}/api/webdav/file?path=${encodeURIComponent(targetPath)}${ownerUid ? `&owner=${encodeURIComponent(ownerUid)}` : ''}`;
  return fetch(apiUrl, {
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });
}

export function buildDriveFileUrl(scope: Extract<LazycatDriveScope, 'external' | 'mount'>, relativePath: string): string {
  return `drive:${scope}:${encodeURIComponent(relativePath)}`;
}

export function parseDriveFileUrl(fileUrl: string): { scope: Extract<LazycatDriveScope, 'external' | 'mount'>; relativePath: string } | null {
  const match = /^drive:(external|mount):(.*)$/.exec(fileUrl);
  if (!match) {
    return null;
  }

  const scope = match[1] as Extract<LazycatDriveScope, 'external' | 'mount'>;
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const decodedPath = decodeURIComponent(match[2] || '');
  return {
    scope,
    relativePath: normalizeFileServiceRelativePath(decodedPath, rootPath)
  };
}

function normalizeDrivePath(input: string): string {
  return path.posix.normalize(`/${input.replace(/\\/g, '/')}`).replace(/^\/+/, '').replace(/^\.$/, '');
}

function joinDrivePath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

function isExternalRemoteFsPath(relativePath: string): boolean {
  return relativePath === EXTERNAL_REMOTE_FS_ALIAS || relativePath.startsWith(`${EXTERNAL_REMOTE_FS_ALIAS}/`);
}

function stripExternalRemoteFsAlias(relativePath: string): string {
  if (relativePath === EXTERNAL_REMOTE_FS_ALIAS) {
    return '';
  }

  return relativePath.slice(EXTERNAL_REMOTE_FS_ALIAS.length + 1);
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
