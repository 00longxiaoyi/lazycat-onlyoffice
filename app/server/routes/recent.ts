import type { ServerResponse } from 'node:http';
import { clearRecentFiles, deleteRecentFile, listRecentFiles } from '../db/recent-store';
import { HttpError } from '../errors';
import { sendJson } from '../utils/http';

export async function handleRecentFiles(response: ServerResponse): Promise<void> {
  const items = await listRecentFiles();
  sendJson(response, 200, { items });
}

export async function handleClearRecentFiles(response: ServerResponse): Promise<void> {
  await clearRecentFiles();
  sendJson(response, 200, { ok: true });
}

export async function handleDeleteRecentFile(id: string, response: ServerResponse): Promise<void> {
  if (!id) {
    throw new HttpError(400, 'missing_recent_id', 'Missing recent file id.');
  }

  await deleteRecentFile(id);
  sendJson(response, 200, { ok: true });
}
