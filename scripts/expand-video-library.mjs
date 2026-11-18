import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Mở rộng thư viện video luyện nghe: THÊM video từ nhiều kênh hơn vào `seed/video-library/index.json`, KHÔNG xoá gì.
 *
 *   node scripts/expand-video-library.mjs            # chạy thật
 *   node scripts/expand-video-library.mjs --dry      # chỉ in số video mỗi kênh
 *
 * Cùng nguyên tắc với `build-video-library.mjs`: chỉ lấy siêu dữ liệu để NHÚNG (id, tiêu đề, kênh, thời lượng), tuyển thẳng
 * từ trang kênh YouTube, kiểm từng id bằng oEmbed (video riêng tư / bị gỡ thì bỏ). Khác ở ba điểm:
 *   · nhiều kênh hơn, chia theo mục đích học (phát âm & ngữ pháp, hội thoại, khoa học, kinh doanh, truyền cảm hứng, tin tức…)
 *   · mỗi kênh lấy cả mục "Phổ biến" lẫn "Mới nhất" (video được xem nhiều thường chất lượng hơn), rồi trộn xen kẽ
 *   · gộp vào kho hiện có, bỏ trùng id (kể cả các video đã có phụ đề song ngữ)
 *
 * Handle không tồn tại chỉ in ✖ rồi bỏ qua; chạy lại được nhiều lần (id đã có thì không thêm).
 */

const SEED = join('src', 'data', 'seed', 'video-library', 'index.json');
const BILINGUAL = join('src', 'data', 'seed', 'bilingual-videos.json');
const PER_CHANNEL = 40;
const CONCURRENCY = 8;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** Trình độ gán theo KÊNH (giọng và mật độ từ vựng của kênh khá ổn định); người học tự đổi được khi thấy lệch. */
const CHANNELS = [
  // Học tiếng Anh: phát âm, ngữ pháp, hội thoại
  { handle: 'EnglishwithLucy', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'rachelsenglish', level: 'A2', topic: 'Phát âm & ngữ pháp' },
  { handle: 'mmmEnglish', level: 'B1', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'SpeakEnglishWithVanessa', level: 'B1', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'JForrestEnglish', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'engVid', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'EnglishClass101', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'OxfordOnlineEnglish', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'ETJEnglish', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'EnglishSpeakingSuccess', level: 'B1', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'learnenglishwithtvseries', level: 'B1', topic: 'Giải trí' },
  { handle: 'VOALearningEnglish', level: 'A2', topic: 'Tin tức chậm' },
  { handle: 'bbclearningenglish', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'Learnenglish', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'EnglishAnyone', level: 'B1', topic: 'Tiếng Anh hằng ngày' },
  { handle: 'AccurateEnglish', level: 'B1', topic: 'Phát âm & ngữ pháp' },
  { handle: 'Englishfeed', level: 'A2', topic: 'Tiếng Anh hằng ngày' },
  // Khoa học & kiến thức
  { handle: 'TEDEd', level: 'B1', topic: 'Kiến thức phổ thông' },
  { handle: 'minutephysics', level: 'B2', topic: 'Khoa học' },
  { handle: 'MinuteEarth', level: 'B1', topic: 'Khoa học' },
  { handle: 'AsapSCIENCE', level: 'B1', topic: 'Khoa học' },
  { handle: 'Vsauce', level: 'B2', topic: 'Khoa học' },
  { handle: 'crashcourse', level: 'B2', topic: 'Kiến thức phổ thông' },
  { handle: 'khanacademy', level: 'B1', topic: 'Kiến thức phổ thông' },
  { handle: 'NASA', level: 'B2', topic: 'Khoa học' },
  { handle: 'PBSSpaceTime', level: 'C1', topic: 'Khoa học' },
  { handle: 'LifeNoggin', level: 'B1', topic: 'Khoa học' },
  { handle: 'TheInfographicsShow', level: 'B2', topic: 'Kiến thức phổ thông' },
  { handle: 'MarkRober', level: 'B1', topic: 'Khoa học' },
  { handle: 'CGPGrey', level: 'B2', topic: 'Kiến thức phổ thông' },
  { handle: 'TomScottGo', level: 'B2', topic: 'Kiến thức phổ thông' },
  { handle: 'WIRED', level: 'B2', topic: 'Công nghệ' },
  { handle: 'ColdFusion', level: 'B2', topic: 'Công nghệ' },
  { handle: 'mkbhd', level: 'B2', topic: 'Công nghệ' },
  // Bài nói, truyền cảm hứng, kinh doanh
  { handle: 'TED', level: 'C1', topic: 'Bài nói' },
  { handle: 'TEDx', level: 'B2', topic: 'Bài nói' },
  { handle: 'TEDxTalks', level: 'B2', topic: 'Bài nói' },
  { handle: 'bigthink', level: 'C1', topic: 'Bài nói' },
  { handle: 'simonsinek', level: 'B2', topic: 'Truyền cảm hứng' },
  { handle: 'GoalcastOfficial', level: 'B2', topic: 'Truyền cảm hứng' },
  { handle: 'SuccessStoryOfficial', level: 'B2', topic: 'Truyền cảm hứng' },
  { handle: 'CNBCMakeIt', level: 'B2', topic: 'Kinh doanh' },
  { handle: 'BusinessInsider', level: 'B2', topic: 'Kinh doanh' },
  { handle: 'AliAbdaal', level: 'B2', topic: 'Kinh doanh' },
  { handle: 'ThomasFrankExplains', level: 'B2', topic: 'Kinh doanh' },
  { handle: 'StanfordGSB', level: 'C1', topic: 'Kinh doanh' },
  { handle: 'mitocw', level: 'C1', topic: 'Kiến thức phổ thông' },
  // Tin tức, thời sự, xã hội
  { handle: 'BBCNews', level: 'B2', topic: 'Thời sự và xã hội' },
  { handle: 'CNN', level: 'C1', topic: 'Thời sự và xã hội' },
  { handle: 'aljazeeraenglish', level: 'C1', topic: 'Thời sự và xã hội' },
  { handle: 'dwnews', level: 'B2', topic: 'Thời sự và xã hội' },
  { handle: 'TheEconomist', level: 'C1', topic: 'Kinh tế và hạ tầng' },
  { handle: 'johnnyharris', level: 'B2', topic: 'Thời sự và xã hội' },
  { handle: 'Vox', level: 'C1', topic: 'Thời sự và xã hội' },
  { handle: 'Wendoverproductions', level: 'C1', topic: 'Kinh tế và hạ tầng' },
  // Thiên nhiên, du lịch, lịch sử
  { handle: 'NatGeo', level: 'B2', topic: 'Thiên nhiên' },
  { handle: 'BBCEarth', level: 'B2', topic: 'Thiên nhiên' },
  { handle: 'NationalGeographic', level: 'B2', topic: 'Thiên nhiên' },
  { handle: 'TravelChannel', level: 'B2', topic: 'Du lịch' },
  { handle: 'RickSteves', level: 'B2', topic: 'Du lịch' },
  { handle: 'historychannel', level: 'B2', topic: 'Lịch sử' },
  { handle: 'OverSimplified', level: 'B2', topic: 'Lịch sử' },
  // Phỏng vấn, giải trí
  { handle: 'TheTonightShow', level: 'C1', topic: 'Phỏng vấn' },
  { handle: 'JimmyKimmelLive', level: 'C1', topic: 'Phỏng vấn' },
  { handle: 'TheEllenShow', level: 'B2', topic: 'Phỏng vấn' },
  { handle: 'EasyEnglishVideos', level: 'A2', topic: 'Phỏng vấn đường phố' },
];

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

/** Thời lượng bóc từ nhãn trợ năng quanh id (best-effort, thiếu thì null). */
function durationFor(html, id) {
  const at = html.indexOf(`"${id}"`);
  if (at < 0) return null;
  const around = html.slice(Math.max(0, at - 600), at + 600);
  const m = /"(\d{1,2}:\d{2}(?::\d{2})?)"/.exec(around);
  if (!m || !m[1]) return null;
  const p = m[1].split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

async function page(handle, query) {
  try {
    const r = await fetch(`https://www.youtube.com/@${handle}/videos${query}`, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en' }, signal: AbortSignal.timeout(30000) });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

async function oembed(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const j = await r.json();
    return { title: String(j.title ?? '').trim(), channel: String(j.author_name ?? '').trim() };
  } catch {
    return null;
  }
}

/** Chạy `fn` cho từng phần tử với tối đa `n` việc song song, giữ thứ tự kết quả. */
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** Trộn hai danh sách xen kẽ (phổ biến, mới, phổ biến, mới…) và bỏ trùng. */
function interleave(a, b) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    for (const x of [a[i], b[i]]) if (x && !seen.has(x)) (seen.add(x), out.push(x));
  }
  return out;
}

async function main() {
  const dry = process.argv.includes('--dry');
  const existing = JSON.parse(readFileSync(SEED, 'utf8'));
  const bilingual = JSON.parse(readFileSync(BILINGUAL, 'utf8'));
  const have = new Set([...existing.map((v) => v.id), ...(bilingual.videos ?? []).map((v) => v.id)]);
  const added = [];

  for (const ch of CHANNELS) {
    const [popular, latest] = [await page(ch.handle, '?view=0&sort=p&flow=grid'), await page(ch.handle, '')];
    if (!popular && !latest) {
      console.log(`✖ @${ch.handle}: không mở được`);
      continue;
    }
    const dur = new Map();
    for (const html of [popular, latest]) if (html) for (const id of videoIds(html)) if (!dur.has(id)) dur.set(id, durationFor(html, id));
    const ids = interleave(popular ? videoIds(popular) : [], latest ? videoIds(latest) : []).filter((id) => {
      if (have.has(id)) return false;
      const d = dur.get(id);
      // dưới 40 giây là Short, trên 40 phút quá dài để luyện nghe từng câu
      return d === null || d === undefined || (d >= 40 && d <= 2400);
    });
    const metas = dry ? ids.slice(0, PER_CHANNEL).map(() => ({ ok: true })) : await pool(ids.slice(0, PER_CHANNEL + 12), CONCURRENCY, (id) => oembed(id));
    let kept = 0;
    for (let i = 0; i < metas.length && kept < PER_CHANNEL; i++) {
      const m = metas[i];
      if (!m || (!dry && !m.title)) continue;
      const id = ids[i];
      have.add(id);
      kept += 1;
      if (!dry) added.push({ id, title: m.title, channel: m.channel || ch.handle, level: ch.level, topic: ch.topic, durationSeconds: dur.get(id) ?? null });
    }
    console.log(`✔ @${ch.handle}: +${kept} (${ch.level} · ${ch.topic})`);
  }

  if (dry) return;
  const merged = [...existing, ...added];
  writeFileSync(SEED, `${JSON.stringify(merged, null, 1)}\n`, 'utf8');
  const byLevel = {};
  for (const v of merged) byLevel[v.level] = (byLevel[v.level] ?? 0) + 1;
  console.log(`\nThêm ${added.length} video → tổng ${merged.length} (trước đó ${existing.length}).`);
  console.log('Theo trình độ:', JSON.stringify(byLevel));
}

void main();
