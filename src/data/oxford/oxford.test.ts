import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OXFORD_3000, OXFORD_ADVANCED, OXFORD_TOPICS } from './index';

const count = (list: { level: string }[], level: string) => list.filter((w) => w.level === level).length;

test('Oxford 3000 đủ số lượng từng cấp', () => {
  assert.equal(count(OXFORD_3000, 'A1'), 600);
  assert.equal(count(OXFORD_3000, 'A2'), 750);
  assert.equal(count(OXFORD_3000, 'B1'), 900);
  assert.equal(count(OXFORD_3000, 'B2'), 750);
  assert.equal(OXFORD_3000.length, 3000);
});

test('Oxford 5000 nâng cao: 2000 từ, chỉ B2 và C1', () => {
  assert.equal(OXFORD_ADVANCED.length, 2000);
  assert.ok(OXFORD_ADVANCED.every((w) => w.level === 'B2' || w.level === 'C1'));
});

test('không trùng từ trong từng bộ và giữa hai bộ', () => {
  const seen3000 = new Set<string>();
  for (const w of OXFORD_3000) {
    const key = w.word.toLowerCase();
    assert.ok(!seen3000.has(key), `trùng trong 3000: ${w.word}`);
    seen3000.add(key);
  }
  const seenAdv = new Set<string>();
  for (const w of OXFORD_ADVANCED) {
    const key = w.word.toLowerCase();
    assert.ok(!seenAdv.has(key), `trùng trong nâng cao: ${w.word}`);
    assert.ok(!seen3000.has(key), `trùng với bộ 3000: ${w.word}`);
    seenAdv.add(key);
  }
});

test('mọi mục có đủ trường và chủ đề hợp lệ', () => {
  const topics = new Set<string>(OXFORD_TOPICS);
  for (const w of [...OXFORD_3000, ...OXFORD_ADVANCED]) {
    assert.ok(w.word.trim() && w.pos.trim() && w.meaningVi.trim() && w.example.trim(), `thiếu trường: ${w.word}`);
    assert.ok(topics.has(w.topic), `chủ đề lạ: ${w.word} → ${w.topic}`);
  }
});
