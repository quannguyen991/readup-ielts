import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` ở bản dựng trên máy chủ VÀ ở lượt hydrate đầu tiên trên trình duyệt,
 * `true` ngay sau đó. Dùng cho giao diện phụ thuộc dữ liệu lưu trên máy
 * (giao diện, nền trang đổi bằng sao): máy chủ không biết người dùng chọn gì,
 * nên lượt đầu phải vẽ y như máy chủ — nếu không React giữ nguyên thuộc tính
 * của HTML máy chủ và người dùng thấy nền/giao diện "tự về mặc định" sau F5.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
