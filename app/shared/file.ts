export type OpenSource = 'home-picker' | 'file-handler' | 'recent' | 'manual';

export interface LazycatFileInput {
  fileUrl: string;
  source?: OpenSource;
}

export interface NormalizedLazycatFile {
  originalUrl: string;
  fileOrigin: string;
  relativePath: string;
  ownerUid: string;
  title: string;
  fileType: string;
}
