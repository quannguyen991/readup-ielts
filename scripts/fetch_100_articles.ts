import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { currentEventsTitle, parseCurrentEvents, type WikiNewsItem } from '../src/services/news/wiki-current-events';

const OUT = join('src', 'data', 'seed', 'wiki-news', 'index.json');
const UA = 'Band9-ReadUp/1.0 (+https://band9-ielts.vercel.app; English reading practice app)';

const TARGET_DAYS = [
  '2026-10-10', '2026-10-09', '2026-10-08', '2026-10-07', '2026-10-06',
  '2026-10-05', '2026-10-04', '2026-10-03', '2026-10-02', '2026-10-01',
  '2026-09-30', '2026-09-29', '2026-09-28', '2026-09-27', '2026-09-26',
  '2026-09-25', '2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21'
];

async function fetchDay(day: string): Promise<WikiNewsItem[]> {
  const title = currentEventsTitle(day);
  const url = 'https://en.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(title) + '&prop=wikitext&format=json&formatversion=2';
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) return [];
    const j = (await res.json()) as { parse?: { wikitext?: string } };
    if (!j.parse?.wikitext) return [];
    return parseCurrentEvents(j.parse.wikitext, day);
  } catch (e) {
    console.warn(`Failed to fetch ${day}:`, e);
    return [];
  }
}

async function run() {
  const existingRaw = readFileSync(OUT, 'utf-8');
  const existing: WikiNewsItem[] = JSON.parse(existingRaw);
  console.log(`Current items in ${OUT}: ${existing.length}`);
  const existingIds = new Set(existing.map((x) => x.id));

  const newItems: WikiNewsItem[] = [];

  for (const day of TARGET_DAYS) {
    console.log(`Fetching ${day}...`);
    const items = await fetchDay(day);
    const filtered = items.filter((it) => !existingIds.has(it.id));
    console.log(` -> ${day}: found ${items.length} items (${filtered.length} new)`);
    for (const item of filtered) {
      newItems.push(item);
      existingIds.add(item.id);
    }
    if (newItems.length >= 105) {
      console.log(`Reached target with ${newItems.length} new items! Stopping.`);
      break;
    }
  }

  console.log(`Total new items collected: ${newItems.length}`);
  if (newItems.length < 100) {
    console.error(`Only got ${newItems.length} items, less than 100!`);
    return;
  }

  // Combine: existing + newItems, sorted descending by date then id
  const combined = [...existing, ...newItems].sort((a, b) =>
    b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
  );

  writeFileSync(OUT, JSON.stringify(combined, null, 2) + '\n', 'utf-8');
  console.log(`Successfully wrote ${combined.length} total items (+${newItems.length} new) to ${OUT}`);
}

run();
