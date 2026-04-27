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

export async function findActiveEditSession(documentIdentity: string, userId: string): Promise<EditorSessionRecord | undefined> {
  try {
    const sessions = await collection().find({
      documentIdentity,
      mode: 'edit',
      state: 'active'
    }).fetch();
    return sessions.find((session) => session.user.id === userId);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }

    const sessions = await readJsonArray<EditorSessionRecord>(SESSIONS_STORE);
    return sessions.find((session) => (
      session.documentIdentity === documentIdentity
      && session.user.id === userId
      && session.mode === 'edit'
      && session.state === 'active'
    ));
  }
}

export async function updateSession(session: EditorSessionRecord): Promise<void> {
  await saveSession(session);
}

export async function releaseActiveSession(id: string): Promise<void> {
  const session = await getSession(id);
  if (!session || session.state !== 'active') {
    return;
  }

  const releasedAt = new Date().toISOString();
  await updateSession({
    ...session,
    state: 'released',
    updatedAt: releasedAt,
    releasedAt
  });
}
