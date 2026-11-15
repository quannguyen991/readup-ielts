import { HSA_KIND_LABEL, HSA_KIND_ORDER, HSA_TOPICS, type HsaQuestionKind } from '@/data/hsa';
import type { Bi } from '@/i18n/useL';
import { CRITERIA, CRITERION_BY_ID, KIND_CRITERION, type CriterionId } from './criteria';
import type { HsaProfile } from './profile';
import { scoreItems, type AttemptItem } from './scoring';

/**
 * Kế hoạch học mỗi ngày. Có hai nguồn: AI (cần đăng nhập, `app/api/hsa/plan+api.ts`) và luật tự động
 * ở đây khi chưa đăng nhập, hết lượt AI hoặc AI lỗi.
 *
 * AI CHỈ ĐƯỢC CHỌN TRONG DANH MỤC. Đường dẫn của mỗi bài do code dựng từ loại bài và mã dạng câu / chủ
 * điểm đã kiểm tra, không bao giờ lấy từ chữ AI trả về, nên AI không thể dẫn người học ra ngoài app
 * hay tới trang không có.
 */
export type PlanTaskType = 'review' | 'kind' | 'topic' | 'mock' | 'challenge' | 'vocab' | 'placement';

export type PlanTask = {
  id: string;
  type: PlanTaskType;
  title: Bi;
  why: Bi;
  minutes: number;
  href: string;
  kind?: HsaQuestionKind;
  topicId?: string;
};

export type DayPlan = {
  day: string;
  headline: Bi;
  tasks: PlanTask[];
  source: 'ai' | 'auto';
  model?: string;
  createdAt: string;
};

export type PlanContext = {
  day: string;
  minutesPerDay: number;
  daysToExam: number | null;
  targetScore: number;
  focus: CriterionId | 'all';
  criteria: { id: CriterionId; pct: number | null }[];
  /** Dạng câu đã đo được (ít nhất 2 câu), yếu nhất trước. */
  weakKinds: HsaQuestionKind[];
  wrongCount: number;
  mocksDone: number;
  placementDone: boolean;
  /** Dạng câu đã luyện trong hôm nay và hôm qua. */
  recentKinds: HsaQuestionKind[];
};

export const TOPIC_IDS: readonly string[] = HSA_TOPICS.map((t) => t.id);
export const PAPER_COUNT = 20;
const MAX_TASKS = 5;

// ---------------------------------------------------------------- ngày tháng

const toUtc = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
};

export const dayOrdinal = (day: string): number => Math.floor(toUtc(day) / 86_400_000);

export function daysUntil(examDate: string | null, day: string): number | null {
  if (!examDate) return null;
  return Math.round((toUtc(examDate) - toUtc(day)) / 86_400_000);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h! * 60 + m! + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Xếp các bài nối tiếp nhau từ giờ bắt đầu. */
export function scheduleTasks(tasks: readonly PlanTask[], startTime: string): { start: string; end: string }[] {
  let cursor = startTime;
  return tasks.map((t) => {
    const slot = { start: cursor, end: addMinutes(cursor, t.minutes) };
    cursor = slot.end;
    return slot;
  });
}

// ---------------------------------------------------------------- dựng bài từ danh mục

const kindTitle = (kind: HsaQuestionKind): Bi => ({
  vi: `Luyện: ${HSA_KIND_LABEL[kind].vi}`,
  en: `Practise: ${HSA_KIND_LABEL[kind].en}`,
});

export function makeTask(spec: { type: PlanTaskType; kind?: HsaQuestionKind; topicId?: string; paper?: number; minutes: number; why: Bi; count?: number }): PlanTask {
  const { type, minutes, why } = spec;
  switch (type) {
    case 'kind': {
      const kind = spec.kind!;
      return { id: `kind:${kind}`, type, kind, minutes, why, title: kindTitle(kind), href: `/hsa/practice/${kind}` };
    }
    case 'topic': {
      const topic = HSA_TOPICS.find((t) => t.id === spec.topicId)!;
      return { id: `topic:${topic.id}`, type, topicId: topic.id, minutes, why, title: { vi: `Chủ điểm: ${topic.title.vi}`, en: `Topic: ${topic.title.en}` }, href: `/hsa/topic/${topic.id}` };
    }
    case 'mock': {
      const paper = Math.min(PAPER_COUNT, Math.max(1, spec.paper ?? 1));
      return {
        id: `mock:${paper}`,
        type,
        minutes: 60,
        why,
        title: { vi: `Đề mô phỏng ${String(paper).padStart(2, '0')} · 50 câu`, en: `Practice paper ${String(paper).padStart(2, '0')} · 50 questions` },
        href: paper === 1 ? '/hsa/exam' : `/hsa/exam/${paper}`,
      };
    }
    case 'challenge':
      return { id: 'challenge', type, minutes, why, title: { vi: 'Thử thách suy luận · 10 câu', en: 'Reasoning challenge · 10 questions' }, href: '/hsa/advanced' };
    case 'review':
      return { id: 'review', type, minutes, why, title: { vi: `Chữa lại ${spec.count ?? ''} câu đã sai`.replace('  ', ' '), en: `Fix ${spec.count ?? ''} questions you missed`.replace('  ', ' ') }, href: '/hsa/review' };
    case 'vocab':
      return { id: 'vocab', type, minutes, why, title: { vi: 'Ôn từ vựng HSA', en: 'HSA vocabulary review' }, href: '/hsa/vocab' };
    case 'placement':
      return { id: 'placement', type, minutes, why, title: { vi: 'Làm bài test đầu vào', en: 'Take the entry test' }, href: '/hsa/placement' };
  }
}

// ---------------------------------------------------------------- ngữ cảnh từ lịch sử làm bài

export type AttemptMeta = { activity: string; day: string };

/** Mỗi câu chỉ lấy lần làm GẦN NHẤT; `attempts` xếp mới nhất trước. */
export function latestPerQuestion(attempts: readonly (readonly AttemptItem[])[]): AttemptItem[] {
  const seen = new Set<string>();
  const out: AttemptItem[] = [];
  for (const items of attempts) {
    for (const it of items) {
      if (seen.has(it.qid)) continue;
      seen.add(it.qid);
      out.push(it);
    }
  }
  return out;
}

export function buildContext(input: {
  profile: Pick<HsaProfile, 'minutesPerDay' | 'examDate' | 'target' | 'focus'>;
  day: string;
  latest: readonly AttemptItem[];
  metas: readonly AttemptMeta[];
  placementDone: boolean;
}): PlanContext {
  const report = scoreItems(input.latest);
  const weakKinds = report.kinds
    .filter((k) => k.total >= 2 && k.pct !== null)
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0) || b.total - a.total)
    .map((k) => k.kind);
  const wrongCount = input.latest.filter((it) => it.picked !== null && it.picked !== it.answer).length;
  const mocksDone = new Set(input.metas.filter((m) => m.activity.startsWith('mock:')).map((m) => m.activity)).size;
  const yesterday = new Date(toUtc(input.day) - 86_400_000).toISOString().slice(0, 10);
  const recentKinds = input.metas
    .filter((m) => (m.day === input.day || m.day === yesterday) && m.activity.startsWith('practice:'))
    .map((m) => m.activity.slice('practice:'.length) as HsaQuestionKind)
    .filter((k) => HSA_KIND_ORDER.includes(k));
  return {
    day: input.day,
    minutesPerDay: input.profile.minutesPerDay,
    daysToExam: daysUntil(input.profile.examDate, input.day),
    targetScore: input.profile.target,
    focus: input.profile.focus,
    criteria: report.criteria.map((c) => ({ id: c.id, pct: c.pct === null ? null : Math.round(c.pct * 100) / 100 })),
    weakKinds,
    wrongCount,
    mocksDone,
    placementDone: input.placementDone,
    recentKinds: [...new Set(recentKinds)],
  };
}

// ---------------------------------------------------------------- kế hoạch tự động

function headlineFor(tasks: readonly PlanTask[]): Bi {
  const n = tasks.filter((t) => t.type !== 'vocab').length;
  return { vi: `Hôm nay, ${n} bài + ôn từ.`, en: `Today: ${n} ${n === 1 ? 'lesson' : 'lessons'} + vocabulary.` };
}

function pickWeakKind(ctx: PlanContext, ordinal: number): HsaQuestionKind {
  const focusKinds = ctx.focus === 'all' ? [] : CRITERION_BY_ID[ctx.focus].kinds;
  let pool = ctx.weakKinds.slice(0, 4);
  // Người học chọn kỹ năng cần cao nhất: dạng câu thuộc kỹ năng đó chưa vững thì được ưu tiên.
  const focused = ctx.weakKinds.filter((k) => focusKinds.includes(k));
  if (focused.length) pool = [...focused, ...pool.filter((k) => !focused.includes(k))].slice(0, 4);
  if (pool.length === 0) {
    const fallback = focusKinds.length ? focusKinds : CRITERIA.flatMap((c) => c.kinds);
    return fallback[ordinal % fallback.length]!;
  }
  const fresh = pool.filter((k) => !ctx.recentKinds.includes(k));
  const from = fresh.length ? fresh : pool;
  return from[ordinal % Math.min(3, from.length)]!;
}

export function buildAutoPlan(ctx: PlanContext, now: string = new Date().toISOString()): DayPlan {
  const ordinal = dayOrdinal(ctx.day);
  const budget = ctx.minutesPerDay;
  const tasks: PlanTask[] = [];

  if (!ctx.placementDone) {
    tasks.push(makeTask({ type: 'placement', minutes: Math.min(40, Math.max(20, budget - 10)), why: { vi: 'Cần kết quả 5 phần để kế hoạch bám đúng điểm yếu của bạn.', en: 'We need all 5 parts to aim the plan at your weak spots.' } }));
  } else {
    if (ctx.wrongCount >= 3) {
      const count = Math.min(10, ctx.wrongCount);
      tasks.push(makeTask({ type: 'review', count, minutes: 10, why: { vi: 'Chữa câu sai khi còn nhớ là cách nhớ lâu nhất.', en: 'Fixing misses while they are fresh is the surest way to remember.' } }));
    }
    const kind = pickWeakKind(ctx, ordinal);
    const weak = ctx.weakKinds.includes(kind);
    tasks.push(makeTask({
      type: 'kind',
      kind,
      minutes: 20,
      why: weak
        ? { vi: `Dạng này đang là điểm yếu của bạn (${CRITERION_BY_ID[KIND_CRITERION[kind]].title.vi.toLowerCase()}).`, en: `This type is a weak spot for you (${CRITERION_BY_ID[KIND_CRITERION[kind]].title.en.toLowerCase()}).` }
        : { vi: 'Chưa đủ dữ liệu về dạng này, làm thử để đo.', en: 'Not enough data on this type yet, so try it to measure.' },
    }));
    const exam = ctx.daysToExam;
    const mockDay = (exam !== null && exam <= 21) || ordinal % 7 === 6;
    if (mockDay && budget >= 75) {
      tasks.push(makeTask({ type: 'mock', paper: ctx.mocksDone + 1, minutes: 60, why: exam !== null && exam <= 21 ? { vi: `Còn ${exam} ngày nữa là thi, cần quen nhịp 60 phút.`, en: `${exam} days to go, so get used to the 60-minute pace.` } : { vi: 'Mỗi tuần một đề đầy đủ để đo tiến bộ thật.', en: 'One full paper a week to measure real progress.' } }));
    } else if (budget >= 45) {
      const topic = TOPIC_IDS[ordinal % TOPIC_IDS.length]!;
      tasks.push(makeTask({ type: 'topic', topicId: topic, minutes: 15, why: { vi: 'Xoay vòng 10 chủ điểm để gặp đủ từ vựng và bài đọc.', en: 'Rotating through the 10 topics covers the full vocabulary and reading range.' } }));
    }
  }
  tasks.push(makeTask({ type: 'vocab', minutes: 10, why: { vi: 'Ôn ngắn mỗi ngày giữ từ vựng lâu hơn học dồn.', en: 'A short daily review keeps words longer than cramming.' } }));

  return { day: ctx.day, headline: headlineFor(tasks), tasks: fitToBudget(tasks, budget), source: 'auto', createdAt: now };
}

/** Bỏ bài ưu tiên thấp nhất (từ cuối lên, trừ ôn từ) cho tới khi vừa ngân sách; luôn giữ ít nhất hai bài. */
export function fitToBudget(tasks: readonly PlanTask[], budget: number): PlanTask[] {
  const out = [...tasks];
  const total = () => out.reduce((s, t) => s + t.minutes, 0);
  while (total() > budget * 1.15 && out.length > 2) {
    const i = [...out].reverse().findIndex((t) => t.type !== 'vocab');
    if (i === -1) break;
    out.splice(out.length - 1 - i, 1);
  }
  return out;
}

// ---------------------------------------------------------------- đọc kế hoạch do AI trả về

const TYPES: readonly PlanTaskType[] = ['review', 'kind', 'topic', 'mock', 'challenge', 'vocab'];

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s && s.length <= max ? s : s ? `${s.slice(0, max - 1)}…` : null;
};

/** Nhận JSON thô của AI, trả về kế hoạch đã qua kiểm tra, hoặc null khi không dùng được. */
export function parseAiPlan(raw: unknown, ctx: PlanContext, model: string | undefined, now: string = new Date().toISOString()): DayPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as { tasks?: unknown };
  if (!Array.isArray(root.tasks)) return null;

  const tasks: PlanTask[] = [];
  const seen = new Set<string>();
  for (const entry of root.tasks.slice(0, 8)) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const type = TYPES.find((t) => t === e.type);
    if (!type) continue;
    if (type === 'review' && ctx.wrongCount < 3) continue;
    const kind = HSA_KIND_ORDER.find((k) => k === e.kind);
    const topicId = TOPIC_IDS.find((t) => t === e.topicId);
    if (type === 'kind' && !kind) continue;
    if (type === 'topic' && !topicId) continue;
    const minutes = typeof e.minutes === 'number' && Number.isFinite(e.minutes) ? Math.min(90, Math.max(5, Math.round(e.minutes))) : 15;
    const vi = clean(e.why, 160);
    const en = clean(e.whyEn, 160) ?? vi;
    if (!vi || !en) continue;
    const paper = typeof e.paper === 'number' ? Math.round(e.paper) : ctx.mocksDone + 1;
    const task = makeTask({ type, kind, topicId, paper, minutes, count: Math.min(10, ctx.wrongCount), why: { vi, en } });
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    tasks.push(task);
  }

  const learning = tasks.filter((t) => t.type !== 'vocab');
  if (learning.length < 1) return null;
  const withVocab = seen.has('vocab') ? tasks : [...tasks, makeTask({ type: 'vocab', minutes: 10, why: { vi: 'Ôn ngắn mỗi ngày giữ từ vựng lâu hơn học dồn.', en: 'A short daily review keeps words longer than cramming.' } })];
  // Vocab đứng cuối, các bài khác giữ thứ tự AI chọn.
  const ordered = [...withVocab.filter((t) => t.type !== 'vocab'), ...withVocab.filter((t) => t.type === 'vocab')].slice(0, MAX_TASKS);
  const fitted = fitToBudget(ordered, ctx.minutesPerDay);

  // Tiêu đề do code đặt (hai ngôn ngữ), không lấy chữ của AI.
  return { day: ctx.day, headline: headlineFor(fitted), tasks: fitted, source: 'ai', model, createdAt: now };
}

// ---------------------------------------------------------------- kiểm tra ngữ cảnh gửi lên máy chủ

/** Máy chủ không tin ngữ cảnh từ máy người dùng: kiểm từng trường, trường sai thì từ chối cả gói. */
export function readContext(raw: unknown): PlanContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const int = (v: unknown, lo: number, hi: number): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null);
  const day = typeof o.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.day) ? o.day : null;
  const minutesPerDay = int(o.minutesPerDay, 10, 300);
  const targetScore = int(o.targetScore, 0, 50);
  const wrongCount = int(o.wrongCount, 0, 1000);
  const mocksDone = int(o.mocksDone, 0, PAPER_COUNT);
  const daysToExam = o.daysToExam === null ? null : int(o.daysToExam, -3650, 3650);
  const focus = o.focus === 'all' || CRITERIA.some((c) => c.id === o.focus) ? (o.focus as PlanContext['focus']) : null;
  if (!day || minutesPerDay === null || targetScore === null || wrongCount === null || mocksDone === null || daysToExam === undefined || !focus) return null;
  if (typeof o.placementDone !== 'boolean') return null;
  const kinds = (v: unknown): HsaQuestionKind[] => (Array.isArray(v) ? v.filter((k): k is HsaQuestionKind => HSA_KIND_ORDER.includes(k as HsaQuestionKind)).slice(0, 8) : []);
  const criteria: PlanContext['criteria'] = [];
  if (Array.isArray(o.criteria)) {
    for (const c of o.criteria.slice(0, 5)) {
      if (!c || typeof c !== 'object') continue;
      const e = c as Record<string, unknown>;
      const id = CRITERIA.find((x) => x.id === e.id)?.id;
      if (id) criteria.push({ id, pct: typeof e.pct === 'number' && e.pct >= 0 && e.pct <= 1 ? e.pct : null });
    }
  }
  return {
    day,
    minutesPerDay,
    daysToExam,
    targetScore,
    focus,
    criteria,
    weakKinds: kinds(o.weakKinds),
    wrongCount,
    mocksDone,
    placementDone: o.placementDone,
    recentKinds: kinds(o.recentKinds),
  };
}

// ---------------------------------------------------------------- bài nào đã xong

/**
 * Một bài đã xong khi người học tự đánh dấu, hoặc khi hôm nay họ đã làm đúng loại bài đó. Riêng ôn từ
 * chỉ có thể tự đánh dấu, vì app không đo được việc ôn từ ở trang này.
 */
export function inferredDone(task: PlanTask, activitiesToday: readonly string[], placementComplete: boolean): boolean {
  switch (task.type) {
    case 'placement':
      return placementComplete;
    case 'kind':
      return activitiesToday.includes(`practice:${task.kind}`);
    case 'topic':
      return activitiesToday.includes(`topic:${task.topicId}`);
    case 'mock':
      return activitiesToday.some((a) => a.startsWith('mock:'));
    case 'challenge':
      return activitiesToday.some((a) => a.startsWith('challenge:'));
    case 'review':
      return activitiesToday.some((a) => a.startsWith('review:'));
    case 'vocab':
      return false;
  }
}
