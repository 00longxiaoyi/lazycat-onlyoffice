import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import type { TouchOnlineUrlHistoryRequest } from '../../shared/online-url';
import { listOnlineUrlHistory, touchOnlineUrlHistory } from '../db/online-url-store';
import { HttpError } from '../errors';
import { resolveRequestUser } from '../user';
import { readJsonBody, sendJson } from '../utils/http';

export async function handleOnlineUrlHistory(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  const items = await listOnlineUrlHistory(user.id);
  sendJson(response, 200, { items });
}

export async function handleTouchOnlineUrlHistory(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  const body = await readJsonBody<TouchOnlineUrlHistoryRequest>(request);
  const url = body.url?.trim();

  if (!url) {
    throw new HttpError(400, 'missing_online_url', 'Missing online URL.');
  }

  const title = body.title?.trim() || resolveOnlineUrlTitle(url);
  const item = await touchOnlineUrlHistory(user.id, url, title);
  sendJson(response, 200, { item });
}

function resolveOnlineUrlTitle(input: string): string {
  try {
    const url = new URL(input);
    const pathName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    const queryName = url.searchParams.get('filename') || url.searchParams.get('name') || '';
    return sanitizeOnlineUrlTitle(pathName || queryName || input);
  } catch {
    return sanitizeOnlineUrlTitle(input);
  }
}

function sanitizeOnlineUrlTitle(input: string): string {
  const title = input.trim().replace(/[\\/:*?"<>|\0]/g, '_');
  return title || '在线文档';
}
