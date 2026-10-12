/**
 * Hình minh hoạ retro cho bản mẫu hồ sơ: viền mực đậm, màu phẳng, cầu vồng đồng
 * tâm, nhân vật là ngôi sao vàng, hoa và trăng có mặt, mây sọc, ống nước và bánh
 * răng. Vẽ mới bằng SVG cho Band 9, không dùng hình minh hoạ hay logo của bên nào khác.
 */
import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

export const RINK = '#1F1A1D';
export const RCREAM = '#F6EEDF';
export const RCHAR = '#2B2526';
export const RGOLD = '#F2C24B';
export const RPINK = '#F27BA8';
export const RORANGE = '#F4924A';
export const RVIOLET = '#7C5CD1';
export const RNAVY = '#3B3480';
export const RPEACH = '#FBD9B0';
export const RSKY = '#5DBBE6';
export const RLEAF = '#8CC24A';
export const RPAPER = '#FFFBF2';
export const RPIPE = '#E9DCC2';

/** Tím nhạt: màu mục Quest trong điều hướng máy tính. */
export const RLAV = '#B9A6F0';

/** Các dải cầu vồng, từ ngoài vào trong. Mỗi dải có viền mực riêng. */
export const RAINBOW = [
  { c: RNAVY, w: 300 },
  { c: RVIOLET, w: 260 },
  { c: '#E0609A', w: 220 },
  { c: RPINK, w: 180 },
  { c: RORANGE, w: 140 },
  { c: RGOLD, w: 100 },
  { c: RPEACH, w: 60 },
  { c: RCREAM, w: 20 },
];

/** Viền mực quanh mỗi dải, tính theo đơn vị viewBox. Bề dày mỗi dải = (bước giảm − viền) / 2. */
const RAINBOW_OUTLINE = 6;

/**
 * Font của bản mẫu. Shrikhand (OFL, assets/fonts) chỉ có chữ Latin và số, nên
 * chỉ dùng cho chữ lớn tiếng Anh và số band. Chữ tiếng Việt dùng Nunito.
 */
export const RFONT = {
  display: 'Shrikhand_400Regular',
  heavy: 'Nunito_900Black',
  bold: 'Nunito_700Bold',
  semi: 'Nunito_600SemiBold',
};

/** Bóng chữ kiểu sọc: các lớp màu lùi dần sau chữ chính, từ xa đến gần. Lớp mực ngoài cùng tạo viền. */
export const ECHO_CREAM = [RINK, RNAVY, RVIOLET, RPINK, RORANGE, RGOLD];
export const ECHO_GOLD = [RINK, RVIOLET, RPINK, RORANGE, RPEACH];

export function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rad = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Hình đám mây dùng chung cho mây có viền và mây sọc. */
const CLOUD_D = 'M28 78 C8 78 4 52 22 46 C18 22 46 12 60 26 C70 4 108 6 112 30 C134 26 150 40 146 56 C166 60 164 78 146 78 Z';

/** Ngôi sao có mặt: nhân vật của Band 9. */
export function StarMascot({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <Polygon points={starPoints(100, 106, 92, 48)} fill={RGOLD} stroke={RINK} strokeWidth={8} strokeLinejoin="round" />
      <Ellipse cx={70} cy={116} rx={10} ry={6} fill={RPINK} />
      <Ellipse cx={130} cy={116} rx={10} ry={6} fill={RPINK} />
      <Ellipse cx={84} cy={100} rx={8} ry={11} fill={RINK} />
      <Ellipse cx={116} cy={100} rx={8} ry={11} fill={RINK} />
      <Circle cx={86.5} cy={96} r={3} fill={RCREAM} />
      <Circle cx={118.5} cy={96} r={3} fill={RCREAM} />
      <Path d="M86 124 Q100 138 114 124" fill="none" stroke={RINK} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}

/** Trăng lưỡi liềm có mặt, cắn bằng một đĩa cùng màu nền tối. */
export function Moon({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <Circle cx={50} cy={50} r={42} fill={RGOLD} stroke={RINK} strokeWidth={6} />
      <Circle cx={80} cy={38} r={34} fill={RCHAR} stroke={RINK} strokeWidth={6} />
      <Path d="M22 48 Q27 42 32 48" fill="none" stroke={RINK} strokeWidth={4} strokeLinecap="round" />
      <Path d="M38 56 Q43 50 48 56" fill="none" stroke={RINK} strokeWidth={4} strokeLinecap="round" />
      <Path d="M22 66 Q30 74 38 68" fill="none" stroke={RINK} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** Hoa tám cánh có mặt cười, thân và lá xanh. */
export function Flower({ size = 160 }: { size?: number }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg width={size} height={(size * 260) / 200} viewBox="0 0 200 260" aria-hidden>
      <Path d="M100 96 Q96 170 100 240" fill="none" stroke={RINK} strokeWidth={14} strokeLinecap="round" />
      <Path d="M100 96 Q96 170 100 240" fill="none" stroke={RLEAF} strokeWidth={6} strokeLinecap="round" />
      <Ellipse cx={70} cy={196} rx={30} ry={14} fill={RLEAF} stroke={RINK} strokeWidth={5} transform="rotate(-28 70 196)" />
      <Ellipse cx={130} cy={214} rx={30} ry={14} fill={RLEAF} stroke={RINK} strokeWidth={5} transform="rotate(28 130 214)" />
      {petals.map((a) => (
        <Ellipse key={a} cx={100} cy={70} rx={20} ry={34} fill={RPINK} stroke={RINK} strokeWidth={5} transform={`rotate(${a} 100 96)`} />
      ))}
      <Circle cx={100} cy={96} r={30} fill={RGOLD} stroke={RINK} strokeWidth={6} />
      <Ellipse cx={90} cy={90} rx={4} ry={6} fill={RINK} />
      <Ellipse cx={110} cy={90} rx={4} ry={6} fill={RINK} />
      <Path d="M90 104 Q100 112 110 104" fill="none" stroke={RINK} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** Bút chì vàng có tẩy hồng, đặt nghiêng cho có chuyển động. */
export function Pencil({ height = 150 }: { height?: number }) {
  return (
    <Svg width={(height * 80) / 300} height={height} viewBox="0 0 80 300" aria-hidden>
      <Rect x={16} y={4} width={48} height={34} rx={6} fill={RPINK} stroke={RINK} strokeWidth={6} />
      <Rect x={16} y={36} width={48} height={16} fill="#C9C2B8" stroke={RINK} strokeWidth={6} />
      <Rect x={16} y={50} width={48} height={190} fill={RGOLD} stroke={RINK} strokeWidth={6} />
      <Path d="M16 240 L64 240 L40 290 Z" fill={RCREAM} stroke={RINK} strokeWidth={6} strokeLinejoin="round" />
      <Path d="M34 270 L46 270 L40 290 Z" fill={RINK} />
    </Svg>
  );
}

/** Chớp bốn cánh, dùng rải quanh trang. */
export function Sparkle({ size = 28, color = RCREAM }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <Path
        d="M20 2 C22 14 26 18 38 20 C26 22 22 26 20 38 C18 26 14 22 2 20 C14 18 18 14 20 2 Z"
        fill={color}
        stroke={RINK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Đám mây trắng có viền. */
export function Puff({ width = 170, color = RPAPER }: { width?: number; color?: string }) {
  return (
    <Svg width={width} height={(width * 90) / 170} viewBox="0 0 170 90" aria-hidden>
      <Path d={CLOUD_D} fill={color} stroke={RINK} strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
}

/** Đám mây sọc hồng, cam, vàng, kem, như mây trong ảnh tham chiếu. `id` phải duy nhất trên trang. */
export function StripeCloud({ width = 170, id = 'a' }: { width?: number; id?: string }) {
  const bands = [RPINK, RORANGE, RGOLD, RPAPER];
  return (
    <Svg width={width} height={(width * 90) / 170} viewBox="0 0 170 90" aria-hidden>
      <Defs>
        <ClipPath id={`nb-cloud-${id}`}>
          <Path d={CLOUD_D} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#nb-cloud-${id})`}>
        {bands.map((c, i) => (
          <Rect key={i} x={0} y={i * 22} width={170} height={22} fill={c} />
        ))}
      </G>
      <Path d={CLOUD_D} fill="none" stroke={RINK} strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
}

/** Bánh răng vẽ nét, dùng nền mờ như trong ảnh tham chiếu. */
export function Gear({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <Circle cx={60} cy={60} r={46} fill="none" stroke={RINK} strokeWidth={16} strokeDasharray="13 11" />
      <Circle cx={60} cy={60} r={34} fill="none" stroke={RINK} strokeWidth={4} />
      <Circle cx={60} cy={60} r={14} fill="none" stroke={RINK} strokeWidth={4} />
    </Svg>
  );
}

/** Đoạn ống nằm ngang: viền mực dày, lòng kem nhạt. Kéo hết chiều rộng. */
export function PipeRun({ height = 44 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 1200 44" preserveAspectRatio="none" aria-hidden>
      <Path d="M0 22 H1200" stroke={RINK} strokeWidth={40} />
      <Path d="M0 22 H1200" stroke={RPIPE} strokeWidth={26} />
      <Path d="M0 15 H1200" stroke={RPAPER} strokeWidth={3} />
    </Svg>
  );
}

/** Đồng hồ áp suất gắn trên ống. */
export function Gauge({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <Circle cx={32} cy={32} r={27} fill={RPAPER} stroke={RINK} strokeWidth={5} />
      <Path d="M14 40 A20 20 0 0 1 50 40" fill="none" stroke={RGOLD} strokeWidth={6} />
      <Path d="M32 32 L44 22" stroke={RPINK} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={32} cy={32} r={4} fill={RINK} />
    </Svg>
  );
}

/**
 * Cầu vồng đồng tâm theo một đường cong. Mỗi dải vẽ một nét viền mực rộng hơn
 * rồi tới nét màu bên trong, nên ranh giới giữa các dải là một đường mực mảnh.
 */
export function Rainbow({
  d,
  viewBox,
  width,
  height,
  scale = 1,
  preserve = 'xMidYMid meet',
}: {
  d: string;
  viewBox: string;
  width: number | string;
  height: number | string;
  /** Nhân bề dày các dải, để dải không quá dày trên màn hẹp. */
  scale?: number;
  preserve?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox={viewBox} preserveAspectRatio={preserve} aria-hidden>
      {RAINBOW.map((s, i) => (
        <G key={i}>
          <Path d={d} fill="none" stroke={RINK} strokeWidth={(s.w + RAINBOW_OUTLINE) * scale} strokeLinecap="round" />
          <Path d={d} fill="none" stroke={s.c} strokeWidth={s.w * scale} strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

/** Bình thuỷ tinh có nút gỗ, cổ và chất lỏng màu, như các bình trong ảnh tham chiếu. `id` phải duy nhất trên trang. */
export function Flask({ width = 130, color = RPINK, id = 'a' }: { width?: number; color?: string; id?: string }) {
  const body = 'M52 70 C 20 92, 14 120, 14 150 C 14 190, 36 204, 65 204 C 94 204, 116 190, 116 150 C 116 120, 110 92, 78 70 Z';
  return (
    <Svg width={width} height={(width * 210) / 130} viewBox="0 0 130 210" aria-hidden>
      <Defs>
        <ClipPath id={`nb-flask-${id}`}>
          <Path d={body} />
        </ClipPath>
      </Defs>
      <Path d={body} fill="#FFFFFF" fillOpacity={0.55} />
      <G clipPath={`url(#nb-flask-${id})`}>
        <Path d="M0 124 Q 32 110 65 124 T 130 124 V 210 H 0 Z" fill={color} />
        <Path d="M0 124 Q 32 110 65 124 T 130 124" fill="none" stroke={RINK} strokeWidth={4} />
        <Circle cx={42} cy={164} r={5} fill="#FFFFFF" fillOpacity={0.6} />
        <Circle cx={92} cy={180} r={3.5} fill="#FFFFFF" fillOpacity={0.6} />
      </G>
      <Path d={body} fill="none" stroke={RINK} strokeWidth={5} strokeLinejoin="round" />
      <Rect x={46} y={26} width={38} height={46} rx={4} fill="#FFFFFF" fillOpacity={0.55} stroke={RINK} strokeWidth={5} />
      <Rect x={43} y={6} width={44} height={24} rx={6} fill="#D9A86C" stroke={RINK} strokeWidth={5} />
      <Path d="M30 118 Q26 146 34 172" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeOpacity={0.8} />
    </Svg>
  );
}

/** Đồng hồ quạt nửa vòng nhiều màu với kim ở giữa, như đồng hồ trên máy trong ảnh. */
export function FanGauge({ width = 140 }: { width?: number }) {
  const cx = 60;
  const cy = 60;
  const r = 46;
  const colors = [RPINK, RORANGE, RGOLD, RSKY, RVIOLET];
  const step = 180 / colors.length;
  const at = (deg: number, rad = r) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  };
  return (
    <Svg width={width} height={(width * 72) / 120} viewBox="0 0 120 72" aria-hidden>
      {colors.map((c, i) => {
        const d = `M${at(180 + i * step)} A ${r} ${r} 0 0 1 ${at(180 + (i + 1) * step)}`;
        return (
          <G key={i}>
            <Path d={d} fill="none" stroke={RINK} strokeWidth={18} />
            <Path d={d} fill="none" stroke={c} strokeWidth={11} />
          </G>
        );
      })}
      <Path d={`M${cx} ${cy} L${at(300, 40)}`} stroke={RINK} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={6} fill={RINK} />
    </Svg>
  );
}

/** Máy chứa: ống chất lỏng xanh nối vào thân kem có cửa sổ tròn và ngôi sao Band 9. */
export function Machine({ width = 190 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 300) / 200} viewBox="0 0 200 300" aria-hidden>
      <Path d="M40 104 V132 H116" fill="none" stroke={RINK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M40 104 V132 H116" fill="none" stroke={RPIPE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={20} y={14} width={40} height={96} rx={18} fill={RSKY} stroke={RINK} strokeWidth={6} />
      <Rect x={14} y={2} width={52} height={18} rx={7} fill={RGOLD} stroke={RINK} strokeWidth={5} />
      <Rect x={44} y={96} width={148} height={192} rx={72} fill={RPIPE} stroke={RINK} strokeWidth={6} />
      <Circle cx={118} cy={164} r={40} fill={RPAPER} stroke={RINK} strokeWidth={6} />
      <Polygon points={starPoints(118, 164, 28, 12)} fill={RGOLD} stroke={RINK} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M72 236 H164 M72 248 H164 M72 260 H164" stroke={RINK} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={68} cy={272} r={10} fill={RPINK} stroke={RINK} strokeWidth={4} />
      <Path d="M118 288 V300" stroke={RINK} strokeWidth={10} />
    </Svg>
  );
}

/** Giọt nước hồng treo dưới ống. */
export function Drip({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 39) / 26} viewBox="0 0 26 39" aria-hidden>
      <Path d="M13 2 C 13 2, 3 18, 3 26 A10 10 0 0 0 23 26 C 23 18, 13 2, 13 2 Z" fill={RPINK} stroke={RINK} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}

/** Mép dưới của khối tối, lượn sóng xuống nền kem. */
export function WaveEdge({ height = 72, color = RCREAM }: { height?: number; color?: string }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden>
      <Path d="M0 40 C 200 0, 400 80, 600 40 S 1000 0, 1200 40 V80 H0 Z" fill={color} />
    </Svg>
  );
}
