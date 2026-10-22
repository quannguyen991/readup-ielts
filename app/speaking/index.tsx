import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { SPEAKING_FORECAST, type SpeakingSample } from '@/data/speaking-forecast';
import { CUE_CARDS, PART1_TOPICS } from '@/services/speaking/bank';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStreak } from '@/store/useStudyStore';
import { useL } from '@/i18n/useL';

/** Bảng màu chung của web: tím chủ đạo, san hô, và các tông nhạt cho ô icon. */
const TONE = {
  violet: { bg: '#F1ECFF', fg: '#6A4BD9' },
  coral: { bg: '#FFF1EE', fg: '#D9503E' },
  mint: { bg: '#E8F7EF', fg: '#23875E' },
  sky: { bg: '#EAF2FF', fg: '#2F6FD6' },
  pink: { bg: '#FDEFF5', fg: '#C2437A' },
  amber: { bg: '#F3F0FB', fg: '#6A4BD9' },
} as const;

type Tone = keyof typeof TONE;

export default function SpeakingLobby() {
  const { L } = useL();
  const { width } = useWindowDimensions();

  const attempts = useSpeakingStore((s) => s.attempts);
  const { current: streak } = useStreak();
  const [weekStart] = useState(() => Date.now() - 7 * 86400000);

  const weekSessions = useMemo(() => {
    return attempts.filter((a) => new Date(a.startedAt).getTime() >= weekStart).length;
  }, [attempts, weekStart]);

  const avgBand = useMemo(() => {
    const graded = attempts.filter((a) => !a.typed && a.grade?.overall != null).slice(0, 7);
    if (!graded.length) return '—';
    const sum = graded.reduce((acc, a) => acc + (a.grade!.overall as number), 0);
    return (sum / graded.length).toFixed(1);
  }, [attempts]);

  const [forecastOpen, setForecastOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<SpeakingSample['quarter']>('Sep-Dec-2026');
  const [selectedPart, setSelectedPart] = useState<'all' | 1 | 2 | 3>('all');

  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [drawnCard, setDrawnCard] = useState<any>(null);

  const filteredForecast = useMemo(() => {
    return SPEAKING_FORECAST.filter((item) => {
      if (item.quarter !== selectedQuarter) return false;
      if (selectedPart !== 'all' && item.part !== selectedPart) return false;
      return true;
    });
  }, [selectedQuarter, selectedPart]);

  const spinRoulette = () => {
    const pool = [
      ...PART1_TOPICS.map((t) => ({ type: 'Part 1', title: t.titleEn, vi: t.titleVi, raw: t })),
      ...CUE_CARDS.map((c) => ({ type: 'Part 2 & 3', title: c.card.text, vi: c.titleVi, raw: c })),
    ];
    setDrawnCard(pool[Math.floor(Math.random() * pool.length)]);
    setRouletteOpen(true);
  };

  const cards: { icon: IconName; tone: Tone; title: string; sub: string; onPress: () => void }[] = [
    {
      icon: 'mic',
      tone: 'violet',
      title: L('Luyện nói AI', 'Practise with AI'),
      sub: L('Chấm phát âm và độ trôi chảy', 'Scores pronunciation & fluency'),
      onPress: () => router.push('/speaking/room' as never),
    },
    {
      icon: 'calendar',
      tone: 'coral',
      title: L('Forecast & bài mẫu', 'Forecast & samples'),
      sub: L('72 bài Band 8.0 · có từ vựng', '72 Band 8.0 samples · with vocabulary'),
      onPress: () => {
        setSelectedPart('all');
        setForecastOpen(true);
      },
    },
    {
      icon: 'refresh',
      tone: 'mint',
      title: L('Rút thẻ ngẫu nhiên', 'Random card'),
      sub: L('Part 1, 2, 3 như thi thật', 'Parts 1, 2, 3 like the real exam'),
      onPress: spinRoulette,
    },
    {
      icon: 'volume',
      tone: 'sky',
      title: 'Shadowing',
      sub: L('Nhại theo video', 'Repeat after videos'),
      onPress: () => router.push('/shadow' as never),
    },
    {
      icon: 'play',
      tone: 'pink',
      title: L('Lồng tiếng BBC · TED-Ed', 'Dub BBC · TED-Ed'),
      sub: L('Mới · thu giọng từng câu', 'New · record line by line'),
      onPress: () => router.push('/speaking/long-tieng' as never),
    },
  ];

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Speaking</Text>

      {/* Chỉ số: ba ô số gọn */}
      <View className="mb-6 mt-4 flex-row gap-3">
        {[
          { value: weekSessions, label: L('Tuần này', 'This week') },
          { value: avgBand, label: L('Band TB', 'Avg band') },
          { value: streak, label: L('Ngày liên tiếp', 'Day streak') },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 items-center rounded-2xl border border-border bg-surface py-4">
            <Text className="font-heavy text-sectionTitle text-ink">{stat.value}</Text>
            <Text className="mt-0.5 font-sans text-label text-muted">{stat.label}</Text>
          </View>
        ))}
      </View>

      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
        {cards.map((card, index) => (
          <Appear key={card.title} index={index}>
            <ActionCard {...card} />
          </Appear>
        ))}
      </Grid>

      {/* ======================================================== */}
      {/* MODAL: FORECAST & BÀI MẪU                                */}
      {/* ======================================================== */}
      <Modal visible={forecastOpen} animationType="fade" transparent onRequestClose={() => setForecastOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="max-h-[90vh] w-full max-w-[820px] overflow-hidden rounded-3xl bg-surface">
            <View className="flex-row items-center justify-between border-b border-border px-6 py-4">
              <View className="flex-1 pr-4">
                <Text className="font-heavy text-cardTitle text-ink">{L('Forecast & bài mẫu', 'Forecast & samples')}</Text>
                <Text className="font-sans text-label text-muted">
                  {L('Chủ đề dự đoán, không chắc chắn xuất hiện trong đề.', 'Predicted topics, not guaranteed in the exam.')}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setForecastOpen(false)} className="rounded-full bg-canvas p-2">
                <Icon name="close" size={18} color="#2B2350" />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-2 border-b border-border px-6 py-3">
              {(['Sep-Dec-2026', 'Common-patterns', 'Q3-2026', 'Q2-2026'] as const).map((q) => (
                <Chip
                  key={q}
                  active={selectedQuarter === q}
                  label={
                    q === 'Sep-Dec-2026'
                      ? L('Mới nhất', 'Latest')
                      : q === 'Common-patterns'
                        ? L('Cue card hay gặp', 'Common cards')
                        : q === 'Q3-2026'
                          ? L('Ôn 2026', '2026 review')
                          : L('Quý 2', 'Q2')
                  }
                  onPress={() => setSelectedQuarter(q)}
                />
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2 px-6 pt-3">
              {(['all', 1, 2, 3] as const).map((p) => (
                <Chip key={p} active={selectedPart === p} label={p === 'all' ? L('Tất cả', 'All') : `Part ${p}`} onPress={() => setSelectedPart(p)} />
              ))}
            </View>

            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 24, gap: 14 }}>
              {filteredForecast.map((item) => (
                <View key={item.id} className="gap-3 rounded-2xl border border-border bg-canvas p-5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Badge label={`Part ${item.part}`} tone="violet" />
                    <Badge label={`Band ${item.targetBand.toFixed(1)}`} tone="coral" />
                  </View>
                  <Text className="font-sans text-label text-muted">
                    {item.topicVi} · {item.topic}
                  </Text>
                  <Text className="font-heavy text-bodyLg text-ink">{item.question}</Text>

                  {item.cueBullets?.length ? (
                    <View className="gap-1">
                      {item.cueBullets.map((b, i) => (
                        <Text key={i} className="font-sans text-label text-body">
                          • {b}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <View className="gap-2 rounded-xl border border-primary-100 bg-surface p-4">
                    <Text className="font-strong text-label text-primary-700">{L('Bài mẫu', 'Sample')}</Text>
                    <Text className="font-sans text-body text-ink" style={{ lineHeight: 24 }}>
                      {item.sampleAnswer}
                    </Text>
                    <Text className="font-sans text-label text-muted">{item.sampleAnswerVi}</Text>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5">
                    {item.collocationsAndIdioms.map((col, idx) => (
                      <View key={idx} className="rounded-md bg-accent-50 px-2 py-1">
                        <Text className="font-semi text-label text-accent-700">{col}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    {item.keyVocabulary.map((kv, idx) => (
                      <View key={idx} className="flex-row items-center gap-1 rounded-md bg-surface px-2 py-1">
                        <Text className="font-strong text-label text-ink">{kv.word}</Text>
                        <Text className="font-sans text-label text-muted">{kv.meaningVi}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setForecastOpen(false);
                      router.push(`/speaking/room?mode=q&q=${encodeURIComponent(item.id)}` as never);
                    }}
                    className="mt-1 self-end rounded-pill bg-primary px-4 py-2"
                  >
                    <Text className="font-strong text-label text-white">{L('Luyện đề này', 'Practise this')}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: KẾT QUẢ RÚT THẺ                                   */}
      {/* ======================================================== */}
      <Modal visible={rouletteOpen} animationType="fade" transparent onRequestClose={() => setRouletteOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-[460px] gap-4 rounded-3xl bg-surface p-6">
            <Text className="font-heavy text-cardTitle text-ink">{L('Thẻ của bạn', 'Your card')}</Text>
            {drawnCard ? (
              <View className="gap-2 rounded-2xl p-5" style={{ backgroundColor: TONE.mint.bg }}>
                <Badge label={drawnCard.type} tone="mint" />
                <Text className="font-heavy text-sectionTitle text-ink">{drawnCard.title}</Text>
                <Text className="font-sans text-body text-muted">{drawnCard.vi}</Text>
              </View>
            ) : null}
            <View className="flex-row gap-3">
              <Button className="flex-1" variant="secondary" label={L('Rút lại', 'Again')} onPress={spinRoulette} />
              <Button
                className="flex-1"
                variant="brand"
                label={L('Vào luyện', 'Start')}
                onPress={() => {
                  setRouletteOpen(false);
                  router.push('/speaking/room' as never);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/** Thẻ lối vào: một kiểu duy nhất cho mọi tính năng Speaking. */
function ActionCard({ icon, tone, title, sub, onPress }: { icon: IconName; tone: Tone; title: string; sub: string; onPress: () => void }) {
  const t = TONE[tone];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-4 rounded-2xl border border-border bg-surface p-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
        <Icon name={icon} size={22} color={t.fg} />
      </View>
      <View className="flex-1">
        <Text className="font-heavy text-cardTitle text-ink">{title}</Text>
        <Text className="mt-0.5 font-sans text-label text-muted">{sub}</Text>
      </View>
      <Icon name="arrow-right" size={18} color={t.fg} strokeWidth={2.2} />
    </Pressable>
  );
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  const t = TONE[tone];
  return (
    <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: t.bg }}>
      <Text className="font-strong text-[11px]" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-pill px-3 py-1.5" style={{ backgroundColor: active ? '#6A4BD9' : '#F3F0FB' }}>
      <Text className="font-strong text-label" style={{ color: active ? '#FFFFFF' : '#7A72A0' }}>
        {label}
      </Text>
    </Pressable>
  );
}
