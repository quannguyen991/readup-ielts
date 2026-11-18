import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Nạp phông chữ Hán sans (Noto Sans SC) trên web. Ma Shan Zheng chỉ còn cho màn luyện viết (handwriting.ts).
 * KHÔNG gắn `subset=vietnamese`: subset đó loại chữ Hán, và chữ Hán sẽ rơi về phông hệ thống.
 * Chưa tải xong thì chữ rơi về phông CJK có sẵn, không rơi về serif.
 */
const HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Ma+Shan+Zheng&display=swap';

export function useChineseFonts(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('zh-band9-fonts')) return;
    const link = document.createElement('link');
    link.id = 'zh-band9-fonts';
    link.rel = 'stylesheet';
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
}
