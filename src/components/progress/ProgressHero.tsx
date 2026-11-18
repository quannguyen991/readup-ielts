import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { NeonBackdrop, NeonIcon, NeonPill, NeonTitle, PixelText } from '@/components/neon/Neon';
import { useL } from '@/i18n/useL';

/**
 * Đầu trang Tiến độ theo kiểu màn hình retro (cùng bộ với Hôm nay và Xếp hạng): chữ "Tiến độ" pixel 3D,
 * chuỗi ngày hiện tại, kỷ lục, mục tiêu và bảy ngày gần nhất. Chỉ là giao diện: mọi số do trang truyền vào
 * (chuỗi tính theo `services/gamification/points.ts`, ngày có học theo `isActiveDay`).
 */
export type HeroDay = { date: string; label: string; studied: boolean };

export function ProgressHero({ current, longest, goalLabel, days }: { current: number; longest: number; goalLabel: string; days: HeroDay[] }) {
  const { L } = useL();
  const wide = useWindowDimensions().width >= 760;
  return (
    <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(160,150,255,0.35)' }}>
      <NeonBackdrop scene="progress" />
      <View style={{ padding: wide ? 28 : 16, gap: wide ? 20 : 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: wide ? 'flex-start' : 'center' }}>
          <NeonPill icon="flame" label={L(`${current} ngày`, `${current}d`)} />
          <NeonPill icon="crown" label={L(`Kỷ lục ${longest}`, `Best ${longest}`)} />
          <NeonPill icon="gem" label={goalLabel} onPress={() => router.push('/plan' as never)} />
        </View>

        <NeonTitle id="tien-do" label={L('Tiến độ', 'Progress')} maxWidth={wide ? 480 : 320} />

        {/* Bảy ngày gần nhất: ô sáng là ngày có học. */}
        <View style={{ flexDirection: 'row', gap: wide ? 12 : 6, justifyContent: 'center' }}>
          {days.map((d) => (
            <View key={d.date} accessibilityLabel={`${d.label}: ${d.studied ? L('có học', 'studied') : L('chưa học', 'not studied')}`} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: wide ? 52 : 40, height: wide ? 52 : 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: d.studied ? 'rgba(255,216,74,0.2)' : 'rgba(10,8,70,0.55)', borderWidth: 2, borderColor: d.studied ? '#FFD84A' : 'rgba(255,255,255,0.2)' }}>
                {d.studied ? <NeonIcon name="check" height={wide ? 26 : 22} /> : null}
              </View>
              <PixelText size={17} color="rgba(255,255,255,0.8)">
                {d.label}
              </PixelText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
