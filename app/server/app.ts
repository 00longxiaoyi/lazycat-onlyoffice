import http from 'node:http';
import type { AppConfig } from './config';
import { sendError, sendJson } from './utils/http';
import { handleEditorSession, handleReleaseEditorSession } from './routes/editor';
import { handleClearRecentFiles, handleDeleteRecentFile, handleRecentFiles } from './routes/recent';
import { handleCallback, handleDownload } from './routes/files';
import { handleFontDelete, handleFontList, handleFontRefresh, handleFontUpload } from './routes/fonts';
import { handleDriveList } from './routes/drive';
import { handleOnlineUrlHistory, handleTouchOnlineUrlHistory } from './routes/online-url';
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


      if (request.method === 'POST' && url.pathname.startsWith('/api/editor/session/') && url.pathname.endsWith('/release')) {
        const sessionId = decodeURIComponent(url.pathname.slice('/api/editor/session/'.length, -'/release'.length));
        return await handleReleaseEditorSession(sessionId, request, response);
      }

      if (request.method === 'GET' && url.pathname === '/api/recent') {
        return await handleRecentFiles(request, response, config);
      }

      if (request.method === 'DELETE' && url.pathname === '/api/recent') {
        return await handleClearRecentFiles(request, response, config);
      }

      if (request.method === 'DELETE' && url.pathname.startsWith('/api/recent/')) {
        return await handleDeleteRecentFile(decodeURIComponent(url.pathname.slice('/api/recent/'.length)), request, response, config);
      }

      if (request.method === 'GET' && url.pathname === '/api/online-url/history') {
        return await handleOnlineUrlHistory(request, response, config);
      }

      if (request.method === 'POST' && url.pathname === '/api/online-url/history') {
        return await handleTouchOnlineUrlHistory(request, response, config);
      }

      if (request.method === 'GET' && url.pathname === '/api/drive/list') {
        return await handleDriveList(request, response, config, url.searchParams.get('path') || '', url.searchParams.get('scope') || 'all');
      }

      if (request.method === 'GET' && url.pathname === '/api/fonts') {
        return await handleFontList(request, response, config);
      }

      if (request.method === 'POST' && url.pathname === '/api/fonts') {
        return await handleFontUpload(request, response, config);
      }

      if (request.method === 'POST' && url.pathname === '/api/fonts/refresh') {
        return await handleFontRefresh(request, response, config);
      }

      if (request.method === 'DELETE' && url.pathname.startsWith('/api/fonts/')) {
        return await handleFontDelete(decodeURIComponent(url.pathname.slice('/api/fonts/'.length)), request, response, config);
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
