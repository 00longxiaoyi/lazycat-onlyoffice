import { HomePage } from './pages/home/HomePage';
import { OpenPage } from './pages/open/OpenPage';

export function App() {
  const currentUrl = new URL(window.location.href);
  const path = currentUrl.pathname;

  if (path === '/open' || path.startsWith('/open/') || currentUrl.searchParams.has('url')) {
    return <OpenPage />;
  }

  return <HomePage />;
}
