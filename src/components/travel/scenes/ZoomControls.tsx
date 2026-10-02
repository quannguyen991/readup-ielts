/**
 * Nút phóng to / thu nhỏ nhỏ gọn (góc dưới-phải) dùng cho cảnh thành phố và bản đồ thế giới. Chỉ là hai nút biểu tượng ≥ 44 px.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';

export function ZoomControls({ z, min, max, onZoom, bottom = 10, right = 10, top }: { z: number; min: number; max: number; onZoom: (delta: number) => void; bottom?: number; right?: number; top?: number }) {
  const { L } = useL();
  const btn = (label: string, glyph: string, delta: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onZoom(delta)}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(15,29,51,0.72)', borderWidth: 1, borderColor: 'rgba(184,149,90,0.7)', opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ color: '#F3EDE1', fontSize: 22, lineHeight: 24, fontWeight: '700' }}>{glyph}</Text>
    </Pressable>
  );
  return (
    <View pointerEvents="box-none" style={top !== undefined ? { position: 'absolute', right, top, gap: 6 } : { position: 'absolute', right, bottom, gap: 6 }}>
      {btn(L('Phóng to', 'Zoom in'), '+', 1, z >= max)}
      {btn(L('Thu nhỏ', 'Zoom out'), '−', -1, z <= min)}
    </View>
  );
}
