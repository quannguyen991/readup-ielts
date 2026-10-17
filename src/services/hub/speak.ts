import { Platform } from 'react-native';

import { speakWithAoede, stopSpeakWithAoede } from '@/services/speaking/voice';

/**
 * Đọc to một câu. Ưu tiên giọng Aoede (giọng AI chuẩn bản ngữ, đã dùng ở phòng Nói); nếu không
 * phát được (chưa đăng nhập, hết lượt, không có mạng) thì rơi về giọng có sẵn của trình duyệt.
 * Trả về hàm dừng. Máy không có âm thanh thì im lặng, không báo lỗi.
 *
 * `onWord` (chạy chữ theo giọng, màn Nói đuổi) chỉ dùng được với giọng trình duyệt, nên khi có
 * `onWord` thì luôn dùng giọng trình duyệt.
 */
export function speak(
  text: string,
  opts: { rate?: number; pitch?: number; onDone?: () => void; onWord?: (charIndex: number) => void } = {},
): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    opts.onDone?.();
    return () => undefined;
  }
  if (opts.onWord) return browserSpeak(text, opts);

  let stopped = false;
  let stopCurrent: () => void = () => undefined;
  const fallback = () => {
    if (stopped) return;
    stopCurrent = browserSpeak(text, opts);
  };
  stopCurrent = speakWithAoede(text, {
    rate: opts.rate,
    onDone: () => {
      if (!stopped) opts.onDone?.();
    },
    onError: fallback,
  });
  return () => {
    stopped = true;
    stopCurrent();
  };
}

function browserSpeak(
  text: string,
  opts: { rate?: number; pitch?: number; onDone?: () => void; onWord?: (charIndex: number) => void },
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    opts.onDone?.();
    return () => undefined;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = opts.rate ?? 0.95;
  if (opts.pitch !== undefined) u.pitch = opts.pitch;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang?.startsWith('en-US')) ?? voices.find((v) => v.lang?.startsWith('en'));
  if (voice) u.voice = voice;
  u.onend = () => opts.onDone?.();
  u.onerror = () => opts.onDone?.();
  if (opts.onWord) {
    const onWord = opts.onWord;
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'word') onWord(e.charIndex);
    };
  }
  window.speechSynthesis.speak(u);
  return () => window.speechSynthesis?.cancel();
}

/** Dừng ngay mọi câu đang đọc (dùng cho nút "Nhấn để ngắt"). */
export function stopSpeaking(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    stopSpeakWithAoede();
    window.speechSynthesis?.cancel();
  }
}
