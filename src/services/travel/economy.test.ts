import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  TRAVEL_ECONOMY,
  coinsOf,
  customsPassed,
  earnTicketFromCustoms,
  earnTicketsFromReview,
  emptyCaps,
  exchangeStarsForTicket,
  ledgerAdd,
  mergeCaps,
  mergeLedgers,
  rolloverCaps,
  spendCoins,
  spendTickets,
  ticketsOf,
  type EconState,
} from './economy';

const fresh = (day = '2026-10-02'): EconState => ({ ledger: {}, dailyCaps: emptyCaps(day) });

test('sổ cái: ghi một mã hai lần chỉ tính một lần', () => {
  let l = ledgerAdd({}, 'tk:a', 1);
  l = ledgerAdd(l, 'tk:a', 1);
  l = ledgerAdd(l, 'tk:a', 5);
  assert.equal(ticketsOf(l), 1);
  assert.equal(coinsOf(ledgerAdd(l, 'co:x', 7)), 7);
});

test('sổ cái: khoản bằng 0 hoặc NaN không được ghi', () => {
  assert.deepEqual(ledgerAdd({}, 'tk:z', 0), {});
  assert.deepEqual(ledgerAdd({}, 'tk:z', Number.NaN), {});
});

test('vé và xu tách theo tiền tố và không âm', () => {
  const l = { 'tk:a': 2, 'co:a': 10, 'tk:fly:1': -3 };
  assert.equal(ticketsOf(l), 0);
  assert.equal(coinsOf(l), 10);
});

test('hải quan: 4/5 đúng được 1 vé, 3/5 thì không', () => {
  assert.equal(customsPassed(4, 5), true);
  assert.equal(customsPassed(5, 5), true);
  assert.equal(customsPassed(3, 5), false);
  const pass = earnTicketFromCustoms(fresh(), 4, 5, '2026-10-02');
  assert.equal(pass.tickets, 1);
  assert.equal(ticketsOf(pass.ledger), 1);
  const fail = earnTicketFromCustoms(fresh(), 2, 5, '2026-10-02');
  assert.equal(fail.tickets, 0);
  assert.equal(fail.reason, 'fail');
  assert.equal(fail.dailyCaps.custom, 1, 'lượt trượt vẫn tính vào hạn mức');
});

test('hải quan: tối đa 6 lượt mỗi ngày, sang ngày mới đếm lại', () => {
  let s = fresh();
  let tickets = 0;
  for (let i = 0; i < 6; i += 1) {
    const r = earnTicketFromCustoms(s, 5, 5, '2026-10-02');
    s = { ledger: r.ledger, dailyCaps: r.dailyCaps };
    tickets += r.tickets;
  }
  assert.equal(tickets, 6);
  const over = earnTicketFromCustoms(s, 5, 5, '2026-10-02');
  assert.equal(over.ok, false);
  assert.equal(over.reason, 'cap');
  assert.equal(ticketsOf(over.ledger), 6);
  const next = earnTicketFromCustoms(s, 5, 5, '2026-10-03');
  assert.equal(next.tickets, 1);
});

test('hải quan: hai máy cùng làm lượt 1 trong một ngày chỉ ra một vé sau khi gộp', () => {
  const a = earnTicketFromCustoms(fresh(), 5, 5, '2026-10-02');
  const b = earnTicketFromCustoms(fresh(), 5, 5, '2026-10-02');
  assert.equal(ticketsOf(mergeLedgers(a.ledger, b.ledger)), 1);
});

test('ôn tập: 10 từ một vé, tối đa 3 vé/ngày, từ lẻ được dồn', () => {
  let s = fresh();
  let r = earnTicketsFromReview(s, 6, '2026-10-02');
  assert.equal(r.tickets, 0);
  s = { ledger: r.ledger, dailyCaps: r.dailyCaps };
  r = earnTicketsFromReview(s, 5, '2026-10-02');
  assert.equal(r.tickets, 1, '6 + 5 = 11 từ');
  s = { ledger: r.ledger, dailyCaps: r.dailyCaps };
  r = earnTicketsFromReview(s, 100, '2026-10-02');
  assert.equal(r.tickets, 2, 'chạm trần 3 vé');
  s = { ledger: r.ledger, dailyCaps: r.dailyCaps };
  assert.equal(ticketsOf(s.ledger), 3);
  r = earnTicketsFromReview(s, 50, '2026-10-02');
  assert.equal(r.tickets, 0);
  assert.equal(r.reason, 'cap');
  assert.equal(ticketsOf(r.ledger), 3);
});

test('ôn tập: n = 0 không làm gì', () => {
  const r = earnTicketsFromReview(fresh(), 0, '2026-10-02');
  assert.equal(r.ok, false);
  assert.equal(r.tickets, 0);
});

test('đổi sao: 150 sao một vé, tối đa 3 vé/ngày, thiếu sao thì từ chối', () => {
  const poor = exchangeStarsForTicket(fresh(), 149, '2026-10-02');
  assert.equal(poor.ok, false);
  assert.equal(poor.reason, 'not-enough-stars');
  assert.equal(poor.starsSpent, 0);
  let s = fresh();
  let spent = 0;
  for (let i = 0; i < 3; i += 1) {
    const r = exchangeStarsForTicket(s, 1000, '2026-10-02');
    assert.equal(r.ok, true);
    spent += r.starsSpent;
    s = { ledger: r.ledger, dailyCaps: r.dailyCaps };
  }
  assert.equal(spent, 450);
  assert.equal(ticketsOf(s.ledger), 3);
  const over = exchangeStarsForTicket(s, 1000, '2026-10-02');
  assert.equal(over.ok, false);
  assert.equal(over.reason, 'cap');
});

test('chi vé: không cho chi vượt số đang có, chi hai lần cùng mã chỉ trừ một lần', () => {
  const l = ledgerAdd({}, 'tk:welcome', 2);
  assert.equal(spendTickets(l, 'fly:a', 3).ok, false);
  const one = spendTickets(l, 'fly:a', 1);
  assert.equal(one.ok, true);
  assert.equal(ticketsOf(one.ledger), 1);
  const again = spendTickets(one.ledger, 'fly:a', 1);
  assert.equal(ticketsOf(again.ledger), 1, 'mã trùng không trừ thêm');
  assert.equal(spendCoins({}, 'buy:x', 5).ok, false);
});

test('rollover và gộp hạn mức ngày', () => {
  const c = { day: '2026-10-02', custom: 2, review: 1, stars: 0, reviewWords: 14 };
  assert.deepEqual(rolloverCaps(c, '2026-10-03'), emptyCaps('2026-10-03'));
  assert.equal(rolloverCaps(c, '2026-10-02'), c);
  const m = mergeCaps(c, { day: '2026-10-02', custom: 1, review: 3, stars: 1, reviewWords: 5 });
  assert.deepEqual(m, { day: '2026-10-02', custom: 2, review: 3, stars: 1, reviewWords: 14 });
  assert.equal(mergeCaps(c, { day: '2026-10-04', custom: 0, review: 0, stars: 0 })?.day, '2026-10-04');
});

test('hằng số kinh tế khớp kế hoạch', () => {
  assert.equal(TRAVEL_ECONOMY.customs.runsPerDay, 6);
  assert.equal(TRAVEL_ECONOMY.review.ticketsPerDay, 3);
  assert.equal(TRAVEL_ECONOMY.stars.starsPerTicket, 150);
  assert.equal(TRAVEL_ECONOMY.stars.ticketsPerDay, 3);
  assert.equal(TRAVEL_ECONOMY.welcomeTickets, 2);
});
