import type { ListeningAttempt } from './types';

export const MAX_LISTENING_ATTEMPTS = 100;

const stamp = (a: ListeningAttempt) => Date.parse(a.finishedAt) || 0;

/** Gộp lượt làm hai máy: hợp theo id, mới nhất trước, giữ 100 lượt. */
export function mergeListeningAttempts(
  local: ListeningAttempt[] | null | undefined,
  remote: ListeningAttempt[] | null | undefined,
): ListeningAttempt[] {
  const byId = new Map<string, ListeningAttempt>();
  for (const a of [...(Array.isArray(remote) ? remote : []), ...(Array.isArray(local) ? local : [])]) {
    if (!a || typeof a !== 'object' || typeof a.id !== 'string') continue;
    byId.set(a.id, a);
  }
  return [...byId.values()].sort((a, b) => stamp(b) - stamp(a)).slice(0, MAX_LISTENING_ATTEMPTS);
}
