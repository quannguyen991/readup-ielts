import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Icon } from '@/components/ui';
import {
  PATH_STEPS,
  getStep,
  topicsForStep,
  type PathTopic,
} from '@/services/writing/translation-path';
import { color } from '@/theme/tokens';

/**
 * Các mục luyện trong MỘT bước.
 *
 * Thanh chọn bước nằm ngay đầu màn chứ không bắt quay ra danh sách rồi vào lại:
 * người đang luyện Bước 1 muốn ngó Bước 2 có gì là chuyện thường, và bắt họ đi
 * hai cú bấm cho một cú liếc là bắt sai chỗ.
 */

const STEP_TONES: Record<string, string> = {
  structure: '#0EA5E9',
  topic: '#6366F1',
  'para-65': '#8B5CF6',
  'para-80': '#D946EF',
  essay: '#F43F5E',
};

export default function TranslationStepScreen() {
  const { stepId } = useLocalSearchParams<{ stepId: string }>();
  const step = typeof stepId === 'string' ? getStep(stepId) : undefined;

  if (!step) {
    return (
      <Screen>
        <Text className="font-strong text-cardTitle text-ink">Không có bước này.</Text>
        <Button
          className="mt-4"
          label="Về lộ trình dịch"
          onPress={() => router.replace('/write/translation' as never)}
        />
      </Screen>
    );
  }

  const tone = STEP_TONES[step.id] ?? color.primary;
  const topics = topicsForStep(step);

  return (
    <Screen>
      <Pressable
        onPress={() => router.push('/write/translation' as never)}
        className="flex-row items-center gap-1.5"
      >
        <Icon name="chevron-left" size={16} color={color.muted} />
        <Text className="font-semi text-body text-muted">Danh sách bước</Text>
      </Pressable>

      {/* Thanh chọn bước — cuộn ngang ở khổ hẹp thay vì xuống dòng thành hai hàng. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {PATH_STEPS.map((s) => {
          const active = s.id === step.id;
          const t = STEP_TONES[s.id] ?? color.primary;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => router.replace(`/write/translation/${s.id}` as never)}
              className="rounded-panel px-3 py-2"
              style={{
                borderWidth: 2,
                borderColor: active ? t : '#0F172A',
                backgroundColor: active ? t : '#fff',
              }}
            >
              <Text
                className="font-heavy text-label"
                style={{ color: active ? '#fff' : color.muted, fontSize: 10, letterSpacing: 0.8 }}
              >
                BƯỚC {s.order}
              </Text>
              <Text
                className="font-semi text-label"
                style={{ color: active ? '#fff' : color.ink }}
              >
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="mt-5 font-heavy text-pageTitle text-ink">{step.title}</Text>
      <Text className="mt-1 font-sans text-body text-muted" style={{ maxWidth: 640 }}>
        {step.blurb}
      </Text>

      <Text className="mt-6 font-heavy text-label text-muted" style={{ letterSpacing: 1.2 }}>
        {topics.length} MỤC
      </Text>

      <View className="mt-3 gap-2.5">
        {topics.map((topic) => (
          <TopicRow key={topic.id} topic={topic} tone={tone} />
        ))}
      </View>
    </Screen>
  );
}

function TopicRow({ topic, tone }: { topic: PathTopic; tone: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={topic.title}
      onPress={() => router.push(topic.href as never)}
      className="flex-row items-center gap-3 rounded-card px-4 py-3.5"
      style={{ borderWidth: 1.5, borderColor: tone, backgroundColor: `${tone}0D` }}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-panel bg-white"
        style={{ borderWidth: 1.5, borderColor: tone }}
      >
        <Text className="font-heavy text-body" style={{ color: tone }}>
          {topic.index}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="font-strong text-body text-ink">{topic.title}</Text>
        {topic.subtitle ? (
          <Text className="mt-0.5 font-sans text-label text-muted">{topic.subtitle}</Text>
        ) : null}
      </View>

      <Text className="font-semi text-label" style={{ color: tone }}>
        {topic.units} lượt
      </Text>
      <Icon name="chevron-right" size={15} color={tone} />
    </Pressable>
  );
}
