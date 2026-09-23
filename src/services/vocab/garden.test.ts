import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyGrade, CARD_KINDS, cardKey, emptyCard, type StoredCard } from './schedule';
import { gardenSummary, plantHeight, plantsFrom, spiralLayout, stateOf } from './garden';

test('trạng thái cây theo độ nhớ', () => {
  assert.equal(stateOf(0, false), 'seed');
  assert.equal(stateOf(0.95, true), 'thriving');
  assert.equal(stateOf(0.85, true), 'ok');
  assert.equal(stateOf(0.75, true), 'wilting');
  assert.equal(stateOf(0.6, true), 'dying');
  assert.ok(plantHeight(30, true) > plantHeight(1, true));
  assert.ok(plantHeight(10_000, true) <= 1.6);
});

test('cây vừa ôn thì khoẻ, bỏ lâu không ôn thì héo; từ chưa ôn là hạt giống', () => {
  const t0 = new Date('2026-09-01T08:00:00Z');
  let cards: Record<string, StoredCard> = {};
  for (const k of CARD_KINDS) {
    const out = applyGrade(cards, 'a', k, 3, t0);
    cards = { ...cards, [out.key]: out.card, [cardKey('b', k)]: emptyCard(t0) };
  }
  const entries = [
    { id: 'a', word: 'habitat', definitionVi: 'môi trường sống' },
    { id: 'b', word: 'fauna', definitionVi: 'hệ động vật' },
  ];
  const fresh = plantsFrom(entries, cards, new Date('2026-09-01T09:00:00Z'));
  assert.equal(fresh[0]!.state, 'thriving');
  assert.equal(fresh[1]!.state, 'seed');
  const later = plantsFrom(entries, cards, new Date('2026-12-01T09:00:00Z'));
  assert.ok(later[0]!.memory < fresh[0]!.memory, 'độ nhớ giảm theo thời gian');
  assert.ok(['wilting', 'dying'].includes(later[0]!.state), later[0]!.state);
  const sum = gardenSummary(later);
  assert.equal(sum.total, 2);
  assert.equal(sum.seed, 1);
  assert.equal(sum.needWater, 1);
});

test('xoắn ốc hướng dương: đủ điểm, nằm trong đảo, không trùng nhau', () => {
  const pts = spiralLayout(120, 4.2);
  assert.equal(pts.length, 120);
  for (const p of pts) assert.ok(Math.hypot(p.x, p.z) <= 4.2 + 1e-9);
  let minGap = Infinity;
  for (let i = 0; i < pts.length; i += 1)
    for (let j = i + 1; j < pts.length; j += 1) minGap = Math.min(minGap, Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.z - pts[j]!.z));
  assert.ok(minGap > 0.2, `hai cây quá sát: ${minGap}`);
});
