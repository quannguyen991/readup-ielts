import React from 'react';
import { Pressable, Text, View } from 'react-native';
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

      <View className="mt-6 gap-3">
        {PATH_STEPS.map((step, i) => (
          <StepRow key={step.id} step={step} tone={STEP_TONES[i] as string} />
        ))}
      </View>
    </Screen>
  );
}

function StepRow({ step, tone }: { step: PathStep; tone: string }) {
  const topics = topicsForStep(step);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bước ${step.order}: ${step.title}`}
      onPress={() => router.push(`/write/translation/${step.id}` as never)}
      className="flex-row overflow-hidden rounded-card bg-white"
      style={{ borderWidth: 1.5, borderColor: '#0F172A' }}
    >
      <View style={{ width: 9, backgroundColor: tone }} />

      <View className="flex-1 flex-row items-center gap-3 p-4">
        <View
          className="h-11 w-11 items-center justify-center rounded-panel"
          style={{ backgroundColor: `${tone}1A`, borderWidth: 2, borderColor: tone }}
        >
          <Text className="font-heavy text-cardTitle" style={{ color: tone }}>
            {step.order}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-strong text-cardTitle text-ink">{step.title}</Text>
            {step.badge ? (
              <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: `${tone}1A` }}>
                <Text className="font-heavy text-label" style={{ color: tone, fontSize: 10, letterSpacing: 0.6 }}>
                  {step.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1 font-sans text-label text-muted">{step.blurb}</Text>
        </View>

        <View className="items-end">
          <Text className="font-semi text-label text-muted">{topics.length} mục</Text>
          <Text className="mt-0.5 font-sans text-label text-muted" style={{ opacity: 0.75 }}>
            {stepUnits(step).toLocaleString('vi-VN')} lượt
          </Text>
        </View>

        <Icon name="chevron-right" size={16} color={color.muted} />
      </View>
    </Pressable>
  );
}
