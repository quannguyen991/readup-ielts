import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBlock, findParagraph, sentenceContaining, type RawBlock } from './block-build';
import { FIXTURE_PARAGRAPHS as P } from './fixture-passage';

const ctx = { articleId: 'a1', paragraphs: P, startIndex: 0, blockKey: '1' };

type Q = { answer: string; evidence_text: string; prompt?: string };

/* ------------------------------------------------------------ nối tiêu đề */

const headingsOk = (): RawBlock => ({
  options: [
    'Why the sea is a reliable power source',
    'An early barrage and its output',
    'The ecological cost of damming estuaries',
    'Smaller machines with a lighter footprint',
    'Evidence from a field trial',
    'Funding the sea-bed future',
    'A rival to offshore wind',
  ],
  questions: [
    { answer: 'Smaller machines with a lighter footprint', evidence_text: 'Because they do not block the estuary, they disturb marine life far less.' },
    { answer: 'An early barrage and its output', evidence_text: 'The first large scheme was built at La Rance in France in 1966.' },
    { answer: 'The ecological cost of damming estuaries', evidence_text: 'Barrages have drawbacks.' },
    { answer: 'Evidence from a field trial', evidence_text: 'Over twelve months it supplied power to roughly 2,000 homes' },
  ],
});

test('nối tiêu đề: nhiều tiêu đề hơn câu, xếp theo thứ tự đoạn, nhãn Paragraph', () => {
  const r = buildBlock('matching_headings', headingsOk(), ctx);
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 4);
  assert.deepEqual(
    r.questions.map((q) => q.prompt),
    ['Paragraph B', 'Paragraph C', 'Paragraph D', 'Paragraph E'],
  );
  assert.ok((r.questions[0]?.options?.length ?? 0) > r.questions.length);
  assert.equal(r.questions[0]?.correctAnswer, 'An early barrage and its output');
});

test('nối tiêu đề: tiêu đề không nhiều hơn số câu thì bị loại cả khối', () => {
  const raw = headingsOk();
  raw.options = (raw.options as string[]).slice(0, 4);
  const r = buildBlock('matching_headings', raw, ctx);
  assert.equal(r.questions.length, 0);
  assert.ok(r.problems.some((p) => p.includes('tiêu đề')));
});

test('nối tiêu đề: đáp án ngoài danh sách bị bỏ, còn lại vẫn dùng được nếu đủ 3 câu', () => {
  const raw = headingsOk();
  (raw.questions as Q[])[0]!.answer = 'Một tiêu đề không có thật';
  const r = buildBlock('matching_headings', raw, ctx);
  assert.equal(r.questions.length, 3);
  assert.ok(r.questions.every((q) => q.correctAnswer !== 'Một tiêu đề không có thật'));
});

test('nối tiêu đề: tiêu đề chép chữ mở đầu đoạn bị chặn', () => {
  const raw = headingsOk();
  const copy = 'The first large scheme was built at La Rance in France';
  (raw.options as string[])[1] = copy;
  (raw.questions as Q[])[1]!.answer = copy;
  const r = buildBlock('matching_headings', raw, ctx);
  assert.ok(r.problems.some((p) => p.includes('chép chữ mở đầu')));
  assert.ok(r.questions.every((q) => q.correctAnswer !== copy));
});

/* --------------------------------------------------------- nối đặc điểm */

test('nối đặc điểm: hợp lệ, đáp án trong danh sách, dùng nhiều mục', () => {
  const r = buildBlock(
    'matching_features',
    {
      options: ['La Rance barrage', 'Underwater turbine arrays', 'Edinburgh trial'],
      questions: [
        { prompt: 'Changed how mud moves through the estuary', answer: 'La Rance barrage', evidence_text: 'They alter the flow of silt, which can damage habitats for wading birds' },
        { prompt: 'Can be grouped into clusters', answer: 'Underwater turbine arrays', evidence_text: 'engineers can install them in clusters called arrays' },
        { prompt: 'Produced power across a full year', answer: 'Edinburgh trial', evidence_text: 'Over twelve months it supplied power to roughly 2,000 homes' },
      ],
    },
    ctx,
  );
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 3);
});

test('nối đặc điểm: mọi câu cùng một đáp án thì loại', () => {
  const same = { answer: 'La Rance barrage', evidence_text: 'Barrages have drawbacks.' };
  const r = buildBlock(
    'matching_features',
    {
      options: ['La Rance barrage', 'Underwater turbine arrays', 'Edinburgh trial'],
      questions: [{ prompt: 'one two three four', ...same }, { prompt: 'five six seven eight', ...same }, { prompt: 'nine ten eleven twelve', ...same }],
    },
    ctx,
  );
  assert.equal(r.questions.length, 0);
});

/* ------------------------------------------------------------ vế câu */

test('nối vế câu: cần nhiều vế sau hơn câu, mỗi vế một lần', () => {
  const raw: RawBlock = {
    options: ['because the tides are predictable', 'despite its high cost', 'by using small turbines', 'after funding arrived', 'when seals were harmed'],
    questions: [
      { prompt: 'Engineers favour tidal power', answer: 'because the tides are predictable', evidence_text: 'the movement of the sea is entirely predictable' },
      { prompt: 'Arrays disturb marine life less', answer: 'by using small turbines', evidence_text: 'These devices resemble wind turbines but are much smaller' },
      { prompt: 'Supporters stay optimistic', answer: 'despite its high cost', evidence_text: 'Supporters believe costs will fall as the industry matures' },
    ],
  };
  const r = buildBlock('matching_sentence_endings', raw, ctx);
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 3);
  const bad = buildBlock('matching_sentence_endings', { ...raw, options: (raw.options as string[]).slice(0, 3) }, ctx);
  assert.equal(bad.questions.length, 0);
});

/* ------------------------------------------------------------ chọn hai */

const multiOk = (): RawBlock => ({
  prompt: 'Which TWO of the following are stated about tidal barrages?',
  options: [
    'They can harm habitats for wading birds',
    'They are cheap to construct',
    'They contain turbines driven by moving water',
    'They are placed in open ocean',
    'They produce no electricity in winter',
  ],
  answers: [
    { answer: 'They contain turbines driven by moving water', evidence_text: 'turbines inside the barrage spin as water flows in and out' },
    { answer: 'They can harm habitats for wading birds', evidence_text: 'They alter the flow of silt, which can damage habitats for wading birds' },
  ],
  explanation: 'x',
});

test('Choose TWO: hai câu chung groupId, chung phương án, đáp án theo thứ tự phương án', () => {
  const r = buildBlock('multiple_choice_multi', multiOk(), ctx);
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 2);
  assert.equal(new Set(r.questions.map((q) => q.groupId)).size, 1);
  assert.equal(r.questions[0]?.correctAnswer, 'They can harm habitats for wading birds');
  assert.equal(r.questions[0]?.options?.length, 5);
});

test('Choose TWO: đáp án trùng, ngoài phương án hoặc quá ít phương án thì loại', () => {
  const dup = multiOk();
  (dup.answers as { answer: string }[])[1]!.answer = 'They contain turbines driven by moving water';
  assert.equal(buildBlock('multiple_choice_multi', dup, ctx).questions.length, 0);
  const out = multiOk();
  (out.answers as { answer: string }[])[1]!.answer = 'Không có phương án này';
  assert.equal(buildBlock('multiple_choice_multi', out, ctx).questions.length, 0);
  const few = multiOk();
  few.options = (few.options as string[]).slice(0, 3);
  assert.equal(buildBlock('multiple_choice_multi', few, ctx).questions.length, 0);
});

/* -------------------------------------------------------------- bảng */

const tableOk = (): RawBlock => ({
  form: {
    title: 'Tidal schemes',
    lines: [
      'Scheme | Location | Key feature',
      'La Rance | {{1}} | uses a barrage',
      'Prototype array | Edinburgh | supplied about {{2}} homes',
      'Silt effect | Wading birds | harm to {{3}}',
    ],
  },
  word_limit: 2,
  questions: [
    { answer: 'France', evidence_text: 'The first large scheme was built at La Rance in France in 1966.' },
    { answer: '2,000', evidence_text: 'Over twelve months it supplied power to roughly 2,000 homes' },
    { answer: 'habitats', evidence_text: 'which can damage habitats for wading birds' },
  ],
});

test('bảng: ô trống khớp đáp án, form ở câu đầu, maxWords, prompt lấy từ dòng', () => {
  const r = buildBlock('table_completion', tableOk(), ctx);
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0]?.form?.kind, 'table');
  assert.equal(r.questions[1]?.form, undefined);
  assert.equal(r.questions[0]?.maxWords, 2);
  assert.ok(r.questions[0]?.prompt.includes('________'));
  assert.equal(new Set(r.questions.map((q) => q.groupId)).size, 1);
});

test('điền khuôn: đáp án phải nguyên văn trong bài', () => {
  const raw = tableOk();
  (raw.questions as Q[])[2]!.answer = 'coral';
  const r = buildBlock('table_completion', raw, ctx);
  assert.equal(r.questions.length, 0);
  assert.ok(r.problems.some((p) => p.includes('không có trong bài')));
});

test('điền khuôn: đáp án vượt word_limit hoặc lặp thì loại cả nhóm', () => {
  const dup = tableOk();
  (dup.questions as Q[])[2] = { answer: 'France', evidence_text: 'The first large scheme was built at La Rance in France in 1966.' };
  assert.equal(buildBlock('table_completion', dup, ctx).questions.length, 0);
  const long = tableOk();
  (long.questions as Q[])[2] = { answer: 'the flow of silt', evidence_text: 'They alter the flow of silt, which can damage habitats for wading birds' };
  assert.equal(buildBlock('table_completion', long, ctx).questions.length, 0);
});

test('điền khuôn: ô trống {{k}} không khớp số đáp án thì loại', () => {
  const raw = tableOk();
  (raw.questions as Q[]).pop(); // 2 đáp án nhưng khuôn có 3 ô
  assert.equal(buildBlock('table_completion', raw, ctx).questions.length, 0);
});

test('bảng: hàng lệch số ô thì loại', () => {
  const raw = tableOk();
  (raw.form as { lines: string[] }).lines[1] = 'La Rance | {{1}}';
  assert.equal(buildBlock('table_completion', raw, ctx).questions.length, 0);
});

/* ------------------------------------------- sơ đồ, ghi chú, bảng từ */

test('flow-chart: các bước theo thứ tự, mỗi ô trống một đáp án', () => {
  const r = buildBlock(
    'flow_chart_completion',
    {
      form: {
        title: 'How a barrage plant works',
        lines: [
          'A barrage is built across the {{1}}',
          'Water flows through gates as the tide rises',
          'The incoming tide spins {{2}} inside the barrage',
          'The plant yields electricity for the grid',
          'Output reaches about {{3}} gigawatt hours yearly',
        ],
      },
      word_limit: 1,
      questions: [
        { answer: 'estuary', evidence_text: 'It uses a barrage across the estuary' },
        { answer: 'turbines', evidence_text: 'turbines inside the barrage spin as water flows in and out' },
        { answer: '500', evidence_text: 'The plant produces about 500 gigawatt hours of electricity each year.' },
      ],
    },
    ctx,
  );
  assert.deepEqual(r.problems, []);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0]?.form?.kind, 'flow');
});

test('summary có bảng từ: đáp án phải nằm trong bảng và bảng nhiều hơn chỗ trống', () => {
  const base: RawBlock = {
    form: {
      title: 'Summary',
      lines: [
        'Engineers like tidal power because the {{1}} are predictable.',
        'A newer design uses {{2}} turbines placed in fast channels.',
        'Costs should {{3}} as the industry matures.',
      ],
    },
    options: ['tides', 'underwater', 'fall', 'storms', 'floating', 'rise'],
    word_limit: 1,
    questions: [
      { answer: 'tides', evidence_text: 'the tides arrive twice a day' },
      { answer: 'underwater', evidence_text: 'A newer approach relies on underwater turbines placed in fast channels.' },
      { answer: 'fall', evidence_text: 'Supporters believe costs will fall as the industry matures' },
    ],
  };
  const ok = buildBlock('summary_completion', base, ctx);
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.questions.length, 3);
  assert.deepEqual(ok.questions[0]?.options, base.options);

  const outside = JSON.parse(JSON.stringify(base)) as RawBlock;
  (outside.questions as Q[])[2]!.answer = 'drop';
  assert.equal(buildBlock('summary_completion', outside, ctx).questions.length, 0);

  const small = JSON.parse(JSON.stringify(base)) as RawBlock;
  small.options = ['tides', 'underwater', 'fall', 'storms'];
  assert.equal(buildBlock('summary_completion', small, ctx).questions.length, 0);
});

test('ghi chú và sơ đồ chữ dựng được', () => {
  const notes = buildBlock(
    'note_completion',
    {
      form: { title: 'Notes', lines: ['## Barrages', 'Built in {{1}}', 'Harm to {{2}}', '## Arrays', 'Installed in {{3}}'] },
      word_limit: 2,
      questions: [
        { answer: '1966', evidence_text: 'La Rance in France in 1966' },
        { answer: 'wading birds', evidence_text: 'which can damage habitats for wading birds' },
        { answer: 'clusters', evidence_text: 'engineers can install them in clusters called arrays' },
      ],
    },
    ctx,
  );
  assert.deepEqual(notes.problems, []);
  assert.equal(notes.questions.length, 3);

  const diagram = buildBlock(
    'diagram_label_completion',
    {
      form: {
        title: 'Array',
        lines: ['Machines grouped together → {{1}}', 'Channel with strong flow → {{2}}', 'Creatures unharmed in trial → {{3}}', 'Cost driver at sea → {{4}}'],
      },
      word_limit: 1,
      questions: [
        { answer: 'arrays', evidence_text: 'clusters called arrays' },
        { answer: 'channels', evidence_text: 'placed in fast channels' },
        { answer: 'seals', evidence_text: 'no harm to nearby seals' },
        { answer: 'vessels', evidence_text: 'maintenance requires specialist vessels' },
      ],
    },
    ctx,
  );
  assert.deepEqual(diagram.problems, []);
  assert.equal(diagram.questions[0]?.form?.kind, 'diagram');
});

test('model không đưa câu dẫn nguyên văn thì tự tìm câu chứa đáp án', () => {
  const raw = tableOk();
  (raw.questions as Q[])[2]!.evidence_text = 'câu không có trong bài';
  const r = buildBlock('table_completion', raw, ctx);
  assert.equal(r.questions.length, 3);
  assert.ok(r.questions[2]?.evidenceText.includes('habitats'));
});

test('findParagraph / sentenceContaining', () => {
  assert.equal(findParagraph('La Rance in France in 1966', P), 1);
  assert.equal(findParagraph('không có', P), -1);
  assert.equal(sentenceContaining('seals', P)?.paragraphIndex, 4);
  assert.equal(sentenceContaining('xyzzy', P), null);
});
