import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BASE_PATIENCE_MS,
  coinFor,
  createCafe,
  FIRST_CUSTOMER_MS,
  isGoodShift,
  MAX_SEATS,
  MAX_STARS,
  patienceOf,
  SHIFT_MS,
  seatsOf,
  serveCafe,
  speedBonus,
  tickCafe,
  upgradeCafe,
  type CafeCustomer,
  type CafeEvent,
  type CafeState,
} from './cafe';

const STEP = 100;

/** Chạy đúng `ms` mili-giây bằng các nhịp `STEP`, gom mọi sự kiện. */
function run(s: CafeState, ms: number): { state: CafeState; events: CafeEvent[] } {
  let state = s;
  const events: CafeEvent[] = [];
  for (let t = 0; t < ms; t += STEP) {
    const r = tickCafe(state, Math.min(STEP, ms - t));
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

/** Chơi kín: mỗi nhịp phục vụ đúng khách đứng đầu hàng. Không bao giờ mất sao. */
function autoPlay(s: CafeState, ms: number): { state: CafeState; events: CafeEvent[] } {
  let state = s;
  const events: CafeEvent[] = [];
  for (let t = 0; t < ms && state.status === 'open'; t += STEP) {
    const r = tickCafe(state, Math.min(STEP, ms - t));
    state = r.state;
    events.push(...r.events);
    const front = state.queue[0];
    if (front) {
      const served = serveCafe(state, front.id, true);
      state = served.state;
      events.push(...served.events);
    }
  }
  return { state, events };
}

/** Đưa ca tới khi có đúng `n` khách trong hàng (khách đầu đến lúc 1,5 giây). */
function withCustomers(seed: string, n: number): CafeState {
  let s = createCafe(seed);
  while (s.queue.length < n && s.status === 'open') s = run(s, STEP).state;
  return s;
}

const customer = (id: number, age = 0, patience = BASE_PATIENCE_MS): CafeCustomer => ({ id, serial: id, age, patience });

test('phục vụ đúng cộng coin và tăng combo', () => {
  const s = withCustomers('dung', 1);
  const c = s.queue[0]!;
  const r = serveCafe(s, c.id, true);
  assert.equal(r.ok, true);
  assert.equal(r.state.served, 1);
  assert.equal(r.state.combo, 1);
  assert.equal(r.state.coins, r.coin);
  assert.equal(r.state.earned, r.coin);
  assert.ok(r.coin > 0, 'đúng thì có coin');
  assert.equal(r.state.queue.some((x) => x.id === c.id), false, 'khách đã phục vụ rời hàng');
  assert.equal(r.events[0]?.kind, 'served');
});

test('sai thì trừ sao, combo về 0, khách bỏ đi, không có coin', () => {
  const s = { ...withCustomers('sai', 1), combo: 5 };
  const c = s.queue[0]!;
  const bad = serveCafe(s, c.id, false);
  assert.equal(bad.ok, true);
  assert.equal(bad.coin, 0);
  assert.equal(bad.state.stars, MAX_STARS - 1);
  assert.equal(bad.state.combo, 0);
  assert.equal(bad.state.wrong, 1);
  assert.equal(bad.state.coins, 0);
  assert.equal(bad.state.queue.some((x) => x.id === c.id), false);
});

test('hết kiên nhẫn thì khách bỏ đi và trừ sao', () => {
  const s = { ...withCustomers('het-kien-nhan', 1), combo: 3 };
  const c = s.queue[0]!;
  const after = run(s, c.patience - c.age);
  assert.ok(after.events.some((e) => e.kind === 'abandon' && e.id === c.id), 'có sự kiện bỏ đi đúng khách');
  assert.equal(after.state.stars, MAX_STARS - 1);
  assert.equal(after.state.missed, 1);
  assert.equal(after.state.combo, 0);
  assert.equal(after.state.queue.some((x) => x.id === c.id), false);
});

test('combo từ 4 thì coin nhân 1,5, bánh ngọt cộng phẳng', () => {
  assert.equal(coinFor(3, 6, 0), 16, 'combo 3 chưa được nhân');
  assert.equal(coinFor(4, 6, 0), 24, 'combo 4 được nhân 1,5');
  assert.equal(coinFor(4, 6, 2), 30, 'bánh ngọt cấp 2 cộng 6, không nhân');
});

test('phục vụ càng nhanh càng được thưởng nhiều', () => {
  assert.equal(speedBonus(0, 12_000), 6);
  assert.equal(speedBonus(12_000, 12_000), 0);
  assert.ok(speedBonus(3_000, 12_000) > speedBonus(9_000, 12_000));
});

test('nâng cấp trừ đúng coin và không vượt cấp tối đa', () => {
  const a = upgradeCafe({ ...createCafe('nang-cap'), coins: 100 }, 'seat');
  assert.equal(a.block, null);
  assert.equal(a.state.coins, 70, 'cấp 1 giá 30');
  assert.equal(a.state.levels.seat, 1);
  const b = upgradeCafe(a.state, 'seat');
  assert.equal(b.block, null);
  assert.equal(b.state.coins, 10, 'cấp 2 giá 60');
  assert.equal(b.state.levels.seat, 2);
  const c = upgradeCafe(b.state, 'seat');
  assert.equal(c.block, 'max', 'ghế đã tối đa');
  assert.equal(c.state.coins, 10, 'bị chặn thì không trừ coin');
  assert.equal(c.state.levels.seat, 2);
});

test('nâng cấp thiếu coin thì bị chặn và giữ nguyên', () => {
  const s: CafeState = { ...createCafe('thieu-coin'), coins: 5 };
  const r = upgradeCafe(s, 'machine');
  assert.equal(r.block, 'coins');
  assert.equal(r.state.coins, 5);
  assert.equal(r.state.levels.machine, 0);
});

test('số ghế tăng theo cấp và dừng ở tối đa 5', () => {
  assert.equal(seatsOf(0), 3);
  assert.equal(seatsOf(2), MAX_SEATS);
  assert.equal(seatsOf(10), MAX_SEATS);
});

test('hàng đầy thì khách quay lưng đi, không mất sao', () => {
  const full = { ...createCafe('day-hang'), spawned: 3, queue: [customer(1, 0), customer(2, 0), customer(3, 0)], nextSpawnAt: 100 };
  const r = tickCafe(full, 200);
  assert.ok(r.events.some((e) => e.kind === 'turnaway'), 'khách thứ tư không có ghế');
  assert.equal(r.state.queue.length, 3);
  assert.equal(r.state.stars, MAX_STARS);
  assert.equal(r.state.turnedAway, 1);
});

test('ghế thêm cho khách thứ tư vào hàng', () => {
  const full = {
    ...createCafe('ghe-them'),
    spawned: 3,
    levels: { seat: 1, machine: 0, bakery: 0 },
    queue: [customer(1), customer(2), customer(3)],
    nextSpawnAt: 100,
  };
  const r = tickCafe(full, 200);
  assert.ok(r.events.some((e) => e.kind === 'arrive' && e.id === 4));
  assert.equal(r.state.queue.length, 4);
  assert.equal(r.state.turnedAway, 0);
});

test('máy pha nhanh kéo dài kiên nhẫn', () => {
  assert.equal(patienceOf(0), BASE_PATIENCE_MS);
  assert.ok(patienceOf(3) > patienceOf(0));
});

test('hết sao thì ca kết thúc sớm và không phục vụ được nữa', () => {
  const s = { ...withCustomers('het-sao', 1), stars: 1 };
  const c = s.queue[0]!;
  const r = serveCafe(s, c.id, false);
  assert.equal(r.state.stars, 0);
  assert.equal(r.state.status, 'done');
  assert.equal(r.state.endReason, 'stars');
  assert.ok(r.events.some((e) => e.kind === 'closed' && e.reason === 'stars'));
  assert.equal(isGoodShift(r.state), false);
  assert.equal(serveCafe(r.state, c.id, true).ok, false);
  assert.equal(upgradeCafe(r.state, 'seat').block, 'ended');
});

test('hết sao do khách bỏ đi cũng kết thúc ca', () => {
  const s = { ...withCustomers('sao-bo-di', 1), stars: 1 };
  const c = s.queue[0]!;
  const r = run(s, c.patience - c.age);
  assert.equal(r.state.status, 'done');
  assert.equal(r.state.endReason, 'stars');
});

test('hết 90 giây thì ca kết thúc theo thời gian', () => {
  const r = autoPlay(createCafe('het-gio'), SHIFT_MS);
  assert.equal(r.state.status, 'done');
  assert.equal(r.state.endReason, 'time');
  assert.equal(r.state.elapsed, SHIFT_MS);
  assert.equal(r.state.queue.length, 0);
  assert.equal(r.state.stars, MAX_STARS);
  assert.ok(r.events.some((e) => e.kind === 'closed' && e.reason === 'time'));
  assert.equal(tickCafe(r.state, 1000).events.length, 0, 'ca đã kết thúc thì không trôi nữa');
  assert.equal(isGoodShift(r.state), true, 'hết giờ còn đủ sao thì là ca tốt');
});

test('khách đầu đến đúng mốc và cách nhau khoảng 5 giây', () => {
  const r = autoPlay(createCafe('nhip'), SHIFT_MS);
  const times: number[] = [];
  let s = createCafe('nhip');
  for (let t = 0; t < SHIFT_MS; t += STEP) {
    const tick = tickCafe(s, STEP);
    s = tick.state;
    for (const e of tick.events) if (e.kind === 'arrive') times.push(s.elapsed);
    const front = s.queue[0];
    if (front) s = serveCafe(s, front.id, true).state;
  }
  assert.equal(times[0], FIRST_CUSTOMER_MS);
  for (let i = 1; i < times.length; i += 1) {
    const gap = times[i]! - times[i - 1]!;
    assert.ok(gap >= 4_100 && gap <= 5_900, `khoảng cách ${gap}ms`);
  }
  assert.ok(times.length >= 16 && times.length <= 19, `khoảng 18 khách trong ca, được ${times.length}`);
  assert.equal(r.state.served, times.length);
});

test('cùng seed cho cùng chuỗi khách, khác seed cho chuỗi khác', () => {
  const trace = (seed: string) =>
    autoPlay(createCafe(seed), SHIFT_MS).events.map((e) => `${e.kind}:${'id' in e ? e.id : ''}`).join('|');
  const arrivals = (seed: string) => {
    const out: number[] = [];
    let s = createCafe(seed);
    for (let t = 0; t < SHIFT_MS; t += STEP) {
      const r = tickCafe(s, STEP);
      s = r.state;
      for (const e of r.events) if (e.kind === 'arrive') out.push(s.elapsed);
      if (s.queue[0]) s = serveCafe(s, s.queue[0].id, true).state;
    }
    return out;
  };
  assert.equal(trace('seed-A'), trace('seed-A'));
  assert.notEqual(trace('seed-A'), trace('seed-B'));
  assert.deepEqual(arrivals('seed-A'), arrivals('seed-A'));
  assert.notDeepEqual(arrivals('seed-A'), arrivals('seed-B'));
});

test('phục vụ hai lần cho cùng khách chỉ có hiệu lực lần đầu', () => {
  const s = withCustomers('mot-lan', 1);
  const c = s.queue[0]!;
  const first = serveCafe(s, c.id, true);
  const second = serveCafe(first.state, c.id, true);
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.state.served, 1);
  assert.equal(second.state.coins, first.coin);
});
