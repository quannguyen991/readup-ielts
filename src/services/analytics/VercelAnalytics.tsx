import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Đếm lượt truy cập bằng Vercel Web Analytics — chỉ trên web.
 *
 * VÌ SAO CÔNG CỤ NÀY MÀ KHÔNG PHẢI GOOGLE ANALYTICS NGAY: nó KHÔNG đặt cookie và
 * không định danh người xem, nên không cần bảng xin đồng ý cookie mới được bật —
 * thứ mà GA4 / Meta Pixel (`track.ts`) bắt buộc phải có. Gói Hobby được 50.000
 * lượt ghi nhận mỗi tháng.
 *
 * Script tự đếm cả lượt đổi trang trong app (pushState), nên chỉ cần gọi một lần.
 * Chưa bật Web Analytics trong trang quản lý Vercel thì script trả 404 và không
 * làm gì — không vỡ app.
 */
export function VercelAnalytics(): null {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Chỉ tải thư viện trên web, lúc chạy — bản native không kéo theo gói này.
    void import('@vercel/analytics').then(({ inject }) => inject({ framework: 'expo' }));
  }, []);
  return null;
}
