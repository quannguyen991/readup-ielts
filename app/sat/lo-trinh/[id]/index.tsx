import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { Appear } from '@/components/motion/Motion';
import { MindMap } from '@/components/illust/MindMap';
import { Label } from '@/components/illust/Sticker';
import { Sparkles } from '@/components/illust/CuteMore';
import { MathText } from '@/components/math/MathText';
import { BiText, ChapterSticker, LEVEL_TONE, levelState, type Lang } from '@/components/sat-roadmap/RoadmapUi';
import { LEVEL_LABEL, PASS_RATIO, PHASES, QUIZ_SIZE, ROAD_CHAPTERS, bookSetReady, chapterById, liveTemplates } from '@/data/sat-roadmap';
import { useSatRoadmapStore, type LevelBest } from '@/store/useSatRoadmapStore';
import type { RoadChapter } from '@/data/sat-roadmap';

/**
 * Một chương của Lộ trình SAT Math: các khối lớn xếp dần xuống — đầu chương,
 * sơ đồ các chủ đề con, lý thuyết song ngữ (chọn Song ngữ / Tiếng Việt /
 * English), ví dụ giải từng bước, bẫy hay gặp, và 3 mức bài tập Dễ → Khó.
 */
export default function RoadChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = chapterById(id);
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [lang, setLang] = useState<Lang>('both');
  const hydrated = useHydrated();
  const best = useSatRoadmapStore((s) => s.progress[id ?? '']);

  if (!c) {
    return (
      <Screen>
        <Text className="font-heavy text-ink" style={{ fontSize: 22 }}>
          Không tìm thấy chương này.
        </Text>
      </Screen>
    );
  }
  const color = PHASES[c.phase].color;
  const idx = ROAD_CHAPTERS.indexOf(c);
  const prev = ROAD_CHAPTERS[idx - 1];
  const next = ROAD_CHAPTERS[idx + 1];

  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.push('/sat/lo-trinh' as never)} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <Text className="font-strong" style={{ fontSize: 14, color: '#2F5FC4' }}>
          ← Lộ trình SAT Math
        </Text>
      </Pressable>

      {/* ------------------------------------------------ đầu chương */}
      <Appear>
        <View style={{ borderRadius: 28, padding: wide ? 28 : 20, backgroundColor: color, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Sparkles count={7} />
          <View style={{ flex: 1 }}>
            <Label text={`Chương ${c.n} · ${PHASES[c.phase].title.vi}`} color="#FFFFFF" ink="#0F172A" tilt={-3} size={13} />
            <Text className="font-heavy" style={{ marginTop: 10, fontSize: wide ? 40 : 30, lineHeight: wide ? 46 : 36, color: '#FFFFFF' }}>
              {c.title.vi}.
            </Text>
            <Text className="font-semi" style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }} lang="en">
              {c.title.en}
            </Text>
            {c.bookPages ? (
              <Text className="font-strong" style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                📖 Tương ứng Chương {c.n}, The College Panda · trang {c.bookPages[0]}–{c.bookPages[1]}
              </Text>
            ) : null}
          </View>
          <ChapterSticker art={c.art} size={wide ? 120 : 76} tilt={6} />
        </View>
      </Appear>

      {/* ------------------------------------------------ ngôn ngữ */}
      <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
        {(
          [
            ['both', '🇻🇳 + 🇬🇧 Song ngữ'],
            ['vi', 'Tiếng Việt'],
            ['en', 'English'],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            accessibilityRole="radio"
            aria-checked={lang === k}
            onPress={() => setLang(k)}
            style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: lang === k ? '#0F172A' : '#FFFFFF', borderWidth: 1, borderColor: lang === k ? '#0F172A' : '#E2E8F0' }}
          >
            <Text className="font-strong" style={{ fontSize: 14, color: lang === k ? '#FFFFFF' : '#0F172A' }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ------------------------------------------------ sơ đồ chủ đề con */}
      <Block title="Sơ đồ chương." kicker="CHỦ ĐỀ CON">
        <MindMap
          height={c.subtopics.length > 3 ? 340 : 280}
          narrowBelow={520}
          center={{ label: c.title.vi, sub: c.title.en, color, icon: <ChapterSticker art={c.art} size={30} motion={false} tilt={0} /> }}
          branches={c.subtopics.map((s) => ({ label: lang === 'en' ? s.en : s.vi, sub: lang === 'both' ? s.en : undefined, color }))}
        />
      </Block>

      {/* ------------------------------------------------ lý thuyết */}
      <Block title="Lý thuyết." kicker={lang === 'en' ? 'THEORY' : 'LÝ THUYẾT · THEORY'}>
        <View style={{ gap: 12 }}>
          {c.theory.map((t, i) => (
            <View key={i} style={{ borderRadius: 20, padding: 16, backgroundColor: '#F8FAFC', borderLeftWidth: 6, borderLeftColor: color, gap: 10 }}>
              <BiText t={t.title} lang={lang} wide={wide} size={17} strong />
              <BiText t={t.body} lang={lang} wide={wide} />
              {t.formula ? (
                <View style={{ alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <MathText size={17} weight="semibold">
                    {t.formula}
                  </MathText>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Block>

      {/* ------------------------------------------------ ví dụ */}
      <Block title="Ví dụ." kicker="GIẢI TỪNG BƯỚC · WORKED EXAMPLE">
        {c.examples.map((e, i) => (
          <View key={i} style={{ gap: 10 }}>
            <View style={{ borderRadius: 16, padding: 14, backgroundColor: '#EEF3FF' }}>
              <MathText size={16} weight="semibold">
                {e.problem}
              </MathText>
            </View>
            {e.steps.map((s, j) => (
              <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text className="font-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
                    {j + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <BiText t={s} lang={lang} wide={wide} />
                </View>
              </View>
            ))}
            <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#22A06B' }}>
              <Text className="font-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
                ✓ {e.answer}
              </Text>
            </View>
          </View>
        ))}
      </Block>

      {/* ------------------------------------------------ bẫy */}
      <Block title="Bẫy hay gặp." kicker="TRAPS" tone="#FFF1F0">
        <View style={{ gap: 10 }}>
          {c.traps.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <BiText t={t} lang={lang} wide={wide} />
              </View>
            </View>
          ))}
        </View>
      </Block>

      {/* ------------------------------------------------ bài tập */}
      <Block title="Luyện tập." kicker={`BỘ BÀI THEO SÁCH · 3 MỨC ${QUIZ_SIZE} CÂU · CÂU MỚI MỖI LƯỢT`}>
        {c.bookSet?.length ? <BookSetCard c={c} best={hydrated ? best?.book : undefined} color={color} /> : null}
        <View style={{ marginTop: c.bookSet?.length ? 12 : 0, flexDirection: wide ? 'row' : 'column', gap: 12 }}>
          {(['easy', 'medium', 'hard'] as const).map((lv, i) => {
            const b = hydrated ? best?.[lv] : undefined;
            const st = levelState(b);
            const tone = LEVEL_TONE[lv];
            const prevLv = (['easy', 'medium', 'hard'] as const)[i - 1];
            const suggestFirst = prevLv && hydrated && levelState(best?.[prevLv]) !== 'passed';
            const ready = liveTemplates(c, lv).length > 0;
            return (
              <View key={lv} style={{ flex: 1, borderRadius: 22, padding: 18, backgroundColor: tone.soft, borderWidth: 2, borderColor: st === 'passed' ? tone.bg : 'transparent', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text className="font-heavy" style={{ fontSize: 22, color: tone.ink }}>
                    {tone.emoji} {LEVEL_LABEL[lv].vi}
                  </Text>
                  {st === 'passed' ? <Text style={{ fontSize: 22 }}>🏅</Text> : null}
                </View>
                <Text className="font-semi" style={{ fontSize: 14, color: tone.ink }}>
                  {b ? `Tốt nhất ${b.correct}/${b.total} · ${b.rounds} lượt` : 'Chưa làm'}
                </Text>
                {suggestFirst ? (
                  <Text className="font-sans" style={{ fontSize: 13, color: tone.ink }}>
                    Nên đạt {Math.round(PASS_RATIO * 100)}% ở mức {LEVEL_LABEL[prevLv!].vi} trước.
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={!ready}
                  onPress={() => router.push(`/sat/lo-trinh/${c.id}/${lv}` as never)}
                  style={({ hovered }: { hovered?: boolean }) => ({ marginTop: 4, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: ready ? (hovered ? tone.ink : tone.bg) : '#CBD5E1' })}
                >
                  <Text className="font-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
                    {ready ? (b ? 'Làm lượt mới' : `Làm ${QUIZ_SIZE} câu`) : 'Đang soạn câu hỏi'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </Block>

      {/* ------------------------------------------------ chương trước / sau */}
      <View style={{ marginTop: 18, marginBottom: 36, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        {prev ? <NavCard label={`← Chương ${prev.n}`} title={prev.title.vi} onPress={() => router.push(`/sat/lo-trinh/${prev.id}` as never)} /> : <View />}
        {next ? <NavCard label={`Chương ${next.n} →`} title={next.title.vi} onPress={() => router.push(`/sat/lo-trinh/${next.id}` as never)} align="right" /> : null}
      </View>
    </Screen>
  );
}

/**
 * Bộ bài bám sách: đúng số bài và thứ tự dạng bài cuối chương của giáo trình
 * (số và bối cảnh mới mỗi lượt). Có ghi số bài dùng máy tính / không máy tính
 * như cách sách chia phần.
 */
function BookSetCard({ c, best, color }: { c: RoadChapter; best: LevelBest | undefined; color: string }) {
  const set = c.bookSet ?? [];
  const ready = bookSetReady(c);
  const calc = set.filter((b) => b.calc).length;
  const st = levelState(best);
  return (
    <View style={{ borderRadius: 24, padding: 18, backgroundColor: '#0F172A', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <Sparkles count={5} />
      <Text style={{ fontSize: 40 }}>📖</Text>
      <View style={{ flex: 1, minWidth: 220, gap: 4 }}>
        <Text className="font-heavy" style={{ fontSize: 22, color: '#FFFFFF' }}>
          Bộ bài theo sách · {set.length} bài {st === 'passed' ? '🏅' : ''}
        </Text>
        <Text className="font-semi" style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          Đúng thứ tự dạng bài cuối chương {c.n} trong sách · {set.length - calc} không máy tính, {calc} có máy tính · số mới mỗi lượt
        </Text>
        <Text className="font-semi" style={{ fontSize: 13, color: '#FACC15' }}>
          {best ? `Tốt nhất ${best.correct}/${best.total} · ${best.rounds} lượt` : 'Chưa làm'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!ready}
        onPress={() => router.push(`/sat/lo-trinh/${c.id}/book` as never)}
        style={({ hovered }: { hovered?: boolean }) => ({ borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: ready ? (hovered ? '#FFFFFF' : color) : '#475569' })}
      >
        {({ hovered }: { hovered?: boolean }) => (
          <Text className="font-heavy" style={{ fontSize: 15, color: ready && hovered ? '#0F172A' : '#FFFFFF' }}>
            {ready ? (best ? 'Làm lượt mới' : `Làm ${set.length} bài`) : 'Đang soạn'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function Block({ title, kicker, tone = '#FFFFFF', children }: { title: string; kicker: string; tone?: string; children: React.ReactNode }) {
  return (
    <Appear>
      <View style={{ marginTop: 16, borderRadius: 28, padding: 20, backgroundColor: tone, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2, color: '#64748B' }}>
          {kicker}
        </Text>
        <Text className="font-heavy" style={{ fontSize: 28, color: '#0F172A', marginBottom: 14 }}>
          {title}
        </Text>
        {children}
      </View>
    </Appear>
  );
}

function NavCard({ label, title, onPress, align = 'left' }: { label: string; title: string; onPress: () => void; align?: 'left' | 'right' }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ flex: 1, maxWidth: 360, borderRadius: 20, padding: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Text className="font-strong" style={{ fontSize: 13, color: '#64748B' }}>
        {label}
      </Text>
      <Text className="font-heavy" style={{ fontSize: 16, color: '#0F172A' }}>
        {title}
      </Text>
    </Pressable>
  );
}
