import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isLaptopLike, showsHeroLogo } from './hero-star-policy';

const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID_TAB = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

test('laptop và máy bàn: có ngôi sao', () => {
  assert.equal(isLaptopLike({ width: 1440, finePointer: true, userAgent: WIN, touchPoints: 0 }), true);
  assert.equal(isLaptopLike({ width: 1280, finePointer: true, userAgent: MAC, touchPoints: 0 }), true);
  // Laptop Windows màn cảm ứng: con trỏ chính vẫn là bàn di.
  assert.equal(isLaptopLike({ width: 1366, finePointer: true, userAgent: WIN, touchPoints: 10 }), true);
});

test('điện thoại và máy tính bảng: bỏ ngôi sao', () => {
  assert.equal(isLaptopLike({ width: 390, finePointer: false, userAgent: IPHONE, touchPoints: 5 }), false);
  assert.equal(isLaptopLike({ width: 1280, finePointer: false, userAgent: ANDROID_TAB, touchPoints: 10 }), false);
  // iPad đời mới xưng "Macintosh" — kể cả khi gắn bàn di (con trỏ mịn), vẫn là máy tính bảng.
  assert.equal(isLaptopLike({ width: 1366, finePointer: true, userAgent: MAC, touchPoints: 5 }), false);
  assert.equal(isLaptopLike({ width: 1024, finePointer: false, userAgent: MAC, touchPoints: 5 }), false);
});

test('cửa sổ máy tính kéo quá hẹp: không nhồi ngôi sao cạnh chữ', () => {
  assert.equal(isLaptopLike({ width: 820, finePointer: true, userAgent: WIN, touchPoints: 0 }), false);
});

test('logo Band 9 3D: có trên máy tính bảng và máy tính, không có trên điện thoại', () => {
  assert.equal(showsHeroLogo({ width: 1366 }), true);
  assert.equal(showsHeroLogo({ width: 1024 }), true);
  assert.equal(showsHeroLogo({ width: 768 }), true);
  assert.equal(showsHeroLogo({ width: 390 }), false);
});
