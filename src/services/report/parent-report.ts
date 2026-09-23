/**
 * BÁO CÁO TUẦN CHO PHỤ HUYNH — dựng từ dữ liệu học đã đồng bộ lên tài khoản.
 *
 * Phụ huynh là người trả tiền học ở Việt Nam, nhưng app luyện thi nào cũng chỉ
 * nói chuyện với học sinh. Báo cáo này trả lời đúng những câu phụ huynh hỏi:
 * tuần này con học bao lâu, có đều không, tiến bộ hay đi xuống, đang vướng gì.
 *
 * CHỈ SỐ ĐẾM — không bài viết, không ghi chú, không từng câu trả lời, không
 * email. Ngày tính theo giờ Việt Nam (máy học sinh ghi nhật ký theo giờ VN, còn
 * máy chủ chạy giờ UTC).
 */
import { MATH_ERROR_LABEL, type MathErrorTag } from '@/lib/math/types';
import { shortTitle } from '@/services/errors/profile';
import { MATH_WEIGHTS, predictSection, type Tally } from '@/services/prediction/score';

const DAY = 86_400_000;
const VN = 7 * 3_600_000;

export type ReportInput = {
  study?: { daily?: Record<string, { minutes?: number; questions?: number }> } | null;
  math?: { sessions?: { finishedAt: string; attempts: { domain: string; isCorrect: boolean; errorTag: string | null }[] }[] } | null;
  vocab?: { entries?: Record<string, { createdAt: string }>; reviewLog?: { reviewedAt: string }[] } | null;
  satrw?: { attempts?: Record<string, { correct: boolean; at: string }> } | null;
  weekly?: { results?: Record<string, { score: number; total: number; ms: number; at: string }> } | null;
};

export type ParentReport = {
  days: { date: string; minutes: number; questions: number }[];
  minutes7: number;
  minutesPrev7: number;
  questions7: number;
  activeDays7: number;
  streak: number;
  math: { questions7: number; accuracy7: number | null; accuracyPrev7: number | null; range: { low: number; high: number } | null };
  verbal: { questions7: number; accuracy7: number | null; accuracyPrev7: number | null };
  vocab: { saved: number; saved7: number; reviews7: number };
  weekly: { score: number; total: number; ms: number } | null;
  topErrors: { title: string; count: number }[];
};

/** "2026-09-23" theo giờ Việt Nam. */
export function vnDateKey(t: number): string {
  return new Date(t + VN).toISOString().slice(0, 10);
}

const ratio = (c: number, n: number) => (n > 0 ? c / n : null);

export function buildParentReport(input: ReportInput, now: number, weekKey: string | null = null): ParentReport {
  const daily = input.study?.daily ?? {};
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = vnDateKey(now - (6 - i) * DAY);
    const log = daily[date] ?? {};
    return { date, minutes: Math.round(log.minutes ?? 0), questions: Math.round(log.questions ?? 0) };
  });
  const prev = Array.from({ length: 7 }, (_, i) => daily[vnDateKey(now - (13 - i) * DAY)]?.minutes ?? 0);

  let streak = 0;
  for (let back = 0; back < 400; back += 1) {
    const active = (daily[vnDateKey(now - back * DAY)]?.minutes ?? 0) > 0;
    if (active) streak += 1;
    else if (back > 0) break;
  }

  const inLast = (iso: string, from: number, to: number) => {
    const age = now - new Date(iso).getTime();
    return age >= from * DAY && age < to * DAY;
  };

  // SAT Math: độ chính xác tuần này / tuần trước, lỗi hay mắc 14 ngày, khoảng điểm.
  let m7 = 0;
  let c7 = 0;
  let mp = 0;
  let cp = 0;
  const tags = new Map<string, number>();
  const tallies: Record<string, Tally> = {};
  for (const s of input.math?.sessions ?? []) {
    const thisWeek = inLast(s.finishedAt, 0, 7);
    const lastWeek = inLast(s.finishedAt, 7, 14);
    for (const a of s.attempts) {
      if (thisWeek) {
        m7 += 1;
        if (a.isCorrect) c7 += 1;
      } else if (lastWeek) {
        mp += 1;
        if (a.isCorrect) cp += 1;
      }
      if ((thisWeek || lastWeek) && !a.isCorrect && a.errorTag) tags.set(a.errorTag, (tags.get(a.errorTag) ?? 0) + 1);
      const t = (tallies[a.domain] ??= { correct: 0, total: 0 });
      if (t.total < 150) {
        t.total += 1;
        if (a.isCorrect) t.correct += 1;
      }
    }
  }
  const prediction = predictSection(tallies, MATH_WEIGHTS);

  let v7 = 0;
  let vc7 = 0;
  let vp = 0;
  let vcp = 0;
  for (const a of Object.values(input.satrw?.attempts ?? {})) {
    if (inLast(a.at, 0, 7)) {
      v7 += 1;
      if (a.correct) vc7 += 1;
    } else if (inLast(a.at, 7, 14)) {
      vp += 1;
      if (a.correct) vcp += 1;
    }
  }

  const entries = Object.values(input.vocab?.entries ?? {});
  const week = weekKey ? input.weekly?.results?.[weekKey] : undefined;

  return {
    days,
    minutes7: days.reduce((s, d) => s + d.minutes, 0),
    minutesPrev7: Math.round(prev.reduce((s, m) => s + m, 0)),
    questions7: days.reduce((s, d) => s + d.questions, 0),
    activeDays7: days.filter((d) => d.minutes > 0).length,
    streak,
    math: { questions7: m7, accuracy7: ratio(c7, m7), accuracyPrev7: ratio(cp, mp), range: prediction ? { low: prediction.low, high: prediction.high } : null },
    verbal: { questions7: v7, accuracy7: ratio(vc7, v7), accuracyPrev7: ratio(vcp, vp) },
    vocab: {
      saved: entries.length,
      saved7: entries.filter((e) => inLast(e.createdAt, 0, 7)).length,
      reviews7: (input.vocab?.reviewLog ?? []).filter((r) => inLast(r.reviewedAt, 0, 7)).length,
    },
    weekly: week ? { score: week.score, total: week.total, ms: week.ms } : null,
    topErrors: [...tags.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ title: MATH_ERROR_LABEL[tag as MathErrorTag] ? shortTitle(MATH_ERROR_LABEL[tag as MathErrorTag]) : tag, count })),
  };
}
