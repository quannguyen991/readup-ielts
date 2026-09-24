/**
 * Ngôi sao 3D to ở phần đầu trang CHỈ HIỆN TRÊN MÁY TÍNH (laptop, máy bàn).
 *
 * Người dùng chốt ngày 24/09/2026: điện thoại và máy tính bảng (iPad) bỏ hẳn
 * ngôi sao to cho nhẹ máy — không dựng WebGL, không tải three.js. Chùm sao nhỏ
 * ở góc thẻ vẫn giữ.
 *
 * "Máy tính" = con trỏ chính là chuột hay bàn di (rê được, trỏ chính xác), màn
 * đủ rộng, và không phải máy tính bảng. Chỉ đo bề rộng thì không đủ: iPad Pro
 * nằm ngang rộng 1366px, rộng hơn nhiều laptop. Còn iPad đời mới tự xưng
 * "Macintosh" trong user agent — thứ phân biệt nó với Mac là màn cảm ứng nhiều
 * điểm chạm.
 */
export function isLaptopLike({
  width,
  finePointer,
  userAgent,
  touchPoints,
}: {
  width: number;
  /** `(hover: hover) and (pointer: fine)` — con trỏ chính là chuột hay bàn di. */
  finePointer: boolean;
  userAgent: string;
  touchPoints: number;
}): boolean {
  const tablet = /iPad|iPhone|Android|Mobile/i.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
  return finePointer && !tablet && width >= 900;
}
