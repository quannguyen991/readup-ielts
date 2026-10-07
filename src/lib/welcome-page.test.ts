import assert from 'node:assert/strict';
import test from 'node:test';

import { entryPath } from './welcome-page';
import { isImmersiveRoute } from '../navigation/focus-routes';

test('lần đầu mở link vào trang giới thiệu, đã xem thì vào thẳng app', () => {
  assert.equal(entryPath(false), '/gioi-thieu');
  assert.equal(entryPath(true), '/intro');
});

test('trang giới thiệu toàn màn hình (không thanh bên), trang chủ app thì không', () => {
  assert.equal(isImmersiveRoute('/gioi-thieu'), true);
  assert.equal(isImmersiveRoute('/intro'), false);
});
