import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/** Người dùng bật "giảm chuyển động" ở hệ điều hành / trình duyệt. */
const canQuery = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia;

function subscribeMotion(cb: () => void): () => void {
  if (!canQuery()) return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', cb);
  return () => mq.removeEventListener?.('change', cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => canQuery() && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

/** Số mili giây hiện tại, cập nhật mỗi `everyMs` (đồng hồ thành phố). */
export function useNowMs(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
