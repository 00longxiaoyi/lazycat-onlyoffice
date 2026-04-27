import crypto from 'node:crypto';
import type { OnlineUrlHistoryRecord } from '../../shared/online-url';
import { canUseLocalMiniDBFallback, getCollection } from './minidb';
import { readJsonArray, writeJsonArray } from './file-store';

const ONLINE_URL_STORE = 'online_url_history';

function collection() {
  return getCollection<OnlineUrlHistoryRecord>(ONLINE_URL_STORE);
}

export async function touchOnlineUrlHistory(ownerUid: string, url: string, title: string): Promise<OnlineUrlHistoryRecord> {
  const record = buildOnlineUrlRecord(ownerUid, url, title);

  try {
    await collection().upsert(record);
    return record;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<OnlineUrlHistoryRecord>(ONLINE_URL_STORE);
    const nextItems = [record, ...items.filter((item) => item.id !== record.id)].slice(0, 500);
    await writeJsonArray(ONLINE_URL_STORE, nextItems);
    return record;
  }
}

export async function listOnlineUrlHistory(ownerUid: string, limit = 20): Promise<OnlineUrlHistoryRecord[]> {
  try {
    const items = await collection().find({ ownerUid }, { sort: ['-openedAt'] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const items = await readJsonArray<OnlineUrlHistoryRecord>(ONLINE_URL_STORE);
    return items
      .filter((item) => item.ownerUid === ownerUid)
      .sort((left, right) => right.openedAt.localeCompare(left.openedAt))
      .slice(0, limit);
  }
}

function buildOnlineUrlRecord(ownerUid: string, url: string, title: string): OnlineUrlHistoryRecord {
  return {
    id: createOnlineUrlHistoryId(ownerUid, url),
    ownerUid,
    url,
    title,
    openedAt: new Date().toISOString()
  };
}

function createOnlineUrlHistoryId(ownerUid: string, url: string): string {
  return crypto.createHash('sha256').update(`${ownerUid}\n${url}`).digest('hex').slice(0, 32);
}
