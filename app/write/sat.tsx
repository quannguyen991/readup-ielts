import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import { ARTICLES, getArticleWithBody } from '@/data/articles';
import { generateSatWritingQuestions } from '@/services/questions/sat-writing-generator';
import { QUESTION_TYPE_LABEL, SAT_WRITING_QUESTION_TYPES } from '@/services/questions/types';
import { color, layout } from '@/theme/tokens';
import type { GeneratedQuestion } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

/**
 * Luyện SAT Writing — hai domain Expression of Ideas và Standard English
 * Conventions.
 *
 * Câu hỏi sinh tại chỗ từ kho passage SAT đã có, không cần gọi AI và không cần
 * kho đề riêng. Người học chọn dạng muốn luyện rồi làm liên tục; đây là kiểu
 * luyện theo kỹ năng mà đề thi thật không cho phép (đề thi trộn chung mọi dạng).
 */

/** Lấy vừa đủ bài để dựng một phiên luyện, không quét cả kho. */
const ARTICLES_PER_SESSION = 40;

export default function SatWritingScreen() {
  const [focus, setFocus] = useState<QuestionType | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const questions = useMemo(() => buildQuestions(focus), [focus]);
  const question = questions[index];

  const choose = (option: string) => {
    if (picked) return; // Đã chọn rồi thì khoá lại, không cho đổi đáp án.
    setPicked(option);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => (i + 1) % Math.max(1, questions.length));
  };

  const switchFocus = (f: QuestionType | 'all') => {
    setFocus(f);
    setIndex(0);
    setPicked(null);
  };

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
        style={{ maxWidth: layout.contentMaxWidth }}
      >
        <Pressable onPress={() => router.push('/write')} className="mb-3 flex-row items-center gap-1">
          <Icon name="chevron-left" size={18} color={color.muted} />
          <Text className="font-semi text-body text-muted">Kho đề</Text>
        </Pressable>

        <Text className="font-heavy text-pageTitle text-ink">SAT Writing</Text>
        <Text className="mt-1 font-sans text-bodyLg text-muted">
          Hai nhóm kỹ năng viết của SAT Reading and Writing. Toàn bộ là câu hỏi trắc nghiệm — bài
          thi số hoá hiện nay không còn phần viết luận.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Chip label="Tất cả" active={focus === 'all'} onPress={() => switchFocus('all')} />
          {SAT_WRITING_QUESTION_TYPES.filter((t) => t !== 'sat_rhetorical_synthesis').map((t) => (
            <Chip
              key={t}
              label={QUESTION_TYPE_LABEL[t]}
              active={focus === t}
              onPress={() => switchFocus(t)}
            />
          ))}
        </View>

        <Text className="mt-2 font-sans text-label text-subtle">
          Rhetorical Synthesis chưa có: dạng đó cho gạch đầu dòng ghi chú chứ không phải văn xuôi,
          nên không sinh offline được mà không làm lộ đáp án.
        </Text>

        {!question ? (
          <Card className="mt-4">
            <Text className="font-sans text-body text-muted">
              Không dựng được câu hỏi nào cho lựa chọn này.
            </Text>
          </Card>
        ) : (
          <Card className="mt-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Badge tone="primary" label={QUESTION_TYPE_LABEL[question.type]} />
              <Text className="font-sans text-label text-muted">
                Câu {index + 1} / {questions.length}
              </Text>
            </View>

            <Text className="mt-3 font-sans text-body text-muted">{question.instruction}</Text>
            <Text className="mt-2 font-sans text-bodyLg text-ink" style={{ lineHeight: 24 }}>
              {question.prompt}
            </Text>

            <View className="mt-4 gap-2">
              {question.options?.map((option) => {
                const isAnswer = option === question.correctAnswer;
                const isPicked = option === picked;
                const revealed = picked !== null;

                return (
                  <Pressable
                    key={option}
                    onPress={() => choose(option)}
                    accessibilityRole="button"
                    className={[
                      'rounded-md border px-3 py-2.5',
                      !revealed
                        ? 'border-border bg-surface'
                        : isAnswer
                          ? 'border-success bg-success-soft'
                          : isPicked
                            ? 'border-danger bg-danger-soft'
                            : 'border-border bg-surface opacity-60',
                    ].join(' ')}
                  >
                    <Text className="font-sans text-body text-ink">{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            {picked ? (
              <View className="mt-4">
                <Text
                  className={[
                    'font-strong text-body',
                    picked === question.correctAnswer ? 'text-success-ink' : 'text-danger-ink',
                  ].join(' ')}
                >
                  {picked === question.correctAnswer ? 'Đúng' : `Sai — đáp án là "${question.correctAnswer}"`}
                </Text>
                <Text className="mt-2 font-sans text-body text-body">{question.explanation}</Text>
                {question.lessonTip ? (
                  <Text className="mt-2 font-sans text-label text-muted">
                    Mẹo: {question.lessonTip}
                  </Text>
                ) : null}
                <Text className="mt-3 font-sans text-label text-subtle">
                  Câu gốc: {question.evidenceText}
                </Text>
                <View className="mt-3 flex-row">
                  <Button label="Câu tiếp theo" onPress={next} />
                </View>
              </View>
            ) : null}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function buildQuestions(focus: QuestionType | 'all'): GeneratedQuestion[] {
  const satArticles = ARTICLES.filter((a) => a.exam === 'sat').slice(0, ARTICLES_PER_SESSION);

  const all: GeneratedQuestion[] = [];
  for (const meta of satArticles) {
    const article = getArticleWithBody(meta.id);
    if (!article) continue;
    all.push(...generateSatWritingQuestions(article));
  }

  return focus === 'all' ? all : all.filter((q) => q.type === focus);
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-body'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
