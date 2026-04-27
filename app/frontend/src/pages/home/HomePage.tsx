import { useEffect, useState } from 'react';
import { LazycatDrivePanel, type LazycatDriveSelection } from '../../features/lazycat-drive';
import { deleteFont, getOnlineUrlHistory, listFonts, refreshFonts, touchOnlineUrlHistory, uploadFont } from '../../lib/api/client';
import { RecentFilesPanel } from './components/RecentFilesPanel';
import { useRecentFiles } from './hooks/useRecentFiles';
import type { FontFileItem } from '../../../../shared/fonts';
import type { OnlineUrlHistoryRecord } from '../../../../shared/online-url';

type HomeView = 'home' | 'online' | 'fonts';
type HomeModuleKey = 'recent' | 'drive';
type HomeContentTab = 'drive' | 'recent';

const HOME_MODULE_STORAGE_KEY = 'onlyoffice.home.modules';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'onlyoffice.home.sidebarCollapsed';
const DEFAULT_HOME_MODULES: Record<HomeModuleKey, boolean> = {
  recent: true,
  drive: true
};

const HOME_MODULES: Array<{ key: HomeModuleKey; title: string; description: string }> = [
  { key: 'recent', title: '最近访问', description: '显示最近打开过的文档入口。' },
  { key: 'drive', title: '懒猫网盘', description: '显示当前用户文件、共享文件、外接磁盘和网络挂载。' }
];

const VIEW_PATHS: Record<HomeView, string> = {
  home: '/',
  online: '/online',
  fonts: '/fonts'
};

export function HomePage() {
  const { items, removeItem, clearItems } = useRecentFiles();
  const [view, setView] = useState<HomeView>(() => viewFromPath(window.location.pathname));
  const [enabledModules, setEnabledModules] = useState(() => readEnabledModules());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());
  const [onlineUrl, setOnlineUrl] = useState('');
  const [onlineUrlError, setOnlineUrlError] = useState('');
  const [onlineUrlHistory, setOnlineUrlHistory] = useState<OnlineUrlHistoryRecord[]>([]);
  const [homeTab, setHomeTab] = useState<HomeContentTab>('drive');
  const [fonts, setFonts] = useState<FontFileItem[]>([]);
  const [fontStatus, setFontStatus] = useState('');
  const [fontError, setFontError] = useState('');
  const [fontUploading, setFontUploading] = useState(false);
  const [fontRefreshing, setFontRefreshing] = useState(false);
  const [fontDeleting, setFontDeleting] = useState(false);
  const [fontDeleteTarget, setFontDeleteTarget] = useState<FontFileItem | null>(null);
  const [fontUploadProgress, setFontUploadProgress] = useState(0);
  const [fontLogs, setFontLogs] = useState<string[]>([]);

  useEffect(() => {
    writeEnabledModules(enabledModules);
  }, [enabledModules]);

  useEffect(() => {
    writeSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handlePopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (view !== 'fonts') {
      return;
    }

    let cancelled = false;
    listFonts()
      .then((result) => {
        if (!cancelled) {
          setFonts(result.items);
          setFontLogs(result.logs);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setFontError(caught instanceof Error ? caught.message : '字体列表加载失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    getOnlineUrlHistory()
      .then((result) => {
        if (!cancelled) {
          setOnlineUrlHistory(result.items);
        }
      })
      .catch((caught) => console.warn('[online-url-history] failed to load', caught));

    return () => {
      cancelled = true;
    };
  }, []);

  const navigateTo = (nextView: HomeView) => {
    setView(nextView);
    const nextPath = VIEW_PATHS[nextView];
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  };

  const handleDriveFileSelected = (selection: LazycatDriveSelection) => {
    window.open(`/open?url=${encodeURIComponent(selection.fileUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const openOnlineUrl = () => {
    const trimmed = onlineUrl.trim();
    if (!trimmed) {
      setOnlineUrlError('请先粘贴一个文档 URL');
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setOnlineUrlError('请输入完整的 http:// 或 https:// 文档 URL');
      return;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      setOnlineUrlError('仅支持 http:// 或 https:// 文档 URL');
      return;
    }

    setOnlineUrlError('');
    setOnlineUrl('');
    const title = resolveOnlineUrlTitle(trimmed);
    setOnlineUrlHistory((current) => addOnlineUrlHistoryItem(current, trimmed, title));
    touchOnlineUrlHistory({ url: trimmed, title })
      .then(() => getOnlineUrlHistory())
      .then((result) => setOnlineUrlHistory(result.items))
      .catch((caught) => console.warn('[online-url-history] failed to save', caught));
    window.open(`/open?url=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer');
  };

  const toggleModule = (key: HomeModuleKey) => {
    setEnabledModules((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleFontUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setFontUploading(true);
    setFontUploadProgress(0);
    setFontError('');
    setFontStatus('正在上传字体...');
    try {
      await uploadFont(file, setFontUploadProgress);
      const result = await listFonts();
      setFonts(result.items);
      setFontLogs(result.logs);
      setFontStatus('字体已上传，请点击“刷新字体”让 OnlyOffice 加载。');
    } catch (caught) {
      setFontError(caught instanceof Error ? caught.message : '字体上传失败');
      setFontStatus('');
    } finally {
      setFontUploading(false);
      setFontUploadProgress(0);
    }
  };

  const handleFontDelete = async () => {
    if (!fontDeleteTarget) {
      return;
    }

    setFontDeleting(true);
    setFontError('');
    setFontStatus('正在删除字体...');
    try {
      await deleteFont(fontDeleteTarget.name);
      const result = await listFonts();
      setFonts(result.items);
      setFontLogs(result.logs);
      setFontDeleteTarget(null);
      setFontStatus('字体已删除，请点击“刷新字体”同步到 OnlyOffice。');
    } catch (caught) {
      setFontError(caught instanceof Error ? caught.message : '字体删除失败');
      setFontStatus('');
    } finally {
      setFontDeleting(false);
    }
  };

  const handleFontRefresh = async () => {
    setFontRefreshing(true);
    setFontError('');
    setFontStatus('正在提交字体刷新请求...');
    try {
      const refreshResult = await refreshFonts();
      setFontStatus('刷新请求已提交，正在等待 OnlyOffice 完成加载...');
      const result = await waitForFontRefresh(refreshResult.refreshRequestedAt);
      setFonts(result.items);
      setFontLogs(result.logs);
      setFontStatus('字体刷新成功，请重新打开文档查看新字体。');
    } catch (caught) {
      setFontError(caught instanceof Error ? caught.message : '字体刷新失败');
      setFontStatus('');
    } finally {
      setFontRefreshing(false);
    }
  };

  const shouldShowRecent = enabledModules.recent;
  const shouldShowDrive = enabledModules.drive;
  const enabledCount = Number(shouldShowRecent) + Number(shouldShowDrive);
  const activeHomeTab = homeTab === 'recent' && shouldShowRecent ? 'recent' : 'drive';

  return (
    <main className={`home-layout${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <aside className="home-sidebar" aria-label="主导航">
        <div className="home-brand">
          <span className="home-brand-text">办公套件</span>
          <button className="home-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'} onClick={() => setSidebarCollapsed((current) => !current)}>
            <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} />
          </button>
        </div>
        <nav className="home-nav">
          <button className={`home-nav-item${view === 'home' ? ' is-active' : ''}`} type="button" onClick={() => navigateTo('home')}>
            <Icon name="home" />
            <span className="home-nav-label">首页</span>
          </button>
          <button className={`home-nav-item${view === 'online' ? ' is-active' : ''}`} type="button" onClick={() => navigateTo('online')}>
            <Icon name="link" />
            <span className="home-nav-label">在线 URL</span>
          </button>
          <button className={`home-nav-item${view === 'fonts' ? ' is-active' : ''}`} type="button" onClick={() => navigateTo('fonts')}>
            <Icon name="font" />
            <span className="home-nav-label">字体管理</span>
          </button>
        </nav>
      </aside>

      {view === 'home' ? (
        <section className="home-content" aria-label="首页模块">
          {shouldShowDrive || shouldShowRecent ? (
            <section className="home-main-panel">
              {activeHomeTab === 'drive' && shouldShowDrive ? (
                <LazycatDrivePanel onFileSelected={handleDriveFileSelected} title={<HomeContentTitleTabs activeTab="drive" showRecent={enabledModules.recent} onTabChange={setHomeTab} />} />
              ) : null}
              {activeHomeTab === 'recent' && shouldShowRecent ? (
                <RecentFilesPanel items={items} onDeleteItem={removeItem} onClear={clearItems} title={<HomeContentTitleTabs activeTab="recent" showRecent={enabledModules.recent} onTabChange={setHomeTab} />} />
              ) : null}
            </section>
          ) : null}
          {enabledCount === 0 ? (
            <section className="panel home-empty-panel">
              <h2>首页暂无模块</h2>
              <p>当前首页模块已全部隐藏，可以恢复默认模块。</p>
              <button className="settings-primary-button" type="button" onClick={() => setEnabledModules(DEFAULT_HOME_MODULES)}>恢复默认</button>
            </section>
          ) : null}
        </section>
      ) : null}

      {view === 'online' ? (
        <section className="home-content online-url-content" aria-label="打开在线 URL">
          <section className="panel online-url-panel">
            <div className="online-url-search-shell">
              <div className="online-url-title">URL 文档打开</div>
              <div className="online-url-subtitle">输入一个可访问、可写入的 Word、Excel 或 PPT 在线文档链接</div>
              <div className="online-url-form">
                <input
                  className="online-url-input"
                  type="url"
                  value={onlineUrl}
                  placeholder="https://example.com/demo.docx"
                  onChange={(event) => {
                    setOnlineUrl(event.target.value);
                    setOnlineUrlError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      openOnlineUrl();
                    }
                  }}
                />
                <button className="online-url-button" type="button" onClick={openOnlineUrl}>打开</button>
              </div>
            </div>
            {onlineUrlError ? <div className="error-text">{onlineUrlError}</div> : null}
            <div className="online-url-hint">链接需要能被应用服务访问，并支持 HTTP PUT/WebDAV 同地址写回；否则可以打开编辑，但保存回写会失败。</div>
            <div className="online-url-history">
              <div className="online-url-history-title">打开记录</div>
              {onlineUrlHistory.length ? (
                <div className="online-url-history-list">
                  {onlineUrlHistory.map((item) => (
                    <button className="online-url-history-item" type="button" key={item.url} title={item.title} onClick={() => window.open(`/open?url=${encodeURIComponent(item.url)}`, '_blank', 'noopener,noreferrer')}>
                      {item.title}
                    </button>
                  ))}
                </div>
              ) : <div className="online-url-history-empty">暂无打开记录</div>}
            </div>
          </section>
        </section>
      ) : null}

      {view === 'fonts' ? (
        <section className="home-content fonts-content" aria-label="字体管理">
          <section className="panel fonts-panel">
            <div className="panel-title-row">
              <h2>字体管理</h2>
              <div className="fonts-actions">
                <label className={`settings-primary-button font-upload-button${fontUploading ? ' is-disabled' : ''}`}>
                  {fontUploading ? '上传中...' : '上传字体'}
                  <input type="file" accept=".ttf,.otf,.ttc" disabled={fontUploading} onChange={(event) => void handleFontUpload(event.target.files?.[0])} />
                </label>
                <button className="settings-secondary-button" type="button" disabled={fontRefreshing || fontUploading} onClick={() => void handleFontRefresh()}>
                  {fontRefreshing ? '刷新中...' : '刷新字体'}
                </button>
              </div>
            </div>
            {fontUploading ? (
              <div className="font-upload-progress" aria-label="字体上传进度">
                <div className="font-upload-progress-bar" style={{ width: `${fontUploadProgress}%` }} />
                <span>{fontUploadProgress}%</span>
              </div>
            ) : null}
            {fontStatus ? <div className="fonts-status">{fontStatus}</div> : null}
            {fontError ? <div className="error-text">{fontError}</div> : null}
            {fonts.length ? (
              <div className="font-list">
                {fonts.map((font) => (
                  <div className="font-item" key={font.name}>
                    <span>
                      <strong>{font.name}</strong>
                      <small>{formatFileSize(font.size)} · {formatDateTime(font.updatedAt)}</small>
                    </span>
                    <button className="settings-secondary-button" type="button" onClick={() => setFontDeleteTarget(font)}>删除</button>
                  </div>
                ))}
              </div>
            ) : <div className="empty">暂无自定义字体。</div>}
            <details className="font-log-panel">
              <summary>字体刷新日志</summary>
              {fontLogs.length ? <pre>{fontLogs.join('\n')}</pre> : <div className="empty">暂无刷新日志。</div>}
            </details>
          </section>
        </section>
      ) : null}

      {fontDeleteTarget ? (
        <div className="font-confirm-overlay" role="presentation" onClick={() => !fontDeleting && setFontDeleteTarget(null)}>
          <section className="font-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="font-delete-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="font-delete-title">确认删除字体？</h3>
            <p>删除后字体文件将从字体目录中移除，需要点击“刷新字体”同步到 OnlyOffice。</p>
            <div className="font-confirm-target" title={fontDeleteTarget.name}>{fontDeleteTarget.name}</div>
            <div className="font-confirm-actions">
              <button className="settings-secondary-button" type="button" disabled={fontDeleting} onClick={() => setFontDeleteTarget(null)}>取消</button>
              <button className="settings-danger-button" type="button" disabled={fontDeleting} onClick={() => void handleFontDelete()}>
                {fontDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}

async function waitForFontRefresh(refreshRequestedAt: string): Promise<Awaited<ReturnType<typeof listFonts>>> {
  const requestedTime = new Date(refreshRequestedAt).getTime();
  const timeoutAt = Date.now() + 90_000;

  while (Date.now() < timeoutAt) {
    await sleep(3_000);
    const result = await listFonts();
    const lastRefreshTime = result.lastRefreshAt ? new Date(result.lastRefreshAt).getTime() : 0;
    if (lastRefreshTime >= requestedTime) {
      return result;
    }
  }

  throw new Error('字体刷新等待超时，请稍后查看刷新日志或再次点击“刷新字体”。');
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function HomeContentTitleTabs({ activeTab, showRecent, onTabChange }: { activeTab: HomeContentTab; showRecent: boolean; onTabChange: (tab: HomeContentTab) => void }) {
  return (
    <span className="home-title-tabs" aria-label="首页内容切换">
      <button className={`home-title-tab${activeTab === 'drive' ? ' is-active' : ''}`} type="button" onClick={() => onTabChange('drive')}>懒猫网盘</button>
      {showRecent ? (
        <button className={`home-title-tab${activeTab === 'recent' ? ' is-active' : ''}`} type="button" onClick={() => onTabChange('recent')}>最近访问</button>
      ) : null}
    </span>
  );
}

type IconName = 'home' | 'link' | 'font' | 'chevron-left' | 'chevron-right';

function Icon({ name }: { name: IconName }) {
  return <i className={`iconfont icon-${name} home-nav-icon`} aria-hidden="true" />;
}

function viewFromPath(pathname: string): HomeView {
  if (pathname === '/online' || pathname.startsWith('/online/')) {
    return 'online';
  }

  if (pathname === '/fonts' || pathname.startsWith('/fonts/')) {
    return 'fonts';
  }

  return 'home';
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toLocaleString();
}

function addOnlineUrlHistoryItem(current: OnlineUrlHistoryRecord[], url: string, title: string): OnlineUrlHistoryRecord[] {
  const nextItem = {
    id: url,
    ownerUid: '',
    url,
    title,
    openedAt: new Date().toISOString()
  };

  return [nextItem, ...current.filter((item) => item.url !== url)].slice(0, 20);
}

function resolveOnlineUrlTitle(input: string): string {
  try {
    const url = new URL(input);
    const pathName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    const queryName = url.searchParams.get('filename') || url.searchParams.get('name') || '';
    return sanitizeOnlineUrlTitle(pathName || queryName || input);
  } catch {
    return sanitizeOnlineUrlTitle(input);
  }
}

function sanitizeOnlineUrlTitle(input: string): string {
  const title = input.trim().replace(/[\\/:*?"<>|\0]/g, '_');
  return title || '在线文档';
}

function readEnabledModules(): Record<HomeModuleKey, boolean> {
  try {
    const raw = window.localStorage.getItem(HOME_MODULE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_HOME_MODULES;
    }

    const parsed = JSON.parse(raw) as Partial<Record<HomeModuleKey, boolean>>;
    return {
      recent: typeof parsed.recent === 'boolean' ? parsed.recent : DEFAULT_HOME_MODULES.recent,
      drive: typeof parsed.drive === 'boolean' ? parsed.drive : DEFAULT_HOME_MODULES.drive
    };
  } catch {
    return DEFAULT_HOME_MODULES;
  }
}

function writeEnabledModules(value: Record<HomeModuleKey, boolean>): void {
  try {
    window.localStorage.setItem(HOME_MODULE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}

function readSidebarCollapsed(): boolean {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

function writeSidebarCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}
