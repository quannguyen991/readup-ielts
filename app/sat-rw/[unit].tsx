import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { UnitRunner } from '@/components/sat-rw/UnitRunner';
import { Button, PaperCard } from '@/components/ui';
import { getSatRwUnit, questionsForUnit } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';

/**
 * Luyện TRỌN một unit SAT Reading & Writing, cả 24 câu một lượt.
 *
 * Đứng cạnh lộ trình chứ không thay nó: lộ trình cắt unit thành ba bộ có điều
 * kiện khác nhau, còn màn này là đường tắt cho ai chỉ muốn cày hết một kỹ năng
 * trong một hơi. Cả hai dùng chung `UnitRunner` nên hiện y hệt nhau.
 */
export default function SatRwUnitScreen() {
  const { unit: unitParam } = useLocalSearchParams<{ unit: string }>();
  const { L } = useL();
  const unitNumber = Number(unitParam);
  const unit = Number.isFinite(unitNumber) ? getSatRwUnit(unitNumber) : undefined;
  const questions = unit ? questionsForUnit(unit.unit) : [];

  if (!unit || questions.length === 0) {
    return (
      <TaskShell tone="paper"
        backHref="/sat-rw"
        backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')}
        title={L('Không tìm thấy unit này', 'Unit not found')}
        icon="clipboard"
      >
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            {L(
              'Unit bạn vừa mở không có trong kho. Quay lại danh sách để chọn unit khác.',
              'The unit you opened isn’t in the bank. Go back to the list and pick another one.',
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

  return (
    <UnitRunner
      title={unit.title}
      subtitle={L(`Bài ${unit.unit} · ${unit.domain}`, `Unit ${unit.unit} · ${unit.domain}`)}
      questions={questions}
      ruleVi={unit.ruleVi}
      backHref="/sat-rw"
      backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')}
      doneHref="/sat-rw"
      doneLabel={L('Chọn bài khác', 'Pick another unit')}
    />
  );
}
