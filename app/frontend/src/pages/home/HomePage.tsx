import { useEffect, useState } from 'react';
import { LazycatDrivePanel, type LazycatDriveSelection } from '../../features/lazycat-drive';
import { RecentFilesPanel } from './components/RecentFilesPanel';
import { useRecentFiles } from './hooks/useRecentFiles';

type HomeView = 'home' | 'settings';
type HomeModuleKey = 'recent' | 'drive';

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

export function HomePage() {
  const { items, removeItem, clearItems } = useRecentFiles();
  const [view, setView] = useState<HomeView>('home');
  const [enabledModules, setEnabledModules] = useState(() => readEnabledModules());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());

  useEffect(() => {
    writeEnabledModules(enabledModules);
  }, [enabledModules]);

  useEffect(() => {
    writeSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleDriveFileSelected = (selection: LazycatDriveSelection) => {
    window.open(`/open?url=${encodeURIComponent(selection.fileUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const toggleModule = (key: HomeModuleKey) => {
    setEnabledModules((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const enabledCount = HOME_MODULES.filter((module) => enabledModules[module.key]).length;

  return (
    <main className={`home-layout${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <aside className="home-sidebar" aria-label="主导航">
        <div className="home-brand">
          <span className="home-brand-text">办公套件</span>
          <button className="home-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'} onClick={() => setSidebarCollapsed((current) => !current)}>
            <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
          </button>
        </div>
        <nav className="home-nav">
          <button className={`home-nav-item${view === 'home' ? ' is-active' : ''}`} type="button" onClick={() => setView('home')}>
            <span className="home-nav-icon" aria-hidden="true">⌂</span>
            <span className="home-nav-label">首页</span>
          </button>
          <button className={`home-nav-item${view === 'settings' ? ' is-active' : ''}`} type="button" onClick={() => setView('settings')}>
            <span className="home-nav-icon" aria-hidden="true">⚙</span>
            <span className="home-nav-label">设置</span>
          </button>
        </nav>
      </aside>

      {view === 'home' ? (
        <section className="home-content" aria-label="首页模块">
          {enabledModules.recent ? <RecentFilesPanel items={items} onDeleteItem={removeItem} onClear={clearItems} /> : null}
          {enabledModules.drive ? <LazycatDrivePanel onFileSelected={handleDriveFileSelected} /> : null}
          {enabledCount === 0 ? (
            <section className="panel home-empty-panel">
              <h2>首页暂无模块</h2>
              <p>可以到左侧“设置”里添加最近访问或懒猫网盘模块。</p>
              <button className="settings-primary-button" type="button" onClick={() => setView('settings')}>去设置</button>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="home-content settings-content" aria-label="设置">
          <section className="panel settings-panel">
            <div className="panel-title-row">
              <div>
                <h2>首页模块</h2>
                <div className="recent-subtitle">选择首页需要显示的模块，修改会自动保存。</div>
              </div>
              <button className="settings-secondary-button" type="button" onClick={() => setEnabledModules(DEFAULT_HOME_MODULES)}>恢复默认</button>
            </div>
            <div className="settings-module-list">
              {HOME_MODULES.map((module) => (
                <label className="settings-module-item" key={module.key}>
                  <span>
                    <strong>{module.title}</strong>
                    <small>{module.description}</small>
                  </span>
                  <input type="checkbox" checked={enabledModules[module.key]} onChange={() => toggleModule(module.key)} />
                </label>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
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
