import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LISTENING_TTS_PER_DAY, listeningTtsPeriod } from './tts-quota';

test('kỳ hạn mức tính theo ngày Việt Nam, không theo giờ UTC của máy chủ', () => {
  // 00:30 sáng 19/10 ở Việt Nam = 17:30 UTC ngày 18/10: phải tính là ngày 19/10.
  assert.equal(listeningTtsPeriod(new Date('2026-10-18T17:30:00Z')), 'listening-tts:2026-10-19');
  // 23:30 tối 18/10 ở Việt Nam = 16:30 UTC cùng ngày: vẫn là ngày 18/10.
  assert.equal(listeningTtsPeriod(new Date('2026-10-18T16:30:00Z')), 'listening-tts:2026-10-18');
});

test('hạn mức đủ cho ít nhất một đề gốc đầy đủ (4 section) mỗi ngày', () => {
  assert.ok(Number.isInteger(LISTENING_TTS_PER_DAY));
  assert.ok(LISTENING_TTS_PER_DAY >= 4);
});
