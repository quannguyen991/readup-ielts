import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  directionFor,
  optionOf,
  promptOf,
  filterWords,
  clozeOf,
  isTypedCorrect,
  makeWordChoices,
  synonymMatch,
  letterDiff,
  makeChoices,
  normalizeAnswer,
  topUpRound,
  MIN_ROUND,
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

test('chiều Anh → Anh: đề là từ tiếng Anh, phương án là định nghĩa tiếng Anh', () => {
  const w = { word: 'habitat', meaningVi: 'môi trường sống', definitionEn: 'the natural home of an animal or plant' };
  assert.equal(promptOf(w, 'enToEn'), 'habitat');
  assert.equal(optionOf(w, 'enToEn'), 'the natural home of an animal or plant');
  assert.equal(optionOf(w, 'enToVi'), 'môi trường sống');
  assert.equal(optionOf(w, 'viToEn'), 'habitat');
  assert.equal(promptOf(w, 'viToEn'), 'môi trường sống');
  const seen = new Set(Array.from({ length: 6 }, (_, s) => directionFor('habitat', s, ['enToEn', 'viToEn'], 'mcq')));
  assert.deepEqual([...seen].sort(), ['enToEn', 'viToEn']);
  // Gõ từ không hỏi chiều thấy từ tiếng Anh, kể cả Anh → Anh.
  assert.equal(directionFor('habitat', 0, ['enToEn'], 'type'), 'viToEn');
});

test('điền chỗ trống kiểu THPT: bốn từ khác nhau, ưu tiên cùng từ loại', () => {
  const pool = [
    { ...W('habitat', 'môi trường sống'), pos: 'noun' },
    { ...W('species', 'loài'), pos: 'noun' },
    { ...W('predator', 'kẻ săn mồi'), pos: 'noun' },
    { ...W('prey', 'con mồi'), pos: 'noun' },
    { ...W('adapt', 'thích nghi'), pos: 'verb' },
    { ...W('migrate', 'di cư'), pos: 'verb' },
  ];
  for (let seed = 1; seed < 20; seed += 1) {
    const { options, correctIndex } = makeWordChoices(pool[0]!, pool, seededRng(seed));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.equal(options[correctIndex], 'habitat');
    assert.ok(options.every((o) => pool.find((w) => w.word === o)!.pos === 'noun'), `seed ${seed}: ${options.join(', ')}`);
  }
});

test('chấp nhận từ đồng nghĩa chỉ khi khớp đúng một từ trong danh sách', () => {
  const w = { synonyms: ['traineeship', 'internship'] };
  assert.equal(synonymMatch(' Internship. ', w), 'internship');
  assert.equal(synonymMatch('intern', w), null);
  assert.equal(synonymMatch('', w), null);
  assert.equal(synonymMatch('anything', {}), null);
});

test('vòng học bù đủ tối thiểu 30 từ từ bộ, không trùng và giữ thứ tự vòng cũ', () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ word: 'w' + i })) as never[];
  const round = [pool[5], pool[2]] as never[];
  const out = topUpRound(round, pool) as { word: string }[];
  assert.equal(out.length, MIN_ROUND);
  assert.deepEqual(out.slice(0, 2).map((w) => w.word), ['w5', 'w2']);
  assert.equal(new Set(out.map((w) => w.word)).size, out.length);
});

test('bộ nhỏ hơn 30 từ thì vòng là cả bộ', () => {
  const pool = Array.from({ length: 12 }, (_, i) => ({ word: 'w' + i })) as never[];
  assert.equal(topUpRound([pool[0]] as never[], pool).length, 12);
});
