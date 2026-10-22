import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

/**
 * Quả cầu kính bóng loáng, cùng ngôn ngữ với hero: lõi sáng ở góc trên trái, thân màu, viền sáng mảnh và một
 * vệt phản quang. Dùng để đặt điểm nhấn lên các khối hoạ tiết, đúng như quả cầu trên nền hero.
 */
export function GlassSphere({ color, size = 44, style }: { color: string; size?: number; style?: ViewStyle }) {
  const id = 'gs-' + color.replace(/[^a-zA-Z0-9]/g, '') + '-' + size;
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={id} cx="36%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
            <Stop offset="0.3" stopColor={color} stopOpacity="0.92" />
            <Stop offset="1" stopColor={color} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={48} fill={`url(#${id})`} />
        <Circle cx={50} cy={50} r={47} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
        <Ellipse cx={36} cy={30} rx={14} ry={7} fill="#FFFFFF" opacity={0.9} transform="rotate(-28 36 30)" />
      </Svg>
    </View>
  );
}
