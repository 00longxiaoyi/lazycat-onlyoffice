import fs from 'node:fs/promises';
import path from 'node:path';
import { getStateDir } from './minidb';

export async function readJsonArray<T>(name: string): Promise<T[]> {
  try {
    const content = await fs.readFile(resolveStateFile(name), 'utf8');
    const value = JSON.parse(content) as unknown;
    return Array.isArray(value) ? value as T[] : [];
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }

    throw error;
  }
}

export async function writeJsonArray<T>(name: string, items: T[]): Promise<void> {
  const target = resolveStateFile(name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(items, null, 2), 'utf8');
}

function resolveStateFile(name: string): string {
  return path.join(getStateDir(), `${name}.json`);
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
