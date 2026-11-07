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
    // Tắt từ khi chuyển sang máy chủ HoaiDuc: không còn host Vercel, script luôn 404
    // và làm console đỏ. Lượt truy cập đang đếm bằng /api/track (Supabase page_views).
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.location.hostname.endsWith('.vercel.app')) return;
    void import('@vercel/analytics').then(({ inject }) => inject({ framework: 'expo' }));
  }, []);
  return null;
}
