import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findSynonyms, rewriteSentence } from './sentence-rewrite';

test('đảo mệnh đề phụ lên đầu và ngược lại', () => {
  const r = rewriteSentence('We stayed inside because it was raining.');
  assert.ok(r.some((x) => x.en === 'Because it was raining, we stayed inside.'), JSON.stringify(r));
  const back = rewriteSentence('Although it was late, we kept working.');
  assert.ok(back.some((x) => x.en === 'We kept working although it was late.'), JSON.stringify(back));
});

test('but thành although, so thành because', () => {
  const a = rewriteSentence('I wanted to go out, but it was raining.');
  assert.ok(a.some((x) => /^Although I wanted to go out, it was raining\.$/.test(x.en)), JSON.stringify(a));
  const b = rewriteSentence('The room was small, so we moved the table.');
  assert.ok(b.some((x) => /^We moved the table because the room was small\.$/.test(x.en)), JSON.stringify(b));
});

test('It is adj to V và V-ing is adj đổi qua lại', () => {
  const a = rewriteSentence('It is important to sleep well before an exam.');
  assert.ok(a.some((x) => x.en === 'Sleeping well before an exam is important.'), JSON.stringify(a));
  const b = rewriteSentence('Sleeping well before an exam is important.');
  assert.ok(b.some((x) => x.en === 'It is important to sleep well before an exam.'), JSON.stringify(b));
});

test('chủ động sang bị động khi khuôn rõ', () => {
  const r = rewriteSentence('My brother cooks dinner every evening.');
  assert.ok(r.some((x) => /^Dinner is cooked by my brother every evening\.$/.test(x.en)), JSON.stringify(r));
});

test('từ đồng nghĩa được chia lại đúng dạng', () => {
  const hits = findSynonyms('She helps her friends and enjoys cooking.');
  const help = hits.find((h) => /helps/.test(h.phrase));
  assert.ok(help, JSON.stringify(hits));
  assert.ok(help.alts.includes('assists'));
});

test('câu không khớp khuôn nào thì không bịa cách viết lại', () => {
  assert.deepEqual(rewriteSentence('Hello.'), []);
});
