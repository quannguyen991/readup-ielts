import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, Pattern, Rect, RadialGradient, Stop, LinearGradient as SvgLinear } from 'react-native-svg';

import { PAIRS } from '@/components/home/HeroBackdrop';

/**
 * Lớp khối pastel cho thanh bên máy tính, cùng ngôn ngữ với hero: cột khối gradient nhạt lệch nhịp, chấm
 * halftone ở hai vùng, vài vệt sáng mảnh, hai quả cầu kính và một sao bốn cánh. Mọi khối đều nhạt để chữ mực
 * tối của thanh bên vẫn đọc rõ; phần trên được phủ sáng nhẹ để logo và ô tìm kiếm nổi lên.
 */

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.26'/></svg>")`;

const STAR4 = 'M0 -20 C2 -6 6 -2 20 0 C6 2 2 6 0 20 C-2 6 -6 2 -20 0 C-6 -2 -2 -6 0 -20 Z';

/** Các khối cột: x, y, rộng, cao, màu. Lệch nhịp, không xếp thành bảng cờ. */
const CELLS: [number, number, number, number, string][] = [
  [0, 0, 118, 230, 'pink'],
  [118, 0, 142, 96, 'sky'],
  [118, 96, 142, 210, 'cream'],
  [0, 230, 118, 130, 'yellow'],
  [0, 360, 118, 210, 'lilac'],
  [118, 306, 142, 124, 'peach'],
  [118, 430, 142, 190, 'sky'],
  [0, 570, 118, 170, 'cream'],
  [118, 620, 142, 120, 'yellow'],
  [0, 740, 260, 160, 'pink'],
];

/** Các vệt sáng mảnh chéo qua thanh bên. */
const STREAKS = ['M-10 150 L270 90', 'M-10 470 L270 410', 'M-10 690 L270 640'];

const KEYS = Object.keys(PAIRS);

export function SidebarMosaic() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 260 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {KEYS.map((k) => (
            <SvgLinear key={k} id={`sm-p-${k}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={PAIRS[k]![0]} />
              <Stop offset="1" stopColor={PAIRS[k]![1]} />
            </SvgLinear>
          ))}
          <RadialGradient id="sm-sphere" cx="0.36" cy="0.3" r="0.7">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
            <Stop offset="0.35" stopColor="#FFB7D5" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#FF9A3D" />
          </RadialGradient>
          <RadialGradient id="sm-sphere-b" cx="0.36" cy="0.3" r="0.7">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
            <Stop offset="0.35" stopColor="#9AD8FF" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#2F6BFF" />
          </RadialGradient>
          <Pattern id="sm-dot" width={7} height={7} patternUnits="userSpaceOnUse">
            <Circle cx={3.5} cy={3.5} r={1} fill="#FFFFFF" />
          </Pattern>
        </Defs>

        {CELLS.map(([x, y, w, h, k], i) => (
          <Rect key={`c-${i}`} x={x} y={y} width={w} height={h} fill={`url(#sm-p-${k})`} opacity={0.62} />
        ))}

        {/* Lệch kênh nhẹ ở hai khối, như hero. */}
        <Rect x={130} y={130} width={118} height={60} fill="url(#sm-p-pink)" opacity={0.4} />
        <Rect x={130} y={650} width={118} height={60} fill="url(#sm-p-sky)" opacity={0.4} />

        {/* Chấm halftone ở vùng trên và vùng dưới. */}
        <Rect x={0} y={0} width={260} height={120} fill="url(#sm-dot)" opacity={0.45} />
        <Rect x={0} y={770} width={260} height={130} fill="url(#sm-dot)" opacity={0.35} />

        {/* Vệt sáng mảnh chéo. */}
        {STREAKS.map((d, i) => (
          <Path key={`s-${i}`} d={d} stroke="#FFFFFF" strokeWidth={1.4} fill="none" opacity={0.7} />
        ))}

        {/* Quả cầu kính và sao bốn cánh. */}
        <G>
          <Ellipse cx={130} cy={862} rx={34} ry={8} fill="#3B1D5C" opacity={0.16} />
          <Circle cx={130} cy={830} r={26} fill="url(#sm-sphere)" />
          <Circle cx={130} cy={830} r={25} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.6} />
          <Ellipse cx={122} cy={818} rx={8} ry={4} fill="#FFFFFF" opacity={0.9} transform="rotate(-28 122 818)" />
        </G>
        <G>
          <Ellipse cx={206} cy={580} rx={14} ry={4} fill="#3B1D5C" opacity={0.14} />
          <Circle cx={206} cy={560} r={15} fill="url(#sm-sphere-b)" />
          <Ellipse cx={201} cy={548} rx={5} ry={2.5} fill="#FFFFFF" opacity={0.9} transform="rotate(-28 201 548)" />
        </G>
        <G transform="translate(214 262) scale(0.7)">
          <Path d={STAR4} fill="#FFFFFF" opacity={0.9} />
        </G>
        <G transform="translate(40 640) scale(0.55)">
          <Path d={STAR4} fill="#FFFFFF" opacity={0.85} />
        </G>
      </Svg>
      <View style={{ ...StyleSheet.absoluteFill, backgroundImage: GRAIN } as never} />
    </View>
  );
}
