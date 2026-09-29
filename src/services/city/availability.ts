import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { cityAvailableFor } from './availability-rule';

/**
 * THÀNH PHỐ TRI THỨC CHỈ CÓ TRÊN MÁY TÍNH.
 *
 * Khả dụng khi ĐỒNG THỜI: `Platform.OS === 'web'`, con trỏ chính là chuột /
 * bàn di (`(pointer: fine)`), và cửa sổ rộng ít nhất 1024px. Điện thoại và máy
 * tính bảng — web lẫn app — không thấy bất kỳ dấu vết giao diện nào của thành
 * phố. Kinh tế vật liệu thì vẫn chạy ở mọi nơi (xem `economy.ts`).
 *
 * Hook duy nhất `useCityAvailable()` dùng ở MỌI lối vào: trang /quest, thanh
 * bên, thẻ gợi ý, nút mở thành phố, route trực tiếp.
 *
 * Chống lỗi hydration: phía máy chủ luôn trả `false` (getServerSnapshot); phía
 * trình duyệt đọc `matchMedia`/`window` sau khi gắn — `useSyncExternalStore`
 * lo phần chuyển giữa hai giá trị không lệch cây DOM.
 */
export { CITY_MIN_WIDTH, cityAvailableFor, type CityEnv } from './availability-rule';

/** Đọc môi trường hiện tại (chỉ gọi phía client). */
export function detectCityAvailable(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const pointerFine = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
  return cityAvailableFor({ os: 'web', pointerFine, width: window.innerWidth });
}

function subscribe(onChange: () => void): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: fine)') : null;
  window.addEventListener('resize', onChange);
  mq?.addEventListener?.('change', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    mq?.removeEventListener?.('change', onChange);
  };
}

const serverSnapshot = () => false;

export function useCityAvailable(): boolean {
  return useSyncExternalStore(subscribe, detectCityAvailable, serverSnapshot);
}
