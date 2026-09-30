/**
 * LỊCH ÔN THEO NGÀY cho bộ từ chủ đề (kiểu hộp Leitner) — hàm thuần.
 *
 * Trước 30/09/2026 bộ từ chỉ có ba mức (chưa học / cần ôn / đã nhớ), không có
 * ngày ôn: học xong thì từ nằm yên ở "đã nhớ" mãi, không bao giờ được hỏi lại
 * đúng lúc sắp quên. Giờ mỗi từ có một HỘP và một NGÀY ĐẾN HẠN:
 *
 * - Trả lời ĐÚNG khi từ đã đến hạn → lên một hộp, khoảng cách giãn ra
 *   1 → 2 → 4 → 7 → 15 → 30 → 60 ngày.
 * - Ôn SỚM (chưa đến hạn) mà đúng → không lên hộp (học dồn không được tính),
 *   chỉ ghi lần ôn.
 * - Mỗi ngày một từ lên tối đa một hộp — làm đúng 5 lần trong một buổi vẫn chỉ là một lần nhớ.
 * - Trả lời SAI → về hộp đầu, đến hạn lại ngày mai.
 *
 * Ngày tính bằng khoá YYYY-MM-DD theo giờ máy (cùng `dateKey` của app).
 */

export const INTERVALS = [1, 2, 4, 7, 15, 30, 60] as const;

export type ReviewEntry = { box: number; due: string; last: string };

export function addDays(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nextReview(prev: ReviewEntry | undefined, correct: boolean, today: string): ReviewEntry {
  if (!correct) return { box: 0, due: addDays(today, 1), last: today };
  if (!prev) return { box: 0, due: addDays(today, INTERVALS[0]), last: today };
  // Đã ôn hôm nay rồi, hoặc ôn sớm: giữ nguyên hộp và hạn.
  if (prev.last === today || prev.due > today) return { ...prev, last: today };
  const box = Math.min(INTERVALS.length - 1, prev.box + 1);
  return { box, due: addDays(today, INTERVALS[box]!), last: today };
}

export function isDue(e: ReviewEntry | undefined, today: string): boolean {
  return !!e && e.due <= today;
}

/** Số từ đến hạn ôn trong mỗi bộ (chỉ các bộ có ít nhất một từ đến hạn). */
export function dueBySlug(reviews: Record<string, Record<string, ReviewEntry>> | undefined, today: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [slug, words] of Object.entries(reviews ?? {})) {
    const due = Object.entries(words ?? {})
      .filter(([, e]) => isDue(e, today))
      .sort((a, b) => a[1].due.localeCompare(b[1].due))
      .map(([w]) => w);
    if (due.length) out[slug] = due;
  }
  return out;
}

/** Số từ đến hạn trong từng ngày của `days` ngày tới (hôm nay gồm cả từ quá hạn). */
export function forecast(reviews: Record<string, Record<string, ReviewEntry>> | undefined, today: string, days = 7): { day: string; count: number }[] {
  const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i), count: 0 }));
  for (const words of Object.values(reviews ?? {}))
    for (const e of Object.values(words ?? {})) {
      const i = e.due <= today ? 0 : out.findIndex((d) => d.day === e.due);
      if (i >= 0) out[i]!.count += 1;
    }
  return out;
}

/** Gộp hai máy: lấy bản ôn gần nhất; cùng ngày thì lấy hộp thấp hơn (thận trọng). */
export function mergeReviewEntry(a: ReviewEntry | undefined, b: ReviewEntry | undefined): ReviewEntry | undefined {
  if (!a) return b;
  if (!b) return a;
  if (a.last !== b.last) return a.last > b.last ? a : b;
  return a.box <= b.box ? a : b;
}
