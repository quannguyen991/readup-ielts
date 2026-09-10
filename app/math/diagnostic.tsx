import React, { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { MathRunner } from '@/components/math/MathRunner';
import { DIAGNOSTIC_LENGTH, DIAGNOSTIC_MINUTES, buildDiagnostic } from '@/services/math/diagnostic';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Bài chẩn đoán — 19 câu, mỗi kỹ năng một câu.
 *
 * Hạt lấy từ đồng hồ lúc mở màn, nên làm lại lần hai là bộ đề khác. Hạt ấy nằm
 * trong id của từng câu và id được lưu vào lịch sử, nên màn Review vẫn dựng lại
 * đúng bộ đề cũ — không mâu thuẫn với nguyên tắc "không dùng Math.random", vì
 * chỗ này chọn ĐỀ NÀO, còn bộ sinh vẫn hoàn toàn xác định theo id.
 */
export default function MathDiagnosticScreen() {
  const [seed] = useState(() => String(Date.now()));
  const items = useMemo(() => buildDiagnostic(seed), [seed]);

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      const attempts = gradeMathSession(items, responses);
      const id = addSession({
        mode: 'diagnostic',
        skill: null,
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
    [addSession, items, logQuestions, logStudyTime],
  );

  return (
    <MathRunner
      surface="paper"
      title="Bài chẩn đoán"
      subtitle={`${DIAGNOSTIC_LENGTH} câu, mỗi kỹ năng đúng một câu. Không đoán bừa — bỏ trắng cũng là một thông tin.`}
      items={items}
      minutes={DIAGNOSTIC_MINUTES}
      submitLabel="Nộp và xem bản đồ"
      onFinish={finish}
    />
  );
}
