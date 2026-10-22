import React, { useMemo } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { BlueHero } from '@/components/home/BlueHero';
import { Grid } from '@/components/layout/Grid';
import { HeroStat } from '@/components/layout/LightHero';
import { Icon } from '@/components/ui/Icon';
import { TileArt } from '@/components/ui/TileArt';
import { GlossOrb } from '@/components/ui/GlossOrb';
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
 * Vòng icon kiểu thẻ học: ô màu nhạt, icon đậm và một vệt cung trang trí. Vệt cung không
 * biểu thị tiến độ (app chưa lưu tiến độ theo từng kỹ năng), chỉ để thẻ có điểm nhấn.
 */
function IconRing({ icon, tone }: { icon: Parameters<typeof Icon>[0]["name"]; tone: readonly [string, string] }) {
  return <GlossOrb icon={icon} tone={tone} size={56} />;
}

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
        return (
          <View key={skill} className="gap-3">
            <Text className="font-heavy text-cardTitle text-ink">
              {SKILL_NAME[skill][locale]} <Text className="font-mid text-label text-muted">{list.length}</Text>
            </Text>

            <Grid columns={2} tabletColumns={2} mobileColumns={2} gap={12}>
              {list.map((item, index) => {
                const tone = TONES[index % TONES.length]!;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => router.push(item.href as never)}
                    accessibilityRole="button"
                    accessibilityLabel={navLabel(item, locale)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      minHeight: 156,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: '#F1EEFB',
                      backgroundColor: '#FFFFFF',
                      padding: 16,
                      overflow: 'hidden',
                      justifyContent: 'space-between',
                      opacity: pressed ? 0.94 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 22px rgba(106,75,217,0.08)', transition: 'transform 160ms ease' } as object) : {}),
                    })}
                  >
                    <TileArt seed={'ielts-' + item.key} tone={tone} height={96} style={{ marginHorizontal: -16, marginTop: -16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <IconRing icon={item.icon} tone={tone} />
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F2FF', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="arrow-right" size={15} color="#6A4BD9" strokeWidth={2.2} />
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text numberOfLines={2} style={{ fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#2B2350' }}>
                        {navLabel(item, locale)}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#7A72A0', fontWeight: '600' }}>{SKILL_NAME[skill][locale]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </Grid>
          </View>
        );
      })}
    </View>
  );
}
