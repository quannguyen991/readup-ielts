import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DICTATION_SETS } from '@/data/dictation-sets';
import { buildCloze, buildScramble, buildSpot, checkCloze, checkScramble } from './drill-types';

const all = DICTATION_SETS.flatMap((s) => s.sentences.map((x) => x.en));

test('sắp xếp từ: luôn xáo khác thứ tự gốc và ghép đúng thì được chấp nhận', () => {
  for (const en of all.slice(0, 400)) {
    const sc = buildScramble(en);
    if (sc.tokens.length < 3) continue;
    assert.equal(checkScramble(sc.tokens, sc.order), false, en);
    assert.equal(checkScramble(sc.tokens, sc.tokens.map((_, i) => i)), true, en);
  }
});

test('điền từ: ghép lại các phần và đáp án ra đúng câu gốc', () => {
  let made = 0;
  for (const en of all) {
    const c = buildCloze(en);
    if (!c) continue;
    made += 1;
    let blanks = 0;
    const text = c.parts
      .map((p) => {
        if (p.blank === undefined) return p.text;
        blanks += 1;
        return c.answers[p.blank]!;
      })
      .join(' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    assert.ok(blanks >= 1 && blanks <= 2, en);
    assert.equal(text.replace(/\s/g, ''), en.replace(/\s/g, ''), en);
    assert.deepEqual(checkCloze(c.answers, c.answers), c.answers.map(() => true));
  }
  assert.ok(made > all.length * 0.9, `chỉ dựng được ${made}/${all.length}`);
});

test('tìm lỗi sai: từ bị thay khác từ gốc và nằm đúng vị trí', () => {
  let made = 0;
  for (const en of all) {
    const s = buildSpot(en);
    if (!s) continue;
    made += 1;
    const orig = en.trim().split(/\s+/);
    assert.equal(s.words.length, orig.length);
    assert.notEqual(s.words[s.wrongIndex], orig[s.wrongIndex]);
    assert.equal(s.original, orig[s.wrongIndex]);
  }
  assert.ok(made >= 40, `chỉ dựng được ${made} câu`);
});
