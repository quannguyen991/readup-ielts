import { Platform } from 'react-native';

/**
 * Đọc to một câu bằng giọng có sẵn của trình duyệt (không tốn lượt AI, không gửi
 * âm thanh đi đâu). Trả về hàm dừng. Máy không có giọng thì im lặng, không báo lỗi.
 *
 * `onWord` nhận vị trí ký tự (charIndex) mỗi khi giọng đọc tới một từ — dùng để chạy
 * chữ theo giọng (màn Nói đuổi). Trình duyệt không hỗ trợ sự kiện này thì không gọi.
 */
export function speak(
  text: string,
  opts: { rate?: number; onDone?: () => void; onWord?: (charIndex: number) => void } = {},
): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    opts.onDone?.();
    return () => undefined;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = opts.rate ?? 0.95;
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
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.speechSynthesis?.cancel();
}
