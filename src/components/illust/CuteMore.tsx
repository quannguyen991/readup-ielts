/**
 * Bộ minh hoạ bổ sung (30/09/2026: "thêm nhiều icon kiểu như vậy, ít chữ, nhiều
 * hình, icon, hiệu ứng hơn") + hiệu ứng chuyển động nhẹ cho hình. Cùng phong
 * cách với `Cute.tsx`: viền mực đậm, màu phẳng, mặt cười, má hồng.
 */
import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Face } from './Cute';

const INK = '#1F2433';
const SW = 3;
type P = { size?: number };

export function CuteHeadphones({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M20 58 Q20 20 50 20 Q80 20 80 58" stroke={INK} strokeWidth={SW + 2} fill="none" strokeLinecap="round" />
      <Rect x={12} y={52} width={20} height={32} rx={9} fill="#8A63D2" stroke={INK} strokeWidth={SW} />
      <Rect x={68} y={52} width={20} height={32} rx={9} fill="#8A63D2" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={64} r={16} fill="#FFFFFF" stroke={INK} strokeWidth={SW} />
      <Face cx={50} cy={64} s={0.6} />
    </Svg>
  );
}

export function CuteMic({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={32} y={12} width={36} height={52} rx={18} fill="#FACC15" stroke={INK} strokeWidth={SW} />
      <Path d="M24 50 Q24 76 50 76 Q76 76 76 50 M50 76 L50 90 M36 90 L64 90" stroke={INK} strokeWidth={SW} fill="none" strokeLinecap="round" />
      <Face cx={50} cy={40} s={0.7} />
    </Svg>
  );
}

export function CuteBulb({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 10 Q78 10 78 40 Q78 56 64 66 L64 74 L36 74 L36 66 Q22 56 22 40 Q22 10 50 10 Z" fill="#FDE047" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={36} y={74} width={28} height={14} rx={4} fill="#CBD5E1" stroke={INK} strokeWidth={SW} />
      <Face cx={50} cy={42} s={0.8} />
    </Svg>
  );
}

export function CuteTrophy({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M28 22 Q12 22 14 36 Q16 46 30 46 M72 22 Q88 22 86 36 Q84 46 70 46" stroke={INK} strokeWidth={SW} fill="none" />
      <Path d="M28 14 L72 14 L72 36 Q72 60 50 60 Q28 60 28 36 Z" fill="#F2B632" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={44} y={60} width={12} height={14} fill="#F2B632" stroke={INK} strokeWidth={SW} />
      <Rect x={30} y={74} width={40} height={14} rx={4} fill="#8A5A2B" stroke={INK} strokeWidth={SW} />
      <Face cx={50} cy={36} s={0.75} />
    </Svg>
  );
}

export function CuteFlame({ size = 56, sleepy = false }: P & { sleepy?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 8 Q70 32 74 48 Q80 84 50 90 Q20 84 26 52 Q30 38 40 30 Q40 46 50 48 Q46 26 50 8 Z" fill={sleepy ? '#E2E8F0' : '#F97316'} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M50 52 Q62 64 60 76 Q56 86 50 86 Q42 84 42 74 Q42 64 50 52 Z" fill={sleepy ? '#FFFFFF' : '#FDE047'} />
      <Face cx={50} cy={66} s={0.65} sleepy={sleepy} />
    </Svg>
  );
}

export function CuteRocket({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M30 50 L16 70 L30 66 Z M70 50 L84 70 L70 66 Z" fill="#E4574A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M40 62 Q50 92 60 62 Z" fill="#FACC15" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M50 6 Q72 24 70 62 L30 62 Q28 24 50 6 Z" fill="#FFFFFF" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Circle cx={50} cy={30} r={8} fill="#5AB0F0" stroke={INK} strokeWidth={2.4} />
      <Face cx={50} cy={50} s={0.55} />
    </Svg>
  );
}

export function CuteNotebook({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={20} y={10} width={62} height={80} rx={8} fill="#5AB0F0" stroke={INK} strokeWidth={SW} />
      <Rect x={30} y={20} width={42} height={28} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      {[24, 40, 56, 72].map((y) => (
        <Rect key={y} x={14} y={y} width={12} height={5} rx={2.5} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
      ))}
      <Face cx={51} cy={66} s={0.75} />
    </Svg>
  );
}

export function CuteCalculator({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={20} y={8} width={60} height={84} rx={10} fill="#2FA36B" stroke={INK} strokeWidth={SW} />
      <Rect x={28} y={16} width={44} height={24} rx={4} fill="#DFF7E8" stroke={INK} strokeWidth={2.4} />
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => <Rect key={`${r}${c}`} x={29 + c * 15} y={52 + r * 13} width={11} height={9} rx={3} fill={r === 2 && c === 2 ? '#FACC15' : '#FFFFFF'} stroke={INK} strokeWidth={1.8} />),
      )}
      <Face cx={50} cy={27} s={0.55} />
    </Svg>
  );
}

export function CuteMagnifier({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M62 62 L86 86" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <Path d="M62 62 L86 86" stroke="#8A5A2B" strokeWidth={5} strokeLinecap="round" />
      <Circle cx={42} cy={42} r={28} fill="#DDF3FF" stroke={INK} strokeWidth={SW + 1} />
      <Face cx={42} cy={44} s={0.8} />
    </Svg>
  );
}

export function CuteChat({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M14 22 Q14 12 26 12 L74 12 Q86 12 86 22 L86 60 Q86 70 74 70 L42 70 L24 86 L28 70 L26 70 Q14 70 14 60 Z" fill="#F472B6" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Face cx={50} cy={40} s={0.85} />
    </Svg>
  );
}

export function CuteStar({ size = 48 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 8 L62 36 L92 38 L69 58 L77 88 L50 72 L23 88 L31 58 L8 38 L38 36 Z" fill="#FACC15" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Face cx={50} cy={52} s={0.6} />
    </Svg>
  );
}

export function CutePlant({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 50 L50 24 M50 38 Q30 20 22 34 Q36 44 50 38 M50 32 Q70 12 80 26 Q64 38 50 32" stroke={INK} strokeWidth={SW} fill="#6CCB7A" strokeLinejoin="round" />
      <Path d="M24 52 L76 52 L68 92 L32 92 Z" fill="#E8674A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={20} y={48} width={60} height={10} rx={4} fill="#F28B6E" stroke={INK} strokeWidth={SW} />
      <Face cx={50} cy={72} s={0.75} />
    </Svg>
  );
}

// ------------------------------------------------------------------ hiệu ứng

const MOTION_CSS = [
  '@keyframes cute-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
  '@keyframes cute-wobble{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}',
  '@keyframes cute-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}',
  '@keyframes cute-twinkle{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:.9;transform:scale(1.15)}}',
  '.cute-float{animation:cute-float 3.2s ease-in-out infinite}',
  '.cute-wobble{animation:cute-wobble 2.6s ease-in-out infinite;transform-origin:50% 90%}',
  '.cute-pop{animation:cute-pop .5s cubic-bezier(.2,.9,.3,1.3) both}',
  '.cute-twinkle{animation:cute-twinkle 2.2s ease-in-out infinite}',
  '.cute-hover{transition:transform .18s ease}',
  '.cute-hover:hover{transform:translateY(-3px) scale(1.03)}',
  '@media (prefers-reduced-motion:reduce){.cute-float,.cute-wobble,.cute-pop,.cute-twinkle{animation:none}.cute-hover:hover{transform:none}}',
].join('\n');

let injected = false;
function ensureMotion() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = MOTION_CSS;
  document.head.appendChild(el);
}

/**
 * Bọc một hình để nó chuyển động nhẹ (chỉ web; tắt khi người dùng chọn giảm
 * chuyển động). `delay` (giây) để các hình cạnh nhau không nhún cùng nhịp.
 */
export function Motion({ kind = 'float', delay = 0, children }: { kind?: 'float' | 'wobble' | 'pop' | 'twinkle' | 'hover'; delay?: number; children: React.ReactNode }) {
  ensureMotion();
  if (Platform.OS !== 'web') return <>{children}</>;
  return React.createElement('div', { className: `cute-${kind}`, style: { display: 'inline-flex', animationDelay: `${delay}s` } }, children);
}

/** Chấm sáng lấp lánh rải trong một khối màu (trang trí, không nhận chạm). */
export function Sparkles({ color = '#FFFFFF', count = 6 }: { color?: string; count?: number }) {
  ensureMotion();
  if (Platform.OS !== 'web') return null;
  const spots: [number, number, number][] = [
    [8, 18, 0],
    [22, 72, 0.6],
    [46, 10, 1.2],
    [70, 82, 0.3],
    [90, 24, 0.9],
    [62, 44, 1.5],
    [34, 40, 1.8],
    [82, 58, 0.4],
  ];
  return React.createElement(
    'div',
    { 'aria-hidden': true, style: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' } },
    spots.slice(0, count).map(([l, t, d], i) =>
      React.createElement('span', {
        key: i,
        className: 'cute-twinkle',
        style: { position: 'absolute', left: `${l}%`, top: `${t}%`, width: i % 2 ? 6 : 9, height: i % 2 ? 6 : 9, borderRadius: 99, background: color, animationDelay: `${d}s` },
      }),
    ),
  );
}
