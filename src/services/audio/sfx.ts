import { Platform } from 'react-native';

import { comboSemitones, shiftHz } from './sfx-notes';

/**
 * HIỆU ỨNG ÂM THANH CỦA GAME KHI HỌC — tự tổng hợp bằng Web Audio, không nạp tệp.
 *
 * Cùng lý do với tiếng chuông cũ: không tải thêm gì, không phải chọn giấy phép
 * cho tệp âm thanh, và hợp chất 8-bit của nhân vật pixel. Mỗi tiếng là vài dao
 * động (sin, tam giác, vuông, răng cưa) và nhiễu trắng qua bộ lọc, có bao đóng
 * để không "tách" ở loa.
 *
 * MỘT `AudioContext` cho cả phiên, tạo muộn sau cú bấm đầu tiên (trình duyệt cấm
 * phát tiếng trước khi người dùng chạm vào trang). Mọi tiếng đi qua một bộ nén
 * chung: một nhát chém là ba bốn lớp tiếng chồng lên nhau, không nén thì vỡ loa.
 *
 * Các lớp của một nhát chém được XẾP GIỜ bằng đồng hồ của Web Audio, khớp đúng
 * nhịp hoạt cảnh (kiếm vung ở 30 ms, trúng quái ở 110 ms) — không dùng setTimeout,
 * vốn trễ và lệch khi tab bận.
 *
 * Tắt tiếng ở trang Nhân vật hay trên thanh trận đấu thì MỌI tiếng ở đây im,
 * kể cả chuông "đúng" cũ. Native thì im có chủ ý, như tiếng chuông trước đây.
 */

type Engine = { ac: AudioContext; out: AudioNode; now: number };

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = false;
const lastPlayed: Record<string, number> = {};

export function setSfxMuted(value: boolean): void {
  muted = value;
}

/**
 * Chế độ BAY QUA THÀNH PHỐ: màn học đang dùng nền cảnh bay (hoặc đang ở Chuyến bay
 * từ vựng) thì không có trận đấu — câu đúng / sai phát tiếng gió + chuông nhẹ thay
 * cho tiếng chém / bị đánh. Đếm số nơi đang bật để hai màn chồng nhau không tắt
 * nhầm của nhau.
 */
let flightUsers = 0;
export function setFlightSfx(on: boolean): void {
  flightUsers = Math.max(0, flightUsers + (on ? 1 : -1));
}
export function isFlightSfx(): boolean {
  return flightUsers > 0;
}

export function isSfxMuted(): boolean {
  return muted;
}

function engine(): Engine | null {
  if (muted || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!ctx) {
      ctx = new Ctor();
      const squash = ctx.createDynamicsCompressor();
      squash.threshold.value = -14;
      squash.knee.value = 10;
      squash.ratio.value = 5;
      squash.attack.value = 0.003;
      squash.release.value = 0.15;
      bus = ctx.createGain();
      bus.gain.value = 0.6;
      bus.connect(squash).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return bus ? { ac: ctx, out: bus, now: ctx.currentTime } : null;
  } catch {
    return null;
  }
}

/**
 * Cùng một loại tiếng trong khoảng ngắn chỉ kêu MỘT lần: màn học và luật game
 * cùng báo "đúng" cho một câu thì không thành tiếng đôi.
 */
function once(kind: string, windowMs: number): boolean {
  const now = Date.now();
  if (now - (lastPlayed[kind] ?? 0) < windowMs) return false;
  lastPlayed[kind] = now;
  return true;
}

function play(kind: string | null, windowMs: number, draw: (e: Engine) => void): boolean {
  const e = engine();
  if (!e) return false;
  if (kind && !once(kind, windowMs)) return false;
  try {
    draw(e);
    return true;
  } catch {
    return false;
  }
}

type ToneOpts = { at?: number; dur: number; gain: number; type?: OscillatorType; to?: number; attack?: number };

/** Một nốt có bao đóng; `to` là tần số trượt tới cuối nốt. */
function tone(e: Engine, hz: number, { at = 0, dur, gain, type = 'sine', to, attack = 0.006 }: ToneOpts): void {
  const t0 = e.now + at;
  const osc = e.ac.createOscillator();
  const amp = e.ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(e.out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

type NoiseOpts = { at?: number; dur: number; gain: number; filter?: BiquadFilterType; hz?: number; to?: number; q?: number; attack?: number };

/** Một luồng nhiễu trắng qua bộ lọc — tiếng gió kiếm, tiếng va, tiếng nổ. */
function noise(e: Engine, { at = 0, dur, gain, filter = 'bandpass', hz = 1200, to, q = 1, attack = 0.004 }: NoiseOpts): void {
  if (!noiseBuffer) {
    const length = e.ac.sampleRate;
    noiseBuffer = e.ac.createBuffer(1, length, e.ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const t0 = e.now + at;
  const src = e.ac.createBufferSource();
  src.buffer = noiseBuffer;
  const shape = e.ac.createBiquadFilter();
  shape.type = filter;
  shape.Q.value = q;
  shape.frequency.setValueAtTime(hz, t0);
  if (to) shape.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const amp = e.ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(shape).connect(amp).connect(e.out);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.03);
}

const C5 = 523.25;

export const sfx = {
  /** Đúng: hai nốt đi lên (quãng năm), cao dần theo combo. */
  correct(combo = 1, at = 0): boolean {
    return play('correct', 250, (e) => {
      const base = shiftHz(880, comboSemitones(combo));
      tone(e, base, { at, dur: 0.16, gain: 0.13, type: 'triangle' });
      tone(e, base * 1.5, { at: at + 0.07, dur: 0.26, gain: 0.11, type: 'triangle' });
      tone(e, base * 3, { at: at + 0.07, dur: 0.12, gain: 0.025 });
    });
  },

  /** Chuyến bay — trả lời đúng: chuông hai nốt (cao dần theo combo) + một làn gió vụt qua. */
  flyCorrect(combo = 1): boolean {
    return play('flyCorrect', 250, (e) => {
      const base = shiftHz(784, comboSemitones(combo));
      tone(e, base, { dur: 0.14, gain: 0.12, type: 'triangle' });
      tone(e, base * 1.26, { at: 0.08, dur: 0.14, gain: 0.11, type: 'triangle' });
      tone(e, base * 1.5, { at: 0.16, dur: 0.3, gain: 0.1, type: 'triangle' });
      noise(e, { at: 0.04, dur: 0.38, gain: 0.07, hz: 700, to: 3400, q: 0.7 });
    });
  },

  /** Chuyến bay — trả lời sai: hai nốt trượt xuống, nhẹ nhàng (không phải tiếng "bị đánh"). */
  flyWrong(): boolean {
    return play('flyWrong', 250, (e) => {
      tone(e, 392, { dur: 0.16, gain: 0.12, type: 'sine', to: 370 });
      tone(e, 311, { at: 0.13, dur: 0.3, gain: 0.12, type: 'sine', to: 262 });
      noise(e, { at: 0.02, dur: 0.18, gain: 0.05, filter: 'lowpass', hz: 700 });
    });
  },

  /** Chuyến bay — tới thành phố mới: gió xuyên mây rồi chuông ba nốt. */
  flyArrive(): boolean {
    return play('flyArrive', 600, (e) => {
      noise(e, { dur: 0.7, gain: 0.1, hz: 400, to: 2800, q: 0.6 });
      for (const [i, hz] of [659.25, 783.99, 1046.5].entries()) tone(e, hz, { at: 0.25 + i * 0.16, dur: 0.5, gain: 0.09, type: 'triangle' });
    });
  },

  /** Vung kiếm: gió quét lên. */
  slash(at = 0): boolean {
    return play('slash', 80, (e) => {
      noise(e, { at, dur: 0.14, gain: 0.3, hz: 900, to: 5200, q: 0.9 });
      tone(e, 1400, { at, dur: 0.1, gain: 0.03, to: 500 });
    });
  },

  /** Trúng quái: cú đập trầm; chí mạng thì nổ to hơn và có tiếng lấp lánh. */
  impact(crit = false, at = 0): boolean {
    return play('impact', 80, (e) => {
      tone(e, crit ? 190 : 160, { at, dur: crit ? 0.26 : 0.16, gain: crit ? 0.75 : 0.5, to: 42 });
      noise(e, { at, dur: 0.06, gain: crit ? 0.36 : 0.22, filter: 'lowpass', hz: 2600 });
      if (!crit) return;
      noise(e, { at, dur: 0.1, gain: 0.2, filter: 'highpass', hz: 4200 });
      tone(e, 1568, { at: at + 0.03, dur: 0.18, gain: 0.07, type: 'square' });
      tone(e, 2093, { at: at + 0.09, dur: 0.3, gain: 0.06, type: 'triangle' });
      tone(e, 2637, { at: at + 0.14, dur: 0.36, gain: 0.05, type: 'triangle' });
    });
  },

  /** Một câu đúng = một nhát chém, ba lớp xếp khớp hoạt cảnh. */
  hit(combo: number, crit: boolean): void {
    sfx.correct(combo);
    sfx.slash(0.03);
    sfx.impact(crit, 0.11);
  },

  /** Trúng đòn: quái lao tới, cú đập trầm, tiếng "mất máu" trượt xuống. */
  hurt(at = 0): boolean {
    return play('hurt', 250, (e) => {
      noise(e, { at, dur: 0.12, gain: 0.22, hz: 500, to: 1700, q: 0.8 });
      tone(e, 130, { at: at + 0.1, dur: 0.22, gain: 0.55, to: 40 });
      noise(e, { at: at + 0.1, dur: 0.12, gain: 0.2, filter: 'lowpass', hz: 900 });
      tone(e, 392, { at: at + 0.13, dur: 0.26, gain: 0.1, type: 'square', to: 131 });
    });
  },

  /** Khiên chặn: tiếng kim loại ngân. */
  block(at = 0): boolean {
    return play('hurt', 250, (e) => {
      noise(e, { at, dur: 0.05, gain: 0.18, filter: 'highpass', hz: 5000 });
      tone(e, 1244, { at, dur: 0.38, gain: 0.14, type: 'triangle' });
      tone(e, 1864, { at, dur: 0.2, gain: 0.05, type: 'square' });
      tone(e, 2489, { at: at + 0.01, dur: 0.3, gain: 0.06, type: 'triangle' });
    });
  },

  /** Hết tim, bị đánh lui: bốn nốt đi xuống. */
  knockout(at = 0): boolean {
    return play('hurt', 250, (e) => {
      [523.25, 392, 329.63, 261.63].forEach((hz, i) => tone(e, hz, { at: at + i * 0.13, dur: 0.18, gain: 0.1, type: 'square' }));
      tone(e, 110, { at: at + 0.5, dur: 0.3, gain: 0.5, to: 38 });
    });
  },

  /** Tim chỉ còn một: hai nhịp tim trầm. */
  heartbeat(at = 0): boolean {
    return play('heartbeat', 1500, (e) => {
      tone(e, 72, { at, dur: 0.13, gain: 0.55, to: 48 });
      tone(e, 66, { at: at + 0.19, dur: 0.16, gain: 0.45, to: 44 });
    });
  },

  /** Hạ quái: nổ tan, rồi tiếng xu rơi; boss thì nổ trầm hơn và mưa xu dài hơn. */
  defeat(boss = false, at = 0): boolean {
    return play('defeat', 150, (e) => {
      noise(e, { at, dur: boss ? 0.6 : 0.36, gain: 0.3, hz: 3000, to: 280, q: 0.7 });
      tone(e, 700, { at, dur: 0.3, gain: 0.1, type: 'square', to: 120 });
      if (boss) tone(e, 95, { at, dur: 0.6, gain: 0.65, to: 30 });
      const coins = boss ? 6 : 2;
      for (let i = 0; i < coins; i += 1) {
        tone(e, i % 2 ? 1318.5 : 987.77, { at: at + 0.28 + i * 0.07, dur: i === coins - 1 ? 0.22 : 0.08, gain: 0.07, type: 'square' });
      }
    });
  },

  /** Lên cấp: bốn nốt đi lên rồi một hợp âm ngân. */
  levelUp(at = 0): boolean {
    return play('levelup', 400, (e) => {
      [C5, 659.25, 783.99, 1046.5].forEach((hz, i) => tone(e, hz, { at: at + i * 0.09, dur: 0.16, gain: 0.08, type: 'square' }));
      [1046.5, 1318.5, 1568].forEach((hz) => tone(e, hz, { at: at + 0.36, dur: 0.7, gain: 0.06, type: 'triangle', attack: 0.02 }));
    });
  },

  /** Nhặt đồ: hai nốt cao ngắn. */
  loot(at = 0): boolean {
    return play('loot', 150, (e) => {
      tone(e, 987.77, { at, dur: 0.08, gain: 0.06, type: 'square' });
      tone(e, 1318.5, { at: at + 0.07, dur: 0.16, gain: 0.06, type: 'square' });
    });
  },

  /** Uống bình máu: ba bong bóng rồi một tiếng ực. */
  potion(): boolean {
    return play('item', 200, (e) => {
      [
        [420, 840],
        [520, 1040],
        [640, 1280],
      ].forEach(([from, to], i) => tone(e, from!, { at: i * 0.08, dur: 0.09, gain: 0.12, to }));
      tone(e, 320, { at: 0.28, dur: 0.16, gain: 0.12, to: 190 });
    });
  },

  /** Giơ khiên: tiếng ngân trượt lên. */
  shieldUp(): boolean {
    return play('item', 200, (e) => {
      tone(e, 520, { dur: 0.32, gain: 0.12, type: 'triangle', to: 1040 });
      tone(e, 780, { at: 0.05, dur: 0.32, gain: 0.08, type: 'triangle', to: 1560 });
      noise(e, { dur: 0.22, gain: 0.05, filter: 'highpass', hz: 6000 });
    });
  },

  /** Nhân đôi XP: chùm nốt vuông đi lên thật nhanh. */
  powerUp(): boolean {
    return play('item', 200, (e) => {
      [C5, 783.99, 1046.5, 1568].forEach((hz, i) => tone(e, hz, { at: i * 0.05, dur: 0.1, gain: 0.07, type: 'square' }));
      tone(e, 2093, { at: 0.2, dur: 0.32, gain: 0.06, type: 'triangle' });
    });
  },

  /** Hỏi Cú: "hù… hù". */
  owl(): boolean {
    return play('item', 200, (e) => {
      tone(e, 560, { dur: 0.2, gain: 0.16, to: 470, attack: 0.03 });
      tone(e, 540, { at: 0.27, dur: 0.28, gain: 0.15, to: 430, attack: 0.03 });
    });
  },

  /** Combo chạm mốc Bùng cháy: gió quét lên cùng một nốt trượt dài. */
  fever(at = 0): boolean {
    return play('fever', 400, (e) => {
      noise(e, { at, dur: 0.42, gain: 0.24, hz: 300, to: 3200, q: 0.7 });
      tone(e, 262, { at, dur: 0.38, gain: 0.07, type: 'square', to: 1046 });
    });
  },

  /** Boss xuất hiện: tiếng gầm trầm, hai dao động lệch nhau cho dày. */
  bossRoar(at = 0): boolean {
    return play('boss', 800, (e) => {
      tone(e, 92, { at, dur: 0.8, gain: 0.16, type: 'sawtooth', to: 58, attack: 0.05 });
      tone(e, 95, { at, dur: 0.8, gain: 0.14, type: 'sawtooth', to: 61, attack: 0.05 });
      noise(e, { at, dur: 0.7, gain: 0.2, filter: 'lowpass', hz: 500, attack: 0.05 });
    });
  },

  /** Xong nhiệm vụ / mở huy hiệu: chuỗi lấp lánh có tiếng vọng. */
  sparkle(at = 0): boolean {
    return play('sparkle', 300, (e) => {
      [1318.5, 1568, 1975.5, 2637].forEach((hz, i) => {
        tone(e, hz, { at: at + i * 0.06, dur: 0.24, gain: 0.07, type: 'triangle' });
        tone(e, hz, { at: at + 0.3 + i * 0.06, dur: 0.2, gain: 0.025, type: 'triangle' });
      });
    });
  },

  /** Bài chấm lúc nộp: tiếng xu đếm theo số câu đúng (tối đa sáu tiếng). */
  coins(count: number, at = 0): boolean {
    return play('coins', 300, (e) => {
      const n = Math.max(1, Math.min(6, count));
      for (let i = 0; i < n; i += 1) tone(e, i % 2 ? 1568 : 1318.5, { at: at + i * 0.07, dur: i === n - 1 ? 0.2 : 0.07, gain: 0.06, type: 'square' });
    });
  },

  /** Bài gõ cả câu: mỗi từ đúng một tiếng tích, cao dần — tia nạp đòn đang đầy. */
  tick(step: number): boolean {
    return play(null, 0, (e) => {
      tone(e, shiftHz(C5 * 1.5, comboSemitones(step)), { dur: 0.06, gain: 0.05, type: 'triangle' });
    });
  },
};
