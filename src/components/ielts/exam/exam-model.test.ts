import assert from 'node:assert/strict';
import test from 'node:test';

import { getDrillSets } from '@/data/drill-sets';
import { buildMixedTest } from '@/data/drill-sets/mixed';
import { IELTS_QUESTION_TYPES } from '@/data/ielts-question-types';

import { allItems, partFromSet, partsFromMixed, splitParagraphs, totalQuestions, type ExamSkill } from './exam-model';

const DRILL_TYPES = IELTS_QUESTION_TYPES.filter((t) => (t.skill === 'reading' || t.skill === 'listening') && getDrillSets(t.id).length > 0);

test('mỗi set luyện thành một phần: số câu liên tục, nhóm có chỉ dẫn, câu nào cũng có cách trả lời', () => {
  assert.ok(DRILL_TYPES.length >= 18, `chỉ ${DRILL_TYPES.length} dạng có set`);
  for (const t of DRILL_TYPES) {
    for (const s of getDrillSets(t.id)) {
      const part = partFromSet(t.id, s, t.skill as ExamSkill);
      const items = allItems([part]);
      assert.equal(items.length, s.questions.length, `${s.id}: mất câu`);
      items.forEach((it, i) => assert.equal(it.n, i + 1, `${s.id}: số câu không liên tục`));
      for (const g of part.groups) {
        assert.ok(g.instruction.length >= 1 && g.heading.startsWith('Question'), `${s.id}: nhóm thiếu chỉ dẫn`);
        assert.equal(g.items.length, g.to - g.from + 1);
      }
      for (const it of items) {
        if (it.kind === 'radio' || it.kind === 'select') assert.ok(it.options && it.options.includes(it.answer), `${s.id} #${it.n}: đáp án không thuộc phương án`);
        if (it.kind === 'gap') assert.ok(it.prompt.includes('____'));
      }
      if (t.skill === 'reading') assert.ok((part.paragraphs?.length ?? 0) >= 1, `${s.id}: thiếu bài đọc`);
      else assert.ok(part.script && part.script.includes(':'), `${s.id}: thiếu kịch bản`);
    }
  }
});

test('TFNG và YNNG hiện nhãn giải nghĩa đúng kiểu đề thật', () => {
  const tf = partFromSet('reading-tfng', getDrillSets('reading-tfng')[0]!, 'reading').groups[0]!;
  assert.equal(tf.legend?.length, 3);
  assert.ok(tf.legend![0]!.startsWith('TRUE'));
  const yn = partFromSet('reading-ynng', getDrillSets('reading-ynng')[0]!, 'reading').groups[0]!;
  assert.ok(yn.legend![0]!.startsWith('YES'));
  assert.deepEqual(yn.items[0]!.options, ['YES', 'NO', 'NOT GIVEN']);
});

test('dạng điền có giới hạn từ trong chỉ dẫn, nối tiêu đề có danh sách và đoạn văn', () => {
  const sc = partFromSet('reading-sentence-completion', getDrillSets('reading-sentence-completion')[0]!, 'reading').groups[0]!;
  assert.equal(sc.wordLimit, 'NO MORE THAN THREE WORDS');
  const lsc = partFromSet('listening-sentence-completion', getDrillSets('listening-sentence-completion')[0]!, 'listening').groups[0]!;
  assert.equal(lsc.wordLimit, 'NO MORE THAN THREE WORDS AND/OR A NUMBER');
  const h = partFromSet('reading-matching-headings', getDrillSets('reading-matching-headings')[0]!, 'reading');
  assert.ok(h.paragraphs!.every((p) => p.text.length > 50));
  assert.ok(h.groups[0]!.items.every((i) => /^Paragraph \d+$/.test(i.prompt)));
  const mf = partFromSet('reading-matching-features', getDrillSets('reading-matching-features')[0]!, 'reading').groups[0]!;
  assert.equal(mf.optionsBox?.items.length, 5);
});

test('bản đồ nghe chia thành một nhóm mỗi bản đồ', () => {
  const s = getDrillSets('listening-map-labelling')[0]!;
  const part = partFromSet('listening-map-labelling', s, 'listening');
  assert.equal(part.groups.length, s.maps!.length);
  assert.ok(part.groups.every((g) => g.map));
  assert.equal(allItems([part]).length, s.questions.length);
});

for (const skill of ['reading', 'listening'] as const) {
  test(`bài tổng hợp ${skill}: 4 phần, 40 câu đánh số liên tục từ 1 đến 40`, () => {
    for (let seed = 1; seed <= 8; seed++) {
      const parts = partsFromMixed(skill, buildMixedTest(skill, seed)!);
      assert.equal(parts.length, 4);
      assert.equal(totalQuestions(parts), 40);
      allItems(parts).forEach((it, i) => assert.equal(it.n, i + 1));
      assert.equal(parts[1]!.from, parts[0]!.to + 1);
    }
  });
}

test('tách đoạn văn có nhãn chữ cái', () => {
  const p = splitParagraphs('A. First paragraph here.\n\nB. Second one.\n\nUnlabelled text.');
  assert.deepEqual(p.map((x) => x.label), ['A', 'B', null]);
});
