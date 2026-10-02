import type { AudioSentence, NarrationLang, Scene, SceneAudioTrack } from './types';

/** Phần thuần (không DOM) của trình phát thuyết minh — để test được. */

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
export type Speed = (typeof SPEEDS)[number];
export const SEEK_STEP = 10;

export function isSpeed(n: unknown): n is Speed {
  return SPEEDS.includes(n as Speed);
}

export function nextSpeed(cur: number): Speed {
  const i = SPEEDS.indexOf(cur as Speed);
  if (i < 0) return 1;
  return SPEEDS[(i + 1) % SPEEDS.length] ?? 1;
}

/** Ngôn ngữ thuyết minh có thật cho cảnh (EN luôn đứng đầu). */
export function narrationLangs(scene: Scene | undefined): NarrationLang[] {
  const out: NarrationLang[] = [];
  if (scene?.audio?.en?.file) out.push('en');
  if (scene?.audio?.vi?.file) out.push('vi');
  return out;
}

export function trackOf(scene: Scene | undefined, lang: NarrationLang): SceneAudioTrack | undefined {
  return scene?.audio?.[lang];
}

/**
 * Câu đang đọc ở giây `t`. CHỈ khi audio có mốc câu THẬT (`sentences`); không có thì trả `-1` —
 * tuyệt đối không suy ra từ tốc độ đọc ước lượng.
 */
export function sentenceAt(sentences: readonly AudioSentence[] | undefined, t: number): number {
  if (!sentences || sentences.length === 0) return -1;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i]!;
    if (t >= s.start && t < s.end) return i;
  }
  // Kẽ hở giữa hai câu: giữ câu vừa đọc xong thay vì nhấp tắt.
  let last = -1;
  for (let i = 0; i < sentences.length; i++) if (sentences[i]!.start <= t) last = i;
  return last;
}

/** Mã đoạn đang đọc (khi câu có `paragraphId`). */
export function paragraphAt(sentences: readonly AudioSentence[] | undefined, t: number): string | null {
  const i = sentenceAt(sentences, t);
  return i >= 0 ? (sentences![i]!.paragraphId ?? null) : null;
}

export function hasSentenceSync(track: SceneAudioTrack | undefined): boolean {
  return !!track?.sentences && track.sentences.length > 0;
}

export function clampSeek(t: number, duration: number): number {
  if (!Number.isFinite(t)) return 0;
  const max = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
  return Math.min(Math.max(0, t), max);
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Cảnh kế / trước trong danh sách đang hiện. */
export function neighbour(ids: readonly string[], current: string, dir: 1 | -1): string | null {
  const i = ids.indexOf(current);
  if (i < 0) return null;
  return ids[i + dir] ?? null;
}

export type AudioFail = 'missing' | 'blocked' | 'decode' | 'network' | 'tts';

/** Mã lỗi của `MediaError` → nhóm lỗi mà UI hiểu. 404 ở trình duyệt hiện là SRC_NOT_SUPPORTED (4). */
export function classifyMediaError(code: number | undefined, online = true): AudioFail {
  if (code === 4) return online ? 'missing' : 'network';
  if (code === 2) return 'network';
  if (code === 3) return 'decode';
  return 'missing';
}

/**
 * Giọng thiết bị đọc "xong" nhanh bất thường (không có giọng, bị chặn) thì KHÔNG coi là đã đọc: `speakLines`
 * coi lỗi như đã hết câu. Ngưỡng: dưới ~90 ms mỗi từ (người đọc nhanh nhất ~ 3 từ/giây ở tốc độ 1,5×) là thất bại.
 */
export function ttsLooksFailed(elapsedMs: number, words: number): boolean {
  return elapsedMs < Math.max(1200, words * 90);
}
