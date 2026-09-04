import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { QuestionCard } from '@/components/sat-rw/QuestionCard';
import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import { SAT_RW_SKILL_LABEL, getSatRwUnit, questionsForUnit } from '@/data/sat-rw-repository';
import { useStudyStore } from '@/store/useStudyStore';
import { paper } from '@/theme/tokens';

/**
 * Luyện một unit SAT Reading & Writing.
 *
 * MỘT CÂU MỘT MÀN, không đổ cả 24 câu ra một trang. Đề SAT thật cũng hiện từng
 * câu, và quan trọng hơn: lời giải phải đọc NGAY sau khi chọn, lúc còn nhớ mình
 * đã nghĩ gì. Cuộn qua một trang dài rồi mới xem đáp án thì phần "vì sao mình
 * chọn sai" đã trôi mất.
 *
 * KHÔNG BẤM GIỜ. Đây là bài học luật, không phải bài thi — người học cần đọc kỹ
 * hộp luật rồi soi lại câu vừa sai. Đồng hồ ở đây chỉ tạo áp lực sai chỗ.
 */
export default function SatRwUnitScreen() {
  const { unit: unitParam } = useLocalSearchParams<{ unit: string }>();
  const unitNumber = Number(unitParam);
  const unit = Number.isFinite(unitNumber) ? getSatRwUnit(unitNumber) : undefined;

  const questions = useMemo(
    () => (unit ? questionsForUnit(unit.unit) : []),
    [unit],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [showRule, setShowRule] = useState(false);

  const logQuestions = useStudyStore((s) => s.logQuestions);

  if (!unit || questions.length === 0) {
    return (
      <TaskShell backHref="/sat-rw" backLabel="Về SAT Verbal" title="Không tìm thấy unit này" icon="clipboard">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            Unit bạn vừa mở không có trong kho. Quay lại danh sách để chọn unit khác.
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label="Về SAT Verbal"
            onPress={() => router.replace('/sat-rw' as never)}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  const question = questions[index]!;
  const answered = picked !== null;

  const submit = (choice: number) => {
    if (answered) return;
    setPicked(choice);
    if (choice === question.answerIndex) setCorrect((n) => n + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    logQuestions(questions.length);
    setDone(true);
  };

  if (done) {
    const percent = Math.round((correct / questions.length) * 100);
    return (
      <TaskShell
        backHref="/sat-rw"
        backLabel="Về SAT Verbal"
        title="Xong unit"
        subtitle={`Unit ${unit.unit} · ${unit.title}`}
        icon="clipboard"
      >
        <PaperCard className="items-center py-8">
          <Text className="font-heavy text-hero text-paper-ink">
            {correct}/{questions.length}
          </Text>
          <Text className="mt-1 font-sans text-body text-paper-muted">câu đúng · {percent}%</Text>
        </PaperCard>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button
            variant="onDarkSolid"
            label="Làm lại unit này"
            iconLeft="refresh"
            onPress={() => {
              setIndex(0);
              setPicked(null);
              setCorrect(0);
              setDone(false);
            }}
          />
          <Button
            variant="onDark"
            label="Chọn unit khác"
            onPress={() => router.replace('/sat-rw' as never)}
          />
        </View>
      </TaskShell>
    );
  }

  return (
    <TaskShell
      backHref="/sat-rw"
      backLabel="Về SAT Verbal"
      title={unit.title}
      subtitle={`Unit ${unit.unit} · ${unit.domain}`}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {index + 1} / {questions.length} · đúng {correct}
          </Text>
        </View>
      }
    >
      {unit.ruleVi ? (
        <PaperCard className="mb-4">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showRule }}
            onPress={() => setShowRule((v) => !v)}
            className="flex-row items-center gap-2"
          >
            <Icon
              name={showRule ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={paper.brandMid}
              strokeWidth={2}
            />
            <Text className="font-strong text-body text-paper-ink">Luật của unit này</Text>
          </Pressable>
          {showRule ? (
            <Text className="mt-2.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
              {unit.ruleVi}
            </Text>
          ) : null}
        </PaperCard>
      ) : null}

      <QuestionCard question={question} picked={picked} onPick={submit} />

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Badge label={SAT_RW_SKILL_LABEL[question.skill] ?? question.skill} tone="neutral" />
        <View className="flex-1" />
        {answered ? (
          <Button
            variant="onDarkSolid"
            label={index + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}
            iconRight="arrow-right"
            onPress={next}
          />
        ) : (
          <Text className="font-sans text-label text-white/80">Chọn một phương án để xem lời giải</Text>
        )}
      </View>
    </TaskShell>
  );
}
