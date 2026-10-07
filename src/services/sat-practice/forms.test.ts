import assert from 'node:assert/strict';
import test from 'node:test';

import { SAT_PRACTICE_FORMS, satPracticeSeed } from './forms';

test('provides 50 uniquely numbered, stable practice forms', () => {
  assert.equal(SAT_PRACTICE_FORMS.length, 50);
  assert.equal(new Set(SAT_PRACTICE_FORMS.map((form) => form.id)).size, 50);
  assert.equal(SAT_PRACTICE_FORMS[0]?.id, 'form-01');
  assert.equal(SAT_PRACTICE_FORMS[49]?.id, 'form-50');
  assert.equal(satPracticeSeed('form-01', 'math'), satPracticeSeed('form-01', 'math'));
  assert.notEqual(satPracticeSeed('form-01', 'math'), satPracticeSeed('form-01', 'full'));
});
