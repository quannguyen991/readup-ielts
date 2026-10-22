/**
 * Mảnh dựng của lớp HUD nổi (kiểu Bến Dừa) trên bản đồ toàn màn hình: thẻ kính navy viền vàng, nút biểu tượng ≥ 44px,
 * chấm đỏ, thanh tiến độ. Dùng chung bảng màu Band 9 (`ui/kit`).
 */
import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { T } from '../ui/kit';

export const HUD = {
  bg: 'rgba(15,29,51,0.86)',
  border: 'rgba(139, 108, 240,0.85)',
  text: '#F3EDE1',
  dim: 'rgba(243,237,225,0.72)',
  gold: '#E2C88F',
} as const;

export const hudCard: ViewStyle = {
  backgroundColor: HUD.bg,
  borderWidth: 1.5,
  borderColor: HUD.border,
  borderRadius: 10,
};

/** Nút biểu tượng vuông 44px. `dot` = chấm đỏ báo có việc chờ. */
export function HudBtn({ glyph, label, onPress, active, dot, size = 44 }: { glyph: string; label: string; onPress: () => void; active?: boolean; dot?: boolean; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // @ts-expect-error title chỉ có trên web (chú thích khi rê chuột)
      title={label}
      style={({ pressed }) => [
        hudCard,
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? 'rgba(139, 108, 240,0.95)' : HUD.bg, transform: [{ translateY: pressed ? 1 : 0 }] },
      ]}
    >
      <Text style={{ fontSize: 20, color: active ? T.navy : HUD.gold }}>{glyph}</Text>
      {dot ? <View style={{ position: 'absolute', top: 5, right: 5, width: 11, height: 11, borderRadius: 6, backgroundColor: '#E5483A', borderWidth: 1.5, borderColor: '#fff' }} /> : null}
    </Pressable>
  );
}

export function HudChip({ glyph, value, label }: { glyph: string; value: string | number; label: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28, paddingHorizontal: 9, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <Text style={{ fontSize: 14 }}>{glyph}</Text>
      <Text className="font-strong" style={{ fontSize: 14, color: HUD.gold }}>
        {value}
      </Text>
    </View>
  );
}

export function Bar({ pct, color = T.gold, track = 'rgba(15,29,51,0.14)', height = 8, style }: { pct: number; color?: string; track?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

/** Biểu tượng theo loại địa điểm (khớp thẻ tên trên bản đồ). */
export const KIND_GLYPH: Record<string, string> = {
  restaurant: '🍜',
  cafe: '☕',
  hotel: '🛏️',
  station: '🚉',
  market: '🛍️',
  museum: '🏛️',
  landmark: '🏙️',
  garden: '🌳',
  airport: '✈️',
  counter: '🎫',
  secret: '✨',
};
