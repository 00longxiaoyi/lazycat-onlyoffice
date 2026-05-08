import { Icon, type AppIconName } from '../../../components/Icon';
import type { HomeView } from '../types';

type HomeSidebarProps = {
  view: HomeView;
  onNavigate: (view: HomeView) => void;
};

const NAV_ITEMS: Array<{ view: HomeView; icon: AppIconName; label: string }> = [
  { view: 'home', icon: 'home', label: '首页' },
  { view: 'recent', icon: 'recent', label: '最近访问' },
  { view: 'favorites', icon: 'favorite', label: '收藏' },
  { view: 'online', icon: 'url', label: '在线 URL' },
  { view: 'fonts', icon: 'font', label: '字体管理' }
];

export function HomeSidebar({ view, onNavigate }: HomeSidebarProps) {
  return (
    <aside className="home-sidebar" aria-label="主导航">
      <nav className="home-nav">
        {NAV_ITEMS.map((item) => (
          <button className={`home-nav-item${view === item.view ? ' is-active' : ''}`} type="button" key={item.view} onClick={() => onNavigate(item.view)}>
            <Icon name={item.icon} className="home-nav-icon" />
            <span className="home-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
