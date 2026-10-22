import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseAppEvent } from './app-event-rules';

const base = { visitor: 'abcdefgh1234', path: '/ielts-source-practice', name: 'start_lesson', utm: { utm_source: 'instagram', utm_campaign: 'writing-26-10' } };

test('nhận sự kiện hợp lệ và giữ utm', () => {
  const ev = parseAppEvent(base);
  assert.equal(ev?.name, 'start_lesson');
  assert.equal(ev?.utm.utm_source, 'instagram');
  assert.equal(ev?.utm.utm_content, null);
  assert.equal(ev?.signedIn, false);
});

test('bỏ tên sự kiện lạ, mã khách sai, đường dẫn không bắt đầu bằng /', () => {
  assert.equal(parseAppEvent({ ...base, name: 'purchase' }), null);
  assert.equal(parseAppEvent({ ...base, visitor: 'x' }), null);
  assert.equal(parseAppEvent({ ...base, path: 'ielts' }), null);
  assert.equal(parseAppEvent(null), null);
});

test('cắt utm quá dài và bỏ chuỗi rỗng', () => {
  const ev = parseAppEvent({ ...base, utm: { utm_campaign: 'x'.repeat(300), utm_source: '   ' } });
  assert.equal(ev?.utm.utm_campaign?.length, 100);
  assert.equal(ev?.utm.utm_source, null);
});
