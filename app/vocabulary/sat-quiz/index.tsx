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
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge, type BadgeIcon } from '@/components/illust/Cute';
import { CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

const LEVEL_BADGE: readonly BadgeIcon[] = ['check', 'target', 'bolt'];

/** Tên mức và việc phải làm bằng tiếng Anh (bản tiếng Việt: `SAT_QUIZ_LEVELS` trong services). */
const LEVEL_EN: Record<number, { name: string; task: string }> = {
  1: { name: 'Easy', task: 'See the word, pick its Vietnamese meaning' },
  2: { name: 'Medium', task: 'Read the English definition, pick the word' },
  3: { name: 'Hard', task: 'Fill in the sentence, find synonyms / antonyms' },
};

const GROUP_LABEL_EN: Record<string, string> = {
  verbal: 'SAT Verbal · by meaning topic',
  math: 'SAT Math · question terms',
};

/**
 * ÔN TỪ VỰNG SAT — chọn chủ đề, rồi đi ba mức Dễ → Vừa → Khó.
 *
 * Không khoá cứng mức sau: người đã biết từ muốn nhảy thẳng mức Khó thì cứ
 * nhảy. Nhưng mức nên làm tiếp được tô sáng, và số điểm là điểm THẬT của lượt
 * cao nhất — chưa làm thì ghi "chưa làm", không ghi 0/10.
 */

const LEVEL_TONE = ['#22C55E', '#B07A3A', '#F43F5E'] as const;
const INK = '#1E2748';
const MUTED = '#5A6485';

export default function SatQuizHub() {
  const best = useSatQuizStore((s) => s.best);
  const { L, en } = useL();
  const totalWords = SAT_QUIZ_TOPICS.reduce((n, t) => n + t.lessons.reduce((m, l) => m + l.words.length, 0), 0);
  const doneTopics = SAT_QUIZ_TOPICS.flatMap((t) => t.lessons).filter((l) => {
    const b = best[satQuizKey(l.slug, 3)];
    return b && passed(b.score, b.total);
  }).length;
  const topicCount = SAT_QUIZ_TOPICS.reduce((n, t) => n + t.lessons.length, 0);

  return (
    <Screen>
      <Appear>
        <View className="flex-row items-center gap-3">
          <Text className="min-w-0 flex-1 font-heavy text-pageTitle" style={{ color: INK }}>
            {L('Ôn từ vựng SAT', 'SAT vocabulary review')}
          </Text>
          <View aria-hidden>
            <PageStickers scene="vocab" />
          </View>
        </View>
        <Text className="mt-1 font-sans text-bodyLg" style={{ color: INK, opacity: 0.8, maxWidth: 680 }}>
          {L(
            `${topicCount} chủ đề, ${totalWords} từ. Mỗi chủ đề ba mức từ dễ đến khó — đúng từ 80% là qua mức.`,
            `${topicCount} topics, ${totalWords} words. Each topic has three levels, easy to hard — score 80% or more to pass a level.`,
          )}
          {doneTopics > 0 ? L(` Bạn đã qua mức Khó ở ${doneTopics} chủ đề.`, ` You've passed Hard in ${doneTopics} topics.`) : ''}
        </Text>
      </Appear>

      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {SAT_QUIZ_LEVELS.map((l, i) => (
            <View key={l.level} className="flex-row items-center gap-2 rounded-pill bg-white px-3 py-1.5" style={{ borderWidth: 1, borderColor: '#F2EEE6' }}>
              <View aria-hidden>
                <Badge icon={LEVEL_BADGE[i] ?? 'star'} color={LEVEL_TONE[i] ?? '#A8843F'} size={22} />
              </View>
              <Text className="font-strong text-label" style={{ color: INK }}>
                {en ? LEVEL_EN[l.level]!.name : l.name}
              </Text>
              <Text className="font-mid text-label" style={{ color: MUTED }}>
                {en ? LEVEL_EN[l.level]!.task : l.task}
              </Text>
            </View>
          ))}
        </View>
      </Appear>

      {SAT_QUIZ_TOPICS.map((group, gi) => (
        <Appear key={group.subject} index={gi + 2}>
          <View className="mb-3 mt-7 flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name={group.subject === 'math' ? 'grid' : 'letters'} color={group.subject === 'math' ? '#A8843F' : '#F0703F'} size={38} />
            </View>
            <Text className="min-w-0 flex-1 font-heavy text-sectionTitle" style={{ color: INK }}>
              {en ? GROUP_LABEL_EN[group.subject] : group.label}
            </Text>
          </View>
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
  const { L, en } = useL();
  const nextLevel = (SAT_QUIZ_LEVELS.find((_, i) => !(results[i] && passed(results[i]!.score, results[i]!.total)))?.level ?? null) as SatQuizLevel | null;

  return (
    <View
      className="h-full rounded-[20px] bg-white p-4"
      style={{
        borderWidth: 1,
        borderColor: '#F2EEE6',
        ...(Platform.OS === 'web' ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 22px rgba(94, 72, 35,0.07)' } as object) : null),
      }}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: lesson.subject === 'math' ? '#FBF5EC' : '#FEECEF' }}>
          <Icon name={lesson.subject === 'math' ? 'grid' : 'letters'} size={17} color={lesson.subject === 'math' ? '#A8843F' : '#F43F5E'} />
        </View>
        <Text className="font-mid text-label" style={{ color: MUTED }}>
          {L(`${lesson.words.length} từ`, `${lesson.words.length} words`)}
        </Text>
        {nextLevel === null ? (
          <View className="ml-auto flex-row items-center gap-1 rounded-pill px-2 py-0.5" style={{ backgroundColor: '#ECFDF3' }}>
            <Icon name="check" size={11} color="#16A34A" strokeWidth={2.6} />
            <Text className="font-strong text-label" style={{ color: '#15803D' }}>
              {L('Đã qua cả ba mức', 'All three levels passed')}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-2.5 flex-row items-start gap-2">
        <Text className="min-w-0 flex-1 font-heavy" style={{ fontSize: 17, lineHeight: 22, color: INK }} numberOfLines={2}>
          {lesson.title}
        </Text>
        {nextLevel === null ? (
          <View aria-hidden>
            <Motion kind="wobble">
              <Sticker tilt={8}>
                <CuteTrophy size={34} />
              </Sticker>
            </Motion>
          </View>
        ) : results.every((r) => !r) ? (
          <View aria-hidden>
            <Label text={L('Mới', 'New')} color="#B07A3A" ink="#FFFFFF" tilt={5} size={11} />
          </View>
        ) : null}
      </View>
      <Text className="mt-1 font-sans text-label" style={{ color: MUTED }} numberOfLines={2}>
        {lesson.blurb}
      </Text>
      <View className="flex-1" />
      <View className="mt-4 flex-row gap-2">
        {SAT_QUIZ_LEVELS.map((l, i) => {
          const r = results[i];
          const ok = r ? passed(r.score, r.total) : false;
          const suggested = nextLevel === l.level;
          const levelName = en ? LEVEL_EN[l.level]!.name : l.name;
          return (
            <Pressable
              key={l.level}
              accessibilityRole="link"
              accessibilityLabel={
                en
                  ? `${lesson.title}, ${levelName} level${r ? `, best ${r.score}/${r.total}` : ', not attempted'}`
                  : `${lesson.title}, mức ${l.name}${r ? `, cao nhất ${r.score}/${r.total}` : ', chưa làm'}`
              }
              onPress={() => router.push(`/vocabulary/sat-quiz/${lesson.slug}?level=${l.level}` as never)}
              className="flex-1 rounded-xl px-2 py-2"
              style={({ hovered }: { hovered?: boolean }) => ({
                borderWidth: 1.5,
                borderColor: suggested ? LEVEL_TONE[i] : hovered ? '#E0D7C7' : '#F2EEE6',
                backgroundColor: ok ? `${LEVEL_TONE[i]}14` : '#FFFFFF',
                ...(Platform.OS === 'web' ? ({ transition: 'border-color 150ms ease' } as object) : null),
              })}
            >
              <View className="flex-row items-center gap-1">
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: LEVEL_TONE[i] }} />
                <Text className="font-strong text-label" style={{ color: INK }}>
                  {levelName}
                </Text>
                {ok ? <Icon name="check" size={11} color={LEVEL_TONE[i]} strokeWidth={2.8} /> : null}
              </View>
              <Text className="mt-0.5 font-mid" style={{ fontSize: 11.5, color: suggested ? color.primary : MUTED }}>
                {r ? `${r.score}/${r.total}` : suggested ? L('Nên làm', 'Up next') : L('Chưa làm', 'Not started')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
