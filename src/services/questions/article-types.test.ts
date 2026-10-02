import test from 'node:test';
import assert from 'node:assert/strict';

import { chipSlice, matchTypes, typeInfoFor } from './article-types';
import { groupIntoBlocks } from '@/components/reader/QuestionBlocks';
import type { GeneratedQuestion, QuestionSet } from './types';

const ielts = { id: 'a-1', exam: 'ielts' as const, passageTier: 'p2' as const, licenseType: 'cc_by_sa' as const, wordCount: 900 };

test('bài IELTS chưa tạo gì: dạng mặc định suy từ bản thiết kế, tất định', () => {
  const a = typeInfoFor(ielts);
  assert.equal(a.source, 'default');
  assert.ok(a.types.length >= 2);
  assert.deepEqual(typeInfoFor(ielts), a);
});

test('bài chỉ có link thì không có dạng nào', () => {
  assert.deepEqual(typeInfoFor({ ...ielts, licenseType: 'headline_only' as const }), { types: [], source: 'none' });
});

test('bộ đã lưu thắng mặc định, dạng không lặp', () => {
  const set = { questions: [{ type: 'matching_headings' }, { type: 'matching_headings' }, { type: 'table_completion' }], generatedBy: 'ai' } as unknown as QuestionSet;
  const info = typeInfoFor(ielts, set);
  assert.equal(info.source, 'saved');
  assert.deepEqual(info.types, ['matching_headings', 'table_completion']);
});

test('lọc dạng: khớp bất kỳ; bài tạo được chỉ tính khi bật includeMakeable', () => {
  const info = typeInfoFor(ielts);
  const none = matchTypes(ielts, info, ['diagram_label_completion'], false);
  assert.equal(none.match, false);
  const make = matchTypes(ielts, info, ['diagram_label_completion'], true);
  assert.equal(make.match, true);
  assert.deepEqual(make.makeable, ['diagram_label_completion']);
  // Bài ngắn không đủ chất liệu cho dạng đòi bài dài.
  assert.equal(matchTypes({ ...ielts, wordCount: 150 }, info, ['diagram_label_completion'], true).match, false);
  // Không chọn gì thì khớp hết.
  assert.equal(matchTypes(ielts, info, [], false).match, true);
});

test('chipSlice: tối đa 3 chip và phần dư', () => {
  assert.deepEqual(chipSlice([1, 2, 3, 4, 5]), { shown: [1, 2, 3], more: 2 });
  assert.deepEqual(chipSlice([1]), { shown: [1], more: 0 });
});

test('groupIntoBlocks tách hai nhóm cùng dạng nhưng khác groupId', () => {
  const q = (id: string, groupId: string): GeneratedQuestion => ({
    id, orderIndex: 0, type: 'table_completion', prompt: id, instruction: null, options: null,
    correctAnswer: 'x', evidenceText: 'x', evidenceParagraphIndex: 0, explanation: '', lessonTip: null, groupId,
  });
  const blocks = groupIntoBlocks([q('1', 'g1'), q('2', 'g1'), q('3', 'g2')]);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0]?.groupId, 'g1');
});
