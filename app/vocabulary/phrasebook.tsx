import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { PHRASEBOOK_TOPICS, phrasebookItems, type PhrasebookMode } from '@/data/vocab-phrasebook';
import { useL } from '@/i18n/useL';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { lemmatize } from '@/services/dictionary/lookup';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

const MODES: { id: PhrasebookMode; vi: string; en: string }[] = [
  { id: 'vocabulary', vi: 'Từ vựng', en: 'Vocabulary' },
  { id: 'collocations', vi: 'Collocations', en: 'Collocations' },
  { id: 'phrasal-verbs', vi: 'Phrasal verbs', en: 'Phrasal verbs' },
  { id: 'mixed', vi: 'Học trộn', en: 'Mixed practice' },
];

export default function PhrasebookScreen() {
  const { L, locale } = useL();
  const params = useLocalSearchParams<{ mode?: string }>();
  const requestedMode = MODES.some((item) => item.id === params.mode) ? params.mode as PhrasebookMode : 'mixed';
  const [mode, setMode] = useState<PhrasebookMode>(requestedMode);
  const [topicSlug, setTopicSlug] = useState(PHRASEBOOK_TOPICS[0]?.slug ?? 'education');
  const entries = useVocabStore((state) => state.entries);
  const saveWord = useVocabStore((state) => state.saveWord);
  const topic = PHRASEBOOK_TOPICS.find((item) => item.slug === topicSlug) ?? PHRASEBOOK_TOPICS[0]!;
  const items = useMemo(() => phrasebookItems(topicSlug, mode), [mode, topicSlug]);
  const saved = useMemo(() => new Set(Object.values(entries).map((entry) => entry.lemma.toLowerCase())), [entries]);

  const save = (item: (typeof items)[number]) => {
    const original = topic.vocabulary.find((word) => word.word.toLowerCase() === item.term.toLowerCase());
    saveWord({
      word: item.term,
      lemma: lemmatize(item.term).toLowerCase(),
      phonetic: original?.ipa ?? null,
      partOfSpeech: original?.pos ?? (item.kind === 'phrasal-verbs' ? 'phrasal verb' : 'phrase'),
      definitionContext: item.term,
      definitionGeneral: original?.definitionEn ?? item.example,
      definitionVi: item.meaningVi,
      exampleSentence: item.example,
      sourceSentence: item.example,
      articleId: null,
      articleTitle: L(`Sổ cụm từ · ${topic.title}`, `Phrasebook · ${topic.titleEn}`),
      paragraphIndex: null,
      isCollocation: item.kind === 'collocations',
    });
  };

  return (
    <Screen>
      <LightHero
        scene="vocab"
        badge={L('HỌC THEO NGỮ CẢNH', 'LEARN IN CONTEXT')}
        line1={L('Từ và cụm từ theo chủ đề', 'Words and phrases by topic')}
        line2={L('Học riêng hoặc trộn cùng nhau', 'Study separately or together')}
        subtitle={L('10 chủ đề; collocations lấy từ bộ 50 từ/chủ đề, phrasal verbs được chọn theo ngữ cảnh.', '10 themes; collocations draw from the 50-word topic decks, with phrasal verbs grouped by context.')}
      />

      <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="tablist">
        {MODES.map((item) => {
          const active = mode === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setMode(item.id)}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: active ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: active ? color.primary : '#F3F0FB' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>{L(item.vi, item.en)}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
        {PHRASEBOOK_TOPICS.map((item) => {
          const active = topicSlug === item.slug;
          return (
            <Pressable
              key={item.slug}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTopicSlug(item.slug)}
              style={{ minHeight: 42, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: active ? color.primary : '#F3F0FB', backgroundColor: active ? '#F3F0FB' : '#FFFFFF' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? color.primary : color.ink }}>{locale === 'en' ? item.titleEn : item.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {topic ? (
        <View className="mt-5">
          <View className="mb-2 flex-row flex-wrap items-baseline justify-between gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{locale === 'en' ? topic.titleEn : topic.title}</Text>
            <Text className="font-sans text-label text-muted">{items.length} {L('mục học', 'items')}</Text>
          </View>
          {items.map((item, index) => {
            const alreadySaved = saved.has(lemmatize(item.term).toLowerCase());
            const badge = item.kind === 'vocabulary' ? L('Từ vựng', 'Word') : item.kind === 'collocations' ? 'Collocation' : 'Phrasal verb';
            return (
              <Card key={item.id} className="mb-2">
                <View className="flex-row flex-wrap items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="font-heavy text-cardTitle text-ink">{index + 1}. {item.term}</Text>
                      <Text className="rounded-pill px-2 py-1 font-semi text-label" style={{ backgroundColor: '#F3F0FB', color: color.primary }}>{badge}</Text>
                    </View>
                    <Text className="mt-1 font-semi text-body text-ink">{item.meaningVi}</Text>
                    <View className="mt-2">
                      <ExampleSentence example={item.example} word={item.term} className="font-sans text-label text-muted" />
                    </View>
                  </View>
                  <Button
                    label={alreadySaved ? L('Đã lưu', 'Saved') : L('Lưu để ôn', 'Save to review')}
                    variant={alreadySaved ? 'ghost' : 'outline'}
                    onPress={() => save(item)}
                    disabled={alreadySaved}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}
      <View className="h-8" />
    </Screen>
  );
}
