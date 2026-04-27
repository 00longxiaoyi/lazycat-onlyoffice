export interface FontFileItem {
  name: string;
  size: number;
  updatedAt: string;
}

export interface FontListResponse {
  items: FontFileItem[];
  lastRefreshAt: string | null;
  logs: string[];
}

export interface FontUploadResponse {
  item: FontFileItem;
}

export interface FontRefreshResponse {
  ok: true;
  refreshRequestedAt: string;
}
