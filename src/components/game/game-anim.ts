import { Platform } from 'react-native';

/**
 * Hoạt cảnh của game khi học — CSS keyframes gắn một lần vào <head>.
 *
 * Mỗi nhịp (chém, trúng đòn, hạ quái, số bay lên) là một hoạt cảnh CHẠY MỘT LẦN
 * trên một phần tử được dựng lại bằng `key` theo mã sự kiện: sự kiện mới → phần
 * tử mới → hoạt cảnh chạy lại từ đầu. Không có bộ đếm giờ JS nào phải dọn.
 *
 * Người đặt "giảm chuyển động": các cú lao, rung, nhún bị tắt; số và thông báo
 * vẫn hiện (chỉ mờ dần) vì đó là thông tin, không phải trang trí.
 */

const ID = 'readup-game-anim';

export function ensureGameKeyframes(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(ID)) return;
  const el = document.createElement('style');
  el.id = ID;
  el.textContent = `
@keyframes rg-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes rg-lunge { 0% { transform: translateX(0); } 30% { transform: translateX(34px); } 55% { transform: translateX(26px); } 100% { transform: translateX(0); } }
@keyframes rg-enemy-lunge { 0% { transform: translateX(0); } 30% { transform: translateX(-34px); } 55% { transform: translateX(-26px); } 100% { transform: translateX(0); } }
@keyframes rg-hit { 0% { transform: translateX(0); filter: brightness(1); } 12% { filter: brightness(3.2) saturate(0.2); } 25% { transform: translateX(7px); } 40% { transform: translateX(-6px); filter: brightness(1.4); } 60% { transform: translateX(4px); } 80% { transform: translateX(-2px); } 100% { transform: translateX(0); filter: brightness(1); } }
@keyframes rg-hurt { 0%, 100% { opacity: 1; transform: translateX(0); } 15% { opacity: 0.25; transform: translateX(-6px); } 30% { opacity: 1; transform: translateX(5px); } 45% { opacity: 0.25; transform: translateX(-3px); } 60% { opacity: 1; } }
@keyframes rg-die { 0% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); } 20% { filter: brightness(3.5) saturate(0); } 100% { opacity: 0; transform: translateY(14px) scale(0.5) rotate(-12deg); filter: brightness(2); } }
@keyframes rg-enter { 0% { opacity: 0; transform: translateX(70px); } 100% { opacity: 1; transform: translateX(0); } }
@keyframes rg-slash { 0% { opacity: 0; transform: rotate(-35deg) scaleX(0); } 15% { opacity: 1; } 45% { opacity: 1; transform: rotate(-35deg) scaleX(1); } 100% { opacity: 0; transform: rotate(-35deg) scaleX(1.1); } }
@keyframes rg-float { 0% { opacity: 0; transform: translateY(8px) scale(0.6); } 14% { opacity: 1; transform: translateY(0) scale(1.18); } 26% { transform: translateY(-4px) scale(1); } 75% { opacity: 1; transform: translateY(-24px); } 100% { opacity: 0; transform: translateY(-34px); } }
@keyframes rg-pop { 0% { transform: scale(0.2); opacity: 0; } 60% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes rg-shield { 0% { opacity: 0; transform: scale(0.4); } 25% { opacity: 1; transform: scale(1.15); } 70% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.3); } }
@keyframes rg-flame { 0%, 100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.14) rotate(5deg); } }
@keyframes rg-banner { 0% { opacity: 0; transform: translateY(-40px) scale(0.8); } 10% { opacity: 1; transform: translateY(0) scale(1.06); } 16% { transform: scale(1); } 86% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-16px); } }
@keyframes rg-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes rg-toast { 0% { opacity: 0; transform: translateX(40px); } 7% { opacity: 1; transform: translateX(0); } 90% { opacity: 1; transform: translateX(0); } 100% { opacity: 0; transform: translateX(24px); } }
@keyframes rg-bubble { 0% { opacity: 0; transform: translateY(6px) scale(0.9); } 10% { opacity: 1; transform: translateY(0) scale(1); } 85% { opacity: 1; } 100% { opacity: 0; } }
@keyframes rg-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { [data-game-move] { animation: none !important; } }`;
  document.head.appendChild(el);
}

type AnimOpts = { delay?: number; timing?: string; loop?: boolean; fill?: 'forwards' | 'both' | 'none' };

/** Style chạy một hoạt cảnh (web). Native trả về rỗng — đứng yên, không vỡ. */
export function anim(name: string, ms: number, { delay = 0, timing = 'ease-out', loop = false, fill = 'both' }: AnimOpts = {}): object {
  if (Platform.OS !== 'web') return {};
  return {
    animationName: name,
    animationDuration: `${ms}ms`,
    animationDelay: `${delay}ms`,
    animationTimingFunction: timing,
    animationIterationCount: loop ? 'infinite' : 1,
    animationFillMode: fill,
  };
}

/** Đánh dấu một phần tử là "chuyển động thuần trang trí" — tắt khi giảm chuyển động. */
export const MOVE = { dataSet: { gameMove: '1' } } as object;
