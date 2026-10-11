import assert from 'node:assert/strict';
import test from 'node:test';

import { collectAudioUnits, estimateAudio } from './audio-units';
import { pcm16ToWav } from '../../services/intl/wav';

test('every listening unit gets one audio file with unique ids and non-empty text', () => {
  const units = collectAudioUnits();
  assert.equal(units.length, 26);
  assert.equal(new Set(units.map((u) => u.id)).size, units.length);
  for (const u of units) assert.ok(u.text.length > 20, `${u.id} text`);
});

test('speaker tags are removed before synthesis', () => {
  for (const u of collectAudioUnits()) assert.doesNotMatch(u.text, /^[MWSA]: /m, `${u.id} keeps a speaker tag`);
});

test('the cost estimate is positive and scales with length', () => {
  const est = estimateAudio(collectAudioUnits());
  assert.ok(est.seconds > 0 && est.usdPaid > 0);
  assert.ok(est.usdPaid < 5, 'the whole listening set should cost only a few dollars');
});

test('PCM is wrapped in a valid 24 kHz mono WAV header', () => {
  const pcm = new Uint8Array([1, 0, 2, 0]);
  const wav = pcm16ToWav(pcm);
  const text = String.fromCharCode(...wav.slice(0, 4));
  assert.equal(text, 'RIFF');
  assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
  const view = new DataView(wav.buffer);
  assert.equal(view.getUint32(24, true), 24000);
  assert.equal(view.getUint32(40, true), pcm.length);
  assert.equal(wav.length, 44 + pcm.length);
});
