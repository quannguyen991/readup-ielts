import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Mặt chữ đọc báo: Lora cho thân bài, Playfair Display cho tiêu đề.
 *
 * VÌ SAO KHÔNG DÙNG GEORGIA NỮA. Georgia và serif hệ thống không dựng được dấu
 * tiếng Việt ("phố" ra "phô ́"), nên trước đây cột tiếng Việt buộc phải dùng
 * chữ không chân. Lora và Playfair Display đều có bộ ký tự tiếng Việt và có
 * dáng NGHIÊNG thật (không phải nghiêng giả do trình duyệt bẻ chữ) — đó là thứ
 * cho phép xen chữ nghiêng vào tiêu đề, sapo, câu ví dụ mà vẫn đẹp ở cả hai
 * thứ tiếng.
 *
 * Nạp bằng thẻ <link> lúc mở màn đọc, chỉ trên web. Chưa tải xong thì chuỗi
 * phông rơi về Plus Jakarta Sans — bộ chữ của app, đủ dấu — chứ KHÔNG rơi về
 * `serif`, vì serif mặc định lại chính là Georgia.
 */
const HREF =
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700;1,800&display=swap&subset=vietnamese';

const FALLBACK = 'PlusJakartaSans_400Regular';

export const readingFont = {
  body: Platform.select({ web: `Lora, ${FALLBACK}`, default: FALLBACK }) as string,
  display: Platform.select({ web: `"Playfair Display", ${FALLBACK}`, default: FALLBACK }) as string,
  sans: FALLBACK,
  mono: Platform.select({ web: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', default: 'monospace' }) as string,
};

export function useReadingFonts(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.querySelector('link[data-reading-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = HREF;
    link.setAttribute('data-reading-fonts', '1');
    document.head.appendChild(link);
  }, []);
}
