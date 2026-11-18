import { useSyncExternalStore } from 'react';

/**
 * Cấp HSK đang mở, để nền trang (ChineseBackdrop, vẽ ở AppShell) đổi theo cấp của bài đang học.
 * Trang bài đặt cấp khi mở; khi rời trang thì trả về cấp 1.
 */
let current = 1;
const listeners = new Set<() => void>();

export function setZhLevel(level: number): void {
  if (level === current) return;
  current = level;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useZhLevel(): number {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
