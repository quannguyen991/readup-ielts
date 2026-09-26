import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import type { VocabLesson } from '@/data/lessons/vocab-lessons';
import { passed, SAT_QUIZ_LEVELS, SAT_QUIZ_TOPICS, type SatQuizLevel } from '@/services/vocab/sat-quiz';
import { satQuizKey, useSatQuizStore, type SatQuizBest } from '@/store/useSatQuizStore';
import { color } from '@/theme/tokens';

/**
 * ÔN TỪ VỰNG SAT — chọn chủ đề, rồi đi ba mức Dễ → Vừa → Khó.
 *
 * Không khoá cứng mức sau: người đã biết từ muốn nhảy thẳng mức Khó thì cứ
 * nhảy. Nhưng mức nên làm tiếp được tô sáng, và số điểm là điểm THẬT của lượt
 * cao nhất — chưa làm thì ghi "chưa làm", không ghi 0/10.
 */

const LEVEL_TONE = ['#22C55E', '#0EA5E9', '#F43F5E'] as const;
const INK = '#1E2748';
const MUTED = '#5A6485';

export default function SatQuizHub() {
  const best = useSatQuizStore((s) => s.best);
  const totalWords = SAT_QUIZ_TOPICS.reduce((n, t) => n + t.lessons.reduce((m, l) => m + l.words.length, 0), 0);
  const doneTopics = SAT_QUIZ_TOPICS.flatMap((t) => t.lessons).filter((l) => {
    const b = best[satQuizKey(l.slug, 3)];
    return b && passed(b.score, b.total);
  }).length;
  const topicCount = SAT_QUIZ_TOPICS.reduce((n, t) => n + t.lessons.length, 0);

  return (
    <Screen>
      <Appear>
        <Text className="font-heavy text-pageTitle" style={{ color: INK }}>
          Ôn từ vựng SAT
        </Text>
        <Text className="mt-1 font-sans text-bodyLg" style={{ color: INK, opacity: 0.8, maxWidth: 680 }}>
          {topicCount} chủ đề, {totalWords} từ. Mỗi chủ đề ba mức từ dễ đến khó — đúng từ 80% là qua mức.
          {doneTopics > 0 ? ` Bạn đã qua mức Khó ở ${doneTopics} chủ đề.` : ''}
        </Text>
      </Appear>

      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {SAT_QUIZ_LEVELS.map((l, i) => (
            <View key={l.level} className="flex-row items-center gap-2 rounded-pill bg-white px-3 py-1.5" style={{ borderWidth: 1, borderColor: '#E6E8F2' }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: LEVEL_TONE[i] }} />
              <Text className="font-strong text-label" style={{ color: INK }}>
                {l.name}
              </Text>
              <Text className="font-mid text-label" style={{ color: MUTED }}>
                {l.task}
              </Text>
            </View>
          ))}
        </View>
      </Appear>

      {SAT_QUIZ_TOPICS.map((group, gi) => (
        <Appear key={group.subject} index={gi + 2}>
          <Text className="mb-3 mt-7 font-heavy text-sectionTitle" style={{ color: INK }}>
            {group.label}
          </Text>
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
            {group.lessons.map((lesson) => (
              <TopicCard key={lesson.slug} lesson={lesson} best={best} />
            ))}
          </Grid>
        </Appear>
      ))}
      <View className="h-8" />
    </Screen>
  );
}

function TopicCard({ lesson, best }: { lesson: VocabLesson; best: Record<string, SatQuizBest> }) {
  const results = SAT_QUIZ_LEVELS.map((l) => best[satQuizKey(lesson.slug, l.level)]);
  const nextLevel = (SAT_QUIZ_LEVELS.find((_, i) => !(results[i] && passed(results[i]!.score, results[i]!.total)))?.level ?? null) as SatQuizLevel | null;

  return (
    <View
      className="h-full rounded-[20px] bg-white p-4"
      style={{
        borderWidth: 1,
        borderColor: '#E6E8F2',
        ...(Platform.OS === 'web' ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 22px rgba(30,41,99,0.07)' } as object) : null),
      }}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: lesson.subject === 'math' ? '#EEEFFE' : '#FEECEF' }}>
          <Icon name={lesson.subject === 'math' ? 'grid' : 'letters'} size={17} color={lesson.subject === 'math' ? '#6366F1' : '#F43F5E'} />
        </View>
        <Text className="font-mid text-label" style={{ color: MUTED }}>
          {lesson.words.length} từ
        </Text>
        {nextLevel === null ? (
          <View className="ml-auto flex-row items-center gap-1 rounded-pill px-2 py-0.5" style={{ backgroundColor: '#ECFDF3' }}>
            <Icon name="check" size={11} color="#16A34A" strokeWidth={2.6} />
            <Text className="font-strong text-label" style={{ color: '#15803D' }}>
              Đã qua cả ba mức
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-2.5 font-heavy" style={{ fontSize: 17, lineHeight: 22, color: INK }} numberOfLines={2}>
        {lesson.title}
      </Text>
      <Text className="mt-1 font-sans text-label" style={{ color: MUTED }} numberOfLines={2}>
        {lesson.blurb}
      </Text>
      <View className="flex-1" />
      <View className="mt-4 flex-row gap-2">
        {SAT_QUIZ_LEVELS.map((l, i) => {
          const r = results[i];
          const ok = r ? passed(r.score, r.total) : false;
          const suggested = nextLevel === l.level;
          return (
            <Pressable
              key={l.level}
              accessibilityRole="link"
              accessibilityLabel={`${lesson.title}, mức ${l.name}${r ? `, cao nhất ${r.score}/${r.total}` : ', chưa làm'}`}
              onPress={() => router.push(`/vocabulary/sat-quiz/${lesson.slug}?level=${l.level}` as never)}
              className="flex-1 rounded-xl px-2 py-2"
              style={({ hovered }: { hovered?: boolean }) => ({
                borderWidth: 1.5,
                borderColor: suggested ? LEVEL_TONE[i] : hovered ? '#C7CCE0' : '#E6E8F2',
                backgroundColor: ok ? `${LEVEL_TONE[i]}14` : '#FFFFFF',
                ...(Platform.OS === 'web' ? ({ transition: 'border-color 150ms ease' } as object) : null),
              })}
            >
              <View className="flex-row items-center gap-1">
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: LEVEL_TONE[i] }} />
                <Text className="font-strong text-label" style={{ color: INK }}>
                  {l.name}
                </Text>
                {ok ? <Icon name="check" size={11} color={LEVEL_TONE[i]} strokeWidth={2.8} /> : null}
              </View>
              <Text className="mt-0.5 font-mid" style={{ fontSize: 11.5, color: suggested ? color.primary : MUTED }}>
                {r ? `${r.score}/${r.total}` : suggested ? 'Nên làm' : 'Chưa làm'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
