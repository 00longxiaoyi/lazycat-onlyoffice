import type { OnlineUrlHistoryRecord } from '../../../../../shared/online-url';

export function addOnlineUrlHistoryItem(current: OnlineUrlHistoryRecord[], url: string, title: string): OnlineUrlHistoryRecord[] {
  const nextItem = {
    id: url,
    ownerUid: '',
    url,
    title,
    openedAt: new Date().toISOString()
  };

  return [nextItem, ...current.filter((item) => item.url !== url)].slice(0, 20);
}

export function resolveOnlineUrlTitle(input: string): string {
  try {
    const url = new URL(input);
    const pathName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    const queryName = url.searchParams.get('filename') || url.searchParams.get('name') || '';
    return sanitizeOnlineUrlTitle(pathName || queryName || input);
  } catch {
    return sanitizeOnlineUrlTitle(input);
  }
}

function sanitizeOnlineUrlTitle(input: string): string {
  const title = input.trim().replace(/[\\/:*?"<>|\0]/g, '_');
  return title || '在线文档';
}
