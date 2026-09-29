/**
 * Kiểm một tệp bổ sung từ điển SAT Verbal trước khi gộp vào kho.
 *
 *   npx tsx scripts/check-lex-more.ts src/data/sat-rw-lexicon-more-a.ts
 *
 * Tệp phải export `MORE` (Record<từ, LexEntry>) và `THEME_ADDITIONS`
 * (Record<chỉ số chủ đề 0-based, từ mới theo thứ tự học>). In mọi lỗi; thoát 1
 * nếu có lỗi.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import { SAT_RW_LEXICON_BASE as SAT_RW_LEXICON } from '../src/data/sat-rw-lexicon';
import { VERBAL_THEMES_BASE as VERBAL_THEMES } from '../src/data/lessons/vocab-lessons';
import type { LexEntry } from '../src/data/sat-rw-lex-helpers';

const norm = (s: string) => s.trim().toLowerCase();

function clozeHit(word: string, example: string): boolean {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}])${esc}(?![\\p{L}])`, 'iu').test(example);
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Thiếu đường dẫn tệp');
  const mod = (await import(pathToFileURL(resolve(file)).href)) as { MORE: Record<string, LexEntry>; THEME_ADDITIONS: Record<number, string[]> };
  const errs: string[] = [];
  const warn: string[] = [];
  const MORE = mod.MORE ?? {};
  const ADD = mod.THEME_ADDITIONS ?? {};

  for (const [w, e] of Object.entries(MORE)) {
    if (w !== norm(w)) errs.push(`${w}: khoá phải viết thường, không khoảng trắng thừa`);
    if (SAT_RW_LEXICON[w]) errs.push(`${w}: đã có trong kho cũ`);
    if (!e.meaningVi?.trim() || !e.definitionEn?.trim() || !e.example?.trim() || !e.pos?.trim()) errs.push(`${w}: thiếu trường`);
    if (!e.synonyms?.length) errs.push(`${w}: thiếu đồng nghĩa`);
    const all = [...(e.synonyms ?? []), ...(e.antonyms ?? [])].map(norm);
    if (all.includes(w)) errs.push(`${w}: tự liệt kê chính nó`);
    if ((e.synonyms ?? []).some((s) => (e.antonyms ?? []).map(norm).includes(norm(s)))) errs.push(`${w}: vừa đồng vừa trái nghĩa`);
    const stem = w.split(' ')[0]!.replace(/(e|y)$/, '').toLowerCase();
    if (!e.example.toLowerCase().includes(stem)) errs.push(`${w}: câu ví dụ không chứa từ`);
    if (!clozeHit(w, e.example)) warn.push(`${w}: câu ví dụ không chứa NGUYÊN DẠNG "${w}" (quiz điền từ sẽ lùi về dạng khác)`);
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(e.definitionEn + e.example)) errs.push(`${w}: tiếng Việt lọt vào phần tiếng Anh`);
    if (e.pos === 'transition' && !e.logic) errs.push(`${w}: từ nối thiếu logic`);
  }

  const listed = Object.values(ADD).flat();
  if (new Set(listed).size !== listed.length) errs.push('một từ nằm ở hai chủ đề trong THEME_ADDITIONS');
  for (const w of listed) if (!MORE[w]) errs.push(`${w}: có trong THEME_ADDITIONS nhưng thiếu mục trong MORE`);
  for (const w of Object.keys(MORE)) if (!listed.includes(w)) errs.push(`${w}: có mục nhưng chưa xếp vào chủ đề nào`);

  for (const [k, words] of Object.entries(ADD)) {
    const i = Number(k);
    const theme = VERBAL_THEMES[i];
    if (!theme) {
      errs.push(`chủ đề ${k} không tồn tại`);
      continue;
    }
    const total = theme.words.length + words.length;
    if (total < 30) errs.push(`chủ đề ${i} "${theme.title}": mới ${total} từ, cần ≥ 30`);
    // Nghĩa tiếng Việt không trùng trong một chủ đề (quiz coi trùng nghĩa là cùng đáp án).
    const vis = new Map<string, string>();
    for (const w of [...theme.words, ...words]) {
      const e = MORE[w] ?? SAT_RW_LEXICON[w];
      if (!e) continue;
      const m = norm(e.meaningVi);
      if (vis.has(m)) errs.push(`chủ đề ${i}: "${w}" và "${vis.get(m)}" cùng nghĩa tiếng Việt "${e.meaningVi}"`);
      vis.set(m, w);
    }
  }

  console.log(`Mục mới: ${Object.keys(MORE).length}`);
  for (const [k, words] of Object.entries(ADD)) console.log(`  chủ đề ${k}: +${words.length} → ${VERBAL_THEMES[Number(k)]!.words.length + words.length}`);
  if (warn.length) console.log(`\nCảnh báo (${warn.length}):\n  ` + warn.join('\n  '));
  if (errs.length) {
    console.log(`\nLỖI (${errs.length}):\n  ` + errs.join('\n  '));
    process.exitCode = 1;
  } else console.log('\n✓ Không có lỗi.');
}

main();
