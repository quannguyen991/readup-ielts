import assert from 'node:assert/strict';
import test from 'node:test';

import { POI_CATALOG } from '@/data/travel/pois';
import { buildContextualSpeakingPrompts, contextualVocabularyFor, resolveContextualSpeakingPrompt } from './contextual-speaking';

test('every regular place type follows the IELTS Part 1 to Part 3 arc', () => {
  for (const kind of ['airport', 'station', 'hotel', 'cafe', 'museum', 'garden', 'restaurant', 'market', 'landmark', 'secret'] as const) {
    const prompts = buildContextualSpeakingPrompts(kind, '7');
    assert.deepEqual(prompts.map((prompt) => prompt.part), [1, 1, 1, 1, 2, 3, 3, 3]);
    assert.ok(prompts[4]?.bullets?.length);
    assert.ok(prompts.every((prompt) => prompt.text.trim().endsWith('?') || prompt.part === 2));
    assert.ok(contextualVocabularyFor(kind).length >= 4);
  }
});

test('every non-action location in the app has a contextual IELTS journey', () => {
  const playablePlaces = POI_CATALOG.filter((poi) => !poi.action);
  assert.ok(playablePlaces.length > 0);
  for (const poi of playablePlaces) {
    assert.ok(
      buildContextualSpeakingPrompts(poi.kind, '7').length > 0,
      `${poi.id} (${poi.kind}) should have a contextual IELTS journey`,
    );
    assert.ok(contextualVocabularyFor(poi.kind).length >= 4, `${poi.id} (${poi.kind}) should have location vocabulary`);
  }
});

test('target band adjusts journey depth without changing question grading data', () => {
  const foundation = buildContextualSpeakingPrompts('hotel', '5.5-6');
  const advanced = buildContextualSpeakingPrompts('hotel', '8-9');
  assert.equal(foundation.filter((prompt) => prompt.part === 1).length, 3);
  assert.equal(foundation.filter((prompt) => prompt.part === 3).length, 2);
  assert.equal(advanced.filter((prompt) => prompt.part === 1).length, 4);
  assert.equal(advanced.filter((prompt) => prompt.part === 3).length, 4);
  assert.equal(resolveContextualSpeakingPrompt('hotel', 'hotel-p2-cue')?.part, 2);
  assert.equal(resolveContextualSpeakingPrompt('hotel', 'museum-p1-1'), null);
});
