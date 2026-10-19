/**
 * Ghép đồng nghĩa / trái nghĩa vào index.json của 50 bộ IELTS.
 *
 *   node scripts/vocab/syn-merge.mjs            kiểm và ghi
 *   node scripts/vocab/syn-merge.mjs --check    chỉ kiểm
 *
 * Nguồn: src/data/seed/vocab-syn/<slug>.json, mảng {word, synonyms, antonyms}.
 * Mỗi từ thiếu đồng nghĩa trong index.json phải có đúng một mục ở đây.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const INDEX_PATH = join(ROOT, 'src', 'data', 'seed', 'vocab-topics', 'index.json');
const SYN_DIR = join(ROOT, 'src', 'data', 'seed', 'vocab-syn');
const checkOnly = process.argv.includes('--check');
const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
const norm = (s) => s.trim().toLowerCase();
let errors = 0;
const fail = (slug, msg) => {
  errors++;
  console.error(`✗ ${slug}: ${msg}`);
};

for (const topic of index) {
  const slug = topic.slug;
  const todo = topic.words.filter((w) => !(w.synonyms && w.synonyms.length));
  if (!todo.length) continue;
  const src = join(SYN_DIR, `${slug}.json`);
  if (!existsSync(src)) {
    fail(slug, `chưa có ${src} (còn ${todo.length} từ)`);
    continue;
  }
  const rows = JSON.parse(readFileSync(src, 'utf8'));
  const byWord = new Map();
  for (const r of rows) {
    const key = norm(r.word);
    if (byWord.has(key)) fail(slug, `"${r.word}" xuất hiện hai lần`);
    byWord.set(key, r);
    const syn = r.synonyms ?? [];
    const ant = r.antonyms ?? [];
    if (!Array.isArray(syn) || syn.length > 4) fail(slug, `"${r.word}": synonyms tối đa 4 mục`);
    if (!Array.isArray(ant) || ant.length > 2) fail(slug, `"${r.word}": antonyms tối đa 2 mục`);
    const all = [...syn, ...ant].map(norm);
    if (all.includes(norm(r.word))) fail(slug, `"${r.word}": lặp chính từ gốc`);
    if (new Set(all).size !== all.length) fail(slug, `"${r.word}": có mục trùng`);
    for (const s of [...syn, ...ant]) {
      if (typeof s !== 'string' || !s.trim()) fail(slug, `"${r.word}": mục rỗng`);
      else if (s.trim().split(/\s+/).length > 3) fail(slug, `"${r.word}": "${s}" quá dài`);
    }
  }
  for (const w of todo) {
    if (!byWord.has(norm(w.word))) fail(slug, `thiếu "${w.word}"`);
  }
  if (checkOnly || errors) continue;
  for (const w of todo) {
    const r = byWord.get(norm(w.word));
    if (!r) continue;
    w.synonyms = r.synonyms;
    if (r.antonyms?.length) w.antonyms = r.antonyms;
  }
}

if (errors) {
  console.error(`\n${errors} lỗi — chưa ghi.`);
  process.exit(1);
}
if (!checkOnly) writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(checkOnly ? 'Kiểm xong, không lỗi.' : 'Đã ghép đồng nghĩa xong.');
