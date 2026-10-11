import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ListenPassageSet, QaSet, SpeakingTaskView, WritingTaskView } from '@/components/intl/SkillKit';
import { Button, Card } from '@/components/ui';
import { TOEIC_PART1, TOEIC_PART2, TOEIC_PART3, TOEIC_PART4 } from '@/data/intl/listening';
import { TOEIC_SPEAKING, TOEIC_WRITING } from '@/data/intl/writing';
import { useL } from '@/i18n/useL';

export default function ToeicSkillDetailScreen() {
  const { L } = useL();
  const { kind: rawKind, id: rawId } = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = Array.isArray(rawKind) ? rawKind[0] : rawKind;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const notFound = (
    <Screen>
      <Card>
        <Text className="font-strong text-body text-ink">{L('Không tìm thấy mục này.', 'This item does not exist.')}</Text>
        <Button className="mt-3" label={L('Về TOEIC', 'Back to TOEIC')} onPress={() => router.replace('/toeic' as never)} />
      </Card>
    </Screen>
  );

  if (kind === 'listen') {
    if (id === 'part1') {
      return (
        <Screen>
          <Text className="font-heavy text-pageTitle text-ink">{L('TOEIC · Part 1', 'TOEIC · Part 1')}</Text>
          <Text className="mt-1 mb-4 font-sans text-label text-muted">{L('Chưa có ảnh thật. Hệ thống đọc mô tả cảnh rồi đọc bốn câu mô tả; hãy chọn câu đúng nhất.', 'No real photos yet. The app reads the scene description, then four statements; choose the best one.')}</Text>
          <QaSet items={TOEIC_PART1} exam="toeic" />
        </Screen>
      );
    }
    if (id === 'part2') {
      return (
        <Screen>
          <Text className="font-heavy text-pageTitle text-ink">{L('TOEIC · Part 2', 'TOEIC · Part 2')}</Text>
          <Text className="mt-1 mb-4 font-sans text-label text-muted">{L('Nghe câu hỏi và ba đáp án, rồi chọn đáp án đúng nhất.', 'Listen to the question and three replies, then choose the best one.')}</Text>
          <QaSet items={TOEIC_PART2} exam="toeic" />
        </Screen>
      );
    }
    const passage = [...TOEIC_PART3, ...TOEIC_PART4].find((p) => p.id === id);
    if (!passage) return notFound;
    return (
      <Screen>
        <ListenPassageSet passage={passage} exam="toeic" />
      </Screen>
    );
  }

  if (kind === 'write') {
    const task = TOEIC_WRITING.find((t) => t.id === id);
    if (!task) return notFound;
    return (
      <Screen>
        <WritingTaskView task={task} activity={`write:${task.id}`} exam="toeic" />
      </Screen>
    );
  }

  if (kind === 'speak') {
    const task = TOEIC_SPEAKING.find((t) => t.id === id);
    if (!task) return notFound;
    return (
      <Screen>
        <SpeakingTaskView task={task} activity={`speak:${task.id}`} exam="toeic" />
      </Screen>
    );
  }

  return notFound;
}
