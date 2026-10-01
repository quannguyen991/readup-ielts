import React, { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { LEVEL_LABEL, QUIZ_SIZE, buildBookSet, buildExtraSet, buildLevelQuiz, chapterById, type Level } from '@/data/sat-roadmap';
import type { PracticeKey } from '@/data/sat-roadmap/progress';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathStore } from '@/store/useMathStore';
import { useSatRoadmapStore } from '@/store/useSatRoadmapStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useL } from '@/i18n/useL';

/**
 * Quiz một mức của một chương: 10 câu sinh từ template (câu mới mỗi lượt), xem
 * lời giải ngay sau từng câu. Nộp xong: ghi điểm vào lộ trình và mở màn xem lại
 * có sẵn của SAT Math (lời giải, tên lỗi của đáp án nhiễu).
 *
 * `level = book`: bộ bài bám sách — đúng số bài, đúng thứ tự dạng bài cuối
 * chương của giáo trình, số mới mỗi lượt. `level = extra`: Luyện thêm 20 câu
 * ngoài sách, dễ → khó.
 */
export default function RoadLevelQuiz() {
  const { id, level } = useLocalSearchParams<{ id: string; level: string }>();
  const c = chapterById(id);
  const lv: PracticeKey | null = (['easy', 'medium', 'hard', 'book', 'extra'] as const).includes(level as PracticeKey) ? (level as PracticeKey) : null;
  const [items] = useState(() => {
    if (!c || !lv) return [];
    const rounds = useSatRoadmapStore.getState().progress[c.id]?.[lv]?.rounds ?? 0;
    return lv === 'book' ? buildBookSet(c, rounds) : lv === 'extra' ? buildExtraSet(c, rounds) : buildLevelQuiz(c, lv, rounds);
  });
  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const { L, en } = useL();

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      if (!c || !lv) return;
      const attempts = gradeMathSession(items, responses);
      const correct = countCorrect(attempts);
      useSatRoadmapStore.getState().record(c.id, lv, correct, attempts.length);
      const sid = addSession({
        mode: 'drill',
        skill: items[0]?.skill ?? null,
        setId: `road:${c.id}:${lv}`,
        attempts,
        rawScore: correct,
        total: attempts.length,
        durationMs: elapsedMs,
        moduleTier: null,
        estimatedScore: null,
      });
      logStudyTime('practice', Math.round(elapsedMs / 60_000));
      logQuestions(attempts.length);
      router.replace(`/math/review/${sid}`);
    },
    [addSession, c, items, logQuestions, logStudyTime, lv],
  );

  if (!c || !lv || items.length === 0) {
    return (
      <Screen>
        <Text className="font-heavy text-ink" style={{ fontSize: 20 }}>
          {L('Mức này chưa có câu hỏi.', 'No questions for this level yet.')}
        </Text>
      </Screen>
    );
  }

  return (
    <MathRunner
      title={L(`Chương ${c.n}. ${c.title.vi}`, `Chapter ${c.n}. ${c.title.en}`)}
      subtitle={
        en
          ? lv === 'extra'
            ? `Extra practice · ${items.length} questions beyond the book · easy → hard`
            : lv === 'book'
              ? `Book set · ${items.length} problems${c.bookPages ? ` · book pages ${c.bookPages[0]}–${c.bookPages[1]}` : ''}`
              : `${LEVEL_LABEL[lv as Level].en} · ${QUIZ_SIZE} questions`
          : lv === 'extra'
            ? `Luyện thêm · ${items.length} câu ngoài sách · dễ → khó`
            : lv === 'book'
              ? `Bộ bài theo sách · ${items.length} bài${c.bookPages ? ` · sách trang ${c.bookPages[0]}–${c.bookPages[1]}` : ''}`
              : `${LEVEL_LABEL[lv as Level].vi} · ${QUIZ_SIZE} câu`
      }
      items={items}
      minutes={Math.max(QUIZ_SIZE, items.length) * 2}
      instantSolution
      submitLabel={L('Nộp bài', 'Submit')}
      onFinish={finish}
    />
  );
}
