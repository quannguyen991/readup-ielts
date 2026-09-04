import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Bôi đen chữ trong bài đọc → gọi `onSelect` với đoạn chữ vừa bôi.
 *
 * CHỈ CHẠY TRÊN WEB. iOS/Android không cho JavaScript đọc vùng bôi đen của
 * `<Text selectable>`, nên trên máy vẫn phải dùng đường cũ: chạm vào từ, hoặc
 * bật chế độ "Chọn cụm từ" rồi chạm từ đầu và từ cuối.
 *
 * Bắt ở `mouseup`/`touchend` chứ không phải `selectionchange`: selectionchange
 * bắn liên tục trong lúc còn đang kéo chuột, mở thẻ nghĩa ngay từ chữ cái đầu
 * tiên thì không ai bôi hết cụm được.
 */
export function useTextSelection(
  containerId: string,
  onSelect: (text: string) => void,
  enabled = true,
): void {
  // Giữ callback trong ref để không phải gỡ rồi gắn lại listener mỗi lần render.
  //
  // Gán trong effect chứ không gán thẳng trong thân hàm: ghi vào ref lúc render
  // là một hiệu ứng phụ nằm sai chỗ. Không có khoảng hở nào ở đây — listener chỉ
  // được gắn từ effect bên dưới, mà effect thì luôn chạy sau lần gán này.
  const handler = useRef(onSelect);
  useEffect(() => {
    handler.current = onSelect;
  }, [onSelect]);

  // Bôi đen xong mà người đọc bấm tiếp vào chính vùng đó thì trình duyệt vẫn
  // giữ nguyên selection cũ — không mở lại thẻ cho cùng một cụm chữ.
  const lastFired = useRef('');

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    if (typeof document === 'undefined') return;

    const onPointerUp = () => {
      // Đợi trình duyệt chốt xong vùng bôi: ở Safari, ngay trong mouseup thì
      // getSelection() vẫn trả về vùng của lần trước.
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? '';

        if (!text || text.length < 2) {
          lastFired.current = '';
          return;
        }

        if (text === lastFired.current) return;

        const container = document.getElementById(containerId);
        const anchor = selection?.anchorNode;
        if (!container || !anchor || !container.contains(anchor)) return;

        lastFired.current = text;
        handler.current(text);
      }, 0);
    };

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);

    return () => {
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
    };
  }, [containerId, enabled]);
}

/** Đang có vùng bôi đen khác rỗng hay không — dùng để chặn sự kiện chạm từ. */
export function hasActiveSelection(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return (window.getSelection()?.toString().trim().length ?? 0) > 1;
}
