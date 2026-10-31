import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AreaArt } from '@/components/home/AreaArt';
import { PressScale } from '@/components/motion/Motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GlossOrb } from '@/components/ui/GlossOrb';
import { LazyMount } from '@/components/ui/LazyMount';
import { INK, STICKER_TITLE_SHADOW, StickerCard } from '@/components/ui/StickerCard';

/**
 * Thẻ chọn NHÓM bộ từ ở thư viện từ vựng — cùng kiểu với lưới "App có gì" ở trang giới thiệu: mặt gradient,
 * hoạ tiết hình học có quả cầu icon, tên nhóm, viên nhãn đếm số bộ và nút tròn ở đáy.
 * Nhóm đang xem hiện dấu tích thay mũi tên.
 */

/** Tám cặp màu sáng → đậm, cùng bảng với lưới "App có gì"; chia theo thứ tự nên hai thẻ kề nhau không trùng màu. */
export const SOURCE_TONES: readonly (readonly [string, string])[] = [
  ['#B9A9FF', '#6A4BD9'],
  ['#8EC5FF', '#2F6FD6'],
  ['#FFB4A8', '#D9503E'],
  ['#8FE0B0', '#23875E'],
  ['#FFB8D6', '#D9568F'],
  ['#FFD892', '#E08A1E'],
  ['#9AE6E8', '#1F8A96'],
  ['#A7B4FF', '#3446C8'],
];

export function SourceCard({
  index,
  icon,
  title,
  badge,
  selected,
  onPress,
}: {
  /** Thứ tự trong lưới: chọn cặp màu và bố cục hoạ tiết. */
  index: number;
  icon: IconName;
  title: string;
  /** Chữ trong viên nhãn đáy thẻ, ví dụ "50 BỘ". */
  badge: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  // 15 thẻ mà chỉ 8 màu và 8 hoạ tiết: từ vòng thứ hai lệch hoạ tiết đi 5 bậc, nên không hai thẻ nào cùng màu lẫn cùng hình.
  const tone = SOURCE_TONES[index % SOURCE_TONES.length] ?? SOURCE_TONES[0]!;
  const variant = (index + Math.floor(index / SOURCE_TONES.length) * 5) % 8;
  const artHeight = wide ? 80 : 64;

  return (
    <PressScale
      fill
      accessibilityRole="tab"
      accessibilityLabel={`${title}, ${badge}`}
      aria-selected={selected}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <StickerCard colors={tone} style={{ flex: 1 }}>
        <View style={{ height: artHeight, position: 'relative' }}>
          <LazyMount
            style={StyleSheet.absoluteFill}
            placeholder={<LinearGradient colors={[tone[0], tone[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
          >
            <AreaArt tone={tone} variant={variant} />
          </LazyMount>
          <GlossOrb icon={icon} tone={tone} size={wide ? 42 : 36} />
        </View>

        <Text numberOfLines={2} className="font-heavy text-cardTitle text-white" style={[STICKER_TITLE_SHADOW, { marginTop: 8, minHeight: 44 }]}>
          {title}
        </Text>

        <View className="mt-2 flex-row items-center justify-between gap-2">
          <View className="rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(27,24,64,0.62)', flexShrink: 1 }}>
            <Text numberOfLines={1} className="font-heavy text-label text-white" style={{ letterSpacing: 0.6 }}>
              {badge}
            </Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-pill bg-white">
            <Icon name={selected ? 'check' : 'arrow-right'} size={15} color={selected ? tone[1] : INK} strokeWidth={2.6} />
          </View>
        </View>
      </StickerCard>
    </PressScale>
  );
}
