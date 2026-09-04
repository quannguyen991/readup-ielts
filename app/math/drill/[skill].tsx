import React, { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { Button, Card } from '@/components/ui';
import { MATH_SKILL_DOMAIN, MATH_SKILL_LABEL, type MathSkill } from '@/lib/math/types';
import { generateMathSet } from '@/services/math/generator';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';

/** Sáu câu đủ để xác nhận một nhận định từ bài chẩn đoán mà chưa thành buổi học dài. */
const DRILL_LENGTH = 6;
const DRILL_MINUTES = 12;

export default function MathDrillScreen() {
  const params = useLocalSearchParams<{ skill?: string }>();
  const skill = params.skill as MathSkill | undefined;
  const valid = !!skill && skill in MATH_SKILL_DOMAIN;

  const [seed] = useState(() => String(Date.now()));
  const items = useMemo(
    () => (valid ? generateMathSet({ skills: [skill], count: DRILL_LENGTH, seed }) : []),
    [seed, skill, valid],
  );

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      const attempts = gradeMathSession(items, responses);
      const id = addSession({
        mode: 'drill',
        skill: skill ?? null,
        setId: null,
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
    [addSession, items, logQuestions, logStudyTime, skill],
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
      title={`Drill · ${MATH_SKILL_LABEL[skill]}`}
      subtitle={`${DRILL_LENGTH} câu cùng một kỹ năng. Làm hết rồi xem lại từng câu — sai chỗ nào sẽ được gọi đúng tên chỗ đó.`}
      items={items}
      minutes={DRILL_MINUTES}
      submitLabel="Nộp và xem lại"
      onFinish={finish}
    />
  );
}
