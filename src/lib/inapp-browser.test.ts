import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isInstagramBrowser } from './inapp-browser';

test('nhận ra trình duyệt trong Instagram trên iOS và Android', () => {
  assert.equal(isInstagramBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148 Instagram 320.0.0.30.109'), true);
  assert.equal(isInstagramBrowser('Mozilla/5.0 (Linux; Android 14) Chrome/124.0 Mobile Safari/537.36 Instagram 300.0.0.0'), true);
});

test('trình duyệt thường không bị coi là Instagram', () => {
  assert.equal(isInstagramBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Version/17.5 Mobile/15E148 Safari/604.1'), false);
  assert.equal(isInstagramBrowser(''), false);
});
