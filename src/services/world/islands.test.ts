import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { ENEMIES } from '@/services/game/rules';
import { buildIslands, islandPosition, nextMission, type WorldProgress } from './islands';

const empty: WorldProgress = { lessonDone: {}, stages: {}, dictationSets: new Set(), translationSets: new Set(), enemiesDefeated: 0 };

test('bản đồ mới: sáu đảo, đảo nào cũng có nhiệm vụ, chưa xong gì', () => {
  const islands = buildIslands(empty);
  assert.equal(islands.length, 6);
  for (const i of islands) {
    assert.ok(i.missions.length > 0, i.id);
    assert.equal(i.done, 0);
    assert.equal(new Set(i.missions.map((m) => m.id)).size, i.missions.length, `${i.id}: trùng id`);
  }
});

test('tiến độ lấy từ bài học thật: học xong một bài Toán thì đảo Toán nhích lên', () => {
  const skill = MATH_LESSONS[0]!.skill;
  const math = buildIslands({ ...empty, lessonDone: { [`math:${skill}`]: '2026-09-24' } })[0]!;
  assert.equal(math.done, 1);
  assert.ok(Math.abs(math.progress - 1 / MATH_LESSONS.length) < 1e-9);
  assert.equal(math.missions[0]!.done, true);
});

test('bộ từ tính là xong khi nhớ chắc từ 70% số từ', () => {
  const lesson = SAT_VOCAB_LESSONS[0]!;
  const stages = (n: number) => ({ [lesson.slug]: Object.fromEntries(lesson.words.slice(0, n).map((w) => [w.word, 2])) });
  const need = Math.ceil(lesson.words.length * 0.7);
  const vocab = (n: number) => buildIslands({ ...empty, stages: stages(n) })[2]!.missions[0]!.done;
  assert.equal(vocab(need - 1), false);
  assert.equal(vocab(need), true);
});

test('Đấu trường là bảy loài quái của game khi học: hạ tới đâu, xong tới đó', () => {
  const arena = (n: number) => buildIslands({ ...empty, enemiesDefeated: n }).find((i) => i.id === 'arena')!;
  assert.equal(arena(0).missions.length, ENEMIES.length);
  assert.equal(arena(3).done, 3);
  assert.equal(arena(ENEMIES.length + 2).done, ENEMIES.length, 'sang vòng hai thì đảo đã xong hết');
  assert.match(arena(0).missions.at(-1)!.title, /^Hạ Boss /);
  for (const m of arena(0).missions) assert.ok(m.href.startsWith('/') && !m.href.startsWith('/quest'), m.href);
});

test('nhiệm vụ tiếp theo nằm ở đảo dở nhất; xong hết thì không còn gì', () => {
  const skill = MATH_LESSONS[0]!.skill;
  const next = nextMission(buildIslands({ ...empty, lessonDone: { [`math:${skill}`]: 'x' } }));
  assert.ok(next);
  assert.notEqual(next.island.id, 'math', 'đảo Toán đã nhích, các đảo khác còn 0%');
  const all = buildIslands(empty).map((i) => ({ ...i, missions: i.missions.map((m) => ({ ...m, done: true })) }));
  assert.equal(nextMission(all), null);
});

test('vị trí đảo nằm trong khung, không đè lên nhau', () => {
  for (const aspect of [16 / 9, 0.5]) {
    const ps = Array.from({ length: 6 }, (_, i) => islandPosition(i, aspect));
    for (const p of ps) assert.ok(p.x > 0.05 && p.x < 0.95 && p.y > 0.08 && p.y < 0.95, JSON.stringify(p));
    for (let a = 0; a < 6; a += 1)
      for (let b = a + 1; b < 6; b += 1) assert.ok(Math.hypot(ps[a]!.x - ps[b]!.x, ps[a]!.y - ps[b]!.y) > 0.15);
  }
});
