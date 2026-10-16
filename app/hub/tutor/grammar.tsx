import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { LEVEL_LESSONS, type GrammarLevel } from '@/services/hub/grammar-course';
import { useHubStore } from '@/store/useHubStore';

const LEVELS: GrammarLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];
const LEVEL_TITLE: Record<GrammarLevel, string> = { A1: 'Sơ cấp', A2: 'Sơ trung cấp', B1: 'Trung cấp', B2: 'Trung cao cấp', C: 'Cao cấp' };

export default function GrammarLevels() {
  const [level, setLevel] = useState<GrammarLevel>('A1');
  const lessonsDone = useHubStore((s) => s.lessonsDone);
  const list = LEVEL_LESSONS[level];
  const doneCount = list.filter((l) => lessonsDone[l.id]).length;

  return (
    <HubScreen title="Làm chủ ngữ pháp" subtitle="Chọn cấp độ, học từng bài" back>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {LEVELS.map((lv) => {
          const on = lv === level;
          return (
            <Pressable key={lv} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setLevel(lv)} style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? HUB.blue : HUB.glass, borderWidth: 1, borderColor: on ? HUB.blue : HUB.line }}>
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{lv}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>{LEVEL_TITLE[level]}</Text>
        <Text style={{ color: HUB.muted, fontSize: 13 }}>
          {`Hoàn thành ${list.length} bài để nâng cao kỹ năng · đã xong ${doneCount}/${list.length}`}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {list.map((l, idx) => {
          const done = Boolean(lessonsDone[l.id]);
          return (
            <Pressable key={l.id} accessibilityRole="button" accessibilityLabel={l.title} onPress={() => router.push(`/hub/grammar/${l.id}` as never)} style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? 'rgba(34,197,94,0.18)' : HUB.glassStrong }}>
                <Text style={{ color: done ? HUB.green : HUB.ink, fontSize: 14, fontWeight: '800' }}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{l.title}</Text>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>{l.subtitle}</Text>
              </View>
              {done ? <Icon name="check" size={18} color={HUB.green} /> : <Icon name="chevron-right" size={18} color={HUB.muted} />}
            </Pressable>
          );
        })}
      </View>
    </HubScreen>
  );
}
