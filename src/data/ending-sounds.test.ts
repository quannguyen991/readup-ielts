import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ENDING_WORDS, RULES, edSound, explain, pickEndingQuiz, sSound } from './ending-sounds';

test('quy tắc -ed: vô thanh → /t/, hữu thanh/nguyên âm → /d/, /t/ /d/ → /ɪd/', () => {
  assert.equal(edSound('k'), '/t/');
  assert.equal(edSound('ʃ'), '/t/');
  assert.equal(edSound('n'), '/d/');
  assert.equal(edSound('eɪ'), '/d/');
  assert.equal(edSound('dʒ'), '/d/');
  assert.equal(edSound('t'), '/ɪd/');
  assert.equal(edSound('d'), '/ɪd/');
});

test('quy tắc -s: vô thanh → /s/, hữu thanh/nguyên âm → /z/, âm gió → /ɪz/', () => {
  assert.equal(sSound('t'), '/s/');
  assert.equal(sSound('θ'), '/s/');
  assert.equal(sSound('g'), '/z/');
  assert.equal(sSound('ɡ'), '/z/');
  assert.equal(sSound('eɪ'), '/z/');
  assert.equal(sSound('tʃ'), '/ɪz/');
  assert.equal(sSound('dʒ'), '/ɪz/');
});

test('mọi từ trong kho: cách đọc ghi tay khớp với quy tắc suy ra từ âm cuối', () => {
  assert.ok(ENDING_WORDS.length >= 70, `${ENDING_WORDS.length} từ`);
  const seen = new Set<string>();
  for (const w of ENDING_WORDS) {
    const key = `${w.rule}:${w.word}`;
    assert.ok(!seen.has(key), `${key} bị trùng`);
    seen.add(key);
    const derived = w.rule === 'ed' ? edSound(w.last) : sSound(w.last);
    assert.equal(w.sound, derived, `${w.word}: ghi ${w.sound} nhưng quy tắc cho ${derived} (âm cuối /${w.last}/)`);
    // Từ có dạng chính tả đúng với từ gốc: bắt đầu bằng gốc bỏ e/y cuối.
    assert.ok(w.word.startsWith(w.base.slice(0, Math.max(2, w.base.length - 1))), `${w.word} không bắt nguồn từ ${w.base}`);
  }
});

test('mỗi cách đọc đều có đủ từ để luyện (≥ 8 từ)', () => {
  for (const rule of ['ed', 's'] as const) {
    for (const s of RULES[rule].sounds) {
      const n = ENDING_WORDS.filter((w) => w.rule === rule && w.sound === s.sound).length;
      assert.ok(n >= 8, `${rule} ${s.sound}: chỉ có ${n} từ`);
    }
  }
});

test('bộ câu hỏi: đủ số lượng, không trùng, giải thích nêu đúng cách đọc', () => {
  const q = pickEndingQuiz(10, 'both');
  assert.equal(q.length, 10);
  assert.equal(new Set(q.map((w) => w.word)).size, 10);
  assert.ok(pickEndingQuiz(10, 'ed').every((w) => w.rule === 'ed'));
  for (const w of ENDING_WORDS) assert.ok(explain(w).endsWith(`${w.sound}.`));
});
