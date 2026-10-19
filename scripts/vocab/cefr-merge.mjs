/**
 * Ghép từ vựng B1–C2 vào 50 bộ chủ đề IELTS, sau khi kiểm từng mục.
 *
 *   node scripts/vocab/cefr-merge.mjs            kiểm tra tất cả, chỉ ghi khi không lỗi
 *   node scripts/vocab/cefr-merge.mjs --check    chỉ kiểm, không ghi
 *
 * Nguồn: src/data/seed/vocab-cefr/<slug>.json — mảng mục {word, pos, ipa, meaningVi,
 * definitionEn, example, collocation, cefr}. Đích: src/data/seed/vocab-topics/<slug>.json.
 *
 * Mục tiêu theo mức (tổng cả bộ, kể cả từ cũ): B1 30, B2 40, C1 50, C2 50.
 * Từ cũ được gán mức theo band: 5-6→B1, 6-7→B2, 7-8→C1, 8+→C2; không xoá từ cũ.
 * Mỗi bộ chỉ được thêm đúng số từ còn thiếu ở từng mức (tính trong `needs`).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const TOPICS_DIR = join(ROOT, 'src', 'data', 'seed', 'vocab-topics');
// Nguồn app đọc là index.json (có cả đồng nghĩa); các file <slug>.json không có đồng nghĩa nên không dùng để ghi.
const INDEX_PATH = join(TOPICS_DIR, 'index.json');
const CEFR_DIR = join(ROOT, 'src', 'data', 'seed', 'vocab-cefr');
const TARGET = { B1: 30, B2: 40, C1: 50, C2: 50 };
const BAND_TO_CEFR = { '5-6': 'B1', '6-7': 'B2', '7-8': 'C1', '8+': 'C2' };
const CEFR_TO_BAND = { B1: '5-6', B2: '6-7', C1: '7-8', C2: '8+' };
const POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'phrasal verb', 'collocation', 'idiom', 'preposition', 'conjunction', 'phrase']);
const checkOnly = process.argv.includes('--check');

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
const merged_all = [];
let errors = 0;
const fail = (slug, msg) => {
  errors++;
  console.error(`✗ ${slug}: ${msg}`);
};
const norm = (w) => w.trim().toLowerCase();

for (const topic of index) {
  const slug = topic.slug;
  const data = topic;
  const have = { B1: 0, B2: 0, C1: 0, C2: 0 };
  const existing = new Set();
  for (const w of data.words) {
    have[BAND_TO_CEFR[w.band]]++;
    existing.add(norm(w.word));
  }
  const srcPath = join(CEFR_DIR, `${slug}.json`);
  const need = Object.fromEntries(Object.keys(TARGET).map((l) => [l, Math.max(0, TARGET[l] - have[l])]));
  if (!existsSync(srcPath)) {
    const missing = Object.values(need).reduce((a, b) => a + b, 0);
    if (missing > 0) fail(slug, `chưa có ${srcPath} (cần ${missing} từ)`);
    continue;
  }
  const added = JSON.parse(readFileSync(srcPath, 'utf8'));
  const seen = new Set(existing);
  const got = { B1: 0, B2: 0, C1: 0, C2: 0 };
  for (const [i, w] of added.entries()) {
    const where = `${slug}[${i}] "${w.word}"`;
    for (const f of ['word', 'pos', 'ipa', 'meaningVi', 'definitionEn', 'example', 'collocation', 'cefr']) {
      if (typeof w[f] !== 'string' || !w[f].trim()) fail(slug, `${where}: thiếu ${f}`);
    }
    if (!TARGET[w.cefr]) fail(slug, `${where}: cefr không hợp lệ (${w.cefr})`);
    else got[w.cefr]++;
    if (!POS.has(w.pos)) fail(slug, `${where}: pos lạ (${w.pos})`);
    if (!/^\/.+\/$/.test(w.ipa ?? '')) fail(slug, `${where}: ipa phải nằm giữa hai dấu /…/`);
    // Với cụm từ chỉ cần từ đầu (looks after), và chấp nhận biến đổi y→i (fry → fried).
    const first = norm(w.word).split(' ')[0];
    const stems = [first, first.replace(/([^aeiou])y$/, '$1i')].map((x) => x.slice(0, Math.max(3, x.length - 2)));
    if (!stems.some((st) => norm(w.example ?? '').includes(st))) fail(slug, `${where}: câu ví dụ không chứa từ`);
    if (w.word !== w.word.trim()) fail(slug, `${where}: khoảng trắng thừa`);
    if (seen.has(norm(w.word))) fail(slug, `${where}: trùng từ đã có trong bộ`);
    seen.add(norm(w.word));
  }
  for (const l of Object.keys(TARGET)) {
    if (got[l] !== need[l]) fail(slug, `mức ${l}: có ${got[l]}, cần đúng ${need[l]}`);
  }
  if (checkOnly || errors) continue;

  const merged = [
    ...data.words.map((w) => ({ ...w, cefr: BAND_TO_CEFR[w.band] })),
    ...added.map((w) => ({ ...w, band: CEFR_TO_BAND[w.cefr] })),
  ];
  data.words = merged;
  merged_all.push(data);
  console.log(`✓ ${slug}: ${merged.length} từ (B1 ${have.B1 + got.B1}, B2 ${have.B2 + got.B2}, C1 ${have.C1 + got.C1}, C2 ${have.C2 + got.C2})`);
}

if (errors) {
  console.error(`\n${errors} lỗi — chưa ghi bộ nào sau bộ lỗi đầu tiên.`);
  process.exit(1);
}
console.log(checkOnly ? '\nKiểm tra xong, không lỗi.' : '\nĐã ghép xong.');

// Ghi một lần vào index.json (nguồn app đọc) sau khi mọi bộ đã qua kiểm.
if (!checkOnly) writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');
