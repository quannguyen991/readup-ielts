/**
 * LỊCH ÔN THEO NGÀY cho bộ từ chủ đề (kiểu hộp Leitner) — hàm thuần.
 *
 * Mỗi từ có một HỘP và một NGÀY ĐẾN HẠN:
 *
 * - Trả lời ĐÚNG khi từ đã đến hạn → lên một hộp, khoảng cách giãn ra
 *   1 → 2 → 4 → 7 → 15 → 30 → 60 → 120 → 240 ngày.
 * - Ôn SỚM (chưa đến hạn) mà đúng → không lên hộp (học dồn không được tính), chỉ ghi lần ôn.
 * - Mỗi ngày một từ lên tối đa một hộp — làm đúng 5 lần trong một buổi vẫn chỉ là một lần nhớ.
 * - Trả lời SAI → rớt hộp (từ mới → hộp đầu; từ đã nhớ lâu rớt một nửa), ôn lại sớm trong 1–2 ngày.
 *
 * CÂN TẢI KHÔNG ĐƯỢC LÀM TRỄ LẦN ÔN. Bản trước 02/10/2026 rải lần ôn đầu của từ mới "đều 7 ngày" và giữ mỗi
 * ngày ≤ 15 từ: với 10 từ mới mỗi ngày, sau ~2 tuần mọi ngày gần đã đầy và lần ôn đầu bị đẩy trung bình
 * ~38 ngày (đường cong quên: sau ngày đầu đã mất phần lớn). Bản này: lần ôn đầu rơi vào ngày 1 (tối đa ngày 2
 * khi ngày 1 đã đầy); các hộp sau chỉ được xê dịch trong cửa sổ ±13% quanh khoảng cách chuẩn để dàn tải, và trần
 * mỗi ngày chỉ là ngưỡng "ưu tiên ngày còn chỗ" — không bao giờ đẩy một lần ôn ra khỏi cửa sổ của nó quá vài ngày.
 *
 * Ngày tính bằng khoá YYYY-MM-DD theo giờ máy (cùng `dateKey` của app).
 */

export const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120, 240] as const;

export type ReviewEntry = { box: number; due: string; last: string };

export function addDays(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

/** Trần mềm: số từ đến hạn mỗi ngày mà bộ cân tải cố giữ (ưu tiên ngày còn chỗ trong cửa sổ). */
export const DAILY_CAP = 40;

/** Cửa sổ [sớm nhất, muộn nhất] (số ngày kể từ lần ôn này) cho khoảng cách chuẩn `ideal`. */
export function windowOf(ideal: number): [number, number] {
  if (ideal <= 1) return [1, 2];
  if (ideal === 2) return [2, 3];
  if (ideal <= 4) return [ideal - 1, ideal + 1];
  return [Math.max(1, Math.round(ideal * 0.87)), Math.round(ideal * 1.13)];
}

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
 * Chọn ngày cho một lần ôn trong cửa sổ [from, to] (số ngày kể từ hôm nay), `ideal` là ngày chuẩn.
 * - Ôn ngắn (ideal ≤ 2, lúc còn đang nhớ vội): lấy ngày SỚM nhất, tính từ `ideal`; chỉ nhường sang ngày sau khi ngày đó đã quá 2,5× trần (học dồn cả trăm từ).
 * - Ôn dài: lấy ngày NHẸ nhất trong cửa sổ (hoà thì gần `ideal` hơn rồi sớm hơn) để dàn đều tải.
 * - Cửa sổ đầy hết: nới sang SAU `to` đến ngày đầu tiên còn chỗ, tối đa thêm `max(2, 25% của to)` ngày; vẫn đầy thì
 *   lấy ngày ít việc nhất trong khoảng đó. Không bao giờ đẩy xa hơn thế.
 */
export function pickDay(load: Record<string, number>, today: string, from: number, to: number, cap = DAILY_CAP, ideal = from): string {
  const count = (d: number) => load[addDays(today, d)] ?? 0;
  if (ideal <= 2) {
    // Giai đoạn đầu quý nhất: chỉ nhường ngày khi một ngày đã quá nặng (đợt học dồn hàng trăm từ), không theo trần thường.
    const burst = cap * 2.5;
    for (let d = Math.max(from, ideal); d <= to; d += 1) if (count(d) < burst) return addDays(today, d);
  } else {
    let best = -1;
    for (let d = from; d <= to; d += 1) {
      if (count(d) >= cap) continue;
      if (best < 0 || count(d) < count(best) || (count(d) === count(best) && Math.abs(d - ideal) < Math.abs(best - ideal))) best = d;
    }
    if (best >= 0) return addDays(today, best);
  }
  const stretch = Math.max(2, Math.ceil(to * 0.25));
  for (let d = to + 1; d <= to + stretch; d += 1) if (count(d) < cap) return addDays(today, d);
  let best = to;
  for (let d = from; d <= to + stretch; d += 1) if (count(d) < count(best)) best = d;
  return addDays(today, best);
}

/** Hộp mới sau một lần SAI: từ mới về hộp đầu; từ đã nhớ lâu chỉ rớt một nửa (một lần bấm nhầm không xoá cả tuần học). */
export function lapseBox(box: number): number {
  return Math.max(0, Math.floor(box / 2) - 1);
}

/**
 * Lịch ôn kế tiếp của một từ sau một lần trả lời.
 *
 * - Lần ĐẦU gặp (đúng): ôn lần đầu NGÀY MAI (ngày kia nếu mai đã đầy trần).
 * - SAI: rớt hộp (`lapseBox`), ôn lại trong 1–2 ngày.
 * - Đúng khi ĐẾN HẠN: lên hộp, khoảng cách 1 → 2 → 4 → 7 → 15 → 30 → 60 → 120 → 240 ngày, dàn tải trong cửa sổ.
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
    // Sai lặp lại trong cùng ngày: giữ chỗ đã xếp, khỏi xáo lại (và không rớt hộp lần hai).
    if (prev && prev.last === today && prev.due > today && prev.due <= addDays(today, 2)) return prev;
    return { box: prev ? lapseBox(prev.box) : 0, due: pickDay(load, today, 1, 2, cap, 1), last: today };
  }
  if (!prev) return { box: 0, due: pickDay(load, today, 1, 2, cap, 1), last: today };
  // Đã ôn hôm nay rồi, hoặc ôn sớm: giữ nguyên hộp và hạn.
  if (prev.last === today || prev.due > today) return { ...prev, last: today };
  const box = Math.min(INTERVALS.length - 1, prev.box + 1);
  const ideal = INTERVALS[box]!;
  const [lo, hi] = windowOf(ideal);
  return { box, due: pickDay(load, today, lo, hi, cap, ideal), last: today };
}

/**
 * SỬA lịch đã lưu bởi bản cũ (lần ôn bị đẩy xa quá cửa sổ của hộp): kéo `due` về không muộn hơn
 * `last + cửa sổ muộn nhất + 2`; từ vì thế đến hạn thì xếp từ hôm nay, mỗi ngày tối đa `cap`, từ chờ lâu nhất trước.
 * Lũy đẳng: chạy lại không đổi gì. Trả về chính `reviews` nếu không có gì phải sửa.
 */
export function repairReviews(
  reviews: Record<string, Record<string, ReviewEntry>> | undefined,
  today: string,
  cap = DAILY_CAP,
): Record<string, Record<string, ReviewEntry>> {
  const src = reviews ?? {};
  const late: { slug: string; word: string; e: ReviewEntry; was: string }[] = [];
  for (const [slug, words] of Object.entries(src))
    for (const [word, e] of Object.entries(words ?? {})) {
      const box = Math.min(INTERVALS.length - 1, Math.max(0, Math.floor(e.box) || 0));
      const maxDue = addDays(e.last, windowOf(INTERVALS[box]!)[1] + 2);
      if (e.due > maxDue && e.due > addDays(today, 2)) late.push({ slug, word, e: { ...e, due: maxDue }, was: e.due });
    }
  if (!late.length) return reviews ?? {};
  const out: Record<string, Record<string, ReviewEntry>> = {};
  for (const [slug, words] of Object.entries(src)) out[slug] = { ...(words ?? {}) };
  const load = loadByDay(out, today);
  // gỡ các từ cần sửa khỏi bảng tải (theo hạn cũ), rồi xếp lại theo thứ tự chờ lâu nhất trước
  for (const x of late) {
    const day = x.was <= today ? today : x.was;
    load[day] = Math.max(0, (load[day] ?? 0) - 1);
  }
  late.sort((a, b) => a.e.due.localeCompare(b.e.due) || a.e.last.localeCompare(b.e.last));
  for (const x of late) {
    let due = x.e.due;
    if (due <= today) {
      let d = 0;
      while ((load[addDays(today, d)] ?? 0) >= cap && d < 60) d += 1;
      due = addDays(today, d);
    }
    const key = due <= today ? today : due;
    load[key] = (load[key] ?? 0) + 1;
    out[x.slug]![x.word] = { ...x.e, due };
  }
  return out;
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
