import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseHapticsSetting } from './setting';

test('mặc định bật, chỉ "off" mới tắt', () => {
  assert.equal(parseHapticsSetting(null), true);
  assert.equal(parseHapticsSetting(undefined), true);
  assert.equal(parseHapticsSetting('on'), true);
  assert.equal(parseHapticsSetting('off'), false);
});
