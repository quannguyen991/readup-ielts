import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { ChunkOrder, ListenPassageSet, SpeakingTaskView, WritingTaskView } from '@/components/intl/SkillKit';
import { Button, Card } from '@/components/ui';
import { TOEFL_LISTENING } from '@/data/intl/listening';
import { TOEFL_BUILD, TOEFL_SPEAKING, TOEFL_WRITING } from '@/data/intl/writing';
import { useL } from '@/i18n/useL';

export default function ToeflSkillDetailScreen() {
  const { L } = useL();
  const { kind: rawKind, id: rawId } = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = Array.isArray(rawKind) ? rawKind[0] : rawKind;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const notFound = (
    <Screen>
      <Card>
        <Text className="font-strong text-body text-ink">{L('Không tìm thấy mục này.', 'This item does not exist.')}</Text>
        <Button className="mt-3" label={L('Về TOEFL', 'Back to TOEFL')} onPress={() => router.replace('/toefl' as never)} />
      </Card>
    </Screen>
  );

  if (kind === 'listen') {
    const passage = TOEFL_LISTENING.find((p) => p.id === id);
    if (!passage) return notFound;
    return (
      <Screen>
        <ListenPassageSet passage={passage} exam="toefl" />
      </Screen>
    );
  }

  if (kind === 'write') {
    const build = TOEFL_BUILD.find((b) => b.id === id);
    if (build) {
      return (
        <Screen>
          <ChunkOrder task={build} exam="toefl" />
        </Screen>
      );
    }
    const task = TOEFL_WRITING.find((t) => t.id === id);
    if (!task) return notFound;
    return (
      <Screen>
        <WritingTaskView task={task} activity={`write:${task.id}`} exam="toefl" />
      </Screen>
    );
  }

  if (kind === 'speak') {
    const task = TOEFL_SPEAKING.find((t) => t.id === id);
    if (!task) return notFound;
    return (
      <Screen>
        <SpeakingTaskView task={task} activity={`speak:${task.id}`} exam="toefl" />
      </Screen>
    );
  }

  return notFound;
}
