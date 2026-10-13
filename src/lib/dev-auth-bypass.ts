/**
 * Chỉ dành cho phát triển trên máy của người làm app: khi chạy `expo start` và mở
 * trên localhost, các màn yêu cầu đăng nhập được mở để kiểm thử.
 *
 * Bản build phát hành (không phải __DEV__) hoặc mở từ tên miền khác luôn trả về false,
 * nên không có đường vòng nào cho người dùng thật.
 */
export function isLocalDevBypass(): boolean {
  if (!__DEV__) return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
