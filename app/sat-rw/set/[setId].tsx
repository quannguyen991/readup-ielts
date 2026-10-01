import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Sticker } from '@/components/illust/Sticker';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';

import { TaskShell } from '@/components/layout/TaskShell';
import { UnitRunner } from '@/components/sat-rw/UnitRunner';
import { Button, PaperCard } from '@/components/ui';
import { getSatRwUnit, questionsForUnit } from '@/data/sat-rw-repository';
import { getSatRwSet } from '@/services/sat-rw/curriculum';
import { GENERATED_KIND_OF_UNIT, generateSetQuestions } from '@/services/sat-rw/generated-sets';
import { useL } from '@/i18n/useL';

/** Tên bộ đề tiếng Anh theo loại (tên tiếng Việt viết sẵn trong services/sat-rw/curriculum). */
const SET_KIND_EN: Partial<Record<string, string>> = {
  learn: 'Get familiar',
  drill: 'Drill',
  checkpoint: 'Skill checkpoint',
  generated: 'Fresh set',
};

/**
 * Làm một bộ đề trong lộ trình SAT Verbal.
 *
 * BỘ ĐỀ LÀ MỘT LÁT CỦA UNIT, không phải một kho riêng. `curriculum.ts` nói lát
 * nào (`slice`) và làm trong điều kiện nào (`instantSolution`); màn này chỉ cắt
 * và giao cho `UnitRunner`. Để màn hình tự quyết lát nào thì luật cắt nằm hai
 * chỗ, và hai chỗ ấy sẽ lệch nhau.
 *
 * BỘ "SINH MỚI" LẤY TỪ BỘ SINH THẬT, không phải 24 câu cũ đổi nhãn. Thẻ bài học
 * hứa "câu mới mỗi lượt" và lời hứa ấy kiểm được trong ba phút — bấm hai lần và
 * so. `generated-sets.ts` làm cầu nối giữa `MockItem` của ba bộ sinh và
 * `SatRwQuestion` mà `QuestionCard` hiểu.
 *
 * SINH LẠI KHI ĐỔI BỘ, không sinh lại mỗi lần render: `useMemo` khoá theo
 * `set.id`. Thiếu khoá thì mỗi lần bấm chọn đáp án là cả bộ đề đổi câu khác ngay
 * dưới tay người đang làm.
 */
export default function SatRwSetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const { L, en } = useL();
  const set = typeof setId === 'string' ? getSatRwSet(setId) : undefined;
  const unit = set ? getSatRwUnit(set.unitNumber) : undefined;

  const questions = useMemo(() => {
    if (!set) return [];
    if (set.kind === 'generated') {
      const kind = GENERATED_KIND_OF_UNIT[set.unitNumber];
      if (!kind) return [];
      return generateSetQuestions(kind, set.unitNumber, set.unitTitle, set.count);
    }
    const all = questionsForUnit(set.unitNumber);
    return set.slice ? all.slice(set.slice.from, set.slice.to) : all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set?.id]);

  if (!set || !unit || questions.length === 0) {
    return (
      <TaskShell tone="paper"
        backHref="/sat-rw"
        backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')}
        title={L('Không tìm thấy bộ đề này', 'Set not found')}
        icon="clipboard"
      >
        <PaperCard className="max-w-[520px]">
          <View aria-hidden className="mb-3">
            <Motion kind="wobble">
              <Sticker tilt={-6}>
                <CuteMagnifier size={56} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-sans text-body text-paper-body">
            {L('Bộ đề bạn vừa mở không có trong lộ trình. Quay lại để chọn bộ khác.', 'The set you opened isn’t in the roadmap. Go back and pick another one.')}
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label={L('Về lộ trình', 'Back to roadmap')}
            onPress={() => router.replace('/sat-rw' as never)}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  return (
    <UnitRunner
      title={en ? (SET_KIND_EN[set.kind] ?? set.title) : set.title}
      subtitle={L(`Bài ${set.unitNumber} · ${unit.title}`, `Unit ${set.unitNumber} · ${unit.title}`)}
      questions={questions}
      ruleVi={unit.ruleVi}
      instantSolution={set.instantSolution}
      backHref="/sat-rw"
      backLabel={L('Về lộ trình', 'Back to roadmap')}
      doneHref="/sat-rw"
      doneLabel={L('Về lộ trình', 'Back to roadmap')}
    />
  );
}
