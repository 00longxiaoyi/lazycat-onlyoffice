import { MiniDB } from '@lazycatcloud/minidb';
import type { AppConfig } from '../config';

let db: MiniDB | undefined;
let fallbackWarningShown = false;
let stateDir = '/lzcapp/var/state';

export function initMiniDB(config: AppConfig): void {
  db = new MiniDB({ origin: config.appOrigin });
  stateDir = config.stateDir;
}

export function getStateDir(): string {
  return stateDir;
}

export function getCollection<T extends object>(name: string) {
  if (!db) {
    throw new Error('MiniDB has not been initialized.');
  }

  return db.getCollection(name) as {
    upsert(docs: T | T[]): Promise<unknown>;
    find(query?: Record<string, unknown>, options?: Record<string, unknown>): { fetch(): Promise<T[]> };
    findOne(query: Record<string, unknown>): Promise<T | undefined>;
    remove(id: string | string[]): Promise<void>;
  };
}

export function canUseLocalMiniDBFallback(error: unknown): boolean {
  if (!fallbackWarningShown) {
    fallbackWarningShown = true;
    console.warn(`MiniDB unavailable, using file fallback: ${getErrorMessage(error)}`);
  }

  return true;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
