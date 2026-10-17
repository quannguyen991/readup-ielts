import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Làm mới danh sách video VOA Learning English trên YouTube.
 *
 *   node scripts/ingest-voa-video.mjs
 *
 * CHỈ LẤY SIÊU DỮ LIỆU: id, tiêu đề, kênh, ngày đăng, thời lượng. Không tải video,
 * không lưu phụ đề. Video phát bằng trình nhúng chính thức của YouTube.
 *
 * VOA Learning English do cơ quan liên bang Hoa Kỳ sản xuất, thuộc phạm vi công
 * cộng. Vẫn ghi nguồn khi hiện trên màn (xem `VOA_NGUON` trong luyen-doc.ts).
 *
 * Trang kênh KHÔNG xếp theo ngày đăng (đo 17/10/2026: video đầu danh sách có năm
 * 2025), nên script đọc ngày từ từng trang xem rồi mới sắp xếp.
 *
 * AN TOÀN: nếu bóc được quá ít video (trang đổi cấu trúc, mất mạng), script dừng và
 * GIỮ NGUYÊN seed cũ thay vì ghi đè bằng danh sách rỗng.
 */

const CHANNEL_URL = 'https://www.youtube.com/@VOALearningEnglish/videos';
const CHANNEL_NAME = 'VOA Learning English';
const OUT = join('src', 'data', 'seed', 'voa-video', 'index.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const MAX_ITEMS = 30;
const MIN_SECONDS = 60; // dưới một phút thường là Shorts, không hợp để nghe và chép
const MAX_SECONDS = 1800; // quá 30 phút thì quá dài cho một buổi luyện
const MIN_KEEP = 5; // ít hơn mức này coi như bóc hỏng, không ghi đè

async function get(url) {
  const r = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
}

/** Id video theo đúng thứ tự xuất hiện trên trang kênh, bỏ trùng. */
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

/** Ngày đăng theo GIỜ VIỆT NAM. Trang xem ghi theo múi giờ của kênh (thường là Los Angeles). */
function vnDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
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

async function main() {
  const html = await get(CHANNEL_URL);
  const ids = videoIds(html).slice(0, 40);
  console.log(`trang kênh: ${ids.length} id`);

  const rows = [];
  // Bốn video một lượt: đủ nhanh mà không làm YouTube chặn.
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.allSettled(ids.slice(i, i + 4).map(one));
    for (const b of batch) if (b.status === 'fulfilled') rows.push(b.value);
  }

  const keep = rows
    .filter((v) => v.channel === CHANNEL_NAME)
    .filter((v) => v.title && v.publishedAt)
    .filter((v) => v.durationSeconds === null || (v.durationSeconds >= MIN_SECONDS && v.durationSeconds <= MAX_SECONDS))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
    .slice(0, MAX_ITEMS);

  console.log(`giữ được ${keep.length} video (từ ${rows.length} trang xem)`);
  if (keep.length < MIN_KEEP) {
    console.log(`✖ quá ít (< ${MIN_KEEP}) — giữ nguyên seed cũ, không ghi đè.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(keep, null, 2) + '\n', 'utf8');
  console.log(`✔ ghi ${OUT}: ${keep.length} video, mới nhất ${keep[0].publishedAt}, cũ nhất ${keep.at(-1).publishedAt}`);
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exitCode = 1;
});
