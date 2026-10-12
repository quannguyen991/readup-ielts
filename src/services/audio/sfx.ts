import { Platform } from 'react-native';

import { createSfxGate } from './sfx-core';

/**
 * HẠ TẦNG ÂM THANH — một `AudioContext` cho cả phiên, tự tổng hợp bằng Web Audio,
 * không nạp tệp. Mọi tiếng của app chỉ còn BỐN nhóm: đúng/sai, lật, chuyển, click
 * (xem `sfx-core.ts`). Tiếng vẽ ở `sfx-ui.ts`; file này chỉ lo bối cảnh âm thanh,
 * bộ nén, tắt tiếng và âm lượng.
 *
 * Các tiếng game cũ (chém, trúng quái, lên cấp, xu, boss…) đã bỏ hẳn. Lối gọi
 * `sfx.*` còn lại chỉ chuyển sang nhóm đúng/sai hoặc im, nên màn cũ không phải sửa.
 */

export type Engine = { ac: AudioContext; out: AudioNode; now: number };

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
export const gate = createSfxGate();
let muted = false;
let unlocked = false;

export function setSfxMuted(value: boolean): void {
  muted = value;
  gate.setMuted(value);
}

// 02/10/2026: người dùng không nghe thấy hiệu ứng trên web — hiệu ứng ngắn có đỉnh ~0,03 (≈ -30 dBFS)
// nên gần như im trên loa laptop. Nâng bus ×5; bộ nén phía sau chặn các tiếng to khỏi vỡ.
const BUS_GAIN = 3.2;

/** Âm lượng chung 0–1 (thanh trượt ở Cài đặt). Áp ngay cho cả tiếng đang chờ phát. */
export function setSfxVolume(value: number): void {
  gate.setVolume(value);
  if (bus && ctx) bus.gain.setTargetAtTime(BUS_GAIN * gate.getVolume(), ctx.currentTime, 0.02);
}

export function getSfxVolume(): number {
  return gate.getVolume();
}

/**
 * Trình duyệt cấm phát tiếng trước khi người dùng chạm vào trang. Lần chạm / bấm
 * phím đầu tiên mở khoá; trước đó mọi tiếng im lặng thay vì nổ cảnh báo.
 */
function armUnlock(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const go = () => {
    unlocked = true;
    for (const ev of events) window.removeEventListener(ev, go, true);
    if (!muted) engine();
  };
  for (const ev of events) window.addEventListener(ev, go, true);
}
armUnlock();

/**
 * Chế độ BAY QUA THÀNH PHỐ: giữ API cũ để các màn đã gọi vẫn chạy. Từ khi rút gọn
 * âm thanh, chế độ này không đổi tiếng nào nữa — chỉ đếm số nơi đang bật.
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

export function engine(): Engine | null {
  if (muted || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!unlocked && (navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) unlocked = true;
  if (!unlocked) return null;
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
      bus.gain.value = BUS_GAIN * gate.getVolume();
      bus.connect(squash).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return bus ? { ac: ctx, out: bus, now: ctx.currentTime } : null;
  } catch {
    return null;
  }
}

type ToneOpts = { at?: number; dur: number; gain: number; type?: OscillatorType; to?: number; attack?: number };

/** Một nốt có bao đóng; `to` là tần số trượt tới cuối nốt. */
export function tone(e: Engine, hz: number, { at = 0, dur, gain, type = 'sine', to, attack = 0.006 }: ToneOpts): void {
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

/** Một luồng nhiễu trắng qua bộ lọc — tiếng gió (chuyển), tiếng lật. */
export function noise(e: Engine, { at = 0, dur, gain, filter = 'bandpass', hz = 1200, to, q = 1, attack = 0.004 }: NoiseOpts): void {
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

export const C5 = 523.25;

/**
 * Cầu nối sang `sfx-ui.ts`: file đó đăng ký `playSfx` khi nạp, để file này không
 * phụ thuộc vòng (ui → sfx → ui). Trước khi đăng ký, mọi lối gọi đều im lặng.
 */
type SfxPlayer = (id: string) => boolean;
let player: SfxPlayer | null = null;
export function bindSfxPlayer(fn: SfxPlayer): void {
  player = fn;
}

const play = (id: string): boolean => (player ? player(id) : false);
const silent = (..._args: unknown[]): boolean => false;

/**
 * Lối gọi cũ của game. Chỉ còn hai nhóm: đúng/sai. Mọi tên khác đều im — đúng với
 * yêu cầu chỉ giữ bốn âm thanh.
 */
export const sfx = {
  correct: (..._args: unknown[]): boolean => play('correct'),
  flyCorrect: (..._args: unknown[]): boolean => play('correct'),
  flyWrong: (..._args: unknown[]): boolean => play('wrong'),
  hurt: (..._args: unknown[]): boolean => play('wrong'),
  hit(_combo: number, _crit: boolean): void {
    play('correct');
  },
  slash: silent,
  impact: silent,
  block: silent,
  knockout: silent,
  heartbeat: silent,
  defeat: silent,
  levelUp: silent,
  loot: silent,
  potion: silent,
  shieldUp: silent,
  powerUp: silent,
  owl: silent,
  fever: silent,
  bossRoar: silent,
  sparkle: silent,
  coins: silent,
  tick: silent,
  flyArrive: silent,
};
