export type OpenSource = 'home-picker' | 'file-handler' | 'recent' | 'manual' | 'url' | 'clientfs';
export type FileStorageType = 'lazycat-file' | 'local-path' | 'remote-url' | 'clientfs';

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
  storageType: FileStorageType;
}
