import type { EditorSessionRequest, EditorSessionResponse } from '../../../../shared/editor';
import type { LazycatDriveListResponse, LazycatDriveScope } from '../../../../shared/drive';
import type { RecentFilesResponse } from '../../../../shared/recent';

export async function createEditorSession(request: EditorSessionRequest): Promise<EditorSessionResponse> {
  const response = await fetch('/api/editor/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<EditorSessionResponse>;
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
