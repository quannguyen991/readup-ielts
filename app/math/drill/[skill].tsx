import React, { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { Button, Card } from '@/components/ui';
import { MATH_SKILL_DOMAIN, MATH_SKILL_LABEL, type MathSkill } from '@/lib/math/types';
import { ROUND_SIZE, bankProgress, bankRoundId, bankRoundItems, roundsFor } from '@/services/math/bank';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';

/** Hai phút mỗi câu — nhịp của đề thật (22 câu / 35 phút ≈ 1,6 phút). */
const MINUTES_PER_QUESTION = 2;

export default function MathDrillScreen() {
  const params = useLocalSearchParams<{ skill?: string; round?: string }>();
  const skill = params.skill as MathSkill | undefined;
  const valid = !!skill && skill in MATH_SKILL_DOMAIN;

  /*
    Làm LƯỢT KẾ TIẾP của ngân hàng kỹ năng (xem `services/math/bank.ts`), chốt
    một lần lúc mở màn. Trước đây màn này bốc 6 câu ngẫu nhiên, không thuộc kho
    "148 câu" ghi trên thẻ — làm bao nhiêu lần con số trên thẻ cũng không nói
    lên mình đã đi được bao xa trong kho.
  */
  const [round] = useState(() => {
    if (!valid) return 0;
    const asked = Number(params.round);
    if (Number.isInteger(asked) && asked >= 0 && asked < roundsFor(skill)) return asked;
    return bankProgress(useMathStore.getState().sessions)[skill].nextRound;
  });
  const items = useMemo(() => (valid ? bankRoundItems(skill, round) : []), [round, skill, valid]);

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      const attempts = gradeMathSession(items, responses);
      const id = addSession({
        mode: 'drill',
        skill: skill ?? null,
        setId: skill ? bankRoundId(skill, round) : null,
        attempts,
        rawScore: countCorrect(attempts),
        total: attempts.length,
        durationMs: elapsedMs,
        moduleTier: null,
        estimatedScore: null,
      });

      logStudyTime('practice', Math.round(elapsedMs / 60_000));
      logQuestions(attempts.length);
      router.replace(`/math/review/${id}`);
    },
    [addSession, items, logQuestions, logStudyTime, round, skill],
  );

  if (!valid) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Không có kỹ năng này</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Đường dẫn trỏ tới một kỹ năng không nằm trong 19 kỹ năng của Digital SAT Math.
          </Text>
          <Button className="mt-3" label="Về trang Math" onPress={() => router.replace('/math')} />
        </Card>
      </Screen>
    );
  }

  return (
    <MathRunner
      surface="paper"
      title={`${MATH_SKILL_LABEL[skill]} · lượt ${round + 1}/${roundsFor(skill)}`}
      subtitle={`${items.length} câu của ngân hàng kỹ năng này (mỗi lượt ${ROUND_SIZE} câu). Làm hết rồi xem lại từng câu — sai chỗ nào sẽ được gọi đúng tên chỗ đó.`}
      items={items}
      minutes={items.length * MINUTES_PER_QUESTION}
      submitLabel="Nộp và xem lại"
      onFinish={finish}
    />
  );
}
