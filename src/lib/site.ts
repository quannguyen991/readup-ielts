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
