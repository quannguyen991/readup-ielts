import { Platform } from 'react-native';

/**
 * Hoạt cảnh của avatar động và bìa hồ sơ — CSS keyframes gắn một lần vào <head>,
 * chạy lặp. Trình duyệt tự dừng khi tab ẩn; người đặt "giảm chuyển động" thấy
 * hình đứng yên.
 */
const ID = 'readup-profile-anim';

export function ensureProfileKeyframes(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(ID)) return;
  const el = document.createElement('style');
  el.id = ID;
  el.textContent = `
@keyframes rp-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes rp-bounce { 0%, 100% { transform: translateY(0) scale(1.08, 0.92); } 45% { transform: translateY(-7px) scale(0.94, 1.06); } 70% { transform: translateY(-2px) scale(1, 1); } }
@keyframes rp-float { 0%, 100% { transform: translateY(0); opacity: 0.85; } 50% { transform: translateY(-6px); opacity: 1; } }
@keyframes rp-tilt { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
@keyframes rp-puff { 0% { transform: translate(0, 0) scale(0.4); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(14px, -10px) scale(1.4); opacity: 0; } }
@keyframes rp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes rp-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes rp-shoot { 0% { transform: translate(0, 0); opacity: 0; } 4% { opacity: 1; } 16% { transform: translate(260px, 110px); opacity: 0; } 100% { transform: translate(260px, 110px); opacity: 0; } }
@keyframes rp-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes rp-sun { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
@keyframes rp-glow { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.08); } }
@media (prefers-reduced-motion: reduce) { [data-profile-move] { animation: none !important; } }`;
  document.head.appendChild(el);
}

type LoopOpts = { delay?: number; timing?: string };

/** Hoạt cảnh lặp vô hạn (web). Native trả rỗng — hình đứng yên, không vỡ. */
export function loop(name: string, ms: number, { delay = 0, timing = 'ease-in-out' }: LoopOpts = {}): object {
  if (Platform.OS !== 'web') return {};
  return {
    animationName: name,
    animationDuration: `${ms}ms`,
    animationDelay: `${delay}ms`,
    animationTimingFunction: timing,
    animationIterationCount: 'infinite',
  };
}

export const MOVE = { dataSet: { profileMove: '1' } } as object;
