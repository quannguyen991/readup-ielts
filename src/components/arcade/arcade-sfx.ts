/*
  Âm thanh 8-bit tổng hợp bằng WebAudio: không tải file, không cần mạng.
  Chỉ phát trên web. Trình duyệt chỉ cho phát sau một cử chỉ của người dùng, nên AudioContext
  được tạo ở lần phát đầu tiên. Native hoặc trình duyệt không có WebAudio thì im lặng.
*/

export type Sfx = 'move' | 'select' | 'back' | 'start' | 'coin' | 'error';

const MUTE_KEY = 'band9:arcade:mute';

function readMute(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMute();
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // Không lưu được thì thôi: chỉ mất ghi nhớ giữa các lần mở.
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Một nốt vuông (hoặc răng cưa) có đường tắt dần âm lượng, tuỳ chọn trượt tần số. */
function tone(
  c: AudioContext,
  at: number,
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; slideTo?: number } = {},
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + at;
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  gain.gain.setValueAtTime(opts.vol ?? 0.06, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SEQUENCES: Record<Sfx, (c: AudioContext) => void> = {
  move: (c) => tone(c, 0, 880, 0.035, { vol: 0.035 }),
  select: (c) => {
    tone(c, 0, 523, 0.07);
    tone(c, 0.07, 784, 0.1);
  },
  back: (c) => tone(c, 0, 392, 0.09, { slideTo: 220 }),
  start: (c) => {
    tone(c, 0, 262, 0.1);
    tone(c, 0.1, 330, 0.1);
    tone(c, 0.2, 392, 0.1);
    tone(c, 0.3, 523, 0.25, { vol: 0.07 });
  },
  coin: (c) => {
    tone(c, 0, 988, 0.06);
    tone(c, 0.06, 1319, 0.14);
  },
  error: (c) => tone(c, 0, 160, 0.2, { type: 'sawtooth', vol: 0.05 }),
};

/** Phát một hiệu ứng âm thanh. Không làm gì khi đang tắt tiếng hoặc không có WebAudio. */
export function playSfx(name: Sfx): void {
  if (muted) return;
  try {
    const c = audio();
    if (c) SEQUENCES[name](c);
  } catch {
    // Lỗi âm thanh không được làm hỏng màn hình.
  }
}
