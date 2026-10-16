/**
 * Nhiệm vụ hằng ngày của tab Hôm nay, cá nhân hoá từ tiến độ người học.
 *
 * Ba nhiệm vụ mỗi ngày: một âm còn yếu, một bài ngữ pháp, một kịch bản nhập vai.
 * Chọn theo ngày nên cùng một ngày thì không đổi, sang ngày mới thì khác đi.
 */
import { PHONEMES } from './phonemes';
import { ALL_LESSONS } from './grammar-course';
import { ROLEPLAYS } from './roleplay';

export type DailyTask = {
  id: string;
  kind: 'phoneme' | 'grammar' | 'roleplay';
  title: string;
  route: string;
};

/** Hash nhỏ, ổn định theo chuỗi ngày — để cùng một ngày luôn chọn cùng một nhiệm vụ. */
export function dayHash(day: string): number {
  let h = 0;
  for (let i = 0; i < day.length; i += 1) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return h;
}

export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type DailyInput = {
  /** Điểm tốt nhất theo âm (0–100). Âm chưa luyện thì không có khoá. */
  phonemeBest: Record<string, number>;
  /** Bài ngữ pháp đã đạt: khoá là id bài. */
  lessonsDone: Record<string, string>;
  /** Số lần đã hoàn thành kịch bản nhập vai. */
  roleplayDone: Record<string, number>;
};

export function dailyTasks(day: string, input: DailyInput): DailyTask[] {
  const h = dayHash(day);

  // Âm yếu nhất trong năm âm đầu danh sách ưu tiên, để có chút thay đổi theo ngày.
  const ranked = [...PHONEMES].sort((a, b) => (input.phonemeBest[a.symbol] ?? -1) - (input.phonemeBest[b.symbol] ?? -1));
  const weak = ranked[h % 5]!;

  const nextLesson = ALL_LESSONS.find((l) => !input.lessonsDone[l.id]) ?? ALL_LESSONS[h % ALL_LESSONS.length]!;

  const sorted = [...ROLEPLAYS].sort((a, b) => (input.roleplayDone[a.id] ?? 0) - (input.roleplayDone[b.id] ?? 0));
  const play = sorted[h % Math.min(3, sorted.length)]!;

  return [
    { id: `phoneme:${weak.symbol}`, kind: 'phoneme', title: `Luyện tập âm /${weak.symbol}/`, route: `/hub/phoneme/${encodeURIComponent(weak.symbol)}` },
    { id: `grammar:${nextLesson.id}`, kind: 'grammar', title: `Luyện ngữ pháp: ${nextLesson.title}`, route: `/hub/grammar/${nextLesson.id}` },
    { id: `roleplay:${play.id}`, kind: 'roleplay', title: `Hoàn thành một Roleplay: ${play.title}`, route: `/hub/roleplay/${play.id}` },
  ];
}

/**
 * Số ngày liên tiếp có ít nhất một nhiệm vụ hoàn thành, tính lùi từ hôm nay.
 * Nếu hôm nay chưa làm gì thì chuỗi vẫn giữ theo hôm qua (chưa mất).
 */
export function streakDays(doneByDay: Record<string, string[]>, today: string): number {
  const has = (day: string) => (doneByDay[day]?.length ?? 0) > 0;
  const back = (day: string, n: number) => {
    const [y, m, d] = day.split('-').map(Number) as [number, number, number];
    const t = new Date(Date.UTC(y, m - 1, d - n));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  };
  let start = has(today) ? 0 : 1;
  let count = 0;
  while (has(back(today, start + count))) count += 1;
  return count;
}

/** Bảy ngày gần nhất kết thúc hôm nay, cũ → mới, kèm trạng thái đã làm. */
export function weekStrip(doneByDay: Record<string, string[]>, today: string): { day: string; done: boolean; isToday: boolean }[] {
  const out: { day: string; done: boolean; isToday: boolean }[] = [];
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  for (let i = 6; i >= 0; i -= 1) {
    const t = new Date(Date.UTC(y, m - 1, d - i));
    const day = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
    out.push({ day, done: (doneByDay[day]?.length ?? 0) > 0, isToday: i === 0 });
  }
  return out;
}
