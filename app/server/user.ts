import type { IncomingMessage } from 'node:http';
import type { AppConfig } from './config';
import type { EditorUser } from '../shared/editor';

export function resolveRequestUser(request: IncomingMessage, config: AppConfig): EditorUser {
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
