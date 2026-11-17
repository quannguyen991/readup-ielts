import assert from 'node:assert/strict';
import { test } from 'node:test';

import { JA_LEVELS } from './index';
import { JA_KANJI, jaKanjiOfLevel, makeKanjiQuiz, searchJaKanji } from './kanji';

test('kanji có đủ 5 cấp, mỗi chữ có nghĩa và âm Hán Việt, không trùng', () => {
  for (const lv of JA_LEVELS) assert.ok(jaKanjiOfLevel(lv).length >= 80, `N${lv}`);
  assert.equal(new Set(JA_KANJI.map((k) => k.c)).size, JA_KANJI.length);
  for (const k of JA_KANJI) {
    assert.ok(k.en.length > 0, k.c);
    assert.ok(k.hv.length > 0, k.c);
    assert.ok(k.on.length + k.kun.length > 0, k.c);
  }
});

test('tìm theo chữ, âm Hán Việt không dấu và nghĩa', () => {
  assert.equal(searchJaKanji('食')[0]?.c, '食');
  assert.ok(searchJaKanji('thuc', 5).some((k) => k.c === '食'));
  assert.ok(searchJaKanji('dien').some((k) => k.c === '電'));
  assert.ok(searchJaKanji('water').some((k) => k.c === '水'));
  assert.equal(searchJaKanji('').length, 0);
});

test('câu hỏi âm Hán Việt: 4 đáp án khác nhau, đáp án đúng khớp kanji', () => {
  for (const lv of JA_LEVELS) {
    const qs = makeKanjiQuiz(lv, 10);
    assert.equal(qs.length, 10);
    for (const q of qs) {
      assert.equal(q.options.length, 4, q.kanji.c);
      assert.equal(new Set(q.options).size, 4, q.kanji.c);
      assert.equal(q.options[q.answer], q.kanji.hv[0]);
    }
  }
});
