import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Icon, type IconName } from '@/components/ui';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG } from '@/data/study-decks';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

/**
 * QUIZ TỪ VỰNG — cửa vào chung của ba cách luyện một bộ từ, thay cho phòng
 * "Luyện từ vựng" cũ: chọn KIỂU trước (Học xen kẽ, Kiểm tra, Điền vào câu), rồi
 * chọn BỘ TỪ (sổ từ của bạn, bộ tự tạo, 50 chủ đề IELTS, bài từ vựng SAT).
 */
type Mode = 'learn' | 'test' | 'cloze';

/** Chuyển màu và cỡ mượt khi đổi lựa chọn (web). */
const SELECT_MOTION = (Platform.OS === 'web'
  ? { transition: 'border-color 200ms ease, background-color 200ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' }
  : {}) as object;

const MODES: { id: Mode; title: string; note: string; icon: IconName; tone: string; soft: string }[] = [
  {
    id: 'learn',
    title: 'Học xen kẽ',
    note: 'Lật thẻ, trắc nghiệm, gõ từ đan nhau; từ sai quay lại sau vài câu.',
    icon: 'book',
    tone: '#4F46E5',
    soft: '#EEF2FF',
  },
  {
    id: 'test',
    title: 'Kiểm tra',
    note: '20 câu trộn bốn dạng, chấm cuối bài và chỉ ra kiểu lỗi.',
    icon: 'clipboard',
    tone: '#DB2777',
    soft: '#FDF2F8',
  },
  {
    id: 'cloze',
    title: 'Điền vào câu',
    note: 'Từ nằm trong câu thật: chọn, xếp chữ, gõ, nghe rồi điền.',
    icon: 'pencil',
    tone: '#0891B2',
    soft: '#ECFEFF',
  },
];

type Deck = { slug: string; name: string; count: number; group: string };

const STATIC_DECKS: Deck[] = [
  ...VOCAB_TOPICS.map((t) => ({ slug: t.slug, name: t.nameVi, count: t.words.length, group: 'Chủ đề IELTS' })),
  ...SAT_VOCAB_LESSONS.map((l) => ({
    slug: l.slug,
    name: `${l.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${l.title}`,
    count: l.words.length,
    group: 'Từ vựng SAT',
  })),
];

export default function VocabQuizHub() {
  const notebookSize = useVocabStore((s) => Object.keys(s.entries).length);
  const customDecks = useCustomDeckStore((s) => s.decks);
  const stages = useTopicStudyStore((s) => s.stages);
  const [mode, setMode] = useState<Mode>('learn');
  const [filter, setFilter] = useState('');

  const decks = useMemo<Deck[]>(() => {
    const mine: Deck[] = [
      ...(notebookSize >= 4 ? [{ slug: NOTEBOOK_SLUG, name: 'Sổ từ của bạn', count: notebookSize, group: 'Của bạn' }] : []),
      ...Object.values(customDecks)
        .filter((d) => d.words.length >= 4)
        .map((d) => ({ slug: `${CUSTOM_PREFIX}${d.id}`, name: d.name, count: d.words.length, group: 'Của bạn' })),
    ];
    return [...mine, ...STATIC_DECKS];
  }, [notebookSize, customDecks]);

  const [deck, setDeck] = useState<string>(() => decks[0]?.slug ?? VOCAB_TOPICS[0]!.slug);
  const q = filter.trim().toLowerCase();
  const shown = decks.filter((d) => !q || d.name.toLowerCase().includes(q));
  const groups = [...new Set(shown.map((d) => d.group))];
  const chosen = decks.find((d) => d.slug === deck);
  const mastered = (slug: string) => Object.values(stages[slug] ?? {}).filter((s) => s >= 2).length;

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge="QUIZ TỪ VỰNG"
          line1="Chọn kiểu luyện,"
          line2="rồi chọn bộ từ"
          subtitle="Ba cách luyện cho cùng một bộ từ. Đáp án chấm bằng luật, từ nào sai sẽ quay lại trong chính lượt đó."
        />
      </Appear>

      <Text className="mt-6 font-heavy text-sectionTitle text-ink">1. Kiểu luyện</Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        {MODES.map((m) => {
          const on = m.id === mode;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="radio"
              aria-selected={on}
              onPress={() => setMode(m.id)}
              className="rounded-[20px] bg-white p-4"
              style={{
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: 240,
                borderWidth: 2,
                borderColor: on ? m.tone : '#E6E8F2',
                // Chọn kiểu luyện: viền đổi màu mượt và thẻ được chọn nhô lên một chút, không nhảy phựt.
                transform: [{ scale: on ? 1 : 0.985 }],
                ...SELECT_MOTION,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: on ? m.tone : m.soft, ...SELECT_MOTION }}>
                  <Icon name={m.icon} size={18} color={on ? '#FFFFFF' : m.tone} strokeWidth={2} />
                </View>
                <Text className="flex-1 font-heavy text-cardTitle text-ink">{m.title}</Text>
                {on ? <Icon name="check" size={18} color={m.tone} strokeWidth={2.6} /> : null}
              </View>
              <Text className="mt-2 font-sans text-body text-muted">{m.note}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-7 font-heavy text-sectionTitle text-ink">2. Bộ từ</Text>
      <View className="mt-3 flex-row items-center gap-2 rounded-2xl bg-white px-3 py-2" style={{ borderWidth: 1.5, borderColor: '#E2E8F0' }}>
        <Icon name="search" size={16} color="#94A3B8" />
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Tìm bộ từ…"
          placeholderTextColor="#94A3B8"
          className="min-w-0 flex-1 font-sans text-body text-ink"
        />
      </View>
      {groups.map((g) => (
        <View key={g} className="mt-4">
          <Text className="font-strong text-label uppercase tracking-[1.2px] text-muted">{g}</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {shown
              .filter((d) => d.group === g)
              .map((d) => {
                const on = d.slug === deck;
                const m = mastered(d.slug);
                return (
                  <Pressable
                    key={d.slug}
                    onPress={() => setDeck(d.slug)}
                    className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
                    style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#E2E8F0', ...SELECT_MOTION }}
                  >
                    <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                      {d.name}
                    </Text>
                    <Text className="font-sans text-label" style={{ color: on ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>
                      {m ? `${m}/${d.count}` : d.count}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
      {shown.length === 0 ? <Text className="mt-4 font-sans text-body text-muted">Không có bộ từ nào khớp.</Text> : null}

      <View className="mt-7 flex-row flex-wrap items-center gap-3">
        <Button
          size="lg"
          variant="brand"
          label={`Bắt đầu · ${MODES.find((m) => m.id === mode)!.title}`}
          iconRight="arrow-right"
          disabled={!chosen}
          onPress={() => router.push(`/vocabulary/topic/${deck}/${mode}` as never)}
        />
        {chosen ? (
          <Text className="font-sans text-body text-muted">
            {chosen.name} · {chosen.count} từ
          </Text>
        ) : null}
      </View>
      <View className="h-10" />
    </Screen>
  );
}
