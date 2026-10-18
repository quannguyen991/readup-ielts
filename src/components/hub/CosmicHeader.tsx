import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useHubStore } from '@/store/useHubStore';
import { useStreak } from '@/store/useStudyStore';

type CosmicHeaderProps = {
  title: string;
  backHref?: string;
  showStats?: boolean;
};

export function CosmicHeader({ title, backHref, showStats = true }: CosmicHeaderProps) {
  const { current: studyStreak } = useStreak();
  const hubStreak = useHubStore((s) => s.streakCount);
  const gems = useHubStore((s) => s.gems);
  const streak = Math.max(studyStreak, hubStreak, 0);

  return (
    <View className="mb-4 flex-row items-center justify-between pt-1 pb-2">
      {/* Bên trái: Nút quay lại hoặc Tiêu đề */}
      <View className="flex-row items-center gap-3">
        {backHref ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(backHref as never)}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#1A1C3F] active:opacity-70"
          >
            <Icon name="chevron-left" size={20} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        ) : null}
        <Text className="font-heavy text-[24px] tracking-tight text-white">{title}</Text>
      </View>

      {/* Bên phải: Flame, Gem, Trophy khớp ảnh 1 & 2 */}
      {showStats ? (
        <View className="flex-row items-center gap-3.5">
          {/* Flame (Ngọn lửa chuỗi ngày) */}
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[17px]">🔥</Text>
            <Text className="font-heavy text-[14px] text-white">{streak}</Text>
          </View>

          {/* Purple Gem (Đá quý tím) */}
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[16px]">💎</Text>
            <Text className="font-heavy text-[14px] text-white">{gems || 10}</Text>
          </View>

          {/* Trophy (Cúp vàng) */}
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[16px]">🏆</Text>
            <Text className="font-heavy text-[14px] text-amber-300">10000+</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
