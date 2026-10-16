import test from 'node:test';
import assert from 'node:assert/strict';

import { encodeWav16k, resampleLinear, TARGET_RATE } from './wav';

test('WAV: tiêu đề đúng, 16 kHz, 16-bit mono', () => {
  const samples = new Float32Array(48000).map((_, i) => Math.sin(i / 10) * 0.5);
  const wav = encodeWav16k(samples, 48000);
  const view = new DataView(wav.buffer);
  const tag = (o: number) => String.fromCharCode(wav[o]!, wav[o + 1]!, wav[o + 2]!, wav[o + 3]!);
  assert.equal(tag(0), 'RIFF');
  assert.equal(tag(8), 'WAVE');
  assert.equal(view.getUint32(24, true), TARGET_RATE);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), TARGET_RATE * 2);
  assert.equal(wav.length, 44 + TARGET_RATE * 2);
});

test('nội suy: 48 kHz → 16 kHz giữ đúng số mẫu', () => {
  const out = resampleLinear(new Float32Array(4800), 48000, 16000);
  assert.equal(out.length, 1600);
});

test('mẫu vượt biên bị kẹp, không tràn', () => {
  const wav = encodeWav16k(new Float32Array([2, -2]), 16000);
  const view = new DataView(wav.buffer);
  assert.equal(view.getInt16(44, true), 0x7fff);
  assert.equal(view.getInt16(46, true), -0x8000);
});
