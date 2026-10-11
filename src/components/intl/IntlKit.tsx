import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { useL, bi } from '@/i18n/useL';
import type { VocabEntry } from '@/data/intl/vocab-types';
import { LEVEL_LABEL, LEVEL_ORDER, type IntlLevel } from '@/data/intl/level';
import { isKnown, useIntlStore, type IntlExam } from '@/store/useIntlStore';
import type { PracticeQuestion } from '@/services/intl/practice';
import { scorePractice } from '@/services/intl/practice';

export type LevelChoice = IntlLevel | 'all';

/** Chọn mức độ bài luyện: tất cả, dễ, vừa, khó. */
export function LevelPicker({ value, onChange }: { value: LevelChoice; onChange: (v: LevelChoice) => void }) {
  const { L, locale } = useL();
  const options: LevelChoice[] = ['all', ...LEVEL_ORDER];
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt === value;
        const label = opt === 'all' ? L('Tất cả', 'All') : bi(LEVEL_LABEL[opt], locale);
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt)}
            style={{ borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderColor: active ? '#B07A3A' : '#E4DCCB', backgroundColor: active ? '#F7EDDA' : '#FFFFFF' }}
          >
            <Text className="font-strong text-label text-ink">{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function IntlDisclaimer() {
  const { L } = useL();
  return (
    <Text className="font-sans text-label" style={{ color: '#7A6F5E', lineHeight: 18 }}>
      {L(
        'Band 9 không liên kết với ETS. TOEIC® và TOEFL® là nhãn hiệu của ETS. Đây là nội dung luyện tập do Band 9 tự soạn, không phải đề thi thật.',
        'Band 9 is not affiliated with ETS. TOEIC® and TOEFL® are trademarks of ETS. This is practice content written by Band 9, not real exam material.',
      )}
    </Text>
  );
}

/** Danh sách câu trắc nghiệm: chọn đáp án là hiện đúng/sai và lời giải, nộp bài để tính điểm. */
export function QuestionList({
  questions,
  onSubmit,
}: {
  questions: readonly PracticeQuestion[];
  onSubmit: (correct: number, total: number) => void;
}) {
  const { L, locale } = useL();
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = scorePractice(questions, picked);
  const answered = picked.filter((p) => p !== null).length;

  const choose = (qi: number, ci: number) => {
    if (submitted) return;
    setPicked((prev) => prev.map((p, i) => (i === qi ? ci : p)));
  };

  const submit = () => {
    setSubmitted(true);
    onSubmit(score, questions.length);
  };

  return (
    <View className="gap-3">
      {questions.map((q, qi) => {
        const chosen = picked[qi] ?? null;
        const isRight = chosen === q.answer;
        return (
          <Card key={q.id}>
            {q.kind || q.level ? (
              <Text className="font-semi text-label" style={{ color: '#8A6A3A' }}>
                {[q.kind ? bi(q.kind, locale) : null, q.level ? bi(LEVEL_LABEL[q.level], locale) : null].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <Text className="font-strong text-body text-ink">{`${qi + 1}. ${q.prompt}`}</Text>
            <View className="mt-2 gap-2">
              {q.choices.map((c, ci) => {
                const selected = chosen === ci;
                const correctChoice = submitted || chosen !== null ? ci === q.answer : false;
                const border = correctChoice ? '#22A06B' : selected ? '#B07A3A' : '#E4DCCB';
                return (
                  <Pressable
                    key={`${q.id}:${ci}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => choose(qi, ci)}
                    style={{ borderWidth: 1.5, borderColor: border, borderRadius: 10, padding: 10, backgroundColor: selected ? '#F7EDDA' : '#FFFFFF' }}
                  >
                    <Text className="font-sans text-body text-ink">{`${String.fromCharCode(65 + ci)}. ${c}`}</Text>
                  </Pressable>
                );
              })}
            </View>
            {chosen !== null ? (
              <View className="mt-3">
                <Text className="font-strong text-label" style={{ color: isRight ? '#22A06B' : '#C0502E' }}>
                  {isRight ? L('Đúng', 'Correct') : L(`Chưa đúng. Đáp án: ${String.fromCharCode(65 + q.answer)}`, `Not quite. Answer: ${String.fromCharCode(65 + q.answer)}`)}
                </Text>
                <Text className="mt-1 font-sans text-label text-muted">{bi(q.explanation, locale)}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}

      {!submitted ? (
        <Button
          label={L(`Nộp bài (${answered}/${questions.length} câu)`, `Submit (${answered}/${questions.length} answered)`)}
          disabled={answered === 0}
          onPress={submit}
        />
      ) : (
        <Card>
          <Text className="font-heavy text-cardTitle text-ink">{L(`Kết quả: ${score}/${questions.length} câu đúng`, `Score: ${score}/${questions.length} correct`)}</Text>
        </Card>
      )}
    </View>
  );
}

export function VocabDeck({ exam, entries }: { exam: IntlExam; entries: readonly VocabEntry[] }) {
  const { L } = useL();
  const known = useIntlStore((s) => s.known);
  const setKnown = useIntlStore((s) => s.setKnown);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [onlyUnknown, setOnlyUnknown] = useState(false);

  const pool = onlyUnknown ? entries.filter((e) => !isKnown(known, exam, e.word)) : [...entries];
  const knownCount = entries.filter((e) => isKnown(known, exam, e.word)).length;
  if (pool.length === 0) {
    return (
      <Card>
        <Text className="font-strong text-body text-ink">{L('Bạn đã thuộc hết danh sách này.', 'You know every word in this list.')}</Text>
        <Button className="mt-3" variant="outline" label={L('Xem lại tất cả', 'Show all words')} onPress={() => setOnlyUnknown(false)} />
      </Card>
    );
  }

  const current = pool[index % pool.length];
  if (!current) return null;
  const next = () => {
    setRevealed(false);
    setIndex((i) => (i + 1) % pool.length);
  };
  const mark = (value: boolean) => {
    setKnown(exam, current.word, value);
    next();
  };

  return (
    <View className="gap-3">
      <Text className="font-sans text-label text-muted">
        {L(`Đã thuộc ${knownCount}/${entries.length} từ`, `${knownCount}/${entries.length} words known`)}
      </Text>
      <Card>
        <Text className="font-heavy text-pageTitle text-ink">{current.word}</Text>
        <Text className="mt-1 font-sans text-label text-muted">{current.pos}</Text>
        {revealed ? (
          <View className="mt-3 gap-2">
            <Text className="font-strong text-body text-ink">{current.vi}</Text>
            <Text className="font-sans text-body text-ink">{current.en}</Text>
            <Text className="font-sans text-body text-muted">{current.example}</Text>
          </View>
        ) : null}
        <View className="mt-4 flex-row flex-wrap gap-2">
          {!revealed ? (
            <Button label={L('Hiện nghĩa', 'Show meaning')} onPress={() => setRevealed(true)} />
          ) : (
            <>
              <Button label={L('Đã thuộc', 'Know it')} onPress={() => mark(true)} />
              <Button label={L('Chưa thuộc', 'Not yet')} variant="outline" onPress={() => mark(false)} />
            </>
          )}
        </View>
      </Card>
      <Button
        variant="outline"
        label={onlyUnknown ? L('Hiện tất cả từ', 'Show all words') : L('Chỉ ôn từ chưa thuộc', 'Review only unknown words')}
        onPress={() => {
          setOnlyUnknown((v) => !v);
          setIndex(0);
          setRevealed(false);
        }}
      />
    </View>
  );
}

export function FillWord({
  sentence,
  onCheck,
  onResult,
}: {
  sentence: string;
  onCheck: (typed: string) => { ok: boolean; answer: string };
  onResult?: (ok: boolean) => void;
}) {
  const { L } = useL();
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<{ ok: boolean; answer: string } | null>(null);
  const check = () => {
    const r = onCheck(typed);
    setResult(r);
    onResult?.(r.ok);
  };
  return (
    <Card>
      <Text className="font-sans text-body text-ink">{sentence}</Text>
      <TextInput
        value={typed}
        onChangeText={setTyped}
        editable={result === null}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={L('Gõ đủ từ', 'Type the full word')}
        placeholderTextColor="#89928B"
        className="mt-3 rounded-xl border border-border bg-white px-3 py-3 font-sans text-body text-ink"
      />
      {result === null ? (
        <Button className="mt-3" label={L('Kiểm tra', 'Check')} disabled={typed.trim().length === 0} onPress={check} />
      ) : (
        <Text className="mt-3 font-strong text-label" style={{ color: result.ok ? '#22A06B' : '#C0502E' }}>
          {result.ok ? L('Đúng', 'Correct') : L(`Chưa đúng. Đáp án: ${result.answer}`, `Not quite. Answer: ${result.answer}`)}
        </Text>
      )}
    </Card>
  );
}
