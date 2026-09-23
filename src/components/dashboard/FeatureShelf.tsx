import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Icon, StickerCard, type IconName } from '@/components/ui';
import { weekId } from '@/services/weekly/challenge';
import { useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useShadowStore } from '@/store/useShadowStore';
import { useDueCards } from '@/store/useVocabStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { stickerGradient } from '@/theme/tokens';

/** Bóng chữ mờ để chữ trắng vẫn đọc được ở đầu sáng của gradient (thẻ vàng, thẻ xanh ngọc). */
const INK_SHADOW = { textShadowColor: 'rgba(15,23,42,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 };

type Shelf = { key: string; title: string; note: string; href: string; icon: IconName; colors: readonly [string, string] };

/**
 * KỆ "MỚI TRÊN READUP" ở trang Hôm nay: một lối vào cho mỗi cách học mới, mỗi
 * thẻ nói luôn trạng thái của CHÍNH người học (tuần này làm đề chưa, bao nhiêu
 * cây đang chờ tưới…) thay vì một câu quảng cáo chung chung.
 */
export function FeatureShelf() {
  const week = useWeeklyStore((s) => s.results[weekId()]);
  const read = useShadowStore((s) => Object.values(s.best).reduce((n, l) => n + Object.keys(l).length, 0));
  const decks = useCustomDeckStore((s) => Object.keys(s.decks).length);
  const due = useDueCards().length;

  const items: Shelf[] = [
    {
      key: 'weekly',
      title: 'Đề của tuần',
      note: week ? `Tuần này: ${week.score}/${week.total} câu — xem mình đứng thứ mấy` : 'Tuần này chưa làm · 10 câu, mọi người cùng một đề',
      href: '/weekly',
      icon: 'trophy',
      colors: stickerGradient.warning,
    },
    {
      key: 'duel',
      title: 'Đấu 1–1',
      note: 'Thách bạn 10 câu từ vựng, điểm hai bên chạy trực tiếp',
      href: '/duel',
      icon: 'target',
      colors: stickerGradient.rose,
    },
    {
      key: 'shadow',
      title: 'Đọc theo VOA',
      note: read ? `Đã đọc ${read} câu — đọc tiếp bài dở` : 'Nói lại từng câu, máy tô từ nào bạn đọc rõ',
      href: '/shadow',
      icon: 'mic',
      colors: stickerGradient.accent,
    },
    {
      key: 'garden',
      title: 'Vườn từ',
      note: due ? `${due} cây đang chờ tưới` : 'Mỗi từ là một cây — ôn đều thì vườn xanh',
      href: '/vocabulary/garden',
      icon: 'leaf',
      colors: stickerGradient.success,
    },
    {
      key: 'import',
      title: 'Học từ bài bạn thích',
      note: decks ? `${decks} bộ từ bạn đã tạo` : 'Dán một đoạn văn, app lọc ra từ đáng học',
      href: '/vocabulary/import',
      icon: 'plus',
      colors: stickerGradient.info,
    },
    {
      key: 'errors',
      title: 'Hồ sơ lỗi',
      note: 'Lỗi nào đang lặp lại, và sửa bằng bài nào',
      href: '/errors',
      icon: 'gauge',
      colors: stickerGradient.primary,
    },
  ];

  return (
    <View className="mt-6">
      <Text className="font-heavy text-sectionTitle text-ink">Mới trên ReadUp</Text>
      <Text className="mt-1 font-sans text-body text-muted">Sáu cách học khác đi một chút — chọn một cái cho hôm nay.</Text>
      <View className="mt-3">
        <Grid columns={3} tabletColumns={3} mobileColumns={2} gap={14}>
          {items.map((it, i) => (
            <Appear key={it.key} index={i} style={{ height: '100%' }}>
              <PressScale onPress={() => router.push(it.href as never)} style={{ height: '100%' }}>
                <StickerCard colors={it.colors} style={{ height: '100%' }}>
                  <View className="h-10 w-10 items-center justify-center rounded-panel bg-white/90">
                    <Icon name={it.icon} size={20} color={it.colors[1]} strokeWidth={1.9} />
                  </View>
                  <Text className="mt-3 font-heavy text-cardTitle text-white" style={INK_SHADOW}>
                    {it.title}
                  </Text>
                  <Text className="mt-1 font-semi text-label text-white" style={[INK_SHADOW, { lineHeight: 18 }]}>
                    {it.note}
                  </Text>
                </StickerCard>
              </PressScale>
            </Appear>
          ))}
        </Grid>
      </View>
    </View>
  );
}
