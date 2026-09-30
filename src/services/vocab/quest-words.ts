/**
 * NGUỒN TỪ CỦA QUEST (Toa Từ Vựng, câu cá trong Thành phố) — hàm thuần.
 *
 * Người dùng 30/09/2026: "tất cả phần học đang đều dữ liệu giả thôi, bạn xem
 * vocab các thứ có thể chọn và học theo". Trước đây hai trò này tự lấy "từ đang
 * học" và không ghi lại gì vào lịch ôn. Giờ người học CHỌN bộ từ:
 *
 * - `auto`: từ đang học dở ở mọi bộ (như cũ);
 * - `due`: các từ đến hạn ôn hôm nay (lịch Leitner của bộ từ);
 * - `<slug bộ>`: đúng một bộ — sổ từ, bộ tự tạo, chủ đề IELTS, bài SAT.
 *
 * Mỗi từ hỏi mang theo `slug` của bộ để màn chơi ghi kết quả vào
 * `useTopicStudyStore.review(slug, word, đúng)` — trả lời trong Quest là ôn thật.
 */
import type { QuizWord } from '@/services/city/life';
import { dueBySlug, type ReviewEntry } from './review-schedule';

export type QuestSource = 'auto' | 'due' | (string & {});

export type QuestDeck = { slug: string; name: string; group: 'mine' | 'ielts' | 'sat'; words: readonly QuizWord[] };

export type SlugWord = QuizWord & { slug: string };

export type QuestWords = {
  /** Từ sẽ được hỏi. */
  focus: SlugWord[];
  /** Kho làm phương án nhiễu (luôn đủ lớn). */
  pool: QuizWord[];
  /** Tên nguồn để hiện trên nút chọn. */
  label: string;
  /** Nguồn thật đang dùng (chọn bộ đã bị xoá thì lùi về `auto`). */
  source: QuestSource;
};

/** Kho nhiễu tối thiểu: ít hơn thì thêm từ các bộ IELTS đầu. */
export const MIN_POOL = 40;

function withFallback(pool: QuizWord[], decks: readonly QuestDeck[]): QuizWord[] {
  if (pool.length >= MIN_POOL) return pool;
  const out = [...pool];
  for (const d of decks.filter((x) => x.group === 'ielts').slice(0, 3)) out.push(...d.words);
  return out;
}

export function questWords(
  source: QuestSource,
  decks: readonly QuestDeck[],
  stages: Record<string, Record<string, unknown>> | undefined,
  reviews: Record<string, Record<string, ReviewEntry>> | undefined,
  today: string,
): QuestWords {
  const bySlug = new Map(decks.map((d) => [d.slug, d]));

  if (source === 'due') {
    const due = dueBySlug(reviews, today);
    const focus: SlugWord[] = [];
    const pool: QuizWord[] = [];
    for (const [slug, words] of Object.entries(due)) {
      const d = bySlug.get(slug);
      if (!d) continue;
      pool.push(...d.words);
      const want = new Set(words);
      for (const w of d.words) if (want.has(w.word)) focus.push({ ...w, slug });
    }
    return { focus, pool: withFallback(pool, decks), label: `Ôn hôm nay · ${focus.length} từ`, source };
  }

  if (source !== 'auto') {
    const d = bySlug.get(source);
    if (d && d.words.length >= 4) {
      return { focus: d.words.map((w) => ({ ...w, slug: d.slug })), pool: withFallback([...d.words], decks), label: `${d.name} · ${d.words.length} từ`, source };
    }
  }

  // Tự động: từ đang học dở ở mọi bộ; chưa học gì thì cả ba bộ IELTS đầu.
  const focus: SlugWord[] = [];
  const pool: QuizWord[] = [];
  for (const [slug, words] of Object.entries(stages ?? {})) {
    const d = bySlug.get(slug);
    if (!d) continue;
    pool.push(...d.words);
    const learning = new Set(Object.keys(words ?? {}));
    for (const w of d.words) if (learning.has(w.word)) focus.push({ ...w, slug });
  }
  if (focus.length === 0)
    for (const d of decks.filter((x) => x.group === 'ielts').slice(0, 3)) focus.push(...d.words.map((w) => ({ ...w, slug: d.slug })));
  return { focus, pool: withFallback(pool, decks), label: 'Tự động · từ đang học', source: 'auto' };
}

/** Số từ đến hạn hôm nay (cho nhãn "Ôn hôm nay"). */
export function dueCount(reviews: Record<string, Record<string, ReviewEntry>> | undefined, today: string): number {
  return Object.values(dueBySlug(reviews, today)).reduce((a, w) => a + w.length, 0);
}
