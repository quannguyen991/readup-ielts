/**
 * MINH HOẠ DỄ THƯƠNG của ReadUp — vẽ tay bằng SVG (react-native-svg), chạy cả
 * web lẫn app: đồ vật học tập có mặt cười (sách, bút chì, mây, đồng hồ báo
 * thức, lịch, quả địa cầu, toa tàu) và huy hiệu viền răng cưa có biểu tượng.
 *
 * Phong cách chung: nét viền đậm màu mực, mảng màu phẳng, má hồng, mắt chấm —
 * để các khối bento đọc nhanh bằng hình. Tự vẽ, không lấy hình của trang nào.
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const INK = '#1F2433';
const BLUSH = '#F9A8B8';
const SW = 3;

/** Mặt cười: hai mắt chấm, miệng cong, hai má hồng. Toạ độ tâm (cx, cy), cỡ s. */
export function Face({ cx, cy, s = 1, sleepy = false }: { cx: number; cy: number; s?: number; sleepy?: boolean }) {
  return (
    <G>
      {sleepy ? (
        <>
          <Path d={`M ${cx - 10 * s} ${cy} q ${3 * s} ${3 * s} ${6 * s} 0`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d={`M ${cx + 4 * s} ${cy} q ${3 * s} ${3 * s} ${6 * s} 0`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={cx - 7 * s} cy={cy} r={2.6 * s} fill={INK} />
          <Circle cx={cx + 7 * s} cy={cy} r={2.6 * s} fill={INK} />
        </>
      )}
      <Path d={`M ${cx - 4 * s} ${cy + 5 * s} q ${4 * s} ${4 * s} ${8 * s} 0`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Ellipse cx={cx - 13 * s} cy={cy + 5 * s} rx={3.6 * s} ry={2.2 * s} fill={BLUSH} />
      <Ellipse cx={cx + 13 * s} cy={cy + 5 * s} rx={3.6 * s} ry={2.2 * s} fill={BLUSH} />
    </G>
  );
}

type P = { size?: number };

export function CuteBook({ size = 72 }: P) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 120 98">
      <Path d="M8 22 Q34 12 60 22 Q86 12 112 22 L112 86 Q86 76 60 86 Q34 76 8 86 Z" fill="#2FA36B" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M14 18 Q36 8 60 18 L60 80 Q36 70 14 80 Z" fill="#FFFFFF" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M106 18 Q84 8 60 18 L60 80 Q84 70 106 80 Z" fill="#FFFFFF" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M22 30 Q36 25 50 30 M70 30 Q84 25 98 30" stroke="#E3D9C9" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Face cx={37} cy={46} s={0.9} />
      <Face cx={83} cy={46} s={0.9} />
    </Svg>
  );
}

export function CutePencil({ size = 64 }: P) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 110 66">
      <G transform="rotate(-18 55 33)">
        <Rect x={22} y={20} width={62} height={26} rx={4} fill="#FACC15" stroke={INK} strokeWidth={SW} />
        <Rect x={8} y={20} width={16} height={26} rx={4} fill="#F59BB0" stroke={INK} strokeWidth={SW} />
        <Rect x={20} y={20} width={8} height={26} fill="#E1D9CB" stroke={INK} strokeWidth={SW} />
        <Path d="M84 20 L104 33 L84 46 Z" fill="#FDE7C2" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M97 29 L104 33 L97 37 Z" fill={INK} />
        <Face cx={55} cy={31} s={0.75} />
      </G>
    </Svg>
  );
}

export function CuteCloud({ size = 72 }: P) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 120 74">
      <Path d="M24 62 Q6 62 8 46 Q10 32 26 34 Q28 14 50 14 Q68 12 74 28 Q84 20 96 28 Q110 32 108 48 Q108 62 92 62 Z" fill="#FFFFFF" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Face cx={60} cy={42} s={0.85} />
    </Svg>
  );
}

export function CuteClock({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M22 20 L34 30 M78 20 L66 30" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx={24} cy={20} r={10} fill="#F2B632" stroke={INK} strokeWidth={SW} />
      <Circle cx={76} cy={20} r={10} fill="#F2B632" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={56} r={34} fill="#F2B632" stroke={INK} strokeWidth={SW} />
      <Circle cx={50} cy={56} r={26} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      <Path d="M30 90 L24 97 M70 90 L76 97" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
      <Face cx={50} cy={58} s={0.8} />
    </Svg>
  );
}

export function CuteCalendar({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={12} y={20} width={76} height={70} rx={12} fill="#FFFFFF" stroke={INK} strokeWidth={SW} />
      <Path d="M12 42 L88 42 L88 32 Q88 20 76 20 L24 20 Q12 20 12 32 Z" fill="#E4574A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={28} y={10} width={8} height={18} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      <Rect x={64} y={10} width={8} height={18} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      <Path d="M50 36 c -4 -5 -10 -1 -6 3 l 6 5 l 6 -5 c 4 -4 -2 -8 -6 -3 z" fill="#FFFFFF" />
      <Face cx={50} cy={66} s={0.85} />
    </Svg>
  );
}

export function CuteGlobe({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={38} fill="#D4B276" stroke={INK} strokeWidth={SW} />
      <Path d="M22 36 Q34 30 40 40 Q44 50 34 56 Q24 58 18 50 M58 18 Q72 22 76 34 Q70 40 60 36 Q54 28 58 18 M60 70 Q72 64 80 70 Q74 82 62 84 Z" fill="#6CCB7A" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Face cx={50} cy={54} s={0.85} />
    </Svg>
  );
}

export function CuteTrain({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 130 80">
      <Rect x={10} y={16} width={100} height={46} rx={14} fill="#6A4BD9" stroke={INK} strokeWidth={SW} />
      <Rect x={100} y={30} width={22} height={32} rx={8} fill="#6A4BD9" stroke={INK} strokeWidth={SW} />
      <Rect x={22} y={24} width={22} height={16} rx={4} fill="#F9F1E3" stroke={INK} strokeWidth={2.4} />
      <Rect x={78} y={24} width={22} height={16} rx={4} fill="#F9F1E3" stroke={INK} strokeWidth={2.4} />
      <Rect x={10} y={48} width={112} height={6} fill="#FACC15" />
      <Circle cx={32} cy={66} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={SW} />
      <Circle cx={90} cy={66} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={SW} />
      <Circle cx={118} cy={40} r={3} fill="#FDE68A" />
      <Face cx={61} cy={36} s={0.85} />
    </Svg>
  );
}

/** Máy bay dễ thương (thay toa tàu — Chuyến bay từ vựng). */
export function CutePlane({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 130 80">
      <Path d="M 14 52 Q 44 50 74 46" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.7} fill="none" />
      <Path d="M 52 40 L 36 14 L 52 14 L 74 38 Z" fill="#F9F1E3" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 52 54 L 36 78 L 52 78 L 74 56 Z" fill="#F9F1E3" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 36 44 L 28 26 L 40 26 L 46 40 Z" fill="#6A4BD9" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M 34 46 Q 36 36 70 36 L 104 38 Q 122 42 122 48 Q 122 54 104 56 L 70 58 Q 36 58 34 48 Z" fill="#F9F1E3" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M 40 50 L 112 50 L 112 53 L 40 53 Z" fill="#FACC15" />
      <Circle cx={86} cy={44} r={3.6} fill="#BFE3F5" stroke={INK} strokeWidth={1.8} />
      <Circle cx={74} cy={44} r={3.6} fill="#BFE3F5" stroke={INK} strokeWidth={1.8} />
      <Circle cx={62} cy={44} r={3.6} fill="#BFE3F5" stroke={INK} strokeWidth={1.8} />
      <Path d="M 100 40 Q 110 38 116 44 L 100 46 Z" fill="#BFE3F5" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

// ------------------------------------------------------------------ huy hiệu viền răng cưa

/** Đường viền "con dấu" 12 răng quanh tâm (50, 50). */
function sealPath(r = 42, teeth = 12, depth = 5): string {
  const pts: string[] = [];
  const n = teeth * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r - depth;
    pts.push(`${(50 + Math.cos(a) * rr).toFixed(1)} ${(50 + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}
const SEAL = sealPath();

export type BadgeIcon = 'check' | 'question' | 'refresh' | 'plus' | 'clock' | 'target' | 'star' | 'bolt';

export function Badge({ icon, color, size = 40 }: { icon: BadgeIcon; color: string; size?: number }) {
  const w = '#FFFFFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={SEAL} fill={color} strokeLinejoin="round" />
      {icon === 'check' ? <Path d="M32 51 L45 64 L69 38" stroke={w} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {icon === 'plus' ? <Path d="M50 32 L50 68 M32 50 L68 50" stroke={w} strokeWidth={8} strokeLinecap="round" /> : null}
      {icon === 'question' ? (
        <G>
          <Circle cx={50} cy={50} r={20} stroke={w} strokeWidth={5} fill="none" />
          <Path d="M44 45 Q44 38 50 38 Q57 38 57 44 Q57 49 50 51 L50 55" stroke={w} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Circle cx={50} cy={62} r={3} fill={w} />
        </G>
      ) : null}
      {icon === 'refresh' ? (
        <G>
          <Path d="M66 44 A18 18 0 1 0 64 62" stroke={w} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M68 32 L68 46 L55 44" stroke={w} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : null}
      {icon === 'clock' ? (
        <G>
          <Circle cx={50} cy={50} r={20} stroke={w} strokeWidth={5} fill="none" />
          <Path d="M50 38 L50 50 L59 56" stroke={w} strokeWidth={5} fill="none" strokeLinecap="round" />
        </G>
      ) : null}
      {icon === 'target' ? (
        <G>
          <Circle cx={50} cy={50} r={20} stroke={w} strokeWidth={5} fill="none" />
          <Circle cx={50} cy={50} r={9} stroke={w} strokeWidth={5} fill="none" />
          <Circle cx={50} cy={50} r={2.5} fill={w} />
        </G>
      ) : null}
      {icon === 'star' ? <Path d="M50 30 L56 44 L71 45 L59 55 L63 70 L50 62 L37 70 L41 55 L29 45 L44 44 Z" fill={w} strokeLinejoin="round" /> : null}
      {icon === 'bolt' ? <Path d="M54 28 L36 54 L49 54 L45 72 L64 45 L51 45 Z" fill={w} strokeLinejoin="round" /> : null}
    </Svg>
  );
}
