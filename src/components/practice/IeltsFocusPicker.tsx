import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { NeonSectionBar } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import { OverviewHero } from '@/components/neon/OverviewHero';
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

/** Icon pixel neon của từng nhóm kỹ năng (dùng cho viên số liệu và tiêu đề mục). */
const SKILL_ICON: Record<IeltsSkill, NeonIconId> = {
  reading: 'book',
  listening: 'speaker',
  writing: 'star5',
  speaking: 'flame',
  other: 'gem',
};

/** Icon riêng từng trang con; trang con mới chưa có ở đây thì lấy icon của nhóm kỹ năng. */
const ITEM_ICON: Record<string, NeonIconId> = {
  'luyen-doc': 'book',
  'ielts-skills': 'gem',
  'mock-tests': 'medal',
  'ielts-source-practice': 'trophy',
  library: 'moon',
  bilingual: 'planet',
  writing: 'star5',
  grammar: 'bolt',
  'video-hub': 'gamepad',
  listening: 'speaker',
  sentence: 'note',
  hub: 'flame',
  'toeic-toefl': 'cloud',
  'hsa-english': 'crown',
};

/** Tông màu theo nhóm: mỗi nhóm một họ màu, thẻ trong nhóm xoay vòng cho khác nhau. */
const SKILL_TONES: Record<IeltsSkill, string[]> = {
  reading: ['sunset', 'gold', 'berry', 'grape', 'sunset'],
  listening: ['ocean', 'lime', 'ocean', 'grape'],
  writing: ['grape', 'berry'],
  speaking: ['berry', 'sunset', 'ocean'],
  other: ['lime', 'gold', 'ocean', 'grape'],
};

/**
 * Trang tổng quan IELTS theo kiểu game neon: đầu trang trời hoàng hôn + chữ IELTS nhiều màu, mỗi kỹ năng một mục
 * với thẻ nổi bật rộng cả hàng và các thẻ nhỏ hai cột, mỗi thẻ một tông màu và một icon pixel 3D.
 */
export function IeltsFocusPicker() {
  const { L, locale } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'ielts')?.children ?? [],
    [],
  );

  return (
    <View style={{ gap: 22 }}>
      <OverviewHero
        variant="sunset"
        text="IELTS"
        pills={IELTS_SKILL_ORDER.flatMap((skill) => {
          const n = items.filter((i) => IELTS_SKILL_OF[i.key] === skill).length;
          return n ? [{ icon: SKILL_ICON[skill], label: `${n} ${SKILL_NAME[skill][locale]}` }] : [];
        })}
        primary={{ label: L('Luyện đọc', 'Reading'), onPress: () => router.push('/luyen-doc' as never) }}
        secondary={{ label: L('Theo dạng bài', 'By type'), onPress: () => router.push('/ielts/skills' as never) }}
      />

      {IELTS_SKILL_ORDER.map((skill) => {
        const list = items.filter((i) => IELTS_SKILL_OF[i.key] === skill);
        if (list.length === 0) return null;
        const tones = SKILL_TONES[skill];
        const [featured, ...rest] = list;
        return (
          <View key={skill} style={{ gap: 14 }}>
            <NeonSectionBar title={SKILL_NAME[skill][locale]} count={list.length} icon={SKILL_ICON[skill]} />

            {featured ? (
              <NeonTile
                featured
                title={navLabel(featured, locale)}
                chip={SKILL_NAME[skill][locale].toUpperCase()}
                index="01"
                cta={L('Bắt đầu', 'Start')}
                icon={ITEM_ICON[featured.key] ?? SKILL_ICON[skill]}
                palette={NEON_PALETTES[tones[0]!]!}
                minHeight={wide ? 240 : 200}
                onPress={() => router.push(featured.href as never)}
              />
            ) : null}

            {rest.length > 0 ? (
              <Grid columns={2} tabletColumns={2} mobileColumns={2} gap={14}>
                {rest.map((item, index) => (
                  <NeonTile
                    key={item.key}
                    title={navLabel(item, locale)}
                    chip={SKILL_NAME[skill][locale].toUpperCase()}
                    index={String(index + 2).padStart(2, '0')}
                    icon={ITEM_ICON[item.key] ?? SKILL_ICON[skill]}
                    palette={NEON_PALETTES[tones[(index + 1) % tones.length]!]!}
                    minHeight={wide ? 190 : 205}
                    onPress={() => router.push(item.href as never)}
                  />
                ))}
              </Grid>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
