import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifyUserAgent, isBot, normalizePath, referrerHost, summarizeTraffic, type PageViewRow } from './traffic';

const UA = {
  iphoneZalo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/24.07 ZaloTheme/light',
  androidFb: 'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  androidMessenger: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/127.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/460.0;]',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  winCocCoc: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/137.0 Chrome/131.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  androidTablet: 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
};

test('nhận đúng thiết bị, hệ điều hành và trình duyệt nhúng trong Zalo / Facebook', () => {
  assert.deepEqual(classifyUserAgent(UA.iphoneZalo), { device: 'mobile', os: 'iOS', browser: 'Zalo' });
  assert.deepEqual(classifyUserAgent(UA.androidFb), { device: 'mobile', os: 'Android', browser: 'Facebook' });
  assert.equal(classifyUserAgent(UA.androidMessenger).browser, 'Messenger');
  assert.deepEqual(classifyUserAgent(UA.winChrome), { device: 'desktop', os: 'Windows', browser: 'Chrome' });
  assert.equal(classifyUserAgent(UA.winCocCoc).browser, 'Cốc Cốc');
  assert.deepEqual(classifyUserAgent(UA.macSafari), { device: 'desktop', os: 'macOS', browser: 'Safari' });
  assert.equal(classifyUserAgent(UA.androidTablet).device, 'tablet');
  // iPad mới gửi UA của Mac: màn hẹp thì không tính là máy tính.
  assert.equal(classifyUserAgent(UA.macSafari, 768).device, 'tablet');
});

test('bot và trình duyệt không đầu không được đếm', () => {
  assert.ok(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'));
  assert.ok(isBot('facebookexternalhit/1.1'));
  assert.ok(isBot('Mozilla/5.0 HeadlessChrome/140.0'));
  assert.ok(!isBot(UA.iphoneZalo));
});

test('gom đường dẫn theo loại trang, chỉ giữ tên miền nguồn vào', () => {
  assert.equal(normalizePath('/read/6236d338-e05d-4142-9e2b-721c5c72d7ea?x=1'), '/read/:id');
  assert.equal(normalizePath('/sat-rw/mix/satrw-mix-01'), '/sat-rw/mix/satrw-mix-01');
  assert.equal(referrerHost('https://m.facebook.com/groups/123/posts/456'), 'facebook.com');
  assert.equal(referrerHost('https://readup-ielts.vercel.app/plan', 'readup-ielts.vercel.app'), null);
  assert.equal(referrerHost('không phải url'), null);
});

test('tổng hợp: người khác nhau đếm theo mã khách, ngày chốt theo giờ Việt Nam', () => {
  const row = (at: string, visitor: string, extra: Partial<PageViewRow> = {}): PageViewRow => ({
    at, visitor, session: visitor + '-s', path: '/', device: 'mobile', os: 'iOS', browser: 'Zalo', referrer: null, country: 'VN', signed_in: false, ...extra,
  });
  const now = new Date('2026-09-26T10:00:00Z'); // 17:00 giờ VN
  const rows = [
    row('2026-09-26T09:00:00Z', 'aaaaaaaa'),
    row('2026-09-26T09:05:00Z', 'aaaaaaaa', { path: '/plan' }),
    row('2026-09-26T08:00:00Z', 'bbbbbbbb', { device: 'desktop', os: 'Windows', browser: 'Chrome', referrer: 'facebook.com' }),
    row('2026-09-25T18:30:00Z', 'cccccccc'), // 01:30 sáng 26/09 giờ VN → vẫn là hôm nay
    row('2026-09-10T08:00:00Z', 'dddddddd'), // ngoài 7 ngày
  ];
  const s = summarizeTraffic(rows, now, 7);
  assert.equal(s.visitors, 3);
  assert.equal(s.views, 4);
  assert.deepEqual(s.today, { visitors: 3, views: 4 });
  assert.equal(s.daily.length, 7);
  assert.equal(s.daily[6]!.day, '2026-09-26');
  assert.deepEqual(s.devices, [['mobile', 2], ['desktop', 1]]);
  assert.deepEqual(s.referrers, [['facebook.com', 1]]);
  assert.equal(s.pages[0]![0], '/');
});
