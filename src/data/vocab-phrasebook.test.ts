import assert from 'node:assert/strict';
import test from 'node:test';

import { PHRASEBOOK_TOPICS, phrasebookItems } from './vocab-phrasebook';

test('phrasebook covers 10 themes with complete word and collocation decks', () => {
  assert.equal(PHRASEBOOK_TOPICS.length, 10);
  for (const topic of PHRASEBOOK_TOPICS) {
    assert.equal(topic.vocabulary.length, 50, `${topic.slug} vocabulary`);
    assert.equal(topic.collocations.length, 50, `${topic.slug} collocations`);
    assert.ok(topic.phrasalVerbs.length >= 5, `${topic.slug} phrasal verbs`);
    assert.equal(phrasebookItems(topic.slug, 'vocabulary').length, 50);
    assert.equal(phrasebookItems(topic.slug, 'collocations').length, 50);
    assert.ok(phrasebookItems(topic.slug, 'mixed').length > topic.phrasalVerbs.length);
  }
});
