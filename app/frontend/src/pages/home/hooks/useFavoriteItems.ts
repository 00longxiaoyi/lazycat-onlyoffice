import { useEffect, useMemo, useState } from 'react';
import type { LazycatDriveEntry } from '../../../../../shared/drive';
import type { FavoriteItemRecord } from '../../../../../shared/favorite';
import { addFavoriteItem, deleteFavoriteItem, getFavoriteItems } from '../../../lib/api/client';

export function useFavoriteItems() {
  const [items, setItems] = useState<FavoriteItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getFavoriteItems();
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '收藏列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const favoriteIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const addItem = async (entry: LazycatDriveEntry, fileUrl: string) => {
    await addFavoriteItem(entry, fileUrl);
    await reload();
  };

  const removeItem = async (id: string) => {
    await deleteFavoriteItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return { items, loading, error, favoriteIds, addItem, removeItem, reload };
}
