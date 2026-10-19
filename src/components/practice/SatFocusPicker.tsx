import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LightHero } from '@/components/layout/LightHero';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StickerCard } from '@/components/ui/StickerCard';
import { useL } from '@/i18n/useL';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';

/**
 * Mỗi tính năng SAT một cặp màu gradient nổi bật, cùng họ với thẻ trang chủ Band 9.
 */
const SAT_ITEM_COLORS: Record<string, readonly [string, string]> = {
  'sat-practice-tests': ['#10B981', '#059669'], // Emerald / Mint (Luyện 50 đề)
  math: ['#3B82F6', '#1D4ED8'],                 // Azure / Cobalt (Toán)
  'sat-rw': ['#8B5CF6', '#6D28D9'],             // Violet / Purple (Verbal)
  'sat-full-test': ['#F59E0B', '#D97706'],      // Amber / Gold (Thi thử 2 Module)
  'sat-home': ['#EC4899', '#DB2777'],           // Rose / Pink (Tổng quan & Lộ trình)
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

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'sat')?.children ?? [],
    [],
  );

  return (
    <View className="gap-5">
      <LightHero
        badge="SAT"
        art="home"
        line1={L('Bạn muốn học gì với SAT?', 'What do you want to study for SAT?')}
        line2={L('bấm thẻ để vào học', 'tap a card to start')}
        subtitle={L('Mỗi thẻ là một phần học, bấm là vào ngay.', 'Each card is one part of the course. Tap to open it.')}
      />

      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
        {items.map((item) => {
          const colors = SAT_ITEM_COLORS[item.key] ?? ['#3B82F6', '#1D4ED8'];
          const desc = SAT_ITEM_DESCS[item.key];

          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as never)}
              accessibilityRole="button"
              accessibilityLabel={navLabel(item, locale)}
            >
              <StickerCard colors={colors} style={{ minHeight: 140 }}>
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                >
                  <Icon name={item.icon as IconName} size={20} color={colors[1]} />
                </View>

                <Text className="mt-4 font-heavy text-cardTitle" style={{ color: '#FFFFFF' }}>
                  {navLabel(item, locale)}
                </Text>

                {desc ? (
                  <Text
                    className="mt-1 font-sans text-label"
                    style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 18 }}
                    numberOfLines={2}
                  >
                    {desc[locale]}
                  </Text>
                ) : null}

                <View className="mt-3 self-end">
                  <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              </StickerCard>
            </Pressable>
          );
        })}
      </Grid>
    </View>
  );
}
