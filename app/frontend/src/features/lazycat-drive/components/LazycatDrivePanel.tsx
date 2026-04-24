import { useEffect, useState } from 'react';
import type { LazycatDriveEntry, LazycatDriveScope } from '../../../../../shared/drive';
import { listLazycatDriveFiles } from '../../../lib/api/client';
import type { LazycatDriveSelection } from '../types';

const DRIVE_FILTER_STORAGE_KEY = 'onlyoffice.drive.showSupportedOnly';

type LazycatDrivePanelProps = {
  onFileSelected: (selection: LazycatDriveSelection) => void;
};

export function LazycatDrivePanel({ onFileSelected }: LazycatDrivePanelProps) {
  const [scope, setScope] = useState<LazycatDriveScope>('all');
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [entries, setEntries] = useState<LazycatDriveEntry[]>([]);
  const [showSupportedOnly, setShowSupportedOnly] = useState(() => readStoredShowSupportedOnly());
  const [selectedPath, setSelectedPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    writeStoredShowSupportedOnly(showSupportedOnly);
  }, [showSupportedOnly]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listLazycatDriveFiles(currentPath, scope)
      .then((result) => {
        if (cancelled) return;
        setEntries(result.entries);
        setParentPath(result.parentPath);
        setSelectedPath('');
      })
      .catch((caught) => {
        if (cancelled) return;
        setEntries([]);
        setSelectedPath('');
        setError(caught instanceof Error ? caught.message : '读取懒猫网盘失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPath, scope]);

  const displayedEntries = showSupportedOnly
    ? entries.filter((entry) => entry.type === 'directory' || entry.supported)
    : entries;

  const switchScope = (nextScope: LazycatDriveScope) => {
    setScope(nextScope);
    setCurrentPath('');
    setParentPath('');
    setSelectedPath('');
  };

  const openEntry = (entry: LazycatDriveEntry) => {
    if (entry.type === 'directory') {
      setSelectedPath('');
      setCurrentPath(entry.path);
      return;
    }

    if (!entry.supported) {
      setError('该文件类型暂不支持使用 ONLYOFFICE 打开');
      return;
    }

    onFileSelected({
      fileUrl: entry.path,
      file: entry,
      fileList: displayedEntries,
      detail: [entry]
    });
  };

  return (
    <section className="panel file-panel">
      <div className="panel-title-row drive-title-row">
        <h2>懒猫网盘</h2>
        <div className="drive-title-actions">
          <div className="drive-filter-tabs" aria-label="文件过滤">
            <button className={`drive-filter-tab${!showSupportedOnly ? ' is-active' : ''}`} type="button" onClick={() => setShowSupportedOnly(false)}>显示全部</button>
            <button className={`drive-filter-tab${showSupportedOnly ? ' is-active' : ''}`} type="button" onClick={() => setShowSupportedOnly(true)}>仅可打开</button>
          </div>
          <div className="drive-scope-tabs" aria-label="网盘来源">
            <button className={`drive-scope-tab${scope === 'all' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('all')}>全部文件</button>
            <button className={`drive-scope-tab${scope === 'shared' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('shared')}>共享文件</button>
            <button className={`drive-scope-tab${scope === 'external' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('external')}>外接磁盘</button>
            <button className={`drive-scope-tab${scope === 'mount' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('mount')}>网络挂载</button>
          </div>
        </div>
      </div>

      <div className="drive-toolbar">
        <button className="drive-nav-button" type="button" disabled={!currentPath} onClick={() => setCurrentPath(parentPath)}>
          返回上级
        </button>
        <span className="drive-path">{currentPath || getScopeLabel(scope)}</span>
      </div>

      <div className="drive-list" aria-busy={loading}>
        <div className="drive-list-head">
          <span>文件名</span>
          <span>修改时间</span>
          <span>大小</span>
          <span>类型</span>
        </div>
        {loading ? <div className="drive-empty">正在读取...</div> : null}
        {!loading && displayedEntries.length === 0 ? <div className="drive-empty">{showSupportedOnly ? '暂无可打开文件' : '暂无文件'}</div> : null}
        {!loading ? displayedEntries.map((entry) => (
          <button
            className={`drive-row${entry.path === selectedPath ? ' is-selected' : ''}${entry.type === 'file' && !entry.supported ? ' is-disabled' : ''}`}
            type="button"
            key={entry.path}
            onClick={() => setSelectedPath(entry.path)}
            onDoubleClick={() => openEntry(entry)}
          >
            <span className="drive-name"><DriveIcon entry={entry} /><span className="drive-name-text">{entry.name}</span></span>
            <span>{formatTime(entry.modifiedAt)}</span>
            <span>{entry.type === 'directory' ? '-' : formatSize(entry.size)}</span>
            <span>{entry.type === 'directory' ? '文件夹' : entry.fileType || '文件'}</span>
          </button>
        )) : null}
      </div>

      {error ? <div className="error-text">{error}</div> : null}
    </section>
  );
}

function DriveIcon({ entry }: { entry: LazycatDriveEntry }) {
  if (entry.type === 'directory') {
    return <span className="drive-icon drive-icon-folder" aria-hidden="true" />;
  }

  return <span className={`drive-icon drive-icon-file drive-icon-file-${entry.fileType || 'default'}`} aria-hidden="true">{getFileIconText(entry.fileType)}</span>;
}

function getFileIconText(fileType: string): string {
  if (fileType === 'doc' || fileType === 'docx' || fileType === 'odt' || fileType === 'txt') return 'W';
  if (fileType === 'xls' || fileType === 'xlsx' || fileType === 'ods' || fileType === 'csv') return 'S';
  if (fileType === 'ppt' || fileType === 'pptx' || fileType === 'odp') return 'P';
  return 'F';
}

function getScopeLabel(scope: LazycatDriveScope): string {
  if (scope === 'shared') return '共享文件';
  if (scope === 'external') return '外接磁盘';
  if (scope === 'mount') return '网络挂载';
  return '全部文件';
}

function formatTime(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}


function readStoredShowSupportedOnly(): boolean {
  try {
    const storedValue = window.localStorage.getItem(DRIVE_FILTER_STORAGE_KEY);
    return storedValue === null ? true : storedValue === '1';
  } catch {
    return true;
  }
}

function writeStoredShowSupportedOnly(value: boolean): void {
  try {
    window.localStorage.setItem(DRIVE_FILTER_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}
