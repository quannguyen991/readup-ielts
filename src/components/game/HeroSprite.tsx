import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { heroPalette, type SkinId } from './sprites';

/**
 * NHÂN VẬT — "Bút Sĩ", chàng hiệp sĩ học trò của Band 9.
 *
 * Vẽ bằng SVG vector (khung 100×100, nhìn nghiêng sang phải để đối mặt quái),
 * viền mực mảnh đồng nhất, đổ bóng bằng lớp phủ trong suốt. Mũ vải kèm lông
 * bút lông vàng, kiếm là một cây bút máy, huy hiệu trước ngực mô phỏng logo.
 * Skin chỉ đổi màu: mũ/tóc `h`, áo `a`, quần `A`, áo choàng `c`, lưỡi kiếm `w`,
 * vàng/chuôi `g`, giày `b`, thắt lưng `l` — cùng bảng khoá với `HERO_SKINS`.
 */

export type HeroMood = 'idle' | 'attack' | 'hurt' | 'happy' | 'tired';

const INK = '#0B1424';
const SKIN = '#F8D0A8';
const SKIN_SHADE = '#E7A97F';
const SW = 2.2;

export function HeroSprite({
  size,
  skin,
  mood = 'idle',
  flip = false,
}: {
  size: number;
  skin?: SkinId;
  mood?: HeroMood;
  /** Lật ngang (mặc định nhân vật nhìn sang phải). */
  flip?: boolean;
}) {
  const p = useMemo(() => heroPalette(skin), [skin]);
  const ol = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform={flip ? 'translate(100 0) scale(-1 1)' : undefined}>
        {/* bóng bàn chân đã do khung ngoài vẽ; đây chỉ vẽ nhân vật */}

        {/* áo choàng */}
        <Path d="M38 60 C25 62 14 74 9 92 Q27 99 46 91 L60 64 Z" fill={p.cape} {...ol} />
        <Path d="M37 64 C28 68 20 78 16 90 Q26 93 33 90 C33 80 35 72 41 66 Z" fill={p.capeDark} opacity={0.55} />
        <Path d="M9.6 91 Q27 98 46 91" fill="none" stroke={p.gold} strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />

        {/* chân + giày */}
        <Rect x={39} y={82} width={9} height={10} rx={2} fill={p.legs} {...ol} />
        <Rect x={55} y={82} width={9} height={10} rx={2} fill={p.legs} {...ol} />
        <Path d="M35.5 91 H50.5 V96 Q50.5 98.3 48.2 98.3 H37.8 Q35.5 98.3 35.5 96 Z" fill={p.boot} {...ol} />
        <Path d="M52.5 91 H67.5 V96 Q67.5 98.3 65.2 98.3 H54.8 Q52.5 98.3 52.5 96 Z" fill={p.boot} {...ol} />
        <Path d="M37 93.2 H48 M54 93.2 H65" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.4} strokeLinecap="round" />

        {/* tay sau */}
        <Path d="M37 64 Q29 69 31 77" fill="none" stroke={INK} strokeWidth={9.6} strokeLinecap="round" />
        <Path d="M37 64 Q29 69 31 77" fill="none" stroke={p.tunic} strokeWidth={6.6} strokeLinecap="round" />
        <Circle cx={31.2} cy={78.4} r={4.2} fill={SKIN} {...ol} />

        {/* thân áo */}
        <Path d="M34 63 C34 57 41 55 50 55 C60 55 67 57 67 63 L70 87 Q50 94 30 87 Z" fill={p.tunic} {...ol} />
        <Path d="M58 56 C65 57 67 59 67 63 L70 87 Q64 89.5 58 90.5 C61 80 61 66 58 56 Z" fill="#000000" opacity={0.12} />
        <Path d="M34.4 64 C35 60 38 57.5 42 56.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />
        {/* thắt lưng + khoá */}
        <Path d="M31.2 77.5 Q50 83 68.8 77.5 L69.6 83 Q50 89 30.4 83 Z" fill={p.belt} {...ol} />
        <Rect x={45} y={78} width={10} height={8} rx={2} fill={p.gold} {...ol} />
        <Rect x={48.2} y={80.4} width={3.6} height={3.2} rx={0.8} fill={p.beltDark} />
        {/* huy hiệu Band 9 */}
        <Rect x={43} y={63.5} width={13} height={11} rx={2.2} fill="#0F1D33" stroke={INK} strokeWidth={1.4} />
        <Rect x={45.2} y={65.6} width={2.4} height={6.8} fill="#F3EDE1" />
        <Path d="M48 65.6 H49.4 A1.9 1.7 0 0 1 49.4 69 H48 Z M48 69.4 H49.6 A2 1.6 0 0 1 49.6 72.4 H48 Z" fill="#F3EDE1" />
        <Rect x={52.1} y={65.6} width={2.7} height={3.4} fill="#C9A464" />
        <Rect x={52.1} y={69.4} width={2.7} height={3} fill="#F3EDE1" />

        {/* tai + đầu */}
        <Circle cx={26.5} cy={46} r={4.4} fill={SKIN} {...ol} />
        <Circle cx={26.8} cy={46} r={2} fill={SKIN_SHADE} opacity={0.7} />
        <Ellipse cx={49.5} cy={44} rx={23.5} ry={19.5} fill={SKIN} {...ol} />
        {/* bóng dưới mũ + cằm */}
        <Path d="M26.5 38 Q50 47 72.5 38 Q71 31 70 29 Q50 38 29 29 Q27 33 26.5 38 Z" fill="#7A3E1F" opacity={0.14} />
        <Path d="M33 60.5 Q50 66 67 59.5 Q60 63.5 49.5 63.5 Q39 63.5 33 60.5 Z" fill={SKIN_SHADE} opacity={0.55} />

        <Face mood={mood} />

        {/* mũ */}
        <Path d="M25 31 C23.5 19 34 12.5 50 12.5 C66 12.5 76.5 19 74.2 31 Q49.5 38.5 25 31 Z" fill={p.cap} {...ol} />
        <Path d="M30 21 C34 16 41 14.5 47 14.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M62 15.5 C69 17 73 22 72.4 28 C69 24 66 19.5 62 15.5 Z" fill="#000000" opacity={0.16} />
        <Path d="M24.6 30.4 Q49.5 38 74.6 30.4 L75 35.2 Q49.5 43.2 24.2 35.2 Z" fill={p.gold} {...ol} />
        <Path d="M27 33 Q49.5 40.5 72 33" fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={1.3} strokeLinecap="round" />
        {/* tóc mái lòi ra dưới mũ */}
        <Path d="M30.5 38.5 Q32 43.5 36.5 44 Q35 41.5 36 39.5 Z M64 40 Q66.5 43.5 70 42 Q68.5 40 69.5 38.2 Z" fill={p.hair} {...ol} strokeWidth={1.6} />

        {/* lông bút cắm mũ */}
        <Path d="M37.5 19 C31 6.5 17 3.5 7 8.2 C10.5 10 12 15 16.5 17.5 C14 18.8 12.5 22 15 25 C24 25.5 32 24 40 21.5 Z" fill={p.gold} {...ol} />
        <Path d="M38.5 20.5 C30 14 20 10.5 10 9" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M17.8 11.2 L19.4 16.6 M23.4 13.2 L24.8 19 M29.6 15.8 L30.6 21 M13 9.8 L14.2 13.8" stroke={p.goldDark} strokeWidth={1.2} strokeLinecap="round" />
        <Path d="M12 7.6 C20 6.6 28 9 34 14" fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round" />
        {/* tay trước + bút kiếm */}
        <Path d="M62 66 Q72 66 81 70" fill="none" stroke={INK} strokeWidth={9.6} strokeLinecap="round" />
        <Path d="M62 66 Q72 66 81 70" fill="none" stroke={p.tunic} strokeWidth={6.6} strokeLinecap="round" />
        <Sword blade={p.blade} gold={p.gold} grip={p.belt} />
        <Circle cx={83} cy={70.5} r={4.7} fill={SKIN} {...ol} />
        <Path d="M80.6 69.2 H85.4 M80.6 72 H85.4" stroke={SKIN_SHADE} strokeWidth={1} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/** Bút máy làm kiếm: lưỡi thon như ngòi bút, có rãnh mực và lỗ tròn. */
function Sword({ blade, gold, grip }: { blade: string; gold: string; grip: string }) {
  return (
    <G>
      <Path d="M79.2 62 V32 L83 11.5 L86.8 32 V62 Z" fill={blade} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M80.8 60 V33 L83 19" fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M83 31 V47" stroke={INK} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
      <Circle cx={83} cy={49.5} r={1.9} fill={INK} opacity={0.7} />
      <Rect x={74.5} y={61} width={17} height={5} rx={2.5} fill={gold} stroke={INK} strokeWidth={SW} />
      <Rect x={80} y={66} width={6} height={12} rx={2} fill={grip} stroke={INK} strokeWidth={SW} />
      <Circle cx={83} cy={80.5} r={3.2} fill={gold} stroke={INK} strokeWidth={SW} />
    </G>
  );
}

/** Khuôn mặt theo tâm trạng; mắt to, má hồng. */
function Face({ mood }: { mood: HeroMood }) {
  const eyeY = 47.5;
  const brow = { stroke: INK, strokeWidth: 1.9, fill: 'none', strokeLinecap: 'round' } as const;
  return (
    <G>
      <Circle cx={37.8} cy={55.4} r={3.6} fill="#F37E8B" opacity={0.5} />
      <Circle cx={64.2} cy={55.4} r={3} fill="#F37E8B" opacity={0.5} />
      {mood === 'happy' ? (
        <>
          <Path d="M39 49.5 Q44.2 42 49.4 49.5" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M56 49.3 Q61 42.5 66 49.3" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        </>
      ) : mood === 'hurt' ? (
        <>
          <Path d="M39.5 43.5 L48 47.6 L39.5 51.8" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M66.5 43.5 L58 47.6 L66.5 51.8" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Ellipse cx={44.2} cy={eyeY} rx={4.6} ry={mood === 'tired' ? 3.6 : 5.6} fill={INK} />
          <Ellipse cx={61.2} cy={eyeY} rx={4.1} ry={mood === 'tired' ? 3.4 : 5.2} fill={INK} />
          <Circle cx={45.7} cy={mood === 'tired' ? eyeY - 0.8 : eyeY - 2} r={1.7} fill="#FFFFFF" />
          <Circle cx={62.5} cy={mood === 'tired' ? eyeY - 0.8 : eyeY - 1.8} r={1.5} fill="#FFFFFF" />
          <Circle cx={42.7} cy={eyeY + 2} r={0.8} fill="#FFFFFF" opacity={0.85} />
          <Circle cx={59.8} cy={eyeY + 2} r={0.7} fill="#FFFFFF" opacity={0.85} />
        </>
      )}
      {/* lông mày */}
      {mood === 'attack' ? (
        <>
          <Path d="M38.5 39.8 L48.6 42.6" {...brow} />
          <Path d="M66.8 39.8 L56.8 42.6" {...brow} />
        </>
      ) : mood === 'tired' ? (
        <>
          <Path d="M39 42.6 L48.5 40.6" {...brow} />
          <Path d="M66 42.6 L57 40.6" {...brow} />
        </>
      ) : mood === 'hurt' ? null : (
        <>
          <Path d="M39.6 40.6 Q44 38.3 48.4 40.2" {...brow} />
          <Path d="M56.8 40.2 Q60.8 38.3 65.4 40.6" {...brow} />
        </>
      )}
      {/* miệng */}
      {mood === 'attack' || mood === 'happy' ? (
        <>
          <Path d="M48.6 55.4 Q54 56.6 59.6 55.4 Q58.2 63.2 54 63.2 Q49.6 63.2 48.6 55.4 Z" fill="#7A1F2B" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          <Path d="M50.8 61.2 Q54 59 57.2 61.2 Q55.8 62.8 54 62.8 Q52.2 62.8 50.8 61.2 Z" fill="#F37E8B" />
        </>
      ) : mood === 'hurt' ? (
        <Path d="M49 59.8 Q51.3 56.8 53.6 59.8 Q55.9 62.8 58.2 59.8" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" />
      ) : mood === 'tired' ? (
        <Path d="M50 59.5 Q54.2 57.5 58.4 59.5" fill="none" stroke={INK} strokeWidth={1.9} strokeLinecap="round" />
      ) : (
        <Path d="M49.6 55.8 Q54.4 61.6 59.2 55.8" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      )}
      {mood === 'tired' || mood === 'hurt' ? (
        <Path d="M71.5 36.5 Q75.5 42 71.5 45 Q67.5 42 71.5 36.5 Z" fill="#8FD3F4" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      ) : null}
    </G>
  );
}
