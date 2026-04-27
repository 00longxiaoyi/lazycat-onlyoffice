import type { LazycatFileInput, NormalizedLazycatFile, OpenSource } from './file';

export type DocumentType = 'word' | 'cell' | 'slide';

export interface EditorUser {
  id: string;
  name: string;
}

export interface EditorSessionRequest extends LazycatFileInput {
  mode?: 'edit' | 'view';
  takeover?: boolean;
}

export type EditorSessionMode = 'edit' | 'view';

export type EditorSessionState = 'active' | 'released' | 'superseded';

export interface EditorSessionRecord extends NormalizedLazycatFile {
  id: string;
  documentType: DocumentType;
  createdAt: string;
  updatedAt: string;
  source: OpenSource;
  mode: EditorSessionMode;
  state: EditorSessionState;
  documentIdentity: string;
  documentKey: string;
  requestCookie?: string;
  user: EditorUser;
  supersededBy?: string;
  supersededAt?: string;
  releasedAt?: string;
}

export interface OnlyOfficeConfig {
  width: string;
  height: string;
  type: 'desktop';
  documentType: DocumentType;
  document: {
    title: string;
    url: string;
    fileType: string;
    key: string;
    permissions: {
      edit: boolean;
      download: boolean;
      print: boolean;
      review: boolean;
      comment: boolean;
    };
  };
  editorConfig: {
    mode: 'edit' | 'view';
    lang: string;
    callbackUrl: string;
    user: EditorUser;
    customization: {
      autosave: boolean;
      forcesave: boolean;
      compactToolbar: boolean;
    };
  };
}

export interface EditorSessionResponse {
  session: EditorSessionRecord;
  config: OnlyOfficeConfig;
}

export interface EditorSessionConflictResponse {
  error: {
    code: 'editor_session_conflict';
    message: string;
  };
  conflict: {
    sessionId: string;
    title: string;
    updatedAt: string;
  };
}
