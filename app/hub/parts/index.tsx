import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { Icon } from '@/components/ui/Icon';
import { SPEAKING_TOPICS } from '@/data/hub/speaking-topics';
import { useHubStore } from '@/store/useHubStore';

type Hover = { hovered?: boolean };

const PARTS = [
  {
    n: 1,
    name: 'Part 1 · Hỏi đáp ngắn',
    time: '4–5 phút',
    count: '10–12 câu',
    icon: '💬',
    tint: '#DFEEFF',
    goal: 'Trả lời tự nhiên về bản thân và đời sống.',
    steps: ['Trả lời thẳng vào câu hỏi', 'Thêm một lý do', 'Cho một ví dụ ngắn'],
    starters: ['Well, to be honest…', 'It depends, but generally…', 'What I like most is…'],
    target: '2–3 câu, 20–35 từ mỗi câu trả lời',
  },
  {
    n: 2,
    name: 'Part 2 · Cue card',
    time: '3–4 phút',
    count: '1 đề',
    icon: '🗒️',
    tint: '#FFF0D6',
    goal: 'Nói liền mạch 1–2 phút về một đề cho sẵn.',
    steps: ['Một phút ghi từ khoá', 'Mở đầu, đi qua 4 gợi ý', 'Kết bằng một cảm nhận'],
    starters: ['I’d like to talk about…', 'What made it special was…', 'Looking back, I think…'],
    target: '150–200 từ, không dừng quá 3 giây',
  },
  {
    n: 3,
    name: 'Part 3 · Bàn luận sâu',
    time: '4–5 phút',
    count: '4–6 câu',
    icon: '🧠',
    tint: '#EFE4FF',
    goal: 'Nêu quan điểm, so sánh, dự đoán về xã hội.',
    steps: ['Nêu quan điểm', 'Lý do hoặc ví dụ', 'Đối lập ngắn rồi kết luận'],
    starters: ['In my view…', 'On the one hand… on the other…', 'That said, it also…'],
    target: '50–80 từ, có ít nhất một ý đối lập',
  },
] as const;

const CRITERIA = [
  { t: 'Fluency', d: 'Nói liền mạch, ít ngập ngừng' },
  { t: 'Vocabulary', d: 'Từ đa dạng, đúng ngữ cảnh' },
  { t: 'Grammar', d: 'Câu đơn và câu phức chính xác' },
  { t: 'Pronunciation', d: 'Rõ âm, đúng nhấn và ngữ điệu' },
];

/** Luyện theo từng Part của bài thi nói: cách làm, mẫu câu mở và các nút vào luyện. */
export default function PartsHub() {
  const topicsDone = useHubStore((s) => s.topicsDone);
  const doneCount = SPEAKING_TOPICS.filter((t) => topicsDone[t.id]).length;
  const randomTopic = () => SPEAKING_TOPICS[Math.floor(Math.random() * SPEAKING_TOPICS.length)]!;

  return (
    <HubScreen title="Luyện theo Part" subtitle="Part 1, Part 2 và Part 3 của bài thi nói" back padBottom={140}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Từng Part một,"
        accent="đúng cách thi thật"
        stats={[
          { value: '3', label: 'Part' },
          { value: String(SPEAKING_TOPICS.length), label: 'Chủ đề' },
          { value: String(SPEAKING_TOPICS.length * 6), label: 'Câu hỏi' },
          { value: `${doneCount}`, label: 'Chủ đề đã làm' },
        ]}
      />

      {PARTS.map((p) => (
        <HubPanel key={p.n} title={p.name} icon={p.n === 1 ? 'speaker' : p.n === 2 ? 'note' : 'planet'} badge={p.time}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: p.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28 }}>{p.icon}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900' }}>{p.goal}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <HubTag label={p.count} />
                <HubTag label={p.target} color={HUB_UI.muted} />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.steps.map((s, i) => (
              <View key={s} style={{ flexGrow: 1, flexBasis: 180, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 }}>{i + 1}</Text>
                </View>
                <Text style={{ color: HUB_UI.navy, fontSize: 14, fontWeight: '700', flex: 1 }}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {p.starters.map((s) => (
              <View key={s} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1.5, borderColor: HUB_UI.line }}>
                <Text style={{ color: HUB_UI.purple, fontSize: 13.5, fontWeight: '400' }}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/hub/parts/${p.n}` as never)} style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>Luyện Part {p.n} ngẫu nhiên</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/hub/topics/${randomTopic().id}?part=${p.n}` as never)} style={{ height: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: HUB_UI.navy, fontWeight: '400', fontSize: 14 }}>Một chủ đề</Text>
            </Pressable>
          </View>
        </HubPanel>
      ))}

      <HubPanel title="Giám khảo chấm gì" icon="medal">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {CRITERIA.map((c) => (
            <View key={c.t} style={{ flexGrow: 1, flexBasis: 200, gap: 2, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash, borderWidth: 1, borderColor: HUB_UI.line }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>{c.t}</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13.5 }}>{c.d}</Text>
            </View>
          ))}
        </View>
      </HubPanel>

      <HubPanel title="Chọn chủ đề để luyện" icon="book" badge={String(SPEAKING_TOPICS.length)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SPEAKING_TOPICS.map((t) => (
            <Pressable key={t.id} accessibilityRole="button" onPress={() => router.push(`/hub/topics/${t.id}` as never)} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, backgroundColor: topicsDone[t.id] ? '#DDF7E8' : '#FFFFFF', ...hubLift(hovered) }) as never}>
              <Text style={{ color: HUB_UI.navy, fontSize: 14, fontWeight: '400' }}>{t.titleVi}</Text>
              {topicsDone[t.id] ? <Icon name="check" size={13} color={HUB_UI.green} /> : null}
            </Pressable>
          ))}
        </View>
      </HubPanel>
    </HubScreen>
  );
}
