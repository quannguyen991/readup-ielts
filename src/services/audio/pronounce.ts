import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { isSfxMuted } from './sfx';
import { englishVoice, voiceGender } from './voice';
import { createLookup, isSingleWord, planPlayback, type Accent } from './pronounce-core';

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

function tts(text: string, accent: Accent, rate: number) {
  Speech.speak(text, { language: accent === 'uk' ? 'en-GB' : 'en-US', rate, voice: englishVoice() });
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

export async function pronounce(text: string, opts: PronounceOpts = {}): Promise<void> {
  const word = text.trim();
  if (!word) return;
  stopPronounce();
  const my = token;
  const accent = opts.accent ?? autoPronounceSettings().accent;
  const rate = opts.rate ?? 0.9;

  // Bản ghi âm có lẫn giọng nam/nữ, không ép được giới: chọn Nam thì từ đơn cũng đọc bằng giọng máy nam.
  if (!isWeb || !isSingleWord(word) || voiceGender() === 'm') {
    tts(word, accent, rate);
    return;
  }
  const plan = await planPlayback(word, accent, lookup);
  if (my !== token) return; // đã có lần phát mới hơn
  if (plan.kind === 'tts') {
    tts(word, accent, rate);
    return;
  }
  let blocked = false;
  for (const url of [plan.url, ...plan.alts]) {
    if (badUrls.has(url)) continue;
    try {
      const a = new Audio(url);
      a.playbackRate = rate <= 0.7 ? 0.8 : 1;
      current = a;
      a.onended = () => {
        if (current === a) current = null;
      };
      await a.play();
      return;
    } catch (e) {
      if (my !== token) return;
      current = null;
      if ((e as { name?: string })?.name === 'NotAllowedError') {
        blocked = true;
        break;
      }
      badUrls.add(url); // 404 / không giải mã được: lần sau khỏi thử lại
    }
  }
  if (my !== token) return;
  if (blocked) {
    if (opts.auto) retryOnGesture(() => void pronounce(word, { ...opts, auto: false }));
    return;
  }
  tts(word, accent, rate);
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

export function preloadPronunciation(words: readonly string[], accent?: Accent): void {
  if (!isWeb || voiceGender() === 'm') return;
  const acc = accent ?? autoPronounceSettings().accent;
  void (async () => {
    for (const w of words) {
      const key = `${acc}|${w}`;
      if (!isSingleWord(w) || probing.has(key)) continue;
      probing.add(key);
      const p = await planPlayback(w, acc, lookup);
      if (p.kind !== 'audio') continue;
      for (const u of [p.url, ...p.alts]) {
        if (badUrls.has(u)) continue;
        if (preloaded.has(u) || (await probe(u))) break;
      }
    }
  })();
}

/** Mỗi khoảng này một cặp (khoá, từ) chỉ tự phát một lần — chống React dựng lại hai lần. */
let lastAuto = '';
let lastAutoAt = 0;

/**
 * Tự đọc `word` khi nó hiện ra (đổi `word` hoặc `key` = thẻ mới). `word` rỗng/null
 * thì im. Tôn trọng công tắc "Tự phát âm" và tắt tiếng của app.
 */
export function useAutoPronounce(word: string | null | undefined, key: string | number = ''): void {
  useEffect(() => {
    if (!word) return;
    const { auto } = autoPronounceSettings();
    if (!auto || isSfxMuted()) return;
    const id = `${key}|${word}`;
    const t = setTimeout(() => {
      const now = Date.now();
      if (id === lastAuto && now - lastAutoAt < 1500) return;
      lastAuto = id;
      lastAutoAt = now;
      void pronounce(word, { auto: true });
    }, 150);
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
