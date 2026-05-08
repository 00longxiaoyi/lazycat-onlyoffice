import type { HomeView } from './types';

export const VIEW_PATHS: Record<HomeView, string> = {
  home: '/',
  recent: '/recent',
  favorites: '/favorites',
  online: '/online',
  fonts: '/fonts'
};

export function viewFromPath(pathname: string): HomeView {
  if (pathname === '/recent' || pathname.startsWith('/recent/')) {
    return 'recent';
  }

  if (pathname === '/favorites' || pathname.startsWith('/favorites/')) {
    return 'favorites';
  }

  if (pathname === '/online' || pathname.startsWith('/online/')) {
    return 'online';
  }

  if (pathname === '/fonts' || pathname.startsWith('/fonts/')) {
    return 'fonts';
  }

  return 'home';
}
