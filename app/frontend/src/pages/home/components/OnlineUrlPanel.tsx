import type { OnlineUrlHistoryRecord } from '../../../../../shared/online-url';

type OnlineUrlPanelProps = {
  url: string;
  error: string;
  history: OnlineUrlHistoryRecord[];
  onUrlChange: (value: string) => void;
  onOpenUrl: () => void;
  onOpenHistoryItem: (url: string) => void;
};

export function OnlineUrlPanel({ url, error, history, onUrlChange, onOpenUrl, onOpenHistoryItem }: OnlineUrlPanelProps) {
  return (
    <section className="home-content online-url-content" aria-label="打开在线 URL">
      <section className="panel online-url-panel">
        <div className="online-url-search-shell">
          <div className="online-url-title">URL 文档打开</div>
          <div className="online-url-subtitle">输入一个可访问、可写入的 Word、Excel 或 PPT 在线文档链接</div>
          <div className="online-url-form">
            <input
              className="online-url-input"
              type="url"
              value={url}
              placeholder="https://example.com/demo.docx"
              onChange={(event) => onUrlChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onOpenUrl();
                }
              }}
            />
            <button className="online-url-button" type="button" onClick={onOpenUrl}>打开</button>
          </div>
        </div>
        {error ? <div className="error-text">{error}</div> : null}
        <div className="online-url-hint">链接需要能被应用服务访问，并支持 HTTP PUT/WebDAV 同地址写回；否则可以打开编辑，但保存回写会失败。</div>
        <div className="online-url-history">
          <div className="online-url-history-title">打开记录</div>
          {history.length ? (
            <div className="online-url-history-list">
              {history.map((item) => (
                <button className="online-url-history-item" type="button" key={item.url} title={item.title} onClick={() => onOpenHistoryItem(item.url)}>
                  {item.title}
                </button>
              ))}
            </div>
          ) : <div className="online-url-history-empty">暂无打开记录</div>}
        </div>
      </section>
    </section>
  );
}
