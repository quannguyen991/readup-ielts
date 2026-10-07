import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampBand, clarityBand, fluencyCap, ieltsRound, normalizeForQuote, overallBand, pronunciationBand, validateGrade, volumeCap } from './grade';
import type { AttemptMetrics } from './metrics';

const METRICS: AttemptMetrics = {
  answers: 2,
  words: 180,
  avgWords: 90,
  wpm: 120,
  fillers: 3,
  fillersPer100: 1.7,
  longPauses: 1,
  lexicalVariety: 0.7,
  repeated: [],
  shortAnswers: 0,
  avgConfidence: 0.9,
  lowConfShare: 0.05,
};

const TRANSCRIPTS = [
  'I live in a small apartment with my family and I really enjoy it because it is near my school',
  'I think the most interesting part is chemistry because we do many experiment in the lab',
];

const RAW = {
  criteria: {
    fc: { band: 6.5, explanationVi: 'Nói khá dài.', fixes: ['Thêm ví dụ.'] },
    lr: { band: '6', explanationVi: 'Từ vựng đủ dùng.', fixes: [] },
    gr: { band: 6.3, explanationVi: 'Còn lỗi số nhiều.', fixes: ['Soát danh từ số nhiều.'] },
    pr: { band: 9, explanationVi: 'Ước lượng.', fixes: [] },
  },
  summaryVi: 'Bạn nói được ý nhưng còn ngắn.',
  strengths: ['Trả lời đúng trọng tâm', 'Có lý do', 'Tự nhiên', 'thừa'],
  fixes: [
    { questionIndex: 1, quote: 'we do many experiment', problemVi: 'Thiếu số nhiều.', better: 'we do a lot of experiments' },
    { questionIndex: 0, quote: 'this sentence was never said', problemVi: 'Bịa.', better: 'x' },
    { questionIndex: 0, quote: 'I REALLY enjoy it!', problemVi: 'Nhạt.', better: 'I absolutely love it' },
  ],
  samples: [
    { questionIndex: 0, improved: 'I live in a cosy flat with my parents, just a short walk from my school, which is very handy.', whyVi: 'Có chi tiết.' },
    { questionIndex: 7, improved: 'out of range sample text that should be dropped entirely', whyVi: '' },
  ],
};

test('one natural-length Part 1 answer is not capped merely because a practice round contains one question', () => {
  assert.equal(volumeCap({ ...METRICS, answers: 1, words: 45, avgWords: 45 }).cap, null);
  assert.equal(volumeCap({ ...METRICS, answers: 1, words: 15, avgWords: 15 }).cap, 3);
});

test('a short coaching round requires a separate model answer for every question', () => {
  const ctx = { transcripts: TRANSCRIPTS, typed: false, metrics: METRICS, model: 'm', requireSamples: true };
  assert.throws(() => validateGrade(RAW, ctx), /bài mẫu/);
  const raw = { ...RAW, samples: [RAW.samples[0]!, { ...RAW.samples[0]!, questionIndex: 1 }] };
  assert.equal(validateGrade(raw, ctx).samples.length, 2);
});

test('kẹp band về 0–9, bước 0,5', () => {
  assert.equal(clampBand(6.3), 6.5);
  assert.equal(clampBand(6.2), 6);
  assert.equal(clampBand('7'), 7);
  assert.equal(clampBand(12), 9);
  assert.equal(clampBand(-1), 0);
  assert.equal(clampBand('abc'), null);
  assert.equal(clampBand(undefined), null);
});

test('làm tròn band tổng kiểu IELTS', () => {
  assert.equal(ieltsRound(6.25), 6.5);
  assert.equal(ieltsRound(6.125), 6);
  assert.equal(ieltsRound(6.75), 7);
  assert.equal(ieltsRound(6.625), 6.5);
  assert.equal(ieltsRound(7), 7);
  assert.equal(overallBand([6, 6.5, 6, 6.5]), 6.5);
  assert.equal(overallBand([6, 6, 6, 6.5]), 6);
  assert.equal(overallBand([7, 7, 6.5, 7]), 7);
  assert.equal(overallBand([6, null, 6, 6]), null);
});

test('phát âm từ độ rõ: dải 4–8, trừ theo từ nghe không chắc', () => {
  assert.equal(clarityBand(0.55, 0), 4);
  assert.equal(clarityBand(0.95, 0), 8);
  assert.equal(clarityBand(0.99, 0), 8);
  assert.equal(clarityBand(0.85, 0.2), 6.5);
  const p = pronunciationBand({ avgConfidence: 0.95, lowShare: 0, aiBand: 9, otherBands: [6, 6, 6], typed: false });
  assert.deepEqual(p, { band: 8, basis: 'clarity+ai' });
  // Không có độ tin cậy: không vượt trung bình ba tiêu chí kia.
  const t = pronunciationBand({ avgConfidence: null, lowShare: null, aiBand: 8, otherBands: [5.5, 6, 6], typed: false });
  assert.deepEqual(t, { band: 6, basis: 'text-only' });
  assert.deepEqual(pronunciationBand({ avgConfidence: 0.9, lowShare: 0, aiBand: 6, otherBands: [], typed: true }), { band: null, basis: 'none' });
});

test('trần theo lượng nói và tốc độ', () => {
  assert.equal(volumeCap({ ...METRICS, words: 20 }).cap, 3);
  assert.equal(volumeCap({ ...METRICS, words: 50 }).cap, 5);
  assert.equal(volumeCap({ ...METRICS, words: 100, avgWords: 8 }).cap, 5);
  assert.equal(volumeCap(METRICS).cap, null);
  assert.equal(fluencyCap({ ...METRICS, wpm: 60 }).cap, 5.5);
  assert.equal(fluencyCap({ ...METRICS, wpm: null }).cap, null);
});

test('so khớp trích dẫn bỏ hoa thường và dấu câu', () => {
  assert.equal(normalizeForQuote('I REALLY  enjoy it!'), 'i really enjoy it');
});

test('kiểm JSON: kẹp band, tự tính band tổng, bỏ trích dẫn bịa và mẫu sai chỉ số', () => {
  const g = validateGrade(RAW, { transcripts: TRANSCRIPTS, typed: false, metrics: METRICS, model: 'm', now: new Date('2026-09-30T00:00:00Z') });
  assert.equal(g.criteria.fc.band, 6.5);
  assert.equal(g.criteria.lr.band, 6);
  assert.equal(g.criteria.gr.band, 6.5);
  // Model cho Pronunciation 9 chỉ từ chữ → code tính lại từ độ rõ 0,9 (≈ 7,5) và kẹp.
  assert.ok(g.criteria.pr.band != null && g.criteria.pr.band <= 8);
  assert.equal(g.pronunciationBasis, 'clarity+ai');
  assert.equal(g.overall, overallBand([g.criteria.fc.band, g.criteria.lr.band, g.criteria.gr.band, g.criteria.pr.band]));
  assert.equal(g.strengths.length, 3);
  assert.deepEqual(
    g.fixes.map((f) => [f.questionIndex, f.quote]),
    [
      [1, 'we do many experiment'],
      [0, 'I REALLY enjoy it!'],
    ],
  );
  assert.equal(g.samples.length, 1);
  assert.equal(g.samples[0]!.questionIndex, 0);
  assert.equal(g.gradedAt, '2026-09-30T00:00:00.000Z');
  assert.deepEqual(g.capsApplied, []);
});

test('kiểm JSON: áp trần khi nói quá ít và nói quá chậm', () => {
  const g = validateGrade(RAW, { transcripts: TRANSCRIPTS, typed: false, metrics: { ...METRICS, words: 50, wpm: 60 }, model: 'm' });
  assert.equal(g.criteria.fc.band, 5);
  assert.equal(g.criteria.lr.band, 5);
  assert.equal(g.criteria.gr.band, 5);
  assert.ok((g.criteria.pr.band ?? 0) <= 5);
  assert.equal(g.capsApplied.length, 2);
});

test('kiểm JSON: bài gõ phím không có Fluency, Pronunciation, band tổng', () => {
  const g = validateGrade(RAW, { transcripts: TRANSCRIPTS, typed: true, metrics: { ...METRICS, wpm: null, avgConfidence: null, lowConfShare: null }, model: 'm' });
  assert.equal(g.criteria.fc.band, null);
  assert.equal(g.criteria.pr.band, null);
  assert.equal(g.overall, null);
  assert.equal(g.pronunciationBasis, 'none');
  assert.equal(g.criteria.lr.band, 6);
});

test('kiểm JSON: thiếu phần chấm thì ném lỗi', () => {
  assert.throws(() => validateGrade(null, { transcripts: [], typed: false, metrics: METRICS, model: 'm' }));
  assert.throws(() => validateGrade({ criteria: { fc: { band: 6 } } }, { transcripts: [], typed: false, metrics: METRICS, model: 'm' }));
  assert.throws(() => validateGrade({ criteria: { lr: { band: 6 }, gr: { band: 6 } } }, { transcripts: [], typed: false, metrics: METRICS, model: 'm' }));
});
