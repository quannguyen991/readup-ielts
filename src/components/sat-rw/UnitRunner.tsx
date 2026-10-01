import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { QuestionCard } from './QuestionCard';
import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import type { SatRwQuestion } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';
import { rwSkillLabel } from './skill-label';
import { useStudyStore } from '@/store/useStudyStore';
import { recordRwAttempt } from '@/store/useSatRwStore';
import { paper } from '@/theme/tokens';
import { CrossFade } from '@/components/motion/Motion';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useGameStore } from '@/store/useGameStore';

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
  const { L, en } = useL();
  const [showRule, setShowRule] = useState(false);
  // Phương án Cú đã loại ở câu đang mở.
  const [hidden, setHidden] = useState<number[]>([]);

  const logQuestions = useStudyStore((s) => s.logQuestions);
  // Mốc bắt đầu nghĩ câu hiện tại — để trang Verbal biết thời gian theo kỹ năng.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const question = questions[index];

  // Gợi ý của Cú chỉ có ở chế độ học (có lời giải ngay); bộ chốt để đo thì không.
  useOwlHint(
    instantSolution && question && picked === null
      ? () => {
          if (hidden.length > 0) return false;
          const wrong = question.options.map((_, i) => i).filter((i) => i !== question.answerIndex);
          const from = index % wrong.length;
          setHidden([wrong[from]!, wrong[(from + 1) % wrong.length]!]);
          return true;
        }
      : null,
  );

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
    recordRwAttempt(question.id, choice === question.answerIndex, Date.now() - shownAt.current);
    // Game khi học: có lời giải ngay thì mỗi câu là một đòn. Bộ chốt chấm cả bài lúc
    // xong — đòn đánh từng câu sẽ để lộ đúng sai trước khi nộp.
    if (instantSolution) useGameStore.getState().answer(choice === question.answerIndex, 'verbal');
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setHidden([]);
      return;
    }
    logQuestions(questions.length);
    if (!instantSolution) useGameStore.getState().awardBatch(correct, questions.length, 'verbal');
    setDone(true);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setHidden([]);
    setAnswers(questions.map(() => null));
    setCorrect(0);
    setDone(false);
  };

  if (done) {
    const percent = Math.round((correct / questions.length) * 100);
    return (
      <TaskShell tone="paper" backHref={backHref} backLabel={backLabel} title={L('Xong bộ này', 'Set complete')} subtitle={subtitle} icon="clipboard">
        <PaperCard className="items-center py-8">
          <Text className="font-heavy text-hero text-paper-ink">
            {correct}/{questions.length}
          </Text>
          <Text className="mt-1 font-sans text-body text-paper-muted">{L(`câu đúng · ${percent}%`, `correct · ${percent}%`)}</Text>
        </PaperCard>

        {/*
          BỘ CHỐT DỒN LỜI GIẢI VỀ ĐÂY. Tắt lời giải giữa chừng mà cũng không cho
          xem ở cuối thì bộ ấy chỉ còn là một con số — người học biết mình sai
          tám câu và không biết sai ở đâu, tức là không học được gì từ nó.
        */}
        {!instantSolution ? (
          <View className="mt-4 gap-3">
            <Text className="font-strong text-bodyLg text-paper-ink">{L('Xem lại từng câu', 'Review each question')}</Text>
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} picked={answers[i] ?? null} onPick={() => {}} />
            ))}
          </View>
        ) : null}

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button variant="brand" label={L('Làm lại bộ này', 'Retry this set')} iconLeft="refresh" onPress={restart} />
          <Button variant="brandOutline" label={doneLabel} onPress={() => router.replace(doneHref as never)} />
        </View>
      </TaskShell>
    );
  }

  return (
    <TaskShell tone="paper"
      backHref={backHref}
      backLabel={backLabel}
      title={title}
      subtitle={subtitle}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white px-3.5 py-1.5">
          <Text className="font-strong text-label text-paper-ink">
            {index + 1} / {questions.length}
            {instantSolution ? L(` · đúng ${correct}`, ` · ${correct} correct`) : ''}
          </Text>
        </View>
      }
    >
      {instantSolution ? <BattleStrip className="mb-4" /> : null}

      {ruleVi ? (
        <PaperCard className="mb-4">
          <Pressable
            accessibilityRole="button"
            aria-expanded={showRule}
            onPress={() => setShowRule((v) => !v)}
            className="flex-row items-center gap-2"
          >
            <Icon
              name={showRule ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={paper.brandMid}
              strokeWidth={2}
            />
            <Text className="font-strong text-body text-paper-ink">{L('Luật của bài này', 'This unit’s rule')}</Text>
          </Pressable>
          {showRule ? (
            <Text className="mt-2.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
              {ruleVi}
            </Text>
          ) : null}
        </PaperCard>
      ) : null}

      {/* Sang câu tiếp theo: câu mới mờ dần vào, không thay chữ tại chỗ. */}
      <CrossFade swapKey={question.id}>
        <QuestionCard
          question={question}
          picked={picked}
          onPick={submit}
          showSolution={instantSolution}
          hidden={hidden}
        />
      </CrossFade>

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Badge label={rwSkillLabel(question.skill, en)} tone="neutral" />
        <View className="flex-1" />
        {answered ? (
          <Button
            variant="brand"
            label={index + 1 < questions.length ? L('Câu tiếp theo', 'Next question') : L('Xem kết quả', 'See results')}
            iconRight="arrow-right"
            onPress={next}
          />
        ) : (
          <Text className="font-sans text-label text-paper-muted">
            {instantSolution
              ? L('Chọn một phương án để xem lời giải', 'Choose an option to see the explanation')
              : L('Chọn một phương án để đi tiếp', 'Choose an option to continue')}
          </Text>
        )}
      </View>
    </TaskShell>
  );
}
