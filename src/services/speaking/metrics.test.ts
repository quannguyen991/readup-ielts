import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerMetrics,
  attemptMetrics,
  clarityOf,
  countFillers,
  countWords,
  lexicalVariety,
  markFillers,
  pausesFromEvents,
  repeatedWords,
  words,
} from './metrics';

test('đếm từ: tính cả từ có dấu nháy, bỏ dấu câu', () => {
  assert.equal(countWords("I don't really know, to be honest."), 7);
  assert.deepEqual(words('It’s Hà Nội!'), ["it's", 'hà', 'nội']);
  assert.equal(countWords(''), 0);
});

test('từ đệm: uh/um/er + "you know", "I mean" theo ranh giới từ', () => {
  const r = countFillers('Um I think uh the summer is, you know, really hot. I mean it is hot');
  assert.equal(r.total, 4);
  assert.equal(r.byWord.um, 1);
  assert.equal(r.byWord['you know'], 1);
  // "umbrella", "her", "ermine" không phải từ đệm.
  assert.equal(countFillers('I took my umbrella and her ermine coat').total, 0);
});

test('"like" chỉ tính khi chắc chắn là đệm', () => {
  assert.equal(countFillers('I like music and a city like Hanoi').total, 0);
  assert.equal(countFillers('it was like really crowded and like noisy').total, 2);
});

test('tô từ đệm: ghép lại đúng nguyên văn', () => {
  const text = 'Well, um, I guess you know it depends';
  const pieces = markFillers(text);
  assert.equal(pieces.map((p) => p.text).join(''), text);
  assert.deepEqual(
    pieces.filter((p) => p.filler).map((p) => p.text),
    ['um', 'you know'],
  );
  assert.deepEqual(markFillers('no fillers here'), [{ text: 'no fillers here', filler: false }]);
});

test('khoảng lặng: chỉ tính khoảng giữa hai mốc, bỏ khoảng lặng cuối', () => {
  assert.deepEqual(pausesFromEvents([500, 900, 1300, 4000, 4300, 7000]), { count: 2, longestMs: 2700 });
  assert.deepEqual(pausesFromEvents([]), { count: 0, longestMs: 0 });
  assert.deepEqual(pausesFromEvents([1000]), { count: 0, longestMs: 0 });
});

test('độ rõ: trung bình theo số từ, bỏ đoạn không báo độ tin cậy', () => {
  const c = clarityOf([
    { text: 'one two three four', confidence: 0.9 },
    { text: 'five six', confidence: 0.6 },
    { text: 'seven eight', confidence: null },
  ]);
  assert.equal(c.confWords, 6);
  assert.equal(c.lowWords, 2);
  assert.equal(c.avg, 0.8);
  assert.equal(clarityOf([{ text: 'hi there', confidence: 0 }]).avg, null);
});

test('chỉ số một câu trả lời nói: tốc độ trên thời gian thực sự nói', () => {
  const transcript = Array.from({ length: 40 }, () => 'word').join(' ');
  const m = answerMetrics({
    transcript,
    segments: [{ text: transcript, confidence: 0.9 }],
    durationMs: 25_000,
    eventTimes: [1_500, 2_000, 2_600, 5_600, 6_200, 7_000, 11_000, 11_500, 12_000, 19_400],
  });
  // 40 từ trong (19400 − 1500 + 600) ms = 18,5 s → ≈ 130 từ/phút.
  assert.equal(m.wpm, 130);
  assert.equal(m.speakingSec, 18.5);
  assert.equal(m.startDelaySec, 1.5);
  assert.equal(m.longPauses, 3);
  assert.equal(m.longestPauseSec, 7.4);
  assert.equal(m.avgConfidence, 0.9);
});

test('câu trả lời gõ phím: không có tốc độ nói, không bịa số', () => {
  const m = answerMetrics({ transcript: 'I usually take the bus to school every day', segments: [], durationMs: 30_000, eventTimes: [] });
  assert.equal(m.wpm, null);
  assert.equal(m.speakingSec, null);
  assert.equal(m.startDelaySec, null);
  assert.equal(m.avgConfidence, null);
  assert.equal(m.words, 9);
});

test('độ đa dạng từ và từ lặp', () => {
  assert.equal(lexicalVariety(['a', 'b']), null);
  const same = Array.from({ length: 60 }, () => 'good');
  assert.equal(lexicalVariety(same), 0.02);
  const varied = Array.from({ length: 60 }, (_, i) => `w${i}`);
  assert.equal(lexicalVariety(varied), 1);
  const rep = repeatedWords(words('good food good food good food the the the the interesting'));
  assert.deepEqual(rep, [
    { word: 'food', count: 3 },
    { word: 'good', count: 3 },
  ]);
});

test('gộp cả lượt: tốc độ = tổng từ / tổng giây nói; đếm câu quá ngắn', () => {
  const mk = (transcript: string, speakingSec: number | null, conf: number | null) => ({
    part: 1 as const,
    transcript,
    metrics: {
      ...answerMetrics({ transcript, segments: conf == null ? [] : [{ text: transcript, confidence: conf }], durationMs: 20_000, eventTimes: [] }),
      speakingSec,
    },
  });
  const a = mk(Array.from({ length: 30 }, () => 'x').join(' '), 15, 0.9);
  const b = mk('yes I do', 3, 0.5);
  const agg = attemptMetrics([a, b]);
  assert.equal(agg.words, 33);
  assert.equal(agg.wpm, 110); // 33 từ / 18 s
  assert.equal(agg.shortAnswers, 1);
  assert.equal(agg.avgConfidence, 0.864);
  assert.equal(agg.lowConfShare, 0.091);
});
