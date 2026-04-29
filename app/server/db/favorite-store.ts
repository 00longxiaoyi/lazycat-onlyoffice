import crypto from 'node:crypto';
import type { LazycatDriveEntry, LazycatDriveScope } from '../../shared/drive';
import type { FavoriteItemRecord } from '../../shared/favorite';
import { canUseLocalMiniDBFallback, getCollection } from './minidb';
import { readJsonArray, writeJsonArray } from './file-store';

const FAVORITE_STORE = 'favorite_items';

function collection() {
  return getCollection<FavoriteItemRecord>(FAVORITE_STORE);
}

export async function listFavoriteItems(ownerUid: string): Promise<FavoriteItemRecord[]> {
  try {
    const items = await collection().find({ ownerUid }, { sort: ['-createdAt'] }).fetch();
    return items;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<FavoriteItemRecord>(FAVORITE_STORE);
    return items
      .filter((item) => item.ownerUid === ownerUid)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}

export async function upsertFavoriteItem(ownerUid: string, entry: LazycatDriveEntry, fileUrl: string): Promise<FavoriteItemRecord> {
  const item = buildFavoriteItem(ownerUid, entry, fileUrl);

  try {
    await collection().upsert(item);
    return item;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<FavoriteItemRecord>(FAVORITE_STORE);
    await writeJsonArray(FAVORITE_STORE, [item, ...items.filter((current) => current.id !== item.id)]);
    return item;
  }
}

export async function deleteFavoriteItem(id: string, ownerUid: string): Promise<void> {
  try {
    const existing = await collection().findOne({ id });
    if (existing?.ownerUid === ownerUid) {
      await collection().remove(id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<FavoriteItemRecord>(FAVORITE_STORE);
    await writeJsonArray(FAVORITE_STORE, items.filter((item) => item.id !== id || item.ownerUid !== ownerUid));
  }
}

function buildFavoriteItem(ownerUid: string, entry: LazycatDriveEntry, fileUrl: string): FavoriteItemRecord {
  const source = entry.source || 'all';

  return {
    id: buildFavoriteItemId(ownerUid, source, entry.path, entry.type),
    ownerUid,
    name: entry.name,
    path: entry.path,
    type: entry.type,
    size: entry.size,
    modifiedAt: entry.modifiedAt,
    fileType: entry.fileType,
    supported: entry.supported,
    source,
    fileUrl,
    createdAt: new Date().toISOString()
  };
}

function buildFavoriteItemId(ownerUid: string, source: LazycatDriveScope, itemPath: string, type: string): string {
  return crypto.createHash('sha256').update(`${ownerUid}\n${source}\n${type}\n${itemPath}`).digest('hex').slice(0, 32);
}
