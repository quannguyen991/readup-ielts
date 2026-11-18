import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { HUB_UI, HubTag } from '@/components/hub/HubUi';
import { gtAsTopic, gtById, gtExtra } from '@/data/hub/speaking-more';
import { Practice } from '../topics/[id]';

/** Làm một đề giao tiếp: đọc tình huống, nói theo ba ý bắt buộc, rồi so với bài mẫu và mẫu câu. */
export default function GiaoTiepRunner() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const found = gtById(id);
  const topic = useMemo(() => (found ? gtAsTopic(found.task) : null), [found]);
  const extra = useMemo(() => (found ? gtExtra(found.task) : undefined), [found]);
  if (!found || !topic) return <Redirect href={'/hub/giao-tiep' as never} />;
  const { cat, task } = found;
  return (
    <Practice
      topic={topic}
      only={1}
      extra={extra}
      header={
        <View style={{ gap: 10, padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <HubTag label={cat.titleVi} />
          </View>
          <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>{task.situationVi}</Text>
          <View style={{ gap: 6 }}>
            <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '400' }}>Cần nói được:</Text>
            {task.mustVi.map((m) => (
              <View key={m} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: HUB_UI.green, fontWeight: '900' }}>✓</Text>
                <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      }
    />
  );
}
