import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { choicesIn, matchingChoice } from './example-choice';

test('mọi ví dụ có lựa chọn "(a / b)" thì đáp án khớp đúng MỘT lựa chọn', () => {
  for (const l of [...MATH_LESSONS, ...VERBAL_LESSONS]) {
    for (const b of l.blocks) {
      if (b.kind !== 'example') continue;
      const c = choicesIn(b.problem);
      if (!c) continue;
      assert.ok(matchingChoice(c, b.answer), `${l.skill}: "${b.answer}" không khớp lựa chọn nào trong ${c.join(' / ')}`);
    }
  }
});

test('khớp nguyên văn trước, không nhận nhầm tiền tố', () => {
  assert.equal(matchingChoice(['scientists', 'scientist’s', 'scientists’'], 'scientists’'), 'scientists’');
  assert.equal(matchingChoice(['is', 'are'], 'is'), 'is');
  assert.equal(matchingChoice(['was', 'were'], 'were — chủ ngữ số nhiều'), 'were');
  assert.deepEqual(choicesIn('The maps ___ (is / are) old.'), ['is', 'are']);
  assert.equal(choicesIn('Solve 2x + 3 = 7.'), null);
});
