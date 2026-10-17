import { LEVEL_LESSONS, type GrammarLevel } from './grammar-course';
import { MASTERED_AT } from './word-stats';

/**
 * Đề kiểm tra theo cấp độ ngữ pháp (A1 → C). Lấy câu từ đúng các bài của cấp đó, không dùng AI lúc chạy.
 *
 * Khoa học: câu hỏi được chọn vòng tròn qua các bài (mỗi bài một câu trước, rồi mới đến câu thứ hai),
 * để một đề phủ được nhiều bài thay vì dồn vào vài bài. Ngưỡng đạt là 80%, cùng mốc "thành thạo" của
 * thống kê từ vựng (MASTERED_AT), để app dùng một chuẩn thống nhất. Bài sai được ghi lại để ôn tiếp.
 *
 * Hàm thuần: không đọc store, nên test được bằng bộ test của Node.
 */

export const TEST_SIZE = 10;
export const PASS_PERCENT = MASTERED_AT;

export type LevelTestItem = { lessonId: string; q: string; options: string[]; answer: number };

export type LevelTestBest = { percent: number; at: string; attempts: number };
export type LevelTestRecord = Partial<Record<GrammarLevel, LevelTestBest>>;

/** FNV-1a 32 bit: băm chuỗi thành số, đủ để xáo trộn ổn định theo hạt giống. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Bộ sinh số giả ngẫu nhiên (mulberry32): cùng hạt giống thì cùng một dãy. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Chọn `size` câu của một cấp độ, phủ nhiều bài nhất có thể, thứ tự phụ thuộc hạt giống. */
export function buildLevelTest(level: GrammarLevel, seed: string, size = TEST_SIZE): LevelTestItem[] {
  const rand = rng(hashSeed(`${level}|${seed}`));
  const lessons = shuffle(LEVEL_LESSONS[level], rand);
  const rounds = Math.max(0, ...lessons.map((l) => l.questions.length));
  const picked: LevelTestItem[] = [];
  for (let r = 0; r < rounds && picked.length < size; r += 1) {
    for (const lesson of lessons) {
      if (picked.length >= size) break;
      const q = lesson.questions[r];
      if (q) picked.push({ lessonId: lesson.id, q: q.q, options: q.options, answer: q.answer });
    }
  }
  return shuffle(picked, rand);
}

export type LevelTestGrade = {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  /** Bài có câu trả lời sai, không trùng, theo thứ tự xuất hiện. */
  weakLessonIds: string[];
};

export function gradeLevelTest(items: LevelTestItem[], picks: (number | null)[]): LevelTestGrade {
  const total = items.length;
  let correct = 0;
  const weak: string[] = [];
  items.forEach((item, i) => {
    if (picks[i] === item.answer) correct += 1;
    else if (!weak.includes(item.lessonId)) weak.push(item.lessonId);
  });
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: total > 0 && percent >= PASS_PERCENT, weakLessonIds: weak };
}

/** Gộp kết quả hai máy: mỗi cấp giữ điểm cao hơn; số lần làm lấy số lớn hơn. */
export function mergeLevelTests(local: LevelTestRecord, remote: LevelTestRecord): LevelTestRecord {
  const out: LevelTestRecord = { ...(local ?? {}) };
  for (const level of Object.keys(remote ?? {}) as GrammarLevel[]) {
    const r = remote?.[level];
    if (!r) continue;
    const l = out[level];
    const attempts = Math.max(l?.attempts ?? 0, r.attempts);
    if (!l || r.percent > l.percent || (r.percent === l.percent && r.at > l.at)) out[level] = { ...r, attempts };
    else out[level] = { ...l, attempts };
  }
  return out;
}
