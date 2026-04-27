import { useEffect, useRef, useState } from 'react';
import { createEditorSession, EditorSessionConflictError, releaseEditorSession } from '../../lib/api/client';
import type { EditorSessionConflictResponse, EditorSessionMode, EditorSessionResponse } from '../../../../shared/editor';

const DOCS_API_SRC = '/web-apps/apps/api/documents/api.js';

interface OpenAttempt {
  mode: EditorSessionMode;
  takeover: boolean;
  nonce: number;
}

type ConflictState = EditorSessionConflictResponse['conflict'];

export function OpenPage() {
  const [status, setStatus] = useState('正在创建编辑会话');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [scriptState, setScriptState] = useState('pending');
  const [openAttempt, setOpenAttempt] = useState<OpenAttempt>({ mode: 'edit', takeover: false, nonce: 0 });
  const editorRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const retryOpen = (mode: EditorSessionMode, takeover = false) => {
    setConflict(null);
    setError('');
    setStatus(mode === 'view' ? '正在以只读方式打开' : '正在接管编辑会话');
    setOpenAttempt({ mode, takeover, nonce: Date.now() });
  };

  useEffect(() => {
    let cancelled = false;

    const pushDebug = (message: string, detail?: unknown) => {
      const line = detail === undefined ? message : `${message}: ${safeStringify(detail)}`;
      console.log('[onlyoffice-open]', line);
      setDebugLines((current) => [...current, line]);
    };

    const handleWindowError = (event: ErrorEvent) => {
      pushDebug('Window error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      pushDebug('Unhandled rejection', event.reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    pushDebug('OpenPage mounted', {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hasDocsApi: Boolean(window.DocsAPI?.DocEditor)
    });

    async function openEditor() {
      try {
        const url = new URL(window.location.href);
        const fileUrl = url.searchParams.get('url');
        pushDebug('Resolved url param', { fileUrl });

        if (!fileUrl) {
          throw new Error('缺少文件 URL');
        }

        const normalizedFileUrl = normalizeOpenFileUrl(fileUrl);
        pushDebug('Normalized file url', { normalizedFileUrl });

        const isClientfsFile = fileUrl.startsWith('clientfs:');
        const session = await createEditorSession({
          fileUrl: normalizedFileUrl,
          source: isClientfsFile ? 'clientfs' : isOnlineDocumentUrl(fileUrl) ? 'url' : 'file-handler',
          mode: openAttempt.mode,
          takeover: openAttempt.takeover
        });
        pushDebug('Editor session created', {
          sessionId: session.session.id,
          documentKey: session.config.document.key,
          editorUser: session.config.editorConfig.user,
          documentUrl: session.config.document.url,
          callbackUrl: session.config.editorConfig.callbackUrl,
          documentType: session.config.documentType,
          fileType: session.config.document.fileType
        });

        if (cancelled) return;
        sessionIdRef.current = session.session.id;
        setStatus('正在加载 ONLYOFFICE 编辑器');
        pushDebug('Loading DocsAPI script', { src: DOCS_API_SRC });

        const loadResult = await loadDocsApi();
        setScriptState(loadResult.state);
        pushDebug('DocsAPI script loaded', {
          state: loadResult.state,
          src: loadResult.src,
          hasDocEditor: Boolean(window.DocsAPI?.DocEditor)
        });

        if (cancelled) return;
        if (!window.DocsAPI?.DocEditor) {
          throw new Error('没有加载到 DocsAPI.DocEditor');
        }

        editorRef.current?.destroyEditor?.();
        pushDebug('Initializing DocEditor', {
          documentUrl: session.config.document.url,
          callbackUrl: session.config.editorConfig.callbackUrl
        });
        editorRef.current = new window.DocsAPI.DocEditor('editor', session.config);
        pushDebug('DocEditor initialized');
        window.setTimeout(() => {
          const iframe = document.querySelector<HTMLIFrameElement>('#editor iframe');
          pushDebug('Editor iframe snapshot', {
            exists: Boolean(iframe),
            src: iframe?.src || null
          });
        }, 1500);
        setStatus('');
      } catch (caught) {
        if (cancelled) return;
        pushDebug('OpenPage error', caught instanceof Error ? { message: caught.message, stack: caught.stack } : caught);
        if (caught instanceof EditorSessionConflictError) {
          setConflict(caught.payload.conflict);
          setError(caught.message);
          setStatus('');
          return;
        }

        setError(caught instanceof Error ? caught.message : '打开文件失败');
        setStatus('');
      }
    }

    openEditor();

    return () => {
      cancelled = true;
      pushDebug('OpenPage cleanup');
      if (sessionIdRef.current) {
        releaseEditorSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      editorRef.current?.destroyEditor?.();
      editorRef.current = null;
    };
  }, [openAttempt]);

  return (
    <main className="editor-page">
      <div id="editor" className="editor-container" />
      {status || error ? (
        <section className="editor-status">
          <h2>打开文件</h2>
          {status ? <div className="empty">{status}</div> : null}
          {error ? <div className="error-text">{error}</div> : null}
          {conflict ? (
            <div className="editor-conflict">
              <div className="empty">文件：{conflict.title}</div>
              <div className="editor-conflict-actions">
                <button type="button" className="settings-secondary-button" onClick={() => retryOpen('view')}>
                  继续只读查看
                </button>
                <button type="button" className="settings-primary-button" onClick={() => retryOpen('edit', true)}>
                  接管编辑
                </button>
              </div>
            </div>
          ) : null}
          <div className="empty">DocsAPI 脚本状态: {scriptState}</div>
        </section>
      ) : null}
      <DebugPanel debugLines={debugLines} />
    </main>
  );
}

function DebugPanel({ debugLines }: { debugLines: string[] }) {
  return (
    <details className="debug-panel">
      <summary>调试信息</summary>
      <pre>{debugLines.join('\n') || '暂无调试输出'}</pre>
    </details>
  );
}

interface DocsApiLoadResult {
  state: 'cached' | 'existing' | 'injected';
  src: string | null;
}

function loadDocsApi(): Promise<DocsApiLoadResult> {
  if (window.DocsAPI?.DocEditor) {
    return Promise.resolve({ state: 'cached', src: DOCS_API_SRC });
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${DOCS_API_SRC}"]`);
  if (existing) {
    return waitForDocsApi(existing, 'existing');
  }

  const script = document.createElement('script');
  script.src = DOCS_API_SRC;
  script.async = true;
  document.head.appendChild(script);

  return waitForDocsApi(script, 'injected');
}

function waitForDocsApi(script: HTMLScriptElement, state: DocsApiLoadResult['state']): Promise<DocsApiLoadResult> {
  return new Promise((resolve, reject) => {
    if (window.DocsAPI?.DocEditor) {
      resolve({ state, src: script.src || null });
      return;
    }

    script.addEventListener('load', () => resolve({ state, src: script.src || null }), { once: true });
    script.addEventListener('error', () => reject(new Error(`无法加载 ${DOCS_API_SRC}`)), { once: true });
  });
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}


function normalizeOpenFileUrl(input: string): string {
  if (input.startsWith('clientfs:')) {
    return input;
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const relativePath = normalizeRelativePath(input);
  const boxDomain = getBoxDomain(window.location.hostname);
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');

  return `${window.location.protocol}//file.${boxDomain}/_lzc/files/home/${encodedPath}`;
}

function isOnlineDocumentUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.startsWith('file.');
  } catch {
    return false;
  }
}

function normalizeRelativePath(input: string): string {
  return input
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^home\//, '');
}

function getBoxDomain(hostname: string): string {
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(1).join('.');
}
