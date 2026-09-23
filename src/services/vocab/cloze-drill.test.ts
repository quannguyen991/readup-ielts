import assert from 'node:assert/strict';
import { test } from 'node:test';

import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import {
  advanceCloze,
  buildClozeQuestion,
  clozeable,
  fillPattern,
  isClozeCorrect,
  letterCount,
  planClozeRound,
  scrambleTiles,
  type ClozeItem,
} from './cloze-drill';
import { seededRng, type StudyWord } from './topic-study';

test('một vòng: tối đa 10 câu, từ khoét được, bốn dạng xen kẽ', () => {
  for (const t of VOCAB_TOPICS.slice(0, 20)) {
    for (let seed = 0; seed < 5; seed += 1) {
      const round = planClozeRound(t.words, seededRng(seed));
      assert.ok(round.length > 0 && round.length <= 10);
      for (let i = 1; i < round.length; i += 1) assert.notEqual(round[i]!.kind, round[i - 1]!.kind);
      if (round.length >= 4) assert.equal(new Set(round.map((r) => r.kind)).size, 4, 'vòng đủ dài phải có đủ bốn dạng');
    }
  }
});

test('sai thì hỏi lại sau hai câu bằng dạng khác, không đứng cạnh câu cùng dạng', () => {
  const q: ClozeItem[] = [
    { word: 'a', kind: 'write' },
    { word: 'b', kind: 'pick' },
    { word: 'c', kind: 'scramble' },
    { word: 'd', kind: 'listen' },
  ];
  const next = advanceCloze(q, false);
  assert.deepEqual(
    next.map((i) => i.word),
    ['b', 'c', 'a', 'd'],
  );
  const again = next[2]!;
  assert.equal(again.retry, true);
  assert.ok(!['write', 'scramble', 'listen'].includes(again.kind), again.kind);
  let rest = next;
  while (rest.length) rest = advanceCloze(rest, true);
  assert.equal(rest.length, 0);
});

test('sai mãi một câu vẫn không chặn các từ còn lại của vòng', () => {
  let q: ClozeItem[] = 'abcdefghij'.split('').map((word, i) => ({ word, kind: (['pick', 'scramble', 'write', 'listen'] as const)[i % 4]! }));
  const seen = new Set<string>();
  // Trả lời sai mọi câu trong 40 lượt: cả mười từ vẫn phải được hỏi tới.
  for (let i = 0; i < 40 && q.length; i += 1) {
    seen.add(q[0]!.word);
    q = advanceCloze(q, false);
  }
  assert.equal(seen.size, 10);
});

test('xếp chữ: đủ chữ cái, khác thứ tự gốc, giữ dấu cách và nháy', () => {
  for (let seed = 0; seed < 50; seed += 1) {
    const tiles = scrambleTiles('Habitats', seededRng(seed));
    assert.deepEqual([...tiles].sort(), [...'habitats'].sort());
    assert.notEqual(tiles.join(''), 'habitats');
  }
  assert.equal(letterCount('habitat destruction'), 18);
  assert.equal(fillPattern('global warming', [...'globalwarming']).join(''), 'global warming');
  // Mới chọn 4 chữ: phần còn lại để trống, dấu cách giữa hai từ vẫn đứng đúng chỗ.
  assert.deepEqual(fillPattern('global warming', [...'glob']), ['g', 'l', 'o', 'b', '', '', ' ', '', '', '', '', '', '', '']);
  assert.equal(fillPattern("it's", ['i', 't', 's']).join(''), "it's");
});

test('mọi bộ: câu dựng được, đáp án đúng thì chấm đúng', () => {
  const decks: StudyWord[][] = [...VOCAB_TOPICS.map((t) => t.words), ...SAT_VOCAB_LESSONS.map((l) => l.words)];
  for (const words of decks) {
    for (const [i, w] of clozeable(words).entries()) {
      for (const kind of ['pick', 'scramble', 'write', 'listen'] as const) {
        const q = buildClozeQuestion({ word: w.word, kind }, words, seededRng(i));
        assert.ok(q, `${w.word}: không dựng được câu`);
        assert.equal(q.before + q.answer + q.after, w.example);
        if (q.kind === 'pick') {
          assert.equal(new Set(q.options).size, q.options.length);
          assert.ok(isClozeCorrect(q, q.correctIndex));
        } else {
          assert.ok(isClozeCorrect(q, q.answer.toUpperCase()));
          assert.ok(!isClozeCorrect(q, ''));
        }
        if (q.kind === 'scramble') {
          // Bấm đủ các ô theo đúng thứ tự thì ghép ra đúng đáp án.
          const inOrder = [...q.answer.toLowerCase()].filter((c) => /\p{L}/u.test(c));
          assert.deepEqual([...q.tiles].sort(), [...inOrder].sort());
          assert.ok(isClozeCorrect(q, fillPattern(q.answer, inOrder).join('')));
        }
      }
    }
  }
});
