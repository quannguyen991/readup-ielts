import { C5, engine, gate, noise, tone, type Engine } from './sfx';
import { isSfxId, type SfxId } from './sfx-core';

/**
 * ÂM THANH GIAO DIỆN — nhẹ, ngắn, cùng âm lượng (kiểu Duolingo). Mỗi nhóm một âm
 * sắc để tai phân biệt không cần nhìn: thành công = chuông tam giác đi LÊN; thất
 * bại = sin trầm đi XUỐNG (không chói); thưởng = xu / lấp lánh; trung tính = tích
 * ngắn. Tự tổng hợp bằng Web Audio, không nạp tệp. Bảng sự kiện → mã tiếng ở
 * `sfx-core.ts`. Cùng một `AudioContext`, bộ nén, nút tắt tiếng và âm lượng với
 * tiếng game trong `sfx.ts`.
 */

const bell = (e: Engine, notes: number[], step: number, gain = 0.08, dur = 0.3, at = 0) =>
  notes.forEach((hz, i) => tone(e, hz, { at: at + i * step, dur, gain, type: 'triangle', attack: 0.01 }));

const DRAW: Record<SfxId, (e: Engine) => void> = {
  tap: (e) => tone(e, 660, { dur: 0.05, gain: 0.045, type: 'triangle', to: 520 }),
  select: (e) => {
    tone(e, 740, { dur: 0.07, gain: 0.055 });
    tone(e, 988, { at: 0.04, dur: 0.06, gain: 0.04 });
  },
  tab: (e) => tone(e, 880, { dur: 0.045, gain: 0.04, type: 'triangle' }),
  nav: (e) => {
    noise(e, { dur: 0.1, gain: 0.02, hz: 900, to: 1800, q: 0.6 });
    tone(e, 440, { dur: 0.05, gain: 0.02 });
  },
  flip: (e) => {
    noise(e, { dur: 0.13, gain: 0.06, hz: 1400, to: 4200, q: 0.8 });
    tone(e, 320, { dur: 0.06, gain: 0.04, to: 220 });
  },
  next: (e) => {
    noise(e, { dur: 0.14, gain: 0.04, hz: 700, to: 2600, q: 0.7 });
    tone(e, 600, { dur: 0.1, gain: 0.04, type: 'triangle', to: 900 });
  },
  back: (e) => tone(e, 700, { dur: 0.1, gain: 0.05, type: 'triangle', to: 440 }),
  modalOpen: (e) => tone(e, 480, { dur: 0.1, gain: 0.05, to: 760, type: 'triangle' }),
  modalClose: (e) => tone(e, 760, { dur: 0.09, gain: 0.045, to: 480, type: 'triangle' }),
  toast: (e) => bell(e, [1046.5, 1318.5], 0.07, 0.05, 0.16),
  notify: (e) => bell(e, [880, 1174.7], 0.13, 0.06, 0.4),
  wrong: (e) => {
    tone(e, 311, { dur: 0.14, gain: 0.1, to: 277 });
    tone(e, 233, { at: 0.12, dur: 0.26, gain: 0.1, to: 208 });
  },
  retry: (e) => {
    tone(e, 440, { dur: 0.12, gain: 0.07 });
    tone(e, 392, { at: 0.1, dur: 0.2, gain: 0.07 });
  },
  success: (e) => {
    bell(e, [C5, 659.25, 783.99], 0.09, 0.08, 0.2);
    tone(e, 1046.5, { at: 0.27, dur: 0.5, gain: 0.08, type: 'triangle' });
  },
  perfect: (e) => {
    bell(e, [C5, 659.25, 783.99, 1046.5], 0.08, 0.08, 0.2);
    bell(e, [1318.5, 1568, 2093], 0.06, 0.05, 0.5, 0.34);
  },
  good: (e) => bell(e, [783.99, 1046.5], 0.1, 0.08, 0.32),
  coin: (e) => {
    tone(e, 1568, { dur: 0.06, gain: 0.05, type: 'triangle' });
    tone(e, 2093, { at: 0.05, dur: 0.18, gain: 0.05, type: 'triangle' });
  },
  reward: (e) => {
    for (let i = 0; i < 5; i += 1) tone(e, i % 2 ? 1568 : 1318.5, { at: i * 0.06, dur: 0.07, gain: 0.05, type: 'triangle' });
    bell(e, [1046.5, 1318.5, 1568], 0, 0.06, 0.6, 0.34);
  },
  streak: (e) => {
    noise(e, { dur: 0.4, gain: 0.07, hz: 300, to: 2400, q: 0.7 });
    bell(e, [392, 523.25, 659.25, 783.99], 0.07, 0.07, 0.25, 0.05);
  },
  micStart: (e) => {
    tone(e, 520, { dur: 0.09, gain: 0.07, type: 'triangle', to: 780 });
    tone(e, 880, { at: 0.08, dur: 0.1, gain: 0.06, type: 'triangle' });
  },
  micStop: (e) => {
    tone(e, 880, { dur: 0.08, gain: 0.06, type: 'triangle' });
    tone(e, 620, { at: 0.07, dur: 0.1, gain: 0.05, type: 'triangle', to: 480 });
  },
  timerTick: (e) => tone(e, 1000, { dur: 0.03, gain: 0.03, type: 'square' }),
  timerWarn: (e) => [0, 0.16].forEach((at) => tone(e, 880, { at, dur: 0.08, gain: 0.05, type: 'square' })),
  timerEnd: (e) => [784, 659.25, 523.25].forEach((hz, i) => tone(e, hz, { at: i * 0.18, dur: 0.16, gain: 0.07, type: 'square' })),
  step: (e) => noise(e, { dur: 0.05, gain: 0.03, filter: 'lowpass', hz: 220 + Math.random() * 160 }),
  doorOpen: (e) => {
    noise(e, { dur: 0.22, gain: 0.05, hz: 300, to: 800, q: 1.2 });
    tone(e, 180, { dur: 0.2, gain: 0.03, type: 'sawtooth', to: 250 });
    noise(e, { dur: 0.03, gain: 0.08, filter: 'highpass', hz: 3000 });
  },
  doorClose: (e) => {
    noise(e, { dur: 0.16, gain: 0.04, hz: 800, to: 300, q: 1.2 });
    tone(e, 120, { at: 0.14, dur: 0.14, gain: 0.3, to: 55 });
  },
  enter: (e) => bell(e, [659.25, 987.77], 0.1, 0.06, 0.4),
  leave: (e) => bell(e, [987.77, 659.25], 0.1, 0.05, 0.35),
  ticket: (e) => {
    noise(e, { dur: 0.03, gain: 0.1, filter: 'highpass', hz: 4000 });
    tone(e, 1568, { at: 0.02, dur: 0.12, gain: 0.06, type: 'triangle' });
    tone(e, 2093, { at: 0.08, dur: 0.2, gain: 0.05, type: 'triangle' });
  },
  stamp: (e) => {
    tone(e, 150, { dur: 0.14, gain: 0.4, to: 60 });
    noise(e, { dur: 0.08, gain: 0.14, filter: 'lowpass', hz: 1200 });
    tone(e, C5, { at: 0.1, dur: 0.22, gain: 0.05, type: 'triangle' });
  },
  souvenir: (e) => {
    bell(e, [1046.5, 1318.5, 1568, 2093], 0.07, 0.06, 0.35);
    bell(e, [1046.5, 1568], 0, 0.03, 0.8, 0.3);
  },
  zoom: (e) => tone(e, 500, { dur: 0.08, gain: 0.04, to: 720 }),
  fullscreen: (e) => {
    noise(e, { dur: 0.2, gain: 0.04, hz: 500, to: 2200, q: 0.6 });
    tone(e, 420, { dur: 0.16, gain: 0.04, type: 'triangle', to: 840 });
  },
  takeoff: (e) => {
    noise(e, { dur: 1.2, gain: 0.09, filter: 'lowpass', hz: 200, to: 1800 });
    tone(e, 90, { dur: 1.2, gain: 0.05, type: 'sawtooth', to: 260, attack: 0.1 });
    bell(e, [783.99, 1046.5], 0.15, 0.05, 0.5, 1.0);
  },
  fullscreenOff: (e) => {
    noise(e, { dur: 0.2, gain: 0.035, hz: 2200, to: 500, q: 0.6 });
    tone(e, 840, { dur: 0.16, gain: 0.035, type: 'triangle', to: 420 });
  },
  locked: (e) => {
    tone(e, 196, { dur: 0.09, gain: 0.05, type: 'triangle' });
    tone(e, 165, { at: 0.1, dur: 0.14, gain: 0.05, type: 'triangle', to: 150 });
  },
  greet: (e) => bell(e, [659.25, 783.99], 0.09, 0.04, 0.3),
  seam: (e) => noise(e, { dur: 0.45, gain: 0.012, hz: 500, to: 1400, q: 0.5 }),
  plane: (e) => noise(e, { dur: 2.4, gain: 0.025, filter: 'lowpass', hz: 260, to: 900 }),
  train: (e) => {
    noise(e, { dur: 1.7, gain: 0.035, filter: 'lowpass', hz: 75, to: 520 });
    tone(e, 92, { dur: 1.3, gain: 0.035, type: 'sawtooth', to: 145, attack: 0.12 });
    tone(e, 740, { at: 1.05, dur: 0.12, gain: 0.025, type: 'triangle', to: 560 });
  },
  npc: (e) => tone(e, 400 + Math.random() * 300, { dur: 0.045, gain: 0.035, type: 'square' }),
};

/**
 * CỬA DUY NHẤT cho tiếng giao diện. Id lạ, đang tắt tiếng, âm lượng 0, chưa có cú
 * chạm đầu tiên, hoặc cùng tiếng vừa kêu trong khoảng chống dồn đều trả `false`.
 */
export function playSfx(id: string): boolean {
  if (!isSfxId(id)) return false;
  const e = engine();
  if (!e || !gate.allow(id)) return false;
  try {
    DRAW[id](e);
    return true;
  } catch {
    return false;
  }
}
