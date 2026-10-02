import assert from 'node:assert/strict';
import { test } from 'node:test';

import { awardPractice } from './passport';
import { MISSION_CAPS, allMissions, claimMission, claimableCount, dayOfIso, missionsFor, progressOf, statusOf, weekDays, weekKey, type Mission, type MissionCtx } from './missions';
import { coinsOf, emptyCaps, ticketsOf, type Ledger } from './economy';
import { mainPoisOfCity } from '@/data/travel/pois';
import { CITY_ORDER } from './world';
import type { PoiProgress } from './types';

const DAY = '2026-10-07'; // thứ Tư
const iso = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12).toISOString();
};
const prog = (day: string, best: 0 | 1 | 2 | 3 = 2): PoiProgress => ({ best, runs: 1, level: 1, lastAt: iso(day) });
const ctx = (over: Partial<MissionCtx> = {}): MissionCtx => ({ ledger: {}, poi: {}, souvenirs: {}, dailyCaps: emptyCaps(DAY), day: DAY, ...over });
const mission = (id: string, city: Parameters<typeof missionsFor>[0] = 'hanoi'): Mission => missionsFor(city).find((m) => m.id === id)!;

test('khoá ngày/tuần: tuần bắt đầu thứ Hai, ISO địa phương', () => {
  assert.equal(weekKey('2026-10-07'), '2026-10-05');
  assert.equal(weekKey('2026-10-04'), '2026-09-28'); // Chủ nhật thuộc tuần trước
  assert.deepEqual(weekDays('2026-10-07')[0], '2026-10-05');
  assert.equal(weekDays('2026-10-07').length, 7);
  assert.equal(dayOfIso(iso(DAY)), DAY);
});

test('đếm tiến độ: câu đúng, địa điểm, sao trong ngày; hạn mức ôn từ', () => {
  const ledger = awardPractice({}, DAY, 7);
  const c = ctx({
    ledger,
    poi: { 'hanoi-pho': prog(DAY, 2), 'hanoi-eggcoffee': prog(DAY, 1), 'hanoi-vanmieu': prog('2026-10-06', 3) },
    dailyCaps: { ...emptyCaps(DAY), reviewWords: 6 },
  });
  assert.equal(progressOf(mission('d-answer10'), c), 7);
  assert.equal(progressOf(mission('d-visit2'), c), 2);
  assert.equal(progressOf(mission('d-star2'), c), 1);
  assert.equal(progressOf(mission('d-review10'), c), 6);
  assert.equal(progressOf(mission('w-visit8'), c), 3, 'cả tuần: hôm qua cũng tính');
  assert.equal(progressOf(mission('d-review10'), ctx({ dailyCaps: { ...emptyCaps('2026-10-06'), reviewWords: 9 } })), 0, 'sang ngày mới thì đếm lại');
});

test('nhận thưởng idempotent: gọi hai lần chỉ cộng một lần, hai máy gộp sổ cái cũng vậy', () => {
  const m = mission('d-visit2');
  const base = ctx({ poi: { 'hanoi-pho': prog(DAY), 'hanoi-eggcoffee': prog(DAY) } });
  const a = claimMission(m, base);
  assert.equal(a.ok, true);
  assert.equal(ticketsOf(a.ledger), 1);
  assert.equal(coinsOf(a.ledger), 10);
  const again = claimMission(m, { ...base, ledger: a.ledger });
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'claimed');
  assert.equal(ticketsOf(again.ledger), 1);
  const b = claimMission(m, base);
  const merged: Ledger = { ...a.ledger, ...b.ledger };
  assert.equal(ticketsOf(merged), 1);
  assert.equal(claimMission(m, ctx({})).reason, 'not-done');
});

test('trần vé: tối đa 2 vé/ngày từ nhiệm vụ ngày, 4 vé/tuần từ nhiệm vụ tuần; sang ngày/tuần mới nhận lại', () => {
  const daily = missionsFor(null).filter((m) => m.scope === 'daily');
  assert.equal(daily.reduce((n, m) => n + m.reward.tickets, 0), MISSION_CAPS.dailyTickets, 'tổng vé ngày đúng bằng trần');
  const weekly = missionsFor(null).filter((m) => m.scope === 'weekly');
  assert.equal(weekly.reduce((n, m) => n + m.reward.tickets, 0), MISSION_CAPS.weeklyTickets, 'tổng vé tuần đúng bằng trần');
  // đã nhận 2 vé cùng ngày (khoản cùng tiền tố): nhiệm vụ 1 vé bị chặn
  const full: Ledger = { [`tk:mi:d-other:${DAY}`]: 2 };
  const done = ctx({ ledger: awardPractice(full, DAY, 10) });
  const st = statusOf(mission('d-answer10'), done);
  assert.equal(st.done, true);
  assert.equal(st.capped, true);
  assert.equal(st.claimable, false);
  assert.equal(claimMission(mission('d-answer10'), done).reason, 'cap');
  const tomorrow = ctx({ day: '2026-10-08', ledger: awardPractice(full, '2026-10-08', 10) });
  assert.equal(statusOf(mission('d-answer10'), tomorrow).claimable, true);
  // tuần
  const wl: Ledger = { [`tk:mi:w-other:${weekKey(DAY)}`]: 4 };
  const wmis = mission('w-days4');
  let led: Ledger = wl;
  for (const d of weekDays(DAY).slice(0, 4)) led = awardPractice(led, d, 1);
  assert.equal(statusOf(wmis, ctx({ ledger: led })).capped, true);
  let led2: Ledger = wl;
  for (const d of weekDays('2026-10-14').slice(0, 4)) led2 = awardPractice(led2, d, 1);
  assert.equal(statusOf(wmis, ctx({ ledger: led2, day: '2026-10-14' })).claimable, true);
});

test('nhiệm vụ thành phố: một lần mỗi thành phố; quán ăn, quà, 3 sao, năm nơi', () => {
  const main = mainPoisOfCity('hanoi');
  const poi = Object.fromEntries(main.map((p) => [p.id, prog('2026-09-01', 3)]));
  const souvenirs = Object.fromEntries(main.flatMap((p) => (p.reward.souvenir ? [[p.reward.souvenir, true as const]] : [])));
  const c = ctx({ poi, souvenirs });
  for (const id of ['c-food-hanoi', 'c-souvenir-hanoi', 'c-star3-hanoi', 'c-five-hanoi']) {
    const m = missionsFor('hanoi').find((x) => x.id === id)!;
    assert.ok(m, id);
    assert.equal(statusOf(m, c).done, true, id);
    const r = claimMission(m, c);
    assert.equal(r.ok, true, id);
    assert.equal(claimMission(m, { ...c, ledger: r.ledger, day: '2027-01-01' }).reason, 'claimed', 'kỳ của nhiệm vụ thành phố là vĩnh viễn');
  }
  assert.equal(statusOf(missionsFor('hanoi').find((x) => x.id === 'c-food-hanoi')!, ctx()).done, false);
});

test('chuỗi ngày + chấm đỏ: claimableCount đếm đúng và giảm sau khi nhận', () => {
  let ledger: Ledger = {};
  for (const d of ['2026-10-05', '2026-10-06', '2026-10-07']) ledger = awardPractice(ledger, d, 10);
  const c = ctx({ ledger });
  const s3 = missionsFor(null).find((m) => m.id === 's-3')!;
  assert.equal(statusOf(s3, c).done, true);
  const before = claimableCount('hanoi', c);
  assert.ok(before >= 2);
  const r = claimMission(s3, c);
  assert.equal(claimableCount('hanoi', { ...c, ledger: r.ledger }), before - 1);
});

test('tổng vé nhiệm vụ trọn đời có trần: thành phố ≤ 2 vé, chuỗi ≤ 3 vé', () => {
  for (const city of CITY_ORDER) {
    const t = missionsFor(city)
      .filter((m) => m.scope === 'city')
      .reduce((n, m) => n + m.reward.tickets, 0);
    assert.ok(t <= 2, `${city}: ${t}`);
  }
  assert.ok(allMissions(CITY_ORDER).filter((m) => m.scope === 'streak').reduce((n, m) => n + m.reward.tickets, 0) <= 3);
});
