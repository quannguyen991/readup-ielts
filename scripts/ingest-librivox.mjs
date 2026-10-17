import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Làm mới thư viện sách nói LibriVox.
 *
 *   node scripts/ingest-librivox.mjs
 *
 * LibriVox là dự án tình nguyện đọc sách thuộc phạm vi công cộng. Script chỉ lấy
 * siêu dữ liệu và đường dẫn MP3 của từng chương. App phát thẳng từ máy chủ của
 * LibriVox/Internet Archive, không tải về và không lưu bản sao. Tên người đọc được
 * ghi trên màn, đúng cách LibriVox yêu cầu.
 *
 * Cách tìm: `title=^<tiền tố>` (có dấu mũ = bắt đầu bằng). Tìm đủ cả tên sách thường
 * ra 404, nên đã dùng tiền tố (đo 17/10/2026).
 *
 * AN TOÀN: sách không có chương MP3 hợp lệ thì bỏ. Nếu không còn sách nào thì giữ
 * nguyên seed cũ thay vì ghi đè bằng danh sách rỗng.
 */

const OUT = join('src', 'data', 'seed', 'librivox', 'index.json');
const API = 'https://librivox.org/api/feed/audiobooks/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/**
 * Danh mục đã chọn: sách kinh điển thuộc phạm vi công cộng, đọc rõ, có chương ngắn.
 * `match` là biểu thức khớp TÊN SÁCH để chọn đúng bản, tránh lấy nhầm bản phụ.
 * Trình độ là đánh giá chung theo độ khó của văn bản gốc, không phải theo bản đọc.
 */
const CATALOG = [
  { query: 'Happy Prince', match: /^happy prince/i, level: 'A2', topic: 'Truyện cổ tích' },
  { query: "Aesop's Fables, Volume 01", match: /^aesop'?s fables,? volume 01/i, level: 'A2', topic: 'Truyện ngụ ngôn' },
  { query: 'Gift of the Magi', match: /^gift of the magi/i, level: 'A2', topic: 'Truyện ngắn' },
  { query: "Alice's Adventures in Wonderland", match: /^alice'?s adventures in wonderland$/i, level: 'B1', topic: 'Truyện thiếu nhi' },
  { query: 'Canterville Ghost', match: /^canterville ghost/i, level: 'B1', topic: 'Truyện ngắn' },
  { query: 'Time Machine', match: /^time machine/i, level: 'B2', topic: 'Khoa học viễn tưởng' },
  { query: 'Adventures of Sherlock Holmes', match: /^adventures of sherlock holmes/i, level: 'B2', topic: 'Trinh thám' },
  { query: 'Pride and Prejudice', match: /^pride and prejudice$/i, level: 'B2', topic: 'Tiểu thuyết kinh điển' },
];

async function api(params) {
  const r = await fetch(`${API}?${params}&format=json`, {
    headers: { 'user-agent': UA },
    signal: AbortSignal.timeout(30000),
  });
  // 404 nghĩa là không có kết quả, không phải lỗi mạng: trả về danh sách rỗng.
  if (r.status === 404) return { books: [] };
  if (!r.ok) throw new Error(`HTTP ${r.status} ${API}?${params}`);
  return r.json();
}

/** Chọn đúng một bản: tiếng Anh, tên khớp, bỏ bản "version"/"dramatic reading", lấy id nhỏ nhất. */
function pickBook(books, entry) {
  const candidates = (books ?? [])
    .filter((b) => entry.match.test(String(b.title ?? '').trim()))
    .filter((b) => /english/i.test(String(b.language ?? '')))
    .filter((b) => !/\((version|dramatic)/i.test(String(b.title ?? '')));
  candidates.sort((a, b) => Number(a.id) - Number(b.id));
  return candidates[0] ?? null;
}

/** Chương có MP3 HTTPS và thời lượng hợp lệ; mọi chương khác bị bỏ. */
function chaptersOf(book) {
  return (book.sections ?? [])
    .map((s) => ({
      n: Number(s.section_number),
      title: String(s.title ?? '').trim(),
      seconds: Number(s.playtime) || 0,
      url: String(s.listen_url ?? '').replace(/^http:\/\//, 'https://'),
      readers: (s.readers ?? []).map((r) => String(r.display_name ?? '').trim()).filter(Boolean),
    }))
    .filter((c) => c.seconds > 0 && /^https:\/\/[^\s]+\.mp3$/i.test(c.url))
    .sort((a, b) => a.n - b.n)
    .map(({ readers, ...rest }) => ({ ...rest, reader: readers.join(', ') }));
}

async function build(entry) {
  const found = await api(`title=${encodeURIComponent('^' + entry.query)}`);
  const hit = pickBook(found.books, entry);
  if (!hit) {
    console.log(`· bỏ "${entry.query}": không có bản tiếng Anh khớp tên`);
    return null;
  }

  const full = await api(`id=${hit.id}&extended=1`);
  const book = (full.books ?? [])[0];
  const chapters = book ? chaptersOf(book) : [];
  if (!book || chapters.length === 0) {
    console.log(`· bỏ "${entry.query}" (id ${hit.id}): không có chương MP3 hợp lệ`);
    return null;
  }

  const readers = [...new Set(chapters.map((c) => c.reader).filter(Boolean))];
  return {
    id: String(book.id),
    title: String(book.title).trim(),
    author: (book.authors ?? [])
      .map((a) => [a.first_name, a.last_name].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', '),
    language: 'English',
    level: entry.level,
    topic: entry.topic,
    totalSeconds: chapters.reduce((s, c) => s + c.seconds, 0),
    readers,
    sourceUrl: String(book.url_librivox ?? ''),
    chapters,
  };
}

async function main() {
  const rows = [];
  for (const entry of CATALOG) {
    const row = await build(entry);
    if (row) {
      rows.push(row);
      console.log(`✔ ${row.title} — ${row.chapters.length} chương, ${Math.round(row.totalSeconds / 60)} phút`);
    }
  }

  if (rows.length < 3) {
    console.log(`✖ chỉ có ${rows.length} sách (< 3) — giữ nguyên seed cũ, không ghi đè.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  console.log(`✔ ghi ${OUT}: ${rows.length} sách`);
}

main().catch((e) => {
  console.error('✖', e.message);
  process.exitCode = 1;
});
