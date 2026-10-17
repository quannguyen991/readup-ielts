import type { Skill } from '@/services/plan/custom';

/**
 * Kiểm tra và chuẩn hoá phản hồi AI phân tích lịch học. AI được phép đề xuất, nhưng mọi
 * thứ đi vào lộ trình đều qua đây: kỹ năng phải thuộc danh sách cho phép, số phút phải
 * trong khoảng hợp lý, và tổng phút phải khớp ngân sách tuần (sai lệch lớn thì báo lại).
 */

export const ALLOWED_SKILLS: Skill[] = ['reading', 'listening', 'writing', 'vocab', 'math', 'verbal'];

export type AllocationRow = { skill: Skill; minutesPerWeek: number; reason: string };

export type AiPlanAnalysis = {
  summary: string;
  risks: string[];
  allocation: AllocationRow[];
  tips: string[];
  /** Kỹ năng cần ưu tiên, theo thứ tự quan trọng (tối đa hai). */
  priority: Skill[];
};

const MAX_MINUTES_PER_WEEK = 2_000;
const BUDGET_TOLERANCE = 0.1;

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isSkill = (v: unknown): v is Skill => typeof v === 'string' && (ALLOWED_SKILLS as string[]).includes(v);

/**
 * Đọc JSON AI trả về thành `AiPlanAnalysis`. Trả về null khi thiếu phần cốt lõi (tóm tắt và
 * phân bổ có ít nhất một kỹ năng hợp lệ); các phần phụ thì bỏ qua thay vì làm hỏng cả kết quả.
 */
export function parseAiPlan(raw: unknown): AiPlanAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const summary = str(o.summary, 600);
  if (!summary) return null;

  const allocation: AllocationRow[] = [];
  if (Array.isArray(o.allocation)) {
    for (const row of o.allocation.slice(0, ALLOWED_SKILLS.length)) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      if (!isSkill(r.skill)) continue;
      const minutes = Number(r.minutesPerWeek);
      if (!Number.isFinite(minutes) || minutes < 0) continue;
      allocation.push({
        skill: r.skill,
        minutesPerWeek: Math.min(MAX_MINUTES_PER_WEEK, Math.round(minutes)),
        reason: str(r.reason, 200),
      });
    }
  }
  if (allocation.length === 0) return null;

  const list = (v: unknown, max: number) =>
    Array.isArray(v) ? v.map((x) => str(x, 240)).filter(Boolean).slice(0, max) : [];

  // Ưu tiên của AI chỉ dùng khi còn ít nhất một kỹ năng hợp lệ sau khi lọc; không thì lấy theo phút.
  const aiPriority = Array.isArray(o.priority) ? [...new Set(o.priority.filter(isSkill))].slice(0, 2) : [];
  const priority =
    aiPriority.length > 0
      ? aiPriority
      : [...allocation].sort((a, b) => b.minutesPerWeek - a.minutesPerWeek).slice(0, 2).map((r) => r.skill);

  return {
    summary,
    risks: list(o.risks, 4),
    allocation,
    tips: list(o.tips, 4),
    priority,
  };
}

/** Ngân sách phút một tuần = phút mỗi ngày × số ngày học trong tuần. */
export function weeklyBudget(minutesPerDay: number, studyDaysPerWeek: number): number {
  return Math.max(0, minutesPerDay) * Math.max(0, studyDaysPerWeek);
}

/** So tổng phút AI phân bổ với ngân sách tuần. Lệch quá 10% thì ghi cảnh báo để người học biết. */
export function checkBudget(analysis: AiPlanAnalysis, budget: number): { ok: boolean; total: number; diff: number } {
  const total = analysis.allocation.reduce((sum, r) => sum + r.minutesPerWeek, 0);
  const diff = total - budget;
  const ok = budget > 0 && Math.abs(diff) <= budget * BUDGET_TOLERANCE;
  return { ok, total, diff };
}

/**
 * Phân bổ AI đề xuất cho từng kỹ năng, nhưng quy về đúng ngân sách tuần theo tỉ lệ. Kỹ năng
 * không có trong phân bổ thì 0 phút. Giữ tỉ lệ AI muốn, chỉ đổi quy mô cho khớp thời gian thật.
 */
export function scaleToBudget(allocation: AllocationRow[], budget: number): Array<{ skill: Skill; minutesPerWeek: number }> {
  const total = allocation.reduce((sum, r) => sum + r.minutesPerWeek, 0);
  if (total === 0 || budget <= 0) return allocation.map((r) => ({ skill: r.skill, minutesPerWeek: 0 }));
  const scaled = allocation.map((r) => ({ skill: r.skill, minutesPerWeek: Math.round((r.minutesPerWeek / total) * budget) }));
  return scaled;
}
