import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Hai đầu âm thanh của màn Đọc theo:
 * - GIỌNG MẪU: giọng đọc của máy (expo-speech → Web Speech API), kèm sự kiện
 *   "đang đọc tới ký tự thứ n" để tô chữ chạy theo kiểu karaoke.
 * - MICRO: bộ nhận giọng của trình duyệt (Chrome, Edge, Safari mới). Trả về
 *   chuỗi chữ nó nghe được, cả kết quả tạm lẫn kết quả chốt.
 *
 * Không có bộ nhận giọng thì trả null — màn luyện NÓI RÕ là máy không chấm
 * được trên trình duyệt đó; giả vờ "máy chấm" khi chẳng có gì nghe là nói dối
 * người học về chính kết quả của họ.
 *
 * Nói thật về quyền riêng tư: Chrome gửi giọng tới dịch vụ nhận giọng của
 * Google để đổi thành chữ; ReadUp chỉ nhận lại phần chữ, không ghi âm.
 */

type RecResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<RecResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecognize(): boolean {
  return recognitionCtor() !== null;
}

export type ListenEnd = 'done' | 'no-speech' | 'denied' | 'error';

export type Listening = { stop: () => void };

export function startListening(handlers: { onText: (text: string, final: boolean) => void; onEnd: (reason: ListenEnd) => void }): Listening | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'en-US';
  // Liên tục: câu dài người học hay ngập ngừng giữa chừng; chế độ một lượt sẽ cắt ngang ở chỗ ngập ngừng đầu tiên.
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let reason: ListenEnd = 'done';
  let heardAnything = false;
  rec.onresult = (e) => {
    const parts: string[] = [];
    let final = true;
    for (let i = 0; i < e.results.length; i += 1) {
      const r = e.results[i]!;
      parts.push(r[0]?.transcript ?? '');
      if (!r.isFinal) final = false;
    }
    const text = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (text) heardAnything = true;
    handlers.onText(text, final);
  };
  rec.onerror = (e) => {
    if (e.error === 'aborted') return;
    reason = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'no-speech' : 'error';
  };
  rec.onend = () => handlers.onEnd(reason === 'done' && !heardAnything ? 'no-speech' : reason);
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        // Đã dừng rồi.
      }
    },
  };
}

/** Số hiệu lượt đọc mẫu mới nhất — sự kiện muộn của lượt đã bị huỷ thì bỏ qua. */
let latestUtterance = 0;

/**
 * Đọc mẫu một câu. `onChar` nhận vị trí ký tự đang đọc: lấy từ sự kiện của
 * giọng máy nếu giọng đó có phát (giọng cài sẵn trên Windows/macOS có), còn
 * không thì ƯỚC theo đồng hồ — khoảng 14,7 ký tự mỗi giây ở tốc độ 1.
 * Trả về hàm dừng.
 */
export function speakSentence(text: string, opts: { rate: number; onChar?: (charIndex: number) => void; onDone?: () => void }): () => void {
  Speech.stop();
  latestUtterance += 1;
  const turn = latestUtterance;
  const live = () => turn === latestUtterance;
  let startedAt = 0;
  let realEvents = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const clear = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const finish = () => {
    clear();
    if (live()) opts.onDone?.();
  };
  Speech.speak(text, {
    language: 'en-US',
    rate: opts.rate,
    onStart: () => {
      if (!live()) return;
      startedAt = Date.now();
      if (!opts.onChar) return;
      timer = setInterval(() => {
        if (realEvents || !live()) return clear();
        opts.onChar?.(Math.min(text.length - 1, Math.floor((Date.now() - startedAt) * 0.0147 * opts.rate)));
      }, 120);
    },
    onBoundary: opts.onChar
      ? (ev: { charIndex: number }) => {
          if (!live()) return;
          realEvents = true;
          opts.onChar?.(ev.charIndex);
        }
      : undefined,
    onDone: finish,
    onStopped: finish,
    onError: finish,
  });
  return () => {
    clear();
    if (!live()) return;
    latestUtterance += 1;
    Speech.stop();
  };
}
