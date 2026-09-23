import React from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Gem3D, type Cut, type GemColor } from '@/components/three/Gem3D';
import { Icon, StickerCard, type IconName } from '@/components/ui';
import { INK, STICKER_TEXT_SHADOW, STICKER_TITLE_SHADOW } from '@/components/ui/StickerCard';
import { weekId } from '@/services/weekly/challenge';
import { useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useShadowStore } from '@/store/useShadowStore';
import { useDueCards } from '@/store/useVocabStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { stickerGradient } from '@/theme/tokens';

type Shelf = {
  key: string;
  title: string;
  note: string;
  href: string;
  icon: IconName;
  colors: readonly [string, string];
  /** Viên đá quý 3D ở góc thẻ, màu đá tương phản với nền thẻ. */
  gem: { cut: Cut; color: GemColor; companion?: GemColor };
};

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
      gem: { cut: 'princess', color: 'sapphire' },
    },
    {
      key: 'duel',
      title: 'Đấu 1–1',
      note: 'Thách bạn 10 câu từ vựng, điểm hai bên chạy trực tiếp',
      href: '/duel',
      icon: 'target',
      colors: stickerGradient.rose,
      gem: { cut: 'brilliant', color: 'clear', companion: 'ruby' },
    },
    {
      key: 'shadow',
      title: 'Đọc theo VOA',
      note: read ? `Đã đọc ${read} câu — đọc tiếp bài dở` : 'Nói lại từng câu, máy tô từ nào bạn đọc rõ',
      href: '/shadow',
      icon: 'mic',
      colors: stickerGradient.accent,
      gem: { cut: 'oval', color: 'emerald' },
    },
    {
      key: 'garden',
      title: 'Vườn từ',
      note: due ? `${due} cây đang chờ tưới` : 'Mỗi từ là một cây — ôn đều thì vườn xanh',
      href: '/vocabulary/garden',
      icon: 'leaf',
      colors: stickerGradient.success,
      gem: { cut: 'brilliant', color: 'pink' },
    },
    {
      key: 'import',
      title: 'Học từ bài bạn thích',
      note: decks ? `${decks} bộ từ bạn đã tạo` : 'Dán một đoạn văn, app lọc ra từ đáng học',
      href: '/vocabulary/import',
      icon: 'plus',
      colors: stickerGradient.info,
      gem: { cut: 'emerald', color: 'topaz' },
    },
    {
      key: 'errors',
      title: 'Hồ sơ lỗi',
      note: 'Lỗi nào đang lặp lại, và sửa bằng bài nào',
      href: '/errors',
      icon: 'gauge',
      colors: stickerGradient.primary,
      gem: { cut: 'brilliant', color: 'clear' },
    },
  ];

  return (
    <View className="mt-6">
      <Text className="font-heavy text-sectionTitle text-ink">Mới trên ReadUp</Text>
      <Text className="mt-1 font-sans text-body text-muted">Sáu cách học khác đi một chút — chọn một cái cho hôm nay.</Text>
      {/* Khoảng trống rộng: vật thể 3D nhô qua mép trên của thẻ. */}
      <View className="mt-7">
        <Grid columns={3} tabletColumns={3} mobileColumns={2} gap={24}>
          {items.map((it, i) => (
            <Appear key={it.key} index={i} style={{ flex: 1 }}>
              <PressScale fill onPress={() => router.push(it.href as never)} style={{ flex: 1 }}>
                <StickerCard colors={it.colors} style={{ flex: 1 }} ornament={<Gem3D cut={it.gem.cut} color={it.gem.color} companion={it.gem.companion} size={88} />}>
                  <View
                    className="h-10 w-10 items-center justify-center rounded-panel bg-white"
                    style={{ borderWidth: 2, borderColor: INK, ...(Platform.OS === 'web' ? ({ boxShadow: `1px 2.5px 0 ${INK}` } as object) : null) }}
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
