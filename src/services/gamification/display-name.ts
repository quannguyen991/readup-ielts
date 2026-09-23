/**
 * Tên hiện trên các bảng xếp hạng công khai.
 *
 * KHÔNG LỘ DANH TÍNH. Chỉ hiện tên khi người dùng ĐÃ TỰ ĐẶT một cái tên trông
 * như tên người; còn lại là "Học viên ####" lấy từ id. Khi đăng ký bằng email,
 * `display_name` thường được điền sẵn bằng phần trước dấu @ — đem lên bảng là
 * phát tán email của người khác cho người lạ.
 *
 * Bỏ qua mọi chuỗi có '@', và mọi chuỗi kiểu định danh máy — một từ liền, chỉ
 * chữ thường, số, dấu chấm hoặc gạch (vd "quannguyen.ulis207").
 */
export function displayableName(raw: string | null): string | null {
  const name = raw?.trim();
  if (!name || name.includes('@')) return null;
  if (/^[a-z0-9._-]+$/.test(name)) return null;
  return name.slice(0, 28);
}

export function anonymousName(userId: string): string {
  return `Học viên ${userId.slice(0, 4).toUpperCase()}`;
}
