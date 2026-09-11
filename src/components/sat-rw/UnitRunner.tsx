import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { QuestionCard } from './QuestionCard';
import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import { SAT_RW_SKILL_LABEL, type SatRwQuestion } from '@/data/sat-rw-repository';
import { useStudyStore } from '@/store/useStudyStore';
import { paper } from '@/theme/tokens';

/**
 * Bộ chạy câu hỏi SAT Verbal — một câu một màn.
 *
 * TÁCH RA KHỎI `app/sat-rw/[unit].tsx` khi lộ trình theo bộ đề ra đời: hai
 * đường vào (luyện cả unit, và làm một bộ trong lộ trình) hiện cùng một câu
 * hỏi, nên chúng phải hiện giống hệt nhau. Chép màn hình ra làm hai bản là hai
 * bản sẽ lệch nhau sau vài lần sửa, mà người học thì không hiểu vì sao cùng một
 * câu ở hai chỗ lại trông khác.
 *
 * MỘT CÂU MỘT MÀN, không đổ cả bộ ra một trang. Đề SAT thật cũng hiện từng câu,
 * và quan trọng hơn: lời giải phải đọc NGAY sau khi chọn, lúc còn nhớ mình đã
 * nghĩ gì.
 *
 * `instantSolution` TẮT Ở BỘ CHỐT. Bộ chốt là để ĐO, không phải để học: thấy
 * đáp án sau mỗi câu thì con số cuối bài không còn nói lên điều gì. Khi tắt,
 * lời giải dồn về màn kết quả.
 *
 * KHÔNG BẤM GIỜ ở bất kỳ bộ nào. Đây là bài học, không phải bài thi — chỗ bấm
 * giờ là `/sat/full-test`. Đồng hồ ở đây chỉ tạo áp lực sai chỗ.
 */

export type UnitRunnerProps = {
  title: string;
  subtitle: string;
  questions: SatRwQuestion[];
  /** Hộp luật của unit, hiện được thì hiện — bộ chốt vẫn cho xem. */
  ruleVi?: string | null;
  /** Hiện lời giải ngay sau mỗi câu. Tắt ở bộ chốt. */
  instantSolution?: boolean;
  backHref: string;
  backLabel: string;
  /** Nhãn nút quay lại ở màn kết quả. */
  doneHref: string;
  doneLabel: string;
};

export function UnitRunner({
  title,
  subtitle,
  questions,
  ruleVi,
  instantSolution = true,
  backHref,
  backLabel,
  doneHref,
  doneLabel,
}: UnitRunnerProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [showRule, setShowRule] = useState(false);

  const logQuestions = useStudyStore((s) => s.logQuestions);

  const question = questions[index];
  if (!question) return null;

  const answered = picked !== null;

  const submit = (choice: number) => {
    if (answered) return;
    setPicked(choice);
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = choice;
      return next;
    });
    if (choice === question.answerIndex) setCorrect((n) => n + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    logQuestions(questions.length);
    setDone(true);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setAnswers(questions.map(() => null));
    setCorrect(0);
    setDone(false);
  };

  if (done) {
    const percent = Math.round((correct / questions.length) * 100);
    return (
      <TaskShell backHref={backHref} backLabel={backLabel} title="Xong bộ này" subtitle={subtitle} icon="clipboard">
        <PaperCard className="items-center py-8">
          <Text className="font-heavy text-hero text-paper-ink">
            {correct}/{questions.length}
          </Text>
          <Text className="mt-1 font-sans text-body text-paper-muted">câu đúng · {percent}%</Text>
        </PaperCard>

        {/*
          BỘ CHỐT DỒN LỜI GIẢI VỀ ĐÂY. Tắt lời giải giữa chừng mà cũng không cho
          xem ở cuối thì bộ ấy chỉ còn là một con số — người học biết mình sai
          tám câu và không biết sai ở đâu, tức là không học được gì từ nó.
        */}
        {!instantSolution ? (
          <View className="mt-4 gap-3">
            <Text className="font-strong text-bodyLg text-white">Xem lại từng câu</Text>
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} picked={answers[i] ?? null} onPick={() => {}} />
            ))}
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button variant="onDarkSolid" label="Làm lại bộ này" iconLeft="refresh" onPress={restart} />
          <Button variant="onDark" label={doneLabel} onPress={() => router.replace(doneHref as never)} />
        </View>
      </TaskShell>
    );
  }

  return (
    <TaskShell
      backHref={backHref}
      backLabel={backLabel}
      title={title}
      subtitle={subtitle}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {index + 1} / {questions.length}
            {instantSolution ? ` · đúng ${correct}` : ''}
          </Text>
        </View>
      }
    >
      {ruleVi ? (
        <PaperCard className="mb-4">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showRule }}
            onPress={() => setShowRule((v) => !v)}
            className="flex-row items-center gap-2"
          >
            <Icon
              name={showRule ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={paper.brandMid}
              strokeWidth={2}
            />
            <Text className="font-strong text-body text-paper-ink">Luật của bài này</Text>
          </Pressable>
          {showRule ? (
            <Text className="mt-2.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
              {ruleVi}
            </Text>
          ) : null}
        </PaperCard>
      ) : null}

      <QuestionCard
        question={question}
        picked={picked}
        onPick={submit}
        showSolution={instantSolution}
      />

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Badge label={SAT_RW_SKILL_LABEL[question.skill] ?? question.skill} tone="neutral" />
        <View className="flex-1" />
        {answered ? (
          <Button
            variant="onDarkSolid"
            label={index + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}
            iconRight="arrow-right"
            onPress={next}
          />
        ) : (
          <Text className="font-sans text-label text-white/80">
            {instantSolution ? 'Chọn một phương án để xem lời giải' : 'Chọn một phương án để đi tiếp'}
          </Text>
        )}
      </View>
    </TaskShell>
  );
}
