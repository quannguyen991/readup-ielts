import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { LEVEL_TONE, levelLabel } from './LessonView';
import { useL } from '@/i18n/useL';
import type { TheoryLesson } from '@/data/lessons/types';
import type { VocabLesson } from '@/data/lessons/vocab-lessons';
import { masteredCount, useTopicStudyStore } from '@/store/useTopicStudyStore';
import { lessonKey, useLessonStore } from '@/store/useLessonStore';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 22px rgba(94, 72, 35,0.08)' } as object;

/**
 * Trang "Bài học" của một môn SAT: hai tab — LÝ THUYẾT (mỗi kỹ năng một bài,
 * gom theo domain) và TỪ VỰNG (kho từ chia thành bài 6–13 từ).
 *
 * Giống Khan Academy ở chỗ bài học đi theo đúng tên kỹ năng College Board, để
 * người học tra tài liệu tiếng Anh cũng khớp; khác ở chỗ mỗi bài có đường thẳng
 * sang bộ đề của chính kỹ năng đó, không phải tự đi tìm.
 */
export function LessonHub({
  subject,
  title,
  blurb,
  backHref,
  backLabel,
  groups,
  vocab,
  initialTab = 'theory',
}: {
  subject: 'math' | 'verbal';
  title: string;
  blurb: string;
  backHref: string;
  backLabel: string;
  groups: { domain: string; lessons: TheoryLesson[] }[];
  vocab: VocabLesson[];
  initialTab?: 'theory' | 'vocab';
}) {
  const [tab, setTab] = useState(initialTab);
  const { L, en } = useL();
  const done = useLessonStore((s) => s.done);
  const stages = useTopicStudyStore((s) => s.stages);
  const base = subject === 'math' ? '/math/learn' : '/sat-rw/learn';

  const all = groups.flatMap((g) => g.lessons);
  const doneCount = all.filter((l) => done[lessonKey(subject, l.skill)]).length;
  const nextLesson = all.find((l) => !done[lessonKey(subject, l.skill)]) ?? all[0];
  const vocabDone = vocab.filter((v) => masteredCount(stages[v.slug]) >= v.words.length).length;
  const nextVocab = vocab.find((v) => masteredCount(stages[v.slug]) < v.words.length) ?? vocab[0];

  // Số thứ tự bài chạy liên tục qua các domain.
  const numberOf = new Map(all.map((l, i) => [l.skill, i + 1]));
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1040 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 self-start rounded-pill bg-white/85 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">{backLabel}</Text>
        </Pressable>

        <Appear index={0}>
          <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
            <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
            <Text className="mt-1 font-sans text-bodyLg text-muted">{blurb}</Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Stat label={L('bài lý thuyết đã học', 'theory lessons done')} value={`${doneCount}/${all.length}`} />
              <Stat label={L('bài từ vựng đã thuộc', 'vocab lessons mastered')} value={`${vocabDone}/${vocab.length}`} />
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {nextLesson ? (
                <Button
                  label={
                    doneCount === 0
                      ? L(`Bắt đầu: ${nextLesson.title}`, `Start: ${nextLesson.englishName}`)
                      : L(`Học tiếp: ${nextLesson.title}`, `Continue: ${nextLesson.englishName}`)
                  }
                  iconRight="arrow-right"
                  onPress={() => router.push(`${base}/${nextLesson.skill}` as never)}
                />
              ) : null}
              {nextVocab ? (
                <Button variant="secondary" label={L(`Từ vựng: ${nextVocab.title}`, `Vocabulary: ${nextVocab.title}`)} onPress={() => router.push(`/vocabulary/topic/${nextVocab.slug}` as never)} />
              ) : null}
            </View>
          </View>
        </Appear>

        <View className="mt-6 flex-row self-start rounded-2xl bg-white/80 p-1">
          {(
            [
              ['theory', L(`Lý thuyết · ${all.length} bài`, `Theory · ${all.length} lessons`)],
              ['vocab', L(`Từ vựng · ${vocab.length} bài`, `Vocabulary · ${vocab.length} lessons`)],
            ] as const
          ).map(([k, label]) => (
            <Pressable key={k} onPress={() => setTab(k)} className="rounded-xl px-5 py-2" style={{ backgroundColor: tab === k ? color.primary : 'transparent' }}>
              <Text className="font-strong text-body" style={{ color: tab === k ? '#FFFFFF' : color.ink }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <CrossFade swapKey={tab}>
          {tab === 'theory' ? (
            <View>
              {groups.map((g) => (
                <View key={g.domain} className="mt-6">
                  <Text className="mb-3 font-heavy text-sectionTitle text-ink">{en && g.domain === 'Khác' ? 'Other' : g.domain}</Text>
                  <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
                    {g.lessons.map((l) => {
                      const num = numberOf.get(l.skill);
                      const isDone = !!done[lessonKey(subject, l.skill)];
                      const tone = LEVEL_TONE[l.level];
                      return (
                        <Pressable
                          key={l.skill}
                          accessibilityRole="button"
                          onPress={() => router.push(`${base}/${l.skill}` as never)}
                          className="h-full rounded-2xl bg-white p-4"
                          style={[{ borderWidth: 2, borderColor: isDone ? '#BBF7D0' : 'transparent' }, CARD]}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="font-strong text-label text-muted">{L('Bài', 'Lesson')} {num}</Text>
                            {isDone ? <Icon name="check" size={18} color="#16A34A" strokeWidth={2.4} /> : null}
                          </View>
                          <Text className="mt-1 font-heavy text-bodyLg text-ink">{en ? l.englishName : l.title}</Text>
                          <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>
                            {en ? l.title : l.englishName}
                          </Text>
                          <View className="flex-1" />
                          <View className="mt-3 flex-row items-center gap-2">
                            <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: tone.bg }}>
                              <Text className="font-strong text-label" style={{ color: tone.fg }}>
                                {levelLabel(l.level, en)}
                              </Text>
                            </View>
                            <Text className="font-sans text-label text-muted">{l.minutes} {L('phút', 'min')}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </Grid>
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-6">
              <Text className="mb-4 font-sans text-body text-muted">
                {L('Mỗi bài 6–13 từ, ~15 phút.', '6–13 words per lesson, ~15 min.')}
                {subject === 'math' ? (
                  <Text className="font-semi text-primary-700" onPress={() => router.push('/math/vocab' as never)}>
                    {' '}
                    {L('Xem cả bảng thuật ngữ →', 'See the full glossary →')}
                  </Text>
                ) : null}
              </Text>
              <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
                {vocab.map((v, i) => {
                  const m = masteredCount(stages[v.slug]);
                  const pct = v.words.length ? m / v.words.length : 0;
                  return (
                    <Pressable
                      key={v.slug}
                      accessibilityRole="button"
                      onPress={() => router.push(`/vocabulary/topic/${v.slug}` as never)}
                      className="h-full rounded-2xl bg-white p-4"
                      style={CARD}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="font-strong text-label text-muted">{L('Bài từ vựng', 'Vocab lesson')} {i + 1}</Text>
                        {pct >= 1 ? <Icon name="check" size={18} color="#16A34A" strokeWidth={2.4} /> : null}
                      </View>
                      <Text className="mt-1 font-heavy text-bodyLg text-ink">{v.title}</Text>
                      <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={2}>
                        {v.blurb}
                      </Text>
                      <View className="flex-1" />
                      <View className="mt-3 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F8F2E8' }}>
                        <View className="h-1.5 rounded-pill" style={{ width: `${pct * 100}%`, backgroundColor: '#16A34A' }} />
                      </View>
                      <Text className="mt-1.5 font-semi text-label text-muted">
                        {L(`Đã thuộc ${m}/${v.words.length} từ`, `Mastered ${m}/${v.words.length} words`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </Grid>
            </View>
          )}
        </CrossFade>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill px-3.5 py-1.5" style={{ backgroundColor: '#FCF9F4' }}>
      <Text className="font-heavy text-body text-primary-700">{value}</Text>
      <Text className="font-sans text-label text-muted">{label}</Text>
    </View>
  );
}
