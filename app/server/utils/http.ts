import { isHttpError } from '../errors';

export function sendJson(response: import('node:http').ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  response.end(body);
}

export function sendError(response: import('node:http').ServerResponse, error: unknown): void {
  if (isHttpError(error)) {
    sendJson(response, error.status, {
      error: { code: error.code, message: error.message },
      ...(error.details || {})
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  sendJson(response, 500, { error: { code: 'internal_error', message } });
}

export async function readJsonBody<T>(request: import('node:http').IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return (raw ? JSON.parse(raw) : {}) as T;
}
