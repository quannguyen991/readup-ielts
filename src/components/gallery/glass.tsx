/**
 * Kính ngà cho trang giới thiệu (/gioi-thieu), theo bộ vàng kim của dự án: thẻ kính ngà ấm (GLASS trong phone-theme),
 * viền sáng và viền vàng cầu vồng xoay (máy tính có chuột), đèn theo con trỏ, nghiêng 3D nhẹ; trên Chromium thấu kính
 * làm méo nền phía sau (chữ không méo); tia sáng vàng xoay chậm, quầng hổ phách trôi, bụi và sao vàng lấp lánh; chữ vàng
 * đồng ánh kim; khối hiện dần khi cuộn tới (scroll-driven). Mọi chuyển động tắt khi bật "giảm chuyển động" (xem FX_CSS).
 * Native: chỉ còn nền ngà mờ tĩnh.
 * Màu và luật: DESIGN.md. Khung vàng và chữ dùng chung vẫn ở gallery.tsx.
 */
import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { isWeb, SANS_5, SERIF_I } from './gallery';

/** Bộ vàng kim của giao diện mặc định (PhoneBackdrop) và bản đậm hơn cho đoạn chốt. */
export const GOLD_SKY = ['#FBFAFF', '#F1ECFF', '#E8F6F1', '#FDEEF4', '#F5F2FF'] as const;
export const GOLD_SKY_DEEP = ['#EFE9FF', '#E0D6FF', '#D5EEF9', '#FBDDEA', '#ECE6FF'] as const;
export const GOLD_SKY_LOC = [0, 0.3, 0.6, 0.85, 1] as const;
/** Chữ trên nền vàng: mực nâu vàng cho tiêu đề, nâu cho đoạn văn, đồng đậm cho từ nhấn. */
export const INK_G = themedHex('#2B2350');
export const BODY_G = themedHex('#4A4470');
export const MUTED_G = themedHex('#7A72A0');
export const DEEP_G = themedHex('#6A4BD9');

/** CSS chỉ cho web, nối vào thẻ <style> của trang. Mọi animation nằm trong khối giảm chuyển động bên dưới. */
export const FX_CSS = `
@property --ang{syntax:'<angle>';inherits:false;initial-value:0deg}
@property --ang2{syntax:'<angle>';inherits:false;initial-value:0deg}
@property --mx{syntax:'<percentage>';inherits:false;initial-value:50%}
@property --my{syntax:'<percentage>';inherits:false;initial-value:50%}
.b9-glass,.b9-lift{--rx:0deg;--ry:0deg;--lift:0px;transform:perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)) translateY(var(--lift));transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .6s,border-color .6s}
.b9-glass{position:relative;isolation:isolate;--mx:50%;--my:50%;
background:linear-gradient(160deg,rgba(255,255,255,.92),rgba(250,248,255,.74) 50%,rgba(236,228,255,.5));
border:1px solid rgba(255,255,255,.9);
box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 18px 40px -20px rgba(106,75,217,.38),0 0 30px -12px rgba(240,100,79,.22)}
.b9-glass::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;padding:2px;pointer-events:none;background:conic-gradient(from var(--ang),rgba(255,255,255,0) 0deg,rgba(255,255,255,0) 190deg,rgba(255,255,255,.95) 300deg,rgba(255,255,255,0) 360deg),conic-gradient(from var(--ang2),#8B6CF0 0deg,#5B8DEF 70deg,#F0644F 140deg,#E8708A 200deg,#FFA66B 250deg,#8B6CF0 320deg,#8B6CF0 360deg);background-blend-mode:screen;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:b9led 4s linear infinite,b9flow 16s linear infinite}
.b9-glass::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .5s;background:radial-gradient(420px circle at var(--mx) var(--my),rgba(255,255,255,.7),rgba(255,255,255,0) 62%)}
.b9-blur{-webkit-backdrop-filter:blur(14px) saturate(125%);backdrop-filter:blur(14px) saturate(125%)}
.b9-glass:hover::after{opacity:1}
.b9-glass:hover{border-color:rgba(255,255,255,1)}
.b9-lens{-webkit-backdrop-filter:url(#b9-lens) blur(10px) saturate(135%);backdrop-filter:url(#b9-lens) blur(10px) saturate(135%)}
@keyframes b9led{to{--ang:360deg}}
@keyframes b9flow{to{--ang2:360deg}}
.b9-lift:hover{--lift:-4px;box-shadow:0 34px 70px -28px rgba(106,75,217,.4)}
.b9-cta-solid{background-color:#F5C518;background-image:linear-gradient(180deg,rgba(255,255,255,.4) 0%,rgba(255,255,255,.05) 48%,rgba(255,255,255,0) 54%,rgba(40,20,90,.1) 100%),linear-gradient(100deg,#3F8AE0 0%,#3DBE6B 30%,#F5C518 55%,#F28C28 75%,#E85A9B 100%);box-shadow:0 12px 28px rgba(63,138,224,.3),inset 0 1px 0 rgba(255,255,255,.55)}
.b9-cta-solid:hover{filter:brightness(1.05)}
.b9-sheen{position:relative;overflow:hidden}
.b9-sheen::after{content:"";position:absolute;top:-10%;bottom:-10%;left:-60%;width:45%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.7),rgba(255,255,255,0));transform:skewX(-18deg);pointer-events:none}
.b9-sheen:hover::after{animation:b9sheen .9s cubic-bezier(.4,0,.2,1)}
@keyframes b9sheen{to{left:130%}}
.b9-gold{display:inline-block!important;margin-top:.14em;line-height:1.06;background-image:linear-gradient(100deg,#3F8AE0 0%,#3DBE6B 18%,#F5C518 34%,#F28C28 50%,#E0413A 66%,#E85A9B 82%,#3F8AE0 100%);background-size:240% 100%;color:#FFFFFF!important;padding:.02em .2em .04em;border-radius:.22em;animation:b9gold 9s linear infinite}
.b9-rule{border-radius:2px;width:56px;background:linear-gradient(90deg,#3F8AE0,#3DBE6B,#F5C518,#E0413A,#E85A9B)}
@keyframes b9gold{from{background-position:100% 0}to{background-position:-100% 0}}
.b9-rise{animation:b9rise 1s cubic-bezier(.16,1,.3,1) both}
.b9-d1{animation-delay:.08s}.b9-d2{animation-delay:.2s}.b9-d3{animation-delay:.34s}
@keyframes b9rise{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}
@supports (animation-timeline:view()){
.b9-reveal{animation:b9reveal linear both;animation-timeline:view();animation-range:entry 0% entry 42%}
}
@keyframes b9reveal{from{opacity:0;translate:0 56px}to{opacity:1;translate:0 0}}
.b9-aurora{position:absolute;inset:-12%;z-index:0;pointer-events:none;will-change:transform;animation:b9aurora 22s ease-in-out infinite alternate}
.b9-aurora-hero{background:radial-gradient(38% 34% at 16% 26%,rgba(139,108,240,.26),rgba(139,108,240,0) 70%),radial-gradient(34% 30% at 84% 18%,rgba(91,141,239,.2),rgba(91,141,239,0) 70%),radial-gradient(42% 38% at 72% 94%,rgba(240,100,79,.16),rgba(240,100,79,0) 70%)}
.b9-aurora-close{background:radial-gradient(40% 36% at 12% 72%,rgba(139,108,240,.22),rgba(139,108,240,0) 70%),radial-gradient(40% 36% at 88% 36%,rgba(232,112,138,.16),rgba(232,112,138,0) 70%)}
@keyframes b9aurora{from{transform:translate3d(-2%,0,0) scale(1)}to{transform:translate3d(3%,-3%,0) scale(1.08)}}
.b9-room{contain:paint}
.b9-motes{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none}
.b9-mote{position:absolute;width:3px;height:3px;border-radius:50%;background:#8B6CF0;box-shadow:0 0 10px 3px rgba(139,108,240,.5);opacity:0;animation:b9mote 9s ease-in-out infinite}
@keyframes b9mote{0%,100%{opacity:0;transform:translate3d(0,0,0)}40%{opacity:.8}70%{opacity:.45;transform:translate3d(10px,-42px,0)}}
.b9-spark{position:absolute;width:16px;height:16px;pointer-events:none;opacity:0;background:radial-gradient(circle,#8B6CF0 0 10%,rgba(139, 108, 240,0) 11%),linear-gradient(#8B6CF0,#8B6CF0) center/1.5px 100% no-repeat,linear-gradient(#8B6CF0,#8B6CF0) center/100% 1.5px no-repeat;animation:b9twinkle 3.6s ease-in-out infinite}
@keyframes b9twinkle{0%,100%{opacity:0;transform:scale(.3) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}
@media (prefers-reduced-motion: reduce){
.b9-gold,.b9-rise,.b9-reveal,.b9-aurora,.b9-mote,.b9-spark,.b9-glass::before,.b9-sheen:hover::after{animation:none!important}
.b9-mote,.b9-spark{display:none}
.b9-glass,.b9-lift{transition:none!important}
.b9-lift:hover{--lift:0px}
}
@media (prefers-reduced-transparency: reduce){
.b9-glass,.b9-lens,.b9-blur{background:#FBFAFF!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
}
`;

/** Bộ lọc thấu kính: làm méo nền phía sau tấm kính. Đặt đúng một lần trên trang. */
export function LensDefs() {
  if (!isWeb) return null;
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="b9-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={2} seed={7} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={14} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** Trình duyệt có làm méo nền được không. Kiểm sau khi lên trang, để server render và client khớp nhau. */
function useLensSupport(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('backdrop-filter', 'url(#b9-lens)'));
  }, []);
  return ok;
}

/** Đèn theo con trỏ và nghiêng 3D nhẹ. Chỉ bật với chuột chính xác và khi không yêu cầu giảm chuyển động. */
function useTilt(ref: React.RefObject<View | null>) {
  useEffect(() => {
    const el = ref.current as unknown as HTMLElement | null;
    if (!isWeb || !el || typeof window === 'undefined' || !window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        el.style.setProperty('--mx', `${x * 100}%`);
        el.style.setProperty('--my', `${y * 100}%`);
        el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
        el.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [ref]);
}

const NATIVE_GLASS: ViewStyle = { backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' };

/** Tấm kính ngà: trên web là lớp CSS; trên native là nền ngà mờ tĩnh. `lens` chỉ bật khi trình duyệt hỗ trợ. */
export function GlassPanel({
  children,
  style,
  lens = false,
  className,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  lens?: boolean;
  className?: string;
}) {
  const lensOk = useLensSupport();
  const ref = useRef<View>(null);
  useTilt(ref);
  const cls = ['b9-glass', lens && lensOk ? 'b9-lens' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <View ref={ref} className={cls} style={[isWeb ? undefined : NATIVE_GLASS, style]}>
      {children}
    </View>
  );
}

/** Quầng hổ phách và champagne trôi sau nội dung; ở hero thêm tia vàng xoay chậm. Chỉ web. */
export function Aurora({ variant }: { variant: 'hero' | 'close' }) {
  if (!isWeb) return null;
  return (
    <>
      <View className={`b9-aurora b9-aurora-${variant}`} />
    </>
  );
}

const MOTES: [string, string, string][] = [
  ['8%', '22%', '0s'],
  ['18%', '70%', '2.1s'],
  ['32%', '38%', '4.4s'],
  ['46%', '82%', '1.2s'],
  ['58%', '18%', '3.3s'],
  ['66%', '60%', '5.6s'],
  ['78%', '30%', '0.7s'],
  ['88%', '74%', '2.9s'],
  ['93%', '45%', '6.4s'],
  ['12%', '48%', '7.2s'],
];

const SPARKS: [string, string, string][] = [
  ['71%', '16%', '0s'],
  ['54%', '64%', '1.4s'],
  ['86%', '42%', '2.2s'],
  ['38%', '12%', '0.6s'],
  ['62%', '84%', '2.9s'],
];

/** Bụi vàng bay chậm và sao vàng lấp lánh. Vị trí cố định để server và client khớp nhau. Chỉ web. */
export function Motes() {
  if (!isWeb) return null;
  return (
    <View className="b9-motes">
      {MOTES.map(([left, top, delay], i) => React.createElement('div', { key: `m${i}`, className: 'b9-mote', style: { left, top, animationDelay: delay } }))}
      {SPARKS.map(([left, top, delay], i) => React.createElement('div', { key: `s${i}`, className: 'b9-spark', style: { left, top, animationDelay: delay } }))}
    </View>
  );
}

/** Nhãn bảo tàng: tấm kính ngà nhỏ, tên phòng nghiêng và dòng chú thích. Dùng ở cuối mỗi phòng. */
export function Plaque({ title, meta, align }: { title: string; meta: string; align: 'left' | 'right' | 'center' }) {
  const self = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
  return (
    <GlassPanel style={{ alignSelf: self, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 10, maxWidth: 420 }}>
      <Text style={{ fontFamily: SERIF_I, fontSize: 15, lineHeight: 22, color: INK_G }}>{title}</Text>
      <Text style={{ fontFamily: SANS_5, fontSize: 12.5, lineHeight: 18, color: BODY_G, marginTop: 2 }}>{meta}</Text>
    </GlassPanel>
  );
}
