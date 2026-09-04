import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLetterBoard, gradeLetters, sanitizeTyped } from './letter-cells';

test('mỗi chữ cái một ô, dấu cách tách thành từ', () => {
  const board = buildLetterBoard('Two cats run.');
  assert.equal(board.words.length, 3);
  assert.equal(board.answer, 'TWOCATSRUN');
});

test('mỗi từ giữ nguyên văn để hiện lại và đọc bằng TTS', () => {
  const board = buildLetterBoard('We took a taxi.');
  assert.deepEqual(
    board.words.map((w) => w.text),
    ['We', 'took', 'a', 'taxi.'],
  );
});

test('dấu câu hiện ra nhưng không chiếm ô', () => {
  const board = buildLetterBoard("I've been there.");
  assert.equal(board.answer, 'IVEBEENTHERE');

  const first = board.words[0]!;
  assert.deepEqual(
    first.units.map((u) => (u.kind === 'letter' ? u.expected : u.text)),
    ['I', "'", 'V', 'E'],
  );

  const last = board.words[2]!;
  assert.equal(last.units[last.units.length - 1]?.kind, 'mark');
});

test('số cũng chiếm ô như chữ cái', () => {
  const board = buildLetterBoard('Room 3B.');
  assert.equal(board.answer, 'ROOM3B');
});

test('chưa gõ gì thì mọi ô đều rỗng', () => {
  const grade = gradeLetters('TWOCATS', '');
  assert.equal(grade.filledCount, 0);
  assert.equal(grade.correctCount, 0);
  assert.equal(grade.done, false);
  assert.ok(grade.states.every((s) => s === 'empty'));
});

test('gõ đúng thì ô xanh, gõ sai thì ô đỏ, ô chưa tới vẫn rỗng', () => {
  const grade = gradeLetters('TWOCATS', 'TWX');
  assert.deepEqual(grade.states.slice(0, 4), ['correct', 'correct', 'wrong', 'empty']);
  assert.equal(grade.correctCount, 2);
  assert.equal(grade.filledCount, 3);
});

test('không phân biệt hoa thường', () => {
  const grade = gradeLetters('TWOCATS', 'twocats');
  assert.equal(grade.done, true);
  assert.equal(grade.correctCount, 7);
});

test('gõ thừa không tràn ra ngoài số ô', () => {
  const grade = gradeLetters('TWO', 'TWOXXXX');
  assert.equal(grade.states.length, 3);
  assert.equal(grade.done, true);
});

test('lọc phím: dấu câu và dấu cách không ăn ô nào', () => {
  assert.equal(sanitizeTyped("I've, been!", 20), 'Ivebeen');
});

test('lọc phím: cắt đúng sức chứa', () => {
  assert.equal(sanitizeTyped('abcdefgh', 3), 'abc');
});
