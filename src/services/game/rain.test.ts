import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pointsFor, QUESTION_MS } from '../duel/duel';
import type { StudyWord } from '../vocab/topic-study';
import {
  answerOf,
  buildRainQuestions,
  createRainGame,
  fallMs,
  PAUSE_MS,
  RAIN_HEARTS,
  type RainEvent,
  type RainGame,
  type RainQuestion,
  speedFor,
  tapRain,
  tickRain,
} from './rain';

const questions = (n: number): RainQuestion[] =>
  Array.from({ length: n }, (_, i) => ({
    word: `word${i}`,
    options: [`đúng${i}`, `sai${i}a`, `sai${i}b`, `sai${i}c`],
    correctIndex: i % 4,
  }));

const correctDrop = (g: RainGame) => g.drops.find((d) => d.correct)!;
const wrongDrops = (g: RainGame) => g.drops.filter((d) => !d.correct);

/** Chạy nhịp cho tới khi có sự kiện thoả điều kiện (hoặc hết bước). */
function runUntil(g: RainGame, pred: (ev: RainEvent) => boolean, maxSteps = 5000): { game: RainGame; events: RainEvent[] } {
  let cur = g;
  const seen: RainEvent[] = [];
  for (let i = 0; i < maxSteps; i += 1) {
    const r = tickRain(cur, 50);
    cur = r.game;
    seen.push(...r.events);
    if (r.events.some(pred)) return { game: cur, events: seen };
  }
  return { game: cur, events: seen };
}

/** Chạy cho tới khi câu sau được mở (sau nghỉ). */
function skipPause(g: RainGame): RainGame {
  let cur = g;
  for (let i = 0; i < 100 && cur.resolved && cur.status === 'playing'; i += 1) cur = tickRain(cur, 100).game;
  return cur;
}

test('bắt đúng bong bóng cộng điểm, tăng combo, trả lời đúng một lần', () => {
  const g = createRainGame(questions(3), 7);
  assert.equal(g.drops.length, 4);
  const r = tapRain(g, correctDrop(g).id);
  assert.equal(r.game.correct, 1);
  assert.equal(r.game.combo, 1);
  assert.ok(r.game.score >= 100 && r.game.score <= 150, `điểm ${r.game.score}`);
  assert.equal(r.game.hearts, RAIN_HEARTS);
  assert.equal(r.events.length, 1);
  assert.deepEqual(answerOf(r.events[0]!), { correct: true, word: 'word0' });
  // Chạm lần nữa khi câu đã xong thì không có gì xảy ra.
  assert.equal(tapRain(r.game, correctDrop(g).id).game, r.game);
});

test('bắt càng sớm càng được nhiều điểm (thưởng nhanh giống Đấu 1–1)', () => {
  const g = createRainGame(questions(2), 3);
  const early = tapRain(g, correctDrop(g).id).game.score;
  // Cùng bong bóng đúng nhưng đã rơi được 80% quãng đường.
  const late = { ...g, drops: g.drops.map((d) => (d.correct ? { ...d, age: fallMs(d.speed) * 0.8 } : d)) };
  const lateScore = tapRain(late, correctDrop(late).id).game.score;
  assert.ok(early > lateScore, `sớm ${early} muộn ${lateScore}`);
  assert.equal(early, pointsFor(true, 0));
  assert.equal(lateScore, pointsFor(true, Math.round(0.8 * QUESTION_MS)));
});

test('chạm sai bong bóng: mất một tim, combo về 0', () => {
  const g = createRainGame(questions(3), 7);
  const r = tapRain(g, wrongDrops(g)[0]!.id);
  assert.equal(r.game.hearts, RAIN_HEARTS - 1);
  assert.equal(r.game.wrong, 1);
  assert.equal(r.game.missed, 0);
  assert.equal(r.game.combo, 0);
  assert.deepEqual(answerOf(r.events[0]!), { correct: false, word: 'word0' });
});

/** Đặt tốc độ riêng cho từng bong bóng, để test một tình huống có chủ đích. */
const withSpeeds = (g: RainGame, correct: number, wrong: number): RainGame => ({
  ...g,
  drops: g.drops.map((d) => ({ ...d, speed: d.correct ? correct : wrong })),
});

test('để bong bóng đúng rơi chạm đáy: mất một tim, câu kết thúc', () => {
  const g = withSpeeds(createRainGame(questions(3), 11), 20, 5);
  const { game, events } = runUntil(g, (ev) => ev.kind === 'missed');
  assert.equal(game.hearts, RAIN_HEARTS - 1);
  assert.equal(game.missed, 1);
  assert.equal(game.combo, 0);
  assert.equal(game.resolved, true);
  const miss = events.find((e) => e.kind === 'missed')!;
  assert.deepEqual(answerOf(miss), { correct: false, word: 'word0' });
});

test('bong bóng sai chạm đáy trước thì không mất tim, và vẫn bắt được đúng', () => {
  const g = withSpeeds(createRainGame(questions(2), 5), 5, 40);
  const { game, events } = runUntil(g, (e) => e.kind === 'passed');
  assert.ok(events.some((e) => e.kind === 'passed'));
  assert.equal(game.hearts, RAIN_HEARTS);
  assert.equal(game.resolved, false);
  const caught = tapRain(game, correctDrop(game).id);
  assert.equal(caught.game.hearts, RAIN_HEARTS);
  assert.equal(caught.game.correct, 1);
});

test('combo tăng khi bắt liên tiếp và reset khi sai', () => {
  let g = createRainGame(questions(5), 9);
  g = tapRain(g, correctDrop(g).id).game;
  assert.equal(g.combo, 1);
  g = skipPause(g);
  assert.equal(g.qIndex, 1);
  g = tapRain(g, correctDrop(g).id).game;
  assert.equal(g.combo, 2);
  assert.equal(g.bestCombo, 2);
  g = skipPause(g);
  g = tapRain(g, wrongDrops(g)[0]!.id).game;
  assert.equal(g.combo, 0);
  assert.equal(g.bestCombo, 2, 'bestCombo giữ mức cao nhất');
  g = skipPause(g);
  g = tapRain(g, correctDrop(g).id).game;
  assert.equal(g.combo, 1, 'sau khi reset, bắt lại từ 1');
});

test('hết mười câu thì thắng', () => {
  let g = createRainGame(questions(3), 13);
  let answered = 0;
  for (let i = 0; i < 3; i += 1) {
    const r = tapRain(g, correctDrop(g).id);
    answered += r.events.filter((e) => answerOf(e)).length;
    g = skipPause(r.game);
  }
  assert.equal(g.status, 'won');
  assert.equal(g.hearts, RAIN_HEARTS);
  assert.equal(g.correct, 3);
  assert.equal(answered, 3);
});

test('hết tim thì thua ngay, và các câu chưa hỏi không tới nữa', () => {
  let g = createRainGame(questions(10), 21);
  let last: RainEvent[] = [];
  for (let i = 0; i < RAIN_HEARTS; i += 1) {
    const r = tapRain(g, wrongDrops(g)[0]!.id);
    last = r.events;
    g = i < RAIN_HEARTS - 1 ? skipPause(r.game) : r.game;
  }
  assert.equal(g.status, 'lost');
  assert.equal(g.hearts, 0);
  assert.ok(last.some((e) => e.kind === 'lost'));
  assert.equal(g.qIndex, RAIN_HEARTS - 1);
  assert.deepEqual(tickRain(g, 100).game, g, 'thua rồi thì nhịp không đổi gì');
});

test('mỗi câu đúng một sự kiện trả lời, cả khi bắt, chạm sai và để rơi', () => {
  const qs = questions(4);
  let g = createRainGame(qs, 31);
  let answers = 0;
  const plan = ['catch', 'miss', 'catch', 'wrong'] as const;
  for (const step of plan) {
    if (step === 'catch') {
      const r = tapRain(g, correctDrop(g).id);
      answers += r.events.filter((e) => answerOf(e)).length;
      g = r.game;
    } else if (step === 'wrong') {
      const r = tapRain(g, wrongDrops(g)[0]!.id);
      answers += r.events.filter((e) => answerOf(e)).length;
      g = r.game;
    } else {
      const r = runUntil(g, (e) => e.kind === 'missed');
      answers += r.events.filter((e) => answerOf(e)).length;
      g = r.game;
    }
    g = skipPause(g);
  }
  assert.equal(answers, 4);
  assert.equal(g.status, 'won');
});

test('tốc độ rơi tăng dần theo câu', () => {
  assert.ok(speedFor(9) > speedFor(0));
  assert.ok(fallMs(speedFor(9)) < fallMs(speedFor(0)));
  // Mỗi bong bóng của câu đầu đều có tốc độ trong khoảng quanh tốc độ câu đó.
  const g = createRainGame(questions(2), 4);
  for (const d of g.drops) assert.ok(d.speed >= speedFor(0) * 0.85 && d.speed <= speedFor(0) * 1.15);
});

test('nghỉ giữa câu đúng bằng PAUSE_MS', () => {
  const g = createRainGame(questions(2), 2);
  const r = tapRain(g, correctDrop(g).id);
  assert.equal(r.game.pauseLeft, PAUSE_MS);
  let cur = r.game;
  for (let i = 0; i < PAUSE_MS / 100 - 1; i += 1) cur = tickRain(cur, 100).game;
  assert.equal(cur.qIndex, 0, 'còn nghỉ thì chưa sang câu sau');
  const next = tickRain(cur, 100);
  assert.equal(next.game.qIndex, 1);
  assert.deepEqual(next.events, [{ kind: 'next', qIndex: 1 }]);
});

test('buildRainQuestions: bốn phương án khác nhau, đáp án đúng ở correctIndex', () => {
  const words: StudyWord[] = Array.from({ length: 12 }, (_, i) => ({
    word: `term${i}`,
    pos: 'n',
    ipa: '',
    meaningVi: `nghĩa ${i}`,
    definitionEn: '',
    example: '',
    collocation: '',
    band: '6-7',
  }));
  const qs = buildRainQuestions(words, 99);
  assert.equal(qs.length, 10);
  for (const q of qs) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    const idx = Number(q.word.replace('term', ''));
    assert.equal(q.options[q.correctIndex], `nghĩa ${idx}`);
  }
  assert.deepEqual(buildRainQuestions(words, 99), qs, 'cùng hạt, cùng bộ câu');
});

test('buildRainQuestions: bộ có nghĩa trùng nhau thì bỏ câu không đủ bốn phương án', () => {
  const same = (w: string): StudyWord => ({ word: w, pos: 'n', ipa: '', meaningVi: 'giống nhau', definitionEn: '', example: '', collocation: '', band: '6-7' });
  assert.equal(buildRainQuestions([same('a'), same('b'), same('c'), same('d')], 1).length, 0);
});
