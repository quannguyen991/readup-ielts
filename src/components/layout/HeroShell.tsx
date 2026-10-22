import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HeroBackdrop } from '@/components/home/HeroBackdrop';

/** Viền gradient của hero: cùng bảng màu với hero trang chủ. */
const HERO_RING = ['#FF5FA2', '#FFD84A', '#3A8CFF', '#8A3FE0'] as unknown as [string, string, ...string[]];

/**
 * Vỏ hero dùng chung cho các đầu trang tự vẽ: viền gradient như trang chủ, nền khối pastel có hoạ tiết,
 * và phần nội dung đặt trong `style` để mỗi trang giữ kích thước và khoảng đệm riêng.
 */
export function HeroShell({ children, radius = 26, style }: { children: React.ReactNode; radius?: number; style?: ViewStyle }) {
  return (
    <LinearGradient colors={HERO_RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius, padding: 2 }}>
      <View style={{ borderRadius: radius - 2, overflow: 'hidden', backgroundColor: '#0B0520' }}>
        <HeroBackdrop />
        <View style={[{ padding: 24 }, style]}>{children}</View>
      </View>
    </LinearGradient>
  );
}
