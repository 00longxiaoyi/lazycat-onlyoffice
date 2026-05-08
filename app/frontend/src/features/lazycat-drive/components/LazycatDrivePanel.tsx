import { useCallback, useEffect, useRef, useState } from 'react';
import type { LazycatDriveEntry, LazycatDriveScope } from '../../../../../shared/drive';
import { Icon, getFileIconName } from '../../../components/Icon';
import { listLazycatDriveFiles } from '../../../lib/api/client';
import type { LazycatDriveSelection } from '../types';

const DRIVE_FILTER_STORAGE_KEY = 'onlyoffice.drive.showSupportedOnly';

type LazycatDriveJumpTarget = {
  scope: LazycatDriveScope;
  path: string;
  nonce: number;
};

type LazycatDrivePanelProps = {
  onFileSelected: (selection: LazycatDriveSelection) => void;
  favoriteKeys?: Set<string>;
  favoriteIdByKey?: Map<string, string>;
  jumpTarget?: LazycatDriveJumpTarget | null;
  onAddFavorite?: (entry: LazycatDriveEntry, fileUrl: string) => void | Promise<void>;
  onRemoveFavorite?: (id: string) => void | Promise<void>;
};

export function LazycatDrivePanel({ onFileSelected, favoriteKeys, favoriteIdByKey, jumpTarget, onAddFavorite, onRemoveFavorite }: LazycatDrivePanelProps) {
  const [scope, setScope] = useState<LazycatDriveScope>('all');
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [entries, setEntries] = useState<LazycatDriveEntry[]>([]);
  const [showSupportedOnly, setShowSupportedOnly] = useState(() => readStoredShowSupportedOnly());
  const [selectedPath, setSelectedPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRequestId = useRef(0);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    writeStoredShowSupportedOnly(showSupportedOnly);
  }, [showSupportedOnly]);

  useEffect(() => {
    if (!jumpTarget) {
      return;
    }

    setScope(jumpTarget.scope);
    setCurrentPath(jumpTarget.path);
    setParentPath('');
    setSelectedPath('');
  }, [jumpTarget]);

  const loadEntries = useCallback((options: { silent?: boolean; resetSelection?: boolean } = {}) => {
    const requestId = listRequestId.current + 1;
    const shouldRunSilently = Boolean(options.silent && !loadingRef.current);
    listRequestId.current = requestId;

    if (!shouldRunSilently) {
      setLoading(true);
    }
    setError('');

    void listLazycatDriveFiles(currentPath, scope)
      .then((result) => {
        if (listRequestId.current !== requestId) return;
        setEntries(result.entries);
        setParentPath(result.parentPath);
        if (options.resetSelection) {
          setSelectedPath('');
        }
      })
      .catch((caught) => {
        if (listRequestId.current !== requestId) return;
        if (!shouldRunSilently) {
          setEntries([]);
          setSelectedPath('');
        }
        setError(normalizeDriveError(caught));
      })
      .finally(() => {
        if (listRequestId.current === requestId && !shouldRunSilently) {
          setLoading(false);
        }
      });
  }, [currentPath, scope]);

  useEffect(() => {
    loadEntries({ resetSelection: true });
  }, [loadEntries]);

  useEffect(() => {
    const refreshVisibleList = () => {
      if (document.visibilityState === 'visible') {
        loadEntries({ silent: true });
      }
    };

    window.addEventListener('focus', refreshVisibleList);
    document.addEventListener('visibilitychange', refreshVisibleList);
    const intervalId = window.setInterval(refreshVisibleList, 30_000);

    return () => {
      window.removeEventListener('focus', refreshVisibleList);
      document.removeEventListener('visibilitychange', refreshVisibleList);
      window.clearInterval(intervalId);
    };
  }, [loadEntries]);

  const displayedEntries = showSupportedOnly
    ? entries.filter((entry) => entry.type === 'directory' || entry.supported)
    : entries;

  const toggleFavorite = async (entry: LazycatDriveEntry) => {
    const fileUrl = resolveOpenFileUrl(entry);
    const favoriteKey = buildFavoriteKey(entry);
    try {
      if (favoriteKeys?.has(favoriteKey)) {
        await onRemoveFavorite?.(favoriteIdByKey?.get(favoriteKey) || favoriteKey);
      } else {
        await onAddFavorite?.(entry, fileUrl);
      }
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '收藏操作失败');
    }
  };

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
      fileUrl: resolveOpenFileUrl(entry),
      file: entry,
      fileList: displayedEntries,
      detail: [entry]
    });
  };

  return (
    <section className="panel file-panel">
      <div className="drive-toolbar">
        <div className="drive-breadcrumb">
          <button className="drive-nav-button" type="button" disabled={!currentPath} onClick={() => setCurrentPath(parentPath)}>
            <Icon name="back" />
          </button>
          <DrivePath scope={scope} path={currentPath} onNavigate={setCurrentPath} />
        </div>
        <div className="drive-toolbar-actions">
          <div className="drive-filter-tabs" aria-label="文件过滤">
            <button className={`drive-filter-tab${!showSupportedOnly ? ' is-active' : ''}`} type="button" onClick={() => setShowSupportedOnly(false)}>显示全部</button>
            <button className={`drive-filter-tab${showSupportedOnly ? ' is-active' : ''}`} type="button" onClick={() => setShowSupportedOnly(true)}>仅可打开</button>
          </div>
          <div className="drive-scope-tabs" aria-label="网盘来源">
            <button className={`drive-scope-tab${scope === 'all' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('all')}>全部文件</button>
            <button className={`drive-scope-tab${scope === 'shared' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('shared')}>共享文件</button>
            <button className={`drive-scope-tab${scope === 'external' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('external')}>外接磁盘</button>
            <button className={`drive-scope-tab${scope === 'mount' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('mount')}>网络挂载</button>
            <button className={`drive-scope-tab${scope === 'client' ? ' is-active' : ''}`} type="button" onClick={() => switchScope('client')}>客户端文件</button>
          </div>
        </div>
      </div>

      <div className="drive-list" aria-busy={loading}>
        <div className="drive-list-head">
          <span>文件名</span>
          <span>修改时间</span>
          <span>大小</span>
          <span>类型</span>
        </div>
        {loading ? <div className="drive-empty">正在读取...</div> : null}
        {!loading && error ? <div className="drive-empty drive-error-state">{error}</div> : null}
        {!loading && !error && displayedEntries.length === 0 ? <div className="drive-empty">{showSupportedOnly ? '暂无可打开文件' : '暂无文件'}</div> : null}
        {!loading ? displayedEntries.map((entry) => (
          <button
            className={`drive-row${entry.path === selectedPath ? ' is-selected' : ''}${entry.type === 'file' && !entry.supported ? ' is-disabled' : ''}`}
            type="button"
            key={entry.path}
            onClick={() => setSelectedPath(entry.path)}
            onDoubleClick={() => openEntry(entry)}
          >
            <span className="drive-name">
              <button
                className={`favorite-toggle${favoriteKeys?.has(buildFavoriteKey(entry)) ? ' is-active' : ''}`}
                type="button"
                title={favoriteKeys?.has(buildFavoriteKey(entry)) ? '取消收藏' : '添加收藏'}
                aria-label={favoriteKeys?.has(buildFavoriteKey(entry)) ? '取消收藏' : '添加收藏'}
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleFavorite(entry);
                }}
                onDoubleClick={(event) => event.stopPropagation()}
              ><Icon name="favorite" /></button>
              <DriveIcon entry={entry} /><span className="drive-name-text">{entry.name}</span>
            </span>
            <span>{formatTime(entry.modifiedAt)}</span>
            <span>{entry.type === 'directory' ? '-' : formatSize(entry.size)}</span>
            <span>{entry.type === 'directory' ? '文件夹' : entry.fileType || '文件'}</span>
          </button>
        )) : null}
      </div>

      {error ? <div className="error-text drive-error-footer">{error}</div> : null}
    </section>
  );
}

function normalizeDriveError(caught: unknown): string {
  const rawMessage = caught instanceof Error ? caught.message : String(caught || '');
  const parsed = parseErrorPayload(rawMessage);
  const message = parsed?.error?.message || rawMessage;

  if (/ENOENT/.test(message) && /clientfs/.test(message)) {
    return '客户端文件目录不存在或已断开连接，请返回上级或重新选择客户端文件。';
  }

  return message || '读取懒猫网盘失败';
}

function parseErrorPayload(input: string): { error?: { message?: string } } | null {
  try {
    return JSON.parse(input) as { error?: { message?: string } };
  } catch {
    return null;
  }
}

function DrivePath({ scope, path, onNavigate }: { scope: LazycatDriveScope; path: string; onNavigate: (path: string) => void }) {
  const scopeLabel = getScopeLabel(scope);

  if (!path) {
    return <span className="drive-path" title={scopeLabel}>{scopeLabel}</span>;
  }

  const parts = path.split('/').filter(Boolean);
  const visibleStartIndex = Math.max(0, parts.length - 3);
  const visibleParts = parts.slice(visibleStartIndex);
  const isTruncated = visibleStartIndex > 0;
  const fullPath = `${scopeLabel}/${path}`;

  return (
    <span className="drive-path" title={fullPath}>
      <button className="drive-path-button drive-path-scope" type="button" onClick={() => onNavigate('')}>
        {scopeLabel}
      </button>
      <span className="drive-path-separator">/</span>
      {isTruncated ? <><span className="drive-path-parent">...</span><span className="drive-path-separator">/</span></> : null}
      {visibleParts.map((part, index) => (
        <span className="drive-path-part" key={`${part}-${index}`}>
          <button
            className={`drive-path-button${index === visibleParts.length - 1 ? ' drive-path-current' : ' drive-path-parent'}`}
            type="button"
            onClick={() => onNavigate(parts.slice(0, visibleStartIndex + index + 1).join('/'))}
          >
            {part}
          </button>
          {index < visibleParts.length - 1 ? <span className="drive-path-separator">/</span> : null}
        </span>
      ))}
    </span>
  );
}

function resolveOpenFileUrl(entry: LazycatDriveEntry): string {
  if (entry.source === 'client') {
    return `clientfs:${entry.path}`;
  }

  if (entry.source === 'external' || entry.source === 'mount') {
    return `drive:${entry.source}:${encodeURIComponent(entry.path)}`;
  }

  if (entry.source !== 'shared') {
    return entry.path;
  }

  return entry.path.startsWith('.shared-center/') || entry.path === '.shared-center'
    ? entry.path
    : `.shared-center/${entry.path}`;
}

function DriveIcon({ entry }: { entry: LazycatDriveEntry }) {
  return <Icon name={entry.type === 'directory' ? 'folder' : getFileIconName(entry.fileType)} className="drive-icon" />;
}

function getScopeLabel(scope: LazycatDriveScope): string {
  if (scope === 'shared') return '共享文件';
  if (scope === 'external') return '外接磁盘';
  if (scope === 'mount') return '网络挂载';
  if (scope === 'client') return '客户端文件';
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

export function getLazycatDriveOpenFileUrl(entry: LazycatDriveEntry): string {
  return resolveOpenFileUrl(entry);
}

export function buildLazycatDriveFavoriteKey(entry: Pick<LazycatDriveEntry, 'source' | 'type' | 'path'>): string {
  return buildFavoriteKey(entry);
}

function buildFavoriteKey(entry: Pick<LazycatDriveEntry, 'source' | 'type' | 'path'>): string {
  const source = entry.source || 'all';
  return `${source}:${entry.type}:${entry.path}`;
}
