import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { QuestionCard } from '@/components/sat-rw/QuestionCard';
import { Badge, Button, PaperCard } from '@/components/ui';
import { SAT_RW_SKILL_LABEL } from '@/data/sat-rw-repository';
import { getMixedSet } from '@/services/sat-rw/mixed-sets';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Làm một đề trộn SAT Reading & Writing.
 *
 * Khác màn luyện unit ở đúng hai chỗ, và cả hai đều có lý do:
 *
 * KHÔNG CÓ HỘP LUẬT. Đề trộn nhiều mảng nên không có một luật chung nào để mở
 * sẵn — mà quan trọng hơn: ở đây người học phải TỰ NHẬN RA câu này đang hỏi luật
 * gì. Hiện luật trước là làm hộ họ phần khó nhất của đề thật.
 *
 * NHÃN KỸ NĂNG HIỆN SAU KHI TRẢ LỜI, không hiện trước. Thấy "Đại từ" trước khi
 * đọc là biết luôn phải soi vào đâu; thấy sau khi chọn thì nó thành lời giải
 * thích cho câu vừa làm.
 */
export default function SatRwMixScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const set = useMemo(() => (setId ? getMixedSet(setId) : undefined), [setId]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const logQuestions = useStudyStore((s) => s.logQuestions);

  if (!set) {
    return (
      <TaskShell backHref="/sat-rw" backLabel="Về SAT Verbal" title="Không tìm thấy đề này" icon="clipboard">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            Đề bạn vừa mở không có trong kho. Quay lại danh sách để chọn đề khác.
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

  const questions = set.questions;
  const question = questions[index];
  const answered = picked !== null;

  const submit = (choice: number) => {
    if (picked !== null || !question) return;
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
    const nextSet = set.order < 50 ? `satrw-mix-${String(set.order + 1).padStart(2, '0')}` : null;

    return (
      <TaskShell
        backHref="/sat-rw"
        backLabel="Về SAT Verbal"
        title="Xong đề"
        subtitle={`${set.title} · ${questions.length} câu`}
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
            label="Làm lại đề này"
            iconLeft="refresh"
            onPress={() => {
              setIndex(0);
              setPicked(null);
              setCorrect(0);
              setDone(false);
            }}
          />
          {nextSet ? (
            <Button
              variant="onDark"
              label={`Đề trộn ${set.order + 1}`}
              iconRight="arrow-right"
              onPress={() => router.replace(`/sat-rw/mix/${nextSet}` as never)}
            />
          ) : null}
          <Button variant="onDark" label="Chọn đề khác" onPress={() => router.replace('/sat-rw' as never)} />
        </View>
      </TaskShell>
    );
  }

  if (!question) return null;

  return (
    <TaskShell
      backHref="/sat-rw"
      backLabel="Về SAT Verbal"
      title={set.title}
      subtitle="Trộn bốn mảng, như một module thi thu nhỏ"
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {index + 1} / {questions.length} · đúng {correct}
          </Text>
        </View>
      }
    >
      <QuestionCard question={question} picked={picked} onPick={submit} />

      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        {answered ? (
          <Badge label={SAT_RW_SKILL_LABEL[question.skill] ?? question.skill} tone="neutral" />
        ) : null}
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
