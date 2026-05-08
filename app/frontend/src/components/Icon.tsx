import '../assets/iconpark/icons.js';

export type AppIconName =
  | 'back'
  | 'excel'
  | 'favorite'
  | 'folder'
  | 'font'
  | 'home'
  | 'other'
  | 'pdf'
  | 'ppt'
  | 'recent'
  | 'refresh'
  | 'trash'
  | 'upload'
  | 'url'
  | 'word'
  | 'close';

type IconProps = {
  name: AppIconName;
  className?: string;
  title?: string;
};

const ICON_SYMBOLS: Record<AppIconName, string> = {
  back: 'double-left',
  excel: 'file-excel',
  favorite: 'star',
  folder: 'folder-open',
  font: 'font-size-two',
  home: 'home-two',
  other: 'computer',
  pdf: 'file-pdf',
  ppt: 'powerpoint',
  recent: 'time',
  refresh: 'refresh',
  trash: 'delete',
  upload: 'upload-one',
  url: 'computer',
  word: 'file-word',
  close: 'close'
};

export function Icon({ name, className = '', title }: IconProps) {
  const symbolId = ICON_SYMBOLS[name];
  return (
    <svg className={`app-icon ${className}`.trim()} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      <use href={`#${symbolId}`} />
    </svg>
  );
}

export function getFileIconName(fileType: string): AppIconName {
  const ext = fileType.toLowerCase();
  if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}
