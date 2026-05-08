import { Icon } from '../../../components/Icon';
import { formatDateTime, formatFileSize } from '../utils/format';
import type { FontFileItem } from '../../../../../shared/fonts';

type FontsPanelProps = {
  fonts: FontFileItem[];
  status: string;
  error: string;
  uploading: boolean;
  refreshing: boolean;
  uploadProgress: number;
  logs: string[];
  onUpload: (file: File | undefined) => void;
  onRefresh: () => void;
  onRequestDelete: (font: FontFileItem) => void;
};

export function FontsPanel({
  fonts,
  status,
  error,
  uploading,
  refreshing,
  uploadProgress,
  logs,
  onUpload,
  onRefresh,
  onRequestDelete
}: FontsPanelProps) {
  return (
    <section className="home-content fonts-content" aria-label="字体管理">
      <section className="panel fonts-panel">
        <div className="fonts-toolbar">
          <div className="fonts-toolbar-status">
            {status ? <div className="fonts-status">{status}</div> : null}
            {error ? <div className="error-text">{error}</div> : null}
          </div>
          <div className="fonts-actions">
            <label className={`font-icon-button font-upload-button${uploading ? ' is-disabled' : ''}`} title={uploading ? '上传中...' : '上传字体'} aria-label={uploading ? '上传中...' : '上传字体'}>
              <Icon name="upload" />
              <input type="file" accept=".ttf,.otf,.ttc" disabled={uploading} onChange={(event) => onUpload(event.target.files?.[0])} />
            </label>
            <button className="font-icon-button" type="button" disabled={refreshing || uploading} title={refreshing ? '刷新中...' : '刷新字体'} aria-label={refreshing ? '刷新中...' : '刷新字体'} onClick={onRefresh}>
              <Icon name="refresh" />
            </button>
          </div>
        </div>
        {uploading ? (
          <div className="font-upload-progress" aria-label="字体上传进度">
            <div className="font-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
            <span>{uploadProgress}%</span>
          </div>
        ) : null}
        {fonts.length ? (
          <div className="font-list">
            {fonts.map((font) => (
              <div className="font-item" key={font.name}>
                <span>
                  <strong>{font.name}</strong>
                  <small>{formatFileSize(font.size)} · {formatDateTime(font.updatedAt)}</small>
                </span>
                <button className="font-delete-icon-button" type="button" title="删除字体" aria-label={`删除字体 ${font.name}`} onClick={() => onRequestDelete(font)}>
                  <Icon name="close" />
                </button>
              </div>
            ))}
          </div>
        ) : <div className="empty">暂无自定义字体。</div>}
        <details className="font-log-panel">
          <summary>字体刷新日志</summary>
          {logs.length ? <pre>{logs.join('\n')}</pre> : <div className="empty">暂无刷新日志。</div>}
        </details>
      </section>
    </section>
  );
}
