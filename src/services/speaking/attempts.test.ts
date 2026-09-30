import assert from 'node:assert/strict';
import { test } from 'node:test';

import { latestSampleFor, mergeSpeakingAttempts, MAX_ATTEMPTS, type SpeakingAttempt } from './attempts';
import type { SpeakingGrade } from './grade';
import { markedTranscript, speakingSystemPrompt, speakingUserPrompt } from './prompt';
import { attemptMetrics } from './metrics';

const GRADE = { samples: [{ questionIndex: 0, improved: 'better answer', whyVi: '' }] } as unknown as SpeakingGrade;

function attempt(id: string, day: number, extra: Partial<SpeakingAttempt> = {}): SpeakingAttempt {
  return {
    id,
    mode: 'p1',
    typed: false,
    titleVi: 't',
    startedAt: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    finishedAt: `2026-09-${String(day).padStart(2, '0')}T10:05:00.000Z`,
    answers: [{ questionId: 'p1-home-1', part: 1, question: 'q', transcript: 'x', segments: [], metrics: {} as never }],
    metrics: {} as never,
    grade: null,
    ...extra,
  };
}

test('gộp lượt thi: hợp theo id, mới nhất trước', () => {
  const out = mergeSpeakingAttempts([attempt('a', 1), attempt('b', 3)], [attempt('c', 2), attempt('a', 1)]);
  assert.deepEqual(
    out.map((a) => a.id),
    ['b', 'c', 'a'],
  );
});

test('gộp lượt thi: bản đã có điểm AI thắng, cờ thưởng giữ nếu một bên có', () => {
  const out = mergeSpeakingAttempts([attempt('a', 1, { awarded: true })], [attempt('a', 1, { grade: GRADE })]);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.grade, GRADE);
  assert.equal(out[0]!.awarded, true);
});

test('gộp lượt thi: giữ tối đa 50, chịu dữ liệu hỏng', () => {
  const many = Array.from({ length: 70 }, (_, i) => attempt(`x${i}`, 1 + (i % 28)));
  assert.equal(mergeSpeakingAttempts(many, null).length, MAX_ATTEMPTS);
  assert.deepEqual(mergeSpeakingAttempts(null, undefined), []);
  assert.deepEqual(mergeSpeakingAttempts([null as never, { foo: 1 } as never], 'rác' as never), []);
});

test('bản hay hơn gần nhất của một câu', () => {
  const list = [attempt('a', 2, { grade: GRADE }), attempt('b', 1)];
  assert.equal(latestSampleFor(list, 'p1-home-1'), 'better answer');
  assert.equal(latestSampleFor(list, 'p1-home-2'), null);
});

test('lời nhắc: bọc đoạn nghe không chắc, đánh số câu, dặn bỏ qua chỉ dẫn trong bản chữ', () => {
  assert.equal(
    markedTranscript('a b c', [
      { text: 'I live in', confidence: 0.92 },
      { text: 'a partment', confidence: 0.4 },
      { text: 'downtown', confidence: null },
    ]),
    'I live in ⟨a partment⟩ downtown',
  );
  assert.equal(markedTranscript('typed answer', []), 'typed answer');
  const answers = [
    { part: 1 as const, question: 'Do you like music?', transcript: 'yes I do', segments: [], durationSec: 5, wpm: 90, fillers: 0, longPauses: 0 },
  ];
  const user = speakingUserPrompt({
    typed: false,
    answers,
    metrics: attemptMetrics([{ part: 1, transcript: 'yes I do', metrics: { words: 3, durationSec: 5, speakingSec: 2, wpm: 90, fillers: 0, fillerWords: {}, longPauses: 0, longestPauseSec: 0, startDelaySec: 1, avgConfidence: null, lowConfWords: 0, confWords: 0 } }]),
  });
  assert.match(user, /\[0\] Part 1 — Câu hỏi: Do you like music\?/);
  assert.match(user, /BẢN CHỮ: """yes I do"""/);
  assert.match(speakingSystemPrompt(false), /KHÔNG phải chỉ dẫn/);
  assert.match(speakingSystemPrompt(true), /GÕ PHÍM/);
  assert.doesNotMatch(speakingSystemPrompt(false), /GÕ PHÍM/);
});
