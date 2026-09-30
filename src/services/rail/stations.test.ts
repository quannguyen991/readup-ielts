import test from 'node:test';
import assert from 'node:assert/strict';

import { localClock, nextOnRoute, ROUTES, routeOf, STATIONS, stationById, timeOfDayAt } from './stations';

test('mọi ga thuộc đúng một tuyến, mọi ga trên tuyến đều có thật', () => {
  const seen = new Set<string>();
  for (const r of ROUTES)
    for (const id of r.stops) {
      assert.ok(STATIONS.some((s) => s.id === id), `${id} không có trong STATIONS`);
      assert.ok(!seen.has(id), `${id} nằm ở hai tuyến`);
      seen.add(id);
    }
  assert.equal(seen.size, STATIONS.length);
});

test('đi hết tuyến thì vòng về ga đầu', () => {
  const vn = ROUTES[0]!;
  assert.equal(nextOnRoute(vn, vn.stops[vn.stops.length - 1]!).id, vn.stops[0]);
  assert.equal(nextOnRoute(vn, vn.stops[0]!, -1).id, vn.stops[vn.stops.length - 1]);
  assert.equal(routeOf('paris').id, 'europe');
});

test('giờ địa phương theo múi giờ ga; buổi theo giờ', () => {
  const t = new Date('2026-09-30T12:00:00Z');
  assert.deepEqual(localClock(stationById('hanoi').tz, t), { h: 19, m: 0 });
  assert.deepEqual(localClock(stationById('tokyo').tz, t), { h: 21, m: 0 });
  assert.equal(timeOfDayAt(10), 'day');
  assert.equal(timeOfDayAt(17), 'sunset');
  assert.equal(timeOfDayAt(23), 'night');
});
