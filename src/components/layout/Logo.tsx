import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

/** Bảng màu thương hiệu Band 9 (theo logo người dùng gửi 01/10/2026). */
export const BRAND = {
  navy: '#0F1D33',
  cream: '#F3EDE1',
  gold: '#B8955A',
  goldLight: '#E2C88F',
  goldDeep: '#8F6E36',
};

/**
 * Biểu tượng Band 9: khối vuông xanh đậm, chữ B ghép từ thân dọc và hai thuỳ
 * màu kem, ô vuông vàng kim ở góc phải trên, mảnh chữ "9" kem ở góc phải dưới.
 * Vẽ bằng SVG để nét sắc ở mọi cỡ.
 */
export function BrandMark({ size = 36 }: { size?: number }) {
  const c = BRAND.cream;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Band 9">
      <Rect x={0} y={0} width={100} height={100} rx={6} fill={BRAND.navy} />
      {/* thân chữ B */}
      <Rect x={14} y={12} width={19} height={74} fill={c} />
      {/* thuỳ trên */}
      <Path d="M37 12 H45 A15 16 0 0 1 45 44 H37 Z" fill={c} />
      {/* thuỳ dưới */}
      <Path d="M37 47 H46 A15 19.5 0 0 1 46 86 H37 Z" fill={c} />
      {/* ô vàng kim */}
      <Rect x={64} y={12} width={25} height={32} fill={BRAND.gold} />
      {/* nét "9" */}
      <Path d="M64 47 H89 V86 H82 A18 18 0 0 1 64 68 Z" fill={c} />
    </Svg>
  );
}

/**
 * Logo — dùng ở thanh bên (máy tính) và thanh đầu trang (điện thoại).
 * Tên thương hiệu: "Band 9" (đổi từ ReadUp ngày 01/10/2026).
 */
export function Logo({
  compact = false,
  markOnly = false,
}: {
  compact?: boolean;
  /** Chỉ vẽ biểu tượng, bỏ chữ — cột dọc lúc thu gọn. */
  markOnly?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <BrandMark size={compact ? 32 : 36} />
      {markOnly ? null : (
        <Text className={`font-heavy ${compact ? 'text-cardTitle' : 'text-sectionTitle'}`} style={{ color: BRAND.navy, letterSpacing: 0.2 }}>
          Band 9
        </Text>
      )}
    </View>
  );
}
