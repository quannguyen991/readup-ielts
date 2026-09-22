import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { UnitRunner } from '@/components/sat-rw/UnitRunner';
import { Button, PaperCard } from '@/components/ui';
import { SAT_RW_QUESTIONS, SAT_RW_SKILL_LABEL, getSatRwUnit } from '@/data/sat-rw-repository';
import { useSatRwStore } from '@/store/useSatRwStore';

/** Mỗi lượt luyện theo kỹ năng: đủ để thấy luật lặp lại, chưa đủ để chán. */
const ROUND = 10;

/**
 * Luyện một kỹ năng Verbal — đích của nút "Luyện" trên thẻ kỹ năng.
 *
 * CÂU CHƯA LÀM LÊN TRƯỚC, câu làm sai tiếp theo, câu đã đúng xếp cuối. Bấm
 * "Luyện" lần thứ hai phải là làm tiếp, không phải làm lại mười câu vừa làm.
 * Thứ tự chốt một lần khi mở màn: chấm câu nào cũng không được làm các câu
 * còn lại nhảy chỗ giữa chừng.
 */
export default function SatRwSkillScreen() {
  const { skill = '' } = useLocalSearchParams<{ skill: string }>();
  const questions = useMemo(() => {
    const attempts = useSatRwStore.getState().attempts;
    const rank = (id: string) => (attempts[id] ? (attempts[id]!.correct ? 2 : 1) : 0);
    return SAT_RW_QUESTIONS.filter((q) => q.skill === skill)
      .map((q, i) => ({ q, i }))
      .sort((a, b) => rank(a.q.id) - rank(b.q.id) || a.i - b.i)
      .slice(0, ROUND)
      .map(({ q }) => q);
  }, [skill]);

  const label = SAT_RW_SKILL_LABEL[skill] ?? skill;
  const first = questions[0];

  if (!first) {
    return (
      <TaskShell backHref="/sat-rw" backLabel="Về SAT Verbal" title="Không tìm thấy kỹ năng này" icon="clipboard">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">Kỹ năng bạn vừa mở không có câu nào trong kho.</Text>
          <Button className="mt-4" variant="brand" label="Về SAT Verbal" onPress={() => router.replace('/sat-rw' as never)} />
        </PaperCard>
      </TaskShell>
    );
  }

  return (
    <UnitRunner
      title={label}
      subtitle={`${first.domain} · ${questions.length} câu`}
      questions={questions}
      ruleVi={getSatRwUnit(first.unit)?.ruleVi ?? ''}
      backHref="/sat-rw"
      backLabel="Về SAT Verbal"
      doneHref="/sat-rw"
      doneLabel="Về SAT Verbal"
    />
  );
}
