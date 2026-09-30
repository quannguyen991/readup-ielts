/**
 * CHUYỂN TIẾN ĐỘ khi bài từ vựng SAT Math đổi cấu trúc (29/09/2026: 12 bài cắt
 * nhỏ 6–8 từ → 6 bài, mỗi mảng một bài 32 từ; mã `sat-math-bai-N` đổi nghĩa).
 *
 * - Tiến độ THEO TỪ (chặng nhớ, đánh sao, số lần quên) dời sang đúng bài đang
 *   chứa từ đó — độ thuộc từ của người học không mất.
 * - Điểm theo BÀI (điểm trò chơi, điểm quiz) của bài Math làm TRƯỚC mốc đổi thì
 *   bỏ: đó là điểm trên bài 6–8 từ, giữ lại sẽ hiện "đã đạt" sai cho bài 32 từ.
 *
 * Thuần, chạy lại bao nhiêu lần cũng cho cùng kết quả (dữ liệu đã chuyển thì
 * không đổi nữa) — gọi được cả lúc nạp máy lẫn lúc đồng bộ.
 */
import { SAT_MATH_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';

export const SAT_MATH_RESHUFFLE_AT = '2026-09-29T16:18:30.000Z';

const isMath = (slug: string) => /^sat-math-bai-\d+$/.test(slug);

let wordHome: Map<string, string> | null = null;
let lessonWords: Map<string, Set<string>> | null = null;
function maps() {
  if (!wordHome || !lessonWords) {
    wordHome = new Map();
    lessonWords = new Map();
    for (const l of SAT_MATH_VOCAB_LESSONS) {
      lessonWords.set(l.slug, new Set(l.words.map((w) => w.word)));
      for (const w of l.words) if (!wordHome.has(w.word)) wordHome.set(w.word, l.slug);
    }
  }
  return { wordHome, lessonWords };
}

/** Bài đúng của một từ đang lưu dưới `slug` (giữ nguyên nếu từ vẫn thuộc bài đó). */
function homeOf(slug: string, word: string): string {
  const { wordHome, lessonWords } = maps();
  if (lessonWords.get(slug)?.has(word)) return slug;
  return wordHome.get(word) ?? slug;
}

function remapPerWord<V>(rec: Record<string, Record<string, V>> | undefined, pick: (a: V, b: V) => V): Record<string, Record<string, V>> | undefined {
  if (!rec) return rec;
  const out: Record<string, Record<string, V>> = {};
  for (const [slug, words] of Object.entries(rec)) {
    for (const [word, v] of Object.entries(words ?? {})) {
      const to = isMath(slug) ? homeOf(slug, word) : slug;
      const bucket = (out[to] ??= {});
      bucket[word] = word in bucket ? pick(bucket[word]!, v) : v;
    }
  }
  return out;
}

type TopicLike = {
  stages?: Record<string, Record<string, number>>;
  lapses?: Record<string, Record<string, number>>;
  starred?: Record<string, string[]>;
  scores?: Record<string, { score: number; at: string }[]>;
  reviews?: Record<string, Record<string, { box: number; due: string; last: string }>>;
};

export function remapTopicStudy<T extends TopicLike>(p: T): T {
  if (!p) return p;
  const starredAsRec = p.starred ? Object.fromEntries(Object.entries(p.starred).map(([s, list]) => [s, Object.fromEntries((list ?? []).map((w) => [w, true]))])) : undefined;
  const starred = remapPerWord(starredAsRec, (a) => a);
  const scores = p.scores
    ? Object.fromEntries(
        Object.entries(p.scores)
          .map(([slug, list]) => [slug, isMath(slug) ? (list ?? []).filter((x) => (x.at ?? '') >= SAT_MATH_RESHUFFLE_AT) : list] as const)
          .filter(([, list]) => (list ?? []).length > 0),
      )
    : p.scores;
  // Chỉ ghi những trường vốn có: bản lưu trống không được biến thành `stages: undefined`
  // (lúc gộp `{ ...current, ...p }` sẽ đè mất giá trị mặc định `{}`).
  const out: T = { ...p };
  if (p.stages) out.stages = remapPerWord(p.stages, (a, b) => Math.max(a, b));
  if (p.lapses) out.lapses = remapPerWord(p.lapses, (a, b) => a + b);
  if (p.reviews) out.reviews = remapPerWord(p.reviews, (a, b) => (a.last >= b.last ? a : b));
  if (p.starred && starred) out.starred = Object.fromEntries(Object.entries(starred).map(([s, m]) => [s, Object.keys(m)]));
  if (p.scores) out.scores = scores;
  return out;
}

/** Điểm quiz SAT Math làm trước mốc đổi cấu trúc thì bỏ. */
export function dropOldMathQuiz<B extends { at: string }>(best: Record<string, B> | undefined): Record<string, B> {
  const out: Record<string, B> = {};
  for (const [key, v] of Object.entries(best ?? {})) {
    const slug = key.split(':')[0] ?? '';
    if (isMath(slug) && (v.at ?? '') < SAT_MATH_RESHUFFLE_AT) continue;
    out[key] = v;
  }
  return out;
}
