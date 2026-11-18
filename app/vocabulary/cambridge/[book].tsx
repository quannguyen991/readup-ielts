import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { CamVocabCover } from '@/components/vocab/CamVocabCover';
import { Badge, Button, Card } from '@/components/ui';
import { CAM_VOCAB_ALL_BOOKS, camVocabBookCount, camVocabCount, getCambridgeAnkiGroups, getCamVocabBook, type CambridgeAnkiEntry, type CambridgeAnkiGroup } from '@/data/cambridge-vocab';
import { getCambridgeOcrSections, getCambridgeOcrVocabulary, type CambridgeOcrSection, type CambridgeOcrVocabularyTerm } from '@/data/cambridge-vocabulary-ocr';
import { useL } from '@/i18n/useL';

/** /vocabulary/cambridge/[book] — từ và cụm từ của một sách Cambridge, chia theo Test và Passage. */
export default function CambridgeVocabBookScreen() {
  const { book: bookParam } = useLocalSearchParams<{ book?: string }>();
  const { L } = useL();
  const n = Number(bookParam);
  const book = getCamVocabBook(n);
  const hasBook = Number.isInteger(n) && CAM_VOCAB_ALL_BOOKS.some((item) => item.n === n);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ '1.1': true });
  const [ocrSection, setOcrSection] = useState<CambridgeOcrSection | 'All'>('All');
  const [ankiSection, setAnkiSection] = useState<'All' | 'Reading' | 'Listening' | 'Other'>('All');
  const [openAnki, setOpenAnki] = useState<Record<string, boolean>>({});

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
  })).filter((test) => test.passages.length > 0);
  const ocrSections = book ? getCambridgeOcrSections(book.n) : [];
  const ocrSectionGroups = useMemo(() => {
    if (!book) return [];
    const sections = ocrSection === 'All' ? getCambridgeOcrSections(book.n) : [ocrSection];
    return sections.map((section) => {
      const terms = getCambridgeOcrVocabulary(book.n, section);
      const shown = needle ? terms.filter((term) => matchesOcrTerm(term, needle)) : terms;
      return { section, terms: shown, count: terms.length };
    });
  }, [book?.n, needle, ocrSection]);
  const ocrMatchCount = ocrSectionGroups.reduce((sum, group) => sum + group.terms.length, 0);
  const ocrTotalCount = ocrSections.reduce((sum, section) => sum + getCambridgeOcrVocabulary(n, section).length, 0);
  const allAnkiGroups = useMemo(() => getCambridgeAnkiGroups(n), [n]);
  const ankiTotalCount = allAnkiGroups.reduce((sum, group) => sum + group.entries.length, 0);
  const ankiGroups = useMemo(() => allAnkiGroups
    .filter((group) => ankiSection === 'All' || group.section === ankiSection)
    .map((group) => ({
      ...group,
      shown: needle ? group.entries.filter((entry) => matchesAnkiEntry(entry, needle)) : group.entries,
    }))
    .filter((group) => group.shown.length > 0), [allAnkiGroups, ankiSection, needle]);
  const ankiMatchCount = ankiGroups.reduce((sum, group) => sum + group.shown.length, 0);
  const ankiAllOpen = ankiGroups.length > 0 && ankiGroups.every((group) => openAnki[group.key]);
  const ankiReadingCount = allAnkiGroups.filter((group) => group.section === 'Reading').reduce((sum, group) => sum + group.entries.length, 0);
  const ankiListeningCount = allAnkiGroups.filter((group) => group.section === 'Listening').reduce((sum, group) => sum + group.entries.length, 0);
  const ankiOtherCount = allAnkiGroups.filter((group) => group.section === 'Other').reduce((sum, group) => sum + group.entries.length, 0);

  const lookup = (word: string) => router.push(`/tu-dien?q=${encodeURIComponent(word)}` as never);
  const study = (test: number, passage: number) => router.push(`/vocabulary/topic/cambridge-${n}-test-${test}-passage-${passage}` as never);
  const lookupOcr = (term: CambridgeOcrVocabularyTerm) => router.push(`/tu-dien?q=${encodeURIComponent(term.term)}` as never);
  const studyAnki = (group: CambridgeAnkiGroup) => {
    if (group.section === 'Reading' && group.test && group.passage) {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-reading-${group.test}-${group.passage}` as never);
    } else if (group.section === 'Reading' && group.test) {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-reading-test-${group.test}` as never);
    } else if (group.section === 'Listening' && group.part) {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-listening-${group.part}` as never);
    } else if (group.section === 'Listening' && group.test) {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-listening-test-${group.test}` as never);
    } else if (group.section === 'Listening') {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-listening-unassigned` as never);
    } else if (group.section === 'Other') {
      router.push(`/vocabulary/topic/cambridge-${n}-anki-other` as never);
    }
  };

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

      {!hasBook ? (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy sách này', 'Book not found')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Từ vựng có cho Cambridge IELTS 09 đến 21.', 'Vocabulary is available for Cambridge IELTS 09 to 21.')}</Text>
        </Card>
      ) : (
        <>
          <View className="flex-row items-center gap-4">
            <View style={{ width: 132 }}>
              <CamVocabCover n={n} words={camVocabBookCount(n)} />
            </View>
            <View className="flex-1">
              <Text className="font-heavy text-pageTitle text-ink">{`Cambridge IELTS ${n}`}</Text>
              <Text className="mt-1 font-sans text-body text-muted">
                {L(
                  `${ankiTotalCount.toLocaleString('vi-VN')} thẻ Anki · ${camVocabCount(book ?? { n, passages: [] }).toLocaleString('vi-VN')} mục Reading · ${book?.passages.length ?? 0} bài đọc.`,
                  `${ankiTotalCount.toLocaleString('en-US')} Anki cards · ${camVocabCount(book ?? { n, passages: [] }).toLocaleString('en-US')} Reading items · ${book?.passages.length ?? 0} passages.`,
                )}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {CAM_VOCAB_ALL_BOOKS.map((b) => {
              const selected = b.n === n;
              return (
                <Pressable
                  key={b.n}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => { setQuery(''); setOcrSection('All'); setAnkiSection('All'); setOpen({ '1.1': true }); setOpenAnki({}); router.replace(`/vocabulary/cambridge/${b.n}` as never); }}
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
              placeholder={L('Tìm trong từ vựng Reading, OCR và Anki…', 'Search Reading, OCR and Anki vocabulary…')}
              placeholderTextColor="#8B8175"
              accessibilityLabel={L('Tìm từ vựng trong sách', 'Search vocabulary in this book')}
              className="rounded-panel border border-border bg-surface px-3 py-3 font-sans text-body text-ink"
            />
            <View className="mt-3 flex-row items-center justify-between gap-2">
              <Text className="font-mid text-label text-muted">
                {needle ? L(`${matches} từ Reading · ${ocrMatchCount} từ OCR · ${ankiMatchCount} thẻ Anki khớp`, `${matches} Reading · ${ocrMatchCount} OCR · ${ankiMatchCount} Anki matches`) : L(`${passages.length} bài đọc · ${ocrTotalCount} mục OCR · ${ankiTotalCount} thẻ Anki`, `${passages.length} passages · ${ocrTotalCount} OCR terms · ${ankiTotalCount} Anki cards`)}
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

          <View className="mt-9 gap-4">
            <View className="flex-row flex-wrap items-end justify-between gap-2 border-b border-borderStrong pb-3">
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-sectionTitle text-ink">{L('Từ vựng từ bộ Anki Cambridge', 'Vocabulary from Cambridge Anki decks')}</Text>
                  <Badge label={L(`${ankiTotalCount} thẻ`, `${ankiTotalCount} cards`)} tone="primary" />
                </View>
                <Text className="mt-1 font-sans text-body text-muted">
                  {L('Từ, nghĩa, phiên âm và ví dụ; chia theo Reading/Listening khi deck có ghi vị trí. Các thẻ không có vị trí vẫn nằm trong nhóm riêng. Nguồn: Daniel (Đăng Ngô VN), AnkiWeb.', 'Words, Vietnamese meanings, pronunciation and examples, grouped by Reading/Listening when the deck supplies a source location. Untagged cards remain in a separate group. Source: Daniel (Đăng Ngô VN), AnkiWeb.')}
                </Text>
              </View>
              <Text className="font-mid text-label text-muted">{needle ? L(`${ankiMatchCount} thẻ khớp`, `${ankiMatchCount} matches`) : ''}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <OcrFilter label={L('Tất cả', 'All')} count={ankiTotalCount} selected={ankiSection === 'All'} onPress={() => setAnkiSection('All')} />
              <OcrFilter label="Reading" count={ankiReadingCount} selected={ankiSection === 'Reading'} onPress={() => setAnkiSection('Reading')} />
              <OcrFilter label="Listening" count={ankiListeningCount} selected={ankiSection === 'Listening'} onPress={() => setAnkiSection('Listening')} />
              <OcrFilter label={L('Chưa gắn vị trí', 'No location')} count={ankiOtherCount} selected={ankiSection === 'Other'} onPress={() => setAnkiSection('Other')} />
            </View>

            {ankiGroups.length ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpenAnki(ankiAllOpen ? {} : Object.fromEntries(ankiGroups.map((group) => [group.key, true])))}
                  className="self-start"
                >
                  <Text className="font-semi text-label text-primary-700">{ankiAllOpen ? L('Thu gọn các nhóm Anki', 'Collapse Anki groups') : L('Mở các nhóm Anki', 'Expand Anki groups')}</Text>
                </Pressable>
                {ankiGroups.map((group) => {
                  const isOpen = needle ? true : !!openAnki[group.key];
                  const studyable = (group.section === 'Reading' && !!group.test) || group.section === 'Listening' || group.section === 'Other';
                  return (
                    <View key={group.key} className="rounded-panel border border-border bg-surface p-3">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded: isOpen }}
                          onPress={() => setOpenAnki((current) => ({ ...current, [group.key]: !current[group.key] }))}
                          className="min-w-0 flex-1 flex-row items-center gap-2"
                        >
                          <Text className="font-strong text-body text-ink">{ankiGroupLabel(group, L)}</Text>
                          <Badge label={`${group.shown.length} ${L('từ', 'words')}`} tone="neutral" />
                          <Text className="font-semi text-label text-primary-700">{isOpen ? '−' : '+'}</Text>
                        </Pressable>
                        {studyable ? (
                          <Pressable accessibilityRole="link" onPress={() => studyAnki(group)} className="rounded-lg bg-primary-700 px-3 py-2">
                            <Text className="font-semi text-label text-white">{L('Mở cách học Band 9 →', 'Open Band 9 study modes →')}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      {isOpen ? (
                        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
                          {group.shown.map((entry) => (
                            <AnkiTermCard key={`${entry.id}-${group.key}`} entry={entry} onPress={() => lookup(entry.word)} L={L} />
                          ))}
                        </Grid>
                      ) : null}
                    </View>
                  );
                })}
              </>
            ) : (
              <Card>
                <Text className="font-mid text-body text-muted">{ankiTotalCount ? L('Không có thẻ Anki nào khớp bộ lọc này.', 'No Anki cards match this filter.') : L('Chưa có dữ liệu Anki cho cuốn này.', 'Anki vocabulary is not available for this book yet.')}</Text>
              </Card>
            )}
          </View>

          <View className="mt-9 gap-4">
            <View className="flex-row flex-wrap items-end justify-between gap-2 border-b border-borderStrong pb-3">
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-sectionTitle text-ink">{L('Từ vựng OCR từ đề Cambridge', 'OCR vocabulary from Cambridge tests')}</Text>
                  <Badge label={L(`${ocrTotalCount} mục`, `${ocrTotalCount} terms`)} tone="primary" />
                </View>
                <Text className="mt-1 font-sans text-body text-muted">
                  {L('Từ và cụm từ được dò trên trang đề đã lưu, kèm nghĩa, cách diễn đạt gần nghĩa và vị trí nguồn. Bấm thẻ để tra từ điển.', 'Terms matched against cached exam pages, with meanings, paraphrases and source locations. Tap a card to open the dictionary.')}
                </Text>
              </View>
              <Text className="font-mid text-label text-muted">{needle ? L(`${ocrMatchCount} mục khớp`, `${ocrMatchCount} matches`) : ''}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <OcrFilter label={L('Tất cả', 'All')} count={ocrTotalCount} selected={ocrSection === 'All'} onPress={() => setOcrSection('All')} />
              {ocrSections.map((section) => (
                <OcrFilter
                  key={section}
                  label={sectionLabel(section, L)}
                  count={getCambridgeOcrVocabulary(n, section).length}
                  selected={ocrSection === section}
                  onPress={() => setOcrSection(section)}
                />
              ))}
            </View>

            {ocrMatchCount ? (
              <View className="gap-5">
                {ocrSectionGroups.filter((group) => group.terms.length > 0).map((group) => (
                  <View key={group.section} className="gap-3">
                    {ocrSection === 'All' ? (
                      <View className="flex-row items-center gap-2">
                        <Text className="font-strong text-cardTitle text-ink">{sectionLabel(group.section, L)}</Text>
                        <Badge label={L(`${group.terms.length} từ`, `${group.terms.length} terms`)} tone="neutral" />
                      </View>
                    ) : null}
                    <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
                      {group.terms.map((term) => (
                        <OcrTermCard key={`${group.section}-${term.id}`} term={term} section={group.section} onPress={() => lookupOcr(term)} L={L} />
                      ))}
                    </Grid>
                  </View>
                ))}
              </View>
            ) : (
              <Card>
                <Text className="font-mid text-body text-muted">{needle ? L('Không có mục OCR nào khớp từ khóa này.', 'No OCR terms match this search.') : L('Chưa có mục OCR cho sách này.', 'No OCR terms are available for this book.')}</Text>
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function matchesOcrTerm(term: CambridgeOcrVocabularyTerm, needle: string): boolean {
  const searchable = [
    term.term,
    term.lemma,
    ...term.variants,
    term.dictionary?.definitionEn,
    term.dictionary?.meaningVi,
    ...(term.dictionary?.paraphrases ?? []),
    term.dictionary?.collocation,
  ].filter(Boolean).join(' ').toLocaleLowerCase();
  return searchable.includes(needle);
}

function matchesAnkiEntry(entry: CambridgeAnkiEntry, needle: string): boolean {
  return [
    entry.word,
    entry.meaningVi,
    entry.definitionEn,
    entry.pos,
    entry.example,
    entry.exampleVi,
    entry.forms,
    entry.ipa,
    ...entry.synonyms,
    ...entry.antonyms,
  ].filter(Boolean).join(' ').toLocaleLowerCase().includes(needle);
}

function ankiGroupLabel(group: CambridgeAnkiGroup, L: (vi: string, en: string) => string): string {
  if (group.section === 'Reading') {
    if (group.test && group.passage) return `Reading · Test ${group.test} · Passage ${group.passage}`;
    return group.test ? `Reading · Test ${group.test}` : L('Reading · chưa rõ test', 'Reading · test not specified');
  }
  if (group.section === 'Listening') {
    if (group.part) return `Listening · Part ${group.part}`;
    return group.test ? `Listening · Test ${group.test}` : L('Listening · chưa rõ part', 'Listening · part not specified');
  }
  return L('Chưa gắn vị trí bài', 'Source section not tagged');
}

function sectionLabel(section: CambridgeOcrSection, L: (vi: string, en: string) => string): string {
  const labels: Record<CambridgeOcrSection, [string, string]> = {
    Listening: ['Listening', 'Listening'],
    Reading: ['Reading', 'Reading'],
    Writing: ['Writing', 'Writing'],
    Speaking: ['Speaking', 'Speaking'],
  };
  const [vi, en] = labels[section];
  return L(vi, en);
}

function OcrFilter({ label, count, selected, onPress }: { label: string; count: number; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-pill border px-3 py-2 ${selected ? 'border-primary-700 bg-primary-700' : 'border-borderStrong bg-surface'}`}
    >
      <Text className={`font-semi text-label ${selected ? 'text-white' : 'text-muted'}`}>{label}</Text>
      <Text className={`font-mid text-[11px] ${selected ? 'text-white' : 'text-subtle'}`}>{count}</Text>
    </Pressable>
  );
}

function AnkiTermCard({ entry, onPress, L }: {
  entry: CambridgeAnkiEntry;
  onPress: () => void;
  L: (vi: string, en: string) => string;
}) {
  return (
    <View className="rounded-panel border border-border bg-white p-4">
      <View className="flex-row flex-wrap items-start gap-2">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={L(`Tra từ ${entry.word}`, `Look up ${entry.word}`)}
          onPress={onPress}
          className="min-w-0 flex-1"
        >
          <Text className="font-strong text-bodyLg text-ink">{entry.word}</Text>
        </Pressable>
        {entry.pos ? <Badge label={entry.pos} tone="neutral" /> : null}
        {entry.markedDuplicate ? <Badge label={L('Lặp trong deck', 'Deck duplicate')} tone="neutral" /> : null}
      </View>
      {entry.ipa ? <Text className="mt-1 font-mid text-label text-subtle">{entry.ipa}</Text> : null}
      {entry.meaningVi ? <Text className="mt-2 font-mid text-body text-ink">{entry.meaningVi}</Text> : null}
      {entry.definitionEn ? <Text className="mt-2 font-sans text-label text-muted">{entry.definitionEn}</Text> : null}
      {entry.example ? <Text className="mt-3 font-sans text-label text-ink">{entry.example}</Text> : null}
      {entry.exampleVi ? <Text className="mt-1 font-sans text-label text-muted">{entry.exampleVi}</Text> : null}
      {entry.forms ? <Text className="mt-2 font-mid text-label text-primary-700">{L('Dạng từ', 'Forms')}: {entry.forms}</Text> : null}
      {entry.synonyms.length ? <Text className="mt-2 font-mid text-label text-muted">{L('Đồng nghĩa', 'Synonyms')}: {entry.synonyms.join(' · ')}</Text> : null}
      {entry.antonyms.length ? <Text className="mt-1 font-mid text-label text-muted">{L('Trái nghĩa', 'Antonyms')}: {entry.antonyms.join(' · ')}</Text> : null}
      {entry.sourceTags.length ? <Text className="mt-2 font-mid text-[11px] text-subtle">{entry.sourceTags.join(' · ')}</Text> : null}
    </View>
  );
}

function OcrTermCard({ term, section, onPress, L }: {
  term: CambridgeOcrVocabularyTerm;
  section: CambridgeOcrSection;
  onPress: () => void;
  L: (vi: string, en: string) => string;
}) {
  const refs = [...term.references.standalonePdfOcr, ...term.references.cachedPageText]
    .filter((ref) => ref.section === section)
    .sort((a, b) => (a.test ?? 99) - (b.test ?? 99) || (a.page ?? 999) - (b.page ?? 999));
  const refByPage = new Map<string, (typeof refs)[number]>();
  for (const ref of refs) {
    const key = `${ref.book}:${ref.section}:${ref.page}`;
    const previous = refByPage.get(key);
    if (!previous) {
      refByPage.set(key, ref);
    } else {
      const preferCurrentSource = ref.evidence === 'standalone-pdf-ocr-cache' && previous.evidence !== 'standalone-pdf-ocr-cache';
      refByPage.set(key, {
        ...(preferCurrentSource ? ref : previous),
        test: previous.test ?? ref.test,
        pageQuestionRangeContext: previous.pageQuestionRangeContext ?? ref.pageQuestionRangeContext,
      });
    }
  }
  const uniqueRefs = [...refByPage.values()];
  const shownRefs = uniqueRefs.slice(0, 2);
  const dictionary = term.dictionary;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Tra từ ${term.term} trong từ điển`, `Look up ${term.term} in the dictionary`)}
      onPress={onPress}
      className="rounded-panel border border-border bg-surface p-4"
    >
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <Text className="min-w-0 flex-1 font-strong text-bodyLg text-ink">{term.term}</Text>
        <Badge label={term.priority === 'high' ? L('Nên học', 'High value') : L('Bổ ích', 'Useful')} tone={term.priority === 'high' ? 'success' : 'neutral'} />
      </View>
      {term.lemma && term.lemma !== term.term ? <Text className="mt-1 font-mid text-label text-muted">{L('Dạng gốc', 'Lemma')}: {term.lemma}</Text> : null}
      {dictionary?.ipa || dictionary?.partOfSpeech ? (
        <Text className="mt-1 font-mid text-label text-subtle">{[dictionary.ipa, dictionary.partOfSpeech].filter(Boolean).join(' · ')}</Text>
      ) : null}
      {dictionary?.definitionEn ? <Text className="mt-3 font-sans text-body text-ink">{dictionary.definitionEn}</Text> : null}
      {dictionary?.meaningVi ? <Text className="mt-1 font-mid text-label text-muted">{dictionary.meaningVi}</Text> : null}
      {dictionary?.collocation ? (
        <Text className="mt-3 font-mid text-label text-primary-700">{L('Collocation', 'Collocation')}: {dictionary.collocation}</Text>
      ) : null}
      {dictionary?.paraphrases?.length ? (
        <Text className="mt-2 font-mid text-label text-muted" numberOfLines={2}>
          {L('Paraphrase', 'Paraphrases')}: {dictionary.paraphrases.slice(0, 4).join(' · ')}
        </Text>
      ) : null}
      <View className="mt-3 border-t border-border pt-2">
        {shownRefs.map((ref, index) => (
          <Text key={`${ref.source}-${ref.test}-${ref.page}-${index}`} className="font-mid text-[11px] text-subtle" numberOfLines={1}>
            {`${ref.evidence === 'standalone-pdf-ocr-cache' ? 'PDF OCR' : L('Trang đã lưu', 'Cached page')} · ${ref.test ? `Test ${ref.test} · ` : ''}${ref.page ? `p. ${ref.page} · ` : ''}${ref.source}`}
          </Text>
        ))}
        {uniqueRefs.length > shownRefs.length ? (
          <Text className="mt-1 font-mid text-[11px] text-subtle">{L(`+ ${uniqueRefs.length - shownRefs.length} nguồn khác`, `+ ${uniqueRefs.length - shownRefs.length} more references`)}</Text>
        ) : null}
      </View>
      <Text className="mt-3 font-semi text-label text-primary-700">{L('Mở từ điển →', 'Open dictionary →')}</Text>
    </Pressable>
  );
}
