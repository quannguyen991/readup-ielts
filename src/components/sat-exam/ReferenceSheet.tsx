import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { useL } from '@/i18n/useL';
import { EXAM } from './exam-theme';

/**
 * Bảng công thức của phần Math — đúng những điều đề thật cho sẵn, viết lại bằng
 * lời và hình vẽ của Band 9 (hình SVG đơn giản, không chép trang của ai).
 */

const S = EXAM.navy;
const F = '#F6F1E6';
const T = { fontSize: 10, fill: EXAM.goldDeep, fontWeight: '700' as const };

type Item = { key: string; name: [string, string]; formula: string; fig: React.ReactNode };

const ITEMS: Item[] = [
  {
    key: 'circle',
    name: ['Hình tròn', 'Circle'],
    formula: 'A = πr²   C = 2πr',
    fig: (
      <>
        <Circle cx={40} cy={30} r={24} stroke={S} strokeWidth={1.5} fill={F} />
        <Line x1={40} y1={30} x2={64} y2={30} stroke={S} strokeWidth={1.5} />
        <Circle cx={40} cy={30} r={2} fill={S} />
        <SvgText x={50} y={26} {...T}>r</SvgText>
      </>
    ),
  },
  {
    key: 'rect',
    name: ['Hình chữ nhật', 'Rectangle'],
    formula: 'A = ℓw',
    fig: (
      <>
        <Rect x={10} y={12} width={60} height={34} stroke={S} strokeWidth={1.5} fill={F} />
        <SvgText x={37} y={58} {...T}>ℓ</SvgText>
        <SvgText x={73} y={32} {...T}>w</SvgText>
      </>
    ),
  },
  {
    key: 'tri',
    name: ['Tam giác', 'Triangle'],
    formula: 'A = ½bh',
    fig: (
      <>
        <Polygon points="8,50 72,50 30,8" stroke={S} strokeWidth={1.5} fill={F} />
        <Line x1={30} y1={8} x2={30} y2={50} stroke={S} strokeWidth={1} strokeDasharray="3 2" />
        <SvgText x={33} y={34} {...T}>h</SvgText>
        <SvgText x={40} y={60} {...T}>b</SvgText>
      </>
    ),
  },
  {
    key: 'pyth',
    name: ['Pythagoras', 'Pythagorean theorem'],
    formula: 'c² = a² + b²',
    fig: (
      <>
        <Polygon points="12,50 66,50 12,10" stroke={S} strokeWidth={1.5} fill={F} />
        <Path d="M12 43 H19 V50" stroke={S} strokeWidth={1} fill="none" />
        <SvgText x={4} y={32} {...T}>a</SvgText>
        <SvgText x={38} y={60} {...T}>b</SvgText>
        <SvgText x={42} y={27} {...T}>c</SvgText>
      </>
    ),
  },
  {
    key: '30-60',
    name: ['Tam giác 30°–60°–90°', '30°–60°–90° triangle'],
    formula: 'x, x√3, 2x',
    fig: (
      <>
        <Polygon points="12,50 70,50 12,16" stroke={S} strokeWidth={1.5} fill={F} />
        <Path d="M12 43 H19 V50" stroke={S} strokeWidth={1} fill="none" />
        <SvgText x={2} y={36} {...T}>x</SvgText>
        <SvgText x={30} y={60} {...T}>x√3</SvgText>
        <SvgText x={44} y={28} {...T}>2x</SvgText>
        <SvgText x={52} y={47} fontSize={8} fill={S}>30°</SvgText>
        <SvgText x={15} y={27} fontSize={8} fill={S}>60°</SvgText>
      </>
    ),
  },
  {
    key: '45-45',
    name: ['Tam giác 45°–45°–90°', '45°–45°–90° triangle'],
    formula: 's, s, s√2',
    fig: (
      <>
        <Polygon points="14,50 56,50 14,8" stroke={S} strokeWidth={1.5} fill={F} />
        <Path d="M14 43 H21 V50" stroke={S} strokeWidth={1} fill="none" />
        <SvgText x={4} y={32} {...T}>s</SvgText>
        <SvgText x={32} y={60} {...T}>s</SvgText>
        <SvgText x={38} y={26} {...T}>s√2</SvgText>
      </>
    ),
  },
  {
    key: 'box',
    name: ['Hộp chữ nhật', 'Rectangular box'],
    formula: 'V = ℓwh',
    fig: (
      <>
        <Path d="M10 22 L50 22 L50 52 L10 52 Z M10 22 L24 10 L64 10 L50 22 M64 10 L64 40 L50 52" stroke={S} strokeWidth={1.5} fill={F} />
        <SvgText x={27} y={62} {...T}>ℓ</SvgText>
        <SvgText x={60} y={22} {...T}>w</SvgText>
        <SvgText x={68} y={30} {...T}>h</SvgText>
      </>
    ),
  },
  {
    key: 'cyl',
    name: ['Hình trụ', 'Cylinder'],
    formula: 'V = πr²h',
    fig: (
      <>
        <Path d="M16 14 V48 A24 7 0 0 0 64 48 V14" stroke={S} strokeWidth={1.5} fill={F} />
        <Ellipse cx={40} cy={14} rx={24} ry={7} stroke={S} strokeWidth={1.5} fill="#FFFFFF" />
        <Line x1={40} y1={14} x2={64} y2={14} stroke={S} strokeWidth={1} />
        <SvgText x={48} y={11} {...T}>r</SvgText>
        <SvgText x={68} y={34} {...T}>h</SvgText>
      </>
    ),
  },
  {
    key: 'sphere',
    name: ['Hình cầu', 'Sphere'],
    formula: 'V = ⁴⁄₃πr³',
    fig: (
      <>
        <Circle cx={40} cy={30} r={24} stroke={S} strokeWidth={1.5} fill={F} />
        <Ellipse cx={40} cy={30} rx={24} ry={7} stroke={S} strokeWidth={1} strokeDasharray="3 2" fill="none" />
        <Line x1={40} y1={30} x2={64} y2={30} stroke={S} strokeWidth={1} />
        <SvgText x={50} y={27} {...T}>r</SvgText>
      </>
    ),
  },
  {
    key: 'cone',
    name: ['Hình nón', 'Cone'],
    formula: 'V = ⅓πr²h',
    fig: (
      <>
        <Path d="M16 48 L40 8 L64 48" stroke={S} strokeWidth={1.5} fill={F} />
        <Ellipse cx={40} cy={48} rx={24} ry={6} stroke={S} strokeWidth={1.5} fill={F} />
        <Line x1={40} y1={8} x2={40} y2={48} stroke={S} strokeWidth={1} strokeDasharray="3 2" />
        <Line x1={40} y1={48} x2={64} y2={48} stroke={S} strokeWidth={1} />
        <SvgText x={43} y={32} {...T}>h</SvgText>
        <SvgText x={50} y={45} {...T}>r</SvgText>
      </>
    ),
  },
  {
    key: 'pyr',
    name: ['Hình chóp', 'Pyramid'],
    formula: 'V = ⅓ℓwh',
    fig: (
      <>
        <Path d="M10 48 L52 48 L66 38 L40 6 Z M10 48 L40 6 L52 48" stroke={S} strokeWidth={1.5} fill={F} />
        <Line x1={40} y1={6} x2={38} y2={43} stroke={S} strokeWidth={1} strokeDasharray="3 2" />
        <SvgText x={28} y={58} {...T}>ℓ</SvgText>
        <SvgText x={62} y={50} {...T}>w</SvgText>
        <SvgText x={42} y={30} {...T}>h</SvgText>
      </>
    ),
  },
];

export default function ReferenceSheet() {
  const { L, en } = useL();
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 12 }}>
      <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
        {ITEMS.map((it) => (
          <View key={it.key} style={{ width: '50%', padding: 4 }}>
            <View className="items-center rounded-lg border px-2 py-2" style={{ borderColor: EXAM.line }}>
              <Svg width={80} height={64} viewBox="0 0 80 64">
                {it.fig}
              </Svg>
              <Text className="mt-1 text-center font-strong" style={{ fontSize: 14, color: EXAM.ink }}>
                {it.formula}
              </Text>
              <Text className="text-center font-sans" style={{ fontSize: 12, color: EXAM.muted }}>
                {en ? it.name[1] : it.name[0]}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="mt-3 gap-1.5 rounded-lg px-3 py-2.5" style={{ backgroundColor: EXAM.bar }}>
        <Fact text={L('Một vòng tròn: 360° = 2π radian.', 'A full circle: 360° = 2π radians.')} />
        <Fact text={L('Ba góc trong một tam giác cộng lại bằng 180°.', 'The three angles of a triangle add up to 180°.')} />
      </View>
    </ScrollView>
  );
}

function Fact({ text }: { text: string }) {
  return (
    <View className="flex-row gap-2">
      <Text style={{ color: EXAM.goldDeep }}>•</Text>
      <Text className="min-w-0 flex-1 font-sans text-label" style={{ color: EXAM.body }}>
        {text}
      </Text>
    </View>
  );
}
