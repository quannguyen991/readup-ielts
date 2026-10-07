import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Dựng `src/data/seed/vocab-for-ielts/index.json` từ các file soạn tay
 * `scripts/vfi/units/NN.txt` (mỗi unit một file).
 *
 *   node scripts/vfi/build.mjs          # kiểm + ghi index.json
 *
 * Dòng từ: word|loại|/ipa/|nghĩa Việt|định nghĩa Anh|ví dụ|collocation|band
 * Dòng `+++` ngăn phần "từ theo sách" với phần 20 từ mở rộng của unit.
 * Mọi luật dưới đây KHÔNG qua thì không ghi file — cùng tinh thần bộ sinh chủ đề.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
/** Hai cuốn: bản thường (20 từ mở rộng/unit) và Advanced (15 từ mở rộng/unit). */
const SETS = [
  { dir: 'units', out: 'vocab-for-ielts', prefix: 'vfi', extra: 20, namePrefix: '' },
  { dir: 'units-adv', out: 'vocab-for-ielts-advanced', prefix: 'vfia', extra: 15, namePrefix: 'Advanced · ' },
];
const BANDS = ['5-6', '6-7', '7-8', '8+'];
const POS = { n: 'noun', adj: 'adjective', v: 'verb', adv: 'adverb', np: 'noun phrase', vp: 'verb phrase', ph: 'phrase', id: 'idiom', nv: 'noun / verb', adjn: 'adjective / noun', nadj: 'noun / adjective', vn: 'verb / noun', adjv: 'adjective / verb', prep: 'preposition' };
const IPA_OK = /^[ .abdefhijklmnprstuvwzæðŋɑɒɔəɜɡɪʃʊʌʒˈˌːθ]+$/;

const stem4 = (word) => {
  const token = word.toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).find((t) => t.length >= 4);
  return token ? token.slice(0, 4) : null;
};
const letters = (s) => s.toLowerCase().replace(/[^a-z ]/g, '');
const lettersOnly = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

const problems = [];
const built = [];

for (const set of SETS) {
const units = [];

for (const file of readdirSync(join(HERE, set.dir)).filter((f) => /^\d+\.txt$/.test(f)).sort()) {
  const meta = {};
  const words = [];
  let extra = false;
  const lines = readFileSync(join(HERE, set.dir, file), 'utf8').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const where = `${file}:${i + 1}`;
    if (!line) return;
    if (line === '+++') { extra = true; return; }
    const m = /^#(\w+)\s+(.*)$/.exec(line);
    if (m) { meta[m[1]] = m[2].trim(); return; }
    const f = line.split('|').map((s) => s.trim());
    if (f.length !== 8) { problems.push(`${where}: ${f.length} trường (cần 8): ${line.slice(0, 50)}`); return; }
    const [word, pos, ipa, meaningVi, definitionEn, example, collocation, band] = f;
    if (!POS[pos]) { problems.push(`${where}: loại từ lạ "${pos}"`); return; }
    const w = { word, pos: POS[pos], ipa, meaningVi, definitionEn, example, collocation, band };
    if (extra) w.more = true;
    const key = stem4(word);
    if (!/^\/.+\/$/.test(ipa) || !IPA_OK.test(ipa.slice(1, -1))) problems.push(`${where}: ipa lạ ${ipa} (${word})`);
    if (!BANDS.includes(band)) problems.push(`${where}: band lạ ${band} (${word})`);
    if (key && !letters(example).includes(key)) problems.push(`${where}: ví dụ không chứa "${word}"`);
    if (key && !lettersOnly(collocation).includes(key)) problems.push(`${where}: collocation không chứa "${word}"`);
    const n = example.split(/\s+/).length;
    if (n < 4 || n > 22) problems.push(`${where}: ví dụ ${n} từ (${word})`);
    if (definitionEn.split(/\s+/).length > 20) problems.push(`${where}: định nghĩa quá dài (${word})`);
    if (meaningVi.length > 40) problems.push(`${where}: nghĩa Việt quá dài (${word})`);
    if (meaningVi.toLowerCase() === definitionEn.toLowerCase()) problems.push(`${where}: nghĩa Việt trùng định nghĩa (${word})`);
    words.push(w);
  });
  const num = Number(meta.unit);
  for (const k of ['unit', 'en', 'blurb']) if (!meta[k]) problems.push(`${file}: thiếu #${k}`);
  if (num !== Number(file.slice(0, 2))) problems.push(`${file}: #unit ${meta.unit} lệch tên file`);
  const seen = new Set();
  for (const w of words) {
    const k = w.word.toLowerCase();
    if (seen.has(k)) problems.push(`${file}: trùng từ "${w.word}"`);
    seen.add(k);
  }
  const nExtra = words.filter((w) => w.more).length;
  if (nExtra !== set.extra) problems.push(`${set.dir}/${file}: ${nExtra} từ mở rộng (cần ${set.extra})`);
  if (meta.blurb && meta.blurb.length > 110) problems.push(`${file}: blurb dài hơn một dòng`);
  // Dễ → khó, giữ thứ tự sách trong cùng một band.
  const sorted = BANDS.flatMap((b) => words.filter((w) => w.band === b));
  units.push({
    slug: `${set.prefix}-unit-${String(num).padStart(2, '0')}`,
    name: `${set.namePrefix}Unit ${num}: ${meta.en}`,
    nameVi: `${set.namePrefix}Unit ${num}: ${meta.en}`,
    blurb: meta.blurb,
    unit: num,
    words: sorted,
  });
}

built.push({ set, units });
}

if (problems.length) {
  console.error(`${problems.length} lỗi:\n` + problems.slice(0, 60).join('\n'));
  process.exit(1);
}
for (const { set, units } of built) {
  const out = join(HERE, '..', '..', 'src', 'data', 'seed', set.out, 'index.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(units), 'utf8');
  const total = units.reduce((n, u) => n + u.words.length, 0);
  console.log(`${set.out}: ${units.length} unit · ${total} từ`);
  for (const u of units) console.log(`  ${u.slug} ${u.words.length} (+${u.words.filter((w) => w.more).length})`);
}
