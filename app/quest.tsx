import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Button, Card } from '@/components/ui';
import { QuestBackdrop } from '@/components/quest/QuestVisual';
import { QUEST_MAPS } from '@/services/quest/maps';
import { useQuestStore } from '@/store/useQuestStore';
import { useGameStore } from '@/store/useGameStore';
import { levelForXp } from '@/services/game/rules';

export default function QuestHome() {
  // Chữ 58px trên màn 375px làm "Tiến lên." gãy đôi ngay trong khối xanh.
  const wide = useWindowDimensions().width >= 768;
  const heroSize = wide ? 58 : 38;
  const heroLine = wide ? 64 : 44;
  // Cấp và XP là của NHÂN VẬT chung: cộng từ mọi màn học lẫn trận Quest.
  const xp = useGameStore((s) => s.xp);
  const level = levelForXp(xp);
  const stars = useQuestStore((s) => Object.values(s.stars).reduce((sum, value) => sum + value, 0));
  const unlocked = useQuestStore((s) => s.unlockedNodes);
  const recent = useQuestStore((s) => s.completedBattles[0]);

  return (
    <Screen>
      <View className="relative">
        <View className="relative">
          <View className="relative overflow-hidden" style={{ minHeight: 440, borderRadius: 32 }}>
            <Image source={require('../assets/quest/quest-hero-bg.webp')} className="absolute inset-0 h-full w-full" contentFit="cover" />
            <LinearGradient colors={['#050A1DEB', '#071637C9', '#0A1026B5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0" />
            <LinearGradient colors={['#07102D00', '#07102D33', '#090B1DE0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="relative flex-1" style={{ minHeight: 440, padding: wide ? 48 : 22 }}>
            <View className="max-w-4xl">
              <View className="self-start rounded-pill border border-amber-200/45 bg-[#1B2337CC] px-3 py-1.5 shadow-sm">
                <Text className="font-strong text-label tracking-[1.2px] text-amber-100">READUP QUEST · HỌC &amp; CHIẾN</Text>
              </View>
              <Text className="mt-7 font-heavy text-white" style={{ fontSize: heroSize, lineHeight: heroLine }}>Học. Đánh.</Text>
              <View className="mt-2 self-start rounded-md border border-cyan-200/70 bg-[#246BFFFF] px-4 py-1.5 shadow-sm">
                <Text className="font-heavy text-white" style={{ fontSize: heroSize, lineHeight: heroLine }}>Tiến lên.</Text>
              </View>
              <Text className="mt-5 max-w-2xl font-sans text-bodyLg leading-7 text-white/80">
                Mỗi câu SAT đúng là một phát bắn. Giữ combo, hạ boss và mở khóa vùng đất tiếp theo.
              </Text>
              <View className="mt-7 flex-row flex-wrap gap-2">
                <Button label="Tiếp tục hành trình" iconRight="arrow-right" onPress={() => router.push('/quest/map/iron-frontier' as never)} />
                <Button label="Bản đồ ReadUp" iconLeft="grid" variant="outline" onPress={() => router.push('/quest/world' as never)} />
                <Button label="Nhân vật & nhiệm vụ" iconLeft="shield" variant="outline" onPress={() => router.push('/quest/hero' as never)} />
              </View>
              <Text className="mt-4 font-sans text-label text-white/70">Nhiệm vụ tiếp theo: Iron Frontier · Node 01</Text>
              <View className="mt-7 flex-row flex-wrap gap-2">
                <View className="rounded-pill border border-cyan-200/30 bg-[#0A183BCC] px-3 py-2"><Text className="font-sans text-label text-white/75"><Text className="font-strong text-cyan-200">Lv.{level}</Text> cấp độ</Text></View>
                <View className="rounded-pill border border-cyan-200/30 bg-[#0A183BCC] px-3 py-2"><Text className="font-sans text-label text-white/75"><Text className="font-strong text-cyan-200">{stars}</Text> sao</Text></View>
                <View className="rounded-pill border border-cyan-200/30 bg-[#0A183BCC] px-3 py-2"><Text className="font-sans text-label text-white/75"><Text className="font-strong text-cyan-200">{xp}</Text> XP</Text></View>
                <View className="rounded-pill border border-cyan-200/30 bg-[#0A183BCC] px-3 py-2"><Text className="font-sans text-label text-white/75"><Text className="font-strong text-cyan-200">3</Text> bản đồ</Text></View>
              </View>
            </View>
            </LinearGradient>
            <View className="pointer-events-none absolute right-8 top-16 hidden w-64 rounded-panel border border-cyan-200/30 bg-[#07162DD9] p-4 shadow-sm lg:flex">
              <Text className="font-strong text-label tracking-[1.2px] text-cyan-200">QUEST LOG</Text>
              <View className="mt-3 flex-row gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-panel border border-amber-200/30 bg-amber-100/10"><Text className="text-xl">⚔</Text></View>
                <Text className="flex-1 font-sans text-label leading-4 text-white/75">Mỗi câu SAT đúng là một phát bắn. Giữ combo, hạ boss và mở khóa vùng đất tiếp theo.</Text>
              </View>
              <View className="mt-4 h-1.5 overflow-hidden rounded-pill bg-white/15"><View className="h-full w-1/3 rounded-pill bg-cyan-300" /></View>
              <Text className="mt-2 font-strong text-[10px] tracking-[1px] text-white/45">IRON FRONTIER · NODE 01</Text>
            </View>
          </View>

      <View className="mt-7 flex-row items-end justify-between gap-3">
        <View>
          <Text className="font-heavy text-sectionTitle text-white">Chọn chiến trường</Text>
          <Text className="mt-1 font-sans text-body text-white/70">Mỗi map là một hành trình SAT khác nhau.</Text>
        </View>
        <Text className="font-strong text-label text-cyan-200">{unlocked.length} node đã mở</Text>
      </View>

      <View className="mt-4 gap-4">
        {QUEST_MAPS.map((map, index) => (
          <Appear key={map.id} index={index}>
            <PressScale>
              <Pressable onPress={() => router.push(`/quest/map/${map.id}` as never)}>
                <QuestBackdrop map={map}>
                  <View className="p-5 lg:p-6">
                    <Text className="font-strong text-label tracking-[1.5px] text-white/70">{map.eyebrow}</Text>
                    <Text className="mt-2 font-heavy text-pageTitle text-white">{map.title}</Text>
                    <Text className="mt-1 max-w-md font-sans text-body text-white/75">{map.description}</Text>
                    <View className="mt-6 flex-row items-center justify-between">
                      <View className="flex-row gap-2">
                        <View className="rounded-pill bg-black/35 px-3 py-1.5"><Text className="font-strong text-label text-white">{map.nodes.length} chặng</Text></View>
                        <View className="rounded-pill bg-black/35 px-3 py-1.5"><Text className="font-strong text-label text-white">Boss: {map.boss}</Text></View>
                      </View>
                      <Text className="font-heavy text-bodyLg" style={{ color: map.accent }}>Xem map →</Text>
                    </View>
                  </View>
                </QuestBackdrop>
              </Pressable>
            </PressScale>
          </Appear>
        ))}
      </View>

      <Card className="mt-6 border-primary-100 bg-primary-50">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="font-strong text-cardTitle text-ink">{recent ? 'Trận gần nhất' : 'Sẵn sàng vào trận?'}</Text>
            <Text className="mt-1 font-sans text-body text-muted">{recent ? `Bạn vừa nhận ${recent.stars} sao · ${recent.correct}/${recent.total} câu đúng.` : 'Trả lời đúng để khai hỏa và mở khóa node mới.'}</Text>
          </View>
          <Text className="text-3xl">⚔</Text>
        </View>
      </Card>
        </View>
      </View>
    </Screen>
  );
}
