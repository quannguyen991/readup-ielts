import test from 'node:test';
import assert from 'node:assert/strict';

import { dueNow, parseTime, reminderIcs } from './reminder';

test('giờ nhắc: đọc đúng dạng HH:MM, từ chối giờ sai', () => {
  assert.equal(parseTime('20:30'), 1230);
  assert.equal(parseTime('7:05'), 425);
  assert.equal(parseTime('24:00'), null);
  assert.equal(parseTime('abc'), null);
});

test('chỉ nhắc một lần mỗi ngày, sau giờ hẹn, khi hôm nay chưa học', () => {
  const at = (h: number, m: number) => new Date(2026, 9, 1, h, m);
  assert.equal(dueNow(at(19, 59), '20:00', null, '2026-10-01', false), false);
  assert.equal(dueNow(at(20, 0), '20:00', null, '2026-10-01', false), true);
  assert.equal(dueNow(at(21, 0), '20:00', '2026-10-01', '2026-10-01', false), false);
  assert.equal(dueNow(at(21, 0), '20:00', '2026-09-30', '2026-10-01', true), false);
});

test('tệp lịch lặp mỗi ngày, có chuông, đúng giờ bắt đầu', () => {
  const ics = reminderIcs('06:45', 'https://readup.example', new Date(2026, 9, 1, 9, 0), 'abc');
  assert.match(ics, /DTSTART:20261001T064500/);
  assert.match(ics, /DTEND:20261001T070000/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.match(ics, /BEGIN:VALARM/);
  assert.ok(ics.includes('\r\n'));
});
