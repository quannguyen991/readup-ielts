import test from 'node:test';
import assert from 'node:assert/strict';

import { rubricFor } from '@/components/reader/QuestionBlocks';
import { RULE_SUPPORTED_TYPES } from './blueprint';
import {
  DEFAULT_MIXES,
  IELTS_TYPES_ALL,
  IELTS_TYPE_SPECS,
  PASSAGE_TOTAL,
  buildMix,
  canGenerate,
  defaultMixFor,
  shortLabel,
  specOf,
} from './ielts-types';
import { generateMixSet, sanitizeRemote } from './remote';
import { FIXTURE_PARAGRAPHS as P } from './fixture-passage';
import { QUESTION_TYPE_LABEL, type GeneratedQuestion } from './types';
import { blocksKey, sanitizeBlocks } from './mix';
import { BLOCK_RUBRIC } from './blueprint';
import { buildBlock } from './block-build';

test('bộ dạng IELTS đủ 15 dạng, mỗi dạng có nhãn, lời dẫn và nhãn tắt', () => {
  assert.equal(IELTS_TYPES_ALL.length, 15);
  for (const spec of IELTS_TYPE_SPECS) {
    assert.ok(QUESTION_TYPE_LABEL[spec.type], spec.type);
    assert.ok(BLOCK_RUBRIC[spec.type], spec.type);
    assert.ok(shortLabel(spec.type).length > 0);
    assert.ok(spec.minCount <= spec.defaultCount && spec.defaultCount <= spec.maxCount, spec.type);
  }
  // Mọi dạng của bộ sinh luật đều nằm trong bộ IELTS.
  for (const t of RULE_SUPPORTED_TYPES) assert.ok(IELTS_TYPES_ALL.includes(t), t);
});

test('buildMix chia đúng 13 câu và không vượt [min,max] của dạng', () => {
  for (const types of [
    ['true_false_not_given', 'note_completion', 'short_answer'],
    ['matching_headings', 'multiple_choice', 'sentence_completion'],
    ['yes_no_not_given', 'matching_features', 'multiple_choice_multi'],
    ['table_completion'],
    ['true_false_not_given', 'yes_no_not_given'],
  ] as const) {
    const mix = buildMix(types);
    for (const b of mix) {
      const s = specOf(b.type)!;
      assert.ok(b.count >= s.minCount && b.count <= s.maxCount, `${b.type}=${b.count}`);
    }
    const total = mix.reduce((a, b) => a + b.count, 0);
    // Một dạng đơn lẻ có thể không đủ 13 (trần của dạng); còn lại phải đúng 13.
    if (types.length > 1 && types.length <= 3) assert.equal(total, PASSAGE_TOTAL, types.join('+'));
  }
});

test('mọi bố cục mặc định là ba dạng và đủ 13 câu', () => {
  for (const pos of [1, 2, 3] as const) {
    for (const types of DEFAULT_MIXES[pos]) {
      assert.equal(types.length, 3);
      assert.equal(buildMix(types).reduce((a, b) => a + b.count, 0), PASSAGE_TOTAL);
    }
  }
});

test('defaultMixFor tất định, và bài ngắn không bị xếp dạng đòi nhiều đoạn', () => {
  const a = defaultMixFor(2, 'abc', { paragraphs: 6, words: 900 });
  const b = defaultMixFor(2, 'abc', { paragraphs: 6, words: 900 });
  assert.deepEqual(a, b);
  const short = defaultMixFor(2, 'abc', { paragraphs: 2, words: 200 });
  assert.ok(short.every((m) => canGenerate(m.type, { paragraphs: 2, words: 200 })));
});

test('canGenerate: nối tiêu đề đòi nhiều đoạn', () => {
  assert.equal(canGenerate('matching_headings', { paragraphs: 3, words: 800 }), false);
  assert.equal(canGenerate('matching_headings', { paragraphs: 6, words: 800 }), true);
  assert.equal(canGenerate('true_false_not_given', { paragraphs: 1, words: 120 }), true);
});

test('sanitizeBlocks siết bộ trộn từ client', () => {
  assert.equal(sanitizeBlocks(undefined), undefined);
  assert.equal(sanitizeBlocks([]), undefined);
  assert.equal(sanitizeBlocks('x'), null);
  assert.equal(sanitizeBlocks([{ type: 'sat_inference', count: 3 }]), null);
  assert.equal(sanitizeBlocks([{ type: 'matching_headings', count: 3 }, { type: 'matching_headings', count: 3 }]), null);
  assert.equal(sanitizeBlocks(new Array(5).fill({ type: 'short_answer', count: 3 })), null);
  assert.deepEqual(sanitizeBlocks([{ type: 'matching_headings', count: 99 }]), [{ type: 'matching_headings', count: 7 }]);
  const twenty = sanitizeBlocks([
    { type: 'matching_headings', count: 7 },
    { type: 'summary_completion', count: 7 },
    { type: 'multiple_choice', count: 6 },
  ]);
  assert.equal(twenty?.length, 3); // đúng 20 câu là trần, vẫn hợp lệ
  assert.equal(
    sanitizeBlocks([
      { type: 'matching_headings', count: 7 },
      { type: 'summary_completion', count: 7 },
      { type: 'multiple_choice', count: 6 },
      { type: 'short_answer', count: 6 },
    ]),
    null,
  );
});

test('blocksKey ổn định', () => {
  assert.equal(blocksKey([{ type: 'short_answer', count: 4 }]), 'mix:short_answerx4');
});

test('rubricFor: lời dẫn theo nội dung khối (giới hạn số từ, bảng từ, Choose TWO)', () => {
  const base = (over: Partial<GeneratedQuestion>): GeneratedQuestion => ({
    id: 'x', orderIndex: 0, type: 'table_completion', prompt: 'p', instruction: null, options: null,
    correctAnswer: 'a', evidenceText: 'e', evidenceParagraphIndex: 0, explanation: '', lessonTip: null, ...over,
  });
  assert.match(rubricFor({ type: 'table_completion', questions: [base({ maxWords: 1 })] }), /ONE WORD ONLY/);
  assert.match(rubricFor({ type: 'table_completion', questions: [base({ maxWords: 2 })] }), /TWO WORDS/);
  assert.match(rubricFor({ type: 'summary_completion', questions: [base({ type: 'summary_completion', options: ['a', 'b', 'c', 'd', 'e'] })] }), /list of words, A-E/);
  assert.match(rubricFor({ type: 'multiple_choice_multi', questions: [base({ type: 'multiple_choice_multi', options: ['a', 'b', 'c', 'd', 'e'] }), base({ type: 'multiple_choice_multi' })] }), /Choose TWO letters, A-E/);
  assert.match(rubricFor({ type: 'sentence_completion', questions: [base({ type: 'sentence_completion', maxWords: 2 })] }), /TWO WORDS/);
});

/* ----------------------------------------------- tạo đề theo bộ trộn (proxy giả) */

function fakeResponse(questions: unknown[]): typeof fetch {
  return (async () => new Response(JSON.stringify({ questions }), { status: 200 })) as unknown as typeof fetch;
}

const tableBlock = buildBlock(
  'table_completion',
  {
    form: { title: 'T', lines: ['A | B | C', 'x | {{1}} | y', 'z | {{2}} | w', 'u | {{3}} | v'] },
    word_limit: 2,
    questions: [
      { answer: 'France', evidence_text: 'The first large scheme was built at La Rance in France in 1966.' },
      { answer: 'habitats', evidence_text: 'which can damage habitats for wading birds' },
      { answer: 'seals', evidence_text: 'no harm to nearby seals' },
    ],
  },
  { articleId: 'a', paragraphs: P, startIndex: 0, blockKey: '1' },
).questions;

const art = { id: 'a', title: 'Tidal', paragraphs: P, passageTier: 'p2', inLibrary: true };

test('generateMixSet: khối thành công được đánh lại id để không trùng giữa khối', async () => {
  const progress: number[] = [];
  const r = await generateMixSet(
    art,
    [
      { type: 'table_completion', count: 3 },
      { type: 'table_completion', count: 3 },
    ],
    { fetchImpl: fakeResponse(tableBlock), onProgress: (d) => progress.push(d) },
  );
  assert.ok(r.set);
  assert.equal(r.set.questions.length, 6);
  assert.equal(new Set(r.set.questions.map((q) => q.id)).size, 6);
  assert.equal(new Set(r.set.questions.map((q) => q.groupId)).size, 2);
  assert.equal(r.set.generatedBy, 'ai');
  assert.deepEqual(progress.sort(), [1, 2]);
});

test('generateMixSet: máy chủ lỗi thì dạng luật làm được lùi về bộ luật, dạng khác báo thiếu', async () => {
  const failing = (async () => new Response('{}', { status: 502 })) as unknown as typeof fetch;
  const r = await generateMixSet(
    { ...art, paragraphs: LONG },
    [
      { type: 'true_false_not_given', count: 3 },
      { type: 'matching_headings', count: 4 },
    ],
    { fetchImpl: failing },
  );
  assert.ok(r.failed.includes('matching_headings'));
  assert.equal(r.usedFallback, r.set !== null);
  if (r.set) assert.ok(r.set.questions.every((q) => q.type === 'true_false_not_given'));
});

test('generateMixSet: không khối nào dùng được thì set null và lời nhắn chung', async () => {
  const failing = (async () => {
    throw new Error('mạng chết primary.invalid');
  }) as unknown as typeof fetch;
  const r = await generateMixSet(art, [{ type: 'table_completion', count: 4 }], { fetchImpl: failing });
  assert.equal(r.set, null);
  assert.deepEqual(r.failed, ['table_completion']);
  assert.ok(r.message && !/invalid/.test(r.message));
});

test('sanitizeRemote bỏ câu sai hình dạng, sai dạng và nhóm thiếu thành viên', () => {
  const good = tableBlock;
  assert.equal(sanitizeRemote(good, 'table_completion').length, 3);
  assert.equal(sanitizeRemote(good, 'note_completion').length, 0);
  assert.equal(sanitizeRemote([{ id: 1 }], 'table_completion').length, 0);
  assert.equal(sanitizeRemote('x', 'table_completion').length, 0);
  // Mất một thành viên của nhóm → bỏ cả nhóm.
  assert.equal(sanitizeRemote(good.slice(1), 'table_completion').length, 0);
});

const LONG: string[] = [
  ...P,
  'The oceans cover most of the planet. They moderate the climate, supply food and shape the economies of many nations. Coastal communities depend on healthy fish stocks for their income and for their diets.',
  'Marine scientists study the way heat moves through the water. They use floating sensors that report temperature and salinity every ten days. These records have revealed that deep layers are warming faster than expected.',
];
