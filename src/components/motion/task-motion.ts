import { Platform } from 'react-native';

/**
 * Hiệu ứng cho các TÁC VỤ (mục thanh bên, thẻ bài, thẻ trang chủ) — chỉ CSS trên web.
 *
 * Mỗi lớp là một mảnh hiệu ứng có thể gắn vào bất kỳ thành phần nào qua `className`:
 *   - rm-lift   : rê chuột thì nhô lên, quầng vàng sáng dần; bấm thì nén xuống.
 *   - rm-shine  : rê chuột thì một vệt sáng quét qua mặt thẻ.
 *   - rm-glow   : quầng vàng thở nhẹ, dùng cho mục đang chọn.
 *   - rm-ico    : biểu tượng bên trong nhảy nhẹ khi cả khối được rê vào (xem `.rm-lift:hover .rm-ico`).
 *
 * CSS chạy trên bộ kết xuất nên không tốn luồng JS cho từng thẻ. Người dùng bật "giảm
 * chuyển động" thì tắt hết.
 */

const TASK_CSS_ID = 'readup-task-motion';
const TASK_CSS = `
.rm-lift { transition: transform 240ms cubic-bezier(.2,.8,.2,1), box-shadow 240ms ease, background-color 200ms ease; will-change: transform; }
.rm-lift:hover { transform: translateY(-5px) scale(1.012); box-shadow: 0 18px 36px -14px rgba(185, 74, 112,.42), 0 0 0 2px rgba(217,164,65,.34), 0 0 30px rgba(232,190,100,.42); }
.rm-lift:active { transform: translateY(-1px) scale(.985); transition-duration: 90ms; }
.rm-shine { position: relative; overflow: hidden; }
.rm-shine::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 60%; pointer-events: none; background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,.62) 50%, rgba(255,255,255,0) 70%, transparent 100%); transform: translateX(-130%); }
.rm-shine:hover::after { transform: translateX(230%); transition: transform 760ms cubic-bezier(.2,.8,.2,1); }
.rm-glow { animation: rm-glow-pulse 2.6s ease-in-out infinite; }
@keyframes rm-glow-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,164,65,0), 0 6px 18px rgba(185, 74, 112,.22); } 50% { box-shadow: 0 0 0 4px rgba(217,164,65,.16), 0 0 26px rgba(232,190,100,.55), 0 6px 18px rgba(185, 74, 112,.22); } }
.rm-ico { transition: transform 280ms cubic-bezier(.34,1.56,.64,1); }
.rm-lift:hover .rm-ico, .rm-nav:hover .rm-ico { transform: scale(1.14) rotate(-7deg); }
.rm-nav { transition: transform 200ms cubic-bezier(.2,.8,.2,1), background-color 200ms ease, box-shadow 220ms ease; }
.rm-nav:hover { transform: translateX(3px); box-shadow: 0 0 0 1px rgba(217,164,65,.28), 0 0 18px rgba(232,190,100,.28); }
.rm-nav:active { transform: translateX(1px) scale(.98); transition-duration: 90ms; }
@media (prefers-reduced-motion: reduce) {
  .rm-lift, .rm-nav, .rm-ico, .rm-glow, .rm-shine::after { transition: none !important; animation: none !important; }
  .rm-lift:hover, .rm-nav:hover { transform: none !important; }
}`;

let injected = false;

/** Chèn CSS một lần duy nhất. Gọi ở đầu module của thành phần nào dùng các lớp này. */
export function ensureTaskMotionCss(): void {
  if (Platform.OS !== 'web' || injected || typeof document === 'undefined') return;
  if (document.getElementById(TASK_CSS_ID)) {
    injected = true;
    return;
  }
  const el = document.createElement('style');
  el.id = TASK_CSS_ID;
  el.textContent = TASK_CSS;
  document.head.appendChild(el);
  injected = true;
}
