import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAT_RW_QUESTIONS } from './sat-rw-repository';
import { lookupLex, SAT_RW_LEXICON } from './sat-rw-lexicon';

test('mọi phương án của dạng Từ nối và Từ trong ngữ cảnh đều có mục từ điển', () => {
  const missing = new Set<string>();
  for (const q of SAT_RW_QUESTIONS) {
    if (q.skill !== 'transition' && q.skill !== 'words') continue;
    for (const o of q.options) if (!lookupLex(o)) missing.add(o);
  }
  assert.deepEqual([...missing], []);
});

test('mỗi mục đủ trường, có đồng nghĩa và câu ví dụ, không tự liệt kê chính nó', () => {
  for (const [word, e] of Object.entries(SAT_RW_LEXICON)) {
    assert.ok(e.meaningVi && e.definitionEn && e.example, word);
    assert.ok(e.synonyms.length >= 1, `${word}: thiếu đồng nghĩa`);
    assert.ok(![...e.synonyms, ...e.antonyms].map((s) => s.toLowerCase()).includes(word), `${word}: tự liệt kê chính nó`);
    const overlap = e.synonyms.filter((s) => e.antonyms.includes(s));
    assert.deepEqual(overlap, [], `${word}: một từ vừa đồng nghĩa vừa trái nghĩa`);
  }
});

test('câu ví dụ có chứa chính từ đó', () => {
  for (const [word, e] of Object.entries(SAT_RW_LEXICON)) {
    const stem = word.split(' ')[0]!.replace(/(e|y)$/, '').toLowerCase();
    assert.ok(e.example.toLowerCase().includes(stem), `${word}: ví dụ không dùng từ này`);
  }
});
