import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { HUB_UI, HubTag } from '@/components/hub/HubUi';
import { mockAsTopic, mockById, mockExtra } from '@/data/hub/speaking-more';
import { Practice } from '../topics/[id]';

/** Làm một đề thi thử: 8 câu Part 1, cue card Part 2 và 5 câu Part 3, lần lượt như phòng thi. */
export default function MockRunner() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const mock = mockById(id);
  const topic = useMemo(() => (mock ? mockAsTopic(mock) : null), [mock]);
  const extra = useMemo(() => (mock ? mockExtra(mock) : undefined), [mock]);
  if (!mock || !topic) return <Redirect href={'/hub/mock' as never} />;
  return (
    <Practice
      topic={topic}
      extra={extra}
      header={
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {mock.part1.map((g) => (
            <HubTag key={g.topic} label={`Part 1 · ${g.topic}`} />
          ))}
          <HubTag label="Part 2 · cue card" color={HUB_UI.orange} bg="#FFF0D6" />
          <HubTag label="Part 3 · bàn luận" color="#7C3AED" bg="#EDE9FE" />
          <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '700' }}>15 câu</Text>
        </View>
      }
    />
  );
}
