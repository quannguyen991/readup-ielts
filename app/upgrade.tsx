import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Không còn gói trả phí: app cộng đồng mở toàn bộ tính năng cho mọi người.
 * Đường dẫn cũ /upgrade chuyển về trang chủ, để liên kết còn sót không dẫn tới trang lỗi.
 */
export default function UpgradeRedirect() {
  useEffect(() => {
    router.replace('/intro' as never);
  }, []);
  return null;
}
