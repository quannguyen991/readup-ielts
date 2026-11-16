import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { CamVocabCover } from '@/components/vocab/CamVocabCover';
import { Badge, Button, Card } from '@/components/ui';
import { CAM_VOCAB_BOOKS, camVocabCount, getCamVocabBook } from '@/data/cambridge-vocab';
import { useL } from '@/i18n/useL';

/** /vocabulary/cambridge/[book] — từ và cụm từ của một sách Cambridge, chia theo Test và Passage. */
export default function CambridgeVocabBookScreen() {
  const { book: bookParam } = useLocalSearchParams<{ book?: string }>();
  const { L } = useL();
  const n = Number(bookParam);
  const book = getCamVocabBook(n);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ '1.1': true });

  const needle = query.trim().toLocaleLowerCase();
  const passages = useMemo(() => {
    if (!book) return [];
    return book.passages.map((p) => ({
      ...p,
      key: `${p.test}.${p.passage}`,
      shown: needle ? p.words.filter((w) => w.toLocaleLowerCase().includes(needle)) : p.words,
    }));
  }, [book, needle]);
  const matches = passages.reduce((sum, p) => sum + p.shown.length, 0);
  const allOpen = passages.length > 0 && passages.every((p) => open[p.key]);
  const tests = [1, 2, 3, 4].map((test) => ({
    test,
    passages: passages.filter((p) => p.test === test),
  }));

  const lookup = (word: string) => router.push(`/tu-dien?q=${encodeURIComponent(word)}` as never);
  const study = (test: number, passage: number) => router.push(`/vocabulary/topic/cambridge-${n}-test-${test}-passage-${passage}` as never);

  return (
    <Screen>
      <Button
        className="mb-4 self-start"
        label={L('Từ vựng lấy từ đề', 'Vocabulary from tests')}
        variant="ghost"
        size="sm"
        iconLeft="chevron-left"
        onPress={() => router.push('/vocabulary/from-tests' as never)}
      />

      {!book ? (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy sách này', 'Book not found')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Từ vựng có cho Cambridge IELTS 10 đến 21.', 'Vocabulary is available for Cambridge IELTS 10 to 21.')}</Text>
        </Card>
      ) : (
        <>
          <View className="flex-row items-center gap-4">
            <View style={{ width: 132 }}>
              <CamVocabCover n={book.n} words={camVocabCount(book)} />
            </View>
            <View className="flex-1">
              <Text className="font-heavy text-pageTitle text-ink">{`Cambridge IELTS ${book.n}`}</Text>
              <Text className="mt-1 font-sans text-body text-muted">
                {L(
                  `${camVocabCount(book).toLocaleString('vi-VN')} từ và cụm từ trong ${book.passages.length} bài đọc. Bấm một từ để tra trong Từ điển.`,
                  `${camVocabCount(book).toLocaleString('en-US')} words and phrases across ${book.passages.length} passages. Tap a word to look it up in the dictionary.`,
                )}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {CAM_VOCAB_BOOKS.map((b) => {
              const selected = b.n === book.n;
              return (
                <Pressable
                  key={b.n}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => { setQuery(''); setOpen({ '1.1': true }); router.replace(`/vocabulary/cambridge/${b.n}` as never); }}
                  className={`rounded-pill px-3 py-2 ${selected ? 'bg-primary-700' : 'border border-borderStrong bg-surface'}`}
                >
                  <Text className={`font-semi text-label ${selected ? 'text-white' : 'text-muted'}`}>{`Cam ${b.n}`}</Text>
                </Pressable>
              );
            })}
          </View>

          <Card className="mt-4">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={L('Tìm từ trong sách này…', 'Search words in this book…')}
              placeholderTextColor="#8B8175"
              accessibilityLabel={L('Tìm từ trong sách', 'Search words in this book')}
              className="rounded-panel border border-border bg-surface px-3 py-3 font-sans text-body text-ink"
            />
            <View className="mt-3 flex-row items-center justify-between gap-2">
              <Text className="font-mid text-label text-muted">
                {needle ? L(`${matches} từ khớp`, `${matches} matching words`) : L(`${passages.length} bài đọc`, `${passages.length} passages`)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(allOpen ? {} : Object.fromEntries(passages.map((p) => [p.key, true])))}
              >
                <Text className="font-semi text-label text-primary-700">{allOpen ? L('Thu gọn tất cả', 'Collapse all') : L('Mở tất cả', 'Expand all')}</Text>
              </Pressable>
            </View>
          </Card>

          <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={14}>
            {tests.map((test) => {
              const testWords = test.passages.reduce((sum, p) => sum + p.shown.length, 0);
              return (
                <Card key={test.test}>
                  <View className="flex-row items-center justify-between gap-2 border-b border-border pb-3">
                    <Badge label={`TEST ${test.test}`} tone="primary" />
                    <Text className="font-mid text-label text-muted">{`${testWords} từ`}</Text>
                  </View>
                  <View className="mt-3 gap-3">
                    {test.passages.map((p) => {
                      if (needle && !p.shown.length) return null;
                      const isOpen = needle ? true : !!open[p.key];
                      return (
                        <View key={p.key} className="rounded-panel border border-border bg-surface p-3">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: isOpen }}
                            onPress={() => setOpen((o) => ({ ...o, [p.key]: !o[p.key] }))}
                            className="flex-row items-center gap-2"
                          >
                            <Text className="flex-1 font-strong text-body text-ink">{`Passage ${p.passage}`}</Text>
                            <Text className="font-mid text-label text-muted">{needle ? `${p.shown.length}/${p.words.length}` : `${p.words.length} từ`}</Text>
                            <Text className="font-semi text-label text-primary-700">{isOpen ? '−' : '+'}</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="link"
                            onPress={() => study(test.test, p.passage)}
                            className="mt-2 rounded-lg bg-primary-700 px-3 py-2"
                          >
                            <Text className="text-center font-semi text-label text-white">{L('Mở cách học Band 9 →', 'Open Band 9 study modes →')}</Text>
                          </Pressable>
                          {isOpen ? (
                            <View className="mt-3 flex-row flex-wrap gap-2">
                              {p.shown.map((w, i) => (
                                <Pressable
                                  key={`${w}-${i}`}
                                  accessibilityRole="link"
                                  accessibilityLabel={L(`Tra từ ${w}`, `Look up ${w}`)}
                                  onPress={() => lookup(w)}
                                  className="rounded-pill border border-border bg-white px-3 py-1.5"
                                >
                                  <Text className="font-semi text-label text-ink">{w}</Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </Grid>
        </>
      )}
    </Screen>
  );
}
