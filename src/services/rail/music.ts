/**
 * NHẠC KHÔNG LỜI cho "Chuyến tàu chậm" — tự tổng hợp bằng Web Audio, không có
 * tệp âm thanh nào: nền hợp âm (pad), bè trầm, giai điệu ngũ cung ngẫu nhiên
 * có hạt giống (mỗi bài một hạt giống nên nghe lại vẫn đúng bài đó), trống
 * lo-fi nhẹ như nhịp bánh xe trên ray, tiếng mưa bằng nhiễu lọc.
 *
 * Trình duyệt chỉ cho phát âm thanh sau một cú bấm của người dùng → `start()`
 * phải gọi trong trình xử lý sự kiện.
 */

export type MusicStyle = 'piano' | 'lofi' | 'ambient' | 'bell';

export type Track = { name: string; bpm: number; key: number; prog: number[][]; seed: number };

// Hợp âm tính theo bậc nửa cung so với chủ âm (0 = chủ âm).
const MAJ7 = [0, 4, 7, 11];
const MIN7 = [0, 3, 7, 10];
const chord = (root: number, q: number[]) => q.map((n) => n + root);

export const TRACKS: readonly Track[] = [
  { name: 'Ga sớm mai', bpm: 72, key: 60, prog: [chord(0, MAJ7), chord(9, MIN7), chord(5, MAJ7), chord(7, [0, 4, 7, 10])], seed: 11 },
  { name: 'Hàng cây bên ô kính', bpm: 68, key: 57, prog: [chord(0, MIN7), chord(5, MIN7), chord(10, MAJ7), chord(3, MAJ7)], seed: 23 },
  { name: 'Phố đèn vàng', bpm: 76, key: 62, prog: [chord(0, MAJ7), chord(4, MIN7), chord(9, MIN7), chord(5, MAJ7)], seed: 37 },
  { name: 'Mưa gõ cửa toa', bpm: 64, key: 55, prog: [chord(0, MIN7), chord(8, MAJ7), chord(3, MAJ7), chord(10, [0, 4, 7, 10])], seed: 41 },
  { name: 'Tuyết trên sân ga', bpm: 60, key: 64, prog: [chord(0, MAJ7), chord(5, MAJ7), chord(2, MIN7), chord(7, MAJ7)], seed: 53 },
  { name: 'Chuyến đêm về phương Nam', bpm: 70, key: 58, prog: [chord(0, MIN7), chord(3, MAJ7), chord(5, MIN7), chord(7, MIN7)], seed: 67 },
  { name: 'Cánh đồng lướt qua', bpm: 80, key: 65, prog: [chord(0, MAJ7), chord(7, MAJ7), chord(9, MIN7), chord(5, MAJ7)], seed: 71 },
  { name: 'Ngọn hải đăng xa', bpm: 66, key: 59, prog: [chord(0, MIN7), chord(10, MAJ7), chord(8, MAJ7), chord(7, [0, 4, 7, 10])], seed: 83 },
  { name: 'Tách trà trên tàu', bpm: 74, key: 61, prog: [chord(0, MAJ7), chord(2, MIN7), chord(4, MIN7), chord(5, MAJ7)], seed: 97 },
  { name: 'Nhịp ray đều đều', bpm: 78, key: 56, prog: [chord(0, MIN7), chord(5, MIN7), chord(7, MIN7), chord(3, MAJ7)], seed: 101 },
  { name: 'Ngân hà ngoài cửa sổ', bpm: 58, key: 63, prog: [chord(0, MAJ7), chord(9, MIN7), chord(2, MIN7), chord(7, MAJ7)], seed: 113 },
  { name: 'Về tới ga cuối', bpm: 70, key: 60, prog: [chord(0, MAJ7), chord(5, MAJ7), chord(9, MIN7), chord(7, [0, 4, 7, 10])], seed: 127 },
];

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RailMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private rand = rng(1);
  track = 0;
  style: MusicStyle = 'piano';
  playing = false;
  /** Gọi mỗi khi chuyển bài (tự đổi bài sau vài ga, hoặc hết vòng). */
  onTrack?: (i: number) => void;

  private ensure() {
    if (this.ctx) return this.ctx;
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    // Lọc thấp chung: nhạc mềm, không chói trên loa laptop.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    this.musicBus.connect(lp).connect(this.master);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  setVolume(v: number) {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Tiếng mưa: nhiễu trắng qua lọc dải, lặp vô hạn. */
  setRain(on: boolean, level = 0.35) {
    const ctx = this.ensure();
    if (on && !this.rainGain) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'lowpass';
      bp.frequency.value = 1400;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 300;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      this.rainGain.gain.linearRampToValueAtTime(level, ctx.currentTime + 1.5);
      src.connect(bp).connect(hp).connect(this.rainGain).connect(this.master!);
      src.start();
    } else if (!on && this.rainGain) {
      const g = this.rainGain;
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => g.disconnect(), 1200);
      this.rainGain = null;
    }
  }

  start(track = this.track) {
    const ctx = this.ensure();
    void ctx.resume();
    this.track = ((track % TRACKS.length) + TRACKS.length) % TRACKS.length;
    this.rand = rng(TRACKS[this.track]!.seed);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.playing = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 90);
    this.onTrack?.(this.track);
  }

  stop() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  skip(dir: 1 | -1) {
    this.start(this.track + dir);
  }

  dispose() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.rainGain = null;
  }

  private schedule() {
    const ctx = this.ctx!;
    const tr = TRACKS[this.track]!;
    const eighth = 60 / tr.bpm / 2;
    while (this.nextTime < ctx.currentTime + 0.4) {
      this.playStep(tr, this.step, this.nextTime, eighth);
      this.nextTime += eighth;
      this.step++;
      // Một bài = 8 vòng hợp âm (~2 phút), rồi tự sang bài kế.
      if (this.step >= tr.prog.length * 8 * 8) {
        this.start(this.track + 1);
        return;
      }
    }
  }

  private playStep(tr: Track, step: number, t: number, eighth: number) {
    const bar = Math.floor(step / 8) % tr.prog.length;
    const inBar = step % 8;
    const ch = tr.prog[bar]!.map((n) => n + tr.key);
    const r = this.rand;
    if (inBar === 0) {
      this.pad(ch, t, eighth * 8);
      this.bass(ch[0]! - 24, t, eighth * 3);
    }
    if (inBar === 4) this.bass(ch[0]! - 24 + (r() < 0.5 ? 7 : 0), t, eighth * 3);
    if (this.style === 'lofi') {
      if (inBar === 0 || inBar === 5) this.kick(t);
      if (inBar % 2 === 1) this.hat(t, 0.05);
      if (inBar === 4) this.hat(t, 0.1, 1800);
    }
    // Giai điệu thưa: nốt trong hợp âm, lên xuống một quãng tám.
    const density = this.style === 'ambient' ? 0.18 : this.style === 'bell' ? 0.3 : 0.45;
    if (r() < density) {
      const n = ch[Math.floor(r() * ch.length)]! + (r() < 0.5 ? 12 : 24);
      if (this.style === 'bell') this.bell(n, t);
      else this.piano(n, t, this.style === 'ambient' ? 2.4 : 1.4);
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private pad(notes: number[], t: number, dur: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    this.env(g, t, this.style === 'ambient' ? 0.08 : 0.05, 0.9, dur + 1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = this.style === 'ambient' ? 1400 : 900;
    g.connect(lp).connect(this.musicBus!);
    for (const n of notes) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = freq(n);
        o.detune.value = det;
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 1.4);
      }
    }
  }

  private bass(n: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq(n);
    const g = ctx.createGain();
    this.env(g, t, 0.16, 0.02, dur);
    o.connect(g).connect(this.musicBus!);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  private piano(n: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    this.env(g, t, 0.09, 0.008, dur);
    g.connect(this.musicBus!);
    for (const [mult, lvl] of [
      [1, 1],
      [2, 0.25],
      [3, 0.08],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq(n) * mult;
      const og = ctx.createGain();
      og.gain.value = lvl;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  private bell(n: number, t: number) {
    const ctx = this.ctx!;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const mg = ctx.createGain();
    car.frequency.value = freq(n);
    mod.frequency.value = freq(n) * 3.5;
    mg.gain.value = freq(n) * 0.8;
    mg.gain.exponentialRampToValueAtTime(1, t + 1.5);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain();
    this.env(g, t, 0.06, 0.005, 3);
    car.connect(g).connect(this.musicBus!);
    car.start(t);
    mod.start(t);
    car.stop(t + 3.1);
    mod.stop(t + 3.1);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = ctx.createGain();
    this.env(g, t, 0.22, 0.004, 0.25);
    o.connect(g).connect(this.musicBus!);
    o.start(t);
    o.stop(t + 0.3);
  }

  private hat(t: number, lvl: number, cutoff = 6000) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = cutoff > 3000 ? 'highpass' : 'bandpass';
    hp.frequency.value = cutoff;
    const g = ctx.createGain();
    this.env(g, t, lvl, 0.002, 0.07);
    src.connect(hp).connect(g).connect(this.musicBus!);
    src.start(t, Math.random());
    src.stop(t + 0.1);
  }
}
