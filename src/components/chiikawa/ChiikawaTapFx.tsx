import { useEffect } from 'react';
import { Platform } from 'react-native';

const GLYPHS = ['♥', '✦', '✿', '♡', '✦'];

/**
 * Chạm lên màn hình khi đang dùng chủ đề Chiikawa: vài ngôi sao và tim hồng bay ra từ
 * chỗ chạm. Chỉ web; nằm ngoài cây React (thêm thẳng vào trang, tự xoá sau khi bay xong).
 */
export function ChiikawaTapFx() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onDown = (e: PointerEvent) => {
      if (!document.documentElement.classList.contains('theme-chiikawa')) return;
      for (let i = 0; i < 5; i += 1) {
        const el = document.createElement('span');
        el.textContent = GLYPHS[i % GLYPHS.length] ?? '♥';
        el.setAttribute('aria-hidden', 'true');
        Object.assign(el.style, {
          position: 'fixed',
          left: `${e.clientX}px`,
          top: `${e.clientY}px`,
          pointerEvents: 'none',
          zIndex: '99999',
          color: i % 2 ? '#D65E86' : '#F4A6C0',
          fontSize: `${12 + Math.round(Math.random() * 8)}px`,
          transform: 'translate(-50%, -50%)',
          userSelect: 'none',
        });
        document.body.appendChild(el);
        const dx = (Math.random() - 0.5) * 90;
        const dy = -(40 + Math.random() * 60);
        const anim = el.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1)`, opacity: 0 },
          ],
          { duration: 700 + Math.random() * 300, easing: 'ease-out', fill: 'forwards' },
        );
        anim.onfinish = () => el.remove();
      }
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
  return null;
}
