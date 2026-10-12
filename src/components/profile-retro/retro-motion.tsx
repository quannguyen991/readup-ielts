/**
 * Chuyển động retro: một bộ keyframes chèn một lần vào trang (web), bọc phần tử bằng
 * `RetroFx` để bật đúng hiệu ứng. Trên native không có chuyển động, phần tử hiện thẳng.
 *
 * Mọi hiệu ứng đều tắt khi người dùng bật "giảm chuyển động" trong hệ điều hành.
 */
import React from 'react';
import { Platform } from 'react-native';

export type RetroFxKind = 'drop' | 'pop' | 'lift' | 'wiggle' | 'bob' | 'marquee';

const RETRO_MOTION_CSS = `
@keyframes rt-drop {
  0% { transform: translateY(-150%) rotate(-4deg); opacity: 0; }
  55% { transform: translateY(6%) rotate(1.2deg); opacity: 1; }
  78% { transform: translateY(-2%) rotate(-0.5deg); }
  100% { transform: none; }
}
@keyframes rt-pop {
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.07); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes rt-wiggle {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-9deg); }
  40% { transform: rotate(7deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(3deg); }
}
@keyframes rt-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-4px) rotate(1deg); }
}
@keyframes rt-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.rt-drop { animation: rt-drop 780ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.rt-pop { animation: rt-pop 520ms cubic-bezier(0.3, 1.5, 0.5, 1) both; }
.rt-bob { animation: rt-bob 3.4s ease-in-out infinite; }
.rt-marquee { animation: rt-marquee 24s linear infinite; }
.rt-lift { transition: transform 200ms cubic-bezier(0.3, 1.6, 0.6, 1); }
.rt-lift:hover { transform: translate(-2px, -3px) rotate(-2deg); }
.rt-lift:active { transform: translate(3px, 3px) rotate(0deg); transition-duration: 60ms; }
.rt-wiggle:hover { animation: rt-wiggle 620ms ease-in-out; }
@media (prefers-reduced-motion: reduce) {
  .rt-drop, .rt-pop, .rt-bob, .rt-marquee, .rt-wiggle:hover { animation: none !important; }
  .rt-lift, .rt-lift:hover, .rt-lift:active { transition: none; transform: none; }
}
`;

let injected = false;

function ensureRetroMotion() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = RETRO_MOTION_CSS;
  document.head.appendChild(el);
}

/**
 * Bọc một phần tử để có chuyển động retro. `delay` tính bằng giây để các phần tử
 * cạnh nhau vào lần lượt. `style` ghi đè khi cần (ví dụ `display: 'flex'` để chiếm hết bề ngang).
 */
export function RetroFx({
  kind,
  delay = 0,
  style,
  children,
}: {
  kind: RetroFxKind;
  delay?: number;
  style?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  ensureRetroMotion();
  if (Platform.OS !== 'web') return <>{children}</>;
  return React.createElement(
    'div',
    { className: `rt-${kind}`, style: { display: 'inline-flex', animationDelay: `${delay}s`, ...style } },
    children,
  );
}
