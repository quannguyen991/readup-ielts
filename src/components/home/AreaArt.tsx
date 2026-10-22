import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect, Stop, LinearGradient as SvgLinear } from 'react-native-svg';
import { GlassSphere } from '@/components/ui/GlassSphere';

/**
 * Ô hoạ tiết cho từng mảng học ở trang chủ (desktop), theo kiểu hình học gradient như ảnh tham chiếu:
 * khối vuông, vòm, nửa tròn, viên thuốc, cột, cung đồng tâm và tam giác, phủ chấm halftone và hạt giấy.
 * Mỗi mảng một bố cục riêng, cùng bảng màu suy ra từ màu của thẻ. Vẽ bằng SVG nên sắc ở mọi cỡ.
 * Chỉ có chuyển động trôi rất nhẹ trên web; giảm chuyển động thì đứng yên.
 */

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.22'/></svg>")`;

const TILE_CSS = `
.b9-tile-drift{animation:b9-tile-drift 10s ease-in-out infinite alternate}
@keyframes b9-tile-drift{0%{transform:translate3d(-2px,1px,0)}100%{transform:translate3d(2px,-2px,0)}}
@media (prefers-reduced-motion: reduce){.b9-tile-drift{animation:none}}
@media (hover: none), (max-width: 767px){.b9-tile-drift{animation:none}}
`;

/** Nạp CSS trôi nhẹ của ô hoạ tiết một lần vào trang (web). */
function ensureTileCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById('b9-tile-css')) return;
  const el = document.createElement('style');
  el.id = 'b9-tile-css';
  el.textContent = TILE_CSS;
  document.head.appendChild(el);
}

/** Trộn hai màu hex theo tỉ lệ t (0 là màu a, 1 là màu b). */
function mix(a: string, b: string, t: number): string {
  const parts = (h: string): [number, number, number] => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [ar, ag, ab] = parts(a);
  const [br, bg, bb] = parts(b);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return '#' + ch(ar, br) + ch(ag, bg) + ch(ab, bb);
}

const W = 240;
const H = 150;

type Palette = { c1: string; c2: string; c3: string; cw: string; id: string };

/** Các tia từ góc dưới trái quét từ phương thẳng đứng sang phương ngang. */
const FAN = (() => {
  let d = '';
  for (let i = 0; i < 9; i += 1) {
    const a = ((-90 + i * 11.25) * Math.PI) / 180;
    d += ` M0 ${H} L${(Math.cos(a) * 400).toFixed(1)} ${(H + Math.sin(a) * 400).toFixed(1)}`;
  }
  return d.trim();
})();

/** Bố cục hình học theo thứ tự mảng, vẽ trong hệ toạ độ 240 × 150. */
function Art({ variant, c1, c2, c3, cw, id }: { variant: number } & Palette) {
  const f = (k: string) => `url(#${id}-${k})`;
  const defs = (
    <Defs>
      <SvgLinear id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={c1} />
        <Stop offset="1" stopColor={c3} />
      </SvgLinear>
      <SvgLinear id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={c2} />
        <Stop offset="1" stopColor={c3} />
      </SvgLinear>
      <SvgLinear id={`${id}-w`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={cw} />
        <Stop offset="1" stopColor={c1} />
      </SvgLinear>
      <SvgLinear id={`${id}-d`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={c1} />
        <Stop offset="1" stopColor={c2} />
      </SvgLinear>
      <SvgLinear id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={c3} />
        <Stop offset="1" stopColor={c2} />
      </SvgLinear>
      <Pattern id={`${id}-dots`} width={7} height={7} patternUnits="userSpaceOnUse">
        <Circle cx={3.5} cy={3.5} r={1.1} fill={cw} />
      </Pattern>
    </Defs>
  );

  let body: React.ReactNode;
  switch (variant % 8) {
    case 0:
      // Vòm kép trắng và tối, khối tròn gradient, vòng kem, chấm halftone góc trên phải.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={f('b')} />
          <Path d="M20 150 V58 A44 44 0 0 1 108 58 V150 Z" fill={f('w')} />
          <Path d="M42 150 V76 A22 22 0 0 1 86 76 V150 Z" fill={c3} opacity={0.92} />
          <Circle cx={180} cy={112} r={44} fill={f('a')} />
          <Circle cx={198} cy={30} r={24} fill="none" stroke={cw} strokeWidth={6} opacity={0.9} />
          <Circle cx={34} cy={28} r={5} fill={cw} />
          <Rect x={128} y={0} width={112} height={56} fill={f('dots')} opacity={0.6} />
        </>
      );
      break;
    case 1:
      // Lưới ô vuông ba hàng bốn cột đổi màu theo đường chéo, một vầng tròn ở góc dưới phải.
      body = (
        <>
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => {
              const k = (r + c) % 3;
              const fill = k === 0 ? c1 : k === 1 ? c3 : c2;
              return <Rect key={`${r}-${c}`} x={c * 60} y={r * 50} width={60} height={50} fill={fill} />;
            }),
          )}
          <Circle cx={240} cy={150} r={70} fill={cw} opacity={0.9} />
        </>
      );
      break;
    case 2:
      // Hai viên thuốc lệch trái, một khối đứng bo tròn bên phải, nửa vòng nhỏ góc dưới.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={f('c')} />
          <Rect x={0} y={18} width={124} height={40} rx={20} fill={f('w')} />
          <Rect x={0} y={74} width={110} height={40} rx={20} fill={f('d')} />
          <Rect x={130} y={0} width={110} height={H} rx={55} fill={f('a')} />
          <Rect x={130} y={0} width={110} height={H} rx={55} fill={f('dots')} opacity={0.35} />
          <Path d="M0 150 A40 40 0 0 1 40 110 V150 Z" fill={cw} opacity={0.85} />
        </>
      );
      break;
    case 3:
      // Năm cột bo tròn như cột sóng, một vầng tròn kem, dải halftone trên cùng.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={c2} />
          <Rect x={0} y={0} width={W} height={56} fill={f('dots')} opacity={0.7} />
          <Circle cx={54} cy={34} r={14} fill={cw} />
          {[
            [14, 96],
            [60, 58],
            [106, 120],
            [152, 74],
            [198, 104],
          ].map(([x, h = 0], i) => (
            <Rect key={x} x={x} y={H - h - 8} width={28} height={h} rx={14} fill={i % 2 ? f('a') : f('w')} />
          ))}
        </>
      );
      break;
    case 4:
      // Cung đồng tâm mọc từ mép dưới, vòng viền nhỏ góc trên trái, halftone nhẹ.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={c3} />
          <Circle cx={120} cy={H} r={112} fill={f('a')} />
          <Circle cx={120} cy={H} r={88} fill={c2} />
          <Circle cx={120} cy={H} r={66} fill={cw} opacity={0.9} />
          <Circle cx={120} cy={H} r={44} fill={c1} />
          <Circle cx={120} cy={H} r={22} fill={c3} />
          <Circle cx={36} cy={32} r={22} fill="none" stroke={cw} strokeWidth={4} />
          <Rect x={0} y={0} width={W} height={H} fill={f('dots')} opacity={0.25} />
        </>
      );
      break;
    case 6:
      // Tia loé toả từ góc dưới trái, một sao nhỏ và một khối tròn tối.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={c2} />
          <Path d={FAN} stroke={cw} strokeWidth={2.5} fill="none" opacity={0.85} />
          <Path d="M180 22 C182 34 186 38 198 40 C186 42 182 46 180 58 C178 46 174 42 162 40 C174 38 178 34 180 22 Z" fill={cw} />
          <Circle cx={60} cy={70} r={30} fill={c3} />
        </>
      );
      break;
    case 7:
      // Hai cung góc phần tư lồng vào nhau, một dải tối và một vầng kem nhỏ.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={c1} />
          <Path d="M0 150 A150 150 0 0 1 150 0 L150 150 Z" fill={f('a')} />
          <Path d="M60 150 A90 90 0 0 1 150 60 L150 150 Z" fill={c3} />
          <Path d="M110 150 A40 40 0 0 1 150 110 L150 150 Z" fill={cw} />
          <Circle cx={200} cy={40} r={18} fill={c2} />
        </>
      );
      break;
    default:
      // Hai tam giác đối nhau, một cung góc phần tư trắng, một vầng tròn nhỏ và halftone.
      body = (
        <>
          <Rect x={0} y={0} width={W} height={H} fill={c1} />
          <Path d="M0 0 H128 L0 150 Z" fill={c3} />
          <Path d="M128 0 H240 V150 Z" fill={f('b')} />
          <Path d="M128 150 A112 112 0 0 1 240 38 V150 Z" fill={cw} opacity={0.85} />
          <Circle cx={62} cy={104} r={16} fill={cw} />
          <Rect x={128} y={0} width={112} height={H} fill={f('dots')} opacity={0.35} />
        </>
      );
  }

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      {defs}
      {body}
    </Svg>
  );
}

/** Ô hoạ tiết lấp đầy vùng đầu của thẻ mảng học, cùng bảng màu suy ra từ thẻ. */
export function AreaArt({ tone, variant }: { tone: readonly string[]; variant: number }) {
  useEffect(() => {
    ensureTileCss();
  }, []);

  const light = tone[0] ?? '#8B6CF0';
  const deep = tone[1] ?? '#6A4BD9';
  const palette: Palette = {
    c1: light,
    c2: mix(light, deep, 0.5),
    c3: deep,
    cw: '#FFF6F0',
    id: 'tile-' + (variant % 8) + '-' + (light + deep).replace(/[^a-zA-Z0-9]/g, ''),
  };

  return (
    <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, borderRadius: 18, overflow: 'hidden' }}>
      <View className="b9-tile-drift" style={StyleSheet.absoluteFill}>
        <Art variant={variant} {...palette} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', right: '8%', bottom: '10%' }}>
        <GlassSphere color={light} size={40} />
      </View>
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFill, backgroundImage: GRAIN } as never} />
    </View>
  );
}
