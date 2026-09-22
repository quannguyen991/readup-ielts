import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { QuestBackdrop } from '@/components/quest/QuestVisual';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { getQuestMap } from '@/services/quest/maps';
import { useQuestStore } from '@/store/useQuestStore';

const NODE_META = {
  battle: { icon: '⚡', color: '#60A5FA' },
  elite: { icon: '◆', color: '#F59E0B' },
  treasure: { icon: '✦', color: '#FDE68A' },
  boss: { icon: '♛', color: '#F87171' },
} as const;

export default function QuestMapScreen() {
  const { mapId } = useLocalSearchParams<{ mapId: string }>();
  const map = getQuestMap(mapId);
  const stars = useQuestStore((s) => s.stars);
  const narrow = useWindowDimensions().width < 640;
  const unlocked = useQuestStore((s) => s.unlockedNodes);

  return (
    <Screen>
      <View className="flex-row items-center justify-between gap-3">
        <Button label="Quest" variant="onDark" iconLeft="chevron-left" onPress={() => router.replace('/quest' as never)} />
        <Text className="font-strong text-label text-white/60">MAP {map.nodes.length > 4 ? '03' : map.id === 'iron-frontier' ? '01' : '02'}</Text>
      </View>

      <QuestBackdrop map={map} minHeight={520}>
        <View className="absolute inset-0 bg-slate-950/20" />
        <View className="p-5 lg:p-7">
          <Text className="font-strong text-label tracking-[2px] text-white/65">{map.eyebrow}</Text>
          <Text className="mt-2 font-heavy text-pageTitle text-white">{map.title}</Text>
          <Text className="mt-1 max-w-xl font-sans text-bodyLg leading-6 text-white/75">{map.description}</Text>
          <View className="mt-5 flex-row flex-wrap gap-2">
            <View className="rounded-pill border border-white/15 bg-black/25 px-3 py-2"><Text className="font-strong text-label text-white">{map.player}</Text></View>
            <View className="rounded-pill border border-white/15 bg-black/25 px-3 py-2"><Text className="font-strong text-label text-white">Boss · {map.boss}</Text></View>
          </View>
        </View>
      </QuestBackdrop>

      <View className="mt-6 flex-row items-end justify-between gap-3">
        <View>
          <Text className="font-heavy text-sectionTitle text-white">Đường tiến công</Text>
          <Text className="mt-1 font-sans text-body text-white/70">Mỗi node là một trận 8–10 câu SAT.</Text>
        </View>
        <Text className="font-strong text-label text-cyan-200">{map.nodes.filter((n) => (stars[n.id] ?? 0) > 0).length}/{map.nodes.length} đã vượt</Text>
      </View>

      <View className="mt-5 overflow-hidden rounded-card border border-white/30 bg-slate-950/55 p-4 lg:p-6">
        {/*
          Màn hẹp: đường tiến công chạy DỌC, node so le trái–phải. Bốn node dàn
          ngang trên bề rộng 300px thì mỗi node chỉ còn 75px cho một hình tròn
          96px kèm nhãn 130px — chúng chồng lên nhau và node cuối tràn ra ngoài.
        */}
        <View
          className="relative overflow-hidden rounded-panel border border-white/15 bg-black/20"
          style={{ height: narrow ? 620 : 430 }}
        >
          {narrow ? (
            <>
              <View className="absolute bottom-[10%] top-[10%] w-2 rounded-pill bg-white/20" style={{ left: '50%', marginLeft: -4 }} />
              <View className="absolute bottom-[10%] top-[10%] w-1 rounded-pill" style={{ left: '50%', marginLeft: -2, backgroundColor: `${map.accent}B8` }} />
            </>
          ) : (
            <>
              <View className="absolute left-[10%] right-[10%] top-[51%] h-2 rounded-pill bg-white/20" />
              <View className="absolute left-[10%] right-[10%] top-[49%] h-1 rounded-pill" style={{ backgroundColor: `${map.accent}B8` }} />
            </>
          )}
          {map.nodes.map((node, index) => {
            const open = unlocked.includes(node.id);
            const earned = stars[node.id] ?? 0;
            const meta = NODE_META[node.kind];
            // Toạ độ là TÂM node; khối bọc lùi nửa bề ngang / nửa hình tròn để
            // node không lệch sang phải so với điểm nó được đặt.
            const positions = narrow
              ? ([
                  { left: '28%', top: '11%' },
                  { left: '72%', top: '35%' },
                  { left: '28%', top: '59%' },
                  { left: '72%', top: '83%' },
                ] as const)
              : ([
                  { left: '12%', top: '50%' },
                  { left: '37%', top: '28%' },
                  { left: '63%', top: '56%' },
                  { left: '88%', top: '34%' },
                ] as const);
            return (
              <View
                key={node.id}
                className="absolute items-center"
                style={[positions[index] ?? positions[0], { width: 140, marginLeft: -70, marginTop: -48 }]}
              >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !open }}
                    disabled={!open}
                    onPress={() => router.push(`/quest/battle/${node.id}` as never)}
                    className={`h-24 w-24 items-center justify-center rounded-full border-4 shadow-lg ${open ? 'bg-white' : 'bg-slate-100/75 opacity-70'}`}
                    style={{ borderColor: open ? meta.color : '#CBD5E1' }}
                  >
                    <Text className="text-3xl" style={{ color: open ? meta.color : '#94A3B8' }}>{open ? meta.icon : '🔒'}</Text>
                    {earned > 0 ? <Text className="absolute -bottom-2 rounded-pill bg-slate-900 px-2 py-0.5 text-[10px] text-white">{'★'.repeat(earned)}</Text> : null}
                  </Pressable>
                  <View className="mt-3 rounded-pill border border-white/20 bg-slate-950/75 px-3 py-1.5">
                    <Text className="max-w-[130px] text-center font-strong text-label text-white">{node.title}</Text>
                    <Text className="mt-0.5 text-center font-sans text-[10px] uppercase tracking-[1px] text-white/60">{node.subtitle}</Text>
                  </View>
                </View>
            );
          })}
        </View>
        <View className="mt-4 flex-row items-center justify-between gap-3">
          <Text className="font-sans text-label text-white/60">Mỗi node = 8–10 câu SAT</Text>
          <Text className="font-strong text-label" style={{ color: map.accent }}>Chọn node để vào trận →</Text>
        </View>
      </View>

      <LinearGradient colors={['#EEF2FF', '#F5F3FF']} className="mt-2 rounded-card border border-primary-100 p-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-panel bg-white"><Text className="text-xl">⚡</Text></View>
          <View className="flex-1">
            <Text className="font-strong text-cardTitle text-ink">Mẹo chiến thuật</Text>
            <Text className="mt-1 font-sans text-body leading-5 text-muted">Giữ combo bằng cách đọc kỹ câu hỏi. Combo càng cao, đòn đánh càng mạnh.</Text>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}
