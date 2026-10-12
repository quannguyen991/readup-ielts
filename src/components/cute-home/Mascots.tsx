/**
 * Nhân vật của giao diện cute-home — TỰ VẼ, không lấy hình nhân vật có bản quyền.
 *
 * Phong cách: thân trắng tròn, viền mực mảnh, mắt chấm, má hồng. Hai nhân vật:
 * - `MochiChar`: bánh tròn có đôi tai nhỏ, hợp làm linh vật ở khối thông tin.
 * - `BongChar`: đám mây có chiếc lá trên đầu, hợp làm điểm nhấn ở đầu trang.
 *
 * Hình SVG tạm; khi có ảnh sinh từ mô hình thì thay ở đây, các chỗ gọi giữ nguyên.
 */
import React from 'react';
import Svg, { Ellipse, G, Path, Circle } from 'react-native-svg';

import { CUTE } from './palette';

type P = { size?: number };

const BODY = '#FFFFFF';

/** Mắt chấm và má hồng dùng chung cho cả hai nhân vật. */
function Face({ eyes, cheeks, mouth }: { eyes: [number, number, number, number]; cheeks: [number, number, number, number]; mouth: string }) {
  const [lx, ly, rx, ry] = eyes;
  const [cl, cy, cr, cyb] = cheeks;
  return (
    <G>
      <Circle cx={lx} cy={ly} r={3.4} fill={CUTE.outline} />
      <Circle cx={rx} cy={ry} r={3.4} fill={CUTE.outline} />
      <Ellipse cx={cl} cy={cy} rx={6.5} ry={3.8} fill={CUTE.blush} />
      <Ellipse cx={cr} cy={cyb} rx={6.5} ry={3.8} fill={CUTE.blush} />
      <Path d={mouth} stroke={CUTE.outline} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </G>
  );
}

export function MochiChar({ size = 120 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx={34} cy={30} rx={13} ry={15} fill={BODY} stroke={CUTE.outline} strokeWidth={2.6} />
      <Ellipse cx={86} cy={30} rx={13} ry={15} fill={BODY} stroke={CUTE.outline} strokeWidth={2.6} />
      <Ellipse cx={60} cy={68} rx={46} ry={42} fill={BODY} stroke={CUTE.outline} strokeWidth={2.6} />
      <Face eyes={[46, 64, 74, 64]} cheeks={[36, 78, 84, 78]} mouth="M55 77 Q60 82 65 77" />
    </Svg>
  );
}

export function BongChar({ size = 120 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* chiếc lá trên đỉnh mây, vẽ trước để thân che chân lá */}
      <Path d="M60 44 Q56 26 72 18 Q78 34 60 44 Z" fill={CUTE.leaf} stroke={CUTE.outline} strokeWidth={2.4} strokeLinejoin="round" />
      <Path
        d="M30 90 A16 16 0 0 1 28 60 A20 20 0 0 1 60 44 A20 20 0 0 1 96 56 A16 16 0 0 1 96 90 Z"
        fill={BODY}
        stroke={CUTE.outline}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Face eyes={[48, 68, 74, 68]} cheeks={[40, 78, 82, 78]} mouth="M57 76 Q61 80 65 76" />
    </Svg>
  );
}

/** Ngôi sao bốn cánh phát sáng, màu trắng viền mực — điểm lấp lánh rải trên nền. */
export function SparkleStar({ size = 18, color = '#FFFFFF' }: P & { color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 Q13.2 10.8 22 12 Q13.2 13.2 12 22 Q10.8 13.2 2 12 Q10.8 10.8 12 2 Z"
        fill={color}
        stroke={CUTE.outline}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
