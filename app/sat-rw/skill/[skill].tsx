import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Sticker } from '@/components/illust/Sticker';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';

import { TaskShell } from '@/components/layout/TaskShell';
import { UnitRunner } from '@/components/sat-rw/UnitRunner';
import { Button, PaperCard } from '@/components/ui';
import { SAT_RW_QUESTIONS, getSatRwUnit } from '@/data/sat-rw-repository';
import { rwSkillLabel } from '@/components/sat-rw/skill-label';
import { useL } from '@/i18n/useL';
import { useSatRwStore } from '@/store/useSatRwStore';
import { SetPicker, type PickerSet } from '@/components/practice/SetPicker';

/** Mỗi lượt luyện theo kỹ năng: đủ để thấy luật lặp lại, chưa đủ để chán. */
const ROUND = 10;

/**
 * Luyện một kỹ năng Verbal — đích của nút "Luyện" trên thẻ kỹ năng.
 *
 * Không có `?set=` thì hiện DANH SÁCH BỘ ĐỀ: câu của kỹ năng chia theo thứ tự
 * kho thành các bộ 10 câu cố định, mỗi bộ ghi đã làm bao nhiêu câu, đúng bao
 * nhiêu. Chọn bộ nào làm bộ đó; làm lại một bộ thì gặp đúng các câu cũ.
 */
export default function SatRwSkillScreen() {
  const { skill = '', set } = useLocalSearchParams<{ skill: string; set?: string }>();
  const attempts = useSatRwStore((s) => s.attempts);
  const { L, en } = useL();
  const all = useMemo(() => SAT_RW_QUESTIONS.filter((q) => q.skill === skill), [skill]);
  const sets = useMemo(() => {
    const out: (typeof all)[] = [];
    for (let i = 0; i < all.length; i += ROUND) out.push(all.slice(i, i + ROUND));
    return out;
  }, [all]);
  const index = Number(set);
  const picked = set !== undefined && Number.isInteger(index) && index >= 0 && index < sets.length;
  const questions = picked ? sets[index]! : [];

  if (!picked && sets.length > 0) {
    const first = all[0]!;
    const view: PickerSet[] = sets.map((qs) => {
      const answered = qs.filter((q) => attempts[q.id]).length;
      const correct = qs.filter((q) => attempts[q.id]?.correct).length;
      return {
        size: qs.length,
        done: answered === qs.length,
        ratio: answered > 0 ? correct / answered : null,
        score: answered > 0 ? `${correct}/${qs.length}` : undefined,
        note: answered > 0 && answered < qs.length ? L(`làm ${answered}/${qs.length}`, `done ${answered}/${qs.length}`) : undefined,
      };
    });
    const next = Math.max(0, view.findIndex((v) => !v.done));
    return (
      <SetPicker
        backHref="/sat-rw"
        backLabel="SAT Verbal"
        eyebrow={first.domain}
        title={rwSkillLabel(skill, en)}
        sets={view}
        nextIndex={view.every((v) => v.done) ? 0 : next}
        minutesPerQuestion={1}
        onOpen={(i) => router.push(`/sat-rw/skill/${skill}?set=${i}` as never)}
        footnote={L('Điểm trên mỗi bộ tính theo lần làm gần nhất của từng câu.', 'Each set’s score uses your latest attempt at every question.')}
      />
    );
  }

  const label = rwSkillLabel(skill, en);
  const first = questions[0];

  if (!first) {
    return (
      <TaskShell backHref="/sat-rw" backLabel={L('Về SAT Verbal', 'Back to SAT Verbal')} title={L('Không tìm thấy kỹ năng này', 'Skill not found')} icon="clipboard">
        <PaperCard className="max-w-[520px]">
          <View aria-hidden className="mb-3">
            <Motion kind="wobble">
              <Sticker tilt={-6}>
                <CuteMagnifier size={56} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-sans text-body text-paper-body">{L('Kỹ năng bạn vừa mở không có câu nào trong kho.', 'This skill has no questions in the bank.')}</Text>
          <Button className="mt-4" variant="brand" label={L('Về SAT Verbal', 'Back to SAT Verbal')} onPress={() => router.replace('/sat-rw' as never)} />
        </PaperCard>
      </TaskShell>
    );
  }

  return (
    <UnitRunner
      key={index}
      title={L(`${label} · Bộ đề ${index + 1}/${sets.length}`, `${label} · Set ${index + 1}/${sets.length}`)}
      subtitle={L(`${first.domain} · ${questions.length} câu`, `${first.domain} · ${questions.length} questions`)}
      questions={questions}
      ruleVi={getSatRwUnit(first.unit)?.ruleVi ?? ''}
      backHref={`/sat-rw/skill/${skill}`}
      backLabel={L('Về danh sách bộ đề', 'Back to sets')}
      doneHref={`/sat-rw/skill/${skill}`}
      doneLabel={L('Về danh sách bộ đề', 'Back to sets')}
    />
  );
}
