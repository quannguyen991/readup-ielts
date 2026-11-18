import { setProgress, type LearnMode, type SetProgress, type StatMap } from './learn-status';

/**
 * "HÔM NAY HỌC GÌ" cho các trang luyện câu — chọn tối đa ba việc từ lịch sử làm bài thật:
 *   1. TIẾP TỤC bài đang học dở (gần nhất / nhiều câu đúng nhất trước);
 *   2. BÀI MỚI chưa đụng tới, dễ trước;
 *   3. THỬ THÁCH: bài chưa học ở mức khó hơn mức người học đã quen.
 * Không có số liệu bịa: nếu chưa làm gì thì chỉ có bài mới + thử thách.
 */

export type PlanSet = { id: string; title: string; level: string; ids: readonly string[]; href: string };
export type PlanItem = { kind: 'continue' | 'fresh' | 'challenge'; set: PlanSet; progress: SetProgress };

const LEVEL_RANK: Record<string, number> = { A1: 0, A2: 1, easy: 1, B1: 2, medium: 2, B2: 3, C1: 4, hard: 4, C2: 5 };
const rank = (l: string): number => LEVEL_RANK[l] ?? 2;

export function buildToday(sets: readonly PlanSet[], stats: StatMap, mode: LearnMode): PlanItem[] {
  const withP = sets.map((set) => ({ set, progress: setProgress(stats, mode, set.ids) }));
  const out: PlanItem[] = [];

  const learning = withP
    .filter((x) => x.progress.state === 'learning')
    .sort((a, b) => b.progress.learned - a.progress.learned);
  if (learning[0]) out.push({ kind: 'continue', ...learning[0] });

  const fresh = withP.filter((x) => x.progress.state === 'new').sort((a, b) => rank(a.set.level) - rank(b.set.level));
  const learnedRanks = withP.filter((x) => x.progress.state === 'learned').map((x) => rank(x.set.level));
  const known = learnedRanks.length ? Math.max(...learnedRanks) : -1;

  // Bài mới: mức vừa sức (bằng mức cao nhất đã học, hoặc dễ nhất nếu chưa học gì).
  const freshPick = fresh.find((x) => rank(x.set.level) <= Math.max(known, 1)) ?? fresh[0];
  if (freshPick) out.push({ kind: 'fresh', ...freshPick });

  const challenge = withP
    .filter((x) => x.progress.state !== 'learned' && rank(x.set.level) > Math.max(known, 1) && x.set.id !== freshPick?.set.id && x.set.id !== learning[0]?.set.id)
    .sort((a, b) => rank(a.set.level) - rank(b.set.level))[0];
  if (challenge) out.push({ kind: 'challenge', ...challenge });

  return out;
}
