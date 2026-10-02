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

/** Mỗi ngày nhận tối đa bấy nhiêu từ mới xếp lịch — để ôn không dồn cục. */
export const DAILY_CAP = 15;
/** Lần ôn đầu của từ mới được rải trong khoảng 1…7 ngày tới. */
export const SPREAD_DAYS = 7;

/** Số từ đã xếp vào từng ngày đến hạn (từ quá hạn tính vào `today`). */
export function loadByDay(
  reviews: Record<string, Record<string, ReviewEntry>> | undefined,
  today: string,
  skip?: { slug: string; word: string },
): Record<string, number> {
  const load: Record<string, number> = {};
  for (const [slug, words] of Object.entries(reviews ?? {}))
    for (const [word, e] of Object.entries(words ?? {})) {
      if (skip && skip.slug === slug && skip.word === word) continue;
      const day = e.due <= today ? today : e.due;
      load[day] = (load[day] ?? 0) + 1;
    }
  return load;
}

/**
 * Chọn ngày cho một lần ôn trong khoảng [from, to] ngày kể từ hôm nay: ngày NHẸ NHẤT
 * (hoà thì ngày sớm hơn), bỏ qua ngày đã đầy `cap`. Mọi ngày trong khoảng đều đầy thì
 * lấy ngày kế sau `to` còn chỗ — ôn không bao giờ dồn quá trần.
 */
export function pickDay(load: Record<string, number>, today: string, from: number, to: number, cap = DAILY_CAP): string {
  let best: string | null = null;
  let bestLoad = Infinity;
  for (let d = from; d <= to; d += 1) {
    const day = addDays(today, d);
    const n = load[day] ?? 0;
    if (n < cap && n < bestLoad) {
      best = day;
      bestLoad = n;
    }
  }
  if (best) return best;
  for (let d = to + 1; d < to + 60; d += 1) {
    const day = addDays(today, d);
    if ((load[day] ?? 0) < cap) return day;
  }
  return addDays(today, to);
}

/** Ngày muốn ôn là `ideal`: lấy ngày đó, nếu đầy thì ngày gần sau còn chỗ (trong 4 ngày). */
function firstOpenFrom(load: Record<string, number>, today: string, ideal: number, cap: number): string {
  for (let d = ideal; d <= ideal + 4; d += 1) {
    const day = addDays(today, d);
    if ((load[day] ?? 0) < cap) return day;
  }
  return addDays(today, ideal);
}

/**
 * Lịch ôn kế tiếp của một từ sau một lần trả lời.
 *
 * - Lần ĐẦU gặp (đúng): ôn lần đầu RẢI theo ngày nhẹ nhất trong 1…7 ngày tới — học 10 từ
 *   hôm nay thì 10 lần ôn trải ra cả tuần, không dồn về ngày mai.
 * - SAI: về hộp đầu, ôn lại sớm — ngày nhẹ nhất trong 1…2 ngày tới.
 * - Đúng khi ĐẾN HẠN: lên hộp, khoảng cách 1 → 2 → 4 → 7 → 15 → 30 → 60 ngày (ngày đầy thì lùi gần nhất).
 * - Ôn SỚM hoặc ôn lại trong cùng ngày: không đổi hộp / hạn, chỉ ghi lần ôn (học dồn không tính).
 *
 * `load` = số từ ĐÃ xếp vào từng ngày, KHÔNG gồm chính từ này (`loadByDay` với `skip`).
 */
export function nextReview(
  prev: ReviewEntry | undefined,
  correct: boolean,
  today: string,
  load: Record<string, number> = {},
  cap = DAILY_CAP,
): ReviewEntry {
  if (!correct) {
    // Sai lặp lại trong cùng ngày: giữ chỗ đã xếp, khỏi xáo lại.
    if (prev && prev.last === today && prev.box === 0 && prev.due > today && prev.due <= addDays(today, 2)) return prev;
    return { box: 0, due: pickDay(load, today, 1, 2, cap), last: today };
  }
  if (!prev) return { box: 0, due: pickDay(load, today, 1, SPREAD_DAYS, cap), last: today };
  // Đã ôn hôm nay rồi, hoặc ôn sớm: giữ nguyên hộp và hạn.
  if (prev.last === today || prev.due > today) return { ...prev, last: today };
  const box = Math.min(INTERVALS.length - 1, prev.box + 1);
  return { box, due: firstOpenFrom(load, today, INTERVALS[box]!, cap), last: today };
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


export type DayLoad = { day: string; count: number; /** Tổng dồn từ hôm nay tới ngày này. */ cumulative: number };

/** Như `forecast` nhưng thêm số dồn — dải 7 ngày "Hôm nay 12 · Mai 8 · …". */
export function upcomingLoad(reviews: Record<string, Record<string, ReviewEntry>> | undefined, today: string, days = 7): DayLoad[] {
  let cum = 0;
  return forecast(reviews, today, days).map((d) => {
    cum += d.count;
    return { ...d, cumulative: cum };
  });
}

/** Số từ đã xếp lịch (có ngày ôn) và số đến hạn hôm nay / mai / trong 7 ngày tới. */
export function scheduleSummary(reviews: Record<string, Record<string, ReviewEntry>> | undefined, today: string) {
  let scheduled = 0;
  let dueToday = 0;
  let tomorrow = 0;
  let week = 0;
  const tm = addDays(today, 1);
  const end = addDays(today, 7);
  for (const words of Object.values(reviews ?? {}))
    for (const e of Object.values(words ?? {})) {
      scheduled += 1;
      if (e.due <= today) dueToday += 1;
      else if (e.due === tm) tomorrow += 1;
      if (e.due <= end) week += 1;
    }
  return { scheduled, dueToday, tomorrow, week };
}

/** Ngày đến hạn sớm nhất của từng từ (khoá = từ viết thường) trong mọi bộ — cho nhãn "Đã lên lịch". */
export function dueDayByWord(reviews: Record<string, Record<string, ReviewEntry>> | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const words of Object.values(reviews ?? {}))
    for (const [w, e] of Object.entries(words ?? {})) {
      const k = w.trim().toLowerCase();
      const cur = out.get(k);
      if (!cur || e.due < cur) out.set(k, e.due);
    }
  return out;
}

/**
 * Dự báo hợp nhất N ngày tới: lịch Leitner của bộ từ + các ngày đến hạn của thẻ FSRS
 * KHÔNG nằm trong lịch Leitner (từ lưu lúc đọc báo…). Hôm nay gồm cả từ quá hạn.
 */
export function unifiedLoad(
  reviews: Record<string, Record<string, ReviewEntry>> | undefined,
  extraDueDays: readonly string[],
  today: string,
  days = 7,
): DayLoad[] {
  const base = forecast(reviews, today, days);
  for (const d of extraDueDays) {
    const i = d <= today ? 0 : base.findIndex((x) => x.day === d);
    if (i >= 0) base[i]!.count += 1;
  }
  let cum = 0;
  return base.map((d) => {
    cum += d.count;
    return { ...d, cumulative: cum };
  });
}
