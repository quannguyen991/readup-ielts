import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dựng thư viện NGHE có sẵn lời — nguồn VOA Learning English.
 *
 *   node scripts/build-audio-library.mjs
 *   node scripts/build-audio-library.mjs --per-section 8   (chạy thử cho nhanh)
 *
 * VÌ SAO CÓ TỆP NÀY
 *
 * Thư viện video (`build-video-library.mjs`) vướng một chỗ không đi qua được:
 * YouTube nay đòi tham số ký sinh từ chính trình phát của họ, nên app không lấy
 * được phụ đề — đo cả hai đường ngày 05/09/2026, máy chủ nhận 0 byte và trình
 * duyệt bị CORS chặn. Hệ quả là người học phải tự dán phụ đề cho từng video.
 *
 * Đã cân nhắc mấy đường lách (yt-dlp trên máy chủ, proxy, giả lập trình phát)
 * rồi bỏ hết. Chúng đều dựa vào việc làm ngược điều nền tảng đó nói rõ là
 * không cho, và đều hỏng lại vào lần sau họ đổi.
 *
 * Đường đi thẳng: ĐỔI NGUỒN. Chọn tài liệu mà lời thoại vốn đã được công bố
 * kèm âm thanh, và giấy phép cho phép dùng lại.
 *
 * VOA Learning English là tài liệu do Voice of America sản xuất — cơ quan liên
 * bang Hoa Kỳ — nên **thuộc phạm vi công cộng**: trang điều khoản của họ ghi rõ
 * chữ, MP3, ảnh và video được in lại cho cả mục đích giáo dục lẫn thương mại,
 * miễn ghi nguồn learningenglish.voanews.com. Mỗi bài có sẵn:
 *
 *   · một tệp MP3 phát thẳng, không cần ký, không cần khoá
 *   · TOÀN VĂN lời đọc ngay trong trang
 *   · một bảng "Words in This Story" — chú giải từ do chính ban biên tập soạn
 *
 * Nên bài nghe ở đây **bấm là làm được ngay**, không phải dán gì cả.
 *
 * GIỚI HẠN, nói rõ: giọng đọc VOA Learning English là giọng Mỹ, đọc CHẬM HƠN
 * tốc độ tự nhiên ở các mục trình độ thấp. Nó rèn được nghe hiểu và chính tả,
 * nhưng KHÔNG thay được việc nghe giọng bản xứ nói ở tốc độ thật. Thư viện
 * video vẫn giữ nguyên cho việc đó.
 */

const OUT_DIR = join('src', 'data', 'seed', 'audio-library');
const TRANSCRIPT_DIR = join(OUT_DIR, 'transcripts');
const GOC = 'https://learningenglish.voanews.com';
const MOI_CHUNK = 25;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/**
 * Các chuyên mục, kèm trình độ và chủ đề.
 *
 * Trình độ gán theo CHUYÊN MỤC chứ không theo từng bài — giống cách thư viện
 * video gán theo kênh, và vì cùng một lý do: mỗi mục của VOA có một tốc độ đọc
 * và một mức từ vựng khá ổn định, còn đoán trình độ từng bài mà không nghe qua
 * thì chỉ là bịa cho có nhãn.
 *
 * Chủ đề dùng lại đúng tám nhãn của thư viện video để hai bên lọc chung được.
 *
 * NÓI RÕ MỘT ĐIỀU về nhãn trình độ: toàn bộ VOA Learning English vốn đã viết ở
 * quanh mức B1 (vốn từ giới hạn ~1.500 từ, đọc chậm hơn tự nhiên). Nhãn A2…C1 ở
 * đây là XẾP TƯƠNG ĐỐI GIỮA CÁC MỤC VỚI NHAU — "A2" nghĩa là dễ nhất trong số
 * này, không phải A2 theo thang CEFR chuẩn. Đây không phải chỗ để làm tròn cho
 * đẹp bảng: nói quá trình độ của tài liệu là đẩy người học vào bài quá dễ rồi
 * tưởng mình đã lên trình.
 *
 * Đã bỏ hai mục "News Words" và "English in a Minute": chúng là mục VIDEO, bài
 * không có tệp MP3 nào. Kiểm bằng cách tải thử một bài, không đoán qua tên.
 */
const CHUYEN_MUC = [
  { z: 5535, ten: 'Ask a Teacher', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { z: 4456, ten: 'Everyday Grammar', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { z: 3521, ten: 'As It Is', level: 'B1', topic: 'Thời sự và xã hội' },
  { z: 987, ten: 'Words & Their Stories', level: 'B1', topic: 'Tiếng Anh hằng ngày' },
  { z: 955, ten: 'Health & Lifestyle', level: 'B2', topic: 'Kiến thức phổ thông' },
  { z: 1579, ten: 'Science & Technology', level: 'B2', topic: 'Khoa học' },
  { z: 7468, ten: 'Education Tips', level: 'B2', topic: 'Kiến thức phổ thông' },
  { z: 986, ten: 'Arts & Culture', level: 'C1', topic: 'Kiến thức phổ thông' },
  { z: 1581, ten: 'American Stories', level: 'C1', topic: 'Bài nói' },
];

const doi = (s) => Number.parseInt(String(s ?? ''), 10);
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

async function tai(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/** Bỏ thẻ, giải mã thực thể, gộp khoảng trắng. */
function chu(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, d) => String.fromCodePoint(Number.parseInt(d, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Đường dẫn bài trong một trang danh sách chuyên mục. */
function duongDanBai(html) {
  const ra = new Set();
  // Hai dạng đường dẫn cùng tồn tại: có slug (`/a/tieu-de/123.html`) và không
  // có slug (`/a/123.html`). Bản đầu chỉ bắt dạng có slug nên hai chuyên mục
  // trình độ A2 ra 0 bài — mất đúng nhóm dễ nhất, là nhóm thiếu bài nhất.
  for (const m of html.matchAll(/href="(\/a\/(?:[^"]*\/)?\d+\.html)"/g)) ra.add(m[1]);
  return [...ra];
}

/**
 * Bóc một bài: tiêu đề, MP3, toàn văn, chú giải từ.
 *
 * Trả `null` khi thiếu MP3 hoặc lời quá ngắn — thà bỏ bài còn hơn đưa vào thư
 * viện một mục bấm vào thì không nghe được.
 */
function bocBai(html, url) {
  const mAudio = html.match(/<audio[^>]*\ssrc="([^"]+\.mp3[^"]*)"/i);
  if (!mAudio) return null;
  const audioUrl = mAudio[1].replace(/\?download=1$/, '');

  const mTitle =
    html.match(/<meta property="og:title" content="([^"]+)"/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const title = mTitle ? chu(mTitle[1]).replace(/\s*\|\s*VOA.*$/i, '').trim() : '';
  if (!title) return null;

  const mNgay = html.match(/<time[^>]*datetime="([^"]+)"/i);
  const publishedAt = mNgay ? mNgay[1].slice(0, 10) : null;

  const i = html.indexOf('id="article-content"');
  if (i < 0) return null;
  let j = html.indexOf('id="comments"', i);
  if (j < 0) j = html.indexOf('<footer', i);
  const than = html.slice(i, j > 0 ? j : undefined);

  const doan = [];
  for (const m of than.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const t = chu(m[1]);
    if (t.length > 25) doan.push(t);
  }

  // Trang nào cũng có dòng "No media source currently available" do trình phát
  // chèn vào lúc chưa nạp xong. Nó không phải lời đọc.
  const sach = doan.filter((d) => !/^no media source/i.test(d));

  const { loi, tuVung } = tachChuGiai(sach);
  if (loi.join(' ').split(/\s+/).length < 120) return null;

  return {
    id: `voa-${(url.match(/\/(\d+)\.html$/) || [])[1] ?? title.slice(0, 12)}`,
    title,
    audioUrl,
    sourceUrl: GOC + url,
    publishedAt,
    paragraphs: loi,
    glossary: tuVung,
  };
}

/**
 * Tách bảng "Words in This Story" ra khỏi lời đọc.
 *
 * Bảng đó nằm cuối bài và KHÔNG được đọc trong MP3. Để lẫn vào lời thì bài chép
 * chính tả sẽ bắt người học gõ những câu không hề có trong tiếng — đúng cái lỗi
 * làm hỏng một bài nghe.
 */
function tachChuGiai(doan) {
  // Tìm mốc bằng BA dấu hiệu, không phải một.
  //
  // Bản đầu chỉ tìm đoạn bắt đầu bằng "Words in This Story" và ra 0/251 bài có
  // chú giải — vì tiêu đề đó nằm trong thẻ <h2>, mà bước bóc chỉ lấy <p>. Hậu
  // quả không phải là thiếu một tính năng phụ: toàn bộ mục từ vựng bị TÍNH VÀO
  // LỜI ĐỌC ở 182/251 bài. Đề nghe hiểu sinh từ đó sẽ hỏi về những câu không hề
  // có trong tiếng.
  //
  // Dấu hiệu chắc chắn nhất hoá ra là dòng gạch dưới ngăn cách, thứ luôn có
  // trong thân bài. Lấy mốc CUỐI CÙNG trong ba dấu hiệu.
  let moc = -1;
  doan.forEach((d, i) => {
    const laGachNgang = /^[_\-–—\s]{8,}$/.test(d);
    const laTieuDe = /^words in this story/i.test(d);
    if (laGachNgang || laTieuDe) moc = i;
  });
  if (moc < 0) return { loi: doan, tuVung: [] };

  const tuVung = [];
  for (const d of doan.slice(moc + 1)) {
    // Mục từ điển: "term – n. định nghĩa". Vế đầu ngắn, có gạch ngang ngăn.
    const m = d.match(/^(.{1,40}?)\s+[-–—]\s+(.+)$/);
    if (m) tuVung.push({ term: m[1].trim(), definition: m[2].trim() });
  }

  let loi = doan.slice(0, moc);

  // Bài nào có NHIỀU dòng gạch ngăn thì chỉ dòng cuối làm mốc, những dòng
  // trước vẫn nằm lại trong lời đọc. Chúng không phải câu.
  loi = loi.filter((d) => !/^[_\-–—\s]{8,}$/.test(d));

  // Vẫn còn một ít bài mà mục từ vựng nằm TRƯỚC dòng gạch cuối. Cắt đuôi
  // những dòng mang đúng dạng mục từ điển — nhận ra bằng nhãn từ loại
  // ("n.", "v.", "adj.", "adv.") mà ban biên tập VOA luôn ghi. Chỉ dựa vào
  // dấu gạch ngang thì sẽ cắt nhầm câu văn bình thường có gạch ngang.
  const laMucTuDien = (d) =>
    d.length < 160 && /^.{1,40}?\s+[-–—]\s+(n|v|adj|adv|prep|phr|idiom)\b\.?/i.test(d);
  while (loi.length && laMucTuDien(loi[loi.length - 1])) {
    const d = loi.pop();
    const m = d.match(/^(.{1,40}?)\s+[-–—]\s+(.+)$/);
    if (m) tuVung.unshift({ term: m[1].trim(), definition: m[2].trim() });
  }

  return { loi, tuVung };
}

async function chayMotMuc(muc, soBai) {
  const duong = [];
  for (let trang = 1; duong.length < soBai && trang <= 6; trang += 1) {
    const url = `${GOC}/z/${muc.z}${trang > 1 ? `?p=${trang}` : ''}`;
    let html;
    try {
      html = await tai(url);
    } catch (e) {
      console.log(`   ! ${muc.ten} trang ${trang}: ${e.message}`);
      break;
    }
    const moi = duongDanBai(html).filter((d) => !duong.includes(d));
    if (moi.length === 0) break;
    duong.push(...moi);
    await nghi(400);
  }

  const ra = [];
  for (const d of duong.slice(0, soBai)) {
    try {
      const bai = bocBai(await tai(GOC + d), d);
      if (bai) {
        ra.push({ ...bai, program: muc.ten, level: muc.level, topic: muc.topic });
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    } catch {
      process.stdout.write('!');
    }
    await nghi(350);
  }
  console.log(` ${muc.ten}: ${ra.length}/${duong.slice(0, soBai).length}`);
  return ra;
}

function ghi(bai) {
  mkdirSync(TRANSCRIPT_DIR, { recursive: true });

  const chiMuc = [];
  const soChunk = Math.ceil(bai.length / MOI_CHUNK);

  for (let c = 0; c < soChunk; c += 1) {
    const phan = bai.slice(c * MOI_CHUNK, (c + 1) * MOI_CHUNK);
    const noiDung = {};
    for (const b of phan) noiDung[b.id] = { paragraphs: b.paragraphs, glossary: b.glossary };
    writeFileSync(
      join(TRANSCRIPT_DIR, `chunk-${String(c).padStart(2, '0')}.json`),
      JSON.stringify(noiDung),
      'utf8',
    );
    for (const b of phan) {
      chiMuc.push({
        id: b.id,
        title: b.title,
        program: b.program,
        level: b.level,
        topic: b.topic,
        audioUrl: b.audioUrl,
        sourceUrl: b.sourceUrl,
        publishedAt: b.publishedAt,
        words: b.paragraphs.join(' ').split(/\s+/).length,
        chunk: c,
      });
    }
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(chiMuc, null, 1), 'utf8');

  const dong = Array.from(
    { length: soChunk },
    (_, c) => `  ${c}: () => require('./chunk-${String(c).padStart(2, '0')}.json'),`,
  ).join('\n');
  writeFileSync(
    join(TRANSCRIPT_DIR, 'registry.ts'),
    '// FILE NÀY DO scripts/build-audio-library.mjs SINH RA. ĐỪNG SỬA TAY.\n' +
      "// require() phải là chuỗi literal để Metro phân tích được lúc build.\n\n" +
      'export const AUDIO_CHUNKS: Record<number, () => unknown> = {\n' +
      dong +
      '\n};\n',
    'utf8',
  );

  return { soChunk, chiMuc };
}

async function main() {
  const i = process.argv.indexOf('--per-section');
  const soBai = i > 0 ? doi(process.argv[i + 1]) || 20 : 20;

  console.log(`VOA Learning English — ${CHUYEN_MUC.length} chuyên mục, tối đa ${soBai} bài mỗi mục\n`);

  const tatCa = [];
  for (const muc of CHUYEN_MUC) tatCa.push(...(await chayMotMuc(muc, soBai)));

  // Trùng id giữa hai chuyên mục (một bài xuất hiện ở hai mục) thì giữ bản đầu.
  const theoId = new Map();
  for (const b of tatCa) if (!theoId.has(b.id)) theoId.set(b.id, b);
  const bai = [...theoId.values()];

  const { soChunk, chiMuc } = ghi(bai);

  const theoLevel = {};
  for (const b of chiMuc) theoLevel[b.level] = (theoLevel[b.level] ?? 0) + 1;
  const tongTu = chiMuc.reduce((s, b) => s + b.words, 0);

  console.log(`\n${bai.length} bài · ${soChunk} chunk · ${tongTu.toLocaleString('vi-VN')} từ lời đọc`);
  console.log('theo trình độ:', theoLevel);
  console.log(`đã ghi ${join(OUT_DIR, 'index.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
