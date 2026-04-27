import { useEffect, useState } from 'react';
import type { RecentFileRecord } from '../../../../../shared/recent';
import { clearRecentFiles, deleteRecentFile, getRecentFiles } from '../../../lib/api/client';

export function useRecentFiles() {
  const [items, setItems] = useState<RecentFileRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getRecentFiles()
        .then((res) => {
          if (!cancelled) {
            setItems(res.items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setItems([]);
          }
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  async function refreshItems(): Promise<void> {
    const res = await getRecentFiles();
    setItems(res.items);
  }

  async function removeItem(id: string): Promise<void> {
    await deleteRecentFile(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function clearItems(): Promise<void> {
    await clearRecentFiles();
    setItems([]);
  }

  return { items, removeItem, clearItems, refreshItems };
}
