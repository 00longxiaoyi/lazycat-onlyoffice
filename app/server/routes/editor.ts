import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../config';
import type { EditorSessionRequest } from '../../shared/editor';
import { releaseActiveSession } from '../db/session-store';
import { createEditorSessionWithCookie } from '../services/editor-session';
import { resolveRequestUser } from '../user';
import { readJsonBody, sendJson } from '../utils/http';


export async function handleEditorSession(request: IncomingMessage, response: ServerResponse, config: AppConfig): Promise<void> {
  const body = await readJsonBody<EditorSessionRequest>(request);
  const result = await createEditorSessionWithCookie(body, config, {
    requestCookie: request.headers.cookie,
    user: resolveRequestUser(request, config)
  });
  sendJson(response, 200, result);
}

export async function handleReleaseEditorSession(sessionId: string, _request: IncomingMessage, response: ServerResponse): Promise<void> {
  await releaseActiveSession(sessionId);
  sendJson(response, 200, { ok: true });
}
