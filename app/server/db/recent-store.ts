import crypto from 'node:crypto';
import type { EditorSessionRecord } from '../../shared/editor';
import type { RecentFileRecord } from '../../shared/recent';
import { canUseLocalMiniDBFallback, getCollection } from './minidb';
import { readJsonArray, writeJsonArray } from './file-store';

const RECENT_STORE = 'recent_files';

function collection() {
  return getCollection<RecentFileRecord>(RECENT_STORE);
}

export async function touchRecentFile(session: EditorSessionRecord): Promise<void> {
  try {
    const existing = await findExistingRecentFile(session.ownerUid, session.originalUrl);
    await collection().upsert(buildRecentFile(session, existing));
    if (existing && existing.id !== buildRecentFileId(session.ownerUid, session.originalUrl)) {
      await collection().remove(existing.id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    const existing = items.find((item) => item.ownerUid === session.ownerUid && item.fileUrl === session.originalUrl);
    const next = buildRecentFile(session, existing);
    const nextItems = [next, ...items.filter((item) => item.id !== next.id && !(item.ownerUid === session.ownerUid && item.fileUrl === session.originalUrl))];

    await writeJsonArray(RECENT_STORE, nextItems);
  }
}

export async function listRecentFiles(ownerUid: string, limit = 20): Promise<RecentFileRecord[]> {
  try {
    const items = await collection().find({ ownerUid }, { sort: ['-lastOpenedAt'] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    return items
      .filter((item) => item.ownerUid === ownerUid)
      .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
      .slice(0, limit);
  }
}

export async function deleteRecentFile(id: string, ownerUid: string): Promise<void> {
  try {
    const existing = await collection().findOne({ id });
    if (existing?.ownerUid === ownerUid) {
      await collection().remove(id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    await writeJsonArray(RECENT_STORE, items.filter((item) => item.id !== id || item.ownerUid !== ownerUid));
  }
}

export async function clearRecentFiles(ownerUid: string): Promise<void> {
  try {
    const items = await collection().find({ ownerUid }).fetch();
    await collection().remove(items.map((item) => item.id));
    return;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
  }

  const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
  await writeJsonArray(RECENT_STORE, items.filter((item) => item.ownerUid !== ownerUid));
}

function buildRecentFile(session: EditorSessionRecord, existing?: RecentFileRecord): RecentFileRecord {
  return {
    id: buildRecentFileId(session.ownerUid, session.originalUrl),
    fileUrl: session.originalUrl,
    relativePath: session.relativePath,
    ownerUid: session.ownerUid,
    title: session.title,
    fileType: session.fileType,
    source: session.source,
    lastOpenedAt: new Date().toISOString(),
    openCount: (existing?.openCount || 0) + 1
  };
}

async function findExistingRecentFile(ownerUid: string, fileUrl: string): Promise<RecentFileRecord | undefined> {
  const id = buildRecentFileId(ownerUid, fileUrl);
  const byId = await collection().findOne({ id });
  if (byId) {
    return byId;
  }

  return collection().findOne({ ownerUid, fileUrl });
}

function buildRecentFileId(ownerUid: string, fileUrl: string): string {
  return crypto.createHash('sha256').update(`${ownerUid}\n${fileUrl}`).digest('hex').slice(0, 32);
}
