import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import packs from '@/data/exam-vocabulary.json';
import { useL } from '@/i18n/useL';
import { useVocabStore } from '@/store/useVocabStore';

type ExamVocabularyItem = {
  term: string;
  lemma: string;
  category: 'word' | 'collocation' | 'summary_phrase';
  partOfSpeech: string;
  meaningEn: string;
  meaningVi: string;
  synonyms: string[];
  exampleSentence: string;
  sourcePage?: number;
  sourcePassage?: number;
  sourceRef?: string;
};
type VocabularyPack = {
  id: string;
  exam: 'ielts' | 'sat';
  title: string;
  source: string;
  sourceUrl?: string;
  items: ExamVocabularyItem[];
};

const SETS = (packs as { sets: VocabularyPack[] }).sets;

export default function VocabularyFromTestsScreen() {
  const { L } = useL();
  const [examFilter, setExamFilter] = useState<'all' | 'ielts' | 'sat'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(SETS[0]?.id ?? '');
  const [savedMessage, setSavedMessage] = useState('');
  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);

  const filteredSets = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return SETS.filter((set) => {
      if (examFilter !== 'all' && set.exam !== examFilter) return false;
      return !needle || `${set.title} ${set.source} ${set.id}`.toLocaleLowerCase().includes(needle);
    });
  }, [examFilter, query]);
  const activeSet = filteredSets.find((set) => set.id === selectedId) ?? filteredSets[0] ?? null;

  const addPackToNotebook = (set: VocabularyPack) => {
    const seen = new Set(Object.values(entries).map((entry) => entry.lemma.trim().toLocaleLowerCase()));
    let added = 0;
    let alreadySaved = 0;
    for (const item of set.items) {
      const lemma = item.lemma.trim().toLocaleLowerCase();
      if (!lemma || seen.has(lemma)) {
        alreadySaved += 1;
        continue;
      }
      seen.add(lemma);
      const sourceRef = item.sourcePage
        ? `trang ${item.sourcePage}`
        : item.sourcePassage
          ? `passage ${item.sourcePassage}`
          : item.sourceRef
            ? `câu ${item.sourceRef}`
            : '';
      saveWord({
        word: item.term,
        lemma,
        phonetic: null,
        partOfSpeech: item.partOfSpeech || (item.category === 'word' ? null : 'phrase'),
        definitionContext: item.meaningEn,
        definitionGeneral: item.meaningEn,
        definitionVi: item.meaningVi,
        exampleSentence: item.exampleSentence,
        sourceSentence: item.exampleSentence,
        articleId: null,
        articleTitle: `Từ vựng theo đề · ${set.title}${sourceRef ? ` · ${sourceRef}` : ''}`,
        paragraphIndex: null,
        isCollocation: item.category !== 'word',
        synonyms: item.synonyms,
      });
      added += 1;
    }
    setSavedMessage(L(
      `Đã thêm ${added} mục vào Sổ từ${alreadySaved ? ` · ${alreadySaved} mục đã có` : ''}.`,
      `Added ${added} items to Word Book${alreadySaved ? ` · ${alreadySaved} already existed` : ''}.`,
    ));
  };

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('Từ vựng lấy từ đề', 'Vocabulary from tests')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(`${SETS.length} bộ IELTS · SAT · ${SETS.reduce((sum, set) => sum + set.items.length, 0).toLocaleString('vi-VN')} mục đã đối chiếu với văn bản đề. Chọn một bộ để xem và thêm vào Sổ từ.`, `${SETS.length} IELTS · SAT sets · ${SETS.reduce((sum, set) => sum + set.items.length, 0).toLocaleString('en-US')} items checked against the test text. Choose a set to review or add to Word Book.`)}
      </Text>

      <Card className="mt-4">
        <SectionHeader title={L('Chọn đề', 'Choose a test')} subtitle={L('Mỗi bộ có khoảng 20–25 từ và cụm từ', 'About 20–25 words and phrases in each set')} icon="book" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={L('Tìm Cambridge, Vol, SAT hoặc số đề…', 'Search Cambridge, Volume, SAT, or test number…')}
          placeholderTextColor="#8B8175"
          accessibilityLabel={L('Tìm bộ từ vựng theo đề', 'Search test vocabulary sets')}
          className="mt-3 rounded-panel border border-border bg-surface px-3 py-3 font-sans text-body text-ink"
        />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {([
            ['all', L('Tất cả', 'All')],
            ['ielts', L(`IELTS (${SETS.filter((set) => set.exam === 'ielts').length})`, `IELTS (${SETS.filter((set) => set.exam === 'ielts').length})`)],
            ['sat', L(`SAT (${SETS.filter((set) => set.exam === 'sat').length})`, `SAT (${SETS.filter((set) => set.exam === 'sat').length})`)],
          ] as const).map(([filter, label]) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: examFilter === filter }}
              onPress={() => setExamFilter(filter)}
              className={`rounded-pill px-3 py-2 ${examFilter === filter ? 'bg-primary-700' : 'border border-borderStrong bg-surface'}`}
            >
              <Text className={`font-semi text-label ${examFilter === filter ? 'text-white' : 'text-muted'}`}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-3 gap-2">
          {filteredSets.map((set) => {
            const selected = activeSet?.id === set.id;
            return (
              <Pressable
                key={set.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => { setSelectedId(set.id); setSavedMessage(''); }}
                className={`flex-row items-center gap-2 rounded-panel border px-3 py-3 ${selected ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface'}`}
              >
                <Badge label={set.exam.toUpperCase()} tone={set.exam === 'ielts' ? 'accent' : 'primary'} />
                <Text className={`flex-1 font-semi text-label ${selected ? 'text-primary-800' : 'text-ink'}`}>{set.title}</Text>
                <Text className="font-mid text-label text-muted">{set.items.length}</Text>
              </Pressable>
            );
          })}
          {!filteredSets.length ? <Text className="py-3 font-sans text-body text-muted">{L('Không tìm thấy bộ đề phù hợp.', 'No matching test sets.')}</Text> : null}
        </View>
      </Card>

      {activeSet ? (
        <Card className="mt-4">
          <SectionHeader
            title={activeSet.title}
            subtitle={`${activeSet.source} · ${activeSet.items.length} ${L('mục', 'items')}`}
            icon="letters"
            action={{ label: L('Mở Sổ từ', 'Open notebook'), onPress: () => router.push('/vocabulary' as never) }}
          />
          <Text className="mt-2 font-sans text-label text-subtle">
            {L('Từ/cụm được kiểm tra có xuất hiện trong đề. Câu ví dụ được soạn riêng; dữ liệu không chứa lại đoạn văn hay câu hỏi của đề.', 'Each term or phrase was checked against the test. Example sentences are newly written; this set does not reproduce passages or questions.')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => { router.push(`/ielts-source-practice?id=${activeSet.id}` as never); }}
            className="mt-2 self-start"
          >
            <Text className="font-semi text-label text-primary-700">{L('Luyện đề này trên Band 9 →', 'Practice this test on Band 9 →')}</Text>
          </Pressable>
          <Button
            className="mt-3 self-start"
            label={L(`Thêm ${activeSet.items.length} mục vào Sổ từ`, `Add ${activeSet.items.length} items to Word Book`)}
            iconLeft="plus"
            onPress={() => addPackToNotebook(activeSet)}
          />
          {savedMessage ? <Text className="mt-2 font-semi text-label text-success-700">{savedMessage}</Text> : null}
          <View className="mt-4 gap-3">
            {activeSet.items.map((item, index) => (
              <View key={`${item.lemma}-${index}`} className="rounded-panel border border-border bg-surface p-3">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-strong text-cardTitle text-ink">{item.term}</Text>
                  <Badge label={L(
                    item.category === 'word' ? 'Từ vựng' : item.category === 'collocation' ? 'Collocation' : 'Cụm tóm ý',
                    item.category === 'word' ? 'Vocabulary' : item.category === 'collocation' ? 'Collocation' : 'Summary phrase',
                  )} tone="accent" />
                  <Text className="font-mid text-label text-subtle">{item.partOfSpeech}</Text>
                </View>
                <Text className="mt-2 font-semi text-body text-ink">{item.meaningVi}</Text>
                <Text className="mt-1 font-sans text-label text-muted">{item.meaningEn}</Text>
                {item.synonyms.length ? <Text className="mt-1 font-sans text-label text-primary-700">{L('Synonyms:', 'Synonyms:')} {item.synonyms.join(' · ')}</Text> : null}
                <Text className="mt-2 font-sans text-label text-subtle">{L('Ví dụ:', 'Example:')} “{item.exampleSentence}”</Text>
                <Text className="mt-1 font-mid text-label text-subtle">
                  {item.sourcePage
                    ? L(`Nguồn: ${activeSet.title} · trang ${item.sourcePage}`, `Source: ${activeSet.title} · page ${item.sourcePage}`)
                    : item.sourcePassage
                      ? L(`Nguồn: ${activeSet.title} · passage ${item.sourcePassage}`, `Source: ${activeSet.title} · passage ${item.sourcePassage}`)
                      : item.sourceRef
                        ? L(`Nguồn SAT: ${item.sourceRef}`, `SAT source item: ${item.sourceRef}`)
                        : activeSet.title}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
