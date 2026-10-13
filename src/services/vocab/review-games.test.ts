import assert from 'node:assert/strict';
import { test } from 'node:test';

import { seededRng, type StudyWord } from './topic-study';
import {
  buildPairTiles,
  isGuessSolved,
  isLetterWord,
  isPairMatch,
  isSentenceOrder,
  pickWords,
  revealedLetters,
  scrambleSentence,
  wrongGuessCount,
} from './review-games';

function w(word: string, meaningVi = `nghĩa ${word}`, example = ''): StudyWord {
  return { word, pos: 'noun', ipa: '', meaningVi, definitionEn: '', example, collocation: '', band: '6' };
}

test('chỉ từ chữ cái a–z dài 3–12 mới chơi được bằng chữ', () => {
  assert.equal(isLetterWord('habitat'), true);
  assert.equal(isLetterWord('Cat'), true);
  assert.equal(isLetterWord('well-being'), false);
  assert.equal(isLetterWord('take off'), false);
  assert.equal(isLetterWord('AI'), false);
  assert.equal(isLetterWord('extraordinarily'), false);
});

test('pickWords bỏ từ trùng và từ không có nghĩa, và không trả nhiều hơn n từ', () => {
  const words = [w('alpha'), w('Alpha'), w('beta', ''), w('gamma'), w('delta')];
  const picked = pickWords(words, 10, seededRng(1));
  const keys = picked.map((x) => x.word.toLowerCase());
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(!keys.includes('beta'));
  assert.equal(picked.length, 3);
  assert.equal(pickWords(words, 2, seededRng(2)).length, 2);
});

test('buildPairTiles: mỗi từ có đúng một ô từ và một ô nghĩa, hai ô cùng cặp khớp nhau', () => {
  const words = [w('cat'), w('dog'), w('fish')];
  const tiles = buildPairTiles(words, seededRng(3));
  assert.equal(tiles.length, 6);
  for (let i = 0; i < 3; i += 1) {
    const pair = tiles.filter((t) => t.pairId === i);
    assert.equal(pair.length, 2);
    assert.ok(isPairMatch(pair[0]!, pair[1]!));
    assert.notEqual(pair[0]!.kind, pair[1]!.kind);
  }
  const a = tiles.find((t) => t.pairId === 0)!;
  const b = tiles.find((t) => t.pairId === 1)!;
  assert.equal(isPairMatch(a, b), false);
  assert.equal(isPairMatch(a, a), false);
});

test('đoán chữ: lộ chữ đã đoán, đếm chữ sai, nhận biết đã giải xong', () => {
  const guessed = new Set(['c', 'a', 'z']);
  assert.deepEqual(revealedLetters('cat', guessed), ['c', 'a', '_']);
  assert.deepEqual(revealedLetters('cat', new Set(['c'])), ['c', '_', '_']);
  assert.equal(wrongGuessCount('cat', guessed), 1);
  assert.equal(isGuessSolved('cat', guessed), false);
  assert.equal(isGuessSolved('cat', new Set(['c', 'a', 't'])), true);
  assert.equal(isGuessSolved('lol', new Set(['l', 'o'])), true);
});

test('xếp câu: xáo khác thứ tự gốc, giữ đủ mọi từ, và kiểm đúng thứ tự', () => {
  const sentence = 'The company hired ten new engineers';
  const { target, chips } = scrambleSentence(sentence, seededRng(9));
  assert.deepEqual([...chips.map((c) => c.text)].sort(), [...target].sort());
  assert.notDeepEqual(
    chips.map((c) => c.id),
    target.map((_, i) => i),
  );
  const ordered = target.map((text, i) => ({ id: i, text }));
  assert.equal(isSentenceOrder(ordered, target), true);
  assert.equal(isSentenceOrder(ordered.slice(1), target), false);
  const swapped = [ordered[1]!, ordered[0]!, ...ordered.slice(2)];
  assert.equal(isSentenceOrder(swapped, target), false);
});

test('xếp câu: câu một từ vẫn xáo được mà không lỗi', () => {
  const { target, chips } = scrambleSentence('Hello', seededRng(4));
  assert.equal(target.length, 1);
  assert.equal(chips.length, 1);
  assert.equal(isSentenceOrder(chips, target), true);
});
