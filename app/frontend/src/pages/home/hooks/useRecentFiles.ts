import { useEffect, useState } from 'react';
import type { RecentFileRecord } from '../../../../../shared/recent';
import { clearRecentFiles, deleteRecentFile, getRecentFiles } from '../../../lib/api/client';

export function useRecentFiles() {
  const [items, setItems] = useState<RecentFileRecord[]>([]);

  useEffect(() => {
    getRecentFiles().then((res) => setItems(res.items)).catch(() => setItems([]));
  }, []);

  async function removeItem(id: string): Promise<void> {
    await deleteRecentFile(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function clearItems(): Promise<void> {
    await clearRecentFiles();
    setItems([]);
  }

  return { items, removeItem, clearItems };
}
