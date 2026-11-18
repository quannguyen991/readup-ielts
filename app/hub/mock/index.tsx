import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { Icon } from '@/components/ui/Icon';
import { MOCK_TESTS } from '@/data/hub/speaking-more';
import { useHubStore } from '@/store/useHubStore';

type Hover = { hovered?: boolean };

/** Đề thi thử IELTS Speaking: mỗi đề đủ Part 1 (hai chủ đề), cue card Part 2 và Part 3, có đáp án mẫu. */
export default function MockTests() {
  const done = useHubStore((s) => s.topicsDone);
  const doneCount = MOCK_TESTS.filter((m) => done[m.id]).length;
  const next = MOCK_TESTS.find((m) => !done[m.id]) ?? MOCK_TESTS[0];

  return (
    <HubScreen title="Đề thi thử Speaking" subtitle={`${MOCK_TESTS.length} đề đủ ba Part`} back padBottom={140}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Thi thử đủ ba Part,"
        accent="mỗi lần một đề mới"
        stats={[
          { value: String(MOCK_TESTS.length), label: 'Đề thi thử' },
          { value: `${doneCount}/${MOCK_TESTS.length}`, label: 'Đã làm' },
          { value: '15–20′', label: 'Mỗi đề' },
          { value: '15', label: 'Câu mỗi đề' },
        ]}
      />

      {next ? (
        <HubPanel title="Đề tiếp theo" icon="rocket">
          <Pressable accessibilityRole="button" onPress={() => router.push(`/hub/mock/${next.id}` as never)} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: HUB_UI.wash, ...hubLift(hovered) }) as never}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 18, fontWeight: '900' }}>{next.titleVi}</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 14, fontWeight: '700' }}>{next.focusVi}</Text>
            </View>
            <Icon name="arrow-right" size={18} color={HUB_UI.purple} />
          </Pressable>
        </HubPanel>
      ) : null}

      <HubPanel title="Tất cả đề" icon="trophy" badge={String(MOCK_TESTS.length)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {MOCK_TESTS.map((m) => {
            const ok = Boolean(done[m.id]);
            return (
              <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={m.titleVi} onPress={() => router.push(`/hub/mock/${m.id}` as never)} style={({ hovered }) => ({ flexBasis: 250, flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: ok ? '#F1FBF5' : '#FFFFFF', ...hubLift(hovered) }) as never}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: HUB_UI.navy, fontSize: 17, fontWeight: '900' }}>{m.titleVi}</Text>
                  {ok ? <HubTag label="ĐÃ LÀM ✓" color={HUB_UI.green} bg="#DDF7E8" /> : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {m.part1.map((g) => (
                    <HubTag key={g.topic} label={g.topic} />
                  ))}
                </View>
                <Text numberOfLines={2} style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }}>{m.part2.prompt}</Text>
              </Pressable>
            );
          })}
        </View>
      </HubPanel>
    </HubScreen>
  );
}
