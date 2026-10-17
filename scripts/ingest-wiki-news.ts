import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  currentEventsTitle,
  parseCurrentEvents,
  type WikiNewsItem,
} from '../src/services/news/wiki-current-events';

/**
 * Làm mới tin tiếng Anh hằng ngày từ trang "Portal:Current events" của Wikipedia.
 *
 *   npx tsx scripts/ingest-wiki-news.ts
 *
 * Nội dung Wikipedia thuộc CC BY-SA 4.0: mỗi tin giữ `sourceUrl` và `license`, và màn
 * hình phải ghi nguồn. Script chỉ tải wikitext qua API công khai, không cào trang.
 *
 * Tải 7 ngày gần nhất theo GIỜ VIỆT NAM. Ngày nào chưa có trang thì bỏ qua. Seed cũ
 * của các ngày khác vẫn được giữ trong 14 ngày gần nhất.
 *
 * AN TOÀN: nếu tải về quá ít tin (mất mạng, API đổi), script dừng và giữ nguyên seed cũ.
 */

const OUT = join('src', 'data', 'seed', 'wiki-news', 'index.json');
const DAYS_TO_FETCH = 7;
const DAYS_TO_KEEP = 14;
const MIN_KEEP = 5;
const UA = 'Band9-ReadUp/1.0 (+https://band9-ielts.vercel.app; English reading practice app)';

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
function vnToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) + delta * 86_400_000).toISOString().slice(0, 10);
}

/** Wikitext của một trang tin, hoặc null nếu trang chưa có. */
async function fetchWikitext(isoDate: string): Promise<string | null> {
  const title = currentEventsTitle(isoDate);
  const url =
    'https://en.wikipedia.org/w/api.php?action=parse' +
    `&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`;
  const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} cho ${title}`);
  const j = (await r.json()) as { error?: unknown; parse?: { wikitext?: string } };
  if (j.error) return null;
  return typeof j.parse?.wikitext === 'string' ? j.parse.wikitext : null;
}

async function main() {
  const today = vnToday();
  const fresh: WikiNewsItem[] = [];

  for (let i = 0; i < DAYS_TO_FETCH; i++) {
    const day = shiftDays(today, -i);
    const wt = await fetchWikitext(day);
    if (!wt) {
      console.log(`· ${day}: chưa có trang`);
      continue;
    }
    const items = parseCurrentEvents(wt, day);
    console.log(`✔ ${day}: ${items.length} tin`);
    fresh.push(...items);
  }

  if (fresh.length < MIN_KEEP) {
    console.log(`✖ chỉ có ${fresh.length} tin (< ${MIN_KEEP}) — giữ nguyên seed cũ, không ghi đè.`);
    process.exitCode = 1;
    return;
  }

  // Ngày nào vừa tải thì thay hẳn bằng bản mới; ngày khác còn trong cửa sổ thì giữ.
  const cutoff = shiftDays(today, -(DAYS_TO_KEEP - 1));
  const freshDays = new Set(fresh.map((i) => i.date));
  const old: WikiNewsItem[] = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as WikiNewsItem[]) : [];
  const kept = old.filter((i) => i.date >= cutoff && !freshDays.has(i.date));

  const merged = [...fresh, ...kept].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id, undefined, { numeric: true }),
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`✔ ghi ${OUT}: ${merged.length} tin, ${new Set(merged.map((i) => i.date)).size} ngày`);
}

main().catch((e: unknown) => {
  console.error('✖', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
