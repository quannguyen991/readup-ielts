import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LightHero } from '@/components/layout/LightHero';
import { Icon } from '@/components/ui/Icon';
import { StickerCard } from '@/components/ui/StickerCard';
import { useL } from '@/i18n/useL';
import { IELTS_SKILL_OF, IELTS_SKILL_ORDER, type IeltsSkill } from '@/navigation/ielts-focus';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';

const SKILL_NAME: Record<IeltsSkill, { vi: string; en: string }> = {
  reading: { vi: 'Đọc', en: 'Reading' },
  listening: { vi: 'Nghe', en: 'Listening' },
  writing: { vi: 'Viết', en: 'Writing' },
  speaking: { vi: 'Nói', en: 'Speaking' },
  other: { vi: 'Khác', en: 'Other' },
};

/** Mỗi kỹ năng một dải màu, cùng họ với thẻ trang chủ Band 9. */
const SKILL_COLORS: Record<IeltsSkill, readonly [string, string]> = {
  reading: ['#7FA3F6', '#4A7FE8'],
  listening: ['#4FC3DC', '#1F9BB8'],
  writing: ['#F87171', '#DC2626'],
  speaking: ['#A78BFA', '#7C3AED'],
  other: ['#FBBF24', '#D97706'],
};

/**
 * Trang Luyện IELTS: mỗi thẻ là một lối vào, bấm là mở thẳng phần đó.
 * Không còn chọn nhóm hay ẩn/hiện mục.
 */
export function IeltsFocusPicker() {
  const { L, locale } = useL();

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'ielts')?.children ?? [],
    [],
  );

  return (
    <View className="gap-5">
      <LightHero
        badge="IELTS"
        art="home"
        line1={L('Bạn muốn học gì với IELTS?', 'What do you want to study for IELTS?')}
        line2={L('bấm thẻ để vào học', 'tap a card to start')}
        subtitle={L('Mỗi thẻ là một phần học, bấm là vào ngay.', 'Each card is one part of the course. Tap to open it.')}
      />

      {IELTS_SKILL_ORDER.map((skill) => {
        const list = items.filter((i) => IELTS_SKILL_OF[i.key] === skill);
        if (list.length === 0) return null;
        return (
          <View key={skill} className="gap-3">
            <Text className="font-heavy text-cardTitle text-ink">
              {SKILL_NAME[skill][locale]} <Text className="font-mid text-label text-muted">{list.length}</Text>
            </Text>

            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
              {list.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.href as never)}
                  accessibilityRole="button"
                  accessibilityLabel={navLabel(item, locale)}
                >
                  <StickerCard colors={SKILL_COLORS[skill]} style={{ minHeight: 140 }}>
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                    >
                      <Icon name={item.icon} size={20} color={SKILL_COLORS[skill][1]} />
                    </View>
                    <Text className="mt-4 font-heavy text-cardTitle" style={{ color: '#FFFFFF' }}>
                      {navLabel(item, locale)}
                    </Text>
                    <View className="mt-3 self-end">
                      <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                  </StickerCard>
                </Pressable>
              ))}
            </Grid>
          </View>
        );
      })}
    </View>
  );
}
