import { planWeekOf, type CustomPlan, type Goal, type Phase, type PlanBlock, type PlanInput, type Skill } from '@/services/plan/custom';

/**
 * Dữ liệu cho bản đồ lộ trình: các nút bài học, giai đoạn hiện tại, lịch vài ngày tới.
 *
 * Mọi con số đều lấy từ lộ trình đã dựng (`buildCustomPlan`) và từ dấu "đã làm" của người học.
 * Không có số liệu tự bịa: một nút chỉ hiện sao khi người học thật sự đã làm các khối của nó.
 */

export type MapIcon = 'book' | 'volume' | 'pencil' | 'sparkle' | 'grid' | 'chat' | 'clipboard';
export type NodeStatus = 'done' | 'current' | 'open' | 'locked';

export type MapNode = {
  key: string;
  skill: Skill | 'check';
  title: string;
  titleEn: string;
  icon: MapIcon;
  blocksTotal: number;
  blocksDone: number;
  minutesTotal: number;
  /** 0–1, trên số khối của nút. */
  progress: number;
  /** 0–3 sao, làm tròn từ tiến độ. */
  stars: 0 | 1 | 2 | 3;
  status: NodeStatus;
  /** Trang của khối đầu tiên của nút, để bấm vào là làm ngay. */
  href: string;
};

const SKILL_META: Record<Skill | 'check', { title: string; titleEn: string; icon: MapIcon }> = {
  reading: { title: 'Đọc hiểu', titleEn: 'Reading', icon: 'book' },
  listening: { title: 'Chép chính tả & nghe', titleEn: 'Listen & dictate', icon: 'volume' },
  writing: { title: 'Viết', titleEn: 'Writing', icon: 'pencil' },
  vocab: { title: 'Từ vựng', titleEn: 'Vocabulary', icon: 'sparkle' },
  math: { title: 'SAT Math', titleEn: 'SAT Math', icon: 'grid' },
  verbal: { title: 'SAT Verbal', titleEn: 'SAT Verbal', icon: 'chat' },
  check: { title: 'Cửa kiểm tra', titleEn: 'Checkpoint', icon: 'clipboard' },
};

/** Ngưỡng coi một nút là đã xong, và ngưỡng để nút kế tiếp được mở khoá. */
const DONE_AT = 0.9;
const UNLOCK_AT = 0.5;

type Flat = { block: PlanBlock; week: number; iso: string };

function flatten(plan: CustomPlan): Flat[] {
  return plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks.map((block) => ({ block, week: w.week, iso: d.iso }))));
}

/**
 * Các nút của bản đồ, theo đúng thứ tự xuất hiện trong lộ trình (kỹ năng đến trước đứng trước).
 * Nút kiểm tra (cửa thi thử) luôn đứng cuối. Nút đầu tiên luôn mở; nút sau mở khi nút trước đạt
 * ngưỡng mở khoá; nút đầu tiên chưa xong là nút "đang học".
 */
export function buildMapNodes(plan: CustomPlan, done: Record<string, true>): MapNode[] {
  const groups = new Map<string, { skill: Skill | 'check'; first: number; blocks: Flat[] }>();
  flatten(plan).forEach((f, index) => {
    const key = f.block.skill;
    const g = groups.get(key) ?? { skill: key, first: index, blocks: [] };
    g.blocks.push(f);
    groups.set(key, g);
  });

  const ordered = [...groups.values()].sort((a, b) => {
    if (a.skill === 'check') return 1;
    if (b.skill === 'check') return -1;
    return a.first - b.first;
  });

  const nodes: MapNode[] = [];
  let currentTaken = false;
  let prevProgress = 1;
  ordered.forEach((g, i) => {
    const blocksDone = g.blocks.filter((f) => done[f.block.id]).length;
    const blocksTotal = g.blocks.length;
    const progress = blocksTotal === 0 ? 0 : blocksDone / blocksTotal;
    let status: NodeStatus;
    if (progress >= DONE_AT) status = 'done';
    else if (!currentTaken) {
      status = 'current';
      currentTaken = true;
    } else status = prevProgress >= UNLOCK_AT ? 'open' : 'locked';
    if (i === 0 && status === 'locked') status = 'open';

    const meta = SKILL_META[g.skill];
    nodes.push({
      key: g.skill,
      skill: g.skill,
      title: meta.title,
      titleEn: meta.titleEn,
      icon: meta.icon,
      blocksTotal,
      blocksDone,
      minutesTotal: g.blocks.reduce((sum, f) => sum + f.block.minutes, 0),
      progress,
      stars: Math.round(Math.min(1, progress) * 3) as 0 | 1 | 2 | 3,
      status,
      href: g.blocks[0]?.block.href ?? '/plan',
    });
    prevProgress = progress;
  });
  return nodes;
}

/** Nhãn giai đoạn cho người học, theo đúng giai đoạn trong lộ trình. */
export const STAGE_TITLE: Record<Phase, { vi: string; en: string }> = {
  nen: { vi: 'Nền tảng vững chắc', en: 'Solid foundation' },
  dang: { vi: 'Luyện dạng thuần thục', en: 'Mastering the question types' },
  de: { vi: 'Luyện đề như thi thật', en: 'Full practice tests' },
  'nuoc-rut': { vi: 'Nước rút về đích', en: 'Final sprint' },
};

export type Stage = {
  goal: Goal;
  phase: Phase;
  weekFrom: number;
  weekTo: number;
  /** Khối học (không tính cửa kiểm tra) trong giai đoạn này và số đã làm. */
  blocksTotal: number;
  blocksDone: number;
  /** Số tuần còn lại tới ngày thi của kỳ này. */
  daysLeft: number;
};

/** Giai đoạn đang học: tuần hiện tại, và khoảng tuần liên tiếp cùng giai đoạn đó. */
export function stageOf(plan: CustomPlan, input: PlanInput, todayIso: string, done: Record<string, true>): Stage | null {
  const goal: Goal | null = input.ielts ? 'ielts' : input.sat ? 'sat' : null;
  if (!goal || plan.weeks.length === 0) return null;
  const week = Math.min(Math.max(planWeekOf(input, todayIso), 1), plan.totalWeeks);
  const current = plan.weeks[week - 1] ?? plan.weeks[0]!;
  const phase = current.phases[goal] ?? (Object.values(current.phases)[0] as Phase | undefined) ?? 'nen';

  let from = week;
  while (from > 1 && plan.weeks[from - 2]?.phases[goal] === phase) from -= 1;
  let to = week;
  while (to < plan.totalWeeks && plan.weeks[to]?.phases[goal] === phase) to += 1;

  const inRange = plan.weeks.slice(from - 1, to).flatMap((w) => w.days.flatMap((d) => d.blocks));
  const counted = inRange.filter((b) => b.skill !== 'check');
  const examIso = input[goal]?.examIso ?? todayIso;
  const daysLeft = Math.max(0, Math.round((Date.parse(`${examIso}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / 86_400_000));

  return {
    goal,
    phase,
    weekFrom: from,
    weekTo: to,
    blocksTotal: counted.length,
    blocksDone: counted.filter((b) => done[b.id]).length,
    daysLeft,
  };
}

export type AgendaDay = { iso: string; weekday: number; isToday: boolean; blocks: Array<PlanBlock & { done: boolean }> };

/** Lịch các ngày từ hôm nay trở đi (gồm cả ngày không có khối nào, để thấy ngày nghỉ). */
export function agendaFrom(plan: CustomPlan, todayIso: string, done: Record<string, true>, days = 7): AgendaDay[] {
  const out: AgendaDay[] = [];
  const end = addDays(todayIso, days - 1);
  for (const w of plan.weeks) {
    for (const d of w.days) {
      if (d.iso < todayIso || d.iso > end) continue;
      out.push({
        iso: d.iso,
        weekday: d.weekday,
        isToday: d.iso === todayIso,
        blocks: d.blocks.map((b) => ({ ...b, done: Boolean(done[b.id]) })),
      });
    }
  }
  return out.sort((a, b) => a.iso.localeCompare(b.iso));
}

function addDays(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Hồ sơ gửi cho AI phân tích lịch: chỉ các con số đã biết (mục tiêu, thời gian, phân bổ hiện tại).
 * Không gửi tên hay thông tin cá nhân khác.
 */
export function planProfile(plan: CustomPlan, input: PlanInput, todayIso: string) {
  const week = Math.min(Math.max(planWeekOf(input, todayIso), 1), plan.totalWeeks);
  return {
    goals: (['ielts', 'sat'] as const)
      .filter((g) => input[g])
      .map((g) => ({
        goal: g,
        now: input[g]!.now,
        target: input[g]!.target,
        daysLeft: Math.max(0, Math.round((Date.parse(`${input[g]!.examIso}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / 86_400_000)),
      })),
    minutesPerDay: input.minutesPerDay,
    studyDaysPerWeek: input.studyDays.length,
    weakSkills: input.weak,
    totalWeeks: plan.totalWeeks,
    currentWeek: week,
    minutesBySkill: plan.minutesBySkill,
  };
}
