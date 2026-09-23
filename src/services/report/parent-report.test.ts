import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildParentReport, vnDateKey } from './parent-report';
import { signUser, verifyToken } from './link-server';

const NOW = Date.parse('2026-09-23T05:00:00Z'); // 12:00 giờ VN
const ago = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

test('khoá ngày theo giờ Việt Nam', () => {
  // 23:30 UTC ngày 22 = 06:30 sáng ngày 23 giờ VN.
  assert.equal(vnDateKey(Date.parse('2026-09-22T23:30:00Z')), '2026-09-23');
});

test('báo cáo: phút học, chuỗi ngày, độ chính xác tuần này/tuần trước, lỗi hay mắc', () => {
  const daily: Record<string, { minutes: number; questions: number }> = {};
  for (let i = 0; i < 4; i += 1) daily[vnDateKey(NOW - i * 86_400_000)] = { minutes: 30, questions: 20 };
  daily[vnDateKey(NOW - 9 * 86_400_000)] = { minutes: 15, questions: 5 };
  const r = buildParentReport(
    {
      study: { daily },
      math: {
        sessions: [
          {
            finishedAt: ago(1),
            attempts: [
              { domain: 'algebra', isCorrect: true, errorTag: null },
              { domain: 'algebra', isCorrect: false, errorTag: 'sign_flip' },
              { domain: 'algebra', isCorrect: false, errorTag: 'sign_flip' },
              { domain: 'geometry_trig', isCorrect: true, errorTag: null },
            ],
          },
          { finishedAt: ago(8), attempts: [{ domain: 'algebra', isCorrect: false, errorTag: 'off_by_one' }] },
        ],
      },
      vocab: { entries: { a: { createdAt: ago(2) }, b: { createdAt: ago(20) } }, reviewLog: [{ reviewedAt: ago(1) }, { reviewedAt: ago(10) }] },
      satrw: { attempts: { q1: { correct: true, at: ago(1) }, q2: { correct: false, at: ago(8) } } },
      weekly: { results: { w2026_39: { score: 7, total: 10, ms: 600_000, at: ago(1) } } },
    },
    NOW,
    'w2026_39',
  );
  assert.equal(r.days.length, 7);
  assert.equal(r.days[6]!.date, '2026-09-23');
  assert.equal(r.minutes7, 120);
  assert.equal(r.minutesPrev7, 15);
  assert.equal(r.activeDays7, 4);
  assert.equal(r.streak, 4);
  assert.equal(r.math.questions7, 4);
  assert.equal(r.math.accuracy7, 0.5);
  assert.equal(r.math.accuracyPrev7, 0);
  assert.equal(r.topErrors[0]!.title, 'Sai dấu');
  assert.equal(r.topErrors[0]!.count, 2);
  assert.equal(r.verbal.accuracy7, 1);
  assert.deepEqual(r.vocab, { saved: 2, saved7: 1, reviews7: 1 });
  assert.deepEqual(r.weekly, { score: 7, total: 10, ms: 600_000 });
});

test('báo cáo rỗng khi chưa có dữ liệu', () => {
  const r = buildParentReport({}, NOW);
  assert.equal(r.minutes7, 0);
  assert.equal(r.math.accuracy7, null);
  assert.equal(r.math.range, null);
  assert.equal(r.weekly, null);
});

test('đường dẫn ký HMAC: đúng thì mở được, sửa userId hoặc chữ ký thì không', () => {
  const key = 'bí-mật-thử';
  const id = '6f1c2a9e-1b2c-4d5e-8f90-0a1b2c3d4e5f';
  const token = signUser(id, key);
  assert.equal(verifyToken(token, key), id);
  assert.equal(verifyToken(token.replace('6f1c', '7f1c'), key), null, 'đổi userId là sai chữ ký');
  assert.equal(verifyToken(`${id}.AAAAAAAAAAAAAAAAAAAAAAAA`, key), null);
  assert.equal(verifyToken(token, 'khoá-khác'), null);
  assert.equal(verifyToken('rác', key), null);
});
