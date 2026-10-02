import React, { useContext, useEffect, useId } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { CardHoverContext } from './StickerCard';

/**
 * CHÙM SAO PHÁT SÁNG ở góc trên phải của thẻ khối: một sao lớn nhấp nháy và xoay
 * nhẹ trên quầng sáng, một sao vừa bay vòng quanh nó, một sao nhỏ lấp lánh, và
 * vài đốm sáng bay lên rồi tan. Thẻ được rê chuột thì sao sáng hơn, nhanh hơn.
 *
 * Chạy bằng CSS keyframes (trình duyệt tự dừng khi tab ẩn, không tốn JS mỗi
 * khung hình). Người đặt "giảm chuyển động" thấy chùm sao đứng yên; app native
 * cũng vậy.
 */

/** Sao bốn cánh cạnh cong — cùng dáng với biểu tượng "sparkle" của app. */
const STAR = 'M12 0 C12.9 6.6 17.4 11.1 24 12 C17.4 12.9 12.9 17.4 12 24 C11.1 17.4 6.6 12.9 0 12 C6.6 11.1 11.1 6.6 12 0 Z';

const KEYFRAMES_ID = 'readup-glow-stars';

function ensureKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(KEYFRAMES_ID)) return;
  const el = document.createElement('style');
  el.id = KEYFRAMES_ID;
  el.textContent = `
@keyframes readup-star-twinkle { 0%, 100% { transform: scale(0.78) rotate(0deg); opacity: 0.72; } 50% { transform: scale(1.12) rotate(24deg); opacity: 1; } }
@keyframes readup-star-halo { 0%, 100% { transform: scale(0.7); opacity: 0.35; } 50% { transform: scale(1.3); opacity: 0.9; } }
@keyframes readup-star-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes readup-star-rise { 0% { transform: translateY(8px) scale(0.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-26px) scale(1); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { [data-star-anim] { animation: none !important; } }
/* Điện thoại: 8 phần tử chạy vô hạn mỗi chùm sao (kèm drop-shadow) là quá tay cho GPU di động — để sao đứng yên. */
@media (max-width: 767px) { [data-star-anim] { animation: none !important; } }`;
  document.head.appendChild(el);
}

function anim(name: string, seconds: number, delay = 0, timing = 'ease-in-out'): object {
  if (Platform.OS !== 'web') return {};
  return {
    animationName: name,
    animationDuration: `${seconds}s`,
    animationDelay: `${delay}s`,
    animationTimingFunction: timing,
    animationIterationCount: 'infinite',
  };
}

const ANIM = { dataSet: { starAnim: '1' } } as object;

function Star({ size, gradient }: { size: number; gradient: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <RadialGradient id={gradient} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFF1B8" />
        </RadialGradient>
      </Defs>
      <Path d={STAR} fill={`url(#${gradient})`} />
    </Svg>
  );
}

/** `scale` phóng cả chùm (1 = cỡ thẻ thường; lớn hơn cho chỗ cần nổi bật). */
export function GlowStars({ scale = 1 }: { scale?: number }) {
  useEffect(ensureKeyframes, []);
  const hover = useContext(CardHoverContext);
  // Mỗi chùm một id gradient riêng: id SVG dùng chung cả trang, trùng là lấy nhầm của nhau.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const k = hover ? 0.5 : 1; // rê chuột: nhanh gấp đôi
  const s = (n: number) => n * scale;
  const box = s(84);
  const big = s(30);
  // Tâm sao lớn trong khung.
  const cx = s(52);
  const cy = s(30);
  const glow = Platform.OS === 'web' ? ({ filter: `drop-shadow(0 0 ${s(4)}px rgba(255,255,255,0.95)) drop-shadow(0 0 ${s(10)}px rgba(255,248,220,${hover ? 0.9 : 0.6}))` } as object) : null;

  return (
    <View pointerEvents="none" style={{ width: box, height: box }}>
      {/* Quầng sáng dưới sao lớn. */}
      <View
        {...ANIM}
        style={{
          position: 'absolute',
          left: cx - s(14),
          top: cy - s(14),
          width: s(28),
          height: s(28),
          borderRadius: s(14),
          backgroundColor: 'rgba(255,255,255,0.28)',
          ...(Platform.OS === 'web' ? ({ boxShadow: `0 0 ${s(20)}px ${s(9)}px rgba(255,255,255,${hover ? 0.6 : 0.42})` } as object) : null),
          ...anim('readup-star-halo', 2.6 * k),
        }}
      />
      {/* Sao lớn. */}
      <View {...ANIM} style={[{ position: 'absolute', left: cx - big / 2, top: cy - big / 2 }, glow, anim('readup-star-twinkle', 2.6 * k)]}>
        <Star size={big} gradient={`g1${uid}`} />
      </View>
      {/* Sao vừa bay vòng quanh sao lớn: khung xoay quanh tâm sao lớn, sao nằm lệch ra một bán kính. */}
      <View {...ANIM} style={[{ position: 'absolute', left: cx, top: cy, width: 0, height: 0 }, anim('readup-star-orbit', 7 * k, 0, 'linear')]}>
        <View {...ANIM} style={[{ position: 'absolute', left: s(22), top: -s(7) }, glow, anim('readup-star-twinkle', 1.9 * k, -0.7)]}>
          <Star size={s(14)} gradient={`g2${uid}`} />
        </View>
      </View>
      {/* Sao nhỏ lấp lánh. */}
      <View {...ANIM} style={[{ position: 'absolute', left: s(14), top: s(52) }, glow, anim('readup-star-twinkle', 1.5 * k, -1.1)]}>
        <Star size={s(10)} gradient={`g3${uid}`} />
      </View>
      {/* Đốm sáng bay lên rồi tan. */}
      {[
        { x: 40, d: 0 },
        { x: 62, d: 0.9 },
        { x: 30, d: 1.8 },
      ].map((p) => (
        <View
          key={p.x}
          {...ANIM}
          style={{
            position: 'absolute',
            left: s(p.x),
            top: s(58),
            width: s(4),
            height: s(4),
            borderRadius: s(2),
            backgroundColor: '#FFFFFF',
            opacity: Platform.OS === 'web' ? 0 : 0.8,
            ...(Platform.OS === 'web' ? ({ boxShadow: `0 0 ${s(6)}px ${s(2)}px rgba(255,255,255,0.8)` } as object) : null),
            ...anim('readup-star-rise', 2.7 * k, p.d, 'ease-out'),
          }}
        />
      ))}
    </View>
  );
}
