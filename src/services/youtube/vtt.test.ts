import test from 'node:test';
import assert from 'node:assert/strict';

import { groupIntoSentences, parseVtt } from './transcript';

/** Đúng khuôn `yt-dlp` trả về cho phụ đề tự động: cuộn từng chữ, có thẻ mốc giờ. */
const ROLLING = `WEBVTT
Kind: captions
Language: en

00:00:00.320 --> 00:00:18.790 align:start position:0%

[Music]

00:00:18.800 --> 00:00:21.790 align:start position:0%
We're<00:00:19.039><c> no</c><00:00:19.359><c> strangers</c>

00:00:21.790 --> 00:00:23.500 align:start position:0%
We're no strangers to love.

00:00:23.500 --> 00:00:26.000 align:start position:0%
You know the rules and so do I.
`;

test('bỏ thẻ mốc giờ trong dòng, giữ đúng chữ', () => {
  const cues = parseVtt(ROLLING);
  assert.ok(cues.some((c) => c.text === "We're no strangers to love."));
  assert.ok(!cues.some((c) => c.text.includes('<c>')));
});

test('phụ đề cuộn chữ không bị lặp — giữ bản đủ chữ nhất', () => {
  const cues = parseVtt(ROLLING);
  const rolled = cues.filter((c) => c.text.startsWith("We're no strangers"));
  assert.equal(rolled.length, 1, 'một câu cuộn dần phải gom về một mẩu');
  assert.equal(rolled[0]!.text, "We're no strangers to love.");
});

test('mốc giờ HH:MM:SS.mmm đổi ra giây', () => {
  const cues = parseVtt(`WEBVTT

01:02:03.500 --> 01:02:05.000
Xin chào.
`);
  assert.equal(cues[0]!.start, 3723.5);
  assert.equal(cues[0]!.duration, 1.5);
});

test('nhận cả dấu phẩy thập phân kiểu SRT', () => {
  const cues = parseVtt(`WEBVTT

00:00:01,000 --> 00:00:02,000
Hello there.
`);
  assert.equal(cues.length, 1);
  assert.equal(cues[0]!.start, 1);
});

test('khối không có mốc giờ thì bỏ qua, không làm nổ', () => {
  assert.deepEqual(parseVtt('WEBVTT\n\nKind: captions\n\n'), []);
  assert.deepEqual(parseVtt(''), []);
});

test('cắt được thành câu để chép chính tả', () => {
  const sentences = groupIntoSentences(parseVtt(ROLLING));
  assert.ok(sentences.length >= 2);
  assert.ok(sentences.every((s) => s.text.trim().length > 0));
});
