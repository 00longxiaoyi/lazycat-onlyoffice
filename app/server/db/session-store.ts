import type { EditorSessionRecord } from '../../shared/editor';
import { canUseLocalMiniDBFallback, getCollection } from './minidb';
import { readJsonArray, writeJsonArray } from './file-store';

const SESSIONS_STORE = 'editor_sessions';

function collection() {
  return getCollection<EditorSessionRecord>(SESSIONS_STORE);
}

export async function saveSession(session: EditorSessionRecord): Promise<void> {
  try {
    await collection().upsert(session);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const sessions = await readJsonArray<EditorSessionRecord>(SESSIONS_STORE);
    const index = sessions.findIndex((item) => item.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    await writeJsonArray(SESSIONS_STORE, sessions);
  }
}

export async function getSession(id: string): Promise<EditorSessionRecord | undefined> {
  try {
    return await collection().findOne({ id });
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const sessions = await readJsonArray<EditorSessionRecord>(SESSIONS_STORE);
    return sessions.find((session) => session.id === id);
  }
}
