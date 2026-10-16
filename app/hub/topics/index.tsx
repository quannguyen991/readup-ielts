import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { LionMascot } from '@/components/mascot/LionMascot';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { SPEAKING_TOPICS, questionCount, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { useHubStore } from '@/store/useHubStore';
import { themedHex } from '@/theme/palette-state';

/** Đề luyện nói theo chủ đề: mỗi chủ đề đủ Part 1, cue card Part 2 và Part 3. */
export default function TopicsIndex() {
  const [q, setQ] = useState('');
  const done = useHubStore((s) => s.topicsDone);
  const topics = useMemo(() => {
    const key = q.trim().toLowerCase();
    return SPEAKING_TOPICS.filter(
      (t) => !key || t.title.toLowerCase().includes(key) || t.titleVi.toLowerCase().includes(key),
    );
  }, [q]);
  const doneCount = SPEAKING_TOPICS.filter((t) => done[t.id]).length;

  return (
    <HubScreen title="Đề luyện nói" subtitle={`${SPEAKING_TOPICS.length} chủ đề · đã làm ${doneCount}`} back padBottom={140}>
      <LinearGradient
        colors={[themedHex('#FFFBEF'), themedHex('#F6E3AE')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <LionMascot pose="wave" size={84} />
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Mỗi ngày một chủ đề</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
            Đủ ba phần như bài thi: Part 1 hỏi ngắn, Part 2 nói một cue card khoảng hai phút, Part 3 bàn sâu hơn.
          </Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(143,110,54,0.16)', overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.round((doneCount / SPEAKING_TOPICS.length) * 100)}%`,
                height: 8,
                borderRadius: 4,
                backgroundColor: HUB.blue,
              }}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48 }]}>
        <Icon name="search" size={18} color={HUB.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm chủ đề: du lịch, môi trường…"
          placeholderTextColor={HUB.muted}
          accessibilityLabel="Tìm chủ đề"
          style={{ flex: 1, color: HUB.ink, fontSize: 15 }}
        />
      </View>

      {topics.length === 0 ? (
        <View style={[GLASS_CARD, { padding: 22, alignItems: 'center', gap: 8 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>Không có chủ đề nào khớp</Text>
          <Text style={{ color: HUB.muted, fontSize: 13 }}>Thử từ khoá khác, ví dụ “công nghệ” hay “food”.</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {topics.map((t) => (
          <TopicCard key={t.id} topic={t} done={Boolean(done[t.id])} />
        ))}
      </View>
    </HubScreen>
  );
}

/**
 * Thẻ chủ đề. Hai cột trên mọi màn hình để lưới luôn đầy. Đề Part 2 làm xem trước, nên
 * người học biết ngay chủ đề đó nói về cái gì trước khi bấm vào.
 */
function TopicCard({ topic, done }: { topic: SpeakingTopic; done: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${topic.titleVi} — luyện đề`}
      onPress={() => router.push(`/hub/topics/${topic.id}` as never)}
      style={[GLASS_CARD, { flexBasis: '47%', flexGrow: 1, minWidth: 150, padding: 14, gap: 10 }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CoinIcon name={done ? 'achievements' : 'speaking'} size={46} />
        {done ? (
          <Text style={{ color: HUB.green, fontSize: 11, fontWeight: '800' }}>ĐÃ LÀM</Text>
        ) : (
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>{questionCount(topic)} câu</Text>
        )}
      </View>

      <View style={{ gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{topic.titleVi}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{topic.title}</Text>
      </View>

      <Text style={{ color: HUB.body, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
        {topic.part2.prompt}
      </Text>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[`P1 · ${topic.part1.length}`, 'P2 · 1', `P3 · ${topic.part3.length}`].map((label) => (
          <View key={label} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: HUB.glassStrong }}>
            <Text style={{ color: HUB.blue, fontSize: 10, fontWeight: '800' }}>{label}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
