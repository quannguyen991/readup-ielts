import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { LightHero, HeroStat } from '@/components/layout/LightHero';
import { useHydrated } from '@/components/layout/useHydrated';
import { Appear } from '@/components/motion/Motion';
import { Label } from '@/components/illust/Sticker';
import { CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { ChapterSticker, LevelDots, levelState } from '@/components/sat-roadmap/RoadmapUi';
import { PHASES, ROAD_CHAPTERS, type RoadChapter } from '@/data/sat-roadmap';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';

/**
 * LỘ TRÌNH SAT MATH THEO CHỦ ĐỀ — 27 chương theo thứ tự chủ đề của giáo trình
 * The College Panda (chỉ theo thứ tự và tên chủ đề; nội dung tự viết), chia 4
 * giai đoạn, mỗi chương 3 mức Dễ → Trung bình → Khó. Người dùng yêu cầu 30/09/2026.
 */
export default function SatRoadmap() {
  const hydrated = useHydrated();
  const progress = useSatRoadmapStore((s) => s.progress);
  const p = hydrated ? progress : {};
  const { width } = useWindowDimensions();
  const cols = width >= 1100 ? 3 : width >= 700 ? 2 : 1;

  const passed = ROAD_CHAPTERS.reduce((a, c) => a + (['easy', 'medium', 'hard'] as const).filter((l) => levelState(p[c.id]?.[l]) === 'passed').length, 0);
  const next = ROAD_CHAPTERS.find((c) => (['easy', 'medium', 'hard'] as const).some((l) => levelState(p[c.id]?.[l]) !== 'passed')) ?? ROAD_CHAPTERS[0]!;

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="math"
          badge="SAT MATH · LỘ TRÌNH THEO CHỦ ĐỀ"
          line1="27 chủ đề, từ dễ tới khó"
          line2="lý thuyết Việt – Anh song song"
          subtitle="Bám sát giáo trình The College Panda: cùng kiến thức, cùng dạng bài, số mới mỗi lượt. Đọc lý thuyết, xem ví dụ, làm bộ bài theo sách rồi quiz 3 mức."
          footer={
            <>
              <HeroStat value={`${passed}/81`} label="mức đã qua" />
              <HeroStat value="27" label="chủ đề" />
              <HeroStat value="∞" label="câu luyện" />
            </>
          }
        />
      </Appear>

      {/* Học tiếp */}
      <Appear>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/sat/lo-trinh/${next.id}` as never)}>
          <View style={{ marginTop: 16, borderRadius: 28, padding: 20, backgroundColor: '#4A7FE8', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Sparkles count={6} />
            <ChapterSticker art={next.art} size={78} />
            <View style={{ flex: 1 }}>
              <Label text="Học tiếp →" color="#FACC15" ink="#2A1B02" tilt={-4} size={14} />
              <Text className="font-heavy" style={{ marginTop: 8, fontSize: 26, color: '#FFFFFF' }}>
                Chương {next.n}. {next.title.vi}
              </Text>
              <Text className="font-semi" style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }} lang="en">
                {next.title.en}
              </Text>
            </View>
          </View>
        </Pressable>
      </Appear>

      {([1, 2, 3, 4] as const).map((ph) => {
        const list = ROAD_CHAPTERS.filter((c) => c.phase === ph);
        return (
          <Appear key={ph}>
            <View style={{ marginTop: 26 }}>
              <View style={{ borderRadius: 26, paddingHorizontal: 22, paddingVertical: 18, backgroundColor: PHASES[ph].color, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Sparkles count={5} />
                <View>
                  <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' }}>
                    GIAI ĐOẠN {ph}
                  </Text>
                  <Text className="font-heavy" style={{ fontSize: 28, color: '#FFFFFF' }}>
                    {PHASES[ph].title.vi}.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Label text={`Ch. ${list[0]!.n}–${list[list.length - 1]!.n}`} color="#FFFFFF" ink="#0F172A" tilt={4} size={13} />
                  <ChapterSticker art={PHASE_ART[ph]} size={56} tilt={ph % 2 ? 8 : -8} />
                </View>
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {list.map((c) => (
                  <ChapterCard key={c.id} c={c} best={p[c.id]} basis={cols === 1 ? '100%' : cols === 2 ? '48%' : '31.5%'} />
                ))}
              </View>
            </View>
          </Appear>
        );
      })}
      <View style={{ height: 40 }} />
    </Screen>
  );
}

const PHASE_ART: Record<1 | 2 | 3 | 4, RoadChapter['art']> = { 1: 'calculator', 2: 'pencil', 3: 'rocket', 4: 'globe' };

function ChapterCard({ c, best, basis }: { c: RoadChapter; best: ReturnType<typeof useSatRoadmapStore.getState>['progress'][string] | undefined; basis: string }) {
  const done = (['easy', 'medium', 'hard'] as const).filter((l) => levelState(best?.[l]) === 'passed').length;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Chương ${c.n}: ${c.title.vi}, đã qua ${done}/3 mức`}
      onPress={() => router.push(`/sat/lo-trinh/${c.id}` as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexBasis: basis as never,
        flexGrow: 1,
        borderRadius: 24,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        transform: [{ translateY: hovered ? -3 : 0 }],
        boxShadow: hovered ? '0 12px 26px rgba(15,23,42,0.12)' : '0 2px 8px rgba(15,23,42,0.05)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      } as object)}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <ChapterSticker art={c.art} size={54} motion={false} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#64748B' }}>
            CHƯƠNG {c.n}
          </Text>
          <Text className="font-heavy" style={{ fontSize: 18, color: '#0F172A' }}>
            {c.title.vi}
          </Text>
          <Text className="font-semi" style={{ fontSize: 13, color: '#64748B' }} lang="en">
            {c.title.en}
          </Text>
        </View>
        {done === 3 ? (
          <Motion kind="wobble">
            <Sticker tilt={10}>
              <CuteTrophy size={40} />
            </Sticker>
          </Motion>
        ) : null}
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flex: 1, minWidth: 90 }}>
          <LevelDots best={best} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {c.bookSet?.length ? <Label text={`📖 ${c.bookSet.length}${levelState(best?.book) === 'passed' ? ' 🏅' : ''}`} color="#FFF1B8" ink="#2A1B02" tilt={-4} size={11} /> : null}
          <Label text={`✏️ +20${levelState(best?.extra) === 'passed' ? ' 🏅' : ''}`} color="#E7F7EF" ink="#14532D" tilt={3} size={11} />
        </View>
      </View>
    </Pressable>
  );
}
