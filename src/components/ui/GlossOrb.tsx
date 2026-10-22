import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * Icon kiểu quả cầu bóng kính, theo ảnh tham chiếu: loang sáng ở góc trên, vệt phản quang, viền sáng mảnh,
 * hạt giấy phủ lên, và glyph trắng ở giữa. Dùng cùng bảng màu với thẻ, nên mỗi mảng có quả cầu riêng.
 */

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='80' height='80' filter='url(%23n)' opacity='0.22'/></svg>")`;

export function GlossOrb({ icon, tone, size = 52 }: { icon: IconName; tone: readonly string[]; size?: number }) {
  const light = tone[0] ?? '#B9A9FF';
  const deep = tone[1] ?? '#6A4BD9';
  const id = 'orb-' + (light + deep).replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? ({ boxShadow: `0 6px 14px -4px ${deep}99, inset 0 -6px 10px rgba(0,0,0,0.12)` } as object) : {}),
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={id} cx="38%" cy="30%" r="72%" fx="32%" fy="24%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="0.28" stopColor={light} />
            <Stop offset="1" stopColor={deep} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
        <Ellipse cx={36} cy={24} rx={20} ry={9} fill="#FFFFFF" opacity={0.6} />
        <Circle cx={50} cy={50} r={48} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2} />
      </Svg>
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, backgroundImage: GRAIN } as never} />
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={Math.round(size * 0.42)} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    </View>
  );
}
