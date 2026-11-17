import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { HUB_UI } from '@/components/hub/HubUi';
import { SPEAKING_TOPICS, topicExtra, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { Practice } from '../topics/[id]';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Bộ ngẫu nhiên cho một Part: Part 1 sáu câu và Part 3 bốn câu rút từ nhiều chủ đề; Part 2 một cue card. */
function build(n: 1 | 2 | 3): SpeakingTopic {
  const all = SPEAKING_TOPICS;
  if (n === 2) return shuffle(all)[0]!;
  const pool = n === 1
    ? all.flatMap((t) => [...t.part1, ...(topicExtra(t.id)?.p1More ?? [])])
    : all.flatMap((t) => [...t.part3, ...(topicExtra(t.id)?.p3More ?? [])]);
  const picks = shuffle(pool).slice(0, n === 1 ? 6 : 4);
  const first = all[0]!;
  return {
    id: `drill-p${n}`,
    title: n === 1 ? 'Part 1 mixed questions' : 'Part 3 mixed discussion',
    titleVi: n === 1 ? 'Part 1 · Hỏi đáp tổng hợp' : 'Part 3 · Bàn luận tổng hợp',
    tipVi: n === 1 ? 'Mỗi câu: trả lời thẳng, thêm lý do, cho một ví dụ ngắn.' : 'Nêu quan điểm, giải thích, rồi cho một ý đối lập trước khi kết.',
    part1: n === 1 ? picks : first.part1,
    part2: first.part2,
    part3: n === 3 ? picks : first.part3,
  };
}

/** Luyện một Part: bộ câu ngẫu nhiên, bấm "Rút bộ khác" để đổi. */
export default function PartDrill() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const part = n === '1' ? 1 : n === '2' ? 2 : n === '3' ? 3 : null;
  const [round, setRound] = useState(0);
  const topic = useMemo(() => (part ? build(part) : null), [part, round]);
  if (!part || !topic) return <Redirect href={'/hub/parts' as never} />;
  return (
    <View style={{ flex: 1 }}>
      <Practice key={`${topic.id}-${round}`} topic={topic} only={part} />
      <Pressable accessibilityRole="button" onPress={() => setRound((r) => r + 1)} style={{ position: 'absolute', right: 16, bottom: 20, height: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(106,75,217,0.35)' } as never}>
        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Rút bộ khác</Text>
      </Pressable>
    </View>
  );
}
