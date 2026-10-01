/**
 * Kiểu dáng giao diện Thành Phố Tri Thức (chỉ web, chỉ máy tính). Giao diện nổi
 * trên canvas 3D nên viết bằng CSS thuần: cần :hover, :focus-visible, backdrop
 * blur và `prefers-reduced-motion` — những thứ StyleSheet của React Native không
 * có. Tất cả lớp mang tiền tố `cg-` để không đụng phần còn lại của app.
 *
 * Chữ nhỏ nhất 14px (quy ước chung của ReadUp).
 */
import { useEffect } from 'react';

export const CG = {
  ink: '#10213F',
  body: '#34455F',
  muted: '#5E6E86',
  line: 'rgba(16,33,63,0.10)',
  /*
    Bảng nổi trên canvas 3D: KHÔNG dùng backdrop-filter blur — mỗi khung canvas
    vẽ lại (kéo bản đồ, nước gợn) trình duyệt phải làm mờ lại cả vùng dưới bảng.
    Nền gần đặc thay cho lớp kính mờ.
  */
  panel: 'rgba(255,255,255,0.965)',
  brand: '#A8843F',
  brandDeep: '#8F6E36',
  brandSoft: '#FBF3E2',
  ok: '#1F9254',
  okSoft: '#E4F6EC',
  warn: '#B7791F',
  warnSoft: '#FDF3E1',
  bad: '#C8402F',
  badSoft: '#FDECEA',
  font: 'PlusJakartaSans_500Medium, "Plus Jakarta Sans", system-ui, sans-serif',
  fontBold: 'PlusJakartaSans_700Bold, "Plus Jakarta Sans", system-ui, sans-serif',
  fontX: 'PlusJakartaSans_800ExtraBold, "Plus Jakarta Sans", system-ui, sans-serif',
} as const;

const CSS = `
.cg-root{position:absolute;inset:0;overflow:hidden;font-family:${CG.font};color:${CG.ink};font-size:15px;line-height:1.45;
  background:linear-gradient(180deg,#9FD0F2 0%,#C9E6F7 46%,#F3E9D2 100%);user-select:none;-webkit-user-select:none}
.cg-root *{box-sizing:border-box}
.cg-b{font-family:${CG.fontBold}}
.cg-x{font-family:${CG.fontX}}
.cg-panel{background:${CG.panel};border:1px solid rgba(255,255,255,0.7);
  border-radius:18px;box-shadow:0 10px 30px rgba(22,48,96,0.16),0 1px 0 rgba(255,255,255,0.8) inset}
.cg-btn{appearance:none;border:0;background:#fff;color:${CG.ink};font:inherit;font-family:${CG.fontBold};font-size:15px;border-radius:12px;
  padding:9px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 1px 0 ${CG.line},0 0 0 1px ${CG.line} inset;
  transition:transform .12s ease,background .15s ease,box-shadow .15s ease}
.cg-btn:hover{background:#FBF6EA}
.cg-btn:active{transform:translateY(1px)}
.cg-btn:focus-visible,.cg-tool:focus-visible,.cg-card:focus-visible,.cg-tab:focus-visible{outline:3px solid #E2C88F;outline-offset:2px}
.cg-btn[disabled]{opacity:.5;cursor:not-allowed}
.cg-btn.primary{background:${CG.brand};color:#fff;box-shadow:0 6px 16px rgba(168,132,63,.35)}
.cg-btn.primary:hover{background:${CG.brandDeep}}
.cg-btn.ghost{background:transparent;box-shadow:none}
.cg-btn.ghost:hover{background:rgba(168,132,63,.08)}
.cg-btn.danger{color:${CG.bad}}
.cg-btn.small{padding:6px 10px;font-size:14px;border-radius:10px}
.cg-tool{appearance:none;border:0;width:48px;height:48px;border-radius:14px;background:transparent;cursor:pointer;display:flex;
  align-items:center;justify-content:center;font-size:22px;position:relative;color:${CG.ink};transition:background .15s ease}
.cg-tool:hover{background:rgba(168,132,63,.10)}
.cg-tool.on{background:${CG.brand};color:#fff;box-shadow:0 6px 14px rgba(168,132,63,.35)}
.cg-tool .cg-key{position:absolute;right:3px;bottom:1px;font-size:14px;line-height:1;opacity:.55;font-family:${CG.fontBold}}
.cg-tip{position:absolute;left:58px;top:50%;transform:translateY(-50%);white-space:nowrap;background:${CG.ink};color:#fff;font-size:14px;
  padding:5px 10px;border-radius:8px;pointer-events:none;opacity:0;transition:opacity .12s ease}
.cg-tool:hover .cg-tip{opacity:1}
.cg-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fff;box-shadow:0 0 0 1px ${CG.line} inset;
  font-family:${CG.fontBold};font-size:15px;white-space:nowrap}
.cg-card{appearance:none;border:0;text-align:left;font:inherit;color:inherit;background:#fff;border-radius:14px;padding:10px 12px;cursor:pointer;
  box-shadow:0 0 0 1px ${CG.line} inset;display:flex;gap:10px;align-items:flex-start;transition:box-shadow .15s ease,transform .12s ease;width:100%}
.cg-card:hover{box-shadow:0 0 0 2px #E2C88F inset}
.cg-card.on{box-shadow:0 0 0 2px ${CG.brand} inset;background:#FBF6EA}
.cg-card.locked{opacity:.62}
.cg-tab{appearance:none;border:0;background:transparent;font:inherit;font-family:${CG.fontBold};font-size:14px;color:${CG.muted};padding:7px 8px;
  border-radius:10px;cursor:pointer;white-space:nowrap}
.cg-tab.on{background:${CG.brandSoft};color:${CG.brandDeep}}
.cg-scroll{overflow-y:auto;scrollbar-width:thin}
.cg-bar{height:8px;border-radius:99px;background:rgba(16,33,63,.08);overflow:hidden}
.cg-bar > i{display:block;height:100%;border-radius:99px;background:${CG.brand};transition:width .4s ease}
.cg-muted{color:${CG.muted}}
.cg-row{display:flex;align-items:center;gap:8px}
.cg-toast{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);max-width:min(560px,70vw);padding:12px 16px;border-radius:14px;
  font-size:15px;box-shadow:0 12px 30px rgba(16,33,63,.22);animation:cg-in .2s ease both;z-index:30;display:flex;gap:10px;align-items:flex-start}
.cg-toast.bad{background:#fff;color:${CG.ink};border-left:5px solid ${CG.bad}}
.cg-toast.ok{background:#fff;color:${CG.ink};border-left:5px solid ${CG.ok}}
.cg-toast.info{background:#fff;color:${CG.ink};border-left:5px solid ${CG.brand}}
.cg-modal-bg{position:absolute;inset:0;background:rgba(16,33,63,.28);display:flex;align-items:center;justify-content:center;z-index:40;animation:cg-fade .18s ease both}
.cg-modal{width:min(720px,calc(100% - 48px));max-height:calc(100% - 64px);display:flex;flex-direction:column;animation:cg-pop .22s cubic-bezier(.2,.9,.3,1.2) both}
.cg-kbd{display:inline-block;min-width:22px;padding:1px 6px;border-radius:6px;background:#fff;box-shadow:0 0 0 1px ${CG.line} inset,0 2px 0 ${CG.line};
  font-family:${CG.fontBold};font-size:14px;text-align:center}
.cg-stage{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:14px}
.cg-dot{width:22px;height:22px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}
.cg-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:35}
.cg-confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:cg-fall 1.6s cubic-bezier(.3,.6,.5,1) forwards}
@keyframes cg-in{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes cg-fade{from{opacity:0}to{opacity:1}}
@keyframes cg-pop{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
@keyframes cg-slide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
@keyframes cg-fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(110vh) rotate(540deg);opacity:.9}}
.cg-slide{animation:cg-slide .22s ease both}
@keyframes cg-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(7px) rotate(4deg)}}
@keyframes cg-ripple{0%{transform:scale(.4);opacity:.7}100%{transform:scale(1.8);opacity:0}}
@keyframes cg-catch{0%{transform:scale(.3) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:none}}
.cg-bob{display:inline-block;animation:cg-bob 1.1s ease-in-out infinite}
.cg-ripple{position:absolute;inset:0;border-radius:999px;border:2px solid rgba(56,189,248,.6);animation:cg-ripple 1.4s ease-out infinite}
.cg-catch{display:inline-block;animation:cg-catch .55s cubic-bezier(.2,.9,.3,1.3) both}
.cg-prompt{position:absolute;left:50%;bottom:118px;transform:translateX(-50%);z-index:12;display:flex;align-items:center;gap:10px;padding:10px 12px 10px 16px;animation:cg-in .2s ease both}
.cg-opt{appearance:none;border:0;font:inherit;text-align:left;background:#fff;border-radius:14px;padding:12px 14px;cursor:pointer;box-shadow:0 0 0 1px ${CG.line} inset;font-size:16px;color:${CG.ink}}
.cg-opt:hover{box-shadow:0 0 0 2px #E2C88F inset}
.cg-opt.right{box-shadow:0 0 0 2px ${CG.ok} inset;background:#EEFBF2}
.cg-opt.wrong{box-shadow:0 0 0 2px ${CG.bad} inset;background:#FFF1F0}
@keyframes cg-slide-out{from{opacity:1;transform:none}to{opacity:0;transform:translateX(16px)}}
@keyframes cg-fade-out{from{opacity:1}to{opacity:0}}
@keyframes cg-pop-out{from{opacity:1;transform:none}to{opacity:0;transform:scale(.97) translateY(6px)}}
.cg-slide-out{animation:cg-slide-out .16s ease both;pointer-events:none}
.cg-modal-bg.closing{animation:cg-fade-out .14s ease both;pointer-events:none}
.cg-modal-bg.closing .cg-modal{animation:cg-pop-out .14s ease both}
.cg-num{width:64px;font:inherit;font-family:${CG.fontBold};font-size:15px;text-align:center;padding:6px 4px;border-radius:10px;border:1px solid ${CG.line};background:#fff;color:${CG.ink}}
.cg-num:focus-visible{outline:3px solid #E2C88F;outline-offset:1px}
.cg-label{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;transition:opacity .2s ease;z-index:6;
  background:rgba(11,26,46,.88);color:#fff;border-radius:10px;padding:5px 10px;font-family:${CG.fontBold};font-size:14px;white-space:nowrap;
  box-shadow:0 6px 16px rgba(11,26,46,.25)}
.cg-label small{display:block;font-family:${CG.font};font-size:14px;opacity:.8}
.cg-label.active{background:${CG.brand}}
.cg-hub-dark{background:#0B1A2E;color:#fff}
@media (prefers-reduced-motion: reduce){
  .cg-root *,.cg-root *::before,.cg-root *::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}
  .cg-confetti{display:none}
}
`;

let injected = false;

/** Chèn CSS một lần cho cả phiên. */
export function useCityCss(): void {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const el = document.createElement('style');
    el.setAttribute('data-city', '1');
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/** Người dùng chọn giảm chuyển động (hệ điều hành). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
