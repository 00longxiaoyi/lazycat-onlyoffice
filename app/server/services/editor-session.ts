import fs from 'node:fs/promises';
import path from 'node:path';
import type { EditorSessionRecord, EditorSessionRequest, EditorSessionResponse, EditorUser, OnlyOfficeConfig } from '../../shared/editor';
import { normalizeLazycatFileUrl } from './file-url';
import { getDocumentType } from './document-type';
import { createDocumentKey, createSessionId } from './token';
import { resolveHomeFilePath } from './file-store';
import { saveSession } from '../db/session-store';
import { touchRecentFile } from '../db/recent-store';
import type { AppConfig } from '../config';

interface CreateEditorSessionOptions {
  requestCookie?: string;
  user: EditorUser;
}

export async function createEditorSessionWithCookie(
  request: EditorSessionRequest,
  config: AppConfig,
  options: CreateEditorSessionOptions
): Promise<EditorSessionResponse> {
  const normalized = normalizeLazycatFileUrl(request.fileUrl);
  const documentType = getDocumentType(normalized.fileType);
  const now = new Date().toISOString();
  const id = createSessionId();
  const ownerUid = options.user.id;
  const documentIdentity = await resolveDocumentIdentity(normalized.relativePath, ownerUid, config);
  const documentKey = createDocumentKey(documentIdentity);

  const session: EditorSessionRecord = {
    ...normalized,
    ownerUid,
    id,
    documentType,
    createdAt: now,
    updatedAt: now,
    source: request.source || 'manual',
    documentKey,
    requestCookie: options.requestCookie,
    user: options.user
  };

  await saveSession(session);
  await touchRecentFile(session);

  return {
    session,
    config: buildOnlyOfficeConfig(session, config)
  };
}

async function resolveDocumentIdentity(relativePath: string, ownerUid: string, config: AppConfig): Promise<string> {
  try {
    const target = resolveHomeFilePath(relativePath, config, ownerUid);
    const [stats, realPath] = await Promise.all([
      fs.stat(target),
      fs.realpath(target).catch(() => target)
    ]);

    if (stats.isFile()) {
      const mountedIdentity = await resolveMountedDocumentIdentity(realPath, target);
      if (mountedIdentity) {
        return mountedIdentity;
      }

      const documentPathIdentity = resolveDocumentPathIdentity(realPath, target, config);
      if (documentPathIdentity) {
        return documentPathIdentity;
      }

      return `local-file:${realPath}:${stats.dev}:${stats.ino}`;
    }
  } catch (error) {
    console.warn('[editor-session] fallback document identity', {
      ownerUid,
      relativePath,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return `path:${relativePath}`;
}

function resolveDocumentPathIdentity(realPath: string, targetPath: string, config: AppConfig): string {
  const root = path.resolve(config.homeRoot);
  const candidates = [path.resolve(realPath), path.resolve(targetPath)];

  for (const candidate of candidates) {
    const logicalDocumentPath = toLogicalDocumentPath(candidate);
    if (logicalDocumentPath && !logicalDocumentPath.includes('/.shared-center/')) {
      return `document-path:${logicalDocumentPath}`;
    }

    if (!isPathInside(candidate, root)) {
      continue;
    }

    const relative = path.relative(root, candidate).replace(/\\/g, '/');
    if (relative && !relative.startsWith('..') && !relative.includes('/.shared-center/') && !relative.startsWith('.shared-center/')) {
      return `document-path:/document/${relative}`;
    }
  }

  return '';
}

interface MountInfoEntry {
  root: string;
  mountPoint: string;
  source: string;
}

async function resolveMountedDocumentIdentity(realPath: string, targetPath: string): Promise<string> {
  const entries = await readMountInfo();
  const candidates = [path.resolve(realPath), path.resolve(targetPath)];

  for (const candidate of candidates) {
    const entry = findBestMountInfoEntry(candidate, entries);
    if (!entry) {
      continue;
    }

    const suffix = path.relative(entry.mountPoint, candidate);
    const sourcePath = normalizeMountSourcePath(entry.root, suffix);
    if (sourcePath) {
      const logicalDocumentPath = toLogicalDocumentPath(sourcePath);
      if (logicalDocumentPath) {
        return `document-path:${logicalDocumentPath}`;
      }

      return `mounted-file:${entry.source}:${sourcePath}`;
    }
  }

  return '';
}

async function readMountInfo(): Promise<MountInfoEntry[]> {
  const content = await fs.readFile('/proc/self/mountinfo', 'utf8');
  return content
    .split('\n')
    .map(parseMountInfoLine)
    .filter((entry): entry is MountInfoEntry => Boolean(entry));
}

function parseMountInfoLine(line: string): MountInfoEntry | null {
  if (!line.trim()) {
    return null;
  }

  const separator = line.indexOf(' - ');
  if (separator < 0) {
    return null;
  }

  const left = line.slice(0, separator).split(' ');
  const right = line.slice(separator + 3).split(' ');
  const root = left[3];
  const mountPoint = left[4];
  const source = right[1];

  if (!root || !mountPoint || !source) {
    return null;
  }

  return {
    root: decodeMountInfoPath(root),
    mountPoint: decodeMountInfoPath(mountPoint),
    source: decodeMountInfoPath(source)
  };
}

function findBestMountInfoEntry(candidate: string, entries: MountInfoEntry[]): MountInfoEntry | null {
  let best: MountInfoEntry | null = null;

  for (const entry of entries) {
    if (!isPathInside(candidate, entry.mountPoint)) {
      continue;
    }

    if (!best || entry.mountPoint.length > best.mountPoint.length) {
      best = entry;
    }
  }

  return best;
}

function normalizeMountSourcePath(root: string, suffix: string): string {
  const normalizedSuffix = suffix && suffix !== '.' ? suffix : '';
  const sourcePath = path.posix.normalize(`/${root}/${normalizedSuffix}`.replace(/\\/g, '/'));
  return sourcePath === '/' ? '' : sourcePath;
}

function toLogicalDocumentPath(input: string): string {
  const normalized = path.posix.normalize(input.replace(/\\/g, '/'));
  const marker = '/document/';
  const index = normalized.indexOf(marker);

  if (index < 0) {
    return '';
  }

  return normalized.slice(index);
}

function isPathInside(candidate: string, parent: string): boolean {
  return candidate === parent || candidate.startsWith(`${parent}${path.sep}`);
}

function decodeMountInfoPath(input: string): string {
  return input.replace(/\\([0-7]{3})/g, (_match, value: string) => String.fromCharCode(parseInt(value, 8)));
}

function buildOnlyOfficeConfig(session: EditorSessionRecord, config: AppConfig): OnlyOfficeConfig {
  const documentServiceOrigin = config.documentServerPublicOrigin || config.appOrigin;
  const downloadUrl = `${documentServiceOrigin}/download/${encodeURIComponent(session.id)}`;
  const callbackUrl = `${documentServiceOrigin}/callback/${encodeURIComponent(session.id)}`;

  return {
    width: '100%',
    height: '100%',
    type: 'desktop',
    documentType: session.documentType,
    document: {
      title: session.title,
      url: downloadUrl,
      fileType: session.fileType,
      key: session.documentKey,
      permissions: {
        edit: true,
        download: true,
        print: true,
        review: true,
        comment: true
      }
    },
    editorConfig: {
      mode: 'edit',
      lang: 'zh-CN',
      callbackUrl,
      user: session.user,
      customization: {
        autosave: true,
        forcesave: true,
        compactToolbar: false
      }
    }
  };
}
