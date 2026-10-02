/**
 * Ẩn thanh tab dưới khi cuộn xuống, hiện lại khi cuộn lên — phần LOGIC thuần,
 * không đụng DOM, để test được.
 *
 * Giữ một "mốc" (`anchor`) là điểm cực trị của chiều cuộn hiện tại, và chỉ đổi
 * trạng thái khi quãng đã đi NGƯỢC chiều mốc vượt ngưỡng. Nhờ vậy tay run, nảy
 * quán tính cuối trang hay lia nhẹ lên xuống vài px không làm thanh nhấp nháy.
 */
export type ScrollBarState = {
  /** true = thanh đang ẩn. */
  hidden: boolean;
  /** Vị trí cuộn cực trị trong chiều đang đi. */
  anchor: number;
};

export type ScrollBarOptions = {
  /** Cuộn xuống quá bấy nhiêu px (tính từ mốc) mới ẩn. */
  hideAfter: number;
  /** Cuộn lên quá bấy nhiêu px mới hiện — nhạy hơn lúc ẩn: người ta muốn thanh quay lại nhanh. */
  showAfter: number;
  /** Gần đầu trang (≤ bấy nhiêu px) thì luôn hiện. */
  topZone: number;
};

export const DEFAULT_SCROLL_BAR_OPTIONS: ScrollBarOptions = { hideAfter: 24, showAfter: 10, topZone: 56 };

export const INITIAL_SCROLL_BAR_STATE: ScrollBarState = { hidden: false, anchor: 0 };

export function nextScrollBarState(
  prev: ScrollBarState,
  rawY: number,
  options: ScrollBarOptions = DEFAULT_SCROLL_BAR_OPTIONS,
): ScrollBarState {
  // iOS nảy đàn hồi cho scrollTop âm; coi như 0.
  const y = Math.max(0, rawY);
  if (y <= options.topZone) return { hidden: false, anchor: y };

  if (prev.hidden) {
    // Đang ẩn: mốc là điểm thấp nhất đã tới; cuộn ngược lên đủ xa thì hiện.
    const anchor = Math.max(prev.anchor, y);
    if (anchor - y >= options.showAfter) return { hidden: false, anchor: y };
    return anchor === prev.anchor ? prev : { hidden: true, anchor };
  }

  // Đang hiện: mốc là điểm cao nhất; cuộn xuống đủ xa thì ẩn.
  const anchor = Math.min(prev.anchor, y);
  if (y - anchor >= options.hideAfter) return { hidden: true, anchor: y };
  return anchor === prev.anchor ? prev : { hidden: false, anchor };
}
