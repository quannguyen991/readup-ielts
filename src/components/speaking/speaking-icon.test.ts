import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { SPEAKING_REF_PART1 } from '../../data/speaking-reference/part1';
import { SPEAKING_REF_PART2 } from '../../data/speaking-reference/part2';
import { SPEAKING_REF_PART3 } from '../../data/speaking-reference/part3';
import { SPEAKING_ICON_IDS, speakingIconFor } from './speaking-icon';

test('mọi icon Speaking có tệp ảnh', () => {
  for (const id of SPEAKING_ICON_IDS) assert.ok(existsSync(join(__dirname, '../../../assets/neon3', `${id}.png`)), id);
});

test('chủ đề và cue card đều có icon, không dồn vào một hình', () => {
  const titles = [...SPEAKING_REF_PART1.map((t) => t.topic), ...SPEAKING_REF_PART3.map((t) => t.topic), ...SPEAKING_REF_PART2.map((c) => c.title)];
  const count = new Map<string, number>();
  for (const t of titles) count.set(speakingIconFor(t), (count.get(speakingIconFor(t)) ?? 0) + 1);
  assert.ok(count.size >= 45, `chỉ ${count.size} icon khác nhau`);
  assert.ok((count.get('chat') ?? 0) < titles.length * 0.1, `mặc định chiếm ${count.get('chat')}`);
  assert.equal(speakingIconFor('Cars'), 'car');
  assert.equal(speakingIconFor('Music'), 'note');
});
