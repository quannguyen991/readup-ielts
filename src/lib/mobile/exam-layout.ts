/**
 * Quyết định bố cục phòng thi theo kích thước màn hình — hàm thuần để test được.
 *
 *  - width >= 700  : hai tấm cạnh nhau (điện thoại nằm ngang, máy tính bảng).
 *  - width <  700  : một tấm, chuyển Bài đọc / Câu hỏi bằng thanh phân đoạn ở đáy.
 *  - width >= 1000 : đủ chỗ cho dải công cụ dọc bên trái; hẹp hơn thì công cụ là thanh nổi.
 *  - height < 480  : màn thấp (điện thoại nằm ngang): thu gọn thanh trên/đáy.
 */
export type ExamLayout = {
  split: boolean;
  toolRail: boolean;
  compactHeight: boolean;
};

export function examLayout(width: number, height: number): ExamLayout {
  return { split: width >= 700, toolRail: width >= 1000, compactHeight: height < 480 };
}

/**
 * Phần bàn phím che mất, tính từ visualViewport. Trả 0 khi không có bàn phím
 * (hoặc chênh lệch quá nhỏ — thanh địa chỉ co giãn cũng làm innerHeight đổi).
 */
export function keyboardInset(
  layoutHeight: number,
  vv: { height: number; offsetTop: number } | null | undefined,
): number {
  if (!vv) return 0;
  const hidden = layoutHeight - vv.height - vv.offsetTop;
  return hidden > 120 ? Math.round(hidden) : 0;
}

/**
 * Cuộn thế nào để một ô nhập (đáy ở `fieldBottom`, toạ độ viewport) không bị
 * bàn phím che. Trả số px cần cuộn thêm xuống (>0), hoặc 0 nếu đã thấy.
 */
export function scrollNeededForField(fieldBottom: number, visibleBottom: number, margin = 24): number {
  const over = fieldBottom + margin - visibleBottom;
  return over > 0 ? Math.ceil(over) : 0;
}
