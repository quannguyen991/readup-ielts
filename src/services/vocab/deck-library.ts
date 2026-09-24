/**
 * THƯ VIỆN BỘ TỪ — số liệu cho thẻ bộ từ ở trang Quiz từ vựng: đã nhớ bao nhiêu,
 * đang học bao nhiêu, học lần cuối lúc nào. Hàm thuần để test được.
 *
 * ĐẾM THEO DANH SÁCH TỪ CỦA BỘ, không đếm mọi khoá trong `stages`: sổ từ và bộ tự
 * tạo đổi danh sách theo thời gian, một từ đã xoá khỏi bộ không được tính là "đã nhớ".
 */

/** Chặng của một từ: 0 chưa học, 1 nhận ra, 2 nhớ được (`services/vocab/topic-study`). */
type Stage = 0 | 1 | 2;

export type DeckProgress = {
  /** Số từ đã nhớ được (chặng 2). */
  mastered: number;
  /** Số từ đang học dở (chặng 1). */
  learning: number;
  total: number;
  /** Lần cuối mở một màn luyện của bộ này, hoặc null nếu chưa bao giờ. */
  lastAt: string | null;
};

export function deckProgress(
  words: readonly { word: string }[],
  stages: Readonly<Record<string, Stage>> | undefined,
  lastAt: string | null | undefined,
): DeckProgress {
  let mastered = 0;
  let learning = 0;
  for (const w of words) {
    const s = stages?.[w.word] ?? 0;
    if (s === 2) mastered += 1;
    else if (s === 1) learning += 1;
  }
  return { mastered, learning, total: words.length, lastAt: lastAt ?? null };
}

/** Bộ đang học: đã mở một màn luyện, hoặc đã có từ nhận ra / nhớ được. */
export function isInProgress(p: DeckProgress): boolean {
  return p.lastAt !== null || p.mastered + p.learning > 0;
}

/** Xếp bộ học gần nhất lên đầu; bộ chưa có mốc thời gian đứng sau, giữ thứ tự cũ. */
export function byRecent<T>(items: readonly T[], lastAt: (item: T) => string | null): T[] {
  return items
    .map((item, i) => ({ item, i, at: lastAt(item) }))
    .sort((a, b) => (a.at && b.at ? b.at.localeCompare(a.at) : a.at ? -1 : b.at ? 1 : a.i - b.i))
    .map((x) => x.item);
}

/** "Học lần cuối": vừa xong · 12 phút trước · 18 giờ trước · 3 ngày trước · 2 tuần trước · 4 tháng trước. */
export function relativeTimeVi(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'chưa học';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'chưa học';
  const minutes = Math.floor(Math.max(0, now.getTime() - then) / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

/** Bỏ dấu tiếng Việt để tìm "moi truong" vẫn ra "Môi trường". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
