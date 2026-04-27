export interface OnlineUrlHistoryRecord {
  id: string;
  ownerUid: string;
  url: string;
  title: string;
  openedAt: string;
}

export interface OnlineUrlHistoryResponse {
  items: OnlineUrlHistoryRecord[];
}

export interface TouchOnlineUrlHistoryRequest {
  url: string;
  title?: string;
}
