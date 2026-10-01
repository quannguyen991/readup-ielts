import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allocateByMix, dominantDifficulty, isSortedByDifficulty } from '@/lib/difficulty';
import { MATH_SKILL_DOMAIN, type MathSkill } from '@/lib/math/types';
import { ROUND_MIX, bankRoundItems, roundTier, roundsFor } from './bank';
import { ALL_SETS, buildSetItems } from './curriculum';
import { generateMathSet } from './generator';

const SKILLS = Object.keys(MATH_SKILL_DOMAIN) as MathSkill[];

test('chia số câu theo tỉ lệ luôn đủ tổng và tôn trọng bậc trọng số 0', () => {
  for (const count of [1, 7, 10, 20, 24]) {
    const a = allocateByMix(count, { easy: 0.6, medium: 0.4, hard: 0 });
    assert.equal(a.easy + a.medium + a.hard, count);
    assert.equal(a.hard, 0);
  }
  assert.equal(dominantDifficulty({ easy: 0.6, medium: 0.4, hard: 0 }), 'easy');
  assert.equal(dominantDifficulty({ easy: 0.2, medium: 0.6, hard: 0.2 }), 'medium');
  assert.equal(dominantDifficulty({ easy: 0, medium: 0.3, hard: 0.7 }), 'hard');
});

test('bộ có tỉ lệ: đủ số câu, xếp dễ → khó, đúng tỉ lệ khi kỹ năng đủ ba bậc', () => {
  for (const skill of SKILLS) {
    const items = generateMathSet({ skills: [skill], count: 20, seed: `t:${skill}`, mix: { easy: 0.25, medium: 0.45, hard: 0.3 } });
    assert.equal(items.length, 20);
    assert.ok(isSortedByDifficulty(items, (i) => i.difficulty), `${skill}: bộ không xếp dễ → khó.`);
    assert.equal(items.filter((i) => i.difficulty === 'hard').length, 6, `${skill}: sai số câu khó.`);
    assert.equal(new Set(items.map((i) => i.id)).size, 20);
  }
});

test('kho theo kỹ năng: lượt đầu dễ, lượt cuối khó, câu trong lượt xếp dễ → khó', () => {
  for (const skill of SKILLS) {
    const n = roundsFor(skill);
    assert.equal(roundTier(skill, 0), 'easy', `${skill}: lượt đầu phải dễ.`);
    assert.equal(roundTier(skill, n - 1), 'hard', `${skill}: lượt cuối phải khó.`);
    for (let r = 0; r < n; r += 1) {
      const items = bankRoundItems(skill, r);
      assert.ok(isSortedByDifficulty(items, (i) => i.difficulty), `${skill} lượt ${r} chưa xếp.`);
      if (ROUND_MIX[roundTier(skill, r)].hard === 0) {
        assert.ok(items.every((i) => i.difficulty !== 'hard'), `${skill} lượt ${r} (dễ) lọt câu khó.`);
      }
    }
    const last = bankRoundItems(skill, n - 1);
    assert.ok(last.filter((i) => i.difficulty === 'hard').length >= last.length / 2, `${skill}: lượt khó có quá ít câu khó.`);
  }
});

test('mọi bộ đề của lộ trình có nhãn độ khó và câu xếp dễ → khó', () => {
  for (const set of ALL_SETS) {
    assert.ok(['easy', 'medium', 'hard'].includes(set.difficulty), set.id);
    const items = buildSetItems(set, 0);
    assert.equal(items.length, set.count, set.id);
    assert.ok(isSortedByDifficulty(items, (i) => i.difficulty), `${set.id} chưa xếp dễ → khó.`);
  }
  // Bộ làm quen không có câu khó; bộ thử thách đa số là câu khó.
  const warm = ALL_SETS.find((s) => s.id === 'linear_functions-warmup')!;
  assert.ok(buildSetItems(warm, 0).every((i) => i.difficulty !== 'hard'));
  const challenge = ALL_SETS.find((s) => s.id === 'linear_functions-challenge')!;
  assert.equal(challenge.difficulty, 'hard');
  assert.ok(buildSetItems(challenge, 0).filter((i) => i.difficulty === 'hard').length >= 12);
});
