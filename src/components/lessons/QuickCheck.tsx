import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { MathQuestionView } from '@/components/math/MathQuestionView';
import { CrossFade } from '@/components/motion/Motion';
import { QuestionCard } from '@/components/sat-rw/QuestionCard';
import { Button } from '@/components/ui';
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import type { MathSkill } from '@/lib/math/types';
import { generateMathSet } from '@/services/math/generator';
import { gradeMathItem } from '@/services/math/grade';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;
const SIZE = 3;

/**
 * Ba câu tự kiểm tra cuối bài lý thuyết, chấm ngay từng câu.
 *
 * Math: sinh từ đúng bộ khuôn của kỹ năng với hạt `lesson:<skill>` — cố định,
 * nên đọc lại bài thì gặp lại đúng ba câu đã thử. Verbal: ba câu CUỐI của kỹ
 * năng trong kho, để không trùng Bộ đề 1 mà người học sẽ làm ngay sau đó.
 */
export function MathQuickCheck({ skill }: { skill: MathSkill }) {
  const items = useMemo(() => generateMathSet({ skills: [skill], count: SIZE, seed: `lesson:${skill}` }), [skill]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const { L } = useL();
  const item = items[i];

  if (!item) return <Summary score={score} total={items.length} onRetry={() => { setI(0); setScore(0); }} />;

  return (
    <CrossFade swapKey={`m-${i}`}>
      <View className="rounded-[22px] bg-white p-5" style={CARD}>
        <MathQuestionView item={item} answer={answer} onAnswer={revealed ? undefined : setAnswer} revealed={revealed} index={i} />
        <View className="mt-4 flex-row flex-wrap gap-2">
          {!revealed ? (
            <Button
              label={L('Kiểm tra', 'Check')}
              disabled={answer === null || answer === ''}
              onPress={() => {
                setRevealed(true);
                const ok = gradeMathItem(item, answer).isCorrect;
                if (ok) setScore((n) => n + 1);
                useGameStore.getState().answer(ok, 'math');
              }}
            />
          ) : (
            <Button
              label={i + 1 < items.length ? L('Câu tiếp', 'Next question') : L('Xem kết quả', 'See results')}
              iconRight="arrow-right"
              onPress={() => {
                setI((n) => n + 1);
                setAnswer(null);
                setRevealed(false);
              }}
            />
          )}
          <Text className="self-center font-sans text-label text-muted">
            {L('Câu', 'Question')} {i + 1}/{items.length}
          </Text>
        </View>
      </View>
    </CrossFade>
  );
}

export function VerbalQuickCheck({ skill }: { skill: string }) {
  const questions = useMemo(() => SAT_RW_QUESTIONS.filter((q) => q.skill === skill).slice(-SIZE), [skill]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const { L } = useL();
  const q = questions[i];

  if (!q) return <Summary score={score} total={questions.length} onRetry={() => { setI(0); setScore(0); }} />;

  return (
    <CrossFade swapKey={`v-${i}`}>
      <View>
        <QuestionCard
          question={q}
          picked={picked}
          onPick={(c) => {
            setPicked(c);
            if (c === q.answerIndex) setScore((n) => n + 1);
            useGameStore.getState().answer(c === q.answerIndex, 'verbal');
          }}
        />
        {picked !== null ? (
          <View className="mt-3 flex-row">
            <Button
              label={i + 1 < questions.length ? L('Câu tiếp', 'Next question') : L('Xem kết quả', 'See results')}
              iconRight="arrow-right"
              onPress={() => {
                setI((n) => n + 1);
                setPicked(null);
              }}
            />
          </View>
        ) : null}
      </View>
    </CrossFade>
  );
}

function Summary({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) {
  const good = score === total;
  const { L } = useL();
  return (
    <CrossFade swapKey="summary">
      <View className="rounded-[22px] bg-white p-6" style={CARD}>
        <Text className="font-heavy text-pageTitle text-ink">
          {L(`${score}/${total} câu đúng`, `${score}/${total} correct`)}
        </Text>
        <Text className="mt-1 font-sans text-bodyLg text-muted">
          {good
            ? L('Nắm được bài rồi — sang bộ đề để chứng minh ở tốc độ phòng thi.', 'You’ve got it — now prove it at exam speed with a question set.')
            : L('Đọc lại phần ví dụ và bẫy ở trên, rồi thử lại trước khi sang bộ đề.', 'Reread the examples and traps above, then try again before the question sets.')}
        </Text>
        <View className="mt-4 flex-row">
          <Button variant="secondary" label={L('Làm lại 3 câu', 'Redo the 3 questions')} iconLeft="refresh" onPress={onRetry} />
        </View>
      </View>
    </CrossFade>
  );
}
