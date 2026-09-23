import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  advanceQueue,
  directionFor,
  filterWords,
  GAP_CONFIRM,
  GAP_WRONG,
  isFinalKind,
  passesStage,
  clozeOf,
  initialQueue,
  isTypedCorrect,
  letterDiff,
  makeChoices,
  normalizeAnswer,
  pickRound,
  seededRng,
  type StudyWord,
} from './topic-study';

const W = (word: string, meaningVi: string): StudyWord => ({
  word,
  meaningVi,
  pos: 'noun',
  ipa: '',
  definitionEn: '',
  example: '',
  collocation: '',
  band: '5-6',
});

const POOL = [W('habitat', 'môi trường sống'), W('species', 'loài'), W('predator', 'kẻ săn mồi'), W('prey', 'con mồi'), W('den', 'hang')];

test('gõ đáp án: bỏ qua hoa thường, khoảng trắng và dấu câu ở hai đầu', () => {
  assert.equal(normalizeAnswer('  Habitat. '), 'habitat');
  assert.ok(isTypedCorrect('HABITAT', 'habitat'));
  assert.ok(!isTypedCorrect('habitats', 'habitat'));
  assert.ok(!isTypedCorrect('   ', 'habitat'), 'Ô trống không được tính là đúng.');
});

test('so từng chữ cái cho Nghe chép', () => {
  const d = letterDiff('habitet', 'habitat');
  assert.deepEqual(d.map((x) => x.ok), [true, true, true, true, true, false, true]);
});

test('bốn lựa chọn khác nhau, có đáp án đúng', () => {
  for (let seed = 0; seed < 50; seed += 1) {
    const { options, correctIndex } = makeChoices(POOL[0]!, POOL, (w) => w.meaningVi, seededRng(seed));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.equal(options[correctIndex], 'môi trường sống');
  }
});

test('lựa chọn trùng nghĩa bị loại', () => {
  const pool = [...POOL, W('lair', 'hang')];
  for (let seed = 0; seed < 50; seed += 1) {
    const { options } = makeChoices(pool[0]!, pool, (w) => w.meaningVi, seededRng(seed));
    assert.equal(new Set(options).size, options.length);
  }
});

test('khoét từ khỏi câu ví dụ, kể cả dạng chia', () => {
  assert.deepEqual(clozeOf('Natural habitats are shrinking.', 'habitat'), { before: 'Natural ', answer: 'habitats', after: ' are shrinking.' });
  assert.equal(clozeOf('Birds migrate south in winter.', 'migrate')?.answer, 'migrate');
  assert.equal(clozeOf('The birds migrated early.', 'migrate')?.answer, 'migrated');
  assert.equal(clozeOf('Many species adapt quickly.', 'habitat'), null, 'Từ không có trong câu thì không khoét.');
  // Không khoét giữa một từ khác: "act" không được trúng "fact".
  assert.equal(clozeOf('It is a fact.', 'act'), null);
  // Đuôi phái sinh là một từ khác, không khoét.
  assert.equal(clozeOf('The negotiators met today.', 'negotiate'), null);
  assert.equal(clozeOf('They conferred at length.', 'confer')?.answer, 'conferred');
  assert.equal(clozeOf('Prices rise as supplies dry up.', 'supply')?.answer, 'supplies');
});

test('một vòng ưu tiên từ chưa thuộc, học hết thì ôn lại', () => {
  const stages: Record<string, 0 | 1 | 2> = { habitat: 2, species: 1 };
  assert.deepEqual(pickRound(POOL, (w) => stages[w] ?? 0, 3).map((w) => w.word), ['species', 'predator', 'prey']);
  assert.equal(pickRound(POOL, () => 2, 3).length, 3);
});

test('hàng đợi Học: lật thẻ → trắc nghiệm → điền từ', () => {
  let q = initialQueue(POOL.slice(0, 4));
  assert.equal(q[0]?.kind, 'flash');
  q = advanceQueue(q, true);
  assert.deepEqual(q.map((i) => `${i.word}:${i.kind}`), ['species:flash', 'predator:flash', 'prey:flash', 'habitat:mcq']);
  let guard = 0;
  let typed = 0;
  while (q.length > 0 && guard < 80) {
    if ((q[0]!.kind as string) === 'type') typed += 1;
    q = advanceQueue(q, true);
    guard += 1;
  }
  assert.equal(q.length, 0);
  assert.equal(typed, 4, 'Làm đúng hết thì mỗi từ qua phần điền từ đúng một lần.');
});

test('sai thì gặp lại sớm, sửa đúng thì còn một lần xác nhận ở xa hơn', () => {
  const words = POOL.slice(0, 5);
  let q = initialQueue(words, ['mcq']);
  q = advanceQueue(q, false, ['mcq']);
  assert.deepEqual(q[GAP_WRONG], { word: 'habitat', kind: 'mcq', lapse: 'retry' }, 'Câu sai quay lại sau hai câu.');
  // Làm đúng hai câu chen giữa, rồi sửa đúng câu sai.
  q = advanceQueue(q, true, ['mcq']);
  q = advanceQueue(q, true, ['mcq']);
  assert.equal(q[0]?.word, 'habitat');
  assert.ok(!passesStage(q[0]!), 'Lần hỏi lại ngay sau khi sai chưa tính là qua.');
  q = advanceQueue(q, true, ['mcq']);
  const at = q.findIndex((i) => i.word === 'habitat');
  assert.equal(q[at]?.lapse, 'confirm');
  assert.equal(at, Math.min(GAP_CONFIRM, q.length - 1), 'Lần xác nhận đặt xa hơn lần hỏi lại.');
  // Xác nhận đúng thì từ xong.
  let guard = 0;
  while (q.length > 0 && guard < 30) {
    q = advanceQueue(q, true, ['mcq']);
    guard += 1;
  }
  assert.equal(q.length, 0);
});

test('không bao giờ hỏi lại ngay câu vừa sai khi còn câu khác', () => {
  let q = initialQueue(POOL.slice(0, 2), ['mcq']);
  q = advanceQueue(q, false, ['mcq']);
  assert.equal(q[0]?.word, 'species');
});

test('tắt bớt phần thì từ bỏ qua phần đó', () => {
  const kinds = ['type', 'mcq'] as const;
  let q = initialQueue(POOL.slice(0, 1), kinds);
  assert.equal(q[0]?.kind, 'mcq', 'Thứ tự học luôn theo lật thẻ → trắc nghiệm → điền từ.');
  q = advanceQueue(q, true, kinds);
  assert.equal(q[0]?.kind, 'type');
  assert.ok(isFinalKind('type', kinds));
  assert.deepEqual(advanceQueue(q, true, kinds), []);
  // Không bật phần nào: không để vòng rỗng.
  assert.equal(initialQueue(POOL.slice(0, 1), [])[0]?.kind, 'flash');
});

test('lọc từ gắn sao và từ chưa thuộc', () => {
  const stages: Record<string, 0 | 1 | 2> = { habitat: 2 };
  const star = new Set(['habitat', 'prey']);
  const of = (w: string) => stages[w] ?? 0;
  assert.deepEqual(filterWords(POOL, { starredOnly: true, unmasteredOnly: false }, of, star).map((w) => w.word), ['habitat', 'prey']);
  assert.deepEqual(filterWords(POOL, { starredOnly: true, unmasteredOnly: true }, of, star).map((w) => w.word), ['prey']);
});

test('điền từ không hỏi theo chiều thấy từ tiếng Anh', () => {
  for (let step = 0; step < 10; step += 1) {
    assert.notEqual(directionFor('habitat', step, ['enToVi', 'viToEn'], 'type'), 'enToVi');
    assert.equal(directionFor('habitat', step, ['enToVi'], 'type'), 'viToEn');
  }
  const seen = new Set(Array.from({ length: 6 }, (_, s) => directionFor('habitat', s, ['enToVi', 'viToEn', 'listen'], 'mcq')));
  assert.equal(seen.size, 3, 'Trắc nghiệm phải xoay đủ các chiều đang bật.');
});
