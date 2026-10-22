import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinear,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { readingFont } from '@/lib/readingFonts';

/**
 * THẺ CHỌN CẤP ĐỘ của một bộ từ. Mỗi cấp là MỘT CẢNH có chủ thể lớn (hero) và các vật nhỏ
 * (vệ tinh) xếp lệch nhau, nối với hero bằng nét chấm. Nền chung là lưới chấm và một dải
 * sóng chạy xuyên cảnh để các phần liền một mạch. Toàn bộ vẽ bằng SVG gốc của app.
 *
 * Khung vẽ 400×240, cắt kiểu `slice`. Chữ nằm ở góc dưới bên trái, nên chủ thể nằm bên phải
 * và các chi tiết trái-dưới được giữ mờ hơn.
 *
 * Thêm một cấp: thêm một mục vào `ART` (màu nền, nhãn và hàm vẽ cảnh).
 */

type Node = React.ReactElement;

type Art = {
  colors: readonly [string, string, string];
  tag: { vi: string; en: string };
  render: () => Node;
};

const VIEW = '0 0 400 240';

/** Ngôi sao bốn cánh cong: điểm nhấn lấp lánh. */
function sparkle(k: string, x: number, y: number, s: number, fill: string, op = 1): Node {
  const w = s * 0.2;
  return (
    <Path
      key={k}
      d={`M${x} ${y - s} Q${x + w} ${y - w} ${x + s} ${y} Q${x + w} ${y + w} ${x} ${y + s} Q${x - w} ${y + w} ${x - s} ${y} Q${x - w} ${y - w} ${x} ${y - s} Z`}
      fill={fill}
      opacity={op}
    />
  );
}

/** Lưới chấm đều: họa tiết nền của cả thẻ. */
function dots(k: string, x0: number, y0: number, cols: number, rows: number, gap: number, r: number, fill: string, op: number): Node[] {
  const out: Node[] = [];
  for (let c = 0; c < cols; c++) {
    for (let j = 0; j < rows; j++) out.push(<Circle key={`${k}-${c}-${j}`} cx={x0 + c * gap} cy={y0 + j * gap} r={r} fill={fill} opacity={op} />);
  }
  return out;
}

/** Tia đều quanh một tâm. */
function rays(k: string, cx: number, cy: number, n: number, r1: number, r2: number, stroke: string, op: number): Node[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const d = `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`;
    return <Path key={`${k}-${i}`} d={d} stroke={stroke} strokeWidth={1.6} strokeLinecap="round" opacity={op} />;
  });
}

/** Cánh hoa xếp vòng quanh một tâm. */
function petals(k: string, cx: number, cy: number, r: number, n: number, fill: string, op: number): Node[] {
  return Array.from({ length: n }, (_, i) => (
    <Ellipse
      key={`${k}-${i}`}
      cx={cx}
      cy={cy - r * 0.5}
      rx={r * 0.3}
      ry={r * 0.5}
      fill={fill}
      opacity={op}
      transform={`rotate(${(360 / n) * i} ${cx} ${cy})`}
    />
  ));
}

/** Nét đứt nối hai vật: sợi dây liên kết các phần của cảnh. */
function link(k: string, d: string, op = 0.6): Node {
  return <Path key={k} d={d} fill="none" stroke="#FFFFFF" strokeOpacity={op} strokeWidth={1.1} strokeDasharray="3 4" strokeLinecap="round" />;
}

/** Sợi gạch chéo 45°, dùng bên trong một hình (đặt trong G có clipPath). */
function hatch(k: string, x0: number, x1: number, y0: number, y1: number, step: number, stroke: string, op: number): Node[] {
  const out: Node[] = [];
  for (let x = x0 - (y1 - y0); x <= x1; x += step) {
    out.push(<Path key={`${k}-${x}`} d={`M${x} ${y0} L${x + (y1 - y0)} ${y1}`} stroke={stroke} strokeWidth={0.8} opacity={op} />);
  }
  return out;
}

/** Dải sóng mảnh chạy xuyên cảnh: sợi chỉ nối mọi thứ lại. */
function wave(k: string, d: string, stroke: string, op: number, w = 1.2): Node {
  return <Path key={k} d={d} fill="none" stroke={stroke} strokeOpacity={op} strokeWidth={w} strokeLinecap="round" />;
}

/** Các hạt confetti rải theo danh sách cố định (không ngẫu nhiên để không đổi khi tải lại). */
function confetti(k: string, items: readonly (readonly [number, number, string])[]): Node[] {
  return items.map(([x, y, c], i) =>
    i % 3 === 0 ? (
      <Rect key={`${k}-${i}`} x={x} y={y} width={7} height={3} rx={1} fill={c} opacity={0.9} transform={`rotate(${(i * 37) % 90} ${x} ${y})`} />
    ) : (
      <Circle key={`${k}-${i}`} cx={x} cy={y} r={2.2} fill={c} opacity={0.85} />
    ),
  );
}

const ART: Record<string, Art> = {
  all: {
    colors: ['#1B1640', '#3A2590', '#7B5CFF'],
    tag: { vi: 'Tổng hợp', en: 'Everything' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="all-sun" cx="40%" cy="35%" r="65%">
            <Stop offset="0" stopColor="#FFFBE6" />
            <Stop offset="0.5" stopColor="#FFD56B" />
            <Stop offset="1" stopColor="#F59A3D" />
          </RadialGradient>
          <ClipPath id="all-clip">
            <Circle cx={262} cy={122} r={58} />
          </ClipPath>
        </Defs>
        {dots('all-d', 14, 14, 20, 15, 20, 1, '#FFFFFF', 0.12)}
        <Ellipse cx={262} cy={122} rx={116} ry={38} fill="none" stroke="#FFE9A8" strokeOpacity={0.4} strokeWidth={1} transform="rotate(-14 262 122)" />
        <Ellipse cx={262} cy={122} rx={84} ry={26} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="2 4" transform="rotate(-14 262 122)" />
        {rays('all-ray', 262, 122, 36, 64, 76, '#FFE9A8', 0.35)}
        <Circle cx={262} cy={122} r={58} fill="url(#all-sun)" />
        <G clipPath="url(#all-clip)">{hatch('all-h', 200, 330, 60, 190, 7, '#FFFFFF', 0.2)}</G>
        <Circle cx={262} cy={122} r={58} fill="none" stroke="#FFF6C2" strokeOpacity={0.6} strokeWidth={1} />
        <Circle cx={374} cy={94} r={6} fill="#FFB3E6" />
        <Circle cx={150} cy={150} r={10} fill="#8EE3C0" />
        <Ellipse cx={150} cy={150} rx={18} ry={5} fill="none" stroke="#8EE3C0" strokeOpacity={0.8} strokeWidth={1.2} transform="rotate(-18 150 150)" />
        <Circle cx={116} cy={62} r={4} fill="#FFFFFF" />
        {link('all-l1', 'M150 150 Q196 160 204 124', 0.7)}
        {link('all-l2', 'M116 62 Q160 30 204 96', 0.6)}
        {link('all-l3', 'M374 94 Q336 116 320 122', 0.5)}
        {sparkle('all-s1', 44, 40, 9, '#FFFFFF', 0.95)}
        {sparkle('all-s2', 88, 196, 6, '#FFE9A8', 0.9)}
        {sparkle('all-s3', 340, 200, 8, '#FFFFFF', 0.85)}
        {sparkle('all-s4', 356, 30, 5, '#FFE9A8', 0.9)}
        {wave('all-w', 'M0 222 C90 198 150 232 220 212 S340 192 400 214', '#FFFFFF', 0.28)}
        {confetti('all-c', [[30, 120, '#FFE9A8'], [72, 92, '#FFFFFF'], [300, 60, '#8EE3C0'], [384, 150, '#FFE9A8']])}
      </Svg>
    ),
  },
  A1: {
    colors: ['#0B4D3B', '#1E9E74', '#8EE3C0'],
    tag: { vi: 'Cấp A1', en: 'Level A1' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinear id="a1-h1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3CC48F" />
            <Stop offset="1" stopColor="#0F6B50" />
          </SvgLinear>
          <SvgLinear id="a1-h2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1E9E74" />
            <Stop offset="1" stopColor="#0B4D3B" />
          </SvgLinear>
          <RadialGradient id="a1-can" cx="38%" cy="32%" r="70%">
            <Stop offset="0" stopColor="#7BE3B5" />
            <Stop offset="1" stopColor="#0F6B50" />
          </RadialGradient>
        </Defs>
        {dots('a1-d', 16, 18, 16, 12, 24, 1.2, '#FFFFFF', 0.12)}
        <Circle cx={72} cy={54} r={28} fill="#FFF6C2" opacity={0.18} />
        <Circle cx={72} cy={54} r={17} fill="#FFF6C2" />
        {rays('a1-ray', 72, 54, 12, 22, 30, '#FFF6C2', 0.55)}
        <Path d="M146 36 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
        <Path d="M170 26 q4 -4 8 0 q4 -4 8 0" fill="none" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" opacity={0.7} />
        {link('a1-l1', 'M96 60 Q176 16 214 62', 0.55)}
        {/* Đồi nhiều lớp */}
        <Path d="M0 158 C70 120 130 140 190 154 S300 126 400 150 V240 H0 Z" fill="url(#a1-h1)" opacity={0.9} />
        {wave('a1-c1', 'M0 170 C90 142 160 160 240 150 S340 138 400 156', '#FFFFFF', 0.2)}
        {wave('a1-c2', 'M0 186 C100 162 170 180 260 170 S350 160 400 178', '#FFFFFF', 0.18)}
        <Path d="M0 196 C80 176 150 192 220 190 S340 178 400 194 V240 H0 Z" fill="url(#a1-h2)" />
        {/* Cây lớn: hero */}
        <Path d="M250 240 C247 206 252 180 256 164 L268 164 C272 180 277 206 274 240 Z" fill="#5B3A21" />
        <Path d="M262 170 C254 176 250 186 248 196" fill="none" stroke="#5B3A21" strokeWidth={3} strokeLinecap="round" />
        <Circle cx={262} cy={122} r={70} fill="#0B4D3B" opacity={0.45} />
        <Circle cx={262} cy={110} r={36} fill="url(#a1-can)" />
        <Circle cx={230} cy={128} r={26} fill="url(#a1-can)" />
        <Circle cx={296} cy={126} r={26} fill="url(#a1-can)" />
        <Circle cx={246} cy={88} r={22} fill="url(#a1-can)" />
        <Circle cx={284} cy={88} r={22} fill="url(#a1-can)" />
        <Circle cx={262} cy={146} r={20} fill="#1E9E74" />
        {dots('a1-leaf', 236, 92, 6, 5, 12, 1.4, '#FFFFFF', 0.35)}
        <Circle cx={250} cy={84} r={6} fill="#FFFFFF" opacity={0.35} />
        {/* Nhà nhỏ: vệ tinh */}
        <Rect x={104} y={184} width={34} height={28} fill="#FFE9C2" />
        <Polygon points="98,186 121,162 144,186" fill="#C2553A" />
        <Rect x={116} y={196} width={9} height={16} fill="#5B3A21" />
        <Rect x={126} y={192} width={8} height={8} fill="#7BE3B5" />
        {link('a1-l2', 'M140 200 Q196 212 228 186', 0.6)}
        {/* Hoa, cỏ, chim */}
        {petals('a1-f1', 42, 220, 9, 5, '#FFE9A8', 0.95)}
        <Circle cx={42} cy={220} r={3} fill="#FFB347" />
        {petals('a1-f2', 350, 226, 8, 5, '#FFB3E6', 0.95)}
        <Circle cx={350} cy={226} r={2.6} fill="#FFE9A8" />
        {[30, 66, 176, 210, 302, 336, 372].map((x, i) => (
          <Path key={`a1-tuft${i}`} d={`M${x} 236 l-3 -8 M${x} 236 l0 -11 M${x} 236 l3 -8`} stroke="#0B4D3B" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        ))}
        {sparkle('a1-s1', 368, 60, 6, '#FFFFFF', 0.9)}
      </Svg>
    ),
  },
  A2: {
    colors: ['#7A2121', '#E0583A', '#FFB48A'],
    tag: { vi: 'Cấp A2', en: 'Level A2' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="a2-sun" cx="50%" cy="40%" r="60%">
            <Stop offset="0" stopColor="#FFF1D6" />
            <Stop offset="1" stopColor="#FFB48A" />
          </RadialGradient>
          <ClipPath id="a2-sunclip">
            <Circle cx={250} cy={150} r={74} />
          </ClipPath>
          <ClipPath id="a2-pyr">
            <Polygon points="30,196 110,76 190,196" />
          </ClipPath>
        </Defs>
        {dots('a2-d', 18, 18, 14, 9, 26, 1.2, '#FFE2B8', 0.18)}
        {rays('a2-ray', 250, 150, 22, 80, 96, '#FFE2B8', 0.4)}
        <Circle cx={250} cy={150} r={74} fill="url(#a2-sun)" />
        <G clipPath="url(#a2-sunclip)">
          {[118, 132, 146, 160, 174].map((y, i) => (
            <Rect key={`a2-band${i}`} x={170} y={y} width={170} height={3.2 + i * 0.6} fill="#E0583A" opacity={0.35 + i * 0.07} />
          ))}
        </G>
        {/* Kim tự tháp chính: hero bên trái */}
        <Polygon points="30,196 110,76 190,196" fill="#8A2B2B" opacity={0.9} />
        <Polygon points="110,76 150,196 190,196" fill="#5E1C1C" opacity={0.6} />
        <G clipPath="url(#a2-pyr)">{hatch('a2-h', 20, 200, 70, 200, 6, '#FFD9C2', 0.22)}</G>
        <Path d="M110 76 L110 196" stroke="#FFD9C2" strokeOpacity={0.35} strokeWidth={1} />
        {/* Tháp nhỏ và xương rồng */}
        <Polygon points="236,196 270,128 304,196" fill="#6B1F1F" opacity={0.8} />
        <Polygon points="270,128 288,196 304,196" fill="#4A1414" opacity={0.5} />
        <Rect x={354} y={148} width={11} height={52} rx={5.5} fill="#2E7D5B" />
        <Path d="M354 176 H340 V158" stroke="#2E7D5B" strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d="M365 180 H378 V166" stroke="#2E7D5B" strokeWidth={7} strokeLinecap="round" fill="none" />
        {link('a2-l1', 'M108 80 Q146 56 180 110', 0.6)}
        {link('a2-l2', 'M304 128 Q322 118 340 146', 0.5)}
        {/* Cồn cát nhiều lớp */}
        <Path d="M0 186 C90 160 160 184 230 176 S350 158 400 172 V240 H0 Z" fill="#C2553A" opacity={0.92} />
        {wave('a2-c1', 'M0 170 C110 146 190 168 270 160 S360 150 400 160', '#FFD9C2', 0.2)}
        <Path d="M0 210 C100 196 190 214 280 204 S370 200 400 206 V240 H0 Z" fill="#9E3E28" opacity={0.9} />
        {wave('a2-c2', 'M0 224 C110 212 200 228 300 220 S380 214 400 218', '#FFD9C2', 0.25)}
        {dots('a2-sand', 24, 230, 16, 1, 22, 1.4, '#FFE2B8', 0.45)}
        {/* Chim và sao */}
        <Path d="M46 50 q6 -5 12 0 q6 -5 12 0" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
        {sparkle('a2-s1', 336, 40, 7, '#FFFFFF', 0.9)}
        {sparkle('a2-s2', 96, 34, 4, '#FFE2B8', 0.9)}
        {confetti('a2-c', [[320, 110, '#FFE2B8'], [40, 150, '#FFB48A'], [206, 60, '#FFFFFF']])}
      </Svg>
    ),
  },
  B1: {
    colors: ['#0B2447', '#2F6FB8', '#7FC4F2'],
    tag: { vi: 'Cấp B1', en: 'Level B1' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <ClipPath id="b1-arch">
            <Path d="M170 240 V110 A80 80 0 0 1 330 110 V240 Z" />
          </ClipPath>
        </Defs>
        {dots('b1-d', 14, 14, 20, 15, 20, 1, '#7FC4F2', 0.18)}
        {/* Vòm lớn: hero */}
        <Path d="M170 240 V110 A80 80 0 0 1 330 110 V240 Z" fill="#0A2340" opacity={0.9} />
        <G clipPath="url(#b1-arch)">
          {Array.from({ length: 9 }, (_, i) => (
            <Path key={`b1-v${i}`} d={`M${178 + i * 18} 60 V240`} stroke="#7FC4F2" strokeOpacity={0.14} strokeWidth={1} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <Path key={`b1-h${i}`} d={`M160 ${120 + i * 18} H340`} stroke="#7FC4F2" strokeOpacity={0.14} strokeWidth={1} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <Polygon key={`b1-dm${i}`} points={`${186 + i * 22},${150 + (i % 2) * 18} ${190 + i * 22},${154 + (i % 2) * 18} ${186 + i * 22},${158 + (i % 2) * 18} ${182 + i * 22},${154 + (i % 2) * 18}`} fill="#7FC4F2" opacity={0.5} />
          ))}
        </G>
        <Path d="M180 240 V110 A70 70 0 0 1 320 110 V240" fill="none" stroke="#7FC4F2" strokeOpacity={0.5} strokeWidth={1.2} />
        <Path d="M234 240 V208 A16 16 0 0 1 266 208 V240 Z" fill="#061427" />
        <Path d="M246 150 A10 10 0 0 1 254 150 V168 H246 Z" fill="#FFD56B" opacity={0.8} />
        {/* Đèn lồng treo bên phải vòm */}
        <Path d="M358 0 V30" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1} />
        <Ellipse cx={358} cy={44} rx={11} ry={14} fill="#FFD56B" />
        <Ellipse cx={358} cy={44} rx={5} ry={14} fill="#FFF6C2" opacity={0.7} />
        {/* Trăng lưỡi liềm: vệ tinh */}
        <Path d="M92 44 A30 30 0 1 0 92 104 A24 24 0 1 1 92 44 Z" fill="#E6F2FF" />
        {link('b1-l1', 'M118 74 Q140 110 170 124', 0.55)}
        {/* Chòm sao nối chấm */}
        {link('b1-c1', 'M36 150 L64 128 L92 150 L120 118', 0.5)}
        {[[36, 150], [64, 128], [92, 150], [120, 118]].map(([x, y], i) => (
          <Circle key={`b1-cp${i}`} cx={x} cy={y} r={2.2} fill="#FFFFFF" opacity={0.9} />
        ))}
        {sparkle('b1-s1', 56, 52, 7, '#FFFFFF', 0.9)}
        {sparkle('b1-s2', 384, 150, 5, '#FFFFFF', 0.85)}
        {/* Bậc thềm dưới cùng */}
        <Polygon points="0,240 0,206 30,206 30,190 60,190 60,240" fill="#2F6FB8" opacity={0.9} />
        <Polygon points="350,240 350,174 378,174 378,150 400,150 400,240" fill="#2F6FB8" opacity={0.7} />
        {wave('b1-w', 'M0 224 C90 210 150 230 230 220 S340 210 400 222', '#7FC4F2', 0.35)}
      </Svg>
    ),
  },
  B2: {
    colors: ['#0E4F4A', '#1FA89A', '#F4A6C6'],
    tag: { vi: 'Cấp B2', en: 'Level B2' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <ClipPath id="b2-tri">
            <Polygon points="250,20 166,222 334,222" />
          </ClipPath>
        </Defs>
        {dots('b2-d', 18, 20, 16, 6, 24, 1.4, '#FFFFFF', 0.2)}
        {/* Tam giác hồng lớn: hero, chia mảnh */}
        <Polygon points="250,20 166,222 334,222" fill="#F4A6C6" />
        <Polygon points="250,20 334,222 250,222" fill="#E88BB0" opacity={0.85} />
        <G clipPath="url(#b2-tri)">
          {hatch('b2-h', 150, 340, 20, 222, 10, '#FFFFFF', 0.22)}
        </G>
        <Path d="M250 20 L208 122 L292 122 Z" fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
        <Path d="M208 122 L166 222 M292 122 L334 222 M190 172 H310" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={1} />
        {/* Vòm vệ tinh bên trái */}
        <Path d="M26 240 V150 A38 38 0 0 1 102 150 V240 Z" fill="#14786F" />
        <Path d="M46 240 V156 A18 18 0 0 1 82 156 V240 Z" fill="#1FA89A" opacity={0.92} />
        <Path d="M60 240 V180 A4 4 0 0 1 68 180 V240 Z" fill="#0E4F4A" opacity={0.7} />
        {link('b2-l1', 'M102 150 Q150 96 200 124', 0.6)}
        {/* Hoa bốn tầng: vệ tinh bên phải */}
        {petals('b2-p', 350, 64, 24, 8, '#FFE9A8', 0.95)}
        <Circle cx={350} cy={64} r={10} fill="#1FA89A" />
        <Circle cx={346} cy={60} r={3} fill="#FFFFFF" opacity={0.6} />
        {link('b2-l2', 'M320 90 Q300 120 292 140', 0.5)}
        {/* Hàng khảm tam giác đáy */}
        {Array.from({ length: 16 }, (_, i) => (
          <Polygon key={`b2-t${i}`} points={`${i * 26},240 ${i * 26 + 26},240 ${i * 26 + 13},222`} fill={i % 2 ? '#F4A6C6' : '#FFE9A8'} opacity={0.45} />
        ))}
        {sparkle('b2-s1', 44, 64, 6, '#FFFFFF', 0.9)}
        {sparkle('b2-s2', 372, 170, 5, '#FFE9A8', 0.9)}
        {wave('b2-w', 'M0 206 C90 190 150 212 230 200 S340 188 400 204', '#FFFFFF', 0.3)}
      </Svg>
    ),
  },
  C1: {
    colors: ['#B8175A', '#F0703F', '#FFC24A'],
    tag: { vi: 'Cấp C1', en: 'Level C1' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        {/* Dây cờ nối toàn cảnh */}
        <Path d="M0 40 Q200 80 400 30" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.2} />
        {[
          [40, 47, '#FFE9A8'],
          [100, 54, '#FFFFFF'],
          [160, 58, '#FF9EC8'],
          [220, 57, '#8EE3C0'],
          [280, 52, '#FFE9A8'],
          [340, 43, '#FFFFFF'],
        ].map(([x, y, c], i) => (
          <Polygon key={`c1-f${i}`} points={`${Number(x) - 11},${y} ${Number(x) + 11},${y} ${x},${Number(y) + 20}`} fill={String(c)} opacity={0.92} />
        ))}
        {/* Chùm tia sao: hero */}
        <Circle cx={236} cy={124} r={104} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 5" />
        {rays('c1-ray', 236, 124, 28, 86, 100, '#FFFFFF', 0.45)}
        {sparkle('c1-big', 236, 124, 64, '#FFFFFF', 0.95)}
        {sparkle('c1-mid', 236, 124, 36, '#FFE9A8', 0.9)}
        {sparkle('c1-core', 236, 124, 14, '#B8175A', 0.7)}
        {/* Bóng bay: vệ tinh */}
        {[
          [334, 138, '#FF9EC8', 16, 20, 158, 196],
          [374, 176, '#8EE3C0', 13, 17, 194, 224],
          [302, 206, '#FFE9A8', 12, 16, 222, 236],
        ].map(([x, y, c, rx, ry, sy, ey], i) => (
          <G key={`c1-b${i}`}>
            <Path d={`M${x} ${sy} Q${Number(x) + 8} ${Number(sy) + 14} ${x} ${ey}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1} />
            <Ellipse cx={Number(x)} cy={Number(y)} rx={Number(rx)} ry={Number(ry)} fill={String(c)} />
            <Ellipse cx={Number(x) - 5} cy={Number(y) - 6} rx={3} ry={5} fill="#FFFFFF" opacity={0.5} />
          </G>
        ))}
        {link('c1-l1', 'M330 158 Q290 150 268 134', 0.5)}
        {wave('c1-w1', 'M0 170 C90 140 150 196 230 170 S340 140 400 166', '#FFFFFF', 0.45, 2.4)}
        {wave('c1-w2', 'M0 196 C100 170 170 220 250 196 S350 170 400 200', '#FFE9A8', 0.5, 1.8)}
        {dots('c1-d', 18, 214, 9, 2, 14, 1.5, '#FFFFFF', 0.5)}
        {sparkle('c1-s1', 370, 76, 8, '#FFFFFF', 0.9)}
        {sparkle('c1-s2', 364, 196, 6, '#FFE9A8', 0.9)}
        {confetti('c1-c', [[170, 96, '#FFE9A8'], [312, 96, '#FFFFFF'], [148, 214, '#FFFFFF'], [380, 118, '#FFE9A8'], [268, 226, '#FF9EC8'], [208, 214, '#FFFFFF']])}
      </Svg>
    ),
  },
  C2: {
    colors: ['#12062A', '#3B1690', '#A02BE6'],
    tag: { vi: 'Cấp C2', en: 'Level C2' },
    render: () => (
      <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinear id="c2-sun" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD56B" />
            <Stop offset="1" stopColor="#FF4FD8" />
          </SvgLinear>
          <ClipPath id="c2-sunclip">
            <Circle cx={200} cy={92} r={52} />
          </ClipPath>
        </Defs>
        {/* Mặt trời neon: hero */}
        <Circle cx={200} cy={92} r={52} fill="url(#c2-sun)" opacity={0.9} />
        <G clipPath="url(#c2-sunclip)">
          {[84, 96, 108].map((y, i) => (
            <Rect key={`c2-band${i}`} x={140} y={y} width={120} height={4 + i} fill="#12062A" opacity={0.55} />
          ))}
        </G>
        <Circle cx={200} cy={92} r={58} fill="none" stroke="#FF4FD8" strokeOpacity={0.4} strokeWidth={3} />
        {/* Đường chân trời và lưới sàn */}
        <Rect x={0} y={150} width={400} height={3} fill="#FF4FD8" opacity={0.6} />
        {[-140, -80, -20, 40, 100, 160, 220, 280, 340, 400, 460].map((x, i) => (
          <Path key={`c2-v${i}`} d={`M${x} 240 L${200 + (x - 200) * 0.2} 153`} stroke="#00E5FF" strokeOpacity={0.35} strokeWidth={1} />
        ))}
        {[168, 186, 210, 236].map((y, i) => (
          <Path key={`c2-h${i}`} d={`M0 ${y} H400`} stroke="#FF4FD8" strokeOpacity={0.45 - i * 0.07} strokeWidth={1.1} />
        ))}
        {/* Dãy nhà neon: hero thứ hai dưới mặt trời */}
        {[
          [126, 40, 116],
          [160, 60, 96],
          [204, 36, 120],
          [240, 52, 104],
          [282, 30, 126],
        ].map(([x, w, h], i) => (
          <G key={`c2-b${i}`}>
            <Rect x={Number(x)} y={240 - Number(h)} width={Number(w)} height={Number(h)} fill="#1B0B3F" opacity={0.92} />
            <Rect x={Number(x)} y={240 - Number(h)} width={Number(w)} height={Number(h)} fill="none" stroke="#00E5FF" strokeOpacity={0.25} strokeWidth={5} />
            <Rect x={Number(x)} y={240 - Number(h)} width={Number(w)} height={Number(h)} fill="none" stroke="#00E5FF" strokeOpacity={0.95} strokeWidth={1.2} />
            {[0, 1, 2].map((r) =>
              [0, 1].map((c) => (
                <Rect
                  key={`c2-w${i}-${r}-${c}`}
                  x={Number(x) + 8 + c * 14}
                  y={240 - Number(h) + 10 + r * 16}
                  width={6}
                  height={8}
                  fill="#FFD56B"
                  opacity={((i + r + c) % 3) === 0 ? 0.9 : 0.25}
                />
              )),
            )}
          </G>
        ))}
        {/* Vệ tinh: bánh răng neon, tam giác, sao */}
        <Circle cx={60} cy={70} r={26} fill="none" stroke="#00E5FF" strokeWidth={2.5} strokeDasharray="6 6" />
        <Circle cx={60} cy={70} r={11} fill="#00E5FF" opacity={0.85} />
        <Circle cx={60} cy={70} r={4} fill="#12062A" />
        <Polygon points="344,40 372,88 316,88" fill="none" stroke="#FF4FD8" strokeWidth={2} />
        <Polygon points="344,58 360,84 328,84" fill="#FF4FD8" opacity={0.5} />
        {link('c2-l1', 'M86 70 Q130 60 152 84', 0.7)}
        {link('c2-l2', 'M316 70 Q272 56 250 74', 0.6)}
        {sparkle('c2-s1', 40, 170, 6, '#00E5FF', 0.9)}
        {sparkle('c2-s2', 372, 150, 7, '#FF4FD8', 0.95)}
        <Rect x={0} y={112} width={400} height={1.5} fill="#00E5FF" opacity={0.35} />
      </Svg>
    ),
  },
};

/** Cấp C của ngữ pháp dùng chung tranh C2. */
ART.C = ART.C2!;

const FALLBACK = ART.all!;

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

/** Ngoặc góc vàng nhạt: nét trang trí cho khung thẻ. */
function cornerStyle(c: (typeof CORNERS)[number]) {
  const top = c[0] === 't';
  const left = c[1] === 'l';
  return {
    position: 'absolute' as const,
    width: 16,
    height: 16,
    top: top ? 4 : undefined,
    bottom: top ? undefined : 4,
    left: left ? 4 : undefined,
    right: left ? undefined : 4,
    borderTopWidth: top ? 2 : 0,
    borderBottomWidth: top ? 0 : 2,
    borderLeftWidth: left ? 2 : 0,
    borderRightWidth: left ? 0 : 2,
    borderColor: '#FFE9A8',
    opacity: 0.85,
  };
}

export function LevelCard({
  lv,
  title,
  sub,
  en,
  selected = false,
  onPress,
}: {
  lv: string;
  title: string;
  sub: string;
  en: boolean;
  selected?: boolean;
  onPress: () => void;
}) {
  const art = ART[lv] ?? FALLBACK;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexGrow: 1,
        flexBasis: Platform.OS === 'web' ? 280 : '100%',
        minHeight: 240,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.28)',
        transform: hovered ? [{ translateY: -3 }] : [],
        ...(Platform.OS === 'web'
          ? {
              boxShadow: hovered ? '0 26px 44px -20px rgba(30,16,70,0.6)' : '0 16px 34px -20px rgba(30,16,70,0.5)',
              transition: 'transform 180ms ease, box-shadow 180ms ease',
            }
          : {}),
      } as object)}
    >
      <LinearGradient colors={art.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        {art.render()}
      </View>
      {/* Ánh sáng chéo từ góc trên trái: làm mặt thẻ như kính. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.9 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <LinearGradient colors={['rgba(10,8,30,0)', 'rgba(10,8,30,0.74)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 }} />
      {/* Khung viền mảnh và bốn góc ngoặc: dấu của thẻ sưu tập. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 10, right: 10, bottom: 10, left: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
      {CORNERS.map((c) => (
        <View key={c} pointerEvents="none" style={cornerStyle(c)} />
      ))}
      {/* Nhãn cấp góc trên trái */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 18,
          left: 22,
          paddingHorizontal: 11,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: 'rgba(14,10,36,0.42)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.4)',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as object) : {}),
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: readingFont.sansHeavy,
            fontSize: 10.5,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {en ? art.tag.en : art.tag.vi}
        </Text>
      </View>
      {/* Huy hiệu tròn góc trên phải */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 16,
          right: 18,
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.6)',
          backgroundColor: 'rgba(14,10,36,0.4)',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as object) : {}),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M12 1 Q13.2 10.8 23 12 Q13.2 13.2 12 23 Q10.8 13.2 1 12 Q10.8 10.8 12 1 Z"
            fill="#FFE9A8"
          />
        </Svg>
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: readingFont.display,
            fontSize: 42,
            lineHeight: 46,
            letterSpacing: -0.5,
            textShadowColor: 'rgba(10,8,30,0.4)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 12,
          }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <View style={{ width: 28, height: 1.5, backgroundColor: '#FFE9A8', opacity: 0.9 }} />
          <Text style={{ color: 'rgba(255,255,255,0.94)', fontFamily: readingFont.sansSemi, fontSize: 14 }}>{sub}</Text>
        </View>
      </View>
    </Pressable>
  );
}
