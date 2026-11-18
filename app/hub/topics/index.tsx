import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubBar, HubChips, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { SPEAKING_TOPICS, questionCount, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { dayHash, dayKeyOf } from '@/services/hub/daily';
import { useHubStore } from '@/store/useHubStore';

type Filter = 'all' | 'todo' | 'done';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'todo', label: 'Chưa làm' },
  { id: 'done', label: 'Đã làm' },
];

type Hover = { hovered?: boolean };

/** Đề luyện nói theo chủ đề: mỗi chủ đề đủ Part 1, cue card Part 2 và Part 3. */
export default function TopicsIndex() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const done = useHubStore((s) => s.topicsDone);
  const doneCount = SPEAKING_TOPICS.filter((t) => done[t.id]).length;
  const totalQ = SPEAKING_TOPICS.reduce((n, t) => n + questionCount(t), 0);

  const topics = useMemo(() => {
    const key = q.trim().toLowerCase();
    return SPEAKING_TOPICS.filter((t) => {
      if (filter === 'done' && !done[t.id]) return false;
      if (filter === 'todo' && done[t.id]) return false;
      return !key || t.title.toLowerCase().includes(key) || t.titleVi.toLowerCase().includes(key);
    });
  }, [q, filter, done]);

  // Chủ đề hôm nay: một chủ đề chưa làm, đổi theo ngày.
  const todo = SPEAKING_TOPICS.filter((t) => !done[t.id]);
  const pool = todo.length ? todo : SPEAKING_TOPICS;
  const pick = pool[dayHash(dayKeyOf(new Date())) % pool.length];

  return (
    <HubScreen title="Đề luyện nói" subtitle={`${SPEAKING_TOPICS.length} chủ đề · đã làm ${doneCount}`} back padBottom={140}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Mỗi ngày một chủ đề,"
        accent="đủ ba phần như bài thi"
        stats={[
          { value: `${doneCount}/${SPEAKING_TOPICS.length}`, label: 'Chủ đề đã làm' },
          { value: String(totalQ), label: 'Tổng số câu hỏi' },
          { value: String(SPEAKING_TOPICS.length - doneCount), label: 'Còn lại' },
          { value: `${Math.round((doneCount / Math.max(1, SPEAKING_TOPICS.length)) * 100)}%`, label: 'Tiến độ' },
        ]}
      />

      {pick ? (
        <HubPanel title="Chủ đề hôm nay" icon="sparkle" badge={done[pick.id] ? 'ĐÃ LÀM' : 'MỚI'}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pick.titleVi} — luyện đề`}
            onPress={() => router.push(`/hub/topics/${pick.id}` as never)}
            style={({ hovered }: Hover) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: HUB_UI.wash, ...hubLift(hovered) }) as never}
          >
            <CoinIcon name="speaking" size={56} />
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 19, fontWeight: '900' }}>{pick.titleVi}</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '700' }}>{pick.title}</Text>
              <Text style={{ color: HUB_UI.navy, fontSize: 14, lineHeight: 20, fontWeight: '600' }} numberOfLines={3}>{pick.part2.prompt}</Text>
            </View>
            <Icon name="arrow-right" size={18} color={HUB_UI.purple} />
          </Pressable>
        </HubPanel>
      ) : null}

      <HubPanel title="Tất cả chủ đề" icon="book" badge={String(topics.length)}>
        <HubChips options={FILTERS} value={filter} onChange={setFilter} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: HUB_UI.wash, paddingHorizontal: 14, height: 48 }}>
          <Icon name="search" size={18} color={HUB_UI.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Tìm chủ đề: du lịch, môi trường…" placeholderTextColor="#A59CC4" accessibilityLabel="Tìm chủ đề" style={{ flex: 1, color: HUB_UI.navy, fontSize: 15 }} />
        </View>

        {topics.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center', gap: 6 }}>
            <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '400' }}>Không có chủ đề nào khớp</Text>
            <Text style={{ color: HUB_UI.muted, fontSize: 13 }}>Thử từ khoá khác, ví dụ “công nghệ” hay “food”.</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} done={Boolean(done[t.id])} />
          ))}
        </View>
      </HubPanel>
    </HubScreen>
  );
}

/** Thẻ chủ đề: xem trước đề Part 2 để biết chủ đề nói về gì trước khi bấm vào. */
function TopicCard({ topic, done }: { topic: SpeakingTopic; done: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.titleVi} — luyện đề`}
      onPress={() => router.push(`/hub/topics/${topic.id}` as never)}
      style={({ hovered }: Hover) => ({ flexBasis: 240, flexGrow: 1, flexShrink: 1, minWidth: 0, padding: 14, gap: 10, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CoinIcon name={done ? 'achievements' : 'speaking'} size={44} />
        {done ? <HubTag label="ĐÃ LÀM ✓" color={HUB_UI.green} bg="#DDF7E8" /> : <HubTag label={`${questionCount(topic)} câu`} color={HUB_UI.muted} />}
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ color: HUB_UI.navy, fontSize: 16.5, fontWeight: '900' }}>{topic.titleVi}</Text>
        <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '600' }}>{topic.title}</Text>
      </View>
      <Text style={{ color: HUB_UI.navy, opacity: 0.8, fontSize: 13.5, lineHeight: 19 }} numberOfLines={2}>{topic.part2.prompt}</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {[`P1 · ${topic.part1.length}`, 'P2 · 1', `P3 · ${topic.part3.length}`].map((label) => (
          <HubTag key={label} label={label} />
        ))}
      </View>
      <HubBar ratio={done ? 1 : 0} color={HUB_UI.green} />
    </Pressable>
  );
}
