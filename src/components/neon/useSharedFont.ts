import { useSyncExternalStore } from 'react';
import * as Font from 'expo-font';

/**
 * Nạp một phông MỘT lần cho cả app và chia sẻ trạng thái "đã nạp".
 *
 * `useFonts` của expo-font gọi `loadAsync` trong effect ở MỖI nơi dùng rồi `setState` khi xong, kể cả khi phông đã nạp
 * từ trước, nên một trang có hàng chục nhãn chữ pixel sinh ra hàng chục lượt render thêm mỗi lần mở trang. Ở đây
 * trạng thái nằm ngoài React: phông đã nạp thì lượt dựng đầu đã đúng, không có render phụ.
 */
type Source = Record<string, number>;
const state = new Map<string, { ready: boolean; started: boolean; listeners: Set<() => void> }>();

function entry(family: string) {
  let e = state.get(family);
  if (!e) {
    e = { ready: Font.isLoaded(family), started: false, listeners: new Set() };
    state.set(family, e);
  }
  return e;
}

export function useSharedFont(family: string, source: Source): boolean {
  const e = entry(family);
  return useSyncExternalStore(
    (cb) => {
      e.listeners.add(cb);
      if (!e.ready && !e.started) {
        e.started = true;
        Font.loadAsync(source)
          .catch(() => undefined)
          .then(() => {
            e.ready = Font.isLoaded(family);
            e.listeners.forEach((f) => f());
          });
      }
      return () => e.listeners.delete(cb);
    },
    () => e.ready,
    () => false,
  );
}
