import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGradeMessages, parseIntlGrade } from './grading';

const input = {
  exam: 'toeic' as const,
  title: 'Trả lời thư của khách',
  prompt: 'Viết thư trả lời khách hàng.',
  minWords: 60,
  checklist: ['Có lời xin lỗi', 'Nêu nguyên nhân'],
  text: 'Dear customer, we apologize for the delay.',
};

test('the grading request includes the rubric, the task and the learner text', () => {
  const { system, user } = buildGradeMessages(input);
  assert.match(system, /JSON/);
  assert.match(system, /ước lượng/);
  assert.match(user, /TOEIC/);
  assert.match(user, /1\. Có lời xin lỗi/);
  assert.match(user, /we apologize for the delay/);
});

test('a valid JSON grade is accepted, even when wrapped in a code fence', () => {
  const raw = [
    'Đây là kết quả:',
    '```json',
    '{"overall": 72, "criteria": [{"name": "Lời xin lỗi", "score": 4, "comment": "Rõ ràng."}], "strengths": ["Lịch sự"], "improvements": ["Thêm thời hạn"]}',
    '```',
  ].join('\n');
  const grade = parseIntlGrade(raw);
  assert.equal(grade.overall, 72);
  assert.equal(grade.criteria[0]?.score, 4);
  assert.deepEqual(grade.improvements, ['Thêm thời hạn']);
});

test('out-of-range or malformed grades are rejected instead of shown', () => {
  assert.throws(() => parseIntlGrade('{"overall": 140, "criteria": [{"name": "a", "score": 3, "comment": "b"}]}'));
  assert.throws(() => parseIntlGrade('{"overall": 50, "criteria": [{"name": "a", "score": 9, "comment": "b"}]}'));
  assert.throws(() => parseIntlGrade('{"overall": 50, "criteria": []}'));
  assert.throws(() => parseIntlGrade('không có JSON'));
});
