import assert from 'node:assert/strict';
import { test } from 'node:test';

import { alignWords, heardWords, normWord, reachedEnd, scoreBand, sentenceKey, shadowSentences, similarity, splitSentences, tokenize, wordAtChar } from './align';

const marksOf = (target: string, heard: string, final = true) => alignWords(tokenize(target), heardWords(heard), final);

test('tách từ: bỏ dấu câu, gạch nối tách đôi, giữ vị trí ký tự', () => {
  const t = tokenize('A well-known “teacher” didn’t come, 5 times.');
  assert.deepEqual(
    t.map((x) => x.norm),
    ['a', 'well', 'known', 'teacher', 'didnt', 'come', 'five', 'times'],
  );
  assert.equal(t[3]!.text, 'teacher');
  assert.equal('A well-known “teacher” didn’t come, 5 times.'.slice(t[4]!.start, t[4]!.end), 'didn’t');
  assert.equal(normWord('2025'), '2025');
});

test('đọc đúng cả câu thì 100 điểm, dấu câu và hoa thường không tính', () => {
  const a = marksOf('Many people who knit make clothing for cold weather.', 'many people who knit make clothing for cold weather');
  assert.equal(a.score, 100);
  assert.ok(a.marks.every((m) => m === 'hit'));
});

test('thiếu từ thì từ đó đỏ, thừa từ không bị trừ', () => {
  const a = marksOf('I am happy to answer this question.', 'um I am so happy answer this question');
  assert.deepEqual(a.marks, ['hit', 'hit', 'hit', 'miss', 'hit', 'hit', 'hit']);
  assert.equal(a.score, 86);
});

test('đồng âm và số: máy nghe "their"/"4" không phải lỗi của người đọc', () => {
  assert.equal(marksOf('They went there for four days.', 'they went their 4 4 days').score, 100);
  assert.equal(marksOf('It costs five dollars.', 'it costs $5').score, 100);
  assert.equal(marksOf('About ten percent of them.', 'about 10% of them').score, 100);
});

test('nuốt âm cuối thì tính nửa điểm', () => {
  const a = marksOf('She walked to school.', 'she walk to school');
  assert.deepEqual(a.marks, ['hit', 'near', 'hit', 'hit']);
  assert.equal(a.score, 88);
  assert.equal(similarity('knitting', 'knitting'), 1);
  assert.equal(similarity('thread', 'threat'), 0.5);
  assert.equal(similarity('thread', 'bread'), 0);
  assert.equal(similarity('is', 'it'), 0);
  assert.equal(similarity('needle', 'table'), 0);
});

test('đang nghe dở: từ chưa tới để chờ, chưa tô đỏ', () => {
  const a = marksOf('People can sew many kinds of clothes.', 'people can sew', false);
  assert.deepEqual(a.marks.slice(0, 4), ['hit', 'hit', 'hit', 'pending']);
  assert.ok(!reachedEnd(a.marks));
  assert.ok(reachedEnd(marksOf('People can sew many kinds of clothes.', 'people can sew many kinds of clothes', false).marks));
  // Câu dài: nuốt mất từ cuối vẫn tính là đọc xong.
  assert.ok(reachedEnd(marksOf('People can sew many kinds of clothes.', 'people can sew many kinds of', false).marks));
});

test('không nghe được gì thì 0 điểm, không vỡ', () => {
  assert.equal(marksOf('Hello there friend.', '').score, 0);
  assert.equal(alignWords([], ['a']).score, 0);
});

test('mốc ký tự của giọng máy ứng với đúng từ đang đọc', () => {
  const t = tokenize('Sew and knit.');
  assert.equal(wordAtChar(t, 0), 0);
  assert.equal(wordAtChar(t, 4), 1);
  assert.equal(wordAtChar(t, 9), 2);
});

test('chọn câu: bỏ câu quá ngắn, quá dài, dòng không có dấu kết câu', () => {
  const s = shadowSentences([
    'Dear VOA Learning English,',
    'I’m happy to answer this question, Rohullah. Thanks!',
    'While sewing thread is often less than one millimeter thick , knitting yarn is generally two to five millimeters thick.',
    Array(30).fill('word').join(' ') + '.',
  ]);
  assert.deepEqual(s, [
    'I’m happy to answer this question, Rohullah.',
    'While sewing thread is often less than one millimeter thick, knitting yarn is generally two to five millimeters thick.',
  ]);
});

test('dải điểm', () => {
  assert.equal(scoreBand(92).tone, 'good');
  assert.equal(scoreBand(70).tone, 'ok');
  assert.equal(scoreBand(20).tone, 'low');
});

test('tên riêng máy không nghe ra thì không tính điểm, từ thường vẫn tính', () => {
  const a = marksOf('We answer a question from Rohullah in Afghanistan.', 'we answer a question from in afghanistan');
  assert.equal(a.marks[5], 'skip');
  assert.equal(a.counted, 7);
  assert.equal(a.score, 100);
  // Từ đầu câu viết hoa không phải tên riêng.
  assert.equal(marksOf('Many people knit.', 'people knit').marks[0], 'miss');
  // Đang nghe dở thì chưa xếp vào "bỏ qua".
  assert.equal(marksOf('We met Rohullah today.', 'we met', false).marks[2], 'pending');
  assert.equal(normWord('Café'), 'cafe');
});

test('tách câu: dọn khoảng trắng thừa trước dấu, không cắt ở viết tắt', () => {
  assert.deepEqual(splitSentences('I wanted to know about "sew and knit. ” Besides [that], I wanted more.'), [
    'I wanted to know about "sew and knit.”',
    'Besides [that], I wanted more.',
  ]);
  assert.deepEqual(splitSentences('Mr. Smith met Dr. Lee in the U.S. capital. They talked!  Then left.'), [
    'Mr. Smith met Dr. Lee in the U.S. capital.',
    'They talked!',
    'Then left.',
  ]);
  assert.deepEqual(splitSentences('It costs 3.5 dollars. OK?'), ['It costs 3.5 dollars.', 'OK?']);
});

test('mã câu bám nội dung: dấu câu, hoa thường không đổi mã; khác chữ thì khác mã', () => {
  assert.equal(sentenceKey('Send us an email.'), sentenceKey('send us an email'));
  assert.notEqual(sentenceKey('Send us an email.'), sentenceKey('Send us a letter.'));
  // Câu có email hay đường dẫn bị loại khỏi bài đọc theo.
  assert.deepEqual(shadowSentences(['Send us an email at learningenglish@voanews.com. We read every letter you send.']), [
    'We read every letter you send.',
  ]);
});

test('tên người đầu câu: nhận ra nhờ họ đi liền sau; từ chức năng đầu câu thì không', () => {
  const a = marksOf('Andrew Smith wrote this lesson.', 'and rue smith wrote this lesson');
  assert.equal(a.marks[0], 'skip');
  assert.equal(a.score, 100);
  assert.equal(marksOf('The United States is big.', 'united states is big').marks[0], 'miss');
});
