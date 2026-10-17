import type { StoreApi, UseBoundStore } from 'zustand';

import { useHydrated } from '@/components/layout/useHydrated';

/**
 * Đọc một lát state của store lưu xuống máy (zustand persist) — dùng cho giao diện mới.
 *
 * Máy chủ và lượt hydrate đầu không biết dữ liệu đã lưu, nên vẽ state mặc định (y như HTML
 * máy chủ). Sau khi hydrate xong mới đọc state thật. Thiếu bước này, F5 sẽ hiện số 0 dù dữ
 * liệu vẫn còn trong máy, vì React giữ nguyên HTML máy chủ. Cùng lý do với `useHydrated`.
 * Selector phải trả về cùng một tham chiếu khi state không đổi.
 */
export function useFresh<S, U>(store: UseBoundStore<StoreApi<S>>, selector: (s: S) => U): U {
  const hydrated = useHydrated();
  const live = store(selector);
  return hydrated ? live : selector(store.getInitialState());
}
