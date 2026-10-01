import React from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Icon, StickerCard, type IconName } from '@/components/ui';
import { GlowStars } from '@/components/ui/GlowStars';
import { STICKER_TEXT_SHADOW, STICKER_TITLE_SHADOW } from '@/components/ui/StickerCard';
import { weekId } from '@/services/weekly/challenge';
import { useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useShadowStore } from '@/store/useShadowStore';
import { useDueCards } from '@/store/useVocabStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { stickerGradient } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

type Shelf = {
  key: string;
  title: string;
  note: string;
  href: string;
  icon: IconName;
  colors: readonly [string, string];
};

/**
 * KỆ "MỚI TRÊN BAND 9" ở trang Hôm nay: một lối vào cho mỗi cách học mới, mỗi
 * thẻ nói luôn trạng thái của CHÍNH người học (tuần này làm đề chưa, bao nhiêu
 * cây đang chờ tưới…) thay vì một câu quảng cáo chung chung.
 */
export function FeatureShelf() {
  const week = useWeeklyStore((s) => s.results[weekId()]);
  const read = useShadowStore((s) => Object.values(s.best).reduce((n, l) => n + Object.keys(l).length, 0));
  const decks = useCustomDeckStore((s) => Object.keys(s.decks).length);
  const due = useDueCards().length;
  const { L } = useL();

  const items: Shelf[] = [
    {
      key: 'weekly',
      title: L('Đề của tuần', 'Weekly challenge'),
      note: week
        ? L(`Tuần này: ${week.score}/${week.total} câu — xem mình đứng thứ mấy`, `This week: ${week.score}/${week.total} — see where you rank`)
        : L('Tuần này chưa làm · 10 câu, mọi người cùng một đề', 'Not done this week · 10 questions, same test for everyone'),
      href: '/weekly',
      icon: 'trophy',
      colors: stickerGradient.warning,
    },
    {
      key: 'duel',
      title: L('Đấu 1–1', '1-on-1 duel'),
      note: L('Thách bạn 10 câu từ vựng, điểm hai bên chạy trực tiếp', 'Challenge a friend to 10 vocab questions with live scores'),
      href: '/duel',
      icon: 'target',
      colors: stickerGradient.rose,
    },
    {
      key: 'shadow',
      title: L('Đọc theo VOA', 'Shadow VOA'),
      note: read
        ? L(`Đã đọc ${read} câu — đọc tiếp bài dở`, `${read} sentences read — pick up where you left off`)
        : L('Nói lại từng câu, máy tô từ nào bạn đọc rõ', 'Repeat each sentence; the app highlights the words you said clearly'),
      href: '/shadow',
      icon: 'mic',
      colors: stickerGradient.accent,
    },
    {
      key: 'garden',
      title: L('Vườn từ', 'Word garden'),
      note: due ? L(`${due} cây đang chờ tưới`, `${due} plants need watering`) : L('Mỗi từ là một cây — ôn đều thì vườn xanh', 'Every word is a plant — review regularly to keep it green'),
      href: '/vocabulary/garden',
      icon: 'leaf',
      colors: stickerGradient.success,
    },
    {
      key: 'import',
      title: L('Học từ bài bạn thích', 'Learn from what you love'),
      note: decks ? L(`${decks} bộ từ bạn đã tạo`, `${decks} word sets created`) : L('Dán một đoạn văn, app lọc ra từ đáng học', 'Paste a passage and the app picks out words worth learning'),
      href: '/vocabulary/import',
      icon: 'plus',
      colors: stickerGradient.info,
    },
    {
      key: 'errors',
      title: L('Hồ sơ lỗi', 'Error profile'),
      note: L('Lỗi nào đang lặp lại, và sửa bằng bài nào', 'Which mistakes keep coming back, and which lessons fix them'),
      href: '/errors',
      icon: 'gauge',
      colors: stickerGradient.primary,
    },
  ];

  return (
    <View className="mt-6">
      <Text className="font-heavy text-sectionTitle text-ink">{L('Mới trên Band 9', 'New on Band 9')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">{L('Sáu cách học khác đi một chút — chọn một cái cho hôm nay.', 'Six slightly different ways to learn — pick one for today.')}</Text>
      <View className="mt-3">
        <Grid columns={3} tabletColumns={3} mobileColumns={2} gap={16}>
          {items.map((it, i) => (
            <Appear key={it.key} index={i} style={{ flex: 1 }}>
              <PressScale fill onPress={() => router.push(it.href as never)} style={{ flex: 1 }}>
                <StickerCard colors={it.colors} style={{ flex: 1 }} ornament={<GlowStars scale={0.8} />}>
                  <View
                    className="h-10 w-10 items-center justify-center rounded-panel bg-white"
                    style={Platform.OS === 'web' ? ({ boxShadow: '0 2px 6px rgba(15,23,42,0.18)' } as object) : undefined}
                  >
                    <Icon name={it.icon} size={19} color={it.colors[1]} strokeWidth={2} />
                  </View>
                  <Text className="mt-3 font-heavy text-cardTitle text-white" style={STICKER_TITLE_SHADOW}>
                    {it.title}
                  </Text>
                  <Text className="mt-1 font-semi text-label text-white" style={[STICKER_TEXT_SHADOW, { lineHeight: 18 }]}>
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
