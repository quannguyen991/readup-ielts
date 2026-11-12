import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { englishVoice } from './voice';
import { createClipLibrary, createLookup, isSingleWord, planPlayback, type Accent, type ClipVoice } from './pronounce-core';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import pronunciationVoice from '@/data/pronunciation-voice.json';

export type { Accent } from './pronounce-core';

/** Bản ghi âm người thật từ từ điển (dictionaryapi.dev, rồi tên tệp gstatic) — dùng khi kho clip Gemini không có hoặc đã loại mục đó. */
const dictLookup = createLookup();

/**
 * PHÁT ÂM CHUNG CỦA CẢ APP.
 *
 * Từ, cụm từ và câu: tìm clip của giọng mặc định trong kho dựng sẵn.
 * Chưa có clip hoặc lỗi mạng thì tạm dùng giọng máy (`englishVoice`).
 * Bản ghi âm chỉ phát trên web; app gốc dùng giọng máy (chưa cài thư viện âm thanh).
 *
 * Mọi lần phát đều dừng lần trước — không bao giờ chồng tiếng.
 */

/** Kho clip giọng Gemini: từ + cụm từ, rồi câu. Thiếu thư mục / index thì bỏ qua. */
export const clips = createClipLibrary({ sets: ['/audio/words/{voice}/', '/audio/lines/{voice}/'] });
/** Clip tiếng Nhật / Trung dựng sẵn (edge-tts): `/audio/east-asian/{ja,zh}/index.json`. Dùng "giọng" ja / zh làm khoá thư mục. */
const eastAsianClips = createClipLibrary({ sets: ['/audio/east-asian/{voice}/'] });
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof Audio !== 'undefined';

let token = 0;
let current: HTMLAudioElement | null = null;
const badUrls = new Set<string>();

export function autoPronounceSettings(): { auto: boolean; accent: Accent } {
  const s = useTopicStudyStore.getState().learnSettings;
  return { auto: s.autoPronounce !== false, accent: s.accent === 'uk' ? 'uk' : 'us' };
}

/** Dừng mọi tiếng đang đọc (cả bản ghi âm lẫn giọng máy). */
export function stopPronounce(): void {
  token++;
  cancelGestureRetry?.();
  if (current) {
    try {
      current.pause();
    } catch {
      /* bỏ qua */
    }
    current = null;
  }
  try {
    Speech.stop();
  } catch {
    /* bỏ qua */
  }
}

/** Chrome huỷ tiếng đang đọc rồi nói ngay thì hay nuốt mất câu mới — chờ một nhịp ngắn. */
function speakSoon(fn: () => void, afterStop: boolean) {
  if (!afterStop || !isWeb) return fn();
  setTimeout(fn, 40);
}

/**
 * Giọng máy. Trình duyệt chặn nói khi chưa chạm gì vào trang (`not-allowed`):
 * nhớ lại và nói ở lần chạm / bấm phím đầu tiên, không để mất tiếng im lặng.
 */
function tts(text: string, accent: Accent, rate: number, opts: { auto?: boolean; my?: number; language?: 'ja-JP' | 'zh-CN' } = {}) {
  const language = opts.language ?? (accent === 'uk' ? 'en-GB' : 'en-US');
  const go = () => {
    if (opts.my !== undefined && opts.my !== token) return;
    try {
      Speech.speak(text, {
        language,
        rate,
        voice: language.startsWith('en-') ? englishVoice() : undefined,
        onError: (e: unknown) => {
          const msg = String((e as { message?: string; error?: string })?.error ?? (e as { message?: string })?.message ?? e);
          if (opts.my !== undefined && opts.my !== token) return;
          if (opts.auto && /not-allowed/i.test(msg)) retryOnGesture(() => tts(text, accent, rate, { my: opts.my, language: opts.language }));
        },
      });
    } catch {
      /* máy không có giọng — im lặng */
    }
  };
  speakSoon(go, true);
}

/** Autoplay bị trình duyệt chặn (chưa chạm gì vào trang): phát lại ở lần chạm đầu tiên. */
let cancelGestureRetry: (() => void) | null = null;
function retryOnGesture(fn: () => void) {
  if (typeof window === 'undefined') return;
  cancelGestureRetry?.();
  const my = token;
  const cancel = () => {
    window.removeEventListener('pointerdown', go, true);
    window.removeEventListener('keydown', go, true);
    if (cancelGestureRetry === cancel) cancelGestureRetry = null;
  };
  const go = () => {
    cancel();
    if (my === token) fn();
  };
  cancelGestureRetry = cancel;
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}

export type PronounceOpts = { accent?: Accent; rate?: number; auto?: boolean; language?: 'en-US' | 'en-GB' | 'ja-JP' | 'zh-CN'; /** Ghim một giọng (ví dụ Chính tả chỉ dùng Sarah): không lùi về giọng khác. */ voice?: ClipVoice };

/** WAV im lặng ~0 mẫu, chỉ để "mở khoá" phần tử âm thanh trong lần chạm đầu tiên. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
let shared: HTMLAudioElement | null = null;
let unlockArmed = false;
function needsSharedAudio(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
}
function sharedAudio(): HTMLAudioElement {
  shared ??= new Audio();
  return shared;
}

/**
 * Mở khoá âm thanh ở cử chỉ ĐẦU TIÊN (chạm / bấm phím) ở bất kỳ đâu trong app: phát một đoạn im lặng trên phần tử dùng chung
 * và nói một câu rỗng bằng giọng máy. Từ đó trở đi các lần tự phát âm (không nằm trong lúc chạm) vẫn được phép — kể cả iOS.
 */
function armAudioUnlock() {
  if (unlockArmed || !isWeb) return;
  unlockArmed = true;
  const go = () => {
    window.removeEventListener('pointerdown', go, true);
    window.removeEventListener('keydown', go, true);
    try {
      const a = sharedAudio();
      if (!current && needsSharedAudio()) {
        a.src = SILENT_WAV;
        void a.play().then(() => a.pause()).catch(() => undefined);
      }
    } catch {
      /* bỏ qua */
    }
    try {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    } catch {
      /* bỏ qua */
    }
  };
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}
armAudioUnlock();

const PLAY_TIMEOUT_MS = 6000;

/** Optional console diagnostics for reproducing playback failures. */
function tracePlayback(a: HTMLAudioElement, event: string) {
  if (!isWeb || !new URLSearchParams(window.location.search).has('audioDebug')) return;
  console.debug('[vocab-audio] ' + JSON.stringify({ event, src: a.src,
    currentTime: a.currentTime, paused: a.paused, muted: a.muted, volume: a.volume,
    visibility: document.visibilityState, at: performance.now() }));
}

/**
 * Phát một mp3 qua bộ quản lý âm thanh DUY NHẤT (mỗi lúc một tiếng, dừng tiếng trước).
 * Trả `true` khi đã phát được, `false` khi lỗi / quá giờ / bị chặn — người gọi tự lùi về nguồn khác.
 * `blocked` báo trình duyệt chặn autoplay (chờ cử chỉ đầu tiên rồi thử lại).
 */
export async function playClipUrl(
  url: string,
  opts: { rate?: number; my?: number } = {},
): Promise<{ ok: boolean; blocked: boolean }> {
  if (!isWeb || badUrls.has(url)) return { ok: false, blocked: false };
  const my = opts.my ?? token;
  if (my !== token) return { ok: false, blocked: false };
  let a: HTMLAudioElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // MỘT phần tử <audio> dùng chung, đã được "mở khoá" bằng cử chỉ đầu tiên của người dùng: iOS Safari chỉ cho
    // phát tự động trên phần tử đã mở khoá, còn `new Audio()` mới mỗi lần bị chặn khi không nằm trong lúc chạm.
    // Máy tính / Android: một phần tử MỚI mỗi lần (đã chạy tốt); chỉ iPhone / iPad mới cần phần tử dùng chung đã mở khoá.
    a = needsSharedAudio() ? sharedAudio() : new Audio();
    const playingAudio = a;
    if (a === shared) {
      try {
        a.pause();
      } catch {
        /* bỏ qua */
      }
    }
    a.src = url;
    if (new URLSearchParams(window.location.search).has('audioDebug')) {
      for (const event of ['playing', 'ended', 'error']) {
        a.addEventListener(event, () => tracePlayback(playingAudio, event), { once: true });
      }
    }
    a.playbackRate = (opts.rate ?? 0.9) <= 0.7 ? 0.8 : 1;
    current = a;
    a.onended = () => {
      if (my === token && current === playingAudio) current = null;
    };
    await Promise.race([
      a.play(),
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'TimeoutError' })), PLAY_TIMEOUT_MS);
      }),
    ]);
    if (my !== token) {
      try {
        // A newer request may already be playing on the shared iOS element.
        if (a !== shared) a.pause();
      } catch {
        /* bỏ qua */
      }
    }
    return { ok: my === token, blocked: false };
  } catch (e) {
    // A timed-out play() can still start later: stop it before TTS takes over.
    if (a && my === token) {
      try { a.pause(); } catch { /* already released */ }
    }
    const name = (e as { name?: string })?.name;
    if (name === 'NotAllowedError') {
      if (current && my === token) current = null;
      return { ok: false, blocked: true };
    }
    // Bị CẮT NGANG (lượt phát mới / người học bấm sang câu khác): không phải lỗi của clip — đừng đánh dấu hỏng,
    // nếu không từ đó mất bản ghi âm thật cả phiên và lặng lẽ lùi về giọng máy.
    if (name === 'AbortError' || my !== token) return { ok: false, blocked: false };
    if (current && my === token) current = null;
    // Quá giờ chỉ là mạng chậm / tab nền: lần này lùi về giọng máy nhưng KHÔNG đánh dấu clip hỏng. Chỉ lỗi thật (404, không giải mã được) mới đánh dấu.
    if (name !== 'TimeoutError') badUrls.add(url);
    return { ok: false, blocked: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Phát MỘT clip theo đường dẫn bất kỳ (ví dụ `/audio/lines/aoede/<tên>.mp3` của huấn luyện viên / câu ví dụ)
 * qua cùng bộ quản lý một-tiếng-một-lúc: dừng tiếng đang đọc rồi mới phát. Trả `true` khi phát được.
 * Muốn tra theo văn bản (từ / cụm / câu → clip của giọng đang chọn) thì dùng `pronounce(text)`.
 */
export async function playClip(url: string, opts: { rate?: number } = {}): Promise<boolean> {
  stopPronounce();
  const r = await playClipUrl(url, { rate: opts.rate, my: token });
  return r.ok;
}

/** Sarah có kho clip thật và làm giọng dự phòng cuối cho các mục còn thiếu. */
export const FALLBACK_CLIP_VOICE: ClipVoice = 'sarah';

/** Giọng clip đang chọn trong Cài đặt học; mặc định là Aoede. */
export function currentClipVoice(): ClipVoice {
  return useTopicStudyStore.getState().learnSettings.clipVoice ?? (pronunciationVoice.id as ClipVoice);
}

/**
 * Đọc MỘT từ / cụm từ / câu bằng clip của giọng mặc định.
 * Thiếu clip hoặc lỗi thì tạm dùng giọng máy, không đổi sang giọng Gemini khác.
 */
export async function pronounce(text: string, opts: PronounceOpts = {}): Promise<void> {
  const word = text.trim();
  if (!word) return;
  stopPronounce();
  const my = token;
  const accent = opts.accent ?? autoPronounceSettings().accent;
  const rate = opts.rate ?? 0.9;
  const language = opts.language;

  try {
    // Giọng mặc định trước; chưa có clip thì thử giọng Alice; vẫn thiếu mới tới giọng máy.
    if (isWeb && (!language || language.startsWith('en-'))) {
      const pinned = opts.voice;
      const voice = pinned ?? currentClipVoice();
      const url =
        (await clips.find(voice, word)) ??
        (!pinned && voice !== 'aoede' ? await clips.find('aoede', word) : null) ??
        (!pinned && voice !== FALLBACK_CLIP_VOICE ? await clips.find(FALLBACK_CLIP_VOICE, word) : null);
      if (my !== token) return;
      if (url) {
        const r = await playClipUrl(url, { rate, my });
        if (my !== token) return;
        if (r.ok) return;
        if (r.blocked) {
          if (opts.auto) retryOnGesture(() => void pronounce(word, { ...opts, auto: false }));
          return;
        }
      }
      // Không có clip đã kiểm: thử bản ghi âm người thật từ từ điển (chỉ từ đơn) trước khi tới giọng máy.
      if (isSingleWord(word)) {
        const plan = await planPlayback(word, accent, dictLookup);
        if (my !== token) return;
        if (plan.kind === 'audio') {
          for (const u of [plan.url, ...plan.alts]) {
            const r = await playClipUrl(u, { rate, my });
            if (my !== token) return;
            if (r.ok) return;
            if (r.blocked) {
              if (opts.auto) retryOnGesture(() => void pronounce(word, { ...opts, auto: false }));
              return;
            }
          }
        }
      }
    }
    // Tiếng Nhật / Trung: clip dựng sẵn trước, thiếu mới tới giọng máy.
    if (isWeb && (language === 'ja-JP' || language === 'zh-CN')) {
      const url = await eastAsianClips.find(language === 'ja-JP' ? ('ja' as ClipVoice) : ('zh' as ClipVoice), word);
      if (my !== token) return;
      if (url) {
        const r = await playClipUrl(url, { rate, my });
        if (my !== token) return;
        if (r.ok) return;
        if (r.blocked) {
          if (opts.auto) retryOnGesture(() => void pronounce(word, { ...opts, auto: false }));
          return;
        }
      }
    }
    // Chưa có clip của mục này (kho clip đang được sinh dần): giọng máy chỉ là TẠM THỜI để không im lặng.
    tts(word, accent, rate, { auto: opts.auto, my, language: language === 'ja-JP' || language === 'zh-CN' ? language : undefined });
  } catch {
    if (my === token) tts(word, accent, rate, { auto: opts.auto, my, language: language === 'ja-JP' || language === 'zh-CN' ? language : undefined });
  }
}

/**
 * Nạp sẵn bản ghi âm của các từ sắp tới. Thử lần lượt từng đường dẫn: cái nào 404 thì
 * đánh dấu hỏng (lúc phát khỏi chờ), cái nào tải được thì giữ lại cho trình duyệt nhớ.
 */
export function preloadPronunciation(_words?: readonly string[], _accent?: Accent): void {
  if (!isWeb) return;
  void clips.warm(currentClipVoice());
}

/** Mỗi khoảng này một cặp (khoá, từ) chỉ tự phát một lần — chống React dựng lại hai lần. */
let lastAuto = '';
let lastAutoAt = 0;
let lastAutoToken = 0;

/**
 * Tự đọc `word` nếu người học bật "Tự phát âm". Dùng chung cho
 * lúc từ hiện ra và lúc đáp án lộ ra (đúng hay sai). `id` chống phát hai lần cùng một lần hiện.
 * Trả `true` khi đã gọi phát.
 */
export function autoSpeak(word: string | null | undefined, id: string, language?: 'en' | 'ja' | 'zh'): boolean {
  if (!word) return false;
  const { auto } = autoPronounceSettings();
  // KHÔNG xét tắt tiếng hiệu ứng game: đó là âm thanh chém quái / chuông, còn phát âm là nội dung học. Người học muốn im
  // thì tắt "Tự phát âm" ở Cài đặt học (nếu gộp hai thứ, tắt tiếng game sẽ lặng lẽ làm mất luôn tiếng đọc từ).
  if (!auto) return false;
  const full = `${id}|${word}`;
  const now = Date.now();
  if (full === lastAuto && token === lastAutoToken && now - lastAutoAt < 1500) return false;
  lastAuto = full;
  lastAutoAt = now;
  void pronounce(word, { auto: true, language: language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : undefined });
  lastAutoToken = token;
  return true;
}

/**
 * Tự đọc `word` khi nó hiện ra (đổi `word` hoặc `key` = thẻ mới). `word` rỗng/null
 * thì im. Chỉ theo công tắc "Tự phát âm" (không theo tắt tiếng hiệu ứng game).
 */
export function useAutoPronounce(word: string | null | undefined, key: string | number = '', language?: 'en' | 'ja' | 'zh'): void {
  const enabled = useTopicStudyStore((s) => s.learnSettings.autoPronounce !== false);
  useEffect(() => {
    if (!word || !enabled) return;
    let ownedToken: number | undefined;
    const t = setTimeout(() => {
      if (autoSpeak(word, String(key), language)) ownedToken = token;
    }, 150);
    return () => {
      clearTimeout(t);
      // Leaving/hiding a card also cancels its queued autoplay retry.
      // A manual playback or another screen may already own the player.
      if (ownedToken === token) stopPronounce();
    };
  }, [word, key, enabled, language]);
}

/** Một câu trong chuỗi `speakLines`. */
export type SpokenLine = { text: string; rate: number; pauseMs?: number };

/**
 * Đọc MỘT CHUỖI câu liền nhau bằng giọng máy chung (cùng giọng Nữ/Nam đã chọn),
 * dừng bất kỳ tiếng nào đang đọc trước đó. `onEnd(true)` khi đọc hết; `onEnd(false)`
 * khi bị dừng giữa chừng (`stopPronounce`, lượt đọc mới, hoặc hàm dừng trả về).
 * Dùng cho huấn luyện viên giọng nói — cần biết khi nào nói xong để không chồng lên micro.
 */
export function speakLines(lines: readonly SpokenLine[], opts: { onStart?: () => void; onEnd?: (completed: boolean) => void } = {}): () => void {
  stopPronounce();
  const my = token;
  let i = 0;
  let ended = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const end = (completed: boolean) => {
    if (ended) return;
    ended = true;
    if (timer) clearTimeout(timer);
    opts.onEnd?.(completed);
  };
  const step = () => {
    if (my !== token) return end(false);
    const line = lines[i];
    if (!line) return end(true);
    i += 1;
    const advance = () => {
      if (my !== token) return end(false);
      if (line.pauseMs) timer = setTimeout(step, line.pauseMs);
      else step();
    };
    try {
      Speech.speak(line.text, { language: 'en-US', rate: line.rate, voice: englishVoice(), onDone: advance, onStopped: advance, onError: advance });
    } catch {
      end(false);
    }
  };
  opts.onStart?.();
  step();
  return () => {
    if (my === token) stopPronounce();
    end(false);
  };
}
