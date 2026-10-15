import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

import type { EffectLook } from '@/services/gamification/shop';
import { mulberry32 } from '@/services/questions/rng';

/**
 * HIỆU ỨNG HỒ SƠ — lớp hoạt hình phủ lên thẻ hồ sơ, kiểu "Profile Effects" của
 * Discord. Người dùng đưa ảnh thẻ hồ sơ Discord làm mẫu, muốn đổi được bằng sao
 * (27/09/2026).
 *
 * Mọi hạt chạy bằng CSS keyframes (web): một lớp phủ tuyệt đối, không nhận chạm,
 * không làm chậm trang. Vị trí hạt gieo hạt cố định theo hiệu ứng nên vẽ lại
 * không nhảy. Người đặt "giảm chuyển động" thì hạt đứng yên, vẫn thấy hiệu ứng.
 */

const STYLE_ID = 'readup-profile-effects';

const KEYFRAMES = `
@keyframes pe-fall { 0% { transform: translate3d(0,0,0) rotate(0deg); opacity: 0; } 8% { opacity: 1; } 100% { transform: translate3d(var(--dx), 420px, 0) rotate(var(--rot)); opacity: 0.9; } }
@keyframes pe-rise { 0% { transform: translate3d(0,0,0) scale(0.6); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate3d(var(--dx), -260px, 0) scale(1.1); opacity: 0; } }
@keyframes pe-meteor { 0% { transform: translate3d(0,0,0) rotate(-35deg) scaleX(0.2); opacity: 0; } 10% { opacity: 1; } 60% { transform: translate3d(-240px, 170px, 0) rotate(-35deg) scaleX(1); opacity: 1; } 100% { transform: translate3d(-380px, 270px, 0) rotate(-35deg) scaleX(1); opacity: 0; } }
@keyframes pe-twinkle { 0%, 100% { transform: scale(0.3) rotate(0deg); opacity: 0; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }
@keyframes pe-glow { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.85; } }
@media (prefers-reduced-motion: reduce) { [data-pe] { animation: none !important; opacity: 0.8 !important; } }
`;

function ensureKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
}

type Spec = {
  count: number;
  anim: 'pe-fall' | 'pe-rise' | 'pe-meteor' | 'pe-twinkle';
  colors: string[];
  /** Vẽ một hạt. */
  shape: 'petal' | 'ember' | 'meteor' | 'flake' | 'bubble' | 'spark' | 'leaf' | 'matrix' | 'orb';
  size: [number, number];
  duration: [number, number];
  /** Quầng sáng nền của hiệu ứng. */
  glow: string;
  glowAt: 'top' | 'bottom' | 'none';
};

export const EFFECT_SPECS: Record<EffectLook, Spec> = {
  sakura: { count: 22, anim: 'pe-fall', colors: ['#FFC0DA', '#FF8FBF', '#FFE3EE'], shape: 'petal', size: [8, 14], duration: [4.5, 8], glow: themedHex('rgba(255,143,191,0.35)'), glowAt: 'top' },
  flame: { count: 26, anim: 'pe-rise', colors: ['#FFD166', '#FF8A3D', '#FF3D6E', '#B14BFF'], shape: 'ember', size: [4, 9], duration: [1.8, 3.4], glow: themedHex('rgba(255,91,61,0.45)'), glowAt: 'bottom' },
  meteor: { count: 7, anim: 'pe-meteor', colors: ['#FFFFFF', '#BFE3FF', '#FFE9A8'], shape: 'meteor', size: [60, 110], duration: [2.4, 4.2], glow: 'rgba(120,160,255,0.28)', glowAt: 'top' },
  snow: { count: 30, anim: 'pe-fall', colors: ['#FFFFFF', '#E6F4FF'], shape: 'flake', size: [3, 7], duration: [5, 10], glow: 'rgba(200,230,255,0.3)', glowAt: 'top' },
  bubbles: { count: 16, anim: 'pe-rise', colors: ['rgba(120,220,255,0.9)', 'rgba(150,255,210,0.9)', themedHex('rgba(255,255,255,0.9)')], shape: 'bubble', size: [8, 20], duration: [3.5, 6.5], glow: 'rgba(80,200,255,0.3)', glowAt: 'bottom' },
  sparkle: { count: 20, anim: 'pe-twinkle', colors: ['#FFE14D', '#FFFFFF', '#FF9CF5', '#8FE3FF'], shape: 'spark', size: [8, 16], duration: [1.4, 2.8], glow: themedHex('rgba(255,225,77,0.25)'), glowAt: 'none' },
  autumn: { count: 22, anim: 'pe-fall', colors: ['#EA580C', '#D97706', '#F59E0B', '#DC2626'], shape: 'leaf', size: [10, 18], duration: [4.5, 8], glow: 'rgba(234,88,12,0.35)', glowAt: 'top' },
  matrix: { count: 24, anim: 'pe-fall', colors: ['#00FF66', '#00F2FE', '#22C55E', '#10B981'], shape: 'matrix', size: [12, 22], duration: [1.8, 3.6], glow: 'rgba(0,255,102,0.3)', glowAt: 'top' },
  fireflies: { count: 22, anim: 'pe-rise', colors: ['#FACC15', '#A3E635', '#FEF08A'], shape: 'orb', size: [6, 11], duration: [3.5, 6.5], glow: 'rgba(250,204,21,0.35)', glowAt: 'bottom' },
  butterflies: { count: 16, anim: 'pe-rise', colors: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6'], shape: 'spark', size: [10, 16], duration: [3.8, 6.5], glow: 'rgba(56,189,248,0.3)', glowAt: 'bottom' },
  lightning: { count: 12, anim: 'pe-twinkle', colors: ['#C084FC', '#E879F9', '#FFFFFF', '#67E8F9'], shape: 'spark', size: [14, 26], duration: [0.9, 2], glow: 'rgba(192,132,252,0.4)', glowAt: 'top' },
  galaxy: { count: 26, anim: 'pe-twinkle', colors: ['#E879F9', '#818CF8', '#38BDF8', '#FFFFFF'], shape: 'spark', size: [6, 14], duration: [2, 4.2], glow: 'rgba(168,85,247,0.35)', glowAt: 'top' },
  starlight: { count: 10, anim: 'pe-meteor', colors: ['#FFFFFF', '#BAE6FD', '#FEF08A'], shape: 'meteor', size: [50, 95], duration: [2, 4], glow: 'rgba(56,189,248,0.32)', glowAt: 'top' },
  neon_pulse: { count: 20, anim: 'pe-rise', colors: ['#00F2FE', '#FF007A', '#A855F7'], shape: 'ember', size: [4, 9], duration: [1.6, 3.2], glow: themedHex('rgba(255,0,122,0.4)'), glowAt: 'bottom' },
  rainbow: { count: 22, anim: 'pe-fall', colors: ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'], shape: 'petal', size: [8, 14], duration: [4, 7.5], glow: 'rgba(251,191,36,0.3)', glowAt: 'top' },
};

function hashLook(look: string): number {
  let h = 2166136261;
  for (let i = 0; i < look.length; i++) h = Math.imul(h ^ look.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function ProfileEffect({ effect, intensity = 1 }: { effect: EffectLook | null; intensity?: number }) {
  useEffect(ensureKeyframes, []);
  const spec = effect ? EFFECT_SPECS[effect] : null;

  const parts = useMemo(() => {
    if (!spec || !effect) return [];
    const rng = mulberry32(hashLook(effect));
    const n = Math.max(3, Math.round(spec.count * intensity));
    return Array.from({ length: n }, (_, i) => {
      const size = spec.size[0] + rng() * (spec.size[1] - spec.size[0]);
      return {
        i,
        left: spec.anim === 'pe-meteor' ? 30 + rng() * 80 : rng() * 100,
        top: spec.anim === 'pe-fall' ? -10 - rng() * 20 : spec.anim === 'pe-rise' ? 70 + rng() * 35 : spec.anim === 'pe-meteor' ? -20 + rng() * 40 : rng() * 100,
        size,
        color: spec.colors[Math.floor(rng() * spec.colors.length)]!,
        duration: spec.duration[0] + rng() * (spec.duration[1] - spec.duration[0]),
        delay: -rng() * spec.duration[1],
        dx: `${Math.round((rng() - 0.5) * 60)}px`,
        rot: `${Math.round((rng() - 0.5) * 720)}deg`,
      };
    });
  }, [spec, effect, intensity]);

  if (!spec || Platform.OS !== 'web') return null;

  // Vẽ bằng <div> thật: lớp style của react-native-web lọc mất `animation`,
  // `clip-path`, biến CSS (--dx) — những thứ hiệu ứng này cần.
  const div = (key: React.Key, style: Record<string, unknown>) => React.createElement('div', { key, 'data-pe': '1', style });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 3 }}>
      {spec.glowAt !== 'none'
        ? div('glow', {
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            height: '70%',
            [spec.glowAt]: '-25%',
            background: `radial-gradient(ellipse at center, ${spec.glow}, rgba(0,0,0,0) 70%)`,
            animation: 'pe-glow 3.2s ease-in-out infinite',
          })
        : null}
      {parts.map((p) =>
        div(p.i, {
          position: 'absolute',
          left: `${p.left}%`,
          top: `${p.top}%`,
          ...shapeStyle(spec.shape, p.size, p.color),
          '--dx': p.dx,
          '--rot': p.rot,
          animation: `${spec.anim} ${p.duration.toFixed(2)}s ${spec.anim === 'pe-twinkle' ? 'ease-in-out' : 'linear'} ${p.delay.toFixed(2)}s infinite`,
          willChange: 'transform, opacity',
        }),
      )}
    </View>
  );
}

function shapeStyle(shape: Spec['shape'], size: number, c: string): Record<string, unknown> {
  switch (shape) {
    case 'petal':
      return { width: size, height: size * 0.7, backgroundColor: c, borderTopLeftRadius: size, borderBottomRightRadius: size, borderTopRightRadius: 2, borderBottomLeftRadius: 2, opacity: 0.95 };
    case 'ember':
      return { width: size, height: size, borderRadius: size, backgroundColor: c, boxShadow: `0 0 ${size * 1.6}px ${c}` };
    case 'meteor':
      return { width: size, height: 2.5, borderRadius: 2, background: `linear-gradient(90deg, ${c}, rgba(255,255,255,0))`, boxShadow: `0 0 8px ${c}` };
    case 'flake':
      return { width: size, height: size, borderRadius: size, backgroundColor: c, opacity: 0.9, boxShadow: '0 0 4px rgba(255,255,255,0.8)' };
    case 'bubble':
      return { width: size, height: size, borderRadius: size, border: `1.5px solid ${c}`, backgroundColor: themedHex('rgba(255,255,255,0.12)'), boxSizing: 'border-box' };
    case 'spark':
      return {
        width: size,
        height: size,
        backgroundColor: c,
        clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
        filter: `drop-shadow(0 0 4px ${c})`,
      };
    case 'leaf':
      return {
        width: size,
        height: size * 0.8,
        backgroundColor: c,
        borderTopLeftRadius: size,
        borderBottomRightRadius: size,
        borderTopRightRadius: 3,
        borderBottomLeftRadius: 3,
        opacity: 0.9,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      };
    case 'matrix':
      return {
        width: 2.5,
        height: size,
        background: `linear-gradient(180deg, ${c}, rgba(0,0,0,0))`,
        borderRadius: 2,
        boxShadow: `0 0 8px ${c}`,
      };
    case 'orb':
      return {
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: c,
        boxShadow: `0 0 ${size * 2}px ${c}`,
        opacity: 0.85,
      };
  }
}
