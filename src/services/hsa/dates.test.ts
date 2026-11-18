import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shiftDay } from './dates';

test('shiftDay qua cuối tháng và cuối năm', () => {
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2026-11-15', 60), '2027-01-14');
});
