import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, PaperCard } from '@/components/ui';
import { SAT_MATH_REAL_TEST_QUESTIONS, type SatMathQuestion } from '@/data/sat-math-real-tests';
import { useL } from '@/i18n/useL';

const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', { vi: string; en: string; color: string; bg: string }> = {
  easy: { vi: 'Dễ', en: 'Easy', color: '#16814E', bg: '#E7F7EF' },
  medium: { vi: 'Vừa', en: 'Medium', color: '#C97A9A', bg: '#FEF8EE' },
  hard: { vi: 'Khó', en: 'Hard', color: '#C53030', bg: '#FFF5F5' },
};

export default function SatMathRealTestsScreen() {
  const { L, en } = useL();
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const filteredQuestions = useMemo(() => {
    if (filterDifficulty === 'all') return SAT_MATH_REAL_TEST_QUESTIONS;
    return SAT_MATH_REAL_TEST_QUESTIONS.filter((q) => q.difficulty === filterDifficulty);
  }, [filterDifficulty]);

  const currentQ: SatMathQuestion | undefined = filteredQuestions[currentIndex] ?? filteredQuestions[0];

  const totalAnswered = Object.keys(userAnswers).length;
  const totalCorrect = filteredQuestions.reduce((acc, q) => {
    return acc + (userAnswers[q.id] === q.answerIndex ? 1 : 0);
  }, 0);

  const handleSelectOption = (optIndex: number) => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
  };

  const handleCheck = () => {
    if (!currentQ) return;
    setCheckedIds((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const isChecked = currentQ ? !!checkedIds[currentQ.id] : false;
  const selectedOpt = currentQ ? userAnswers[currentQ.id] : undefined;

  return (
    <Screen>
      <Appear>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/sat/lo-trinh' as never)}
          style={{ alignSelf: 'flex-start', marginBottom: 12 }}
        >
          <Text className="font-strong text-label" style={{ color: '#B94A70' }}>
            {L('← Về Lộ trình SAT', '← Back to SAT Roadmap')}
          </Text>
        </Pressable>

        <View className="rounded-[24px] bg-white p-5" style={{ boxShadow: '0 2px 14px rgba(34,35,31,0.06)' }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#B94A70' }}>
              SAT MATH · ĐỀ THI THẬT 2025
            </Text>
            <View className="rounded-full bg-amber-100 px-3 py-1 border border-amber-300">
              <Text className="font-heavy text-tiny text-amber-900">99 CÂU SỐ HÓA</Text>
            </View>
          </View>

          <Text className="mt-1 font-heavy text-pageTitle text-ink">
            {L('Geometry & Trigonometry · Đề thi thật 2025', 'Geometry & Trigonometry · Official 2025 Real Tests')}
          </Text>

          <Text className="mt-1 font-sans text-body text-muted">
            {L(
              'Trích xuất và OCR từ bộ đề thi thật Digital SAT 2025 (Springboard). Toàn bộ câu hỏi bao gồm hình học không gian, tam giác đồng dạng, đường tròn và lượng giác, có giải thích từng bước.',
              'Extracted and OCR digitized from official 2025 Digital SAT real test forms. Includes full step-by-step explanations and Desmos shortcuts.'
            )}
          </Text>

          {/* Difficulty filter tabs */}
          <View className="mt-4 flex-row flex-wrap gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
              const active = filterDifficulty === diff;
              const count =
                diff === 'all'
                  ? SAT_MATH_REAL_TEST_QUESTIONS.length
                  : SAT_MATH_REAL_TEST_QUESTIONS.filter((q) => q.difficulty === diff).length;
              return (
                <Pressable
                  key={diff}
                  onPress={() => {
                    setFilterDifficulty(diff);
                    setCurrentIndex(0);
                  }}
                  className="rounded-full px-4 py-1.5"
                  style={{
                    backgroundColor: active ? '#2A241A' : '#F4EEE2',
                    borderWidth: 1,
                    borderColor: active ? '#2A241A' : '#E8E1D6',
                  }}
                >
                  <Text
                    className="font-heavy text-label"
                    style={{ color: active ? '#FFFFFF' : '#6B6255' }}
                  >
                    {diff === 'all' ? L('Tất cả', 'All') : DIFFICULTY_LABELS[diff as 'easy' | 'medium' | 'hard'][en ? 'en' : 'vi']}{' '}
                    ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Progress bar */}
          <View className="mt-4 flex-row items-center justify-between text-caption">
            <Text className="font-sans text-label text-muted">
              {L(`Câu ${currentIndex + 1} / ${filteredQuestions.length}`, `Question ${currentIndex + 1} of ${filteredQuestions.length}`)}
            </Text>
            <Text className="font-heavy text-label text-ink">
              {L(`Đúng: ${totalCorrect} câu`, `Correct: ${totalCorrect}`)}
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <View
              style={{
                height: 8,
                width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%`,
                borderRadius: 4,
                backgroundColor: '#22A06B',
              }}
            />
          </View>
        </View>
      </Appear>

      {/* Question Card */}
      {currentQ ? (
        <Appear index={1}>
          <PaperCard className="mt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View
                  className="rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: DIFFICULTY_LABELS[currentQ.difficulty].bg,
                    borderWidth: 1,
                    borderColor: DIFFICULTY_LABELS[currentQ.difficulty].color + '40',
                  }}
                >
                  <Text
                    className="font-heavy text-tiny uppercase"
                    style={{ color: DIFFICULTY_LABELS[currentQ.difficulty].color }}
                  >
                    {DIFFICULTY_LABELS[currentQ.difficulty][en ? 'en' : 'vi']}
                  </Text>
                </View>
                <Text className="font-semi text-tiny text-muted">{currentQ.domain}</Text>
              </View>

              {currentQ.sourceBook ? (
                <View className="rounded-full bg-stone-100 px-2.5 py-0.5">
                  <Text className="font-sans text-tiny text-stone-600">{currentQ.sourceBook}</Text>
                </View>
              ) : null}
            </View>

            {/* Stem */}
            <Text className="mt-4 font-heavy text-sectionTitle text-ink" style={{ lineHeight: 28 }}>
              {currentQ.stem}
            </Text>

            {/* Options */}
            <View className="mt-5" style={{ gap: 10 }}>
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOpt === oIdx;
                const isCorrect = currentQ.answerIndex === oIdx;
                const letter = ['A', 'B', 'C', 'D'][oIdx];

                let optBg = '#FFFFFF';
                let optBorder = '#E8E1D6';
                let optTextColor = '#1E2748';

                if (isSelected) {
                  optBg = '#FBF5EC';
                  optBorder = '#C49746';
                }

                if (isChecked) {
                  if (isCorrect) {
                    optBg = '#E7F7EF';
                    optBorder = '#22A06B';
                    optTextColor = '#16814E';
                  } else if (isSelected) {
                    optBg = '#FEECEF';
                    optBorder = '#EF4444';
                    optTextColor = '#B91C1C';
                  }
                }

                return (
                  <Pressable
                    key={oIdx}
                    onPress={() => handleSelectOption(oIdx)}
                    className="flex-row items-center gap-3 rounded-2xl p-4"
                    style={{
                      backgroundColor: optBg,
                      borderWidth: 2,
                      borderColor: optBorder,
                    }}
                  >
                    <View
                      className="h-8 w-8 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: isChecked && isCorrect ? '#22A06B' : isSelected ? '#C49746' : '#F3EEE5',
                      }}
                    >
                      <Text
                        className="font-heavy text-body"
                        style={{
                          color: (isChecked && isCorrect) || isSelected ? '#FFFFFF' : '#6B6255',
                        }}
                      >
                        {letter}
                      </Text>
                    </View>
                    <Text className="min-w-0 flex-1 font-semi text-body" style={{ color: optTextColor }}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Action buttons */}
            <View className="mt-6 flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                label={L('← Câu trước', '← Previous')}
                disabled={currentIndex === 0}
                onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              />

              {!isChecked ? (
                <Button
                  label={L('Kiểm tra đáp án', 'Check Answer')}
                  disabled={selectedOpt === undefined}
                  onPress={handleCheck}
                />
              ) : (
                <Button
                  label={L('Câu tiếp theo →', 'Next Question →')}
                  disabled={currentIndex === filteredQuestions.length - 1}
                  onPress={() => setCurrentIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                />
              )}
            </View>

            {/* Explanation box */}
            {isChecked ? (
              <View
                className="mt-5 rounded-2xl p-4"
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="font-heavy text-label" style={{ color: '#2B6CB0' }}>
                    💡 {L('LỜI GIẢI CHI TIẾT', 'STEP-BY-STEP EXPLANATION')}
                  </Text>
                  <Text className="font-heavy text-label text-ink">
                    · Đáp án đúng: {['A', 'B', 'C', 'D'][currentQ.answerIndex]}
                  </Text>
                </View>
                <Text className="mt-2 font-sans text-body text-ink" style={{ lineHeight: 22 }}>
                  {currentQ.explanation}
                </Text>
              </View>
            ) : null}
          </PaperCard>
        </Appear>
      ) : null}

      {/* Question quick selector sheet */}
      <View className="mt-5 rounded-[24px] bg-white p-5" style={{ boxShadow: '0 2px 14px rgba(34,35,31,0.06)' }}>
        <Text className="font-heavy text-cardTitle text-ink">
          {L('Danh sách 99 câu hỏi', 'All 99 Question Grid')}
        </Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {L('Bấm số câu để nhảy nhanh đến câu hỏi tương ứng.', 'Tap a question number to jump directly.')}
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {filteredQuestions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const ans = userAnswers[q.id];
            const hasChecked = checkedIds[q.id];
            const isRight = hasChecked && ans === q.answerIndex;
            const isWrong = hasChecked && ans !== undefined && ans !== q.answerIndex;

            let badgeBg = '#F3EEE5';
            let badgeText = '#6B6255';
            let badgeBorder = '#E8E1D6';

            if (isCurrent) {
              badgeBorder = '#1E2748';
            }
            if (isRight) {
              badgeBg = '#E7F7EF';
              badgeText = '#16814E';
              badgeBorder = '#22A06B';
            } else if (isWrong) {
              badgeBg = '#FEECEF';
              badgeText = '#B91C1C';
              badgeBorder = '#EF4444';
            } else if (ans !== undefined) {
              badgeBg = '#FEF8EE';
              badgeText = '#C97A9A';
              badgeBorder = '#C49746';
            }

            return (
              <Pressable
                key={q.id}
                onPress={() => setCurrentIndex(idx)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: badgeBg,
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: badgeBorder,
                }}
              >
                <Text className="font-heavy text-tiny" style={{ color: badgeText }}>
                  {idx + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}
