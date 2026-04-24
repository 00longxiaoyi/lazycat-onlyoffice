import crypto from 'node:crypto';

export function createSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function createDocumentKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
}
