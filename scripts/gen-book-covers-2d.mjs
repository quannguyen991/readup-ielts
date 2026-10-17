import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Tạo bìa 2D cho bộ đề bằng model ảnh (không vẽ bằng code).
 *
 *   node scripts/gen-book-covers-2d.mjs cam 19
 *   node scripts/gen-book-covers-2d.mjs vol 3
 *
 * Đọc khoá và địa chỉ từ .env.local (không in khoá ra màn hình). Bìa là tranh phẳng
 * gốc, không sao chép bìa của nhà xuất bản.
 */

const [, , kind = 'cam', num = '19'] = process.argv;
const env = Object.fromEntries(
  readFileSync(join('.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const base = env.IMAGE_BASE_URL;
const key = env.IMAGE_API_KEY;
const model = env.OPENAI_IMAGE_MODEL || 'qwen-image-3.0';
if (!base || !key) throw new Error('Thiếu IMAGE_BASE_URL hoặc IMAGE_API_KEY trong .env.local');

const label = kind === 'vol' ? 'Actual Tests' : 'Practice Tests';

/** Mỗi bìa một màu nền; chọn theo số đề để cùng số luôn cùng màu. */
const COLORS = [
  'crimson red background with white and gold accents',
  'royal blue background with white and light blue accents',
  'warm golden yellow background with deep brown accents',
  'rich purple background with gold accents',
  'emerald green background with cream accents',
  'burnt orange background with white accents',
  'teal turquoise background with white accents',
  'rose pink background with dark plum accents',
  'deep navy background with gold accents',
  'chocolate brown background with cream accents',
];
const colorOf = (n) => COLORS[(parseInt(n, 10) || 0) % COLORS.length];
const prompt = [
  'Flat 2D illustration of a practice exam book cover, portrait orientation, clean vector style,',
  'flat colors, no 3D, no shadows, no mockup, no hands, no photo.',
  `${colorOf(num)}, soft geometric pattern. Large bold number "${num}" in the center.`,
  `Small text "IELTS" at the top and "${label}" under it. No logos, no publisher names, no barcode.`,
].join(' ');

const out = join('public', 'books', 'covers-2d', `${kind}-${num}.png`);
mkdirSync(join('public', 'books', 'covers-2d'), { recursive: true });

const r = await fetch(`${base.replace(/\/$/, '')}/images/generations`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
  body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024' }),
  signal: AbortSignal.timeout(180000),
});
const text = await r.text();
if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 300)}`);
const j = JSON.parse(text);
const item = j.data?.[0];
if (!item) throw new Error('Không có ảnh trong phản hồi');

if (item.b64_json) {
  writeFileSync(out, Buffer.from(item.b64_json, 'base64'));
} else if (item.url) {
  const img = await fetch(item.url, { signal: AbortSignal.timeout(120000) });
  writeFileSync(out, Buffer.from(await img.arrayBuffer()));
} else {
  throw new Error('Phản hồi không có b64_json hoặc url');
}
console.log(`✔ ${out} (model ${model})`, existsSync(out) ? '' : '');
if (j.usage) console.log('usage:', JSON.stringify(j.usage));
