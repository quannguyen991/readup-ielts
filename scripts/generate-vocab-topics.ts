import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Sinh 30 bộ từ vựng IELTS theo chủ đề, mỗi bộ 50 từ.
 *
 *   npx tsx scripts/generate-vocab-topics.ts            # sinh những bộ còn thiếu
 *   npx tsx scripts/generate-vocab-topics.ts --redo tourism   # sinh lại một bộ
 *
 * VÌ SAO SINH BẰNG AI RỒI KIỂM BẰNG CODE: 1.500 từ kèm nghĩa, phiên âm, ví dụ
 * và collocation là thứ không ai gõ tay nổi, nhưng cũng là thứ AI rất dễ làm ẩu —
 * ví dụ không chứa chính từ đang dạy, hai chủ đề trùng nhau nửa danh sách, phiên
 * âm bịa. Nên mỗi bộ sinh xong đều bị soi lại bằng luật máy kiểm được, và bộ nào
 * không qua thì KHÔNG được ghi vào kho.
 *
 * Ghi từng file một, sinh xong bộ nào lưu bộ đó: gọi 30 lượt AI liên tiếp mà đứt
 * ở lượt 28 thì mất cả buổi nếu giữ hết trong bộ nhớ.
 */

const OUT_DIR = join('src', 'data', 'seed', 'vocab-topics');
const WORDS_PER_TOPIC = 50;

type Topic = { slug: string; name: string; nameVi: string; blurb: string };

/**
 * Ba mươi chủ đề, chọn theo TẦN SUẤT RA ĐỀ chứ không theo thứ tự bảng chữ cái.
 *
 * Bốn nhóm đầu (Education → Environment) phủ phần lớn đề Writing Task 2 và
 * Speaking Part 3 của mấy năm gần đây; nhóm sau là những chủ đề ra ít hơn nhưng
 * khi ra thì người học thường trắng từ.
 */
const TOPICS: Topic[] = [
  { slug: 'education', name: 'Education', nameVi: 'Giáo dục', blurb: 'Trường lớp, phương pháp học, bằng cấp' },
  { slug: 'environment', name: 'Environment', nameVi: 'Môi trường', blurb: 'Ô nhiễm, biến đổi khí hậu, bảo tồn' },
  { slug: 'technology', name: 'Technology', nameVi: 'Công nghệ', blurb: 'Internet, AI, thiết bị số' },
  { slug: 'health', name: 'Health', nameVi: 'Sức khoẻ', blurb: 'Bệnh tật, y tế, lối sống' },
  { slug: 'work', name: 'Work and Careers', nameVi: 'Công việc', blurb: 'Nghề nghiệp, nơi làm việc, kỹ năng' },
  { slug: 'society', name: 'Society', nameVi: 'Xã hội', blurb: 'Cộng đồng, bất bình đẳng, chuẩn mực' },
  { slug: 'government', name: 'Government and Law', nameVi: 'Chính phủ và pháp luật', blurb: 'Chính sách, luật, tội phạm' },
  { slug: 'economy', name: 'Economy', nameVi: 'Kinh tế', blurb: 'Thương mại, tăng trưởng, tiêu dùng' },
  { slug: 'media', name: 'Media', nameVi: 'Truyền thông', blurb: 'Báo chí, quảng cáo, mạng xã hội' },
  { slug: 'culture', name: 'Culture and Tradition', nameVi: 'Văn hoá', blurb: 'Phong tục, di sản, bản sắc' },
  { slug: 'family', name: 'Family', nameVi: 'Gia đình', blurb: 'Nuôi dạy con, quan hệ, thế hệ' },
  { slug: 'transport', name: 'Transport', nameVi: 'Giao thông', blurb: 'Phương tiện, hạ tầng, tắc đường' },
  { slug: 'tourism', name: 'Tourism', nameVi: 'Du lịch', blurb: 'Đi lại, điểm đến, tác động du lịch' },
  { slug: 'city-life', name: 'City Life', nameVi: 'Đời sống đô thị', blurb: 'Đô thị hoá, nhà ở, tiện ích' },
  { slug: 'crime', name: 'Crime and Punishment', nameVi: 'Tội phạm', blurb: 'Vi phạm, hình phạt, phòng ngừa' },
  { slug: 'science', name: 'Science and Research', nameVi: 'Khoa học', blurb: 'Nghiên cứu, thí nghiệm, phát hiện' },
  { slug: 'art', name: 'Art', nameVi: 'Nghệ thuật', blurb: 'Hội hoạ, âm nhạc, sáng tạo' },
  { slug: 'sport', name: 'Sport', nameVi: 'Thể thao', blurb: 'Thi đấu, rèn luyện, tinh thần đồng đội' },
  { slug: 'food', name: 'Food and Diet', nameVi: 'Ẩm thực', blurb: 'Dinh dưỡng, ăn uống, sản xuất thực phẩm' },
  { slug: 'housing', name: 'Housing', nameVi: 'Nhà ở', blurb: 'Kiến trúc, thuê mua, không gian sống' },
  { slug: 'money', name: 'Money and Spending', nameVi: 'Tiền bạc', blurb: 'Tiết kiệm, chi tiêu, nghèo giàu' },
  { slug: 'globalisation', name: 'Globalisation', nameVi: 'Toàn cầu hoá', blurb: 'Hội nhập, đa quốc gia, di cư' },
  { slug: 'language', name: 'Language', nameVi: 'Ngôn ngữ', blurb: 'Học ngoại ngữ, tiếng mẹ đẻ, giao tiếp' },
  { slug: 'children', name: 'Children and Youth', nameVi: 'Trẻ em và thanh niên', blurb: 'Phát triển, kỷ luật, áp lực' },
  { slug: 'elderly', name: 'Ageing', nameVi: 'Người cao tuổi', blurb: 'Dân số già, hưu trí, chăm sóc' },
  { slug: 'animals', name: 'Animals', nameVi: 'Động vật', blurb: 'Bảo tồn, vật nuôi, quyền động vật' },
  { slug: 'space', name: 'Space and Exploration', nameVi: 'Vũ trụ', blurb: 'Thám hiểm, vệ tinh, ngân sách' },
  { slug: 'happiness', name: 'Happiness and Wellbeing', nameVi: 'Hạnh phúc', blurb: 'Cảm xúc, cân bằng, áp lực tinh thần' },
  { slug: 'history', name: 'History', nameVi: 'Lịch sử', blurb: 'Quá khứ, di tích, bài học lịch sử' },
  { slug: 'energy', name: 'Energy', nameVi: 'Năng lượng', blurb: 'Tái tạo, nhiên liệu hoá thạch, tiết kiệm điện' },
];

export type VocabEntry = {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example: string;
  collocation: string;
  band: '5-6' | '6-7' | '7-8' | '8+';
};

const SYSTEM = [
  'Bạn soạn từ vựng học thuật cho người Việt luyện thi IELTS.',
  '',
  'QUY TẮC BẮT BUỘC:',
  '- Đúng {{COUNT}} từ, KHÔNG trùng nhau, tất cả đều thuộc chủ đề được giao.',
  '- Ưu tiên từ HỌC THUẬT dùng được trong Writing Task 2 và Speaking Part 3.',
  '  Bỏ qua từ quá cơ bản (school, food, car) — người học band 5 đã biết rồi.',
  '- `example` PHẢI chứa chính từ đó (dạng gốc hoặc dạng biến đổi), là một câu',
  '  hoàn chỉnh, ở mức độ trang trọng của bài thi.',
  '- `ipa` là phiên âm IPA thật của từ, đặt trong hai dấu /.',
  '- `meaningVi` ngắn gọn, đúng nghĩa dùng trong chủ đề này.',
  '- `collocation` là một cụm đi kèm hay gặp, có chứa từ đó.',
  '- `band`: mức độ khó, một trong "5-6", "6-7", "7-8", "8+". Rải đều các mức.',
  '',
  'Trả về DUY NHẤT một khối JSON:',
  '{"words":[{"word":"…","pos":"noun","ipa":"/…/","meaningVi":"…","definitionEn":"…",',
  ' "example":"…","collocation":"…","band":"6-7"}]}',
].join('\n');

// ------------------------------------------------------------------ kiểm tra

type Check = { ok: boolean; problems: string[] };

/**
 * Soi một bộ vừa sinh. KHÔNG QUA THÌ KHÔNG GHI.
 *
 * Mỗi luật ở đây đến từ một kiểu ẩu có thật của model, không phải từ trí tưởng
 * tượng: ví dụ không chứa từ đang dạy (rất hay gặp), thiếu số lượng, trùng từ
 * trong cùng một bộ, và bỏ trống một trường rồi để chuỗi rỗng.
 */
function checkTopic(words: VocabEntry[], expected: number = WORDS_PER_TOPIC): Check {
  const problems: string[] = [];

  if (words.length !== expected) {
    problems.push(`có ${words.length} từ, cần đúng ${expected}`);
  }

  const seen = new Set<string>();
  for (const w of words) {
    const key = (w.word ?? '').trim().toLowerCase();
    if (!key) {
      problems.push('có mục thiếu chữ');
      continue;
    }
    if (seen.has(key)) problems.push(`trùng từ "${key}"`);
    seen.add(key);

    for (const field of ['pos', 'ipa', 'meaningVi', 'definitionEn', 'example', 'collocation'] as const) {
      if (!w[field] || String(w[field]).trim() === '') problems.push(`"${key}" thiếu ${field}`);
    }

    /*
      Ví dụ phải chứa chính từ đó.

      So bằng bốn ký tự đầu chứ không so cả từ: "sustain" xuất hiện trong ví dụ
      dưới dạng "sustainable" hay "sustainability" là hoàn toàn hợp lệ, mà so
      nguyên văn thì trượt hết. Bốn ký tự đủ chặt để bắt được ví dụ lạc đề.
    */
    const stem = key.replace(/[^a-z]/g, '').slice(0, 4);
    if (stem.length >= 4 && !(w.example ?? '').toLowerCase().replace(/[^a-z ]/g, '').includes(stem)) {
      problems.push(`ví dụ của "${key}" không chứa chính từ đó`);
    }

    if (!['5-6', '6-7', '7-8', '8+'].includes(w.band)) {
      problems.push(`"${key}" có band lạ: ${w.band}`);
    }
  }

  return { ok: problems.length === 0, problems: problems.slice(0, 8) };
}

// -------------------------------------------------------------------- chạy

type Proxy = { id: string; base: string; key: string };

/**
 * Sinh MỘT NỬA bộ từ (25 từ) trong một lời gọi.
 *
 * Sinh cả 50 từ một lượt làm năm chủ đề chết vì `HTTP 524` — Cloudflare đứng
 * trước proxy cắt kết nối khi model chạy quá lâu, và không lời nhắn nào cho
 * biết đó là giới hạn cổng chứ không phải lỗi model. Hai lượt 25 từ nằm gọn
 * dưới ngưỡng đó, và khi một lượt hỏng thì chỉ mất một nửa công.
 *
 * Nửa sau nhận danh sách từ của nửa đầu để KHÔNG lặp lại: model không nhớ lượt
 * trước, nên không nói thì nó lặp ngay những từ dễ nghĩ ra nhất.
 */
async function generateHalf(
  topic: Topic,
  count: number,
  avoid: string[],
  proxies: Proxy[],
): Promise<VocabEntry[]> {
  const user = [
    `Chủ đề: ${topic.name} (${topic.nameVi}) — ${topic.blurb}`,
    `Soạn đúng ${count} từ vựng IELTS cho chủ đề này.`,
    avoid.length ? `TUYỆT ĐỐI KHÔNG dùng lại những từ sau: ${avoid.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let lastError = '';
  for (const proxy of proxies) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(`${proxy.base}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${proxy.key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: proxy.id === 'aibox' ? 'deepseek-v4-flash' : 'gpt-5.5',
            temperature: 0.4,
            messages: [
              { role: 'system', content: SYSTEM.replace('{{COUNT}}', String(count)) },
              { role: 'user', content: user },
            ],
          }),
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = body.choices?.[0]?.message?.content ?? '';
        const from = raw.indexOf('{');
        const to = raw.lastIndexOf('}');
        const parsed = JSON.parse(raw.slice(from, to + 1)) as { words?: VocabEntry[] };
        const words = (parsed.words ?? []).filter(
          (w) => !avoid.some((a) => a.toLowerCase() === (w.word ?? '').trim().toLowerCase()),
        );

        const check = checkTopic(words, count);
        if (check.ok) return words;
        lastError = check.problems.join('; ');
      } catch (err) {
        lastError = err instanceof Error ? err.message.slice(0, 120) : 'lỗi lạ';
      }
    }
  }
  throw new Error(lastError || 'không sinh được');
}

async function generateTopic(topic: Topic, proxies: Proxy[]): Promise<VocabEntry[]> {
  const half = Math.ceil(WORDS_PER_TOPIC / 2);
  const first = await generateHalf(topic, half, [], proxies);
  const second = await generateHalf(
    topic,
    WORDS_PER_TOPIC - half,
    first.map((w) => w.word),
    proxies,
  );

  const words = [...first, ...second];
  const check = checkTopic(words, WORDS_PER_TOPIC);
  if (!check.ok) throw new Error(`ghép hai nửa vẫn lỗi: ${check.problems.join('; ')}`);
  return words;
}

async function main() {
  const cfg = JSON.parse(readFileSync('.secrets-proxies.json', 'utf8')) as {
    proxies: Array<{ id: string; base: string; key: string }>;
  };
  // Proxy nhanh đứng trước; proxy kia làm dự phòng khi bộ nào cứng đầu.
  const proxies = [
    cfg.proxies.find((p) => p.id === 'aibox')!,
    cfg.proxies.find((p) => p.id === 'codex')!,
  ].filter(Boolean);

  mkdirSync(OUT_DIR, { recursive: true });
  const redo = process.argv.includes('--redo') ? process.argv[process.argv.indexOf('--redo') + 1] : null;

  let done = 0;
  let failed = 0;
  for (const topic of TOPICS) {
    const file = join(OUT_DIR, `${topic.slug}.json`);
    if (existsSync(file) && redo !== topic.slug) {
      done += 1;
      continue;
    }
    process.stdout.write(`${topic.slug.padEnd(16)} … `);
    try {
      const words = await generateTopic(topic, proxies);
      writeFileSync(file, JSON.stringify({ ...topic, words }, null, 2), 'utf8');
      console.log(`✓ ${words.length} từ`);
      done += 1;
    } catch (err) {
      console.log(`✖ ${err instanceof Error ? err.message : 'hỏng'}`);
      failed += 1;
    }
  }

  console.log(`\n${done}/${TOPICS.length} chủ đề xong, ${failed} hỏng.`);
  buildIndex();
}

/**
 * Gộp các file chủ đề thành một `index.json` cho app đọc.
 *
 * Giữ file riêng cho từng chủ đề khi SINH (đứt giữa chừng không mất hết) nhưng
 * app chỉ cần một file.
 *
 * Bước gộp cũng là bước KIỂM TRÙNG GIỮA CÁC CHỦ ĐỀ — một từ nằm ở hai bộ
 * thì người học gặp lại nó và tưởng mình học nhầm.
 */
export function buildIndex(): void {
  const all: Array<Topic & { words: VocabEntry[] }> = [];
  for (const topic of TOPICS) {
    const file = join(OUT_DIR, `${topic.slug}.json`);
    if (!existsSync(file)) continue;
    all.push(JSON.parse(readFileSync(file, 'utf8')) as Topic & { words: VocabEntry[] });
  }

  const owner = new Map<string, string>();
  let duplicates = 0;
  for (const topic of all) {
    for (const w of topic.words) {
      const key = w.word.trim().toLowerCase();
      const first = owner.get(key);
      if (first && first !== topic.slug) duplicates += 1;
      else owner.set(key, topic.slug);
    }
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(all), 'utf8');
  const words = all.reduce((sum, t) => sum + t.words.length, 0);
  console.log(
    `index.json: ${all.length} chủ đề · ${words} từ · ${duplicates} từ trùng giữa các chủ đề`,
  );
}

export { TOPICS, WORDS_PER_TOPIC, checkTopic };

if (process.argv[1]?.includes('generate-vocab-topics')) void main();
