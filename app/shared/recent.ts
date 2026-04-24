import type { OpenSource } from './file';

export interface RecentFileRecord {
  id: string;
  fileUrl: string;
  relativePath: string;
  ownerUid: string;
  title: string;
  fileType: string;
  source: OpenSource;
  lastOpenedAt: string;
  openCount: number;
}

export interface RecentFilesResponse {
  items: RecentFileRecord[];
}
