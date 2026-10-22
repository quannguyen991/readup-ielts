/**
 * Âm hiệu của khu Hub, tổng hợp bằng Web Audio (không cần file âm thanh, không tốn băng thông).
 * Trình duyệt chặn âm thanh cho đến khi có thao tác của người dùng, nên AudioContext được tạo lần
 * đầu gọi `playSfx`. Trạng thái tắt/bật lưu trong máy (localStorage), lỗi thì im lặng.
 */

export type Sfx = 'unlock' | 'complete' | 'streak' | 'fire' | 'tap';

const MUTE_KEY = 'readup:hub-sfx-muted';
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export function isSfxMuted(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Không lưu được thì vẫn áp dụng cho phiên hiện tại.
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Một nốt có đường bao âm lượng: vào nhanh, ra êm. */
function note(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function burstNoise(c: AudioContext, start: number, dur: number, gain: number) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  src.buffer = noise;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}

/** Phát một âm hiệu. Đang tắt hoặc không có âm thanh thì bỏ qua. */
export function playSfx(name: Sfx): void {
  if (isSfxMuted()) return;
  try {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + 0.01;
    switch (name) {
      case 'unlock':
        // Hợp âm đi lên: C5 E5 G5 C6, kết bằng hợp âm
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, t + i * 0.09, 0.4, 'triangle', 0.16));
        [523.25, 783.99, 1046.5].forEach((f) => note(c, f, t + 0.42, 0.9, 'sine', 0.09));
        break;
      case 'complete':
        note(c, 880, t, 0.25, 'sine', 0.18);
        note(c, 1318.5, t + 0.08, 0.35, 'sine', 0.16);
        break;
      case 'streak': {
        // Quét lên nhanh: cảm giác ngọn lửa bùng lên
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(g).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      }
      case 'fire':
        // Tiếng lách tách của lửa: vài đợt nhiễu ngắn
        [0, 0.09, 0.2, 0.33].forEach((d) => burstNoise(c, t + d, 0.07, 0.25));
        break;
      case 'tap':
        note(c, 660, t, 0.06, 'sine', 0.08);
        break;
    }
  } catch {
    // Âm thanh không phát được (trình duyệt chặn, thiết bị không hỗ trợ): không làm hỏng màn hình.
  }
}
