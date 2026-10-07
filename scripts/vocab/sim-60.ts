import { addDays, loadByDay, nextReview, type ReviewEntry } from '../../src/services/vocab/review-schedule';

/** Mô phỏng người học: học N từ mới mỗi ngày trong `newDays` ngày, mỗi ngày ôn hết từ đến hạn. wrongRate = tỷ lệ trả lời sai. */
function run(newPerDay: number, newDays: number, horizon: number, wrongRate: number) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const start = '2026-10-08';
  const reviews: Record<string, Record<string, ReviewEntry>> = { d: {} };
  const rows: string[] = [];
  for (let day = 0; day < horizon; day += 1) {
    const today = addDays(start, day);
    const due = Object.entries(reviews.d!).filter(([, e]) => e.due <= today).map(([w]) => w);
    for (const w of due) {
      const ok = rnd() >= wrongRate;
      reviews.d![w] = nextReview(reviews.d![w], ok, today, loadByDay(reviews, today, { slug: 'd', word: w }));
    }
    let added = 0;
    if (day < newDays) for (let i = 0; i < newPerDay; i += 1) {
      const w = `w${day}-${i}`;
      reviews.d![w] = nextReview(undefined, true, today, loadByDay(reviews, today, { slug: 'd', word: w }));
      added += 1;
    }
    rows.push(`N${String(day + 1).padStart(2, ' ')} ${today}  ôn ${String(due.length).padStart(3)}  mới ${String(added).padStart(3)}`);
  }
  return rows;
}
const [np, nd, h, wr] = process.argv.slice(2).map(Number);
console.log(run(np!, nd!, h!, wr!).join('\n'));
