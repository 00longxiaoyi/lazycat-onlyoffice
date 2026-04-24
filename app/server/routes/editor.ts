import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import type { EditorSessionRequest, EditorUser } from '../../shared/editor';
import { createEditorSessionWithCookie } from '../services/editor-session';
import { readJsonBody, sendJson } from '../utils/http';

export async function handleEditorSession(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const body = await readJsonBody<EditorSessionRequest>(request);
  const result = await createEditorSessionWithCookie(body, config, {
    requestCookie: request.headers.cookie,
    user: resolveEditorUser(request, config)
  });
  sendJson(response, 200, result);
}

function resolveEditorUser(request: IncomingMessage, config: AppConfig): EditorUser {
  const headerUserId = readHeader(request, 'x-hc-user-id');
  const userId = headerUserId || config.deployUid || 'anonymous';
  const displayName = headerUserId || config.deployUid || 'anonymous';

  return {
    id: userId,
    name: displayName
  };
}

function readHeader(request: IncomingMessage, name: string): string {
  const value = request.headers[name];
  if (Array.isArray(value)) {
    return value[0]?.trim() || '';
  }

  return value?.trim() || '';
}
