import test from 'node:test';
import assert from 'node:assert/strict';

import { detectPitch, intonationScore, intonationStats, pitchTrack, semitones } from './pitch';

const SR = 16000;

function tone(hz: number, seconds: number): Float32Array {
  const n = Math.round(SR * seconds);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / SR);
  return out;
}

/** Tần số đi từ `from` tới `to` theo thời gian (glide tuyến tính), pha liên tục. */
function glide(from: number, to: number, seconds: number): Float32Array {
  const n = Math.round(SR * seconds);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const f = from + ((to - from) * i) / n;
    phase += (2 * Math.PI * f) / SR;
    out[i] = 0.5 * Math.sin(phase);
  }
  return out;
}

test('nhận đúng cao độ của một âm thuần', () => {
  const hz = detectPitch(tone(200, 0.04), SR);
  assert.ok(hz !== null && Math.abs(hz - 200) < 4, `got ${hz}`);
});

test('im lặng thì không có cao độ', () => {
  assert.equal(detectPitch(new Float32Array(640), SR), null);
});

test('nửa cung: 100 Hz → 0, 200 Hz → 12', () => {
  assert.equal(Math.round(semitones(100)), 0);
  assert.equal(Math.round(semitones(200)), 12);
});

test('câu hỏi lên giọng ở cuối: hướng rising', () => {
  const track = pitchTrack(glide(120, 200, 1.5), SR);
  const stats = intonationStats(track);
  assert.equal(stats.finalDirection, 'rising');
  assert.ok(stats.rangeSt !== null && stats.rangeSt > 4);
});

test('câu kể xuống giọng ở cuối: hướng falling', () => {
  const track = pitchTrack(glide(200, 110, 1.5), SR);
  assert.equal(intonationStats(track).finalDirection, 'falling');
});

test('giọng đều đều: điểm ngữ điệu thấp hơn giọng lên xuống tự nhiên', () => {
  const flat = intonationStats(pitchTrack(tone(150, 1.5), SR));
  const varied = intonationStats(pitchTrack(glide(120, 230, 1.5), SR));
  const flatScore = intonationScore(flat);
  const variedScore = intonationScore(varied);
  assert.ok(flatScore !== null && variedScore !== null);
  assert.ok(variedScore! > flatScore!, `flat ${flatScore} vs varied ${variedScore}`);
});

test('quá ít giọng thì không chấm', () => {
  const quiet = intonationStats(pitchTrack(new Float32Array(SR), SR));
  assert.equal(intonationScore(quiet), null);
});
