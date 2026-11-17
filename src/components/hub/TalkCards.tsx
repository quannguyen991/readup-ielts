import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HUB_UI, hubLift } from '@/components/hub/HubUi';
import { DIFF_COLOR } from '@/components/hub/theme';
import { DIALOGUES } from '@/data/hub/dialogues';
import { SCENE_THUMB, type SceneKey } from '@/data/hub/scenes';
import { ROLEPLAYS, type ScenarioCategory } from '@/services/hub/roleplay';

const LEVEL_VI = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' } as const;

/** Một cuộc trò chuyện, dù gốc là nhập vai, gọi điện hay hội thoại: đủ để vẽ thẻ poster và mở đúng màn. */
export type Talk = {
  id: string;
  title: string;
  scene: string;
  setting: SceneKey;
  category: ScenarioCategory;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  minutes: number;
  kind: 'Nhập vai' | 'Gọi điện' | 'Hội thoại';
  route: string;
};

export function allTalks(): Talk[] {
  const rp: Talk[] = ROLEPLAYS.map((r) => ({
    id: r.id,
    title: r.title,
    scene: r.scene,
    setting: r.setting,
    category: r.category,
    difficulty: r.difficulty,
    minutes: r.minutes,
    kind: r.mode === 'call' ? 'Gọi điện' : 'Nhập vai',
    route: r.mode === 'call' ? `/hub/call/${r.id}` : `/hub/roleplay/${r.id}`,
  }));
  const dl: Talk[] = DIALOGUES.map((d) => ({
    id: d.id,
    title: d.title,
    scene: d.keyPhrases.slice(0, 3).join(' · '),
    setting: d.setting,
    category: d.category,
    difficulty: d.difficulty,
    minutes: d.minutes,
    kind: 'Hội thoại',
    route: `/hub/dialogue/${d.id}`,
  }));
  return [...rp, ...dl];
}

type Hover = { hovered?: boolean };

export function TalkPoster({ talk, rank, done }: { talk: Talk; rank?: number; done?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={talk.title}
      onPress={() => router.push(talk.route as never)}
      style={({ hovered }: Hover) => ({ width: 220, gap: 8, padding: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
    >
      <View style={{ height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: HUB_UI.wash }}>
        <Image source={{ uri: SCENE_THUMB[talk.setting] }} accessibilityIgnoresInvertColors style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {rank ? <Text style={{ position: 'absolute', left: 10, bottom: -4, color: '#FFFFFF', fontSize: 64, fontWeight: '900', lineHeight: 70, textShadowColor: 'rgba(43,35,80,0.7)', textShadowRadius: 8 }}>{rank}</Text> : null}
        <View style={{ position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(43,35,80,0.78)' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DIFF_COLOR[talk.difficulty] }} />
          <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' }}>{LEVEL_VI[talk.difficulty]}</Text>
        </View>
        {done ? (
          <View style={{ position: 'absolute', left: 8, top: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#16A34A' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>ĐÃ NÓI ✓</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900', lineHeight: 20, paddingHorizontal: 4 }}>{talk.title}</Text>
      <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '600', paddingHorizontal: 4 }}>{talk.kind} · {talk.minutes} phút</Text>
    </Pressable>
  );
}

export function TalkRow({ talks, done, ranked }: { talks: Talk[]; done: (id: string) => boolean; ranked?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
      {talks.map((t, i) => (
        <TalkPoster key={t.id} talk={t} rank={ranked ? i + 1 : undefined} done={done(t.id)} />
      ))}
    </ScrollView>
  );
}

