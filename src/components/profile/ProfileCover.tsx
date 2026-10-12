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
      ) : cover === 'cyberpunk' ? (
        <CyberpunkCover />
      ) : cover === 'sakura' ? (
        <SakuraCover />
      ) : cover === 'mountain' ? (
        <MountainCover />
      ) : cover === 'galaxy' ? (
        <GalaxyCover />
      ) : cover === 'library' ? (
        <LibraryCover />
      ) : cover === 'bamboo' ? (
        <BambooCover />
      ) : cover === 'autumn' ? (
        <AutumnCover />
      ) : cover === 'vaporwave' ? (
        <VaporwaveCover />
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
    <LinearGradient colors={['#F6DC8E', '#E2B54E', '#B8862B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL}>
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

function CyberpunkCover() {
  return (
    <LinearGradient colors={['#050814', '#160B28', '#260B3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 22, height: 1.5, backgroundColor: '#00F2FE' }} />
      <View style={{ position: 'absolute', left: '16%', bottom: 20, width: 24, height: 38, backgroundColor: '#0A0E17', borderTopWidth: 2, borderColor: '#FF007A' }} />
      <View style={{ position: 'absolute', left: '32%', bottom: 22, width: 32, height: 46, backgroundColor: '#0A0E17', borderTopWidth: 2, borderColor: '#00F2FE' }} />
      <View style={{ position: 'absolute', left: '54%', bottom: 18, width: 28, height: 34, backgroundColor: '#0A0E17', borderTopWidth: 2, borderColor: '#FACC15' }} />
      <View style={{ position: 'absolute', left: '74%', bottom: 22, width: 38, height: 42, backgroundColor: '#0A0E17', borderTopWidth: 2, borderColor: '#A855F7' }} />
      <View style={{ position: 'absolute', right: 18, top: 10 }}>
        <GlowStars scale={1.1} />
      </View>
    </LinearGradient>
  );
}

function SakuraCover() {
  return (
    <LinearGradient colors={['#FCE7F3', '#FBCFE8', '#F472B6']} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={FILL}>
      <Svg width="100%" height="60%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Path d="M40 40 L90 8 L100 8 L150 40 Z" fill="#9D4EDD" opacity="0.4" />
        <Path d="M85 12 L90 8 L100 8 L105 12 L100 15 L95 12 L90 15 Z" fill="#FFFFFF" opacity="0.9" />
        <Path d="M0 40 Q 50 28 100 36 T 200 32 V 40 H 0 Z" fill="#7B2CBF" opacity="0.6" />
      </Svg>
      {[15, 35, 55, 75, 90].map((x, i) => (
        <View key={x} style={{ position: 'absolute', left: `${x}%`, top: `${15 + (i % 3) * 16}%`, width: 8, height: 5, borderRadius: 6, backgroundColor: '#FF85A1', ...loop('rp-drift', 4000 + i * 800) }} {...MOVE} />
      ))}
    </LinearGradient>
  );
}

function MountainCover() {
  return (
    <LinearGradient colors={['#FEF3C7', '#FDE68A', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '72%', top: '15%', width: 40, height: 40, borderRadius: 40, backgroundColor: '#FEF9C3', ...loop('rp-glow', 5000) }} {...MOVE} />
      <Svg width="100%" height="70%" viewBox="0 0 200 50" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Path d="M0 50 L35 15 L70 50 Z" fill="#475569" opacity="0.5" />
        <Path d="M50 50 L95 10 L140 50 Z" fill="#334155" opacity="0.7" />
        <Path d="M110 50 L160 18 L200 45 V 50 H 0 Z" fill="#1E293B" />
      </Svg>
    </LinearGradient>
  );
}

function GalaxyCover() {
  return (
    <LinearGradient colors={['#030712', '#1E1B4B', '#4C1D95']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '48%', top: '26%', width: 28, height: 28, borderRadius: 28, backgroundColor: '#E0E7FF', ...loop('rp-spin', 25000, { timing: 'linear' }) }} {...MOVE}>
        <View style={{ position: 'absolute', top: 12, left: -8, width: 44, height: 4, borderRadius: 4, backgroundColor: '#A78BFA', transform: [{ rotate: '-25deg' }] }} />
      </View>
      {[10, 24, 40, 68, 82, 92].map((x, i) => (
        <View key={x} style={{ position: 'absolute', left: `${x}%`, top: `${10 + (i % 4) * 18}%`, width: 2 + (i % 2), height: 2 + (i % 2), backgroundColor: '#FFFFFF', ...loop('rp-twinkle', 1800 + i * 350) }} {...MOVE} />
      ))}
    </LinearGradient>
  );
}

function LibraryCover() {
  return (
    <LinearGradient colors={['#1C130E', '#382215', '#57361E']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '15%', top: '30%', width: 14, height: 14, borderRadius: 14, backgroundColor: '#FDE047' }} />
      <Svg width="100%" height="65%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Rect x={10} y={10} width={8} height={30} fill="#B45309" />
        <Rect x={20} y={6} width={9} height={34} fill="#92400E" />
        <Rect x={31} y={12} width={7} height={28} fill="#78350F" />
        <Rect x={40} y={8} width={10} height={32} fill="#B45309" />
        <Rect x={140} y={8} width={9} height={32} fill="#92400E" />
        <Rect x={151} y={12} width={8} height={28} fill="#78350F" />
        <Rect x={161} y={6} width={11} height={34} fill="#B45309" />
        <Rect x={174} y={10} width={9} height={30} fill="#D97706" />
        <Rect x={0} y={36} width={200} height={4} fill="#451A03" />
      </Svg>
    </LinearGradient>
  );
}

function BambooCover() {
  return (
    <LinearGradient colors={['#06241D', '#0D4738', '#146852']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <Svg width="100%" height="80%" viewBox="0 0 200 50" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {[18, 42, 75, 115, 148, 178].map((x, i) => (
          <Rect key={x} x={x} y={4 + (i % 3) * 4} width={5} height={46} fill="#34D399" opacity={0.6 + (i % 3) * 0.15} rx={2} />
        ))}
        <Path d="M0 50 Q 50 42 100 46 T 200 44 V 50 H 0 Z" fill="#064E3B" />
      </Svg>
    </LinearGradient>
  );
}

function AutumnCover() {
  return (
    <LinearGradient colors={['#451A03', '#78350F', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 0.2, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '78%', top: '16%', width: 38, height: 38, borderRadius: 38, backgroundColor: '#FDE68A', opacity: 0.9, ...loop('rp-sun', 6000) }} {...MOVE} />
      <Svg width="100%" height="60%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Path d="M0 40 Q 60 22 120 32 T 200 28 V 40 H 0 Z" fill="#991B1B" opacity="0.8" />
        <Path d="M30 40 Q 90 26 150 36 T 200 34 V 40 H 0 Z" fill="#7C2D12" />
      </Svg>
    </LinearGradient>
  );
}

function VaporwaveCover() {
  return (
    <LinearGradient colors={['#1E1135', '#4A154B', '#831843']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL}>
      <View style={{ position: 'absolute', left: '42%', bottom: '26%', width: 50, height: 50, borderRadius: 50, backgroundColor: '#FDE047', ...loop('rp-glow', 4000) }} {...MOVE} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '32%', backgroundColor: '#0F051D', borderTopWidth: 1.5, borderColor: '#EC4899' }} />
    </LinearGradient>
  );
}
