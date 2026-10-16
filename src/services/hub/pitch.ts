/**
 * Cao độ (F0) và ngữ điệu từ âm thanh micro, bằng tự tương quan (autocorrelation).
 *
 * Đây là đo thật trên tín hiệu: độ rộng cao độ (theo nửa cung), và hướng của đoạn
 * cuối câu (lên hay xuống). Không đo trọng âm từ hay phát âm từng âm vị.
 */

export type PitchPoint = { t: number; hz: number | null };

/** Cao độ một khung âm thanh, hoặc null nếu khung im lặng / không có giọng rõ. */
export function detectPitch(frame: Float32Array, sampleRate: number, minHz = 70, maxHz = 400): number | null {
  let energy = 0;
  for (let i = 0; i < frame.length; i += 1) energy += (frame[i] ?? 0) * (frame[i] ?? 0);
  const rms = Math.sqrt(energy / Math.max(1, frame.length));
  if (rms < 0.01) return null;

  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(frame.length - 1, Math.ceil(sampleRate / minHz));
  let best = 0;
  let bestLag = -1;
  const r0 = autocorr(frame, 0);
  if (r0 <= 0) return null;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    const r = autocorr(frame, lag) / r0;
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }
  // Ngưỡng độ tương quan: dưới đây coi như không có giọng đều đặn (tạp âm, phụ âm xát).
  if (bestLag < 0 || best < 0.55) return null;
  return sampleRate / bestLag;
}

function autocorr(x: Float32Array, lag: number): number {
  let s = 0;
  for (let i = 0; i + lag < x.length; i += 1) s += (x[i] ?? 0) * (x[i + lag] ?? 0);
  return s;
}

/** Cao độ theo thời gian, khung 40 ms, bước 20 ms. */
export function pitchTrack(samples: Float32Array, sampleRate: number, frameMs = 40, hopMs = 20): PitchPoint[] {
  const frame = Math.round((sampleRate * frameMs) / 1000);
  const hop = Math.round((sampleRate * hopMs) / 1000);
  const out: PitchPoint[] = [];
  for (let start = 0; start + frame <= samples.length; start += hop) {
    const slice = samples.subarray(start, start + frame);
    out.push({ t: start / sampleRate, hz: detectPitch(slice, sampleRate) });
  }
  return out;
}

/** Số nửa cung của một tần số so với tần số gốc. */
export function semitones(hz: number, ref = 100): number {
  return 12 * Math.log2(hz / ref);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[idx] ?? 0;
}

export type IntonationStats = {
  /** Tỉ lệ khung có giọng. */
  voicedRatio: number;
  medianHz: number | null;
  /** Khoảng cách từ phân vị 10 đến 90 của cao độ, theo nửa cung. */
  rangeSt: number | null;
  /** Hướng đoạn cuối: lên, xuống, hoặc ngang. null nếu quá ít giọng. */
  finalDirection: 'rising' | 'falling' | 'flat' | null;
};

/** Đoạn cuối = 25% cuối các khung có giọng; so với đoạn giữa để biết lên hay xuống. */
export function intonationStats(track: PitchPoint[]): IntonationStats {
  const voiced = track.filter((p): p is { t: number; hz: number } => p.hz !== null);
  const voicedRatio = track.length ? voiced.length / track.length : 0;
  if (voiced.length < 8) return { voicedRatio, medianHz: null, rangeSt: null, finalDirection: null };

  const st = voiced.map((p) => semitones(p.hz));
  const sorted = [...st].sort((a, b) => a - b);
  const medianHz = 100 * Math.pow(2, percentile(sorted, 0.5) / 12);
  const rangeSt = percentile(sorted, 0.9) - percentile(sorted, 0.1);

  const n = st.length;
  const middle = st.slice(Math.floor(n * 0.35), Math.floor(n * 0.6));
  const last = st.slice(Math.floor(n * 0.75));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const delta = avg(last) - avg(middle);
  const finalDirection: IntonationStats['finalDirection'] = delta > 1.5 ? 'rising' : delta < -1.5 ? 'falling' : 'flat';

  return { voicedRatio, medianHz, rangeSt, finalDirection };
}

/**
 * Điểm ngữ điệu 0–100: độ rộng 5–12 nửa cung là tự nhiên (100 điểm); hẹp hơn thì
 * giảm (giọng đều đều); rộng quá thì giảm nhẹ. Không đủ giọng thì null.
 */
export function intonationScore(stats: IntonationStats): number | null {
  if (stats.rangeSt === null || stats.voicedRatio < 0.25) return null;
  const r = stats.rangeSt;
  let score: number;
  if (r >= 5 && r <= 12) score = 100;
  else if (r < 5) score = Math.max(0, 100 - (5 - r) * 18);
  else score = Math.max(0, 100 - (r - 12) * 6);
  return Math.round(score);
}
