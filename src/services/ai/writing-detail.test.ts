import test from 'node:test';
import assert from 'node:assert/strict';

import { countWords } from '@/lib/writing/word-count';

import { buildResult } from './writing-evaluator';

/**
 * Kiểm phần đọc bản chấm CHI TIẾT.
 *
 * Không gọi mạng: thứ đáng kiểm ở đây là cách app ĐỌC câu trả lời của model, chứ
 * không phải model chấm hay tới đâu. Ba chỗ đã biết là hay hỏng:
 *   - model trả về hình dạng cũ (taskBand rời) thay vì `criteria` lồng nhau,
 *   - model BỊA dẫn chứng không có trong bài,
 *   - model trả band ngoài thang hoặc lẻ 0,25.
 */

const BAI = [
  'Some people believe that governments should fund public transport.',
  'In my opinion, this is a sensible use of money because it reduces traffic.',
  'However, the cost is very high and taxes may increase.',
].join(' ');

/** Bản chấm đầy đủ, đúng hình dạng mới. */
function scoreDayDu() {
  return {
    bandLow: 6,
    bandHigh: 6.5,
    summaryVi: 'Bài có luận điểm rõ nhưng thiếu ví dụ.',
    priorityVi: 'Thêm một ví dụ cụ thể cho mỗi đoạn thân bài.',
    nextBandVi: 'Viết câu chủ đề đứng đầu mỗi đoạn.',
    strengths: ['Luận điểm rõ ràng'],
    improvements: ['Thêm ví dụ', 'Đa dạng cấu trúc câu'],
    criteria: {
      task: {
        band: 6,
        evidenceVi: 'Trả lời đúng câu hỏi nhưng chưa có ví dụ minh hoạ.',
        gapVi: 'Cần ví dụ cụ thể cho mỗi luận điểm.',
        nextStepVi: 'Mỗi đoạn thân bài thêm một câu bắt đầu bằng "For example".',
        quotes: ['In my opinion, this is a sensible use of money'],
      },
      coherence: { band: 6.5, evidenceVi: 'a', gapVi: 'b', nextStepVi: 'c', quotes: [] },
      lexical: { band: 6, evidenceVi: 'a', gapVi: 'b', nextStepVi: 'c', quotes: [] },
      grammar: { band: 6.5, evidenceVi: 'a', gapVi: 'b', nextStepVi: 'c', quotes: [] },
    },
  };
}

test('đọc đủ bốn tiêu chí ở hình dạng mới', () => {
  const r = buildResult(scoreDayDu(), { annotations: [] }, BAI, 'model-x');

  assert.equal(r.criteria.task.band, 6);
  assert.equal(r.criteria.coherence.band, 6.5);
  assert.equal(r.criteria.task.gapVi, 'Cần ví dụ cụ thể cho mỗi luận điểm.');
  assert.ok(r.criteria.task.nextStepVi.length > 0);
});

test('band tóm tắt vẫn khớp với band trong phần chi tiết', () => {
  // Hai chỗ này hiện ở hai nơi khác nhau trên màn kết quả; lệch nhau là mất tin.
  const r = buildResult(scoreDayDu(), { annotations: [] }, BAI, 'model-x');
  assert.equal(r.taskBand, r.criteria.task.band);
  assert.equal(r.coherenceBand, r.criteria.coherence.band);
  assert.equal(r.lexicalBand, r.criteria.lexical.band);
  assert.equal(r.grammarBand, r.criteria.grammar.band);
});

test('dẫn chứng bịa bị loại, dẫn chứng có thật thì giữ', () => {
  const score = scoreDayDu();
  score.criteria.task.quotes = [
    'In my opinion, this is a sensible use of money', // có thật
    'The author clearly demonstrates a masterful command', // bịa
  ];

  const r = buildResult(score, { annotations: [] }, BAI, 'model-x');
  assert.equal(r.criteria.task.quotes.length, 1, 'câu bịa phải bị loại');
  assert.ok(BAI.includes(r.criteria.task.quotes[0] ?? ''), 'câu còn lại phải có thật trong bài');
});

test('giữ tối đa ba dẫn chứng cho một tiêu chí', () => {
  const score = scoreDayDu();
  score.criteria.task.quotes = ['Some people', 'governments', 'public transport', 'In my opinion', 'the cost'];
  const r = buildResult(score, { annotations: [] }, BAI, 'model-x');
  assert.equal(r.criteria.task.quotes.length, 3);
});

test('model trả hình dạng CŨ thì vẫn lấy được band, chỉ mất phần chi tiết', () => {
  // Mất phần chi tiết còn chấp nhận được; mất luôn điểm số thì không.
  const cu = {
    bandLow: 6,
    bandHigh: 6.5,
    taskBand: 6,
    coherenceBand: 7,
    lexicalBand: 6,
    grammarBand: 5.5,
    summaryVi: 'Nhận xét cũ.',
    strengths: [],
    improvements: [],
  };

  const r = buildResult(cu, { annotations: [] }, BAI, 'model-x');
  assert.equal(r.taskBand, 6);
  assert.equal(r.coherenceBand, 7);
  assert.equal(r.grammarBand, 5.5);
  assert.equal(r.criteria.task.evidenceVi, '', 'không có chi tiết thì để rỗng, không bịa ra');
  assert.deepEqual(r.criteria.task.quotes, []);
});

test('band lệch thang bị kẹp và làm tròn về bội số 0,5', () => {
  const score = scoreDayDu();
  score.criteria.task.band = 6.3;
  score.criteria.grammar.band = 12;
  const r = buildResult(score, { annotations: [] }, BAI, 'model-x');
  assert.equal(r.criteria.task.band, 6.5);
  assert.equal(r.criteria.grammar.band, 9);
});

test('dẫn chứng là đoạn nguyên văn trong bài, dù model chép khác khoảng trắng và hoa thường', () => {
  const r = buildResult(
    { criteria: { task: { band: 6, quotes: ['in my  opinion, this is a sensible use of money'] } } },
    { annotations: [] },
    BAI,
    'model-x',
  );
  assert.deepEqual(r.criteria.task.quotes, ['In my opinion, this is a sensible use of money']);
});

test('thiếu hẳn phần criteria cũng không ném lỗi', () => {
  const r = buildResult({ bandLow: 5, bandHigh: 6 }, { annotations: [] }, BAI, 'model-x');
  assert.equal(r.criteria.lexical.band, 5, 'không có gì để đọc thì rơi về mức mặc định');
  assert.equal(r.priorityVi, '');
  assert.equal(r.nextBandVi, '');
});

test('đếm từ bằng code, không tin con số model đưa', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('one'), 1);
  assert.equal(countWords('  hai   từ  '), 2);
  assert.equal(countWords('a\nb\tc'), 3, 'xuống dòng và tab cũng là ranh giới từ');
});

test('số từ đi kèm kết quả chấm', () => {
  const r = buildResult(scoreDayDu(), { annotations: [] }, BAI, 'model-x');
  assert.equal(r.wordCount, countWords(BAI));
  assert.ok(r.wordCount > 20);
});
