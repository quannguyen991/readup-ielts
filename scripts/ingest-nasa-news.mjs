import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Làm mới tin khoa học từ NASA (RSS công khai).
 *
 *   node scripts/ingest-nasa-news.mjs
 *
 * Nội dung NASA do cơ quan liên bang Hoa Kỳ phát hành, thuộc phạm vi công cộng; vẫn
 * ghi nguồn và đường dẫn bài gốc. Script chỉ lấy tiêu đề, ngày và đoạn tóm tắt ngắn,
 * không lưu ảnh và không sao chép toàn văn.
 *
 * AN TOÀN: nếu feed trả quá ít bài (đổi định dạng, mất mạng), giữ nguyên seed cũ.
 */

const FEED = 'https://www.nasa.gov/feed/';
const OUT = join('src', 'data', 'seed', 'nasa-news', 'index.json');
const UA = 'Band9-ReadUp/1.0 (+https://band9-ielts.vercel.app; English reading practice app)';
const MAX_ITEMS = 25;
const MIN_KEEP = 5;
const SUMMARY_MAX = 420;

const ENTITIES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#039;': "'", '&apos;': "'", '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&ndash;': '–', '&mdash;': '—', '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“' };

function plain(s) {
  return String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-zA-Z#0-9]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
  return m ? m[1] : '';
}

function summarize(text) {
  if (text.length <= SUMMARY_MAX) return text;
  const cut = text.slice(0, SUMMARY_MAX);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…').trim();
}

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
function vnDate(text) {
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
}

async function main() {
  const r = await fetch(FEED, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${FEED}`);
  const xml = await r.text();

  const rows = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1] ?? '';
    const title = plain(tag(block, 'title'));
    const link = plain(tag(block, 'link'));
    const date = vnDate(plain(tag(block, 'pubDate')));
    const summary = summarize(plain(tag(block, 'description')));
    if (!title || !link || !date) continue;
    rows.push({ title, link, date, summary });
  }

  rows.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const kept = rows.slice(0, MAX_ITEMS);
  if (kept.length < MIN_KEEP) {
    console.log(`✖ chỉ có ${kept.length} bài (< ${MIN_KEEP}) — giữ nguyên seed cũ, không ghi đè.`);
    process.exitCode = 1;
    return;
  }

  const items = kept.map((row, i) => ({
    id: `nasa-${row.date}-${i + 1}`,
    date: row.date,
    section: 'NASA news',
    headline: row.title,
    details: row.summary ? [row.summary] : [],
    sourceUrl: row.link,
    license: 'Phạm vi công cộng (NASA)',
    source: 'nasa',
  }));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`✔ ghi ${OUT}: ${items.length} bài, mới nhất ${items[0].date}`);
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exitCode = 1;
});
