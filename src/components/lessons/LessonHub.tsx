import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { WindingTrail } from '@/components/learning-path/WindingTrail';
import { useL } from '@/i18n/useL';
import type { TheoryLesson } from '@/data/lessons/types';
import type { VocabLesson } from '@/data/lessons/vocab-lessons';
import { masteredCount, useTopicStudyStore } from '@/store/useTopicStudyStore';
import { lessonKey, useLessonStore } from '@/store/useLessonStore';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 22px rgba(94,72,35,0.06)' } as object;

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
  const vocabDone = vocab.filter((v) => masteredCount(stages[v.slug]) >= v.words.length).length;

  const nextLessonSkill = all.find((l) => !done[lessonKey(subject, l.skill)])?.skill;
  const nextVocabSlug = vocab.find((v) => masteredCount(stages[v.slug]) < v.words.length)?.slug;
  const activeProgress = tab === 'theory'
    ? (all.length ? doneCount / all.length : 0)
    : (vocab.length ? vocabDone / vocab.length : 0);
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
          <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
            <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
            <Text className="mt-1 font-sans text-body text-muted" numberOfLines={2}>{blurb}</Text>
            <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
              <Stat label={L('bài đã học', 'lessons completed')} value={`${doneCount}/${all.length}`} />
              <Stat label={L('bộ từ đã thuộc', 'vocab sets mastered')} value={`${vocabDone}/${vocab.length}`} />
            </View>
            <View className="mt-3 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F4EFE5' }}>
              <View style={{ height: 6, width: `${activeProgress * 100}%`, backgroundColor: color.primary }} />
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
                  <View className="mb-2 flex-row items-baseline justify-between gap-3">
                    <Text className="font-heavy text-sectionTitle text-ink">{en && g.domain === 'Khác' ? 'Other' : g.domain}</Text>
                    <Text className="font-semi text-label text-muted">
                      {g.lessons.filter((l) => done[lessonKey(subject, l.skill)]).length}/{g.lessons.length}
                    </Text>
                  </View>
                  <View className="overflow-hidden rounded-[22px] bg-white px-2 py-5" style={CARD}>
                    <WindingTrail
                      items={g.lessons.map((lesson) => ({ id: lesson.skill, lesson }))}
                      rowHeight={146}
                      renderNode={({ lesson }, localIndex) => {
                        const isDone = !!done[lessonKey(subject, lesson.skill)];
                        const isCurrent = lesson.skill === nextLessonSkill;
                        const titleText = en ? lesson.englishName : lesson.title;
                        return (
                          <Pressable
                            accessibilityRole="link"
                            accessibilityLabel={`${lesson.title} · ${isDone ? L('Đã học', 'Completed') : isCurrent ? L('Học tiếp', 'Up next') : L('Chưa học', 'Not started')}`}
                            onPress={() => router.push(`${base}/${lesson.skill}` as never)}
                            style={{ alignItems: 'center', width: '100%' }}
                          >
                            <View style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? '#25A56A' : isCurrent ? '#F2B632' : '#FFF9EC', borderWidth: isCurrent ? 4 : 2, borderColor: isDone ? '#17804E' : isCurrent ? '#D79616' : '#E9D6AA', boxShadow: isCurrent ? '0 6px 14px rgba(166,115,20,0.23)' : '0 3px 8px rgba(28,36,47,0.08)' } as object}>
                          {isDone ? <Icon name="check" size={26} color="#FFFFFF" strokeWidth={3} /> : isCurrent ? <Icon name="play" size={24} color="#422F11" /> : <Text className="font-heavy" style={{ fontSize: 21, color: '#78623A' }}>{localIndex + 1}</Text>}
                            </View>
                            <View style={{ alignItems: 'center', marginTop: 5, width: '100%' }}>
                              <Text className="font-heavy text-center text-body text-ink" numberOfLines={2}>{titleText}</Text>
                              <Text className="font-semi text-center text-label" style={{ marginTop: 1, color: isDone ? '#16814E' : isCurrent ? '#9A6810' : '#7C7468' }}>
                                {isDone ? L('Đã học', 'Completed') : isCurrent ? L('Học tiếp', 'Up next') : `${lesson.minutes} ${L('phút', 'min')}`}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-6">
              <Text className="mb-3 font-sans text-body text-muted">
                {L('Chọn một chặng để ôn từ trong ngữ cảnh.', 'Choose a step to review vocabulary in context.')}
                {subject === 'math' ? (
                  <Text className="font-semi text-primary-700" onPress={() => router.push('/math/vocab' as never)}>
                    {' '}
                    {L('Xem cả bảng thuật ngữ →', 'See the full glossary →')}
                  </Text>
                ) : null}
              </Text>
              <View className="overflow-hidden rounded-[22px] bg-white px-2 py-5" style={CARD}>
                <WindingTrail
                  items={vocab.map((lesson) => ({ id: lesson.slug, lesson }))}
                  rowHeight={146}
                  renderNode={({ lesson }, index) => {
                    const mastered = masteredCount(stages[lesson.slug]);
                    const isDone = mastered >= lesson.words.length;
                    const isCurrent = !isDone && lesson.slug === nextVocabSlug;
                    const percent = lesson.words.length ? Math.round((mastered / lesson.words.length) * 100) : 0;
                    return (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`${lesson.title} · ${mastered}/${lesson.words.length}`}
                        onPress={() => router.push(`/vocabulary/topic/${lesson.slug}` as never)}
                        style={{ width: '100%', alignItems: 'center' }}
                      >
                        <View style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? '#25A56A' : isCurrent ? '#F2B632' : '#FFF9EC', borderWidth: isCurrent ? 4 : 2, borderColor: isDone ? '#17804E' : isCurrent ? '#D79616' : '#E9D6AA' } as object}>
                          {isDone ? <Icon name="check" size={26} color="#FFFFFF" strokeWidth={3} /> : <Icon name="letters" size={24} color={isCurrent ? '#422F11' : '#78623A'} />}
                        </View>
                        <Text className="mt-1 font-heavy text-center text-body text-ink" numberOfLines={2}>{lesson.title}</Text>
                        <View style={{ marginTop: 4, width: '72%', height: 5, borderRadius: 3, backgroundColor: '#F0EADF', overflow: 'hidden' }}>
                          <View style={{ width: `${percent}%`, height: 5, backgroundColor: isDone ? '#25A56A' : '#C8A354' }} />
                        </View>
                        <Text className="mt-1 font-semi text-center text-label text-muted" numberOfLines={1}>
                          {isDone ? L('Đã thuộc', 'Mastered') : isCurrent ? L('Học tiếp', 'Up next') : `${mastered}/${lesson.words.length} ${L('từ', 'words')}`}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
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
