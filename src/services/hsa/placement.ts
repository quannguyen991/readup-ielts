import type { HsaLevel, HsaQuestion } from '@/data/hsa';
import { CRITERIA, KIND_CRITERION, type CriterionId } from './criteria';

/**
 * Bài test đầu vào: năm phần, mỗi phần đo một tiêu chí chấm. Chọn cố định (không ngẫu nhiên) để mọi
 * người làm cùng một bộ câu, và lần test lại so được với lần trước.
 */
export type PlacementSection = { id: CriterionId; questions: HsaQuestion[]; seconds: number };

const RANK: Record<HsaLevel, number> = { A2: 0, B1: 1, B2: 2, C1: 3 };
const PER_QUESTION_SECONDS = 75;

const byLevelThenId = (a: HsaQuestion, b: HsaQuestion) => RANK[a.level] - RANK[b.level] || a.id.localeCompare(b.id);

/** Lấy lần lượt từ từng dạng câu để một phần không dồn vào một dạng. */
function roundRobin(items: readonly HsaQuestion[], n: number): HsaQuestion[] {
  const groups = new Map<string, HsaQuestion[]>();
  for (const q of [...items].sort(byLevelThenId)) groups.set(q.kind, [...(groups.get(q.kind) ?? []), q]);
  const lists = [...groups.values()];
  const out: HsaQuestion[] = [];
  for (let i = 0; out.length < n && lists.some((l) => i < l.length); i += 1) {
    for (const l of lists) if (i < l.length && out.length < n) out.push(l[i]!);
  }
  return out;
}

/** Hai câu mức thấp (A2/B1), hai câu B2, hai câu C1; thiếu mức nào thì bù từ phần còn lại. */
function pickSpread(pool: readonly HsaQuestion[], count: number): HsaQuestion[] {
  const chosen: HsaQuestion[] = [];
  const take = (items: readonly HsaQuestion[], n: number) => {
    for (const q of roundRobin(items.filter((x) => !chosen.includes(x)), n)) chosen.push(q);
  };
  take(pool.filter((q) => RANK[q.level] <= 1), 2);
  take(pool.filter((q) => q.level === 'B2'), 2);
  take(pool.filter((q) => q.level === 'C1'), 2);
  if (chosen.length < count) take(pool, count - chosen.length);
  return chosen.slice(0, count);
}

/** Phần Đọc hiểu: một chùm năm câu chung bài đọc (chùm vừa sức nhất ở giữa) và một câu ngoài chùm. */
function pickReading(pool: readonly HsaQuestion[]): HsaQuestion[] {
  const clusters = new Map<string, HsaQuestion[]>();
  for (const q of pool) {
    if (q.kind !== 'reading-comprehension' || !q.context) continue;
    clusters.set(q.context, [...(clusters.get(q.context) ?? []), q]);
  }
  const whole = [...clusters.values()].filter((c) => c.length === 5);
  const mean = (c: readonly HsaQuestion[]) => c.reduce((s, q) => s + RANK[q.level], 0) / c.length;
  whole.sort((a, b) => mean(a) - mean(b) || a[0]!.id.localeCompare(b[0]!.id));
  const cluster = whole[Math.floor(whole.length / 2)] ?? [];
  const extra = [...pool].filter((q) => q.kind !== 'reading-comprehension' && q.kind !== 'cloze').sort(byLevelThenId);
  const single = extra.find((q) => q.level === 'B2') ?? extra[0];
  return [...cluster, ...(single ? [single] : [])];
}

export function buildPlacement(bank: readonly HsaQuestion[]): PlacementSection[] {
  return CRITERIA.map((c) => {
    const pool = bank.filter((q) => KIND_CRITERION[q.kind] === c.id);
    const questions = c.id === 'reading' ? pickReading(pool) : pickSpread(pool, 6);
    return { id: c.id, questions, seconds: Math.ceil(questions.length * PER_QUESTION_SECONDS) };
  });
}

/** Mã hoạt động ghi vào lượt làm bài, để biết lượt nào là phần test đầu vào nào. */
export const placementActivity = (id: CriterionId): string => `placement:${id}`;

export function placementIdOf(activity: string): CriterionId | null {
  if (!activity.startsWith('placement:')) return null;
  const id = activity.slice('placement:'.length);
  return CRITERIA.some((c) => c.id === id) ? (id as CriterionId) : null;
}
