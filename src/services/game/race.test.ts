import { test } from 'node:test';
import assert from 'node:assert/strict';

import { boostFor, createRace, resolveRaceAnswer, rivalRng, SLIP, FINISH } from './race';

const fixed = (v: number) => () => v;

test('đúng thì xe tăng tốc, combo tăng; sai thì trượt lùi và combo về 0', () => {
  let s = createRace();
  let step = resolveRaceAnswer(s, true, 1000, fixed(0));
  assert.equal(step.delta, boostFor(0));
  assert.equal(step.state.combo, 1);
  s = step.state;
  step = resolveRaceAnswer(s, true, 1000, fixed(0));
  assert.equal(step.delta, boostFor(1));
  s = step.state;
  step = resolveRaceAnswer(s, false, 0, fixed(0));
  assert.equal(step.delta, -SLIP);
  assert.equal(step.state.combo, 0);
  assert.equal(step.state.bestCombo, 2);
});

test('xe không lùi dưới vạch xuất phát', () => {
  const step = resolveRaceAnswer(createRace(), false, 0, fixed(0));
  assert.equal(step.state.me, 0);
});

test('đối thủ luôn chạy thêm 7–12 đoạn sau mỗi câu', () => {
  const rng = rivalRng('seed-a');
  const step = resolveRaceAnswer(createRace(), false, 0, rng);
  assert.ok(step.rivalDelta >= 7 && step.rivalDelta <= 12);
  assert.equal(step.state.rival, step.rivalDelta);
});

test('cùng hạt giống thì nhịp đối thủ giống hệt nhau', () => {
  const a = rivalRng('same');
  const b = rivalRng('same');
  for (let i = 0; i < 5; i += 1) assert.equal(a(), b());
});

test('về đích trước thì thắng ngay', () => {
  let s = { ...createRace(), me: FINISH - 5 };
  s = resolveRaceAnswer(s, true, 500, fixed(0)).state;
  assert.equal(s.status, 'won');
});

test('đối thủ về đích trước thì thua ngay', () => {
  const s = { ...createRace(), rival: FINISH - 2 };
  assert.equal(resolveRaceAnswer(s, false, 0, fixed(0)).state.status, 'lost');
});

test('hết câu: ai xa hơn thắng, bằng nhau thì thua', () => {
  let s = { ...createRace(3), q: 2, me: 30, rival: 20 };
  assert.equal(resolveRaceAnswer(s, true, 0, fixed(0)).state.status, 'won');
  s = { ...createRace(3), q: 2, me: 10, rival: 10 };
  assert.equal(resolveRaceAnswer(s, false, 0, fixed(0)).state.status, 'lost');
});

test('ván đã kết thúc thì không còn thay đổi', () => {
  const s = { ...createRace(), status: 'won' as const, me: 50 };
  const step = resolveRaceAnswer(s, true, 0, fixed(0));
  assert.equal(step.state, s);
  assert.equal(step.delta, 0);
});
