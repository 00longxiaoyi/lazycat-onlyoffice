import type { EditorSessionConflictResponse, EditorSessionRequest, EditorSessionResponse } from '../../../../shared/editor';
import type { LazycatDriveListResponse, LazycatDriveScope } from '../../../../shared/drive';
import type { FontListResponse, FontRefreshResponse, FontUploadResponse } from '../../../../shared/fonts';
import type { OnlineUrlHistoryResponse, TouchOnlineUrlHistoryRequest } from '../../../../shared/online-url';
import type { RecentFilesResponse } from '../../../../shared/recent';

export async function createEditorSession(request: EditorSessionRequest): Promise<EditorSessionResponse> {
  const response = await fetch('/api/editor/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const text = await response.text();
    const payload = parseJson<EditorSessionConflictResponse>(text);
    if (response.status === 409 && payload?.error?.code === 'editor_session_conflict') {
      throw new EditorSessionConflictError(payload);
    }

    throw new Error(payload?.error?.message || text);
  }

  return response.json() as Promise<EditorSessionResponse>;
}


export class EditorSessionConflictError extends Error {
  constructor(public readonly payload: EditorSessionConflictResponse) {
    super(payload.error.message);
  }
}

export function releaseEditorSession(sessionId: string): void {
  const url = `/api/editor/session/${encodeURIComponent(sessionId)}/release`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
    return;
  }

  void fetch(url, { method: 'POST', keepalive: true });
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function getRecentFiles(): Promise<RecentFilesResponse> {
  const response = await fetch('/api/recent');

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<RecentFilesResponse>;
}

export async function deleteRecentFile(id: string): Promise<void> {
  const response = await fetch(`/api/recent/${encodeURIComponent(id)}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function clearRecentFiles(): Promise<void> {
  const response = await fetch('/api/recent', { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function listLazycatDriveFiles(path = '', scope: LazycatDriveScope = 'all'): Promise<LazycatDriveListResponse> {
  const query = new URLSearchParams();
  query.set('scope', scope);
  if (path) {
    query.set('path', path);
  }

  const response = await fetch(`/api/drive/list${query.size ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<LazycatDriveListResponse>;
}

export async function getOnlineUrlHistory(): Promise<OnlineUrlHistoryResponse> {
  const response = await fetch('/api/online-url/history');

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<OnlineUrlHistoryResponse>;
}

export async function touchOnlineUrlHistory(request: TouchOnlineUrlHistoryRequest): Promise<void> {
  const response = await fetch('/api/online-url/history', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function listFonts(): Promise<FontListResponse> {
  const response = await fetch('/api/fonts');

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<FontListResponse>;
}


export async function refreshFonts(): Promise<FontRefreshResponse> {
  const response = await fetch('/api/fonts/refresh', { method: 'POST' });

  if (!response.ok) {
    const text = await response.text();
    const payload = parseJson<{ error?: { message?: string } }>(text);
    throw new Error(payload?.error?.message || text);
  }

  return response.json() as Promise<FontRefreshResponse>;
}

export async function uploadFont(file: File, onProgress?: (progress: number) => void): Promise<FontUploadResponse> {
  const formData = new FormData();
  formData.set('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/fonts');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const payload = parseJson<FontUploadResponse & { error?: { message?: string } }>(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(payload?.error?.message || normalizeHttpErrorMessage(xhr.status, xhr.responseText)));
        return;
      }
      if (!payload) {
        reject(new Error('字体上传响应解析失败'));
        return;
      }
      onProgress?.(100);
      resolve(payload);
    };
    xhr.onerror = () => reject(new Error('字体上传网络失败'));
    xhr.onabort = () => reject(new Error('字体上传已取消'));
    xhr.send(formData);
  });
}

function normalizeHttpErrorMessage(status: number, text: string): string {
  if (status === 413 || /413\s+Request Entity Too Large/i.test(text)) {
    return '字体文件过大，当前最多支持上传 80MB 以内的字体文件。';
  }

  const htmlTitle = text.match(/<title>([^<]+)<\/title>/i)?.[1] || text.match(/<h1>([^<]+)<\/h1>/i)?.[1];
  if (htmlTitle) {
    return htmlTitle.trim();
  }

  return text;
}

export async function deleteFont(name: string): Promise<void> {
  const response = await fetch(`/api/fonts/${encodeURIComponent(name)}`, { method: 'DELETE' });

  if (!response.ok) {
    const text = await response.text();
    const payload = parseJson<{ error?: { message?: string } }>(text);
    throw new Error(payload?.error?.message || text);
  }
}
