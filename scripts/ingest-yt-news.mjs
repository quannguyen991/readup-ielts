import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Làm mới video tin tức từ nhiều kênh YouTube (Vietnam Today, BBC News).
 *
 *   node scripts/ingest-yt-news.mjs
 *
 * CHỈ LẤY SIÊU DỮ LIỆU: id, tiêu đề, tên kênh, ngày đăng, thời lượng. Không tải video,
 * không lưu phụ đề. Video phát bằng trình nhúng chính thức của YouTube. Nội dung thuộc
 * chủ kênh; app ghi tên kênh trên thẻ và dẫn về video gốc.
 *
 * Trang kênh không xếp theo ngày, nên ngày lấy từ từng trang xem. Chỉ giữ video trong
 * MAX_AGE_DAYS ngày gần nhất và dài từ 1 đến 30 phút.
 *
 * AN TOÀN: kênh nào bóc được quá ít video thì giữ nguyên seed cũ, không ghi đè.
 */

const OUT = join('src', 'data', 'seed', 'yt-news', 'index.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const CHANNELS = [
  { handle: 'vietnamtodayinternational', name: /vietnam\s*today/i, source: 'Vietnam Today' },
  { handle: 'BBCNews', name: /^bbc news$/i, source: 'BBC News' },
];
const MAX_PER_CHANNEL = 15;
const MAX_AGE_DAYS = 90;
const MIN_SECONDS = 60;
const MAX_SECONDS = 1800;
const MIN_PER_CHANNEL = 3;

async function get(url) {
  const r = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
}

function videoIds(html) {
  const seen = new Set();
  const out = [];
  for (const m of html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
  }
  return out;
}

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
function vnDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
}

function shiftDays(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + delta * 86_400_000).toISOString().slice(0, 10);
}

async function one(id) {
  const [watch, oe] = await Promise.all([
    get(`https://www.youtube.com/watch?v=${id}`),
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(20000),
    }).then((r) => (r.ok ? r.json() : null)),
  ]);
  const date = /"uploadDate":"([^"]+)"/.exec(watch) ?? /itemprop="datePublished" content="([^"]+)"/.exec(watch);
  const len = /"lengthSeconds":"(\d+)"/.exec(watch);
  return {
    id,
    title: String(oe?.title ?? '').trim(),
    channel: String(oe?.author_name ?? '').trim(),
    publishedAt: date ? vnDate(date[1]) : null,
    durationSeconds: len ? Number(len[1]) : null,
  };
}

async function channelRows(ch, today) {
  const html = await get(`https://www.youtube.com/@${ch.handle}/videos`);
  const ids = videoIds(html).slice(0, 40);
  const rows = [];
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.allSettled(ids.slice(i, i + 4).map(one));
    for (const b of batch) if (b.status === 'fulfilled') rows.push(b.value);
  }
  const cutoff = shiftDays(today, -MAX_AGE_DAYS);
  const keep = rows
    .filter((v) => ch.name.test(v.channel) && v.title && v.publishedAt)
    .filter((v) => v.publishedAt >= cutoff)
    .filter((v) => v.durationSeconds !== null && v.durationSeconds >= MIN_SECONDS && v.durationSeconds <= MAX_SECONDS)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
    .slice(0, MAX_PER_CHANNEL)
    .map((v) => ({ ...v, source: ch.source }));
  console.log(`· ${ch.source}: giữ ${keep.length} (từ ${rows.length} trang xem)`);
  return keep;
}

async function main() {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const all = [];
  for (const ch of CHANNELS) {
    const rows = await channelRows(ch, today);
    if (rows.length < MIN_PER_CHANNEL) {
      console.log(`✖ ${ch.source}: quá ít (< ${MIN_PER_CHANNEL}), giữ nguyên dữ liệu cũ của kênh này.`);
      continue;
    }
    all.push(...rows);
  }
  if (all.length === 0) {
    console.log('✖ không có video nào — giữ nguyên seed cũ, không ghi đè.');
    process.exitCode = 1;
    return;
  }
  all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(all, null, 2) + '\n', 'utf8');
  console.log(`✔ ghi ${OUT}: ${all.length} video`);
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exitCode = 1;
});
