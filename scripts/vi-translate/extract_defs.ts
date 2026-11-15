/**
 * Lọc các từ tiếng Anh còn thiếu ĐỊNH NGHĨA tiếng Anh (Oxford theo chủ đề, Global Success, Du học) để sinh bằng Codex.
 * Chạy:  NODE_OPTIONS="--require ./tmp-reg.cjs" npx tsx scripts/vi-translate/extract_defs.ts
 *        (tmp-reg.cjs giả lập require ảnh: for (const e of ['.webp','.png','.jpg']) require.extensions[e] = (m) => { m.exports = 1; };)
 * Ra: scripts/vi-translate/work-def/todo.json — {id, key, word, pos, vi, ex}; `key` = "<từ thường>|<nghĩa Việt>" dùng để tra lại ở study-deck-fill.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getStaticDeck } from '@/data/study-decks';
import { GLOBAL_SUCCESS_DECKS } from '@/data/vocab-topics';
import { OXFORD_TOPIC_DECKS } from '@/data/oxford-topics-decks';
import { DESTINATION_DECKS } from '@/data/destination-vocab';

const slugs = new Set<string>();
for (const d of OXFORD_TOPIC_DECKS) slugs.add(d.slug);
for (const d of GLOBAL_SUCCESS_DECKS) slugs.add(d.slug);
for (const d of DESTINATION_DECKS as { slug: string }[]) slugs.add(d.slug);

const todo: { id: string; key: string; word: string; pos: string; vi: string; ex: string }[] = [];
const seen = new Set<string>();
for (const slug of slugs) {
  const deck = getStaticDeck(slug);
  if (!deck) continue;
  for (const w of deck.words) {
    if (w.definitionEn?.trim() || !w.word?.trim()) continue;
    const key = `${w.word.toLowerCase()}|${w.meaningVi}`;
    if (seen.has(key)) continue;
    seen.add(key);
    todo.push({ id: `def-${String(todo.length).padStart(5, '0')}`, key, word: w.word, pos: w.pos || '', vi: w.meaningVi || '', ex: w.example || '' });
  }
}
const dir = path.join(process.cwd(), 'scripts/vi-translate/work-def');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'todo.json'), JSON.stringify(todo), 'utf8');
console.log('bộ:', slugs.size, '· từ cần định nghĩa Anh:', todo.length, '· có câu ví dụ:', todo.filter((t) => t.ex).length);
