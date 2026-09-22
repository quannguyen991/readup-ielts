import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { PATH_STEPS, stepUnits, topicsForStep, type PathStep } from '@/services/writing/translation-path';
import { color } from '@/theme/tokens';

/**
 * Năm bước của lộ trình luyện dịch.
 *
 * Màn này chỉ trả lời một câu: BẮT ĐẦU TỪ ĐÂU. Nên nó không có gì ngoài năm thẻ
 * xếp dọc, và mỗi thẻ chỉ mang đúng ba thứ — bước mấy, làm gì, bao nhiêu lượt.
 *
 * Số lượt đếm từ dữ liệu thật lúc dựng màn, không gõ tay. Trang giới thiệu một
 * lộ trình là chỗ dễ nói quá nhất, và cũng là chỗ bị bắt quả tang nhanh nhất.
 */

/** Màu đi theo thứ tự bước, để nhìn dải màu là biết đang ở đoạn nào của đường. */
const STEP_TONES = ['#0EA5E9', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'] as const;

export default function TranslationPathScreen() {
  const wide = useWindowDimensions().width >= 1100;

  return (
    <Screen>
      <Pressable
        onPress={() => router.push('/write' as never)}
        className="flex-row items-center gap-1.5"
      >
        <Icon name="chevron-left" size={16} color={color.muted} />
        <Text className="font-semi text-body text-muted">Writing</Text>
      </Pressable>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">Luyện dịch</Text>
      <Text className="mt-1 font-sans text-bodyLg text-muted">
        Tái tạo đúng câu mẫu, từng từ một. Mỗi bước dài thêm một bậc.
      </Text>

      <View className="mt-8 flex-row flex-wrap gap-4">
        {PATH_STEPS.map((step, i) => (
          <StepRow key={step.id} step={step} tone={STEP_TONES[i] as string} wide={wide} />
        ))}
      </View>
    </Screen>
  );
}

function StepRow({ step, tone, wide }: { step: PathStep; tone: string; wide: boolean }) {
  const topics = topicsForStep(step);
  const icon = (['book', 'letters', 'pencil', 'clipboard', 'note'] as const)[step.order - 1] ?? 'book';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bước ${step.order}: ${step.title}`}
      onPress={() => router.push(`/write/translation/${step.id}` as never)}
      className="overflow-visible rounded-card bg-white/85"
      style={{
        flexGrow: 1,
        flexBasis: wide ? 170 : 260,
        minWidth: wide ? 170 : 240,
        minHeight: 350,
        borderWidth: 1.5,
        borderColor: tone,
        shadowColor: tone,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 5,
      }}
    >
      <View
        className="absolute -top-7 left-1/2 h-14 w-14 -translate-x-1/2 items-center justify-center rounded-pill"
        style={{ backgroundColor: tone, borderWidth: 1.5, borderColor: '#FFFFFF' }}
      >
        <Text className="font-heavy text-hero text-white" style={{ fontSize: 28 }}>
          {step.order}
        </Text>
      </View>

      <View className="flex-1 items-center px-4 pb-4 pt-12">
        <View
          className="h-14 w-14 items-center justify-center rounded-panel"
          style={{ backgroundColor: `${tone}16` }}
        >
          <Icon name={icon} size={30} color={tone} strokeWidth={1.6} />
        </View>

        <View className="mt-4 min-h-[72px] items-center">
          <Text className="text-center font-heavy text-cardTitle text-ink">{step.title}</Text>
          {step.badge ? (
            <View className="mt-1 rounded-pill px-2 py-0.5" style={{ backgroundColor: `${tone}1A` }}>
              <Text className="font-heavy text-label" style={{ color: tone, fontSize: 10, letterSpacing: 0.6 }}>
                {step.badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-2 text-center font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
          {step.blurb}
        </Text>

        <View className="mt-auto w-full rounded-panel bg-white/75 px-3 py-2">
          <Text className="font-sans text-label text-paper-body">
            Mục lục: <Text className="font-heavy text-paper-ink">{topics.length}</Text>
          </Text>
          <Text className="mt-0.5 font-sans text-label text-paper-body">
            Lượt học: <Text className="font-heavy text-paper-ink">{stepUnits(step).toLocaleString('vi-VN')}</Text>
          </Text>
        </View>

        <View className="absolute bottom-3 right-3">
          <Icon name="chevron-right" size={17} color={tone} strokeWidth={2.2} />
        </View>
      </View>
    </Pressable>
  );
}
