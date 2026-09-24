import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

import { ensureProfileKeyframes, loop, MOVE } from './profile-anim';
import { AuroraBackdrop } from '@/components/layout/AuroraBackdrop';
import { GlowStars } from '@/components/ui/GlowStars';
import type { CoverLook } from '@/services/gamification/shop';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * BÌA HỒ SƠ CHUYỂN ĐỘNG — dải ảnh bìa ở đầu trang Hồ sơ và thẻ trên bảng xếp hạng.
 * Mỗi bìa là một cảnh nhỏ vẽ bằng CSS + SVG, không nạp ảnh: trời sao có sao băng,
 * hoàng hôn pixel mây trôi, sóng biển, cực quang. Không đeo bìa thì là dải màu
 * mặc định của app.
 */

ensureProfileKeyframes();

export function ProfileCover({ cover, height, children }: { cover: CoverLook | null; height: number; children?: React.ReactNode }) {
  return (
    <View style={{ height, overflow: 'hidden', position: 'relative' }}>
      {cover === 'stars' ? (
        <StarsCover seed="stars" />
      ) : cover === 'sunset' ? (
        <SunsetCover />
      ) : cover === 'ocean' ? (
        <OceanCover />
      ) : cover === 'aurora' ? (
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <AuroraBackdrop />
        </View>
      ) : (
        <DefaultCover />
      )}
      {children}
    </View>
  );
}

const FILL = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 } as const;

function DefaultCover() {
  return (
    <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', right: 18, top: 10 }}>
        <GlowStars scale={1.1} />
      </View>
    </LinearGradient>
  );
}

function StarsCover({ seed }: { seed: string }) {
  const dots = useMemo(() => {
    const rng = mulberry32(hashString(seed));
    return Array.from({ length: 46 }, () => ({ x: rng() * 100, y: rng() * 100, s: 1 + Math.round(rng() * 2), d: Math.round(rng() * 3000), t: 1600 + Math.round(rng() * 2400) }));
  }, [seed]);
  return (
    <LinearGradient colors={['#0B1030', '#1E1B4B', '#312E81']} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={FILL}>
      {dots.map((p, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, backgroundColor: '#FFFFFF', ...loop('rp-twinkle', p.t, { delay: p.d }) }}
          {...MOVE}
        />
      ))}
      {[0, 1].map((i) => (
        <View
          key={`s${i}`}
          style={{ position: 'absolute', left: `${8 + i * 34}%`, top: `${6 + i * 14}%`, width: 70, height: 2, borderRadius: 2, transform: [{ rotate: '23deg' }] }}
        >
          <View style={{ width: 70, height: 2, ...loop('rp-shoot', 7000, { delay: 1200 + i * 3400, timing: 'linear' }) }} {...MOVE}>
            <LinearGradient colors={['rgba(255,255,255,0)', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 70, height: 2, borderRadius: 2 }} />
          </View>
        </View>
      ))}
    </LinearGradient>
  );
}

function SunsetCover() {
  return (
    <LinearGradient colors={['#FDBA74', '#F472B6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '62%', top: '26%', width: 64, height: 64, borderRadius: 64, backgroundColor: '#FEF08A', ...loop('rp-sun', 5000) }} {...MOVE} />
      {/* Mây trôi: hai dải giống nhau nối đuôi, dịch nửa chiều dài là liền mạch. */}
      <View style={{ position: 'absolute', left: 0, top: '14%', width: '200%', height: 40, flexDirection: 'row', ...loop('rp-drift', 38000, { timing: 'linear' }) }} {...MOVE}>
        {[0, 1].map((k) => (
          <View key={k} style={{ width: '50%', height: 40 }}>
            {[8, 34, 58, 82].map((x) => (
              <View key={x} style={{ position: 'absolute', left: `${x}%`, top: (x % 3) * 6, width: 54, height: 14, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.75)' }} />
            ))}
          </View>
        ))}
      </View>
      <Svg width="100%" height="55%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Rect x={0} y={14} width={34} height={26} fill="#6D28D9" />
        <Rect x={30} y={8} width={30} height={32} fill="#6D28D9" />
        <Rect x={58} y={18} width={40} height={22} fill="#6D28D9" />
        <Rect x={96} y={6} width={26} height={34} fill="#6D28D9" />
        <Rect x={120} y={16} width={44} height={24} fill="#6D28D9" />
        <Rect x={162} y={10} width={38} height={30} fill="#6D28D9" />
        <Rect x={0} y={26} width={60} height={14} fill="#4C1D95" />
        <Rect x={56} y={22} width={50} height={18} fill="#4C1D95" />
        <Rect x={104} y={28} width={46} height={12} fill="#4C1D95" />
        <Rect x={148} y={24} width={52} height={16} fill="#4C1D95" />
      </Svg>
    </LinearGradient>
  );
}

const WAVE = 'M0 10 Q 12.5 4 25 10 T 50 10 T 75 10 T 100 10 T 125 10 T 150 10 T 175 10 T 200 10 V 20 H 0 Z';

function OceanCover() {
  return (
    <LinearGradient colors={['#BAE6FD', '#7DD3FC', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '18%', top: '16%', width: 50, height: 50, borderRadius: 50, backgroundColor: '#FEF9C3', ...loop('rp-glow', 4000) }} {...MOVE} />
      {(
        [
          { bottom: '28%', color: 'rgba(56,189,248,0.75)', ms: 9000 },
          { bottom: '14%', color: 'rgba(14,165,233,0.85)', ms: 6500 },
          { bottom: '-2%', color: '#0369A1', ms: 4800 },
        ] as const
      ).map((w, i) => (
        <View key={i} style={{ position: 'absolute', left: 0, bottom: w.bottom, width: '200%', height: 34, ...loop('rp-drift', w.ms, { timing: 'linear' }) }} {...MOVE}>
          <Svg width="100%" height={34} viewBox="0 0 200 20" preserveAspectRatio="none">
            <Path d={WAVE} fill={w.color} />
          </Svg>
        </View>
      ))}
      {[12, 30, 47, 66, 84].map((x, i) => (
        <View key={x} style={{ position: 'absolute', left: `${x}%`, bottom: `${10 + (i % 3) * 7}%`, width: 3, height: 3, backgroundColor: '#FFFFFF', ...loop('rp-twinkle', 1400 + i * 300, { delay: i * 250 }) }} {...MOVE} />
      ))}
    </LinearGradient>
  );
}
