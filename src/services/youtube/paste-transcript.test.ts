import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePastedTranscript } from './paste-transcript';

test('đọc được kiểu YouTube đặt mốc thời gian trên một dòng riêng', () => {
  const pasted = `
0:00
Hello and welcome to the show.
0:04
Today we talk about sleep and memory.
`;
  const out = parsePastedTranscript(pasted);
  assert.equal(out.length, 2);
  assert.equal(out[0]?.text, 'Hello and welcome to the show.');
  assert.equal(out[0]?.start, 0);
  assert.equal(out[1]?.start, 4);
});

test('đọc được kiểu mốc thời gian nằm đầu dòng', () => {
  const out = parsePastedTranscript(
    '0:00 Hello and welcome to the show.\n0:04 Today we talk about sleep.',
  );
  assert.equal(out.length, 2);
  assert.equal(out[1]?.start, 4);
  assert.equal(out[1]?.text, 'Today we talk about sleep.');
});

test('đọc được mốc thời gian có giờ', () => {
  const out = parsePastedTranscript('1:02:03 This happens one hour into the talk.');
  assert.equal(out[0]?.start, 3723);
});

test('ghép các dòng rời thành câu trọn vẹn', () => {
  const out = parsePastedTranscript(
    '0:00 I woke up early\n0:02 and made a cup of coffee.\n0:05 Then I walked to the park.',
  );
  assert.equal(out.length, 2);
  assert.equal(out[0]?.text, 'I woke up early and made a cup of coffee.');
});

test('bỏ chú thích trong ngoặc vuông và dòng quá ngắn', () => {
  const out = parsePastedTranscript(
    '0:00 [Music]\n0:03 Okay.\n0:05 This sentence is long enough to keep.',
  );
  assert.equal(out.length, 1);
  assert.equal(out[0]?.text, 'This sentence is long enough to keep.');
});

test('dán vào chuỗi rỗng hay chỉ có mốc thời gian thì trả mảng rỗng', () => {
  assert.deepEqual(parsePastedTranscript(''), []);
  assert.deepEqual(parsePastedTranscript('0:00\n0:04\n0:09'), []);
});

test('mỗi câu có khoảng thời gian dương để tua đúng chỗ', () => {
  const out = parsePastedTranscript(
    '0:00 The first sentence is here.\n0:06 The second sentence follows it.',
  );
  for (const sentence of out) {
    assert.ok(sentence.end > sentence.start, `câu "${sentence.text}" có độ dài bằng 0`);
  }
});

test('không có mốc thời gian nào thì vẫn đọc được, tự giãn đều', () => {
  const out = parsePastedTranscript(
    'The first sentence is here.\nThe second sentence follows it.',
  );
  assert.equal(out.length, 2);
  assert.equal(out[0]?.start, 0);
  assert.ok(out[1]!.start > out[0]!.start, 'câu sau phải bắt đầu muộn hơn câu trước');
});
