/**
 * Chỉ dành cho phát triển trên máy của người làm app, và PHẢI bật thủ công bằng
 * `EXPO_PUBLIC_DEV_LOGIN=1` trong `.env.local`. Không bật mặc định nữa: trước đây mọi
 * lần mở localhost đều vào thẳng tài khoản giả `local-dev`, nên hồ sơ, lịch sử và
 * đồng bộ không bao giờ hiện trạng thái chưa đăng nhập thật.
 *
 * Bản build phát hành (không phải __DEV__) hoặc mở từ tên miền khác luôn trả về false.
 */
export function isLocalDevBypass(): boolean {
  if (!__DEV__) return false;
  if (process.env.EXPO_PUBLIC_DEV_LOGIN !== '1') return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
