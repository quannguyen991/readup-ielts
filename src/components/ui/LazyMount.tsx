import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

/**
 * Chỉ dựng nội dung nặng (hoạ tiết SVG) khi ô đã gần màn hình. Trên web dùng IntersectionObserver: ô còn xa
 * hiện lớp nền nhẹ `placeholder`, khi cuộn tới thì dựng nội dung thật một lần. Máy không có observer thì
 * dựng luôn. Nhờ vậy một trang nhiều thẻ không phải tạo hàng trăm SVG ngay khi mở.
 */
export function LazyMount({ children, placeholder, style }: { children: React.ReactNode; placeholder: React.ReactNode; style?: ViewStyle }) {
  const ref = useRef<View>(null);
  const [show, setShow] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (show) return;
    const el = ref.current as unknown as Element | null;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <View ref={ref} style={style}>
      {show ? children : placeholder}
    </View>
  );
}
