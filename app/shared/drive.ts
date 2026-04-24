export type LazycatDriveEntryType = 'file' | 'directory';
export type LazycatDriveScope = 'all' | 'shared' | 'external' | 'mount';

export interface LazycatDriveEntry {
  name: string;
  path: string;
  type: LazycatDriveEntryType;
  size: number;
  modifiedAt: string;
  fileType: string;
  supported: boolean;
  source?: LazycatDriveScope;
  mime?: string;
  owner?: string;
  mountPointPath?: string;
}

export interface LazycatDriveListResponse {
  scope: LazycatDriveScope;
  path: string;
  parentPath: string;
  entries: LazycatDriveEntry[];
}
