/**
 * Trình duyệt nhúng trong app (Instagram). Google chặn đăng nhập trong các trình duyệt này,
 * nên ẩn nút Google và hướng người dùng sang đăng nhập bằng email / số điện thoại hoặc mở bằng trình duyệt.
 */
export function isInstagramBrowser(userAgent: string): boolean {
  return /Instagram/i.test(userAgent);
}

/** User-Agent của trình duyệt hiện tại; rỗng khi không chạy trên web (native, SSR). */
export function currentUserAgent(): string {
  return typeof navigator === 'undefined' ? '' : (navigator.userAgent ?? '');
}
