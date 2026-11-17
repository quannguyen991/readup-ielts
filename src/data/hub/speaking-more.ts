import GT_JSON from './speaking-gt.json';
import MOCK_JSON from './speaking-mocks.json';
import type { SpeakingExtra, SpeakingTopic } from './speaking-topics';

/**
 * Hai kho đề luyện nói bổ sung (sinh bằng scripts/hub/gen-speaking-more.mjs, gộp bằng merge-speaking-more.mjs):
 *   - đề thi thử IELTS Speaking đủ ba Part, có đáp án mẫu;
 *   - đề luyện nói GIAO TIẾP theo nhóm tình huống, có ý bắt buộc, mẫu câu và bài mẫu.
 */

export type MockTest = {
  id: string;
  title: string;
  titleVi: string;
  focusVi: string;
  part1: { topic: string; qs: string[] }[];
  part2: { prompt: string; bullets: string[] };
  part3: string[];
  answers: { p1: string[]; sample: string; p3: string[] };
};

export const MOCK_TESTS = MOCK_JSON as unknown as MockTest[];

export function mockById(id: string): MockTest | undefined {
  return MOCK_TESTS.find((m) => m.id === id);
}

/** Đề thi thử → chủ đề giả để dùng chung màn luyện: 8 câu Part 1, một cue card, 5 câu Part 3. */
export function mockAsTopic(m: MockTest): SpeakingTopic {
  return {
    id: m.id,
    title: m.title,
    titleVi: m.titleVi,
    tipVi: m.focusVi,
    part1: m.part1.flatMap((g) => g.qs),
    part2: m.part2,
    part3: m.part3,
  };
}

/** Đáp án mẫu của đề thi thử, cùng dạng với phần học kèm của chủ đề. */
export function mockExtra(m: MockTest): SpeakingExtra {
  return {
    vocab: [],
    outlineVi: [],
    sample: m.answers.sample,
    p1: m.part1.flatMap((g) => g.qs).map((q, i) => ({ q, a: m.answers.p1[i] ?? '' })),
    p3: m.part3.map((q, i) => ({ q, a: m.answers.p3[i] ?? '' })),
    mistakesVi: [],
    p1More: [],
    p3More: [],
  };
}

export type GtLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type GtTask = {
  id: string;
  level: GtLevel;
  title: string;
  titleVi: string;
  situationVi: string;
  task: string;
  mustVi: string[];
  phrases: { en: string; vi: string; ex: string }[];
  sample: string;
  tipVi: string;
};
export type GtCategory = { id: string; titleVi: string; tasks: GtTask[] };

export const GT_CATEGORIES = GT_JSON as unknown as GtCategory[];

export function gtById(id: string): { cat: GtCategory; task: GtTask } | undefined {
  for (const cat of GT_CATEGORIES) {
    const task = cat.tasks.find((t) => t.id === id);
    if (task) return { cat, task };
  }
  return undefined;
}

/** Đề giao tiếp → chủ đề giả một câu để dùng chung màn luyện ghi âm. */
export function gtAsTopic(t: GtTask): SpeakingTopic {
  return {
    id: t.id,
    title: t.title,
    titleVi: t.titleVi,
    tipVi: t.tipVi,
    part1: [t.task],
    part2: { prompt: 'Describe ', bullets: [] },
    part3: [],
  };
}

export function gtExtra(t: GtTask): SpeakingExtra {
  return {
    vocab: t.phrases,
    outlineVi: t.mustVi,
    sample: t.sample,
    p1: [{ q: t.task, a: t.sample }],
    p3: [],
    mistakesVi: [t.tipVi],
    p1More: [],
    p3More: [],
  };
}
