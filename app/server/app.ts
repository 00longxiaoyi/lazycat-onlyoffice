import http from 'node:http';
import type { AppConfig } from './config';
import { sendError, sendJson } from './utils/http';
import { handleEditorSession } from './routes/editor';
import { handleClearRecentFiles, handleDeleteRecentFile, handleRecentFiles } from './routes/recent';
import { handleCallback, handleDownload } from './routes/files';
import { handleDriveList } from './routes/drive';
import { serveFrontendFallback, serveStatic } from './static';

export function createServer(config: AppConfig): http.Server {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', config.appOrigin);

      if (request.method === 'GET' && url.pathname === '/health') {
        return sendJson(response, 200, { ok: true });
      }

      if (request.method === 'POST' && url.pathname === '/api/editor/session') {
        return await handleEditorSession(request, response, config);
      }

      if (request.method === 'GET' && url.pathname === '/api/recent') {
        return await handleRecentFiles(response);
      }

      if (request.method === 'DELETE' && url.pathname === '/api/recent') {
        return await handleClearRecentFiles(response);
      }

      if (request.method === 'DELETE' && url.pathname.startsWith('/api/recent/')) {
        return await handleDeleteRecentFile(decodeURIComponent(url.pathname.slice('/api/recent/'.length)), response);
      }

      if (request.method === 'GET' && url.pathname === '/api/drive/list') {
        return await handleDriveList(request, response, config, url.searchParams.get('path') || '', url.searchParams.get('scope') || 'all');
      }

      if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname.startsWith('/download/')) {
        return await handleDownload(
          decodeURIComponent(url.pathname.slice('/download/'.length)),
          request,
          response,
          config,
          request.method === 'HEAD'
        );
      }

      if (request.method === 'POST' && url.pathname.startsWith('/callback/')) {
        return await handleCallback(decodeURIComponent(url.pathname.slice('/callback/'.length)), request, response, config);
      }

      if (request.method === 'GET' && serveStatic(url.pathname, response)) {
        return;
      }

      if (request.method === 'GET') {
        return serveFrontendFallback(response);
      }

      sendJson(response, 405, { error: { code: 'method_not_allowed', message: 'Method not allowed.' } });
    } catch (error) {
      sendError(response, error);
    }
  });
}
