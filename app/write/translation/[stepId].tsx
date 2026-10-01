import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { BilingualLines, LessonCard } from '@/components/sentence/LessonCard';
import { Button, Icon } from '@/components/ui';
import { SENTENCE_DIFFICULTY_LABEL } from '@/data/sentence-drills';
import {
  PATH_STEPS,
  getStep,
  topicsForStep,
  type PathTopic,
} from '@/services/writing/translation-path';
import { useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { STEP_EN } from '@/components/writing/translation-step-en';

const DIFFICULTY_EN: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Tên nhóm cấu trúc của Bước 1 khi giao diện tiếng Anh (tra theo id nhóm). */
const STRUCTURE_EN: Record<string, string> = {
  passive: 'Passive voice',
  conditional: 'Conditionals',
  relative: 'Relative clauses',
  comparison: 'Comparisons',
  perfect: 'Perfect tenses',
  continuous: 'Continuous tenses',
  past: 'Past tenses',
  present: 'Present simple',
};

/**
 * Các mục luyện trong MỘT bước.
 *
 * Thanh chọn bước nằm ngay đầu màn chứ không bắt quay ra danh sách rồi vào lại:
 * người đang luyện Bước 1 muốn ngó Bước 2 có gì là chuyện thường, và bắt họ đi
 * hai cú bấm cho một cú liếc là bắt sai chỗ.
 *
 * Mục luyện là THẺ BÀI (`LessonCard`, cùng thẻ với thư viện Dịch câu) xếp lưới,
 * không phải hàng dọc "ô số + tên + số lượt + mũi tên" — kiểu hàng đó là dáng
 * của IELTS Dictionary, người dùng bắt bỏ ngày 25/09/2026. Dấu vân trên thẻ vẽ
 * từ chính các lượt của mục: bước dịch đoạn thì vạch dài hơn hẳn bước một câu.
 */

const STEP_TONES: Record<string, string> = {
  structure: '#B07A3A',
  topic: '#D7B67D',
  'para-65': '#D6B57C',
  'para-80': '#D946EF',
  essay: '#F43F5E',
};

export default function TranslationStepScreen() {
  const { stepId } = useLocalSearchParams<{ stepId: string }>();
  const step = typeof stepId === 'string' ? getStep(stepId) : undefined;
  const { L, en } = useL();

  if (!step) {
    return (
      <Screen>
        <Text className="font-strong text-cardTitle text-ink">{L('Không có bước này.', "This step doesn't exist.")}</Text>
        <Button
          className="mt-4"
          label={L('Về lộ trình dịch', 'Back to translation path')}
          onPress={() => router.replace('/write/translation' as never)}
        />
      </Screen>
    );
  }

  const topics = topicsForStep(step);

  return (
    <Screen>
      <Pressable
        onPress={() => router.push('/write/translation' as never)}
        className="flex-row items-center gap-1.5"
      >
        <Icon name="chevron-left" size={16} color={color.ink} />
        <Text className="font-semi text-body text-ink">{L('Danh sách bước', 'All steps')}</Text>
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
                borderColor: active ? t : '#F2EEE6',
                backgroundColor: active ? t : '#fff',
              }}
            >
              <Text
                className="font-heavy text-label"
                style={{ color: active ? '#fff' : color.muted, fontSize: 10, letterSpacing: 0.8 }}
              >
                {L('BƯỚC', 'STEP')} {s.order}
              </Text>
              <Text
                className="font-semi text-label"
                style={{ color: active ? '#fff' : color.ink }}
              >
                {(en ? STEP_EN[s.id]?.title : undefined) ?? s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="mt-5 font-heavy text-pageTitle text-ink">{(en ? STEP_EN[step.id]?.title : undefined) ?? step.title}</Text>
      <Text className="mt-1 font-sans text-body text-ink" style={{ maxWidth: 640, opacity: 0.82 }}>
        {(en ? STEP_EN[step.id]?.blurb : undefined) ?? step.blurb}
      </Text>

      <Text className="mt-6 font-heavy text-label text-ink" style={{ letterSpacing: 1.2, opacity: 0.75 }}>
        {L(`${topics.length} MỤC`, `${topics.length} SETS`)}
      </Text>

      <View className="mt-3">
        <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} chunk={step.chunk} structure={step.id === 'structure'} />
          ))}
        </Grid>
      </View>
    </Screen>
  );
}

function TopicCard({ topic, chunk, structure }: { topic: PathTopic; chunk: number; structure: boolean }) {
  const sessions = useSentenceStore((s) => s.sessions);
  const { L, en } = useL();
  const structureEn = en && structure ? STRUCTURE_EN[topic.id] : undefined;
  const done = useMemo(
    () => (topic.setId ? sessions.filter((x) => x.mode === 'translation' && x.setId === topic.setId).length : 0),
    [sessions, topic.setId],
  );
  const meta: { icon: 'list' | 'grid'; label: string }[] = [{ icon: 'list', label: L(`${topic.units} lượt`, `${topic.units} rounds`) }];
  if (chunk > 1) meta.push({ icon: 'grid', label: L(`${chunk} câu mỗi lượt`, `${chunk} sentences per round`) });

  return (
    <LessonCard
      number={topic.index}
      level={topic.level ?? 'B1'}
      levelLabel={
        topic.level
          ? en
            ? (DIFFICULTY_EN[topic.level] ?? SENTENCE_DIFFICULTY_LABEL[topic.level])
            : SENTENCE_DIFFICULTY_LABEL[topic.level]
          : L('Cấu trúc câu', 'Sentence structure')
      }
      icon="languages"
      title={structureEn ?? topic.title}
      blurb={structureEn ? `Every ${structureEn.toLowerCase()} sentence in the bank, drawn from all topics.` : topic.blurb}
      meta={meta}
      done={done}
      visual={(tone, active) => <BilingualLines pairs={topic.sample} tone={tone} active={active} />}
      onPress={() => router.push(topic.href as never)}
    />
  );
}
