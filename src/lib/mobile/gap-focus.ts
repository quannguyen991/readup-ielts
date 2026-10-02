import { Platform } from 'react-native';

import { nextGapNumber } from './gap-order';

/**
 * Sổ đăng ký các ô điền đang hiện, để phím Enter / "Tiếp" trên bàn phím nhảy
 * sang ô kế tiếp (theo số câu) thay vì đóng bàn phím rồi bắt người học chạm lại.
 * Mỗi nhóm (Reading, Listening) dùng một `scope` riêng.
 */
type Focusable = { focus: () => void; blur?: () => void };
const registry = new Map<string, Map<number, Focusable>>();

export function registerGap(scope: string, n: number, el: Focusable | null): () => void {
  if (!el) return () => undefined;
  let m = registry.get(scope);
  if (!m) registry.set(scope, (m = new Map()));
  m.set(n, el);
  return () => {
    const cur = registry.get(scope);
    if (cur?.get(n) === el) cur.delete(n);
  };
}

/** Chuyển tiêu điểm sang ô kế tiếp; hết ô thì bỏ tiêu điểm (đóng bàn phím). */
export function focusNextGap(scope: string, n: number, current?: Focusable | null): void {
  const m = registry.get(scope);
  const next = m ? nextGapNumber([...m.keys()], n) : null;
  if (next !== null) m?.get(next)?.focus();
  else current?.blur?.();
}

/** Đưa ô vừa focus vào giữa vùng nhìn thấy sau khi bàn phím đã trồi lên (web). */
export function revealOnFocus(el: unknown): void {
  if (Platform.OS !== 'web') return;
  const node = el as { scrollIntoView?: (o: object) => void } | null;
  if (!node?.scrollIntoView) return;
  setTimeout(() => node.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 280);
}
