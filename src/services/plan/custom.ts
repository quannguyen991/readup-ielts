import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { DICTATION_SETS } from '@/data/dictation-sets';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { SAT_RW_MIXED_SETS } from '@/services/sat-rw/mixed-sets';
import { PATH_STEPS } from '@/services/writing/translation-path';

/**
 * LỘ TRÌNH TỰ LẬP THEO MỤC TIÊU CỦA TỪNG NGƯỜI.
 *
 * Bản cũ (`weeks.ts`) là lộ trình 60 tuần của riêng người làm app — bắt đầu
 * 07/09/2026, học theo sách Kaplan — mà lại hiện cho MỌI người: người mới mở app
 * đã thấy "Tuần 3/60 · Từ vựng Unit 3", như thể họ đã học ba tuần. Người dùng
 * bắt sửa ngày 26/09/2026: lộ trình phải dựng theo yêu cầu của người học.
 *
 * Người học khai: thi gì (IELTS, SAT hay cả hai), điểm bây giờ, điểm muốn đạt,
 * ngày thi, mỗi ngày học bao nhiêu phút, học những thứ mấy, phần nào yếu. Hàm
 * thuần dưới đây dựng cả lộ trình từ ngày lập tới ngày thi:
 *
 * - CHIA GIỜ theo khoảng cách điểm: mảng nào còn xa mục tiêu hơn (tính trên số
 *   tuần còn lại tới kỳ thi của mảng đó) được nhiều phút hơn. Phần tự nhận yếu
 *   được thêm 60% trọng số. Kỳ thi nào đã qua thì mảng đó nhường hết giờ.
 * - BA GIAI ĐOẠN cho mỗi kỳ thi: Dựng nền (bài lý thuyết) → Luyện dạng (drill
 *   theo kỹ năng) → Luyện đề (đề trộn, thi thử). Tuần cuối trước ngày thi chỉ ôn
 *   nhẹ và làm một đề, không học bài mới.
 * - CỬA KIỂM TRA cuối mỗi giai đoạn là một bài thi thử thật trong app, để người
 *   học biết mình đi đúng hướng hay không bằng số đo chứ không bằng cảm giác.
 * - MỖI KHỐI DẪN VÀO ĐÚNG BÀI: con trỏ nội dung chạy tuần tự qua kho (bài lý
 *   thuyết Math thứ 1, 2, 3…), nên lộ trình nói "học bài Hệ phương trình" chứ
 *   không nói chung chung "học Math".
 *
 * Không có số liệu tiến độ nào ở đây: lộ trình chỉ nói NÊN làm gì. Đã làm hay
 * chưa do người học tự đánh dấu (`useRoadmapStore`).
 */

export type Goal = 'ielts' | 'sat';
export type Skill = 'reading' | 'listening' | 'writing' | 'vocab' | 'math' | 'verbal';
export type Phase = 'nen' | 'dang' | 'de' | 'nuoc-rut';

export type GoalInput = {
  /** Điểm hiện tại; `null` = chưa biết (sẽ giả định thấp hơn mục tiêu một bậc). */
  now: number | null;
  target: number;
  examIso: string;
};

export type PlanInput = {
  ielts: GoalInput | null;
  sat: GoalInput | null;
  /** Số phút mỗi ngày học. */
  minutesPerDay: number;
  /** Các thứ trong tuần sẽ học: 0 = Chủ nhật … 6 = Thứ Bảy. */
  studyDays: number[];
  weak: Skill[];
  /** Ngày lập lộ trình (YYYY-MM-DD). Tuần 1 là tuần chứa ngày này. */
  startIso: string;
};

export type PlanBlock = {
  id: string;
  skill: Skill | 'check';
  goal: Goal;
  title: string;
  detail: string;
  minutes: number;
  href: string;
};

export type PlanDay = { iso: string; weekday: number; blocks: PlanBlock[] };

export type PlanWeek = {
  week: number;
  startIso: string;
  /** Giai đoạn của từng kỳ thi trong tuần này (kỳ đã thi thì không có). */
  phases: Partial<Record<Goal, Phase>>;
  days: PlanDay[];
  /** Mốc trong tuần: cửa kiểm tra, ngày thi. */
  milestones: string[];
};

export type CustomPlan = {
  weeks: PlanWeek[];
  totalWeeks: number;
  totalMinutes: number;
  minutesBySkill: Record<Skill, number>;
};

export const SKILL_LABEL: Record<Skill, string> = {
  reading: 'IELTS Reading',
  listening: 'Nghe & chép',
  writing: 'IELTS Writing',
  vocab: 'Từ vựng',
  math: 'SAT Math',
  verbal: 'SAT Verbal',
};

export const PHASE_LABEL: Record<Phase, string> = {
  nen: 'Dựng nền',
  dang: 'Luyện dạng',
  de: 'Luyện đề',
  'nuoc-rut': 'Nước rút',
};

const GOAL_SKILLS: Record<Goal, Skill[]> = {
  ielts: ['reading', 'listening', 'writing'],
  sat: ['math', 'verbal'],
};

export const WEEKDAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const DAY_MS = 86_400_000;

function parseIso(iso: string): number {
  return Date.parse(`${iso}T00:00:00.000Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Thứ Hai của tuần chứa ngày này. */
export function mondayOf(iso: string): string {
  const ms = parseIso(iso);
  const weekday = new Date(ms).getUTCDay();
  const back = (weekday + 6) % 7;
  return toIso(ms - back * DAY_MS);
}

/** Tuần thứ mấy của lộ trình (1 = tuần lập). 0 nếu trước ngày bắt đầu. */
export function planWeekOf(input: PlanInput, todayIso: string): number {
  const diff = parseIso(todayIso) - parseIso(mondayOf(input.startIso));
  if (diff < 0) return 0;
  return Math.floor(diff / (7 * DAY_MS)) + 1;
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round((parseIso(toIsoDate) - parseIso(fromIso)) / DAY_MS);
}

/** Những lỗi khiến không lập được lộ trình, viết để hiện thẳng cho người học. */
export function validatePlanInput(input: PlanInput): string[] {
  const problems: string[] = [];
  if (!input.ielts && !input.sat) problems.push('Chọn ít nhất một kỳ thi: IELTS hoặc SAT.');
  for (const [name, g] of [['IELTS', input.ielts], ['SAT', input.sat]] as const) {
    if (!g) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.examIso) || Number.isNaN(parseIso(g.examIso))) {
      problems.push(`Chọn ngày thi ${name}.`);
      continue;
    }
    const days = daysBetween(input.startIso, g.examIso);
    if (days < 14) problems.push(`Ngày thi ${name} phải cách hôm nay ít nhất 2 tuần để còn kịp học.`);
    if (days > 730) problems.push(`Ngày thi ${name} xa quá 2 năm — chọn ngày gần hơn, lộ trình dài thế khó giữ.`);
    if (g.now !== null && g.now >= g.target) problems.push(`Điểm mục tiêu ${name} phải cao hơn điểm hiện tại.`);
  }
  if (input.studyDays.length === 0) problems.push('Chọn ít nhất một ngày học trong tuần.');
  if (input.minutesPerDay < 20) problems.push('Mỗi ngày học ít nhất 20 phút.');
  return problems;
}

/**
 * Khoảng cách tới mục tiêu, quy về cùng một thang "bậc".
 * IELTS: 0,5 band = 1 bậc. SAT: 50 điểm = 1 bậc (tương đương độ khó thật của
 * việc tăng điểm ở hai kỳ thi). Chưa biết điểm hiện tại thì coi là cách 2 bậc.
 */
export function gapSteps(goal: Goal, g: GoalInput): number {
  if (g.now === null) return 2;
  const raw = goal === 'ielts' ? (g.target - g.now) / 0.5 : (g.target - g.now) / 50;
  return Math.max(1, raw);
}

function phaseAt(fraction: number, daysLeft: number): Phase {
  if (daysLeft <= 7) return 'nuoc-rut';
  if (fraction < 0.45) return 'nen';
  if (fraction < 0.8) return 'dang';
  return 'de';
}

/* ------------------------------------------------------------ nội dung */

type Content = { title: string; detail: string; href: string };

const IELTS_PROMPTS = {
  task1: WRITING_PROMPTS.filter((p) => p.task === 'ielts_task1'),
  task2: WRITING_PROMPTS.filter((p) => p.task === 'ielts_task2'),
};

/**
 * Bài cụ thể cho lần thứ `n` một kỹ năng xuất hiện trong một giai đoạn.
 * Con trỏ chạy vòng qua kho, nên lộ trình dài hơn kho vẫn luôn có bài.
 */
function contentFor(skill: Skill, phase: Phase, n: number, ieltsVocab: boolean): Content {
  const pick = <T,>(list: readonly T[]): T => list[n % list.length]!;
  switch (skill) {
    case 'math': {
      if (phase === 'nen') {
        const l = pick(MATH_LESSONS);
        return { title: `SAT Math · ${l.title}`, detail: 'Đọc bài lý thuyết rồi làm phần luyện ngay sau bài', href: `/math/learn/${l.skill}` };
      }
      if (phase === 'dang') {
        const l = pick(MATH_LESSONS);
        return { title: `SAT Math · luyện ${l.title}`, detail: 'Một lượt 10 câu đúng dạng này, sai thì đọc lời giải', href: `/math/drill/${l.skill}` };
      }
      return n % 2 === 0
        ? { title: 'SAT Math · thi thử tính giờ', detail: 'Làm như thi thật, xong xem lại từng câu sai', href: '/math/mock' }
        : { title: `SAT Math · vá dạng ${pick(MATH_LESSONS).title}`, detail: 'Luyện lại dạng hay sai trong đề thi thử', href: `/math/drill/${pick(MATH_LESSONS).skill}` };
    }
    case 'verbal': {
      if (phase === 'nen') {
        const l = pick(VERBAL_LESSONS);
        return { title: `SAT Verbal · ${l.title}`, detail: 'Bài lý thuyết, có câu ví dụ và luật chọn đáp án', href: `/sat-rw/learn/${l.skill}` };
      }
      if (phase === 'dang') {
        const l = pick(VERBAL_LESSONS);
        return { title: `SAT Verbal · luyện ${l.title}`, detail: 'Một lượt 10 câu đúng kỹ năng này', href: `/sat-rw/skill/${l.skill}` };
      }
      const set = pick(SAT_RW_MIXED_SETS);
      return { title: `SAT Verbal · ${set.title}`, detail: 'Câu từ cả bốn mảng xếp xen kẽ, giống lúc thi', href: `/sat-rw/mix/${set.id}` };
    }
    case 'reading':
      return phase === 'de'
        ? { title: 'IELTS Reading · thi thử', detail: 'Một đề Reading tính giờ, xong đọc lại câu sai', href: '/mock-tests' }
        : { title: 'IELTS Reading · luyện theo dạng câu hỏi', detail: phase === 'nen' ? 'Chọn một dạng câu, làm chậm và đọc lời giải' : 'Luyện dạng hay sai nhất, bấm giờ', href: '/practice' };
    case 'listening': {
      const set = pick(DICTATION_SETS);
      return { title: `Nghe & chép · ${set.title}`, detail: `${set.level} · ${set.sentences.length} câu nối tiếp nhau`, href: `/sentence/dictation?set=${set.id}` };
    }
    case 'writing': {
      if (phase === 'nen') {
        const step = pick(PATH_STEPS);
        return { title: `Luyện dịch · ${step.title}`, detail: 'Dịch câu Việt → Anh để dựng câu đúng trước khi viết bài', href: `/write/translation/${step.id}` };
      }
      const t1 = n % 2 === 0;
      const p = pick(t1 ? IELTS_PROMPTS.task1 : IELTS_PROMPTS.task2);
      return phase === 'dang'
        ? { title: `IELTS Writing · luyện từng phần ${t1 ? 'Task 1' : 'Task 2'}`, detail: 'Viết mở bài, tổng quan, thân bài riêng từng phần', href: `/write/drill/${p.id}` }
        : { title: `IELTS Writing · viết trọn ${t1 ? 'Task 1' : 'Task 2'}`, detail: `${Math.round(p.timeLimitSeconds / 60)} phút, ít nhất ${p.minWords} từ`, href: `/write/${p.id}` };
    }
    case 'vocab': {
      if (ieltsVocab) {
        const t = pick(VOCAB_TOPICS);
        return { title: `Từ vựng IELTS · ${t.nameVi}`, detail: 'Học xen kẽ: lật thẻ, trắc nghiệm, điền từ', href: `/vocabulary/topic/${t.slug}/learn` };
      }
      const l = pick(SAT_VOCAB_LESSONS);
      return { title: `Từ vựng SAT · ${l.title}`, detail: `${l.words.length} từ, học xen kẽ`, href: `/vocabulary/topic/${l.slug}/learn` };
    }
  }
}

function checkFor(goal: Goal): Content {
  return goal === 'ielts'
    ? { title: 'Cửa kiểm tra IELTS · thi thử Reading', detail: 'Đo xem giai đoạn vừa rồi có tăng band không', href: '/mock-tests' }
    : { title: 'Cửa kiểm tra SAT · thi thử đủ 98 câu', detail: 'Đo điểm dự đoán sau giai đoạn vừa rồi', href: '/sat/full-test' };
}

/** Chia `total` phút thành `n` khối, bội số của 5, tổng giữ đúng `total`. */
export function splitMinutes(total: number, n: number): number[] {
  const base = Math.floor(total / n / 5) * 5;
  const out = Array.from({ length: n }, () => base);
  let rest = total - base * n;
  for (let i = 0; rest > 0; i = (i + 1) % n) {
    const add = Math.min(5, rest);
    out[i]! += add;
    rest -= add;
  }
  return out;
}

/* ------------------------------------------------------------ dựng lộ trình */

export function buildCustomPlan(input: PlanInput): CustomPlan {
  const goals = (['ielts', 'sat'] as const).filter((g) => input[g]);
  const start = parseIso(mondayOf(input.startIso));
  const lastExam = Math.max(...goals.map((g) => parseIso(input[g]!.examIso)));
  const totalWeeks = Math.max(1, Math.ceil((lastExam - start + DAY_MS) / (7 * DAY_MS)));
  const firstDay = parseIso(input.startIso);

  // Trọng số mỗi kỳ thi = số bậc còn thiếu / số tuần còn lại tới kỳ đó.
  const pace: Partial<Record<Goal, number>> = {};
  for (const g of goals) {
    const gi = input[g]!;
    const weeksLeft = Math.max(1, (parseIso(gi.examIso) - firstDay) / (7 * DAY_MS));
    pace[g] = gapSteps(g, gi) / weeksLeft;
  }

  const minutesBySkill: Record<Skill, number> = { reading: 0, listening: 0, writing: 0, vocab: 0, math: 0, verbal: 0 };
  // Bộ chia vòng có trọng số (smooth weighted round-robin): chạy đều, không ngẫu nhiên.
  const credit: Record<string, number> = {};
  const counters: Record<string, number> = {};
  let vocabTurn = 0;
  const weeks: PlanWeek[] = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = start + w * 7 * DAY_MS;
    const days: PlanDay[] = [];
    const milestones: string[] = [];
    const phases: Partial<Record<Goal, Phase>> = {};

    for (let d = 0; d < 7; d++) {
      const dayMs = weekStart + d * DAY_MS;
      if (dayMs < firstDay || dayMs > lastExam) continue;
      const iso = toIso(dayMs);
      const weekday = new Date(dayMs).getUTCDay();

      const active = goals.filter((g) => dayMs < parseIso(input[g]!.examIso));
      for (const g of goals) {
        if (iso === input[g]!.examIso) milestones.push(`Ngày thi ${g === 'ielts' ? 'IELTS' : 'SAT'}`);
      }
      if (!input.studyDays.includes(weekday) || active.length === 0) continue;

      const dayPhase: Partial<Record<Goal, Phase>> = {};
      for (const g of active) {
        const gi = input[g]!;
        const exam = parseIso(gi.examIso);
        dayPhase[g] = phaseAt((dayMs - firstDay) / Math.max(DAY_MS, exam - firstDay), (exam - dayMs) / DAY_MS);
        phases[g] = dayPhase[g];
      }

      const vocabMin = Math.min(25, Math.max(10, Math.round((input.minutesPerDay * 0.2) / 5) * 5));
      const rest = Math.max(10, input.minutesPerDay - vocabMin);
      const mainCount = rest <= 45 ? 1 : rest <= 100 ? 2 : 3;
      const mainMinutes = splitMinutes(rest, mainCount);

      const blocks: PlanBlock[] = [];

      // Khối từ vựng: luân phiên IELTS / SAT theo trọng số kỳ thi đang học.
      const vocabGoal: Goal = active.length === 1 ? active[0]! : vocabTurn++ % 2 === 0 ? 'ielts' : 'sat';
      const vocabPhase = dayPhase[vocabGoal]!;
      const vocabKey = `vocab:${vocabGoal}`;
      const vn = (counters[vocabKey] = (counters[vocabKey] ?? -1) + 1);
      const vc = contentFor('vocab', vocabPhase, vn, vocabGoal === 'ielts');
      blocks.push({ id: `${iso}:0`, skill: 'vocab', goal: vocabGoal, minutes: vocabMin, ...vc });
      minutesBySkill.vocab += vocabMin;

      // Cửa kiểm tra: ngày học cuối cùng của giai đoạn (trước khi sang giai đoạn sau).
      const checks: Goal[] = [];
      for (const g of active) {
        const next = nextStudyDay(dayMs, input.studyDays);
        const exam = parseIso(input[g]!.examIso);
        if (next === null || next >= exam) continue;
        const nextPhase = phaseAt((next - firstDay) / Math.max(DAY_MS, exam - firstDay), (exam - next) / DAY_MS);
        if (nextPhase !== dayPhase[g] && (dayPhase[g] === 'nen' || dayPhase[g] === 'dang' || dayPhase[g] === 'de')) checks.push(g);
      }

      for (let b = 0; b < mainCount; b++) {
        const minutes = mainMinutes[b]!;
        const checkGoal = checks.shift();
        if (checkGoal) {
          const c = checkFor(checkGoal);
          blocks.push({ id: `${iso}:${b + 1}`, skill: 'check', goal: checkGoal, minutes, ...c });
          milestones.push(c.title.split(' · ')[0]!);
          continue;
        }
        const skill = pickSkill(active, input, pace, credit, blocks);
        const goal: Goal = GOAL_SKILLS.ielts.includes(skill) ? 'ielts' : 'sat';
        const phase = dayPhase[goal]!;
        const key = `${skill}:${phase}`;
        const n = (counters[key] = (counters[key] ?? -1) + 1);
        const c = contentFor(skill, phase, n, goal === 'ielts');
        blocks.push({ id: `${iso}:${b + 1}`, skill, goal, minutes, ...c });
        minutesBySkill[skill] += minutes;
      }

      days.push({ iso, weekday, blocks });
    }

    weeks.push({ week: w + 1, startIso: toIso(weekStart), phases, days, milestones: [...new Set(milestones)] });
  }

  const totalMinutes = weeks.reduce((sum, wk) => sum + wk.days.reduce((s, d) => s + d.blocks.reduce((t, b) => t + b.minutes, 0), 0), 0);
  return { weeks, totalWeeks, totalMinutes, minutesBySkill };
}

function nextStudyDay(dayMs: number, studyDays: number[]): number | null {
  for (let i = 1; i <= 7; i++) {
    const ms = dayMs + i * DAY_MS;
    if (studyDays.includes(new Date(ms).getUTCDay())) return ms;
  }
  return null;
}

/**
 * Chọn kỹ năng cho một khối chính. Trọng số = nhịp của kỳ thi (bậc thiếu / tuần
 * còn lại) chia đều cho các kỹ năng của kỳ đó, phần yếu × 1,6. Không lặp một kỹ
 * năng hai lần trong cùng ngày nếu còn lựa chọn khác.
 */
function pickSkill(
  active: Goal[],
  input: PlanInput,
  pace: Partial<Record<Goal, number>>,
  credit: Record<string, number>,
  today: PlanBlock[],
): Skill {
  const weights: [Skill, number][] = [];
  for (const g of active) {
    const skills = GOAL_SKILLS[g];
    for (const s of skills) {
      weights.push([s, (pace[g]! / skills.length) * (input.weak.includes(s) ? 1.6 : 1)]);
    }
  }
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [s, w] of weights) credit[s] = (credit[s] ?? 0) + w;
  const used = new Set(today.map((b) => b.skill));
  const ranked = [...weights].sort((a, b) => (credit[b[0]] ?? 0) - (credit[a[0]] ?? 0));
  const choice = (ranked.find(([s]) => !used.has(s)) ?? ranked[0]!)[0];
  credit[choice] = (credit[choice] ?? 0) - total;
  return choice;
}

/** Những khối của một ngày cụ thể (rỗng nếu hôm đó nghỉ hoặc ngoài lộ trình). */
export function blocksOn(plan: CustomPlan, iso: string): PlanBlock[] {
  for (const w of plan.weeks) for (const d of w.days) if (d.iso === iso) return d.blocks;
  return [];
}

/** Ngày học gần nhất từ `iso` trở đi (kể cả chính ngày đó). */
export function nextStudyDayIso(plan: CustomPlan, iso: string): PlanDay | null {
  for (const w of plan.weeks) for (const d of w.days) if (d.iso >= iso && d.blocks.length > 0) return d;
  return null;
}
