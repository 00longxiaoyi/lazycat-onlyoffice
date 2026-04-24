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
    const existing = await collection().findOne({ id: session.id });
    await collection().upsert(buildRecentFile(session, existing));
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    const index = items.findIndex((item) => item.id === session.id);
    const next = buildRecentFile(session, index >= 0 ? items[index] : undefined);

    if (index >= 0) {
      items[index] = next;
    } else {
      items.push(next);
    }

    await writeJsonArray(RECENT_STORE, items);
  }
}

export async function listRecentFiles(limit = 20): Promise<RecentFileRecord[]> {
  try {
    const items = await collection().find({}, { sort: ['-lastOpenedAt'] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    return items
      .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
      .slice(0, limit);
  }
}

export async function deleteRecentFile(id: string): Promise<void> {
  try {
    await collection().remove(id);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<RecentFileRecord>(RECENT_STORE);
    await writeJsonArray(RECENT_STORE, items.filter((item) => item.id !== id));
  }
}

export async function clearRecentFiles(): Promise<void> {
  try {
    const items = await collection().find({}).fetch();
    await collection().remove(items.map((item) => item.id));
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
  }

  await writeJsonArray(RECENT_STORE, []);
}

function buildRecentFile(session: EditorSessionRecord, existing?: RecentFileRecord): RecentFileRecord {
  return {
    id: session.id,
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
