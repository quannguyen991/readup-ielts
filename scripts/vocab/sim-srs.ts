/**
 * MÔ PHỎNG lịch ôn: người học thêm N từ mới mỗi ngày, ôn đúng những từ đến hạn, ký ức quên theo đường cong.
 * npx tsx scripts/vocab/sim-srs.ts [từ-mới-mỗi-ngày=10] [số-ngày=120]
 * Mô hình trí nhớ (đơn giản, chỉ để SO SÁNH hai bộ lập lịch, không phải số liệu người thật):
 *   xác suất nhớ R = 2^(-Δ/S), S = "bán rã" (ngày). Nhớ → S ×(1,5 + 2·(1−R)); quên → thấy đáp án rồi học lại: S = max(2, S×0,4). S ban đầu = 3 ngày (đã gặp nhiều lần trong buổi học).
 */
import { addDays, INTERVALS, loadByDay, nextReview, type ReviewEntry } from '../../src/services/vocab/review-schedule';
import { nextReview as legacyNext } from './legacy-review-schedule';

type Mem = { S: number; last: number };
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Scheduler = (prev: ReviewEntry | undefined, ok: boolean, today: string, load: Record<string, number>) => ReviewEntry;

export type Memory = { s0: number; grow: number; growLate: number; relearn: number };
export const WEAK: Memory = { s0: 3, grow: 1.5, growLate: 2, relearn: 2 };
export const NORMAL: Memory = { s0: 5, grow: 2.2, growLate: 2.5, relearn: 3 };

export function simulate(sched: Scheduler, perDay: number, days: number, seed = 7, mm: Memory = NORMAL) {
  const rnd = mulberry(seed);
  const t0 = '2026-10-01';
  const reviews: Record<string, Record<string, ReviewEntry>> = { deck: {} };
  const mem = new Map<string, Mem>();
  let id = 0;
  const loads: number[] = [];
  const rAtReview: number[] = [];
  const overdue: number[] = [];
  let lapses = 0;
  let reviewsDone = 0;
  const firstGap: number[] = [];
  for (let d = 0; d < days; d += 1) {
    const today = addDays(t0, d);
    const due = Object.entries(reviews.deck!).filter(([, e]) => e.due <= today).map(([w, e]) => [w, e] as const);
    loads.push(due.length);
    for (const [w, e] of due) {
      const m = mem.get(w)!;
      const dt = d - m.last;
      const R = Math.pow(2, -dt / m.S);
      const ok = rnd() < R;
      rAtReview.push(R);
      overdue.push(Math.max(0, d - Math.round((new Date(e.due).getTime() - new Date(t0).getTime()) / 864e5)));
      reviewsDone += 1;
      if (!ok) lapses += 1;
      m.S = ok ? m.S * (mm.grow + mm.growLate * (1 - R)) : Math.max(mm.relearn, m.S * 0.4);
      m.last = d;
      const load = loadByDay(reviews, today, { slug: 'deck', word: w });
      reviews.deck![w] = sched(e, ok, today, load);
    }
    for (let k = 0; k < perDay; k += 1) {
      const w = `w${id++}`;
      mem.set(w, { S: mm.s0, last: d });
      const load = loadByDay(reviews, today, { slug: 'deck', word: w });
      reviews.deck![w] = sched(undefined, true, today, load);
      firstGap.push(Math.round((new Date(reviews.deck![w]!.due).getTime() - new Date(today).getTime()) / 864e5));
    }
  }
  // giữ lại cuối: trung bình xác suất nhớ của mọi từ đã học
  let sumR = 0;
  let n = 0;
  for (const [w, m] of mem) {
    sumR += Math.pow(2, -(days - m.last) / m.S);
    n += 1;
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const pct = (a: number[], f: (x: number) => boolean) => (a.length ? (a.filter(f).length / a.length) * 100 : 0);
  return {
    words: n,
    reviews: reviewsDone,
    avgDailyLoad: avg(loads),
    maxDailyLoad: Math.max(...loads),
    lastMonthLoad: avg(loads.slice(-30)),
    avgFirstReviewGap: avg(firstGap),
    avgOverdueDays: avg(overdue),
    pctOverdue3plus: pct(overdue, (x) => x >= 3),
    avgRecallAtReview: avg(rAtReview),
    pctReviewBelow60: pct(rAtReview, (x) => x < 0.6),
    lapseRate: reviewsDone ? (lapses / reviewsDone) * 100 : 0,
    avgRecallAllWordsNow: n ? (sumR / n) * 100 : 0,
  };
}

if (process.argv[1]?.endsWith('sim-srs.ts')) {
  const perDay = Number(process.argv[2] ?? 10);
  const days = Number(process.argv[3] ?? 120);
  const pick = (r: ReturnType<typeof simulate>) => ({
    'lần ôn đầu sau (ngày)': r.avgFirstReviewGap.toFixed(1),
    'nhớ khi ôn (R trung bình)': `${(r.avgRecallAtReview * 100).toFixed(0)}%`,
    'tỉ lệ quên lúc ôn': `${r.lapseRate.toFixed(0)}%`,
    'nhớ trung bình mọi từ đã học, hôm nay': `${r.avgRecallAllWordsNow.toFixed(0)}%`,
    'lượt ôn/ngày (tháng cuối)': r.lastMonthLoad.toFixed(0),
    'ngày nặng nhất': r.maxDailyLoad,
  });
  for (const [label, mm] of [['trí nhớ trung bình (S0=5 ngày)', NORMAL], ['trí nhớ yếu (S0=3 ngày)', WEAK]] as const) {
    console.log(`=== ${perDay} từ mới/ngày × ${days} ngày — ${label} ===`);
    console.log('BẢN CŨ  :', JSON.stringify(pick(simulate((p, ok, today, load) => legacyNext(p, ok, today, load), perDay, days, 7, mm))));
    console.log('BẢN MỚI :', JSON.stringify(pick(simulate((p, ok, today, load) => nextReview(p, ok, today, load), perDay, days, 7, mm))));
  }
  // Thử bậc thang nhẹ hơn (chỉ trong mô phỏng, không đổi app): 1,3,7,16,35,80,180,365
  const saved = [...INTERVALS];
  (INTERVALS as unknown as number[]).splice(0, INTERVALS.length, 1, 3, 7, 16, 35, 80, 180, 365);
  console.log('--- thử bậc thang nhẹ 1,3,7,16,35,80,180,365 ---');
  for (const [label, mm] of [['trí nhớ trung bình', NORMAL], ['trí nhớ yếu', WEAK]] as const) console.log(label, ':', JSON.stringify(pick(simulate((p, ok, today, load) => nextReview(p, ok, today, load), perDay, days, 7, mm))));
  (INTERVALS as unknown as number[]).splice(0, INTERVALS.length, ...saved);
}
