import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import type { NeonIconId } from '@/components/neon/neon-art';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import { OverviewHero } from '@/components/neon/OverviewHero';
import { useL } from '@/i18n/useL';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';

/** Icon pixel neon, tông màu và dòng phụ ngắn của từng mục SAT. */
const SAT_ITEM: Record<string, { icon: NeonIconId; tone: string; sub: { vi: string; en: string } }> = {
  'sat-practice-tests': { icon: 'trophy', tone: 'lime', sub: { vi: '50 đề Bluebook', en: '50 Bluebook forms' } },
  math: { icon: 'bolt', tone: 'ocean', sub: { vi: '27 chuyên đề · Desmos', en: '27 topics · Desmos' } },
  'sat-rw': { icon: 'book', tone: 'grape', sub: { vi: 'Đọc hiểu · Ngữ pháp', en: 'Reading · Grammar' } },
  'sat-full-test': { icon: 'crown', tone: 'gold', sub: { vi: '2 module bấm giờ', en: '2 timed modules' } },
  'sat-home': { icon: 'planet', tone: 'sunset', sub: { vi: 'Lộ trình 1000 → 1500+', en: 'Roadmap 1000 → 1500+' } },
};

/**
 * Trang tổng quan SAT theo kiểu game neon: đầu trang nền xanh chàm có lưới như khung Đua Top + chữ SAT nhiều màu, mỗi mục là một thẻ tối có
 * vầng sáng màu riêng và icon pixel 3D. Bấm thẻ là mở thẳng phần đó.
 */
export function SatFocusPicker() {
  const { L, locale } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'sat')?.children ?? [],
    [],
  );

  return (
    <View style={{ gap: 22 }}>
      <OverviewHero
        variant="neon"
        text="SAT"
        pills={[
          { icon: 'trophy', label: L('50 đề', '50 tests') },
          { icon: 'bolt', label: L('27 chuyên đề', '27 topics') },
          { icon: 'crown', label: '1500+' },
        ]}
        primary={{ label: L('Luyện đề SAT', 'SAT tests'), onPress: () => router.push('/sat/practice-tests' as never) }}
        secondary={{ label: L('Lộ trình Math', 'Math path'), onPress: () => router.push('/math' as never) }}
      />

      <Grid columns={3} tabletColumns={2} mobileColumns={2} gap={14}>
        {items.map((item, index) => {
          const meta = SAT_ITEM[item.key];
          return (
            <NeonTile
              key={item.key}
              title={navLabel(item, locale)}
              sub={meta?.sub[locale]}
              chip="SAT"
              index={String(index + 1).padStart(2, '0')}
              icon={meta?.icon ?? 'star5'}
              palette={NEON_PALETTES[meta?.tone ?? 'grape']!}
              minHeight={wide ? 220 : 215}
              onPress={() => router.push(item.href as never)}
            />
          );
        })}
      </Grid>
    </View>
  );
}
