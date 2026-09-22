import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { getQuestMap, getQuestNode } from '@/services/quest/maps';
import { useQuestStore } from '@/store/useQuestStore';

export default function QuestResultScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const node = getQuestNode(battleId);
  const map = getQuestMap(node?.mapId);
  const result = useQuestStore((s) => s.completedBattles.find((battle) => battle.nodeId === battleId));
  const wrong = result?.wrongQuestionIds.length ?? 0;
  const hasCosmetic = result?.stars === 3;

  if (!result || !node) {
    return <Screen><Text className="font-heavy text-pageTitle text-ink">Chưa có kết quả trận</Text><Button className="mt-5" label="Về Quest" onPress={() => router.replace('/quest' as never)} /></Screen>;
  }

  return (
    <Screen>
      <LinearGradient colors={[map.deep, '#172554', '#4C1D95']} className="rounded-card p-6 lg:p-10">
        <Text className="font-strong text-label tracking-[2px] text-cyan-200">MISSION COMPLETE</Text>
        <Text className="mt-2 font-heavy text-pageTitle text-white">Node đã vượt qua</Text>
        <Text className="mt-1 font-sans text-bodyLg text-white/70">{map.title} · {node.title}</Text>
        <View className="mt-8 flex-row flex-wrap gap-3">
          <ResultStat value={`${result.correct}/${result.total}`} label="CÂU ĐÚNG" />
          <ResultStat value={'★'.repeat(result.stars)} label="SAO NHẬN" accent="#FDE68A" />
          <ResultStat value={`+${result.xp}`} label="XP" accent="#67E8F9" />
          <ResultStat value={result.damage} label="DAMAGE" accent="#86EFAC" />
        </View>
      </LinearGradient>

      <Card className="mt-5 border-emerald-100 bg-emerald-50">
        <Text className="font-strong text-cardTitle text-ink">Chiến thắng nhờ kiến thức</Text>
        <Text className="mt-1 font-sans text-body leading-5 text-muted">Bạn đã mở khóa node tiếp theo. {wrong > 0 ? `${wrong} câu sai đã được lưu để ôn lại.` : 'Không có câu sai trong trận này.'}</Text>
        {hasCosmetic ? <Text className="mt-3 font-strong text-body text-violet-700">★ Phần thưởng: skin trang trí {map.title}</Text> : null}
      </Card>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <Button label="Chơi node tiếp theo" iconRight="arrow-right" onPress={() => router.replace(`/quest/map/${map.id}` as never)} />
        <Button label="Xem lại câu sai" variant="outline" onPress={() => router.replace('/quest' as never)} />
      </View>
    </Screen>
  );
}

function ResultStat({ value, label, accent = '#FFFFFF' }: { value: string | number; label: string; accent?: string }) {
  return <View className="min-w-[100px] rounded-panel border border-white/15 bg-black/20 px-4 py-3"><Text className="font-heavy text-sectionTitle" style={{ color: accent }}>{value}</Text><Text className="mt-1 font-strong text-[10px] tracking-[1px] text-white/55">{label}</Text></View>;
}
