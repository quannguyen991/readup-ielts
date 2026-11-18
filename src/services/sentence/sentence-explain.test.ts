import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DICTATION_SETS } from '@/data/dictation-sets';
import { SENTENCE_NOTES } from '@/data/sentence-notes';
import { DICTATION_SENTENCES } from '@/data/sentence-drills';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { norm } from './lexicon';
import { explainSentence } from './sentence-explain';
import { STRUCTURE_IDS } from './structure-bank';

const ROLES = new Set(['S', 'V', 'O', 'I', 'C', 'T', 'P', 'M', 'R', 'U', 'A', 'J']);
const words = (t: string) =>
  t
    .split(/\s+/)
    .map((w) => norm(w))
    .filter(Boolean)
    .join(' ');

function allDictationItems(): { id: string; en: string }[] {
  const out: { id: string; en: string }[] = [];
  for (const set of DICTATION_SETS) set.sentences.forEach((s, i) => out.push({ id: `${set.id}-${String(i + 1).padStart(2, '0')}`, en: s.en }));
  for (const d of DICTATION_SENTENCES) out.push({ id: d.id, en: d.text });
  return out;
}

test('mọi câu chép chính tả (bộ đề + kho cũ) đều có ghi chú soạn sẵn', () => {
  // Bộ mới (set-55 trở đi) chưa có ghi chú soạn sẵn — được giải bằng luật; chỉ bắt buộc với kho gốc.
  const original = (id: string) => !/^set-(5[5-9]|[6-9]\d|\d{3})/.test(id);
  const missing = allDictationItems().filter((it) => original(it.id) && !SENTENCE_NOTES[it.id]);
  assert.equal(missing.length, 0, `thiếu ${missing.length}: ${missing.slice(0, 8).map((m) => m.id).join(', ')}`);
});

test('ghi chú: khối ghép lại trùng từng từ với câu gốc, mã vai trò và cấu trúc hợp lệ', () => {
  const problems: string[] = [];
  for (const it of allDictationItems()) {
    const n = SENTENCE_NOTES[it.id];
    if (!n) continue;
    if (!n.c.every((k) => Array.isArray(k) && k.length === 2 && ROLES.has(k[0]))) problems.push(`${it.id}: chunk sai dạng`);
    if (words(n.c.map((k) => k[1]).join(' ')) !== words(it.en)) problems.push(`${it.id}: khối ≠ câu gốc`);
    if (!n.c.some((k) => k[0] === 'V')) problems.push(`${it.id}: thiếu khối V`);
    if (n.s.length < 1 || n.s.length > 3 || n.s.some((s) => !STRUCTURE_IDS.includes(s))) problems.push(`${it.id}: mã cấu trúc`);
    if (n.n.length < 15) problems.push(`${it.id}: ghi chú ngắn`);
    if (n.x.length !== 2 || n.x.some((p) => p.length !== 2 || !p[0] || !p[1])) problems.push(`${it.id}: câu cùng khuôn`);
    if (n.y.length < 1 || n.y.some((p) => p.length < 3)) problems.push(`${it.id}: từ khoá`);
    if (n.r.length !== 2 || n.r.some((p) => p.length !== 2 || !p[0] || !p[1])) problems.push(`${it.id}: cách diễn đạt khác`);
    else if (n.r.some((p) => words(p[0]) === words(it.en))) problems.push(`${it.id}: viết lại trùng câu gốc`);
  }
  assert.equal(problems.length, 0, problems.slice(0, 15).join('\n'));
});

test('explainSentence dùng ghi chú soạn sẵn khi có mã câu', () => {
  const e = explainSentence('I wake up at six every morning.', 'set-01-01');
  assert.equal(e.source, 'curated');
  assert.ok(e.chunks && e.chunks.length >= 2);
  assert.ok(e.structures.length >= 1);
  assert.ok(e.note);
  assert.equal(e.similar.length, 2);
  assert.ok(e.rewrites.length >= 1);
});

test('câu không có ghi chú (câu dịch, câu tự viết) vẫn được giải bằng luật, không lỗi', () => {
  let n = 0;
  for (const set of TRANSLATION_SETS) {
    for (const it of set.items) {
      const e = explainSentence(it.en, it.id);
      assert.equal(e.source, 'rules');
      assert.ok(e.structures.length <= 3);
      for (const r of e.rewrites) assert.notEqual(words(r.en), words(it.en), it.id);
      n += 1;
    }
  }
  assert.ok(n > 100);
  const free = explainSentence('Although she was tired, she finished the report.');
  assert.ok(free.structures.some((s) => s.id === 'concession'));
});
