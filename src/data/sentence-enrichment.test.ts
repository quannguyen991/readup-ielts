import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SENTENCE_ENRICHMENT } from './sentence-enrichment';
import { TRANSLATION_SENTENCES } from './sentence-drills';

test('mỗi câu dịch đều có đúng một mục enrichment tương ứng', () => {
  const enrichIds = new Set(Object.keys(SENTENCE_ENRICHMENT));
  const drillIds = new Set(TRANSLATION_SENTENCES.map((t) => t.id));
  assert.equal(enrichIds.size, drillIds.size);
  for (const id of drillIds) assert.ok(enrichIds.has(id), `thiếu enrichment cho ${id}`);
  for (const id of enrichIds) assert.ok(drillIds.has(id), `enrichment thừa, không khớp câu dịch nào: ${id}`);
});

test('mỗi mục có ít nhất 2 paraphrase và 3 từ vựng, không rỗng, không lồng JSON', () => {
  for (const [id, entry] of Object.entries(SENTENCE_ENRICHMENT)) {
    assert.ok(entry.paraphrases.length >= 2, `${id}: ít hơn 2 paraphrase`);
    assert.ok(entry.vocab.length >= 3, `${id}: ít hơn 3 từ vựng`);
    for (const p of entry.paraphrases) {
      assert.ok(p.trim().length > 0, `${id}: paraphrase rỗng`);
      assert.ok(!p.trim().startsWith('{'), `${id}: paraphrase bị lồng JSON`);
    }
    for (const v of entry.vocab) {
      assert.ok(v.word.trim().length > 0 && v.meaningVi.trim().length > 0 && v.example.trim().length > 0, `${id}: từ vựng thiếu trường`);
      assert.ok(!v.word.trim().startsWith('{') && !v.example.trim().startsWith('{'), `${id}: từ vựng bị lồng JSON`);
    }
  }
});

test('paraphrase không được chép y hệt câu đáp án mẫu gốc', () => {
  const enById = new Map(TRANSLATION_SENTENCES.map((t) => [t.id, t.en]));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [id, entry] of Object.entries(SENTENCE_ENRICHMENT)) {
    const original = norm(enById.get(id) ?? '');
    for (const p of entry.paraphrases) {
      assert.notEqual(norm(p), original, `${id}: paraphrase trùng y hệt câu gốc`);
    }
  }
});
