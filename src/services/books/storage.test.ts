import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendDownload,
  dayKey,
  downloadedBooks,
  downloadsOn,
  emptyLog,
  logPath,
  masterPath,
  parseLog,
  stampedPath,
  staleDays,
} from './storage';

test('đường dẫn trong kho', () => {
  assert.equal(masterPath('01-IELTS-Reading-Duong-toi-7.5.pdf'), 'masters/01-IELTS-Reading-Duong-toi-7.5.pdf');
  assert.equal(stampedPath('2026-09-11', 'u1', 'bilingual'), 'stamped/2026-09-11/u1/bilingual.pdf');
  assert.equal(logPath('u1'), 'log/u1.json');
  assert.equal(dayKey(new Date('2026-09-11T23:30:00.000Z')), '2026-09-11');
});

test('dọn thư mục: giữ hôm nay và hôm qua, bỏ ngày cũ hơn, bỏ qua tên lạ', () => {
  assert.deepEqual(
    staleDays(['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', 'rac', '2026-9-1'], '2026-09-11'),
    ['2026-09-08', '2026-09-09'],
  );
});

test('sang tháng mới vẫn tính đúng hôm qua', () => {
  assert.deepEqual(staleDays(['2026-08-30', '2026-08-31', '2026-09-01'], '2026-09-01'), ['2026-08-30']);
});

test('sổ tải hỏng, rỗng hay sai phiên bản thì coi như trống, không làm nổ', () => {
  assert.deepEqual(parseLog(null), emptyLog());
  assert.deepEqual(parseLog(''), emptyLog());
  assert.deepEqual(parseLog('{khong phai json'), emptyLog());
  assert.deepEqual(parseLog('null'), emptyLog());
  assert.deepEqual(parseLog(JSON.stringify({ v: 2, downloads: [] })), emptyLog());
});

test('dòng ghi hỏng trong sổ bị lọc, dòng lành giữ lại', () => {
  const raw = JSON.stringify({
    v: 1,
    downloads: [{ book: 'bilingual', at: '2026-09-11T01:00:00.000Z', paymentId: 'p1' }, { book: 3 }, null],
  });
  assert.equal(parseLog(raw).downloads.length, 1);
});

test('đếm lượt tải trong ngày, và danh sách sách đã tải không lặp', () => {
  let log = emptyLog();
  log = appendDownload(log, { book: 'bilingual', at: '2026-09-10T23:00:00.000Z', paymentId: 'p1' });
  log = appendDownload(log, { book: 'ielts-reading', at: '2026-09-11T01:00:00.000Z', paymentId: 'p1' });
  log = appendDownload(log, { book: 'bilingual', at: '2026-09-11T02:00:00.000Z', paymentId: 'p1' });
  assert.equal(downloadsOn(log, '2026-09-11'), 2);
  assert.deepEqual(downloadedBooks(log), ['bilingual', 'ielts-reading']);
});

test('sổ không phình mãi', () => {
  let log = emptyLog();
  for (let i = 0; i < 600; i += 1) {
    log = appendDownload(log, { book: 'bilingual', at: `2026-09-11T00:00:${String(i % 60).padStart(2, '0')}.000Z`, paymentId: 'p1' });
  }
  assert.equal(log.downloads.length, 500);
});
