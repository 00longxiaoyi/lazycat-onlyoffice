import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import { deleteFavoriteItem, listFavoriteItems, upsertFavoriteItem } from '../db/favorite-store';
import { HttpError } from '../errors';
import { resolveRequestUser } from '../user';
import { readJsonBody, sendJson } from '../utils/http';
import type { UpsertFavoriteRequest } from '../../shared/favorite';

export async function handleFavoriteItems(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  const items = await listFavoriteItems(user.id);
  sendJson(response, 200, { items });
}

export async function handleUpsertFavoriteItem(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const user = resolveRequestUser(request, config);
  const body = await readJsonBody<UpsertFavoriteRequest>(request);

  if (!body.item?.path || !body.item?.name || !body.item?.type) {
    throw new HttpError(400, 'missing_favorite_item', 'Missing favorite item.');
  }

  const item = await upsertFavoriteItem(user.id, body.item, body.fileUrl || body.item.path);
  sendJson(response, 200, { item });
}

export async function handleDeleteFavoriteItem(id: string, request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  if (!id) {
    throw new HttpError(400, 'missing_favorite_id', 'Missing favorite id.');
  }

  const user = resolveRequestUser(request, config);
  await deleteFavoriteItem(id, user.id);
  sendJson(response, 200, { ok: true });
}
