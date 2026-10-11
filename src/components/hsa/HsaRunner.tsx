import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, ProgressBar, SectionHeader } from '@/components/ui';
import { HSA_KIND_LABEL, type HsaQuestion } from '@/data/hsa';
import { bi, useL } from '@/i18n/useL';
import { useIntlStore } from '@/store/useIntlStore';

type Props = {
  title: string;
  questions: readonly HsaQuestion[];
  activity: string;
  durationSeconds?: number;
};

function clock(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/** One-question-at-a-time HSA runner: responses and explanations stay hidden until submission. */
export function HsaRunner({ title, questions, activity, durationSeconds }: Props) {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds ?? 0);
  const saved = useRef(false);
  const submitRef = useRef<() => void>(() => undefined);

  const correct = useMemo(
    () => questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, questions],
  );

  submitRef.current = () => {
    if (saved.current) return;
    saved.current = true;
    setSubmitted(true);
    recordSession({ exam: 'hsa', activity, correct, total: questions.length });
  };

  useEffect(() => {
    if (!durationSeconds || submitted) return;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(timer);
          submitRef.current();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [durationSeconds, submitted]);

  if (!questions.length) {
    return <Screen><Text className="font-strong text-body text-ink">{L('Chưa có câu hỏi cho mục này.', 'There are no questions in this section yet.')}</Text></Screen>;
  }

  const q = questions[current];
  const picked = answers[current];
  const answered = answers.filter((value) => value !== null).length;

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Badge label={bi(HSA_KIND_LABEL[q.kind], locale)} tone="primary" />
        <Badge label={q.level} tone={q.level === 'C1' ? 'danger' : q.level === 'B2' ? 'warning' : 'neutral'} />
        {durationSeconds ? <Badge label={clock(remaining)} tone={remaining < 300 ? 'danger' : 'info'} /> : null}
      </View>
      <ProgressBar className="mt-4" value={(answered / questions.length) * 100} label={L('Tiến độ trả lời', 'Answer progress')} valueLabel={`${answered}/${questions.length}`} />

      <Card className="mt-4">
        <Text className="font-semi text-label text-muted">{L(`Câu ${current + 1}/${questions.length}`, `Question ${current + 1}/${questions.length}`)}</Text>
        {q.context ? <Text className="mt-3 font-sans text-body text-ink" style={{ lineHeight: 25 }}>{q.context}</Text> : null}
        <Text className="mt-3 font-strong text-bodyLg text-ink" style={{ lineHeight: 27 }}>{q.prompt}</Text>
        <View className="mt-4 gap-2">
          {q.choices.map((choice, index) => {
            const isPicked = picked === index;
            const isCorrect = submitted && index === q.answer;
            const isWrongPick = submitted && isPicked && index !== q.answer;
            const borderColor = isCorrect ? '#16835D' : isWrongPick ? '#C33D47' : isPicked ? '#6954C8' : '#E5E7EB';
            const bgColor = isCorrect ? '#EAF7F0' : isWrongPick ? '#FFF0F0' : isPicked ? '#F2F0FF' : '#FFFFFF';
            return (
              <Pressable
                key={`${q.id}-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isPicked, disabled: submitted }}
                disabled={submitted}
                onPress={() => setAnswers((prev) => prev.map((value, i) => i === current ? index : value))}
                className="rounded-panel border p-3"
                style={{ borderColor, backgroundColor: bgColor }}
              >
                <Text className="font-sans text-body text-ink">{String.fromCharCode(65 + index)}. {choice}</Text>
              </Pressable>
            );
          })}
        </View>
        {submitted ? (
          <View className="mt-4 rounded-panel bg-surfaceAlt p-3">
            <Text className="font-strong text-body text-ink">{picked === q.answer ? L('Chính xác', 'Correct') : L(`Đáp án: ${String.fromCharCode(65 + q.answer)}`, `Answer: ${String.fromCharCode(65 + q.answer)}`)}</Text>
            <Text className="mt-1 font-sans text-body text-muted" style={{ lineHeight: 22 }}>{bi(q.explanation, locale)}</Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader className="mt-5" title={L('Đi đến câu', 'Jump to question')} icon="grid" sticker={false} />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {questions.map((question, index) => (
          <Pressable key={question.id} accessibilityRole="button" accessibilityLabel={L(`Câu ${index + 1}`, `Question ${index + 1}`)} onPress={() => setCurrent(index)} className="h-10 min-w-10 items-center justify-center rounded-md border px-2" style={{ borderColor: index === current ? '#6954C8' : '#E4E4E7', backgroundColor: index === current ? '#F2F0FF' : answers[index] !== null ? '#EAF7F0' : '#FFFFFF' }}>
            <Text className="font-semi text-label text-ink">{index + 1}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-5 flex-row gap-2">
        <View className="flex-1"><Button variant="outline" label={L('Trước', 'Previous')} disabled={current === 0} onPress={() => setCurrent((n) => Math.max(0, n - 1))} /></View>
        {current < questions.length - 1 ? (
          <View className="flex-1"><Button label={L('Tiếp', 'Next')} onPress={() => setCurrent((n) => Math.min(questions.length - 1, n + 1))} /></View>
        ) : !submitted ? (
          <View className="flex-1"><Button label={L('Nộp bài', 'Submit')} onPress={() => submitRef.current()} /></View>
        ) : null}
      </View>

      {submitted ? (
        <Card className="mt-4">
          <Text className="font-heavy text-cardTitle text-ink">{L(`Kết quả luyện tập: ${correct}/${questions.length}`, `Practice result: ${correct}/${questions.length}`)}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Điểm này chỉ phản ánh bộ câu hỏi trong app, không quy đổi thành điểm HSA.', 'This score reflects this app practice set only and is not an official HSA score.')}</Text>
          <Button className="mt-3" label={L('Về trang HSA', 'Back to HSA')} onPress={() => router.replace('/hsa' as never)} />
        </Card>
      ) : null}
    </Screen>
  );
}
