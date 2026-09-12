import test from 'node:test';
import assert from 'node:assert/strict';

import { hasTrackers, trackerConfig, trackerNames } from './config';

test('chưa khai mã nào thì không có công cụ nào — và không hiện thông báo cookie', () => {
  const config = trackerConfig({});
  assert.deepEqual(config, { metaPixelId: null, ga4Id: null });
  assert.equal(hasTrackers(config), false);
  assert.deepEqual(trackerNames(config), []);
});

test('mã đúng định dạng thì bật, cắt khoảng trắng, GA4 viết hoa', () => {
  const config = trackerConfig({ metaPixelId: ' 1234567890123456 ', ga4Id: 'g-abc123xyz' });
  assert.equal(config.metaPixelId, '1234567890123456');
  assert.equal(config.ga4Id, 'G-ABC123XYZ');
  assert.deepEqual(trackerNames(config), ['Meta Pixel', 'Google Analytics']);
});

test('mã rác bị bỏ: không đặt cookie lên máy người dùng mà không đo được gì', () => {
  assert.equal(trackerConfig({ metaPixelId: 'pixel-cua-toi' }).metaPixelId, null);
  assert.equal(trackerConfig({ metaPixelId: '12345' }).metaPixelId, null);
  assert.equal(trackerConfig({ ga4Id: 'UA-12345-1' }).ga4Id, null, 'mã Universal Analytics đã ngừng');
});
