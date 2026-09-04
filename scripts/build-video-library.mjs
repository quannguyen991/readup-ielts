import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dựng thư viện video luyện nghe.
 *
 *   node scripts/build-video-library.mjs
 *
 * CHỈ LẤY SIÊU DỮ LIỆU ĐỂ NHÚNG: id video, tiêu đề, tên kênh, thời lượng. Không
 * tải video, không lưu phụ đề, không chép mô tả. Đó là ranh giới quan trọng —
 * một danh sách id để nhúng là dữ liệu dùng cho đúng việc mà trình nhúng chính
 * thức của YouTube sinh ra để làm, còn phụ đề và nội dung là của chủ kênh.
 *
 * KHÔNG LẤY TỪ APP KHÁC. Danh sách bài của một nền tảng học khác là công sức
 * tuyển chọn của họ; chép về là lấy đúng phần giá trị nhất của sản phẩm ấy. Ở
 * đây tuyển thẳng từ trang kênh trên YouTube.
 *
 * Hai nguồn, dùng đúng chỗ:
 *   · trang kênh  → danh sách id video mới nhất (kèm thời lượng nếu bóc được)
 *   · oEmbed      → tiêu đề và tên kênh CHUẨN, đây là API metadata công khai
 *                   chính thức của YouTube, không cần khoá
 */

const OUT = join('src', 'data', 'seed', 'video-library', 'index.json');
const PER_CHANNEL = 22;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/**
 * Kênh nguồn, kèm trình độ và chủ đề.
 *
 * Trình độ gán theo KÊNH chứ không theo từng video: mỗi kênh có một giọng và một
 * mật độ từ vựng khá ổn định, và đoán trình độ từng video mà không nghe qua thì
 * chỉ là bịa cho có nhãn. Người học vẫn tự đổi được khi thấy lệch.
 */
const CHANNELS = [
  { handle: 'bbclearningenglish', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'EasyEnglishVideos', level: 'A2', topic: 'Phỏng vấn đường phố' },
  { handle: 'TEDEd', level: 'B1', topic: 'Kiến thức phổ thông' },
  { handle: 'SciShow', level: 'B1', topic: 'Khoa học' },
  { handle: 'kurzgesagt', level: 'B2', topic: 'Khoa học' },
  { handle: 'NatGeo', level: 'B2', topic: 'Thiên nhiên' },
  { handle: 'veritasium', level: 'B2', topic: 'Khoa học' },
  { handle: 'Vox', level: 'C1', topic: 'Thời sự và xã hội' },
  { handle: 'TED', level: 'C1', topic: 'Bài nói' },
  { handle: 'Wendoverproductions', level: 'C1', topic: 'Kinh tế và hạ tầng' },
];

/** Bóc id video theo đúng thứ tự xuất hiện trên trang kênh. */
function videoIds(html) {
  const seen = new Set();
  const out = [];
  for (const m of html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Thời lượng, bóc từ nhãn trợ năng nằm gần id trong cùng khối.
 *
 * Best-effort: YouTube đổi hình dạng dữ liệu trang kênh khá thường xuyên, nên
 * thiếu thời lượng KHÔNG được coi là lỗi — thẻ vẫn dùng được, chỉ là không hiện
 * được con số phút.
 */
function durationFor(html, id) {
  const at = html.indexOf(`"${id}"`);
  if (at < 0) return null;

  /*
    Cửa sổ mở về CẢ HAI PHÍA quanh id.

    Bản đầu chỉ nhìn về phía sau và trượt sạch 220 video. Đo lại thì chuỗi thời
    gian nằm TRƯỚC id chừng 90 ký tự — YouTube dựng thẻ theo thứ tự lớp phủ
    thumbnail rồi mới tới liên kết. Nhìn hai phía thì không phải phụ thuộc vào
    thứ tự ấy nữa.
  */
  const around = html.slice(Math.max(0, at - 600), at + 600);
  const m = /"(\d{1,2}:\d{2}(?::\d{2})?)"/.exec(around);
  if (!m || !m[1]) return null;

  const parts = m[1].split(':').map(Number);
  const secs =
    parts.length === 3
      ? (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
      : (parts[0] ?? 0) * 60 + (parts[1] ?? 0);

  // Dài quá 40 phút thì không hợp để chép chính tả; dưới 40 giây là Short.
  return secs >= 40 && secs <= 2400 ? secs : null;
}

async function oembed(id) {
  const r = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) },
  );
  if (!r.ok) return null;
  const j = await r.json();
  return { title: String(j.title ?? '').trim(), channel: String(j.author_name ?? '').trim() };
}

async function main() {
  const all = [];
  const seen = new Set();

  for (const ch of CHANNELS) {
    let html = '';
    try {
      const r = await fetch(`https://www.youtube.com/@${ch.handle}/videos`, {
        headers: { 'user-agent': UA, 'accept-language': 'en-US,en' },
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) {
        console.log(`✖ @${ch.handle}: HTTP ${r.status}`);
        continue;
      }
      html = await r.text();
    } catch (e) {
      console.log(`✖ @${ch.handle}: ${e.message}`);
      continue;
    }

    const ids = videoIds(html);
    let kept = 0;

    for (const id of ids) {
      if (kept >= PER_CHANNEL) break;
      if (seen.has(id)) continue;

      const meta = await oembed(id);
      // oEmbed hỏng nghĩa là video riêng tư, bị gỡ, hoặc chặn nhúng — bỏ hẳn,
      // vì thẻ trỏ vào một video không mở được còn tệ hơn không có thẻ.
      if (!meta || !meta.title) continue;

      seen.add(id);
      kept += 1;
      all.push({
        id,
        title: meta.title,
        channel: meta.channel || ch.handle,
        level: ch.level,
        topic: ch.topic,
        durationSeconds: durationFor(html, id),
      });
    }

    console.log(`✔ @${ch.handle}: ${kept} video (${ch.level} · ${ch.topic})`);
  }

  all.sort((a, b) => a.level.localeCompare(b.level) || a.channel.localeCompare(b.channel));
  writeFileSync(OUT, `${JSON.stringify(all, null, 1)}\n`, 'utf8');

  const byLevel = {};
  for (const v of all) byLevel[v.level] = (byLevel[v.level] ?? 0) + 1;
  console.log(`\nGhi ${all.length} video vào ${OUT}`);
  console.log('Theo trình độ:', JSON.stringify(byLevel));
}

void main();
