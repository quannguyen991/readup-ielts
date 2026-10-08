import assert from 'node:assert/strict';
import test from 'node:test';

import { CAMPUS_LEGEND, STUDY_CAMPUSES } from './study-abroad-campus';

test('every campus map is a 20x9 grid of known tiles', () => {
  for (const campus of STUDY_CAMPUSES) {
    assert.equal(campus.map.length, 9, `${campus.id} rows`);
    for (const row of campus.map) assert.equal(row.length, 20, `${campus.id} row width`);
    for (const tile of campus.map.join('')) {
      assert.ok(tile in CAMPUS_LEGEND || /[1-4]/.test(tile), `${campus.id} unknown tile ${tile}`);
    }
  }
});

test('each campus has four classrooms, each door shown once on the map', () => {
  for (const campus of STUDY_CAMPUSES) {
    assert.deepEqual(campus.rooms.map((room) => room.door).sort(), ['1', '2', '3', '4'], `${campus.id} doors`);
    const cells = campus.map.join('');
    for (const room of campus.rooms) {
      assert.equal(cells.split(room.door).length - 1, 1, `${campus.id} door ${room.door}`);
    }
  }
});

test('campus ids are unique and each chapter has exactly one campus', () => {
  const ids = STUDY_CAMPUSES.map((campus) => campus.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const chapter of [1, 2, 3, 4, 5] as const) {
    assert.equal(STUDY_CAMPUSES.filter((campus) => campus.chapter === chapter).length, 1, `chapter ${chapter}`);
  }
});
