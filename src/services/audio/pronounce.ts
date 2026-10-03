import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { englishVoice, voiceGender } from './voice';
import { clipVoiceFor, createClipLibrary, createLookup, isSingleWord, planPlayback, type Accent, type ClipVoice } from './pronounce-core';

export type { Accent } from './pronounce-core';

/**
 * PHÁT ÂM CHUNG CỦA CẢ APP.
 *
 * Từ đơn: thử bản ghi âm NGƯỜI THẬT trước (api.dictionaryapi.dev, mp3 giọng Mỹ /
 * Anh), quá 1,5 giây, không có bản, hoặc ngoại tuyến thì lùi về giọng máy tốt
 * nhất (`englishVoice`) với nhịp chậm 0,9. Cụm từ và câu đi thẳng giọng máy.
 * Bản ghi âm chỉ phát trên web; app gốc dùng giọng máy (chưa cài thư viện âm thanh).
 *
 * Mọi lần phát đều dừng lần trước — không bao giờ chồng tiếng.
 */

const lookup = createLookup();
/** Kho clip giọng Gemini (Kore / Fenrir): từ + cụm từ, rồi câu. Thiếu thư mục / index thì bỏ qua. */
export const clips = createClipLibrary({ sets: ['/audio/words/{voice}/', '/audio/lines/{voice}/'] });
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
function tts(text: string, accent: Accent, rate: number, opts: { auto?: boolean; my?: number } = {}) {
  const go = () => {
    if (opts.my !== undefined && opts.my !== token) return;
    try {
      Speech.speak(text, {
        language: accent === 'uk' ? 'en-GB' : 'en-US',
        rate,
        voice: englishVoice(),
        onError: (e: unknown) => {
          const msg = String((e as { message?: string; error?: string })?.error ?? (e as { message?: string })?.message ?? e);
          if (opts.auto && /not-allowed/i.test(msg)) retryOnGesture(() => tts(text, accent, rate));
        },
      });
    } catch {
      /* máy không có giọng — im lặng */
    }
  };
  speakSoon(go, true);
}

/** Autoplay bị trình duyệt chặn (chưa chạm gì vào trang): phát lại ở lần chạm đầu tiên. */
let retryArmed = false;
function retryOnGesture(fn: () => void) {
  if (retryArmed || typeof window === 'undefined') return;
  retryArmed = true;
  const go = () => {
    retryArmed = false;
    window.removeEventListener('pointerdown', go, true);
    window.removeEventListener('keydown', go, true);
    fn();
  };
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}

export type PronounceOpts = { accent?: Accent; rate?: number; auto?: boolean };

/** WAV im lặng ~0 mẫu, chỉ để "mở khoá" phần tử âm thanh trong lần chạm đầu tiên. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
let shared: HTMLAudioElement | null = null;
let unlockArmed = false;
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
      if (!current) {
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

const PLAY_TIMEOUT_MS = 2500;

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
  try {
    // MỘT phần tử <audio> dùng chung, đã được "mở khoá" bằng cử chỉ đầu tiên của người dùng: iOS Safari chỉ cho
    // phát tự động trên phần tử đã mở khoá, còn `new Audio()` mới mỗi lần bị chặn khi không nằm trong lúc chạm.
    const a = sharedAudio();
    try {
      a.pause();
    } catch {
      /* bỏ qua */
    }
    a.src = url;
    a.playbackRate = (opts.rate ?? 0.9) <= 0.7 ? 0.8 : 1;
    current = a;
    a.onended = () => {
      if (current === a) current = null;
    };
    await Promise.race([
      a.play(),
      new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'TimeoutError' })), PLAY_TIMEOUT_MS)),
    ]);
    if (my !== token) {
      try {
        a.pause();
      } catch {
        /* bỏ qua */
      }
    }
    return { ok: true, blocked: false };
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === 'NotAllowedError') {
      if (current && my === token) current = null;
      return { ok: false, blocked: true };
    }
    // Bị CẮT NGANG (lượt phát mới / người học bấm sang câu khác): không phải lỗi của clip — đừng đánh dấu hỏng,
    // nếu không từ đó mất bản ghi âm thật cả phiên và lặng lẽ lùi về giọng máy.
    if (name === 'AbortError' || my !== token) return { ok: false, blocked: false };
    if (current && my === token) current = null;
    badUrls.add(url); // 404 / không giải mã được / quá giờ: lần sau khỏi thử lại
    return { ok: false, blocked: false };
  }
}

/**
 * Phát MỘT clip theo đường dẫn bất kỳ (ví dụ `/audio/lines/kore/<tên>.mp3` của huấn luyện viên / câu ví dụ)
 * qua cùng bộ quản lý một-tiếng-một-lúc: dừng tiếng đang đọc rồi mới phát. Trả `true` khi phát được.
 * Muốn tra theo văn bản (từ / cụm / câu → clip của giọng đang chọn) thì dùng `pronounce(text)`.
 */
export async function playClip(url: string, opts: { rate?: number } = {}): Promise<boolean> {
  stopPronounce();
  const r = await playClipUrl(url, { rate: opts.rate, my: token });
  return r.ok;
}

/** Giọng Gemini đang chọn (Nữ → kore, Nam → fenrir). */
export function currentClipVoice(): ClipVoice {
  return clipVoiceFor(voiceGender());
}

/**
 * Đọc MỘT từ / cụm từ / câu. Thứ tự: clip giọng Gemini theo giới đã chọn
 * (khoá = đúng chuỗi văn bản) → bản ghi âm người thật (chỉ từ đơn, chỉ giọng Nữ vì
 * bản ghi lẫn giới) → giọng máy. Lỗi ở nguồn nào cũng lùi sang nguồn kế, không im lặng.
 */
export async function pronounce(text: string, opts: PronounceOpts = {}): Promise<void> {
  const word = text.trim();
  if (!word) return;
  stopPronounce();
  const my = token;
  const accent = opts.accent ?? autoPronounceSettings().accent;
  const rate = opts.rate ?? 0.9;

  try {
    // MỘT giọng duy nhất của cả app: clip Gemini Kore. Không còn bản ghi âm người thật hay giọng nam / Anh–Anh.
    if (isWeb) {
      const url = await clips.find(currentClipVoice(), word);
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
    tts(word, accent, rate, { auto: opts.auto, my });
  } catch {
    if (my === token) tts(word, accent, rate, { auto: opts.auto, my });
  }
}

/**
 * Nạp sẵn bản ghi âm của các từ sắp tới. Thử lần lượt từng đường dẫn: cái nào 404 thì
 * đánh dấu hỏng (lúc phát khỏi chờ), cái nào tải được thì giữ lại cho trình duyệt nhớ.
 */
const preloaded = new Map<string, HTMLAudioElement>();
const probing = new Set<string>();
function probe(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const a = new Audio();
      const done = (ok: boolean) => {
        clearTimeout(timer);
        if (ok) {
          preloaded.set(url, a);
          if (preloaded.size > 24) preloaded.delete(preloaded.keys().next().value as string);
        } else {
          badUrls.add(url);
        }
        resolve(ok);
      };
      const timer = setTimeout(() => resolve(true), 5000); // chưa rõ: không kết luận là hỏng
      a.preload = 'auto';
      a.onloadeddata = () => done(true);
      a.onerror = () => done(false);
      a.src = url;
    } catch {
      resolve(true);
    }
  });
}

export function preloadPronunciation(_words?: readonly string[], _accent?: Accent): void {
  if (!isWeb) return;
  void clips.warm(currentClipVoice());
}

/** Mỗi khoảng này một cặp (khoá, từ) chỉ tự phát một lần — chống React dựng lại hai lần. */
let lastAuto = '';
let lastAutoAt = 0;

/**
 * Tự đọc `word` nếu người học bật "Tự phát âm" và app không tắt tiếng. Dùng chung cho
 * lúc từ hiện ra và lúc đáp án lộ ra (đúng hay sai). `id` chống phát hai lần cùng một lần hiện.
 * Trả `true` khi đã gọi phát.
 */
export function autoSpeak(word: string | null | undefined, id: string): boolean {
  if (!word) return false;
  const { auto } = autoPronounceSettings();
  // KHÔNG xét tắt tiếng hiệu ứng game: đó là âm thanh chém quái / chuông, còn phát âm là nội dung học. Người học muốn im
  // thì tắt "Tự phát âm" ở Cài đặt học (nếu gộp hai thứ, tắt tiếng game sẽ lặng lẽ làm mất luôn tiếng đọc từ).
  if (!auto) return false;
  const full = `${id}|${word}`;
  const now = Date.now();
  if (full === lastAuto && now - lastAutoAt < 1500) return false;
  lastAuto = full;
  lastAutoAt = now;
  void pronounce(word, { auto: true });
  return true;
}

/**
 * Tự đọc `word` khi nó hiện ra (đổi `word` hoặc `key` = thẻ mới). `word` rỗng/null
 * thì im. Chỉ theo công tắc "Tự phát âm" (không theo tắt tiếng hiệu ứng game).
 */
export function useAutoPronounce(word: string | null | undefined, key: string | number = ''): void {
  useEffect(() => {
    if (!word) return;
    const t = setTimeout(() => autoSpeak(word, String(key)), 150);
    return () => clearTimeout(t);
  }, [word, key]);
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
