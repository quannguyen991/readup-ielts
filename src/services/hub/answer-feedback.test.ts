import test from 'node:test';
import assert from 'node:assert/strict';

import { localAnalysis, validateFeedback } from './answer-feedback';

const GOOD =
  'Well, to be honest I really enjoyed my childhood because we lived in a small village and played outside every afternoon. ' +
  'For example, my cousins and I built tiny boats from leaves, however our parents sometimes worried about the river.';

test('phân tích tại máy: câu đủ dài, có từ nối thì được khen', () => {
  const r = localAnalysis({ transcript: GOOD, part: 1, fillers: 0, wpm: 130, ms: 15000 });
  assert.ok(r.words >= 30);
  assert.ok(r.connectors.includes('because') && r.connectors.includes('for example'));
  assert.ok(r.points.some((p) => p.tone === 'good'));
});

test('phân tích tại máy: câu quá ngắn bị nhắc, từ đệm được đếm', () => {
  const r = localAnalysis({ transcript: 'yes I like it', part: 3, fillers: 2, wpm: null, ms: 3000 });
  assert.ok(r.points.some((p) => p.tone === 'warn' && /ngắn/.test(p.textVi)));
  assert.ok(r.points.some((p) => /từ đệm/.test(p.textVi)));
});

test('phân tích tại máy: bắt được từ lặp nhiều lần', () => {
  const r = localAnalysis({ transcript: 'The park is nice and the park is big and I visit the park often because the park is quiet', part: 1, fillers: 0, wpm: null, ms: 1000 });
  assert.equal(r.repeated[0]?.word, 'park');
});

const FB = {
  band: 6.74,
  summaryVi: 'Bạn trả lời đúng ý và có lý do, cần thêm ví dụ cụ thể hơn.',
  criteria: ['fluency', 'vocabulary', 'grammar', 'coherence'].map((key) => ({ key, score: 6, noteVi: 'Khá ổn.' })),
  strengthsVi: ['Có lý do rõ ràng'],
  fixes: [
    { said: 'we lived in a small village', better: 'we grew up in a small village', whyVi: 'Cách nói tự nhiên hơn.' },
    { said: 'câu bịa không có trong bài', better: 'x', whyVi: 'y' },
  ],
  upgrades: [{ from: 'enjoyed', to: 'cherished', whyVi: 'Từ trang trọng hơn.' }],
  improved: 'To be honest, I cherished my childhood because we grew up in a small village.',
  nextVi: ['Thêm một ví dụ cụ thể'],
};

test('kiểm tra phiếu AI: làm tròn band, bỏ câu trích không có trong bài', () => {
  const f = validateFeedback(FB, GOOD);
  assert.equal(f.band, 6.5);
  assert.equal(f.fixes.length, 1);
  assert.equal(f.fixes[0]!.said, 'we lived in a small village');
  assert.equal(f.upgrades.length, 1);
});

test('kiểm tra phiếu AI: thiếu tiêu chí hoặc bản viết lại thì báo lỗi', () => {
  assert.throws(() => validateFeedback({ ...FB, criteria: FB.criteria.slice(0, 3) }, GOOD));
  assert.throws(() => validateFeedback({ ...FB, improved: '' }, GOOD));
});
