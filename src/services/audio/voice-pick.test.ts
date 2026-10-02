import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bestVoice, bestVoiceFor, scoreVoice } from './voice-pick';

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

test('Chrome trên Windows: chọn giọng Google thay cho Microsoft Zira đời cũ', () => {
  const v = bestVoice([
    { identifier: 'zira', name: 'Microsoft Zira - English (United States)', language: 'en-US' },
    { identifier: 'g-us', name: 'Google US English', language: 'en-US' },
    { identifier: 'g-uk-f', name: 'Google UK English Female', language: 'en-GB' },
  ]);
  assert.equal(v?.identifier, 'g-us');
});

test('Edge: giọng Aria Online (Natural) vẫn đứng đầu', () => {
  const v = bestVoice([
    { identifier: 'zira', name: 'Microsoft Zira - English (United States)', language: 'en-US' },
    { identifier: 'aria', name: 'Microsoft Aria Online (Natural) - English (United States)', language: 'en-US' },
    { identifier: 'g-us', name: 'Google US English', language: 'en-US' },
  ]);
  assert.equal(v?.identifier, 'aria');
});

test('mỗi giới một giọng tốt nhất, giọng nơ-ron thắng giọng cũ', () => {
  const list = [
    v('Microsoft David - English (United States)'),
    v('Microsoft Guy Online (Natural) - English (United States)'),
    v('Microsoft Zira - English (United States)'),
    v('Microsoft Aria Online (Natural) - English (United States)'),
    v('Google UK English Male', 'en-GB'),
    v('Microsoft HoaiMy', 'vi-VN'),
  ];
  assert.match(bestVoiceFor(list, 'm')!.name, /Guy/);
  assert.match(bestVoiceFor(list, 'f')!.name, /Aria/);
  assert.equal(bestVoiceFor([v('Microsoft Aria Online (Natural) - English (United States)')], 'm'), null);
});
