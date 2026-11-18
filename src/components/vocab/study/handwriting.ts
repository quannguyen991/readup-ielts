import { Platform } from 'react-native';

/** Phông chữ viết tay cho thẻ tiếng Nhật / tiếng Trung (Google Fonts, trình duyệt chỉ tải các mảnh chữ cần dùng). */
const HREF = 'https://fonts.googleapis.com/css2?family=Klee+One:wght@600&family=Ma+Shan+Zheng&display=swap';
let injected = false;

export function ensureHandwritingFonts() {
  if (injected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  injected = true;
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = HREF;
    document.head.appendChild(link);
  } catch {
    /* không tải được thì dùng phông hệ thống */
  }
}

export function handwritingFont(language?: string) {
  if (language !== 'ja' && language !== 'zh') return undefined;
  ensureHandwritingFonts();
  return language === 'ja'
    ? { fontFamily: "'Klee One', 'Yu Mincho', 'Hiragino Mincho ProN', serif" }
    : { fontFamily: "'Ma Shan Zheng', 'KaiTi', 'STKaiti', serif" };
}
