import assert from 'node:assert/strict';
import { test } from 'node:test';

import { highlightRanges, sentenceBounds, snapToWords } from './passage-text';
import type { Highlight } from '@/store/useReaderStore';

const P = 'Bees can see ultraviolet light. Flowers use it too. Bees can see far.';

const hl = (text: string, start?: number): Highlight => ({
  id: text + String(start), articleId: 'a', paragraphIndex: 0, text, start, color: 'yellow', note: null, evidenceForQuestionId: null, createdAt: '',
});

test('bôi lẹm nửa chữ thì nới ra trọn chữ, bỏ khoảng trắng hai đầu', () => {
  const s = P.indexOf('ltraviolet');
  const r = snapToWords(P, s, s + 12); // "ltraviolet l"
  assert.equal(P.slice(r.start, r.end), 'ultraviolet light');
  const r2 = snapToWords(P, 4, 9); // " can "
  assert.equal(P.slice(r2.start, r2.end), 'can');
});

test('chạm một từ thì lấy đúng câu chứa từ đó', () => {
  const b = sentenceBounds(P, P.indexOf('use'));
  assert.equal(P.slice(b.start, b.end), 'Flowers use it too.');
  const last = sentenceBounds(P, P.lastIndexOf('far'));
  assert.equal(P.slice(last.start, last.end), 'Bees can see far.');
});

test('vệt tô có vị trí thì tô đúng lần xuất hiện đó, không nhảy về lần đầu', () => {
  const second = P.lastIndexOf('Bees can see');
  const [r] = highlightRanges(P, [hl('Bees can see', second)]);
  assert.equal(r!.start, second);
  const [old] = highlightRanges(P, [hl('Bees can see')]);
  assert.equal(old!.start, 0, 'vệt cũ không có vị trí thì lùi về lần đầu');
});
