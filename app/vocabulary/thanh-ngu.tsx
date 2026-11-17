import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { IDIOMS, IDIOM_THEMES, searchIdioms, type Idiom } from '@/data/idioms';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

/** Thành ngữ thông dụng: 100 thành ngữ, 10 chủ đề. Nghe, đọc ví dụ, lưu vào sổ từ để ôn lặp ngắt quãng. */
export default function IdiomsScreen() {
  const { L, locale } = useL();
  const [theme, setTheme] = useState<string>('all');
  const [query, setQuery] = useState('');
  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);

  const saved = useMemo(() => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())), [entries]);
  const items = useMemo(
    () => searchIdioms(query).filter((i) => theme === 'all' || i.theme === theme),
    [query, theme],
  );
  const savedCount = useMemo(() => IDIOMS.filter((i) => saved.has(i.phrase.toLowerCase())).length, [saved]);

  const save = (i: Idiom) => {
    const t = IDIOM_THEMES.find((x) => x.id === i.theme);
    saveWord({
      word: i.phrase,
      lemma: i.phrase.toLowerCase(),
      phonetic: null,
      partOfSpeech: 'idiom',
      definitionContext: i.phrase,
      definitionGeneral: i.example,
      definitionVi: i.vi,
      exampleSentence: i.example,
      sourceSentence: i.example,
      articleId: null,
      articleTitle: L(`Thành ngữ · ${t?.title ?? ''}`, `Idioms · ${t?.titleEn ?? ''}`),
      paragraphIndex: null,
      isCollocation: false,
    });
  };

  return (
    <Screen>
      <LightHero
        scene="vocab"
        badge={L('TỪ VỰNG', 'VOCABULARY')}
        line1={L('Thành ngữ thông dụng', 'Common idioms')}
        line2={L('100 câu, 10 chủ đề', '100 idioms, 10 themes')}
        subtitle={L('Nghe, đọc ví dụ rồi lưu vào sổ từ để ôn lại.', 'Listen, read the example, then save it to review later.')}
      />

      <View className="mt-4 flex-row items-center rounded-xl border border-border bg-surface px-3 py-2">
        <Icon name="search" size={16} color="#94A3B8" />
        <TextInput
          accessibilityLabel={L('Tìm thành ngữ', 'Search idioms')}
          placeholder={L('Gõ thành ngữ, nghĩa tiếng Việt hoặc từ trong ví dụ…', 'Type an idiom, Vietnamese meaning or a word from the example…')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#94A3B8"
          style={{ flex: 1, marginLeft: 8, fontSize: 15, minHeight: 36, color: color.ink, outlineStyle: 'none' as never }}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá ô tìm', 'Clear search')} onPress={() => setQuery('')} hitSlop={10}>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 12 }} accessibilityRole="tablist">
        {[{ id: 'all', title: 'Tất cả', titleEn: 'All' }, ...IDIOM_THEMES].map((t) => {
          const active = theme === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setTheme(t.id)}
              style={{ minHeight: 42, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: active ? color.primary : '#F3F0FB', backgroundColor: active ? '#F3F0FB' : '#FFFFFF' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? color.primary : color.ink }}>{locale === 'en' ? t.titleEn : t.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mt-4 flex-row flex-wrap items-baseline justify-between" style={{ gap: 8 }}>
        <Text className="font-sans text-label text-muted">{items.length} {L('thành ngữ', 'idioms')}</Text>
        <Text className="font-sans text-label text-muted">{L('Đã lưu vào sổ từ', 'Saved to your word book')}: {savedCount} / {IDIOMS.length}</Text>
      </View>

      {items.length === 0 ? (
        <Card className="mt-2">
          <Text className="font-semi text-body text-ink">{L('Không có thành ngữ nào khớp.', 'No idioms match.')}</Text>
          <Text className="mt-1 font-sans text-label text-muted">{L('Thử gõ một từ ngắn hơn, hoặc chọn "Tất cả".', 'Try a shorter word, or pick "All".')}</Text>
        </Card>
      ) : (
        <View className="mt-2">
          {items.map((i) => {
            const already = saved.has(i.phrase.toLowerCase());
            return (
              <Card key={i.phrase} className="mb-2">
                <View className="flex-row items-start justify-between" style={{ gap: 12 }}>
                  <View className="min-w-0 flex-1">
                    <Text className="font-heavy text-cardTitle text-ink">{i.phrase}</Text>
                    <Text className="mt-1 font-semi text-body text-ink">{i.vi}</Text>
                    <View className="mt-2">
                      <ExampleSentence example={i.example} word={i.phrase} className="font-sans text-label text-muted" />
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={L(`Nghe ${i.phrase}`, `Listen to ${i.phrase}`)}
                    onPress={() => void pronounce(i.phrase)}
                    style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}
                  >
                    <Icon name="volume" size={18} color={color.primaryDark} />
                  </Pressable>
                </View>
                <View className="mt-3 flex-row">
                  <Button
                    label={already ? L('Đã lưu', 'Saved') : L('Lưu để ôn', 'Save to review')}
                    variant={already ? 'ghost' : 'outline'}
                    disabled={already}
                    onPress={() => save(i)}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
      <View className="h-8" />
    </Screen>
  );
}
