import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, Pattern, RadialGradient, Rect, Stop, LinearGradient as SvgLinear } from 'react-native-svg';

/**
 * Nền hero theo phong cách khối pastel, nhiều chi tiết: lưới khối gradient mờ, đường hầm kính phối cảnh
 * bên phải, vài vệt lệch kênh kiểu glitch, chấm halftone, quả cầu kính có vệt sáng và viền sáng, và hạt giấy
 * mạnh như ảnh in risograph. Nền sáng nên chữ trên hero dùng mực tối. Hạt giấy khẽ nhảy rất chậm trên web;
 * giảm chuyển động thì đứng yên.
 */

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.32'/></svg>")`;

const CSS = `
.b9-hb-grain{animation:b9-hb-grain 1.2s steps(4) infinite}
@keyframes b9-hb-grain{0%{transform:translate3d(0,0,0)}25%{transform:translate3d(-2px,1px,0)}50%{transform:translate3d(2px,-1px,0)}75%{transform:translate3d(-1px,-2px,0)}100%{transform:translate3d(0,0,0)}}
@media (prefers-reduced-motion: reduce){.b9-hb-grain{animation:none}}
`;

/** Nạp CSS hạt chuyển động một lần vào trang (web). */
function ensureBackdropCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById('b9-hb-css')) return;
  const el = document.createElement('style');
  el.id = 'b9-hb-css';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Cặp màu cho từng khối: sáng → đậm. */
export const PAIRS: Record<string, [string, string]> = {
  pink: ['#FFB7D5', '#FFEFF6'],
  orange: ['#FF9A3D', '#E8452E'],
  yellow: ['#FFE27A', '#FFF8DC'],
  blue: ['#2F6BFF', '#9AD8FF'],
  sky: ['#BFE6FF', '#F2FBFF'],
  peach: ['#FFC9A8', '#FFF0E6'],
  lilac: ['#C9B6FF', '#F4EFFF'],
  cream: ['#FFF6E4', '#FFFFFF'],
  red: ['#FF5A4E', '#FFB3A3'],
};

/** Các khối lưới: x, y, rộng, cao, màu. Lệch nhau một chút để không thành bảng cờ. */
const CELLS: [number, number, number, number, string][] = [
  [0, 0, 160, 150, 'blue'], [0, 150, 160, 200, 'pink'], [0, 350, 160, 140, 'yellow'], [0, 490, 160, 210, 'cream'],
  [160, 0, 150, 260, 'peach'], [160, 260, 150, 140, 'pink'], [160, 400, 150, 300, 'blue'],
  [310, 0, 120, 110, 'orange'], [310, 110, 120, 190, 'cream'], [310, 300, 120, 140, 'sky'], [310, 440, 120, 260, 'yellow'],
  [430, 0, 190, 70, 'sky'], [430, 70, 190, 240, 'pink'], [430, 310, 190, 160, 'cream'], [430, 470, 190, 230, 'orange'],
  [620, 0, 140, 300, 'lilac'], [620, 300, 140, 220, 'peach'], [620, 520, 140, 180, 'blue'],
  [760, 0, 200, 140, 'blue'], [760, 140, 200, 170, 'cream'], [760, 310, 200, 190, 'pink'], [760, 500, 200, 200, 'yellow'],
  [960, 0, 240, 110, 'pink'], [960, 110, 240, 250, 'sky'], [960, 360, 240, 160, 'red'], [960, 520, 240, 180, 'cream'],
];

/** Quả cầu kính: tâm, bán kính và màu. */
const SPHERES: [number, number, number, string][] = [
  [80, 250, 38, 'red'],
  [370, 190, 40, 'orange'],
  [485, 470, 44, 'yellow'],
  [1070, 300, 50, 'blue'],
  [700, 440, 30, 'pink'],
  [260, 600, 26, 'blue'],
  [560, 110, 22, 'orange'],
  [1150, 560, 34, 'pink'],
];

/** Đường hầm kính: điểm hội tụ và khung ngoài. */
const VP = { x: 1000, y: 330 };
const OUTER = { x0: 620, y0: 0, x1: 1200, y1: 700 };

/** Bốn góc của khung đã co về phía điểm hội tụ theo tỉ lệ s. */
function rectAt(s: number): [number, number][] {
  const pts: [number, number][] = [
    [OUTER.x0, OUTER.y0],
    [OUTER.x1, OUTER.y0],
    [OUTER.x1, OUTER.y1],
    [OUTER.x0, OUTER.y1],
  ];
  return pts.map(([x, y]) => [VP.x + (x - VP.x) * s, VP.y + (y - VP.y) * s]);
}

const TUNNEL_SCALES = [1, 0.74, 0.5, 0.3];
const TUNNEL_FILLS = ['#FFFFFF', '#FFB7D5', '#9AD8FF', '#FFE27A'];

export function HeroBackdrop() {
  useEffect(() => {
    ensureBackdropCss();
  }, []);

  const colours = Object.keys(PAIRS);

  return (
    <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#FFF6E4' }}>
      <Svg width="100%" height="100%" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {colours.map((k) => (
            <SvgLinear key={k} id={`hb-p-${k}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={PAIRS[k]![0]} />
              <Stop offset="1" stopColor={PAIRS[k]![1]} />
            </SvgLinear>
          ))}
          {colours.map((k) => (
            <RadialGradient key={`s-${k}`} id={`hb-s-${k}`} cx="0.36" cy="0.3" r="0.7">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
              <Stop offset="0.3" stopColor={PAIRS[k]![1]} stopOpacity="0.9" />
              <Stop offset="1" stopColor={PAIRS[k]![0]} />
            </RadialGradient>
          ))}
          <Pattern id="hb-dot" width={8} height={8} patternUnits="userSpaceOnUse">
            <Circle cx={4} cy={4} r={1.2} fill="#FFFFFF" />
          </Pattern>
        </Defs>

        {CELLS.map(([x, y, w, h, k], i) => (
          <Rect key={`c-${i}`} x={x} y={y} width={w} height={h} fill={`url(#hb-p-${k})`} />
        ))}

        {/* Lệch kênh kiểu glitch: vài khối được vẽ lặp, dịch ngang một chút. */}
        {CELLS.filter((_, i) => i % 7 === 3).map(([x, y, w, h, k], i) => (
          <Rect key={`g-${i}`} x={x + 12} y={y + 6} width={w} height={Math.min(h, 90)} fill={`url(#hb-p-${k})`} opacity={0.55} />
        ))}

        {/* Đường hầm kính: các quầng màu mờ nối khung ngoài với khung trong, rồi viền trắng. */}
        {TUNNEL_SCALES.slice(0, -1).map((s, k) => {
          const A = rectAt(s);
          const B = rectAt(TUNNEL_SCALES[k + 1]!);
          return A.map((p, i) => {
            const j = (i + 1) % 4;
            const d = `M${p[0]} ${p[1]} L${A[j]![0]} ${A[j]![1]} L${B[j]![0]} ${B[j]![1]} L${B[i]![0]} ${B[i]![1]} Z`;
            return <Path key={`t-${k}-${i}`} d={d} fill={TUNNEL_FILLS[(i + k) % TUNNEL_FILLS.length]} opacity={0.32 + k * 0.1} />;
          });
        })}
        {TUNNEL_SCALES.map((s, k) => {
          const pts = rectAt(s);
          return (
            <Path
              key={`tl-${k}`}
              d={`M${pts[0]![0]} ${pts[0]![1]} L${pts[1]![0]} ${pts[1]![1]} L${pts[2]![0]} ${pts[2]![1]} L${pts[3]![0]} ${pts[3]![1]} Z`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={k === 0 ? 2.5 : 1.4}
              opacity={0.7}
            />
          );
        })}
        <Circle cx={VP.x} cy={VP.y} r={26} fill="url(#hb-s-blue)" />

        {/* Chấm halftone phủ một vùng bên phải và một dải dưới. */}
        <Rect x={820} y={0} width={380} height={300} fill="url(#hb-dot)" opacity={0.5} />
        <Rect x={0} y={560} width={300} height={140} fill="url(#hb-dot)" opacity={0.4} />

        {/* Vệt sáng mảnh và tam giác nhỏ, như nét in lệch. */}
        <Path d="M300 40 L380 120 L300 150 Z" fill="#FFFFFF" opacity={0.55} />
        <Path d="M580 330 L640 300 L620 380 Z" fill="#FFFFFF" opacity={0.5} />
        <Rect x={0} y={345} width={1200} height={3} fill="#FFFFFF" opacity={0.6} />

        {SPHERES.map(([cx, cy, r, k], i) => (
          <G key={`sp-${i}`}>
            <Ellipse cx={cx} cy={cy + r * 0.92} rx={r * 0.95} ry={r * 0.22} fill="#3B1D5C" opacity={0.2} />
            <Circle cx={cx} cy={cy} r={r} fill={`url(#hb-s-${k})`} />
            <Circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
            <Ellipse cx={cx - r * 0.36} cy={cy - r * 0.42} rx={r * 0.34} ry={r * 0.16} fill="#FFFFFF" opacity={0.9} transform={`rotate(-28 ${cx - r * 0.36} ${cy - r * 0.42})`} />
          </G>
        ))}
      </Svg>
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, backgroundImage: GRAIN } as never} />
    </View>
  );
}
