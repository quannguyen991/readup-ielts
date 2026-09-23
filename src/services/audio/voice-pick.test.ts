import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bestVoice, scoreVoice } from './voice-pick';

const v = (name: string, language = 'en-US') => ({ identifier: name, name, language });

test('giọng nam và giọng không phải tiếng Anh bị loại', () => {
  assert.equal(scoreVoice(v('Microsoft David - English (United States)')), null);
  assert.equal(scoreVoice(v('Google UK English Male', 'en-GB')), null);
  assert.equal(scoreVoice(v('Microsoft HoaiMy', 'vi-VN')), null);
  // "Samantha" chứa "sam" nhưng là giọng nữ: khớp theo từ nguyên vẹn.
  assert.notEqual(scoreVoice(v('Samantha')), null);
});

test('ưu tiên giọng nữ nơ-ron, rồi giọng nữ thường, Anh–Mỹ trước Anh–Anh', () => {
  const voices = [
    v('Microsoft David - English (United States)'),
    v('Microsoft Zira - English (United States)'),
    v('Microsoft Aria Online (Natural) - English (United States)'),
    v('Google UK English Female', 'en-GB'),
  ];
  assert.equal(bestVoice(voices)?.name, 'Microsoft Aria Online (Natural) - English (United States)');
  assert.equal(bestVoice(voices.slice(0, 2))?.name, 'Microsoft Zira - English (United States)');
  assert.equal(bestVoice([v('Google UK English Female', 'en-GB'), v('Google US English')])?.name, 'Google US English');
  assert.equal(bestVoice([v('Microsoft David - English (United States)')]), null);
});
