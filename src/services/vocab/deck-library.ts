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

/**
 * `studied`: các từ (viết thường) đã được hỏi ít nhất một lần theo lịch ôn FSRS, kể cả khi trả lời sai.
 * Trả lời sai một từ chưa học không đẩy chặng lên (vẫn 0), nên không có tập này thì từ đó không bao giờ
 * hiện vào thanh tiến độ dù đã có lịch ôn. Từ có trong tập mà chặng 0 được tính là "đang học".
 */
export function deckProgress(
  words: readonly { word: string }[],
  stages: Readonly<Record<string, Stage>> | undefined,
  lastAt: string | null | undefined,
  studied?: ReadonlySet<string>,
): DeckProgress {
  let mastered = 0;
  let learning = 0;
  for (const w of words) {
    const s = stages?.[w.word] ?? 0;
    if (s === 2) mastered += 1;
    else if (s === 1 || studied?.has(w.word.trim().toLowerCase())) learning += 1;
  }
  return { mastered, learning, total: words.length, lastAt: lastAt ?? null };
}

/**
 * GỘP TIẾN ĐỘ CÁC CẤP VỀ BỘ GỐC. Bộ nhiều cấp (IELTS B1–C2, Oxford A1–C1) học qua từng cấp riêng, tiến độ
 * ghi dưới mã `<bộ>--B1`, `<bộ>--all`…; thẻ của bộ gốc ở thư viện phải thấy tổng của chúng, nếu không học bao nhiêu
 * thanh vẫn đứng yên. `baseOf` đổi mã bất kỳ về mã bộ gốc. Từ ở nhiều mã thì lấy chặng cao nhất.
 */
export function mergeStagesByBase<T extends number = Stage>(
  stages: Readonly<Record<string, Readonly<Record<string, T>>>>,
  baseOf: (slug: string) => string,
): Record<string, Record<string, T>> {
  const out: Record<string, Record<string, T>> = {};
  for (const [slug, words] of Object.entries(stages)) {
    const base = baseOf(slug);
    const into = (out[base] ??= {});
    for (const [word, stage] of Object.entries(words ?? {})) {
      if ((into[word] ?? 0) < stage) into[word] = stage;
    }
  }
  return out;
}

/** Mốc học gần nhất của bộ gốc = mốc mới nhất trong các cấp của nó. */
export function mergeLastAtByBase(lastAt: Readonly<Record<string, string>>, baseOf: (slug: string) => string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, at] of Object.entries(lastAt)) {
    const base = baseOf(slug);
    if (!out[base] || at > out[base]!) out[base] = at;
  }
  return out;
}

/** Phần trăm "đã học" của bộ: từ đã nhớ cộng từ đang học, trên tổng số từ. Thanh tiến độ và vòng % dùng chung số này. */
export function studiedPct(p: Pick<DeckProgress, 'mastered' | 'learning' | 'total'>): number {
  return p.total > 0 ? Math.round(((p.mastered + p.learning) / p.total) * 100) : 0;
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
