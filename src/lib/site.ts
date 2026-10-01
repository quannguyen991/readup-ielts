/**
 * Tên miền công khai của Band 9 (đổi từ readup-ielts.vercel.app ngày 01/10/2026).
 * Mọi đường dẫn chia sẻ (mời bạn, mua nhóm, báo cáo phụ huynh, ảnh khoe điểm)
 * lấy từ đây — đổi tên miền chỉ sửa một chỗ. Tên miền cũ vẫn trỏ về cùng bản
 * triển khai nên link đã gửi trước đó vẫn mở được.
 */
export const SITE_HOST = 'band9-ielts.vercel.app';
export const SITE_ORIGIN = `https://${SITE_HOST}`;

/** Tên miền cũ — vẫn chạy song song; ở đó hiện dải mời mang tiến độ sang. */
export const LEGACY_HOSTS: readonly string[] = ['readup-ielts.vercel.app'];

export function isLegacyHost(host: string | null | undefined): boolean {
  return !!host && LEGACY_HOSTS.includes(host);
}

/**
 * Trang đang chạy ở tên miền cũ (hoặc giả lập bằng `?legacy=1` trên máy dev) —
 * lúc đó màn "Band 9 đã chuyển nhà" phủ cả trang, các popup khác phải nhường.
 */
export function onLegacySite(): boolean {
  if (typeof window === 'undefined') return false;
  const { host, search } = window.location;
  if (isLegacyHost(host)) return true;
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) && new URLSearchParams(search).get('legacy') === '1';
}
