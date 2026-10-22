/**
 * Gom sự kiện theo ngày, tên sự kiện, nguồn và chiến dịch rồi xuất CSV để anh đọc mỗi tuần.
 */
export type EventRow = {
  at: string;
  name: string;
  utm_source: string | null;
  utm_campaign: string | null;
  signed_in: boolean;
};

export type EventCount = { day: string; name: string; utm_source: string; utm_campaign: string; count: number };

export function countEvents(rows: EventRow[]): EventCount[] {
  const map = new Map<string, EventCount>();
  for (const r of rows) {
    const day = r.at.slice(0, 10);
    const utm_source = r.utm_source ?? '(không rõ)';
    const utm_campaign = r.utm_campaign ?? '(không rõ)';
    const key = [day, r.name, utm_source, utm_campaign].join('|');
    const hit = map.get(key);
    if (hit) hit.count += 1;
    else map.set(key, { day, name: r.name, utm_source, utm_campaign, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day) || a.name.localeCompare(b.name) || b.count - a.count);
}

/** CSV có BOM để Excel mở đúng tiếng Việt. Ô có dấu phẩy, ngoặc kép hoặc xuống dòng được bọc trong ngoặc kép. */
export function toCsv(counts: EventCount[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [['ngày', 'sự kiện', 'nguồn (utm_source)', 'chiến dịch (utm_campaign)', 'số lượt'].join(',')];
  for (const c of counts) lines.push([c.day, c.name, c.utm_source, c.utm_campaign, c.count].map(esc).join(','));
  return `﻿${lines.join('\n')}\n`;
}
