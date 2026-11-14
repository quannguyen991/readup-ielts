import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { BlueHero } from '@/components/home/BlueHero';
import type { IconName } from '@/components/ui/Icon';
import { PosterTile, type PickerArt } from '@/components/practice/PosterTile';
import { useL } from '@/i18n/useL';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';

/**
 * Mỗi tính năng SAT một cặp màu: màu đậm là màu của quả cầu, bóng chữ và nút mũi tên.
 * Nền ảnh lấy cùng tông (SAT_ITEM_ART) để thẻ đồng bộ với ảnh.
 */
const SAT_ITEM_COLORS: Record<string, readonly [string, string]> = {
  'sat-practice-tests': ['#10B981', '#059669'], // Emerald / Mint (Luyện 50 đề)
  math: ['#3B82F6', '#1D4ED8'],                 // Azure / Cobalt (Toán)
  'sat-rw': ['#8B5CF6', '#6D28D9'],             // Violet / Purple (Verbal)
  'sat-full-test': ['#F59E0B', '#C27417'],      // Amber / Gold (Thi thử 2 Module)
  'sat-home': ['#EC4899', '#DB2777'],           // Rose / Pink (Tổng quan & Lộ trình)
};

const SAT_ITEM_ART: Record<string, PickerArt> = {
  'sat-practice-tests': 'green',
  math: 'blue',
  'sat-rw': 'violet',
  'sat-full-test': 'amber',
  'sat-home': 'pink',
};

const SAT_ITEM_DESCS: Record<string, { vi: string; en: string }> = {
  'sat-practice-tests': {
    vi: '50 đề thi chuẩn Bluebook & Thi thật 2024–2025',
    en: '50 authentic Bluebook & 2024–2025 real forms',
  },
  math: {
    vi: '27 chuyên đề Toán · 4 cấp độ · Máy tính Desmos',
    en: '27 Math topics · 4 levels · Desmos calculator',
  },
  'sat-rw': {
    vi: 'Reading & Writing · Đọc hiểu & Quy tắc ngữ pháp',
    en: 'Reading & Writing · Comprehension & grammar conventions',
  },
  'sat-full-test': {
    vi: 'Thi thử 2 Module thích ứng bấm giờ chuẩn Bluebook',
    en: 'Adaptive 2-module timed test simulation',
  },
  'sat-home': {
    vi: 'Lộ trình 4 bước ôn luyện từ 1000 đến 1500+',
    en: '4-step prep roadmap from 1000 to 1500+',
  },
};

/**
 * Trang chủ SAT: mỗi thẻ là một lối vào, bấm là mở thẳng phần đó.
 * Không còn chọn / bỏ chọn phần học hay ẩn / hiện mục, giống trang IELTS.
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
    <View className="gap-5">
      <BlueHero
        wide={wide}
        eyebrow="SAT · MATH & READING"
        chip={L('Bạn muốn', 'Pick')}
        title={L('học gì với SAT?', 'your SAT lesson.')}
        subtitle={L('Mỗi thẻ là một phần học, bấm là vào ngay.', 'Each card is one part of the course. Tap to open it.')}
        primary={{ label: L('Luyện đề Digital SAT', 'Digital SAT tests'), onPress: () => router.push('/sat/practice-tests' as never) }}
        secondary={{ label: L('Xem lộ trình SAT Math', 'See the SAT Math roadmap'), onPress: () => router.push('/math' as never) }}
      />

      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
        {items.map((item) => {
          const colors = SAT_ITEM_COLORS[item.key] ?? ['#3B82F6', '#1D4ED8'];
          const desc = SAT_ITEM_DESCS[item.key];

          return (
            <PosterTile
              key={item.key}
              art={SAT_ITEM_ART[item.key] ?? 'blue'}
              accent={colors[1]}
              icon={item.icon as IconName}
              title={navLabel(item, locale)}
              desc={desc?.[locale]}
              wide={wide}
              onPress={() => router.push(item.href as never)}
            />
          );
        })}
      </Grid>
    </View>
  );
}
