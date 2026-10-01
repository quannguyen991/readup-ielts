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
import { PageStickers } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as BadgeSticker } from '@/components/illust/Cute';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

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
  const { L } = useL();

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
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
        style={{ maxWidth: layout.contentMaxWidth }}
      >
        <Pressable onPress={() => router.push('/write/tests')} className="mb-3 flex-row items-center gap-1">
          <Icon name="chevron-left" size={18} color={color.muted} />
          <Text className="font-semi text-body text-muted">{L('Kho đề', 'Prompts')}</Text>
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-3">
              <Text className="font-heavy text-pageTitle text-ink">SAT Writing</Text>
              <View aria-hidden>
                <Label text={L('Không cần AI ⚡', 'No AI needed ⚡')} color="#F2B632" tilt={-4} size={12} />
              </View>
            </View>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              {L('Hai nhóm kỹ năng viết của SAT, toàn trắc nghiệm.', 'SAT\'s two writing skill groups, all multiple choice.')}
            </Text>
          </View>
          <View aria-hidden>
            <PageStickers scene="writing" />
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <View aria-hidden>
            <BadgeSticker icon="target" color="#A8843F" size={28} />
          </View>
          <Chip label={L('Tất cả', 'All')} active={focus === 'all'} onPress={() => switchFocus('all')} />
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
          {L('Rhetorical Synthesis sắp có.', 'Rhetorical Synthesis is coming soon.')}
        </Text>

        {!question ? (
          <Card className="mt-4">
            <View className="flex-row items-center gap-3">
              <View aria-hidden>
                <Motion kind="wobble">
                  <Sticker tilt={-6}>
                    <CuteMagnifier size={52} />
                  </Sticker>
                </Motion>
              </View>
              <Text className="min-w-0 flex-1 font-sans text-body text-muted">
                {L('Không dựng được câu hỏi nào cho lựa chọn này.', "Couldn't build any questions for this choice.")}
              </Text>
            </View>
          </Card>
        ) : (
          <Card className="mt-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Badge tone="primary" label={QUESTION_TYPE_LABEL[question.type]} />
              <Text className="font-sans text-label text-muted">
                {L('Câu', 'Question')} {index + 1} / {questions.length}
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
                  {picked === question.correctAnswer ? L('Đúng', 'Correct') : L(`Sai — đáp án là "${question.correctAnswer}"`, `Wrong — the answer is "${question.correctAnswer}"`)}
                </Text>
                <Text className="mt-2 font-sans text-body text-body">{question.explanation}</Text>
                {question.lessonTip ? (
                  <Text className="mt-2 font-sans text-label text-muted">
                    {L('Mẹo:', 'Tip:')} {question.lessonTip}
                  </Text>
                ) : null}
                <Text className="mt-3 font-sans text-label text-subtle">
                  {L('Câu gốc:', 'Original sentence:')} {question.evidenceText}
                </Text>
                <View className="mt-3 flex-row">
                  <Button label={L('Câu tiếp theo', 'Next question')} onPress={next} />
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
      aria-selected={active}
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
