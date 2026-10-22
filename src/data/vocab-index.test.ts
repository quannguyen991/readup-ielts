import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DECK_SLUGS, TOPIC_INDEX } from './vocab-index';
import { LISTENING_DECKS } from './vocab-listening';
import { getVocabTopic, VOCAB_TOPICS } from './vocab-topics';

test('chỉ mục bộ chủ đề khớp đúng bộ đầy đủ (tên và mã)', () => {
  assert.deepEqual(
    [...TOPIC_INDEX],
    VOCAB_TOPICS.map((t) => ({ slug: t.slug, nameVi: t.nameVi })),
  );
});

test('mọi mã trong chỉ mục tra được bộ thật; mọi bộ thật đều có trong chỉ mục', () => {
  for (const slug of DECK_SLUGS) assert.ok(getVocabTopic(slug), `mã thừa: ${slug}`);
  for (const t of [...VOCAB_TOPICS, ...LISTENING_DECKS]) assert.ok(DECK_SLUGS.has(t.slug), `thiếu mã: ${t.slug}`);
});
