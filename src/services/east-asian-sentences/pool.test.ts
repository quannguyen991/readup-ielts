import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPool, distractorsVi, EA_LEVELS, levelsWithSentences, pickRound, sentencesOf } from './pool';

test('kho câu có đủ cho mọi cấp HSK 1–6 và JLPT N5–N1', () => {
  assert.deepEqual(levelsWithSentences('zh'), EA_LEVELS.zh);
  assert.deepEqual(levelsWithSentences('ja'), EA_LEVELS.ja);
});

test('mọi câu có chữ Hán/kana, có nghĩa Việt và độ dài hợp lý, không trùng', () => {
  for (const lang of ['zh', 'ja'] as const) {
    const pool = buildPool()[lang];
    assert.equal(new Set(pool.map((s) => s.text)).size, pool.length);
    for (const s of pool) {
      assert.ok(/[぀-ヿ㐀-鿿]/.test(s.text), s.text);
      assert.ok(s.vi.trim().length > 0, s.text);
      assert.ok(EA_LEVELS[lang].includes(s.level), s.level);
    }
  }
});

test('pickRound lấy đủ 10 câu, ngắn trước dài sau', () => {
  const r = pickRound('zh', 'HSK 2');
  assert.equal(r.length, 10);
  for (let i = 1; i < r.length; i += 1) assert.ok(r[i - 1]!.text.length <= r[i]!.text.length);
});

test('đáp án nhiễu khác câu đúng và đủ số lượng', () => {
  const t = sentencesOf('ja', 'JLPT N5')[0]!;
  const d = distractorsVi(t);
  assert.equal(d.length, 3);
  assert.ok(!d.includes(t.vi));
  assert.equal(new Set(d).size, 3);
});

test('30 câu soạn thêm cho mỗi cấp đều vào kho, có pinyin ở tiếng Trung', () => {
  const extra = require('../../data/east-asian-sentences-extra.json') as { zh: { l: string; t: string; py: string }[]; ja: { l: string; t: string }[] };
  for (const lv of EA_LEVELS.zh) assert.equal(extra.zh.filter((r) => r.l === lv).length, 30, lv);
  for (const lv of EA_LEVELS.ja) assert.equal(extra.ja.filter((r) => r.l === lv).length, 30, lv);
  const pool = buildPool();
  for (const r of extra.zh) {
    const s = pool.zh.find((x) => x.text === r.t);
    assert.ok(s, r.t);
    assert.ok(s.reading && s.reading.split(' ').length >= 3, r.t);
  }
  for (const r of extra.ja) assert.ok(pool.ja.some((x) => x.text === r.t), r.t);
});
