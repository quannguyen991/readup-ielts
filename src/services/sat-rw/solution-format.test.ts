import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';

import { formatSolution, splitSentences, tidy } from './solution-format';

test('dọn khoảng trắng trước dấu câu và tách câu', () => {
  assert.equal(tidy('độc lập : Medieval , đúng .'), 'độc lập: Medieval, đúng.');
  assert.deepEqual(splitSentences('Câu một. Câu hai! Ba chấm...'), ['Câu một.', 'Câu hai!', 'Ba chấm...']);
});

test('tách lý do từng phương án sai theo chữ đầu của phương án', () => {
  const r = formatSolution({
    solutionVi:
      'Giả thuyết tách hai thứ. Cái lỗ nhòm làm đúng việc ấy. ' +
      'Ravens hide more food when other ravens are… — nói về lượng thức ăn giấu ' +
      'Ravens that have never seen another raven… — nói về lần giấu đầu tiên ' +
      'Nghĩa: Chim quạ giấu thức ăn.',
    options: [
      'Ravens that have never seen another raven steal food still hide their own.',
      'Ravens return to their caches sooner when the weather is cold.',
      'Ravens hide more food when other ravens are present than when they are alone.',
      'Ravens re-hide at the same rate when the observer was behind a screen.',
    ],
    answerIndex: 3,
  });
  assert.deepEqual(r.why, ['Giả thuyết tách hai thứ.', 'Cái lỗ nhòm làm đúng việc ấy.']);
  assert.deepEqual(
    r.wrong.map((w) => [w.index, w.reason]),
    [
      [0, 'Nói về lần giấu đầu tiên'],
      [2, 'Nói về lượng thức ăn giấu'],
    ],
  );
  assert.equal(r.meaning, 'Chim quạ giấu thức ăn.');
});

test('không tách được phương án thì mọi câu nằm ở "vì sao đúng", không mất chữ', () => {
  const text = 'Hai vế đều độc lập. Nối bằng dấu phẩy là lỗi. Dùng chấm phẩy.';
  const r = formatSolution({ solutionVi: text, options: ['a, b', 'c; d', 'e', 'f'], answerIndex: 1 });
  assert.equal(r.wrong.length, 0);
  assert.equal(r.why.join(' '), text);
});

test('mọi câu trong kho đều có ít nhất một ý, và các kỹ năng có đoạn trích phương án tách được phần lớn', () => {
  const byDetail = ['words', 'structure', 'crosstext', 'central', 'evidence', 'inference'];
  let total = 0;
  let split = 0;
  for (const q of SAT_RW_QUESTIONS) {
    const r = formatSolution(q);
    assert.ok(r.why.length > 0, q.id);
    assert.ok(r.why.every((s) => s.length < 600), `${q.id}: ý quá dài`);
    if (byDetail.includes(q.skill) && q.solutionVi.includes('—')) {
      total += 1;
      if (r.wrong.length >= 2) split += 1;
    }
  }
  assert.ok(total > 0);
  assert.ok(split / total >= 0.7, `tách được ${split}/${total}`);
});
