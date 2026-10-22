import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui';

/**
 * Huy hiệu lục giác: nền gradient theo tông, một icon trắng ở giữa, viền trắng và vệt sáng nhẹ.
 * Chưa mở khóa thì xám nhạt với ổ khóa, để thấy mình còn bao xa mà không làm nó chói.
 */

export type BadgeTone = 'violet' | 'coral' | 'mint' | 'sky' | 'pink' | 'amber';

const HEX = 'M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z';
const GLOSS = 'M50 14 L84 33 L84 67 L50 86 L16 67 L16 33 Z';

const TONES: Record<BadgeTone, [string, string]> = {
  violet: ['#A38BFA', '#6A4BD9'],
  coral: ['#FF9C8C', '#E8708A'],
  mint: ['#8FE0B0', '#23875E'],
  sky: ['#8EC5FF', '#2F6FD6'],
  pink: ['#FFA8C8', '#C2437A'],
  amber: ['#FFD27A', '#E8962C'],
};

export function HexBadge({ icon, tone = 'violet', locked = false, size = 64 }: { icon: IconName; tone?: BadgeTone; locked?: boolean; size?: number }) {
  const [from, to] = locked ? ['#F3F0FB', '#DCD5EE'] : TONES[tone];
  const gid = `hexbadge-${locked ? 'locked' : tone}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </SvgGradient>
        </Defs>
        <Path d={HEX} fill={`url(#${gid})`} stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" />
        <Path d={GLOSS} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={locked ? 'lock' : icon} size={Math.round(size * 0.36)} color={locked ? '#A59CC4' : '#FFFFFF'} strokeWidth={2.2} />
      </View>
    </View>
  );
}
