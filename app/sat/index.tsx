import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Card, Icon, StickerCard, type IconName } from '@/components/ui';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { stickerGradient } from '@/theme/tokens';

/**
 * Cửa vào SAT — chọn nửa Toán hay nửa Ngôn ngữ.
 *
 * Vì sao chen thêm một trang giữa: bài thi Digital SAT có ĐÚNG HAI phần, mỗi
 * phần một nửa số điểm, và người luyện nghĩ theo đúng cấu trúc ấy. Trước đây
 * trang giới thiệu chỉ có thẻ "SAT Math", nên nửa còn lại — vốn cũng nặng ngang
 * — trông như không tồn tại. Gộp thành một thẻ "SAT" rồi tách ở đây phản ánh
 * đúng hình dạng kỳ thi, và chỗ này cũng là nơi duy nhất nói được tỷ trọng của
 * từng nửa.
 */

type Half = {
  icon: IconName;
  colors: readonly [string, string];
  title: string;
  subtitle: string;
  lines: string[];
  badge: string;
  href: string;
};

export default function SatHubScreen() {
  const verbal = useMemo(() => satRwStats(), []);

  const halves: Half[] = [
    {
      icon: 'grid',
      colors: stickerGradient.accent,
      title: 'SAT Math',
      subtitle: 'Một nửa số điểm',
      lines: [
        `${CURRICULUM_TOTALS.sets} bộ đề, đủ 19 kỹ năng Digital SAT`,
        'Đáp án tính bằng code, không do AI đoán',
        'Thi thử hai module có điều hướng độ khó',
      ],
      badge: `${CURRICULUM_TOTALS.questions.toLocaleString('vi-VN')} CÂU`,
      href: '/math',
    },
    {
      icon: 'letters',
      colors: stickerGradient.info,
      title: 'SAT Verbal',
      subtitle: 'Reading & Writing',
      lines: [
        `${verbal.questions} câu, ${verbal.units} unit, đủ 4 mảng đề thật`,
        'Có Cross-Text Connections và Command of Evidence',
        'Mỗi câu giải thích vì sao ba phương án kia sai',
      ],
      badge: `${verbal.questions} CÂU`,
      href: '/sat-rw',
    },
  ];

  return (
    <Screen>
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Digital SAT
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">SAT</Text>
      <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
        Bài thi có hai phần, mỗi phần một nửa số điểm. Chọn nửa bạn muốn luyện — cả hai đều làm
        được ngay, không cần thi thử trước.
      </Text>

      <View className="mt-5">
        <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={16}>
          {halves.map((half) => (
            <HalfCard key={half.href} half={half} />
          ))}
        </Grid>
      </View>

      <Card className="mt-5">
        <Text className="font-strong text-cardTitle text-ink">Chưa biết bắt đầu từ đâu?</Text>
        <Text className="mt-1.5 font-sans text-body text-muted">
          Làm bài chẩn đoán 19 câu của phần Math trước. Nó không chấm điểm — nó vẽ bản đồ xem bạn
          thủng chỗ nào trong 19 kỹ năng, rồi mới giao bài đúng chỗ đó.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/math/diagnostic' as never)}
          className="mt-3 flex-row items-center gap-1.5 self-start rounded-panel bg-primary-600 px-4 py-2.5"
        >
          <Text className="font-semi text-body text-white">Làm bài chẩn đoán</Text>
          <Icon name="arrow-right" size={16} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </Card>
    </Screen>
  );
}

function HalfCard({ half }: { half: Half }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(half.href as never)}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <StickerCard colors={half.colors} style={{ height: '100%' }}>
        <View className="h-12 w-12 items-center justify-center rounded-panel bg-white/90">
          <Icon name={half.icon} size={22} color={half.colors[1]} strokeWidth={1.9} />
        </View>

        <Text className="mt-3 font-heavy text-white" style={{ fontSize: 22 }}>
          {half.title}
        </Text>
        <Text className="mt-0.5 font-semi uppercase tracking-wide text-white/75" style={{ fontSize: 10 }}>
          {half.subtitle}
        </Text>

        <View className="mt-3 gap-1">
          {half.lines.map((line) => (
            <Text key={line} className="font-sans text-body text-white/90">
              {line}
            </Text>
          ))}
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View className="rounded-pill bg-white/25 px-3 py-1">
            <Text className="font-heavy uppercase tracking-wide text-white" style={{ fontSize: 10 }}>
              {half.badge}
            </Text>
          </View>
          <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2} />
        </View>
      </StickerCard>
    </Pressable>
  );
}
