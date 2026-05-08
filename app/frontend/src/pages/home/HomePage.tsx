import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { LazycatDriveSelection } from '../../features/lazycat-drive';
import { deleteFont, getOnlineUrlHistory, listFonts, refreshFonts, touchOnlineUrlHistory, uploadFont } from '../../lib/api/client';
import { FavoriteItemsPanel } from './components/FavoriteItemsPanel';
import { FontsPanel } from './components/FontsPanel';
import { HomeDrivePanel } from './components/HomeDrivePanel';
import { HomeSidebar } from './components/HomeSidebar';
import { OnlineUrlPanel } from './components/OnlineUrlPanel';
import { RecentFilesPanel } from './components/RecentFilesPanel';
import { DEFAULT_HOME_MODULES, readEnabledModules, writeEnabledModules } from './homeModules';
import { useFavoriteItems } from './hooks/useFavoriteItems';
import { useRecentFiles } from './hooks/useRecentFiles';
import { VIEW_PATHS, viewFromPath } from './navigation';
import type { HomeView } from './types';
import { addOnlineUrlHistoryItem, resolveOnlineUrlTitle } from './utils/onlineUrl';
import type { FontFileItem } from '../../../../shared/fonts';
import type { OnlineUrlHistoryRecord } from '../../../../shared/online-url';
import type { FavoriteItemRecord } from '../../../../shared/favorite';
import type { LazycatDriveScope } from '../../../../shared/drive';

export function HomePage() {
  const { items, removeItem, clearItems } = useRecentFiles();
  const favorites = useFavoriteItems();
  const [view, setView] = useState<HomeView>(() => viewFromPath(window.location.pathname));
  const [enabledModules, setEnabledModules] = useState(() => readEnabledModules());
  const [onlineUrl, setOnlineUrl] = useState('');
  const [onlineUrlError, setOnlineUrlError] = useState('');
  const [onlineUrlHistory, setOnlineUrlHistory] = useState<OnlineUrlHistoryRecord[]>([]);
  const [fonts, setFonts] = useState<FontFileItem[]>([]);
  const [fontStatus, setFontStatus] = useState('');
  const [fontError, setFontError] = useState('');
  const [fontUploading, setFontUploading] = useState(false);
  const [fontRefreshing, setFontRefreshing] = useState(false);
  const [fontDeleting, setFontDeleting] = useState(false);
  const [fontDeleteTarget, setFontDeleteTarget] = useState<FontFileItem | null>(null);
  const [fontUploadProgress, setFontUploadProgress] = useState(0);
  const [fontLogs, setFontLogs] = useState<string[]>([]);
  const [driveJumpTarget, setDriveJumpTarget] = useState<{ scope: LazycatDriveScope; path: string; nonce: number } | null>(null);

  useEffect(() => {
    writeEnabledModules(enabledModules);
  }, [enabledModules]);

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
    openDocumentUrl(selection.fileUrl);
  };

  const handleOpenFavoriteDirectory = (item: FavoriteItemRecord) => {
    setDriveJumpTarget({
      scope: item.source,
      path: item.path,
      nonce: Date.now()
    });
    navigateTo('home');
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
    openDocumentUrl(trimmed);
  };

  const handleOnlineUrlChange = (value: string) => {
    setOnlineUrl(value);
    setOnlineUrlError('');
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

  return (
    <main className="home-layout">
      <HomeSidebar view={view} onNavigate={navigateTo} />

      {view === 'home' ? (
        <HomeDrivePanel
          enabledModules={enabledModules}
          favoriteItems={favorites.items}
          driveJumpTarget={driveJumpTarget}
          onFileSelected={handleDriveFileSelected}
          onAddFavorite={favorites.addItem}
          onRemoveFavorite={favorites.removeItem}
          onRestoreDefaultModules={() => setEnabledModules(DEFAULT_HOME_MODULES)}
        />
      ) : null}

      {view === 'recent' ? (
        <section className="home-content recent-content" aria-label="最近访问">
          <RecentFilesPanel items={items} onDeleteItem={removeItem} onClear={clearItems} />
        </section>
      ) : null}

      {view === 'favorites' ? (
        <section className="home-content favorites-content" aria-label="收藏">
          <FavoriteItemsPanel items={favorites.items} loading={favorites.loading} error={favorites.error} onDeleteItem={favorites.removeItem} onOpenDirectory={handleOpenFavoriteDirectory} />
        </section>
      ) : null}

      {view === 'online' ? (
        <OnlineUrlPanel
          url={onlineUrl}
          error={onlineUrlError}
          history={onlineUrlHistory}
          onUrlChange={handleOnlineUrlChange}
          onOpenUrl={openOnlineUrl}
          onOpenHistoryItem={openDocumentUrl}
        />
      ) : null}

      {view === 'fonts' ? (
        <FontsPanel
          fonts={fonts}
          status={fontStatus}
          error={fontError}
          uploading={fontUploading}
          refreshing={fontRefreshing}
          uploadProgress={fontUploadProgress}
          logs={fontLogs}
          onUpload={(file) => void handleFontUpload(file)}
          onRefresh={() => void handleFontRefresh()}
          onRequestDelete={setFontDeleteTarget}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(fontDeleteTarget)}
        title="确认删除字体？"
        description="删除后字体文件将从字体目录中移除，需要点击“刷新字体”同步到 OnlyOffice。"
        target={fontDeleteTarget?.name}
        confirmLabel="确认删除"
        loading={fontDeleting}
        danger
        onCancel={() => setFontDeleteTarget(null)}
        onConfirm={handleFontDelete}
      />
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

function openDocumentUrl(url: string): void {
  window.open(`/open?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
}
