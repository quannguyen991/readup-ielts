import type { Bi } from '@/i18n/useL';
import type { HsaLevel } from '@/data/hsa';
import type { CriterionId } from './criteria';

/** Hồ sơ người học: sáu câu hỏi của bước "About you". */
export type HsaGrade = 'g10' | 'g11' | 'g12' | 'grad';
export type HsaReason = 'admission' | 'profile' | 'try' | 'english';

export type HsaProfile = {
  grade: HsaGrade;
  reason: HsaReason;
  /** Mục tiêu trên thang 50 câu của phần Tiếng Anh. */
  target: number;
  focus: CriterionId | 'all';
  selfLevel: HsaLevel;
  minutesPerDay: number;
  daysPerWeek: number;
  /** YYYY-MM-DD hoặc null khi chưa có lịch thi. */
  examDate: string | null;
  /** HH:MM, giờ bắt đầu học mỗi ngày. */
  startTime: string;
  createdAt: string;
};

export const GRADES: readonly { id: HsaGrade; label: Bi }[] = [
  { id: 'g10', label: { vi: 'Học sinh lớp 10', en: 'Grade 10 student' } },
  { id: 'g11', label: { vi: 'Học sinh lớp 11', en: 'Grade 11 student' } },
  { id: 'g12', label: { vi: 'Học sinh lớp 12', en: 'Grade 12 student' } },
  { id: 'grad', label: { vi: 'Đã tốt nghiệp, thi lại', en: 'Graduated, retaking' } },
];

export const REASONS: readonly { id: HsaReason; label: Bi }[] = [
  { id: 'admission', label: { vi: 'Xét tuyển đại học', en: 'University admission' } },
  { id: 'profile', label: { vi: 'Bổ sung hồ sơ', en: 'Strengthen my application' } },
  { id: 'try', label: { vi: 'Thử sức trước kỳ thi', en: 'Try it before the real exam' } },
  { id: 'english', label: { vi: 'Cải thiện tiếng Anh', en: 'Improve my English' } },
];

export const TARGETS: readonly number[] = [20, 25, 30, 35, 40, 45, 50];

export const SELF_LEVELS: readonly { id: HsaLevel; title: Bi; line: Bi }[] = [
  { id: 'A2', title: { vi: 'Mới bắt đầu', en: 'Just starting' }, line: { vi: 'Hiểu câu ngắn, còn sợ ngữ pháp', en: 'Understand short sentences, still unsure about grammar' } },
  { id: 'B1', title: { vi: 'Trung bình', en: 'Intermediate' }, line: { vi: 'Đọc được bài ngắn, hay sai thì và liên từ', en: 'Can read short texts, often slip on tenses and linkers' } },
  { id: 'B2', title: { vi: 'Khá', en: 'Upper-intermediate' }, line: { vi: 'Đọc bài dài được, cần chắc cấu trúc và từ vựng', en: 'Can read longer texts, need firmer structures and vocabulary' } },
  { id: 'C1', title: { vi: 'Giỏi', en: 'Advanced' }, line: { vi: 'Muốn đạt điểm cao, làm nhanh và ít sai', en: 'Aiming for a top score, fast and accurate' } },
];

export const MINUTES: readonly number[] = [30, 45, 60, 90];
export const STUDY_DAYS: readonly number[] = [5, 6, 7];

export const START_TIMES: readonly { time: string; label: Bi }[] = [
  { time: '06:30', label: { vi: 'Sáng sớm · 06:30', en: 'Early morning · 06:30' } },
  { time: '12:30', label: { vi: 'Trưa · 12:30', en: 'Noon · 12:30' } },
  { time: '19:30', label: { vi: 'Tối · 19:30', en: 'Evening · 19:30' } },
  { time: '21:30', label: { vi: 'Khuya · 21:30', en: 'Late night · 21:30' } },
];

export function validProfile(p: unknown): p is HsaProfile {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    GRADES.some((g) => g.id === o.grade) &&
    REASONS.some((r) => r.id === o.reason) &&
    typeof o.target === 'number' &&
    TARGETS.includes(o.target) &&
    (o.focus === 'all' || ['grammar', 'vocab', 'dialogue', 'reading', 'reasoning'].includes(String(o.focus))) &&
    SELF_LEVELS.some((l) => l.id === o.selfLevel) &&
    typeof o.minutesPerDay === 'number' &&
    o.minutesPerDay >= 10 &&
    o.minutesPerDay <= 300 &&
    typeof o.daysPerWeek === 'number' &&
    o.daysPerWeek >= 1 &&
    o.daysPerWeek <= 7 &&
    (o.examDate === null || (typeof o.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.examDate))) &&
    typeof o.startTime === 'string' &&
    /^\d{2}:\d{2}$/.test(o.startTime) &&
    typeof o.createdAt === 'string'
  );
}
