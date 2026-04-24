import type { LazycatDriveEntry } from '../../../../shared/drive';

export type LazycatDriveSelection = {
  fileUrl: string;
  file: LazycatDriveEntry;
  fileList: LazycatDriveEntry[];
  detail: LazycatDriveEntry[];
};
