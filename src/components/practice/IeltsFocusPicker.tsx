import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { BlueHero } from '@/components/home/BlueHero';
import { Grid } from '@/components/layout/Grid';
import { HeroStat } from '@/components/layout/LightHero';
import type { IconName } from '@/components/ui/Icon';
import { ToneTile } from '@/components/vocab/ToneTile';
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

/** Bảng màu theo thứ tự trong nhóm: cặp [nhạt, đậm]. Màu nhạt tô nền icon, màu đậm vẽ vòng và icon. */
const TONES: ReadonlyArray<readonly [string, string]> = [
  ['#FFC4D8', '#E45A8C'],
  ['#D9CCFF', '#6A4BD9'],
  ['#BFEBD3', '#23875E'],
  ['#FFE0B0', '#C27417'],
  ['#C8DDFF', '#2F6FD6'],
  ['#FFD6BF', '#D9503E'],
];

/**
 * Trang Luyện IELTS: mỗi thẻ là một lối vào, bấm là mở thẳng phần đó.
 * Thẻ trắng hai cột, nền pastel, vòng icon kiểu app học (mẫu ảnh tham chiếu).
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
    <View className="gap-5">
      <BlueHero
        wide={wide}
        eyebrow={L('IELTS · 4 KỸ NĂNG', 'IELTS · 4 SKILLS')}
        chip={L('Bạn muốn', 'Pick')}
        title={L('học gì với IELTS?', 'your IELTS lesson.')}
        subtitle={L('Mỗi thẻ là một phần học, bấm là vào ngay.', 'Each card is one part of the course. Tap to open it.')}
        primary={{ label: L('Luyện đọc', 'Reading practice'), onPress: () => router.push('/luyen-doc' as never) }}
        secondary={{ label: L('Luyện theo dạng bài', 'Practise by question type'), onPress: () => router.push('/ielts/skills' as never) }}
        footer={IELTS_SKILL_ORDER.map((skill) => {
          const n = items.filter((i) => IELTS_SKILL_OF[i.key] === skill).length;
          return n ? <HeroStat key={skill} value={String(n)} label={SKILL_NAME[skill][locale]} /> : null;
        })}
      />

      {IELTS_SKILL_ORDER.map((skill) => {
        const list = items.filter((i) => IELTS_SKILL_OF[i.key] === skill);
        if (list.length === 0) return null;
        // Mục đầu nhóm là thẻ nổi bật rộng cả hàng; các mục sau xếp hai cột, mỗi thẻ một tông màu.
        const k = IELTS_SKILL_ORDER.indexOf(skill);
        const [featured, ...rest] = list;
        return (
          <View key={skill} className="gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-cardTitle text-ink">{SKILL_NAME[skill][locale]}</Text>
              <View className="rounded-pill bg-white px-2.5 py-0.5" style={{ borderWidth: 1, borderColor: '#EAE4F8' }}>
                <Text className="font-strong text-label text-muted">{list.length}</Text>
              </View>
            </View>

            {featured ? (
              <ToneTile
                seed={'ielts-' + featured.key}
                tone={TONES[k % TONES.length]![1]}
                icon={featured.icon as IconName}
                title={navLabel(featured, locale)}
                sub={SKILL_NAME[skill][locale]}
                chip={L('Bắt đầu tại đây', 'Start here')}
                minHeight={230}
                onPress={() => router.push(featured.href as never)}
              />
            ) : null}

            {rest.length > 0 ? (
              <Grid columns={2} tabletColumns={2} mobileColumns={2} gap={12}>
                {rest.map((item, index) => (
                  <ToneTile
                    key={item.key}
                    seed={'ielts-' + item.key}
                    tone={TONES[(k + index + 1) % TONES.length]![1]}
                    icon={item.icon as IconName}
                    title={navLabel(item, locale)}
                    sub={SKILL_NAME[skill][locale]}
                    chip={L(`Bài ${index + 2}`, `No. ${index + 2}`)}
                    minHeight={220}
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
