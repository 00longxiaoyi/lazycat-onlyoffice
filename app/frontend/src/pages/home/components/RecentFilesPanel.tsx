import { useState } from 'react';
import type { RecentFileRecord } from '../../../../../shared/recent';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SvgIcon } from '../../../components/SvgIcon';
import excelIcon from '../../../icon/excel.svg?raw';
import pdfIcon from '../../../icon/pdf.svg?raw';
import pptIcon from '../../../icon/ppt.svg?raw';
import trashIcon from '../../../icon/trash.svg?raw';
import wordIcon from '../../../icon/word.svg?raw';

type RecentDeleteTarget =
  | { type: 'clear' }
  | { type: 'item'; item: RecentFileRecord };

type RecentFilesPanelProps = {
  items: RecentFileRecord[];
  onDeleteItem: (id: string) => Promise<void> | void;
  onClear: () => Promise<void> | void;
};

export function RecentFilesPanel({ items, onDeleteItem, onClear }: RecentFilesPanelProps) {
  const visibleItems = items.slice(0, 20);
  const [deleteTarget, setDeleteTarget] = useState<RecentDeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteTarget.type === 'clear') {
        await onClear();
      } else {
        await onDeleteItem(deleteTarget.item.id);
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openRecent = (item: RecentFileRecord) => {
    window.open(`/open?url=${encodeURIComponent(item.fileUrl)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className="panel recent-panel is-pinned">
      <div className="panel-title-row recent-title-row">
        <div className="recent-subtitle">{items.length ? `共 ${items.length} 条记录` : '暂无记录'}</div>
        <button className="recent-clear-button" type="button" disabled={!items.length} aria-label="清理最近访问记录" title="清理" onClick={() => setDeleteTarget({ type: 'clear' })}>
          <SvgIcon svg={trashIcon} />
        </button>
      </div>
      <div className="recent-list">
        {visibleItems.length === 0 ? <div className="empty recent-empty">暂无最近访问文件</div> : visibleItems.map((item) => (
          <div className="recent-item" key={item.id} onClick={() => openRecent(item)}>
            <button className="recent-file-link" type="button">
              <SvgIcon svg={getRecentFileIconSrc(item.fileType)} className="recent-file-icon" />
              <span className="recent-file-main">
                <span className="recent-file-title">{item.title}</span>
                <small>{item.source === 'url' ? item.fileUrl : item.relativePath}</small>
              </span>
            </button>
            <button className="recent-delete-button" type="button" aria-label={`删除 ${item.title} 的最近访问记录`} onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget({ type: 'item', item });
            }}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'clear' ? '确认清理记录？' : '确认删除记录？'}
        description={deleteTarget?.type === 'clear' ? '清理后将移除所有最近访问记录。' : '删除后该文件会从最近访问中移除。'}
        target={deleteTarget?.type === 'item' ? deleteTarget.item.title : undefined}
        confirmLabel={deleteTarget?.type === 'clear' ? '确认清理' : '确认删除'}
        loading={deleting}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </aside>
  );
}

function getRecentFileIconSrc(fileType: string): string {
  const ext = fileType.toLowerCase();
  if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return wordIcon;
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return excelIcon;
  if (['ppt', 'pptx', 'odp'].includes(ext)) return pptIcon;
  if (ext === 'pdf') return pdfIcon;
  return wordIcon;
}
