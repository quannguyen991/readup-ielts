import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { QuestionCard, RwSolution } from './QuestionCard';
import { TaskShell } from '@/components/layout/TaskShell';
import { Button, PaperCard } from '@/components/ui';
import { rwDifficulty, type SatRwQuestion } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';
import { useStudyStore } from '@/store/useStudyStore';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { SatExamShell } from '@/components/sat-exam/SatExamShell';
import { RwPassagePane, RwQuestionPane } from '@/components/sat-exam/RwExamParts';
import { useRwPractice } from './useRwPractice';

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
 * KHÔNG ĐẾM NGƯỢC ở bất kỳ bộ nào — đây là bài học, chỗ đếm ngược là
 * `/sat/full-test`. Phòng thi (`SatExamShell`) chỉ đếm xuôi, ẩn được.
 *
 * TRÌNH BÀY KIỂU ĐỀ SỐ (01/10/2026): chọn rồi bấm "Kiểm tra" mới hiện lời giải,
 * đi tới / lui tự do; trạng thái lượt làm ở `useRwPractice`.
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
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const { L } = useL();
  const run = useRwPractice(questions, instantSolution);
  const { question, index, picked, hidden } = run;

  const logQuestions = useStudyStore((s) => s.logQuestions);

  // Gợi ý của Cú chỉ có ở chế độ học (có lời giải ngay); bộ chốt để đo thì không.
  useOwlHint(
    instantSolution && question && !run.locked
      ? () => {
          if (hidden.length > 0) return false;
          const wrong = question.options.map((_, i) => i).filter((i) => i !== question.answerIndex);
          const from = index % wrong.length;
          run.setHidden([wrong[from]!, wrong[(from + 1) % wrong.length]!]);
          return true;
        }
      : null,
  );

  if (!question) return null;

  const finish = () => {
    setCorrect(run.finish());
    logQuestions(questions.length);
    setDone(true);
  };

  const restart = () => {
    run.reset();
    setCorrect(0);
    setDone(false);
  };

  const answers = run.picks;

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

  const revealed = instantSolution && run.locked;
  const lastQ = index + 1 >= questions.length;

  return (
    <SatExamShell
      section="rw"
      title={title}
      band={subtitle}
      bandRight={instantSolution ? L(`Đúng ${run.correctSoFar}`, `${run.correctSoFar} correct`) : undefined}
      info={ruleVi || null}
      timer={{ kind: 'up' }}
      questionKeys={questions.map((q) => q.id)}
      index={index}
      onJump={run.go}
      difficulty={rwDifficulty(question)}
      isAnswered={(i) => answers[i] !== null}
      passage={<RwPassagePane item={question} />}
      topSlot={instantSolution ? <BattleStrip /> : null}
      onBack={() => run.go(index - 1)}
      onNext={() => (lastQ ? finish() : run.go(index + 1))}
      nextLabel={lastQ ? L('Xem kết quả', 'See results') : undefined}
      check={null}
      onExit={() => {
        // Lưu & thoát: câu đã kiểm tra đã ghi sẵn; câu mới chọn chưa kiểm tra ghi nốt ở đây.
        const answered = run.picks.filter((c) => c !== null).length;
        if (answered > 0) {
          run.finish(true);
          logQuestions(answered);
        }
        router.replace(backHref as never);
      }}
      onChoose={run.locked ? undefined : run.pick}
      choiceCount={question.options.length}
    >
      <RwQuestionPane
        item={question}
        picked={picked}
        onPick={run.pick}
        locked={run.locked}
        answerIndex={revealed ? question.answerIndex : undefined}
        hidden={hidden}
      />
      {revealed ? <RwSolution question={question} picked={picked} /> : null}
    </SatExamShell>
  );
}
