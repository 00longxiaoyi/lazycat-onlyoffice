import { useState } from 'react';
import type { FavoriteItemRecord } from '../../../../../shared/favorite';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Icon, getFileIconName } from '../../../components/Icon';

type FavoriteItemsPanelProps = {
  items: FavoriteItemRecord[];
  loading?: boolean;
  error?: string;
  onDeleteItem: (id: string) => Promise<void> | void;
  onOpenDirectory: (item: FavoriteItemRecord) => void;
};

export function FavoriteItemsPanel({ items, loading, error, onDeleteItem, onOpenDirectory }: FavoriteItemsPanelProps) {
  const [deleteTarget, setDeleteTarget] = useState<FavoriteItemRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openFavorite = (item: FavoriteItemRecord) => {
    if (item.type === 'directory') {
      onOpenDirectory(item);
      return;
    }

    window.open(`/open?url=${encodeURIComponent(item.fileUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const deleteFavorite = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await onDeleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="panel favorite-panel">
      <div className="panel-title-row favorite-title-row">
        <div className="recent-subtitle">{items.length ? `共 ${items.length} 条收藏记录` : '暂无收藏记录'}</div>
      </div>

      <div className="favorite-list" aria-busy={loading}>
        {loading ? <div className="drive-empty">正在读取收藏...</div> : null}
        {!loading && !items.length ? <div className="drive-empty">暂无收藏，请在首页文件列表中点击星标收藏文件或文件夹</div> : null}
        {!loading ? items.map((item) => (
          <div className="favorite-item" role="button" tabIndex={0} key={item.id} onClick={() => openFavorite(item)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFavorite(item);
            }
          }}>
            <button className="favorite-remove-button favorite-toggle is-active" type="button" title="取消收藏" aria-label={`取消收藏 ${item.name}`} onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(item);
            }}>
              <Icon name="favorite" />
            </button>
            <FavoriteIcon item={item} />
            <span className="favorite-main">
              <span className="favorite-title">{item.name}</span>
              <small>{formatFavoritePath(item)}</small>
            </span>
          </div>
        )) : null}
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="确认取消收藏？"
        description="取消后该项目会从收藏列表中移除。"
        target={deleteTarget?.name}
        confirmLabel="确认取消"
        loading={deleting}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteFavorite}
      />
    </section>
  );
}

function FavoriteIcon({ item }: { item: FavoriteItemRecord }) {
  return <Icon name={item.type === 'directory' ? 'folder' : getFileIconName(item.fileType)} className="favorite-file-icon" />;
}

function formatFavoritePath(item: FavoriteItemRecord): string {
  const sourceLabel = getSourceLabel(item.source);
  return sourceLabel ? `${sourceLabel} / ${item.path}` : item.path;
}

function getSourceLabel(source: FavoriteItemRecord['source']): string {
  if (source === 'shared') return '共享文件';
  if (source === 'external') return '外接磁盘';
  if (source === 'mount') return '网络挂载';
  if (source === 'client') return '客户端文件';
  return '全部文件';
}
