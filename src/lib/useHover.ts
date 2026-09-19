import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Chuột có đang ở sát mép trái màn hình không — dùng cho cột dọc thu gọn.
 *
 * VÌ SAO ĐO TOẠ ĐỘ CHUỘT chứ không nghe `mouseenter` của chính cột. Thử hai
 * cách trước đều hỏng: `onMouseEnter` đặt lên `View` thì react-native-web
 * không chuyển tiếp (không lỗi, chỉ là không bao giờ chạy), còn gắn tay
 * `addEventListener` vào nút DOM lấy qua ref cũng không nhận được sự kiện —
 * cột nằm dưới mấy lớp bọc và lớp nền loang phủ lên trên. Đo `clientX` thì
 * không phụ thuộc cây DOM: chuột vào vùng bao nhiêu điểm ảnh tính từ mép trái
 * là cột bung ra.
 *
 * Trên native luôn trả `false` — ở đó không có con trỏ.
 */
export function useLeftEdgeHover(openWithin: number, closeBeyond: number): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onMove = (event: MouseEvent) => {
      // Hai ngưỡng khác nhau để cột không chớp tắt khi chuột đi dọc đúng mép.
      setNear((was) => (was ? event.clientX < closeBeyond : event.clientX < openWithin));
    };
    const onLeave = () => setNear(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [openWithin, closeBeyond]);

  return near;
}
