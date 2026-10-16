import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSession, examinerMessages, questionsOf, type LiveTurn } from './live-session';
import { SPEAKING_TOPICS } from '../../data/hub/speaking-topics';
import type { VoiceReport } from './voice-report';

/** Một báo cáo giả có đủ trường, để thử logic gộp và đánh giá. */
function report(over: Partial<VoiceReport> & { wordCount?: number } = {}): VoiceReport {
  return {
    wordCount: 40,
    wpm: 130,
    fillers: { total: 0, byWord: {} },
    pauses: { count: 0, longestMs: 400 },
    variety: 0.7,
    repeated: [],
    segments: [],
    dimensions: [
      { key: 'pronunciation', score: 70, note: '' },
      { key: 'intonation', score: null, note: '' },
      { key: 'fluency', score: 75, note: '' },
      { key: 'grammar', score: null, note: '' },
      { key: 'vocabulary', score: 80, note: '' },
      { key: 'coherence', score: null, note: '' },
    ],
    overall: 74,
    estimatedBand: 6.5,
    ...over,
  };
}

const user = (id: string, r: VoiceReport | undefined, silent = false): LiveTurn => ({
  id,
  role: 'user',
  text: 'some words',
  report: r,
  silent,
});

test('buổi trống: không có lượt nào thì không có điểm, không có nhận xét giả', () => {
  const a = analyzeSession([]);
  assert.equal(a.answers, 0);
  assert.equal(a.avgWpm, null);
  assert.equal(a.overall, null);
  assert.equal(a.band, null);
  assert.deepEqual(a.strengths, []);
  assert.deepEqual(a.weaknesses, []);
  assert.ok(a.dimensions.every((d) => d.score === null));
});

test('lượt không nghe rõ không được tính vào số liệu', () => {
  const a = analyzeSession([
    { id: 'a', role: 'ai', text: 'Q?' },
    user('u1', report({ wordCount: 60, wpm: 140 })),
    user('u2', undefined, true),
  ]);
  assert.equal(a.answers, 1);
  assert.equal(a.words, 60);
  assert.equal(a.avgWpm, 140);
});

test('tốc độ trong khoảng tự nhiên và ít từ đệm thì thành điểm mạnh', () => {
  const a = analyzeSession([user('u1', report({ wordCount: 50, wpm: 135, fillers: { total: 1, byWord: { um: 1 } } }))]);
  assert.ok(a.strengths.some((s) => s.includes('135 từ/phút')), 'phải có điểm mạnh về tốc độ');
  assert.ok(a.strengths.some((s) => s.startsWith('Từ đệm ít')), 'phải có điểm mạnh về từ đệm');
  assert.equal(a.weaknesses.length, 0);
});

test('nói chậm, nhiều từ đệm, ngập ngừng dài và lặp từ thì thành điểm yếu kèm bước tiếp theo', () => {
  const a = analyzeSession([
    user(
      'u1',
      report({
        wordCount: 60,
        wpm: 92,
        fillers: { total: 9, byWord: { um: 5, uh: 4 } },
        pauses: { count: 3, longestMs: 4200 },
        repeated: [{ word: 'good', count: 4 }],
      }),
    ),
  ]);
  assert.ok(a.weaknesses.some((w) => w.includes('hơi chậm')));
  assert.ok(a.weaknesses.some((w) => w.includes('Từ đệm')));
  assert.ok(a.weaknesses.some((w) => w.includes('4 giây')));
  assert.ok(a.weaknesses.some((w) => w.includes('“good”')));
  assert.ok(a.nextSteps.length >= 3 && a.nextSteps.length <= 4);
});

test('tiêu chí không đo được không bị kéo về 0 khi lấy trung bình', () => {
  const a = analyzeSession([user('u1', report({ overall: 70 })), user('u2', report({ overall: 80 }))]);
  const grammar = a.dimensions.find((d) => d.key === 'grammar');
  assert.equal(grammar?.score, null);
  assert.match(grammar?.note ?? '', /Chưa chấm ngữ pháp/);
  assert.equal(a.overall, 75);
  assert.equal(typeof a.band, 'number');
});

test('điểm trung bình các lượt được tính trên tiêu chí đo được', () => {
  const a = analyzeSession([
    user('u1', report({ dimensions: [{ key: 'fluency', score: 60, note: '' }] })),
    user('u2', report({ dimensions: [{ key: 'fluency', score: 80, note: '' }] })),
  ]);
  assert.equal(a.dimensions.find((d) => d.key === 'fluency')?.score, 70);
});

test('tin nhắn gửi giám khảo luôn kết thúc bằng lượt của người học và chứa câu hỏi tiếp theo', () => {
  const turns: LiveTurn[] = [
    { id: '1', role: 'ai', text: 'Hi. Where is your hometown?' },
    { id: '2', role: 'user', text: 'It is in Hue.' },
  ];
  const msgs = examinerMessages(turns, 'What do you like most about it?');
  assert.equal(msgs[msgs.length - 1]?.role, 'user');
  assert.match(msgs[msgs.length - 1]?.content ?? '', /What do you like most about it\?/);
  assert.equal(msgs[0]?.role, 'assistant');
});

test('không có câu hỏi tiếp theo thì chỉ dẫn yêu cầu kết thúc, không hỏi thêm', () => {
  const msgs = examinerMessages([{ id: '1', role: 'user', text: 'Thanks.' }], null);
  assert.match(msgs[0]?.content ?? '', /Do not ask any new question/);
});

test('sáu câu theo đúng thứ tự thi: 3 Part 1, 1 cue card Part 2, 2 Part 3', () => {
  for (const topic of SPEAKING_TOPICS) {
    const qs = questionsOf(topic);
    assert.equal(qs.length, 6, topic.id);
    assert.deepEqual(
      qs.map((q) => q.part),
      [1, 1, 1, 2, 3, 3],
      topic.id,
    );
    assert.match(qs[3]?.text ?? '', /You should say:/, topic.id);
  }
});
