import type { LazycatDriveEntry, LazycatDriveScope } from './drive';

export interface FavoriteItemRecord {
  id: string;
  ownerUid: string;
  name: string;
  path: string;
  type: LazycatDriveEntry['type'];
  size: number;
  modifiedAt: string;
  fileType: string;
  supported: boolean;
  source: LazycatDriveScope;
  fileUrl: string;
  createdAt: string;
}

export interface FavoriteItemsResponse {
  items: FavoriteItemRecord[];
}

export interface UpsertFavoriteRequest {
  item: LazycatDriveEntry;
  fileUrl: string;
}
