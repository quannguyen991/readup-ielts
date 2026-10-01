import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { RwSolution } from '@/components/sat-rw/QuestionCard';
import { RuleCheck } from '@/components/sat-rw/RuleCheck';
import { Badge, Button, PaperCard } from '@/components/ui';
import { rwSkillLabel } from '@/components/sat-rw/skill-label';
import { useL } from '@/i18n/useL';
import { getMixedSet } from '@/services/sat-rw/mixed-sets';
import { rwDifficulty, type SatRwQuestion } from '@/data/sat-rw-repository';
import { observeSkill } from '@/store/useMasteryStore';
import { useStudyStore } from '@/store/useStudyStore';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { SatExamShell } from '@/components/sat-exam/SatExamShell';
import { RwPassagePane, RwQuestionPane } from '@/components/sat-exam/RwExamParts';
import { useRwPractice } from '@/components/sat-rw/useRwPractice';

const NO_QUESTIONS: SatRwQuestion[] = [];

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

  const run = useRwPractice(set?.questions ?? NO_QUESTIONS, true);
  const { index, picked, hidden } = run;
  const [correct, setCorrect] = useState(0);
  /** Câu nào đã trả lời "câu này kiểm luật gì". */
  const [ruleAsked, setRuleAsked] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const logQuestions = useStudyStore((s) => s.logQuestions);

  const open = run.question;
  // Gợi ý của Cú: loại bớt hai phương án sai của câu đang mở.
  useOwlHint(
    open && !run.locked && !done
      ? () => {
          if (hidden.length > 0) return false;
          const wrong = open.options.map((_, i) => i).filter((i) => i !== open.answerIndex);
          const from = index % wrong.length;
          run.setHidden([wrong[from]!, wrong[(from + 1) % wrong.length]!]);
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
  const question = run.question;
  const answered = run.locked;
  const asked = !!ruleAsked[index];

  const finish = () => {
    setCorrect(run.finish());
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
              run.reset();
              setRuleAsked({});
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
  const lastQ = index + 1 >= questions.length;

  return (
    <SatExamShell
      section="rw"
      title={setTitle}
      band={L('Trộn bốn mảng, như một module thi thu nhỏ', 'All four domains mixed, like a mini test module')}
      bandRight={L(`Đúng ${run.correctSoFar}`, `${run.correctSoFar} correct`)}
      timer={{ kind: 'up' }}
      questionKeys={questions.map((q) => q.id)}
      index={index}
      onJump={run.go}
      difficulty={rwDifficulty(question)}
      isAnswered={(i) => run.picks[i] !== null}
      passage={<RwPassagePane item={question} />}
      topSlot={<BattleStrip />}
      onBack={() => run.go(index - 1)}
      onNext={() => (lastQ ? finish() : run.go(index + 1))}
      nextLabel={lastQ ? L('Xem kết quả', 'See results') : undefined}
      check={!answered ? { label: L('Kiểm tra', 'Check'), onPress: () => void run.check(), disabled: picked === null } : null}
      onExit={() => {
        const answered = run.picks.filter((c) => c !== null).length;
        if (answered > 0) {
          run.finish(true);
          logQuestions(answered);
        }
        router.replace('/sat-rw' as never);
      }}
      onChoose={answered ? undefined : run.pick}
      choiceCount={question.options.length}
    >
      {/*
        Lời giải (và tô đúng/sai) chỉ hiện SAU câu "câu này kiểm luật gì" — hiện
        trước thì đáp án và tên luật đã nằm sẵn trên màn hình.
      */}
      <RwQuestionPane
        item={question}
        picked={picked}
        onPick={run.pick}
        locked={answered}
        answerIndex={answered && asked ? question.answerIndex : undefined}
        hidden={hidden}
      />

      {answered && !asked ? (
        <RuleCheck
          questionId={question.id}
          actualSkill={question.skill}
          onPick={(pickedSkill) => {
            setRuleAsked((prev) => ({ ...prev, [index]: true }));
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

      {answered && asked ? (
        <>
          <RwSolution question={question} picked={picked} />
          <View className="mt-3 flex-row">
            <Badge label={rwSkillLabel(question.skill, en)} tone="neutral" />
          </View>
        </>
      ) : null}
    </SatExamShell>
  );
}
