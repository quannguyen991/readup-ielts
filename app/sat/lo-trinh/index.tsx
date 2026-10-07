import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { Appear } from '@/components/motion/Motion';
import { ChapterSticker, LevelDots, levelState } from '@/components/sat-roadmap/RoadmapUi';
import { WindingTrail } from '@/components/learning-path/WindingTrail';
import { PHASES, ROAD_CHAPTERS, type RoadChapter } from '@/data/sat-roadmap';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';
import { useL } from '@/i18n/useL';

/** Lộ trình SAT Math theo đường học so le, gom 27 chủ đề thành 4 chặng. */
export default function SatRoadmap() {
  const hydrated = useHydrated();
  const savedProgress = useSatRoadmapStore((s) => s.progress);
  const progress = hydrated ? savedProgress : {};
  const { L, en } = useL();
  const passed = ROAD_CHAPTERS.reduce(
    (sum, chapter) => sum + (['easy', 'medium', 'hard'] as const).filter((level) => levelState(progress[chapter.id]?.[level]) === 'passed').length,
    0,
  );
  const next = ROAD_CHAPTERS.find((chapter) =>
    (['easy', 'medium', 'hard'] as const).some((level) => levelState(progress[chapter.id]?.[level]) !== 'passed'),
  ) ?? ROAD_CHAPTERS[0]!;

  return (
    <Screen>
      <Appear>
        <View className="rounded-[24px] bg-white p-5" style={CARD}>
          <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#A8843F' }}>
            SAT MATH · {L('LỘ TRÌNH', 'LEARNING PATH')}
          </Text>
          <Text className="mt-1 font-heavy text-pageTitle text-ink">
            {L('27 chủ đề, từ dễ đến khó', '27 topics, from easy to hard')}
          </Text>
          <View className="mt-2 flex-row items-center justify-between gap-3">
            <Text className="font-sans text-body text-muted">{L('Tiến độ các lượt luyện', 'Quiz progress')}</Text>
            <Text className="font-heavy text-body text-ink">{passed}/81</Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: '#F1ECE2' }}>
            <View style={{ height: 8, width: `${(passed / 81) * 100}%`, borderRadius: 4, backgroundColor: '#22A06B' }} />
          </View>

          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/sat/lo-trinh/${next.id}` as never)}
            className="mt-4 flex-row items-center gap-3 rounded-2xl px-3 py-2.5"
            style={{ backgroundColor: '#F8F4EA' }}
          >
            <ChapterSticker art={next.art} size={48} motion={false} />
            <View className="min-w-0 flex-1">
              <Text className="font-semi text-label" style={{ color: '#8F6E36' }}>{L('HỌC TIẾP', 'CONTINUE')}</Text>
              <Text className="font-heavy text-body text-ink" numberOfLines={1}>
                {L(`Chủ đề ${next.n}: ${next.title.vi}`, `Topic ${next.n}: ${next.title.en}`)}
              </Text>
            </View>
            <Text className="font-heavy text-body" style={{ color: '#8F6E36' }}>→</Text>
          </Pressable>
        </View>
      </Appear>

      {([1, 2, 3, 4] as const).map((phase) => {
        const chapters = ROAD_CHAPTERS.filter((chapter) => chapter.phase === phase);
        const completed = chapters.filter((chapter) =>
          (['easy', 'medium', 'hard'] as const).every((level) => levelState(progress[chapter.id]?.[level]) === 'passed'),
        ).length;
        const phaseColor = PHASES[phase].color;

        return (
          <Appear key={phase}>
            <View className="mt-7">
              <View className="mb-3 flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-row items-center gap-3">
                  <View style={{ width: 12, height: 32, borderRadius: 6, backgroundColor: phaseColor }} />
                  <View className="min-w-0">
                    <Text className="font-semi text-label uppercase tracking-[1px] text-muted">
                      {L(`CHẶNG ${phase}`, `PHASE ${phase}`)}
                    </Text>
                    <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={1}>
                      {en ? PHASES[phase].title.en : PHASES[phase].title.vi}
                    </Text>
                  </View>
                </View>
                <Text className="font-semi text-label text-muted">{completed}/{chapters.length}</Text>
              </View>

              <View className="overflow-hidden rounded-[24px] bg-white px-2 py-5" style={CARD}>
                <WindingTrail
                  items={chapters.map((chapter) => ({ id: chapter.id, chapter }))}
                  rowHeight={180}
                  nodeWidth={230}
                  renderNode={({ chapter }) => (
                    <ChapterNode chapter={chapter} best={progress[chapter.id]} nextId={next.id} />
                  )}
                />
              </View>
            </View>
          </Appear>
        );
      })}
      <View style={{ height: 28 }} />
    </Screen>
  );
}

const CARD = { boxShadow: '0 2px 12px rgba(34,35,31,0.06)' } as object;

function ChapterNode({
  chapter,
  best,
  nextId,
}: {
  chapter: RoadChapter;
  best: ReturnType<typeof useSatRoadmapStore.getState>['progress'][string] | undefined;
  nextId: string;
}) {
  const { L, en } = useL();
  const passed = (['easy', 'medium', 'hard'] as const).filter((level) => levelState(best?.[level]) === 'passed').length;
  const isDone = passed === 3;
  const isNext = chapter.id === nextId;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Chủ đề ${chapter.n}: ${chapter.title.vi}, ${passed}/3 mức đã qua`, `Topic ${chapter.n}: ${chapter.title.en}, ${passed}/3 levels passed`)}
      onPress={() => router.push(`/sat/lo-trinh/${chapter.id}` as never)}
      style={{ width: '100%', alignItems: 'center' }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDone ? '#E7F7EF' : isNext ? '#FFF3CD' : '#FFFFFF',
          borderWidth: isNext ? 3 : 2,
          borderColor: isDone ? '#22A06B' : isNext ? '#D79B22' : '#E9DFCC',
          boxShadow: isNext ? '0 5px 12px rgba(166,115,20,0.18)' : '0 2px 7px rgba(30,41,59,0.08)',
        } as object}
      >
        <ChapterSticker art={chapter.art} size={53} motion={false} />
        {isDone ? (
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#22A06B', borderWidth: 2, borderColor: '#FFFFFF' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>✓</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-1 font-semi text-label uppercase" style={{ color: isNext ? '#9A6810' : '#81796D' }}>
        {L(`CHỦ ĐỀ ${chapter.n}`, `TOPIC ${chapter.n}`)}
      </Text>
      <Text className="font-heavy text-center text-body text-ink" numberOfLines={2}>
        {en ? chapter.title.en : chapter.title.vi}
      </Text>
      <View style={{ width: '74%', marginTop: 5 }}>
        <LevelDots best={best} />
      </View>
      <Text className="mt-1 font-semi text-center text-label" style={{ color: isDone ? '#16814E' : isNext ? '#9A6810' : '#81796D' }}>
        {isDone ? L('Hoàn thành', 'Complete') : isNext ? L('Học tiếp', 'Up next') : L(`${passed}/3 mức`, `${passed}/3 levels`)}
      </Text>
    </Pressable>
  );
}
