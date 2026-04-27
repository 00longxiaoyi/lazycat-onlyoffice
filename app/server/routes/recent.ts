import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import { clearRecentFiles, deleteRecentFile, listRecentFiles } from '../db/recent-store';
import { HttpError } from '../errors';
import { resolveRequestUser } from '../user';
import { sendJson } from '../utils/http';

export async function handleRecentFiles(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  const items = await listRecentFiles(user.id);
  sendJson(response, 200, { items });
}

export async function handleClearRecentFiles(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  await clearRecentFiles(user.id);
  sendJson(response, 200, { ok: true });
}

export async function handleDeleteRecentFile(id: string, request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  if (!id) {
    throw new HttpError(400, 'missing_recent_id', 'Missing recent file id.');
  }

  const user = resolveRequestUser(request, config);
  await deleteRecentFile(id, user.id);
  sendJson(response, 200, { ok: true });
}
