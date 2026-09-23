import assert from 'node:assert/strict';
import { test } from 'node:test';

import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { addAnswer, buildDuel, compareTally, emptyTally, isRoomCode, makeRoomCode, pointsFor, QUESTION_MS, verdictTitle } from './duel';
import { seededRng } from '@/services/vocab/topic-study';

test('mã phòng 5 ký tự, không có ký tự dễ nhầm', () => {
  const rand = seededRng(7);
  for (let i = 0; i < 200; i += 1) {
    const code = makeRoomCode(rand);
    assert.ok(isRoomCode(code), code);
    assert.ok(!/[01OIL]/.test(code));
  }
  assert.ok(!isRoomCode('ab12'));
});

test('hai máy cùng hạt dựng ra đúng cùng 10 câu', () => {
  const words = VOCAB_TOPICS[0]!.words;
  const a = buildDuel(words, 'K7Q2M:1234');
  const b = buildDuel(words, 'K7Q2M:1234');
  assert.equal(a.length, 10);
  assert.deepEqual(
    a.map((q) => [q.word.word, q.options, q.correctIndex]),
    b.map((q) => [q.word.word, q.options, q.correctIndex]),
  );
  assert.notDeepEqual(
    a.map((q) => q.word.word),
    buildDuel(words, 'K7Q2M:9999').map((q) => q.word.word),
  );
  for (const q of a) assert.equal(new Set(q.options).size, 4);
});

test('điểm: đúng + thưởng nhanh; sai hoặc quá giờ bằng 0', () => {
  assert.equal(pointsFor(true, 0), 150);
  assert.equal(pointsFor(true, QUESTION_MS / 2), 125);
  assert.equal(pointsFor(true, QUESTION_MS), 100);
  assert.equal(pointsFor(true, QUESTION_MS + 1), 0);
  assert.equal(pointsFor(false, 100), 0);
});

test('người thắng: nhiều điểm hơn; bằng điểm thì nhanh hơn', () => {
  const a = addAnswer(addAnswer(emptyTally(), true, 2000), false, 3000);
  const b = addAnswer(addAnswer(emptyTally(), true, 2000), false, 1000);
  assert.equal(a.score, b.score);
  assert.equal(compareTally(a, b), -1, 'b nhanh hơn');
  assert.equal(compareTally(addAnswer(emptyTally(), true, 9000), addAnswer(emptyTally(), false, 100)), 1);
  assert.equal(compareTally(emptyTally(), emptyTally()), 0);
});

test('lời kết: sát nút chỉ khi cách nhau dưới một câu đúng', () => {
  const t = (score: number, ms = 5000) => ({ score, ms, answered: 10, correct: 0 });
  assert.equal(verdictTitle(t(255), t(444)), 'Thua rồi — phục thù nhé!');
  assert.equal(verdictTitle(t(430), t(444)), 'Thua sát nút!');
  assert.equal(verdictTitle(t(444), t(430)), 'Thắng sát nút! 🏆');
  assert.equal(verdictTitle(t(600), t(300)), 'Bạn thắng! 🏆');
  assert.equal(verdictTitle(t(300), t(300)), 'Hoà!');
  assert.equal(verdictTitle(t(300, 4000), t(300, 5000)), 'Thắng sát nút! 🏆');
  assert.equal(verdictTitle(t(300), null), 'Xong!');
});
