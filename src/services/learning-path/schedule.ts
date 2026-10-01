/**
 * YÊU CẦU RIÊNG + XẾP LỊCH cho Lộ trình học (01/10/2026: "tùy vào yêu cầu
 * người học bổ sung thêm ở bên dưới … rồi sẽ xếp lịch học cho họ").
 *
 * - Người học chọn phần muốn tập trung (Nghe, Viết, Math…) → thêm vài bài cùng
 *   loại ở trình độ kế tiếp vào lộ trình.
 * - Hoặc gõ nhu cầu bằng lời → AI tìm bài có thật trong app (xem
 *   `app/api/search/ai+api.ts`) → thêm thành "bài theo yêu cầu".
 * - Lịch: rải bài thêm đều vào giữa các bài của lộ trình, rồi xếp từng ngày học
 *   theo số phút mỗi buổi. Hàm ở đây thuần, có test.
 */
import type { Bi, PathExam, PathLevel, PathNode, PathTargetKind } from '@/data/learning-path/types';

/* ------------------------------------------------------------------ phần muốn tập trung */

export type FocusId =
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'vocab'
  | 'math'
  | 'verbal'
  | 'sat-vocab';

export type FocusOption = { id: FocusId; label: Bi; kinds: readonly PathTargetKind[] };

export const FOCUS_OPTIONS: Record<PathExam, readonly FocusOption[]> = {
  ielts: [
    { id: 'listening', label: { vi: 'Nghe', en: 'Listening' }, kinds: ['dictation'] },
    { id: 'reading', label: { vi: 'Đọc', en: 'Reading' }, kinds: ['read', 'bilingual'] },
    { id: 'writing', label: { vi: 'Viết', en: 'Writing' }, kinds: ['write', 'translate'] },
    { id: 'speaking', label: { vi: 'Nói', en: 'Speaking' }, kinds: ['speak'] },
    { id: 'vocab', label: { vi: 'Từ vựng', en: 'Vocabulary' }, kinds: ['vocab'] },
  ],
  sat: [
    { id: 'math', label: { vi: 'Math', en: 'Math' }, kinds: ['math-set', 'sat-chapter', 'math-lesson'] },
    { id: 'verbal', label: { vi: 'Verbal', en: 'Verbal' }, kinds: ['rw-set', 'rw-lesson'] },
    { id: 'sat-vocab', label: { vi: 'Từ vựng SAT', en: 'SAT vocabulary' }, kinds: ['sat-vocab'] },
  ],
};

/** Số bài thêm cho mỗi phần muốn tập trung. */
export const FOCUS_EXTRA = 3;

/**
 * Bài thêm cho các phần muốn tập trung: bài cùng loại ở trình độ KẾ TIẾP (thử
 * sức), chưa xong, theo thứ tự lộ trình. Ở trình độ cao nhất thì không có bài
 * thêm (mọi bài đã nằm trên đường mòn) — trả về rỗng.
 */
export function focusNodes(
  exam: PathExam,
  focus: readonly FocusId[],
  level: PathLevel,
  levels: readonly PathLevel[],
  isDone: (id: string) => boolean,
): PathNode[] {
  const next = levels[levels.findIndex((l) => l.id === level.id) + 1];
  if (!next) return [];
  const pool = next.parts.flatMap((p) => p.nodes);
  const out: PathNode[] = [];
  for (const opt of FOCUS_OPTIONS[exam]) {
    if (!focus.includes(opt.id)) continue;
    out.push(...pool.filter((n) => opt.kinds.includes(n.target.kind) && !isDone(n.id)).slice(0, FOCUS_EXTRA));
  }
  return out;
}

/* ------------------------------------------------------------------ bài theo yêu cầu (AI) */

export type RequestItem = {
  /** `req:<mã mục tìm kiếm>` — trùng mục thì không thêm hai lần. */
  id: string;
  exam: PathExam;
  title: Bi;
  href: string;
  /** Lý do AI chọn, theo ngôn ngữ lúc hỏi. */
  reason: string;
  minutes: number;
  /** Câu người học đã gõ. */
  ask: string;
};

/** Ước phút cho một mục tìm kiếm theo loại. */
export const KIND_MINUTES: Record<string, number> = {
  page: 15,
  path: 20,
  lesson: 15,
  practice: 20,
  vocab: 20,
  reading: 20,
  listening: 15,
  writing: 40,
  speaking: 15,
  test: 60,
};

export function requestId(entryId: string): string {
  return `req:${entryId}`;
}

/** Gộp bài mới vào danh sách cũ, bỏ trùng, giữ tối đa `max` bài gần nhất. */
export function mergeRequests(old: readonly RequestItem[], add: readonly RequestItem[], max = 24): RequestItem[] {
  const ids = new Set(add.map((r) => r.id));
  return [...old.filter((r) => !ids.has(r.id)), ...add].slice(-max);
}

/* ------------------------------------------------------------------ lịch */

export type ScheduleItem = { id: string; title: Bi; minutes: number; href?: string; extra?: boolean };
export type ScheduleDay = { iso: string; items: ScheduleItem[]; minutes: number };
export type Schedule = {
  days: ScheduleDay[];
  /** Ngày học cuối cùng; null khi không còn bài nào. */
  endIso: string | null;
  totalMinutes: number;
};

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getUTCDay();
}

/**
 * Rải bài thêm đều giữa các bài chính: bài thêm thứ j đứng sau bài chính thứ
 * (j+1)·bước. Không còn bài chính thì bài thêm đứng nối nhau.
 */
export function interleave<T>(main: readonly T[], extra: readonly T[]): T[] {
  if (extra.length === 0) return [...main];
  if (main.length === 0) return [...extra];
  const step = Math.max(1, Math.floor(main.length / (extra.length + 1)));
  const out: T[] = [];
  let j = 0;
  main.forEach((m, i) => {
    out.push(m);
    if (j < extra.length && (i + 1) % step === 0 && (i + 1) / step <= extra.length) {
      out.push(extra[j]!);
      j += 1;
    }
  });
  while (j < extra.length) out.push(extra[j++]!);
  return out;
}

const MAX_DAYS = 800;

/**
 * Xếp bài vào ngày học: chỉ những ngày trong `studyDays` (0 = CN … 6 = T7), mỗi
 * ngày cộng bài cho tới khi đủ `minutesPerDay`. Bài dài hơn một buổi vẫn được
 * xếp (một mình một ngày) để lịch không bao giờ kẹt.
 */
export function buildSchedule(
  items: readonly ScheduleItem[],
  opts: { startIso: string; minutesPerDay: number; studyDays: readonly number[] },
): Schedule {
  const totalMinutes = items.reduce((a, b) => a + b.minutes, 0);
  const days: ScheduleDay[] = [];
  if (items.length === 0 || opts.studyDays.length === 0 || opts.minutesPerDay <= 0) {
    return { days, endIso: null, totalMinutes };
  }
  let i = 0;
  for (let k = 0; k < MAX_DAYS && i < items.length; k += 1) {
    const iso = addDays(opts.startIso, k);
    if (!opts.studyDays.includes(weekdayOf(iso))) continue;
    const day: ScheduleDay = { iso, items: [], minutes: 0 };
    while (i < items.length) {
      const it = items[i]!;
      if (day.items.length > 0 && day.minutes + it.minutes > opts.minutesPerDay) break;
      day.items.push(it);
      day.minutes += it.minutes;
      i += 1;
    }
    days.push(day);
  }
  return { days, endIso: days.length ? days[days.length - 1]!.iso : null, totalMinutes };
}

/** Số ngày học từ `startIso` tới hết `endIso` (tính cả hai đầu). */
export function studyDaysBetween(startIso: string, endIso: string, studyDays: readonly number[]): number {
  let n = 0;
  for (let k = 0; k < MAX_DAYS; k += 1) {
    const iso = addDays(startIso, k);
    if (iso > endIso) break;
    if (studyDays.includes(weekdayOf(iso))) n += 1;
  }
  return n;
}

/**
 * Lịch có kịp ngày thi không. Không kịp thì gợi ý số phút mỗi buổi cần có
 * (làm tròn lên bội số 15).
 */
export function fitsExam(
  schedule: Schedule,
  examIso: string | null | undefined,
  startIso: string,
  studyDays: readonly number[],
): { ok: true } | { ok: false; needMinutes: number | null } {
  if (!examIso || !schedule.endIso || schedule.endIso < examIso) return { ok: true };
  const days = studyDaysBetween(startIso, addDays(examIso, -1), studyDays);
  if (days <= 0) return { ok: false, needMinutes: null };
  return { ok: false, needMinutes: Math.ceil(schedule.totalMinutes / days / 15) * 15 };
}
