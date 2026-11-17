import React from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { NeonBackdrop, NeonIcon, NeonPill, type NeonScene } from '@/components/neon/Neon';
import { NeonBob } from '@/components/neon/NeonMotion';
import type { NeonIconId } from '@/components/neon/neon-art';

/**
 * Đầu trang kiểu "hệ điều hành retro" cho trang không có ảnh chữ riêng (Hôm nay, Lộ trình có ảnh):
 * cùng nền neon, viên số liệu kính tối, chữ tiêu đề lớn nổi khối vàng, một dòng phụ ngắn.
 */
export function NeonPageHero({ scene, title, subtitle, chips, children, titleScale = 1 }: { scene: NeonScene; title: string; subtitle?: string; chips?: { label: string; icon?: NeonIconId }[]; children?: React.ReactNode; titleScale?: number }) {
  const wide = useWindowDimensions().width >= 760;
  const size = Math.round((wide ? 76 : 48) * titleScale);
  const extrude =
    Platform.OS === 'web'
      ? ({ textShadow: '0 2px 0 #FFB800, 0 4px 0 #D98A00, 0 6px 0 #5A2FC8, 0 8px 0 #3A1FA0, 0 10px 0 #24147A, 0 16px 22px rgba(10,6,60,0.55)' } as object)
      : ({ textShadowColor: '#3A1FA0', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 0 } as object);
  return (
    <View accessibilityLabel={title} style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(160,150,255,0.35)' }}>
      <NeonBackdrop scene={scene} dense={false} />
      <View style={{ padding: wide ? 28 : 16, paddingTop: wide ? 24 : 16, paddingBottom: wide ? 34 : 24, gap: wide ? 14 : 10, alignItems: 'center' }}>
        {chips?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {chips.map((c) => (
              <NeonPill key={c.label} icon={c.icon} label={c.label} />
            ))}
          </View>
        ) : null}
        <NeonBob amp={6} tilt={0.5} ms={2400} style={{ alignSelf: 'center' }}>
          <Text accessibilityRole="header" className="font-nun-heavy" style={[{ fontSize: size, lineHeight: size * 1.15, color: '#FFE97A', textAlign: 'center', letterSpacing: 1 }, extrude]}>
            {title}
          </Text>
        </NeonBob>
        {subtitle ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <NeonIcon name="sparkle" height={22} />
            <Text className="font-nun-heavy" style={{ fontSize: wide ? 17 : 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{subtitle}</Text>
            <NeonIcon name="sparkle" height={22} />
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}
