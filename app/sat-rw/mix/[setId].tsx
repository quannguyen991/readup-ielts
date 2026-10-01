import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { QuestionCard } from '@/components/sat-rw/QuestionCard';
import { RuleCheck } from '@/components/sat-rw/RuleCheck';
import { Badge, Button, PaperCard } from '@/components/ui';
import { rwSkillLabel } from '@/components/sat-rw/skill-label';
import { useL } from '@/i18n/useL';
import { getMixedSet } from '@/services/sat-rw/mixed-sets';
import { observeSkill } from '@/store/useMasteryStore';
import { recordRwAttempt } from '@/store/useSatRwStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGameStore } from '@/store/useGameStore';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';

/**
 * Làm một đề trộn SAT Reading & Writing.
 *
 * Khác màn luyện unit ở đúng hai chỗ, và cả hai đều có lý do:
 *
 * KHÔNG CÓ HỘP LUẬT. Đề trộn nhiều mảng nên không có một luật chung nào để mở
 * sẵn — mà quan trọng hơn: ở đây người học phải TỰ NHẬN RA câu này đang hỏi luật
 * gì. Hiện luật trước là làm hộ họ phần khó nhất của đề thật.
 *
 * NHÃN KỸ NĂNG HIỆN SAU KHI TRẢ LỜI, không hiện trước. Thấy "Đại từ" trước khi
 * đọc là biết luôn phải soi vào đâu; thấy sau khi chọn thì nó thành lời giải
 * thích cho câu vừa làm.
 */
export default function SatRwMixScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const set = useMemo(() => (setId ? getMixedSet(setId) : undefined), [setId]);
  const { L, en } = useL();

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  /** Đã hỏi "câu này kiểm luật gì" cho câu hiện tại chưa. */
  const [ruleAsked, setRuleAsked] = useState(false);
  const [done, setDone] = useState(false);
  // Phương án Cú đã loại ở câu đang mở.
  const [hidden, setHidden] = useState<number[]>([]);

  const logQuestions = useStudyStore((s) => s.logQuestions);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const open = set?.questions[index];
  // Gợi ý của Cú: loại bớt hai phương án sai của câu đang mở.
  useOwlHint(
    open && picked === null && !done
      ? () => {
          if (hidden.length > 0) return false;
          const wrong = open.options.map((_, i) => i).filter((i) => i !== open.answerIndex);
          const from = index % wrong.length;
          setHidden([wrong[from]!, wrong[(from + 1) % wrong.length]!]);
          return true;
        }
      : null,
  );

  if (!set) {
    return (
      <TaskShell tone="paper" backHref="/sat-rw" backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')} title={L('Không tìm thấy đề này', 'Set not found')} icon="clipboard">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            {L(
              'Đề bạn vừa mở không có trong kho. Quay lại danh sách để chọn đề khác.',
              'The set you opened isn’t in the bank. Go back to the list and pick another one.',
            )}
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label={L('Về SAT Verbal', 'Back to SAT Verbal')}
            onPress={() => router.replace('/sat-rw' as never)}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  const questions = set.questions;
  const setTitle = en ? `Mixed set ${set.order}` : set.title;
  const question = questions[index];
  const answered = picked !== null;

  const submit = (choice: number) => {
    if (picked !== null || !question) return;
    setPicked(choice);
    if (choice === question.answerIndex) setCorrect((n) => n + 1);
    recordRwAttempt(question.id, choice === question.answerIndex, Date.now() - shownAt.current);
    useGameStore.getState().answer(choice === question.answerIndex, 'verbal');
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      setHidden([]);
      setRuleAsked(false);
      return;
    }
    logQuestions(questions.length);
    setDone(true);
  };

  if (done) {
    const percent = Math.round((correct / questions.length) * 100);
    const nextSet = set.order < 50 ? `satrw-mix-${String(set.order + 1).padStart(2, '0')}` : null;

    return (
      <TaskShell tone="paper"
        backHref="/sat-rw"
        backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')}
        title={L('Xong đề', 'Set complete')}
        subtitle={L(`${set.title} · ${questions.length} câu`, `${setTitle} · ${questions.length} questions`)}
        icon="clipboard"
      >
        <PaperCard className="items-center py-8">
          <Text className="font-heavy text-hero text-paper-ink">
            {correct}/{questions.length}
          </Text>
          <Text className="mt-1 font-sans text-body text-paper-muted">{L(`câu đúng · ${percent}%`, `correct · ${percent}%`)}</Text>
        </PaperCard>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button
            variant="brand"
            label={L('Làm lại đề này', 'Retry this set')}
            iconLeft="refresh"
            onPress={() => {
              setIndex(0);
              setPicked(null);
              setHidden([]);
              setRuleAsked(false);
              setCorrect(0);
              setDone(false);
            }}
          />
          {nextSet ? (
            <Button
              variant="brandOutline"
              label={L(`Đề trộn ${set.order + 1}`, `Mixed set ${set.order + 1}`)}
              iconRight="arrow-right"
              onPress={() => router.replace(`/sat-rw/mix/${nextSet}` as never)}
            />
          ) : null}
          <Button variant="brandOutline" label={L('Chọn đề khác', 'Pick another set')} onPress={() => router.replace('/sat-rw' as never)} />
        </View>
      </TaskShell>
    );
  }

  if (!question) return null;

  return (
    <TaskShell tone="paper"
      backHref="/sat-rw"
      backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')}
      title={setTitle}
      subtitle={L('Trộn bốn mảng, như một module thi thu nhỏ', 'All four domains mixed, like a mini test module')}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white px-3.5 py-1.5">
          <Text className="font-strong text-label text-paper-ink">
            {index + 1} / {questions.length} · {L('đúng', 'correct')} {correct}
          </Text>
        </View>
      }
    >
      <BattleStrip className="mb-4" />
      <QuestionCard question={question} picked={picked} onPick={submit} showSolution={ruleAsked} hidden={hidden} />


      {/*
        Trục thứ hai của sổ bằng chứng, chen giữa "đã chọn đáp án" và "xem lời
        giải". Đặt sau lời giải thì vô nghĩa — đáp án đã nằm trên màn hình.
      */}
      {answered && !ruleAsked ? (
        <RuleCheck
          questionId={question.id}
          actualSkill={question.skill}
          onPick={(pickedSkill) => {
            setRuleAsked(true);
            observeSkill({
              skill: { domain: 'sat-verbal', key: question.skill },
              sourceId: question.id,
              answerCorrect: picked === question.answerIndex,
              pointer: { kind: 'error-tag', tag: pickedSkill },
              truth: { kind: 'error-tag', tag: question.skill },
              at: new Date().toISOString(),
            });
          }}
        />
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        {answered && ruleAsked ? (
          <Badge label={rwSkillLabel(question.skill, en)} tone="neutral" />
        ) : null}
        <View className="flex-1" />
        {answered && ruleAsked ? (
          <Button
            variant="brand"
            label={index + 1 < questions.length ? L('Câu tiếp theo', 'Next question') : L('Xem kết quả', 'See results')}
            iconRight="arrow-right"
            onPress={next}
          />
        ) : (
          <Text className="font-sans text-label text-paper-muted">
            {answered
              ? L('Chọn tên luật ở trên để xem lời giải', 'Name the rule above to see the explanation')
              : L('Chọn một phương án để tiếp tục', 'Choose an option to continue')}
          </Text>
        )}
      </View>
    </TaskShell>
  );
}
