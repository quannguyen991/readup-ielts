/**
 * TIẾN ĐỘ TỪNG HỌC SINH cho giáo viên — chỉ số đếm, không bài làm, không email.
 *
 * Mọi con số đều có thể là `null` = KHÔNG BIẾT (học sinh chưa đồng bộ khoá dữ
 * liệu đó). Giao diện hiện "—" cho null, không bao giờ đổi null thành 0: "0 phút"
 * là một lời khẳng định em không học, còn "—" là app chưa thấy dữ liệu.
 *
 * Ngày tính theo giờ Việt Nam: nhật ký học trên máy học sinh ghi theo giờ VN,
 * còn máy chủ chạy giờ UTC.
 */
import { assignmentStatus, type Assignment, type AssignmentStatus, type Resolvers, type StudentData } from './assignments';

const DAY = 86_400_000;
const VN = 7 * 3_600_000;

/** "2026-10-01" theo giờ Việt Nam. */
export function vnDay(t: number): string {
  return new Date(t + VN).toISOString().slice(0, 10);
}

/** Số ngày giữa hai khoá ngày "YYYY-MM-DD" (b − a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

export type StudentSummary = {
  synced: boolean;
  /** Ngày học gần nhất (giờ VN), null nếu chưa thấy hoạt động nào. */
  lastActive: string | null;
  /** Số ngày từ lần học gần nhất tới hôm nay; null nếu chưa thấy hoạt động. */
  daysInactive: number | null;
  streak: number | null;
  minutes7: number | null;
  questions7: number | null;
  activeDays7: number | null;
  wordsReviewed7: number | null;
  /** Số từ ở chặng "nhớ được" trên mọi bộ từ. */
  wordsLearned: number | null;
  assignments: { done: number; total: number; overdue: number };
  statuses: Record<string, AssignmentStatus>;
};

function isoDay(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : vnDay(t);
}

/** Ngày hoạt động gần nhất trên mọi nguồn có mốc thời gian. */
function lastActiveDay(d: StudentData): string | null {
  const days: string[] = [];
  for (const [k, v] of Object.entries(d.study?.daily ?? {})) {
    if (v && ((v.minutes ?? 0) > 0 || (v.questions ?? 0) > 0 || (v.wordsReviewed ?? 0) > 0) && /^\d{4}-\d{2}-\d{2}$/.test(k)) days.push(k);
  }
  for (const iso of Object.values(d.topicStudy?.lastAt ?? {})) {
    const k = isoDay(iso);
    if (k) days.push(k);
  }
  for (const levels of Object.values(d.satRoadmap?.progress ?? {})) {
    for (const b of Object.values(levels ?? {})) {
      const k = isoDay(b?.at);
      if (k) days.push(k);
    }
  }
  for (const s of d.math?.sessions ?? []) {
    const k = isoDay(s?.finishedAt);
    if (k) days.push(k);
  }
  for (const s of d.speaking?.attempts ?? []) {
    const k = isoDay(s?.finishedAt);
    if (k) days.push(k);
  }
  return days.length ? days.reduce((a, b) => (b > a ? b : a)) : null;
}

export function summarizeStudent(d: StudentData, assignments: readonly Assignment[], now: number, r: Resolvers): StudentSummary {
  const today = vnDay(now);
  const daily = d.study?.daily ?? null;

  let minutes7: number | null = null;
  let questions7: number | null = null;
  let activeDays7: number | null = null;
  let wordsReviewed7: number | null = null;
  let streak: number | null = null;
  if (daily) {
    minutes7 = 0;
    questions7 = 0;
    activeDays7 = 0;
    wordsReviewed7 = 0;
    for (let i = 0; i < 7; i += 1) {
      const log = daily[vnDay(now - i * DAY)];
      if (!log) continue;
      minutes7 += Math.round(log.minutes ?? 0);
      questions7 += Math.round(log.questions ?? 0);
      wordsReviewed7 += Math.round(log.wordsReviewed ?? 0);
      if ((log.minutes ?? 0) > 0) activeDays7 += 1;
    }
    // Chuỗi ngày: hôm nay chưa học thì vẫn tính chuỗi tới hôm qua (như báo cáo phụ huynh).
    streak = 0;
    for (let back = 0; back < 400; back += 1) {
      if ((daily[vnDay(now - back * DAY)]?.minutes ?? 0) > 0) streak += 1;
      else if (back > 0) break;
    }
  }

  let wordsLearned: number | null = null;
  const stages = d.topicStudy?.stages;
  if (stages) {
    wordsLearned = 0;
    for (const deck of Object.values(stages)) for (const s of Object.values(deck ?? {})) if (s >= 2) wordsLearned += 1;
  }

  const statuses: Record<string, AssignmentStatus> = {};
  let done = 0;
  let overdue = 0;
  for (const a of assignments) {
    const st = assignmentStatus(a, d, r);
    statuses[a.id] = st;
    if (st.state === 'done') done += 1;
    else if (d.synced && a.due_on && a.due_on < today) overdue += 1;
  }

  const lastActive = d.synced ? lastActiveDay(d) : null;
  return {
    synced: d.synced,
    lastActive,
    daysInactive: lastActive ? Math.max(0, dayDiff(lastActive, today)) : null,
    streak: d.synced ? streak : null,
    minutes7: d.synced ? minutes7 : null,
    questions7: d.synced ? questions7 : null,
    activeDays7: d.synced ? activeDays7 : null,
    wordsReviewed7: d.synced ? wordsReviewed7 : null,
    wordsLearned: d.synced ? wordsLearned : null,
    assignments: { done, total: assignments.length, overdue },
    statuses,
  };
}

/** Ngưỡng "lâu không học" để báo giáo viên. */
export const INACTIVE_DAYS = 3;

export type AttentionReason = 'no_data' | 'inactive' | 'overdue';

/** Vì sao em này cần giáo viên để ý — rỗng là ổn. */
export function attentionReasons(s: StudentSummary): AttentionReason[] {
  const out: AttentionReason[] = [];
  if (!s.synced) out.push('no_data');
  else if (s.daysInactive === null || s.daysInactive >= INACTIVE_DAYS) out.push('inactive');
  if (s.assignments.overdue > 0) out.push('overdue');
  return out;
}

export type SortKey = 'lastActive' | 'name' | 'assignments';

/** Xếp học sinh: học gần nhất lên đầu (chưa có dữ liệu xuống cuối), theo tên, hoặc theo bài đã xong. */
export function sortMembers<T extends { displayName: string; summary: StudentSummary }>(rows: readonly T[], key: SortKey): T[] {
  const byName = (a: T, b: T) => a.displayName.localeCompare(b.displayName, 'vi');
  const copy = [...rows];
  if (key === 'name') return copy.sort(byName);
  if (key === 'assignments') {
    return copy.sort((a, b) => b.summary.assignments.done - a.summary.assignments.done || byName(a, b));
  }
  return copy.sort((a, b) => {
    const x = a.summary.lastActive;
    const y = b.summary.lastActive;
    if (x && y && x !== y) return y.localeCompare(x);
    if (x && !y) return -1;
    if (!x && y) return 1;
    return byName(a, b);
  });
}
