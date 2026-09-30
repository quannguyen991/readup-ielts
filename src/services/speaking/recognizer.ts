import { Platform } from 'react-native';

import type { RecognizedSegment } from './metrics';

/**
 * BỘ NGHE CỦA PHÒNG THI — Web Speech API, chỉ chạy trên web (Chrome, Edge).
 *
 * Khác bộ nghe của màn Đọc theo (`services/shadow/speech.ts`) ở ba chỗ, vì
 * phòng thi cần chúng để chấm:
 *   1. Giữ ĐỘ TIN CẬY của từng đoạn máy chốt — đó là căn cứ chính của band
 *      Pronunciation (ước lượng).
 *   2. Ghi MỐC THỜI GIAN mỗi lần máy nghe thêm chữ — để ước khoảng lặng và tốc
 *      độ nói, và để tự dừng khi người học im lặng đủ lâu.
 *   3. TỰ NỐI LẠI khi trình duyệt tự ngắt giữa chừng: Chrome hay tự kết thúc
 *      phiên nghe sau một quãng im hoặc khi mạng chập — câu trả lời Part 2 dài
 *      2 phút mà mất nửa sau là mất oan.
 *
 * Chrome gửi giọng tới dịch vụ nhận giọng của Google để đổi thành chữ; ReadUp
 * chỉ nhận lại phần chữ, không ghi âm.
 */

type Alt = { transcript: string; confidence?: number };
type RecResult = ArrayLike<Alt> & { isFinal: boolean };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<RecResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => Recognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecorderSnapshot = {
  /** Các đoạn đã chốt (qua mọi lần nối lại). */
  segments: RecognizedSegment[];
  /** Phần đang nghe dở, chưa chốt. */
  interim: string;
  /** Mốc (ms từ lúc mở micro) mỗi lần máy nghe thêm được chữ. */
  eventTimes: number[];
};

export type RecorderEnd = 'stopped' | 'denied' | 'error';

export type Recorder = {
  stop: () => void;
  snapshot: () => RecorderSnapshot;
  /** ms từ lúc mở micro. */
  startedAt: number;
};

export function transcriptOf(s: RecorderSnapshot): string {
  return [...s.segments.map((x) => x.text), s.interim]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tối đa bao nhiêu lần tự nối lại trong một câu trả lời. */
const MAX_RESTARTS = 8;

export function startRecorder(handlers: {
  onUpdate: (s: RecorderSnapshot) => void;
  onEnd: (reason: RecorderEnd, s: RecorderSnapshot) => void;
}): Recorder | null {
  const Ctor = ctor();
  if (!Ctor) return null;

  const startedAt = Date.now();
  const committed: RecognizedSegment[] = [];
  let current: RecognizedSegment[] = [];
  let interim = '';
  const eventTimes: number[] = [];
  let lastSig = '';
  let stopped = false;
  let failed: RecorderEnd | null = null;
  let restarts = 0;
  let rec: Recognition | null = null;

  const snap = (): RecorderSnapshot => ({ segments: [...committed, ...current], interim, eventTimes: [...eventTimes] });

  const open = () => {
    const r = new Ctor();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const finals: RecognizedSegment[] = [];
      const pending: string[] = [];
      for (let i = 0; i < e.results.length; i += 1) {
        const res = e.results[i]!;
        const alt = res[0];
        const text = (alt?.transcript ?? '').trim();
        if (!text) continue;
        if (res.isFinal) {
          const c = typeof alt?.confidence === 'number' && alt.confidence > 0 ? Math.round(alt.confidence * 1000) / 1000 : null;
          finals.push({ text, confidence: c });
        } else pending.push(text);
      }
      current = finals;
      interim = pending.join(' ');
      // Chỉ ghi mốc khi máy nghe thêm được chữ (sự kiện lặp lại y nguyên không tính).
      const sig = `${finals.map((f) => f.text).join('|')}#${interim}`;
      if (sig !== lastSig) {
        lastSig = sig;
        eventTimes.push(Date.now() - startedAt);
      }
      handlers.onUpdate(snap());
    };
    r.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') failed = 'denied';
      else if (e.error !== 'network') failed = 'error';
    };
    r.onend = () => {
      committed.push(...current);
      // Phần nghe dở lúc phiên ngắt vẫn là lời người học nói — giữ lại, không có độ tin cậy.
      if (interim.trim()) committed.push({ text: interim.trim(), confidence: null });
      current = [];
      interim = '';
      lastSig = '';
      if (!stopped && !failed && restarts < MAX_RESTARTS) {
        restarts += 1;
        try {
          open();
          return;
        } catch {
          failed = 'error';
        }
      }
      handlers.onEnd(stopped ? 'stopped' : (failed ?? 'error'), snap());
    };
    rec = r;
    r.start();
  };

  try {
    open();
  } catch {
    return null;
  }

  return {
    startedAt,
    snapshot: snap,
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        rec?.stop();
      } catch {
        // Đã dừng rồi.
      }
    },
  };
}
