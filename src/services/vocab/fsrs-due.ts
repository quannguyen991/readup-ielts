/**
 * ĐẾM TỪ ĐẾN HẠN — một định nghĩa duy nhất cho mọi màn và cho cả máy chủ (trang chủ, trang Ôn, khối "Ôn hôm nay",
 * nút "Ôn ngay", quest du lịch, lời nhắc đẩy).
 *
 * Một từ đến hạn khi có ít nhất một thẻ FSRS đến hạn tới HẾT ngày đang xét (không chỉ tới đúng giờ hiện tại).
 * Không đọc lịch Leitner cũ: nó không còn được ghi nên đứng yên và lệch với lịch thật.
 *
 * Module THUẦN, không import dữ liệu bộ từ: máy chủ (cron nhắc ôn) dùng được mà không kéo cả kho từ vựng vào hàm.
 * Việc "mã này có phải bộ học được không" do nơi gọi truyền vào.
 */
import type { VocabEntry } from '@/store/useVocabStore';
import { addDays } from './review-schedule';
import { CARD_KINDS, cardKey, type StoredCard } from './schedule';

export type VocabSlice = { entries: Record<string, VocabEntry>; cards: Record<string, StoredCard> };

/** Mã bộ "Sổ từ" (trùng `NOTEBOOK_SLUG` ở `data/study-decks`, có test giữ cho hai chỗ khớp nhau). */
export const NOTEBOOK_DECK = 'so-tu';

const dayKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Cuối ngày `now` theo giờ máy. */
export function endOfDayMs(now: Date): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Ngày đến hạn sớm nhất trong bốn thẻ của một mục; null nếu mục chưa có thẻ nào. */
function earliestDue(state: VocabSlice, e: VocabEntry): Date | null {
  let best: number | null = null;
  for (const kind of CARD_KINDS) {
    const c = state.cards[cardKey(e.id, kind)];
    if (!c) continue;
    const t = new Date(c.due).getTime();
    best = best === null ? t : Math.min(best, t);
  }
  return best === null ? null : new Date(best);
}

/** Các mục có thẻ đến hạn không muộn hơn `endMs` (mili giây). */
export function dueEntriesBefore(state: VocabSlice, endMs: number): VocabEntry[] {
  return Object.values(state.entries ?? {}).filter((e) => {
    const d = earliestDue(state, e);
    return d !== null && d.getTime() <= endMs;
  });
}

/** Các mục đến hạn ôn tới hết hôm nay. */
export function dueEntriesToday(state: VocabSlice, now: Date): VocabEntry[] {
  return dueEntriesBefore(state, endOfDayMs(now));
}

/** Từ đến hạn tới `endMs`, gom theo mã bộ do `deckOf` quyết định (từ lưu lúc đọc bài… vào `NOTEBOOK_DECK`). */
export function dueBySlugBefore(state: VocabSlice, endMs: number, deckOf: (e: VocabEntry) => string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of dueEntriesBefore(state, endMs)) {
    (out[deckOf(e)] ??= []).push(String(e.lemma ?? e.word ?? '').trim().toLowerCase());
  }
  return out;
}

/**
 * Như `dueBySlugBefore` nhưng gộp mọi cấp (`bộ--B1`, `bộ--all`) về bộ gốc và bỏ từ trùng — cho nơi chỉ biết bộ gốc
 * (quest, du lịch). Mục không thuộc bộ nào bị bỏ qua.
 */
export function dueByBaseDeck(
  state: VocabSlice,
  endMs: number,
  baseDeckOf: (e: VocabEntry) => string | null,
): Record<string, string[]> {
  const sets: Record<string, Set<string>> = {};
  for (const e of dueEntriesBefore(state, endMs)) {
    const base = baseDeckOf(e);
    if (!base) continue;
    const set = (sets[base] ??= new Set());
    set.add(String(e.lemma ?? e.word ?? '').trim().toLowerCase());
    set.add(String(e.word ?? e.lemma ?? '').trim().toLowerCase());
  }
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, [...v]]));
}

/** Dự báo `days` ngày tới theo thẻ FSRS: mỗi từ tính vào ngày thẻ đến hạn sớm nhất; quá hạn tính vào hôm nay. */
export function forecastFsrs(state: VocabSlice, now: Date, days = 7, only?: (e: VocabEntry) => boolean): { day: string; count: number }[] {
  const today = dayKeyOf(now);
  const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i), count: 0 }));
  for (const e of Object.values(state.entries)) {
    if (only && !only(e)) continue;
    const d = earliestDue(state, e);
    if (!d) continue;
    const key = dayKeyOf(d);
    const i = key <= today ? 0 : out.findIndex((x) => x.day === key);
    if (i >= 0) out[i]!.count += 1;
  }
  return out;
}

/** Khoá so khớp của một mục: dạng gốc và dạng đã lưu, chữ thường. */
function keysOf(e: VocabEntry): string[] {
  const lemma = String(e.lemma ?? e.word ?? '').trim().toLowerCase();
  const word = String(e.word ?? e.lemma ?? '').trim().toLowerCase();
  return lemma === word ? [lemma] : [lemma, word];
}

/**
 * Mọi từ (chữ thường) đang đến hạn tới `endMs`. Một từ chỉ có MỘT mục dùng chung cho mọi bộ (mục giữ `articleId`
 * của nơi tạo ra nó đầu tiên), nên khớp một bộ phải đi theo DANH SÁCH TỪ CỦA BỘ, không theo `articleId`.
 */
export function dueLemmasBefore(state: VocabSlice, endMs: number): Set<string> {
  const out = new Set<string>();
  for (const e of dueEntriesBefore(state, endMs)) for (const k of keysOf(e)) out.add(k);
  return out;
}

export function dueLemmasToday(state: VocabSlice, now: Date): Set<string> {
  return dueLemmasBefore(state, endOfDayMs(now));
}

/**
 * Mọi từ (chữ thường) đã được hỏi ít nhất một lần: có thẻ đã ôn (`reps` > 0), đúng hay sai. Mục chỉ được lưu vào sổ
 * mà chưa trả lời lần nào thì không tính. Không phụ thuộc mục được tạo ở bộ nào.
 */
export function studiedLemmas(state: VocabSlice): Set<string> {
  const out = new Set<string>();
  for (const e of Object.values(state.entries ?? {})) {
    const reviewed = CARD_KINDS.some((kind) => (state.cards[cardKey(e.id, kind)]?.reps ?? 0) > 0);
    if (reviewed) for (const k of keysOf(e)) out.add(k);
  }
  return out;
}

/** Mục này có nằm trong tập từ (chữ thường) không — để lọc dự báo theo danh sách từ của một bộ. */
export function entryInWords(e: VocabEntry, words: ReadonlySet<string>): boolean {
  return keysOf(e).some((k) => words.has(k));
}
