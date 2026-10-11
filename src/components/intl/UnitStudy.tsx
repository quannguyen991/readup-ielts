import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import type { VocabEntry } from '@/data/intl/vocab-types';
import type { IntlExam } from '@/store/useIntlStore';
import { buildVocabQuiz, type VocabQuizKind } from '@/services/intl/vocab-quiz';
import { ALL_TOEFL_VOCAB, ALL_TOEIC_VOCAB } from '@/data/intl/units';
import { QuestionList, VocabDeck } from './IntlKit';
import { useIntlStore } from '@/store/useIntlStore';

type Mode = 'cards' | VocabQuizKind;

/** Một unit từ vựng: học thẻ, hoặc làm trắc nghiệm nghĩa (dễ) và điền từ (vừa). */
export function UnitStudy({ exam, entries }: { exam: IntlExam; entries: readonly VocabEntry[] }) {
  const { L } = useL();
  const [mode, setMode] = useState<Mode>('cards');
  const [seed, setSeed] = useState(() => String(Date.now()));
  const recordSession = useIntlStore((s) => s.recordSession);
  const pool = exam === 'toeic' ? ALL_TOEIC_VOCAB : ALL_TOEFL_VOCAB;

  const tabs: { mode: Mode; label: string }[] = [
    { mode: 'cards', label: L('Học thẻ', 'Flashcards') },
    { mode: 'meaning', label: L('Trắc nghiệm: nghĩa (dễ)', 'Quiz: meaning (easy)') },
    { mode: 'cloze', label: L('Trắc nghiệm: điền từ (vừa)', 'Quiz: fill-in (medium)') },
  ];

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.mode === mode;
          return (
            <Pressable
              key={t.mode}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setMode(t.mode);
                setSeed(String(Date.now()));
              }}
              style={{ borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderColor: active ? '#B07A3A' : '#E4DCCB', backgroundColor: active ? '#F7EDDA' : '#FFFFFF' }}
            >
              <Text className="font-strong text-label text-ink">{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'cards' ? (
        <VocabDeck exam={exam} entries={entries} />
      ) : (
        <QuestionList
          key={`${mode}:${seed}`}
          questions={buildVocabQuiz(entries, pool, seed, mode, 10)}
          onSubmit={(correct, total) => recordSession({ exam, activity: `vocab-quiz:${mode}`, correct, total })}
        />
      )}
    </View>
  );
}
