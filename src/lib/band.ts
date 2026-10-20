/**
 * Tiện ích cho band IELTS.
 *
 * Band chỉ tồn tại với IELTS. Lượt làm bài SAT lưu `estimatedBand: null` —
 * gắn "Band 4.5" lên một bài SAT là nói sai, mà coi null như 0 thì kéo tụt mọi
 * số trung bình. Nên chỗ nào đụng tới band đều phải đi qua đây, không được gọi
 * thẳng `.toFixed()` trên một giá trị có thể null.
 */

/** Chuỗi hiển thị cho một band. Không có band thì trả dấu gạch, không ném lỗi. */
export function formatBand(band: number | null | undefined): string {
  return band == null ? '—' : band.toFixed(1);
}

/** Trung bình band, bỏ qua lượt không có band. Không lượt nào có thì trả null. */
export function averageBand(bands: Array<number | null | undefined>): number | null {
  const values = bands.filter((b): b is number => b != null);
  if (values.length === 0) return null;

  const mean = values.reduce((sum, b) => sum + b, 0) / values.length;
  // Làm tròn tới 0.25 để tránh số lẻ dài kiểu 6.333333333333333.
  return Math.round(mean * 4) / 4;
}

/** Band của lượt gần nhất *có* band. Danh sách phải xếp mới nhất trước. */
export function latestBand(bands: Array<number | null | undefined>): number | null {
  return bands.find((b): b is number => b != null) ?? null;
}

/** Chênh lệch band giữa hai lượt. Thiếu một đầu thì không có gì để so. */
export function bandDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 100) / 100;
}

/** Quy điểm thô 40 câu sang band IELTS Reading Academic (bảng quy đổi thông dụng). */
export function rawScoreToBand(correct: number, total: number): number {
  const scaled = total === 0 ? 0 : Math.round((correct / total) * 40);
  const table: Array<[number, number]> = [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [19, 5.5],
    [15, 5],
    [13, 4.5],
    [10, 4],
    [8, 3.5],
    [6, 3],
    [0, 2.5],
  ];

  for (const [threshold, band] of table) {
    if (scaled >= threshold) return band;
  }
  return 2.5;
}
