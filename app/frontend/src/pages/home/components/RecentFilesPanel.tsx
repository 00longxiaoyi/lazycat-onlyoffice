import type { RecentFileRecord } from '../../../../../shared/recent';

type RecentFilesPanelProps = {
  items: RecentFileRecord[];
  onDeleteItem: (id: string) => Promise<void> | void;
  onClear: () => Promise<void> | void;
};

export function RecentFilesPanel({ items, onDeleteItem, onClear }: RecentFilesPanelProps) {
  const visibleItems = items.slice(0, 12);

  const clearRecent = async () => {
    if (!items.length || !window.confirm('确定要清空所有最近访问记录吗？')) {
      return;
    }

    await onClear();
  };

  const deleteRecent = async (item: RecentFileRecord) => {
    if (!window.confirm(`确定要删除「${item.title}」这条最近访问记录吗？`)) {
      return;
    }

    await onDeleteItem(item.id);
  };

  return (
      <aside className="panel recent-panel is-pinned">
        <div className="panel-title-row">
          <div>
            <h2>最近访问</h2>
            <div className="recent-subtitle">{items.length ? `${items.length} 个最近打开的文件` : '暂无最近打开的文件'}</div>
          </div>
          <button className="recent-clear-button" type="button" disabled={!items.length} onClick={clearRecent}>清理</button>
        </div>
        <div className="recent-list">
          {visibleItems.length === 0 ? <div className="empty recent-empty">暂无最近访问文件</div> : visibleItems.map((item) => (
            <div className="recent-item" key={item.id}>
              <a className="recent-file-link" href={`/open?url=${encodeURIComponent(item.fileUrl)}`}>
                <span className="recent-file-icon">{getRecentFileIcon(item.fileType)}</span>
                <span className="recent-file-main">
                  <span className="recent-file-title">{item.title}</span>
                  <small>{item.relativePath}</small>
                </span>
              </a>
              <button className="recent-delete-button" type="button" aria-label={`删除 ${item.title} 的最近访问记录`} onClick={() => deleteRecent(item)}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      </aside>
  );
}

function getRecentFileIcon(fileType: string): string {
  const ext = fileType.toLowerCase();
  if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return 'W';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'S';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'P';
  return 'F';
}
