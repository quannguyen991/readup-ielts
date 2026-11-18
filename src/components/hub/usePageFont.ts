import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Ép một vùng trang (theo `nativeID`) dùng Inter — phông tròn có đủ dấu tiếng Việt, cùng họ với khu Luyện nói.
 * Chữ không đặt phông riêng trong React Native Web sẽ rơi về phông hệ thống (Segoe UI…), nên các trang dùng
 * bộ thành phần kiểu Hôm nay (HubUi) ngoài khu Hub phải khai báo vùng này. Chỉ web; nạp phông một lần.
 */
export function usePageFont(rootId: string): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('page-font-link')) {
      const link = document.createElement('link');
      link.id = 'page-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap&subset=vietnamese';
      document.head.appendChild(link);
    }
    const id = `page-font-${rootId}`;
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `#${rootId}, #${rootId} * { font-family: 'Nunito', system-ui, sans-serif; }`;
    document.head.appendChild(style);
  }, [rootId]);
}
