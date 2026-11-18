import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DICTATION_SETS } from '@/data/dictation-sets';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { editDistance, findIssues } from './grammar-rules';

const kinds = (text: string) => findIssues(text).map((i) => `${i.kind}:${i.found}`);
const has = (text: string, found: string) => findIssues(text).some((i) => i.found.toLowerCase() === found.toLowerCase() && i.severity === 'error');

test('chính tả: từ gõ lệch được gợi ý từ gần nhất', () => {
  const issues = findIssues('I recieve the mesage every morning.');
  const spell = issues.filter((i) => i.kind === 'spelling');
  assert.ok(spell.some((i) => i.fix === 'receive'), JSON.stringify(spell));
  assert.ok(spell.some((i) => i.fix === 'message'), JSON.stringify(spell));
});

test('hoà hợp chủ–vị: she study, they studies, he have', () => {
  assert.ok(has('She study English every day.', 'study'));
  assert.ok(has('They studies English every day.', 'studies'));
  assert.ok(has('He have a car.', 'have'));
  assert.ok(has('I is a student.', 'is'));
  assert.ok(has('We was late.', 'was'));
});

test('sau modal/do/to động từ phải nguyên mẫu', () => {
  assert.ok(has('She can goes to school.', 'goes'));
  assert.ok(findIssues('He does not likes coffee.').some((i) => /likes/.test(i.found)));
  assert.ok(findIssues('You should to sleep early.').some((i) => /should to/i.test(i.found)));
});

test('danh từ số ít có từ sở hữu + động từ nguyên mẫu: "my sister wake"', () => {
  const hit = findIssues('My sister wake up much later.').find((i) => i.found === 'wake');
  assert.ok(hit && hit.fix === 'wakes', JSON.stringify(findIssues('My sister wake up much later.')));
  // cụm danh từ hợp lệ không bị báo
  assert.equal(findIssues('I made my phone call yesterday.').filter((i) => i.severity === 'error').length, 0);
  assert.equal(findIssues('Their friends like football and my parents love tennis.').filter((i) => i.severity === 'error').length, 0);
});

test('a/an và từ lặp', () => {
  assert.ok(has('I ate a apple.', 'a apple'));
  assert.ok(has('She bought an book.', 'an book'));
  assert.ok(has('It is the the best way.', 'the'));
  assert.equal(findIssues('She is an honest person and a useful friend.').filter((i) => i.severity === 'error').length, 0);
});

test('quá khứ sai kiểu goed / eated', () => {
  assert.ok(has('I goed home yesterday.', 'goed'));
  assert.ok(has('We eated dinner early.', 'eated'));
});

test('lỗi người Việt hay mắc có giải thích tiếng Việt', () => {
  for (const [text, frag] of [
    ['I am agree with you.', 'am agree'],
    ['We discuss about the plan.', 'discuss about'],
    ['He go to home late.', 'go to home'],
    ['Although it rained, but we went out.', 'Although it rained, but'],
    ['She is more taller than me.', 'more taller'],
    ['I listen music every night.', 'listen music'],
  ] as const) {
    const hit = findIssues(text).find((i) => i.found.toLowerCase().includes(frag.toLowerCase()));
    assert.ok(hit, `${text} → ${JSON.stringify(findIssues(text))}`);
    assert.match(hit.vi, /[À-ỹ]|[a-z]/);
  }
});

test('viết hoa đầu câu và dấu cuối câu là cảnh báo, không phải lỗi cứng', () => {
  const issues = findIssues('i like tea');
  assert.ok(issues.some((i) => i.kind === 'punctuation' && i.severity === 'warn'));
  assert.equal(issues.filter((i) => i.severity === 'error').length, 0);
});

test('editDistance', () => {
  assert.equal(editDistance('receive', 'recieve'), 2);
  assert.equal(editDistance('cat', 'cat'), 0);
  assert.ok(editDistance('abc', 'abcdefgh', 2) > 2);
});

test('KHÔNG báo lỗi cứng trên câu mẫu đúng của kho (chống báo nhầm)', () => {
  const sentences: string[] = [];
  for (const s of DICTATION_SETS) for (const x of s.sentences) sentences.push(x.en);
  for (const s of TRANSLATION_SETS) for (const x of s.items) sentences.push(x.en);
  const bad: string[] = [];
  for (const en of sentences) {
    const errs = findIssues(en, { extraWords: new Set(), requireEndPunct: false }).filter((i) => i.severity === 'error');
    if (errs.length) bad.push(`${en}  ⟶  ${errs.map((e) => e.found + '=>' + (e.fix ?? '')).join(' | ')}`);
  }
  const rate = bad.length / sentences.length;
  assert.ok(rate < 0.01, `báo nhầm ${bad.length}/${sentences.length}:\n${bad.slice(0, 25).join('\n')}`);
});

void kinds;
