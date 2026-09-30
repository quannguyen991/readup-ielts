/**
 * Khai báo tối thiểu cho react-dom (gói có sẵn qua react-native-web nhưng dự án
 * không cài @types/react-dom). Chỉ khai phần đang dùng: `createPortal` cho lớp
 * phủ toàn màn hình của Chuyến tàu từ vựng.
 */
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactPortal;
}
