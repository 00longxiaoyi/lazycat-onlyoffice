import fs from 'node:fs';
import path from 'node:path';
import type { ServerResponse } from 'node:http';

const FRONTEND_DIST = path.resolve(process.env.FRONTEND_DIST || 'dist/frontend');

export function serveStatic(urlPath: string, response: ServerResponse): boolean {
  const normalizedPath = urlPath === '/' ? '/index.html' : urlPath;
  const target = path.resolve(FRONTEND_DIST, `.${normalizedPath}`);

  if (!target.startsWith(FRONTEND_DIST)) return false;
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return false;

  response.writeHead(200, { 'content-type': contentType(target) });
  fs.createReadStream(target).pipe(response);
  return true;
}

export function serveFrontendFallback(response: ServerResponse): void {
  if (!serveStatic('/index.html', response)) {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
  }
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
