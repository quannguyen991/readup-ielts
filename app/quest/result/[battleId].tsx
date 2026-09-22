import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { MathFigure } from '@/components/math/MathFigure';
import { MathText } from '@/components/math/MathText';
import { Button, Card } from '@/components/ui';
import { PASS_ACCURACY } from '@/services/quest/combat';
import { getQuestMap, getQuestNode } from '@/services/quest/maps';
import type { QuestQuestion } from '@/services/quest/types';
import { useQuestStore } from '@/store/useQuestStore';

export default function QuestResultScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const node = getQuestNode(battleId);
  const map = getQuestMap(node?.mapId);
  const result = useQuestStore((s) => s.completedBattles.find((battle) => battle.nodeId === battleId));
  const wrong = result?.wrongQuestionIds.length ?? 0;
  const hasCosmetic = result?.stars === 3;
  const [showReview, setShowReview] = useState(false);

  const passed = (result?.stars ?? 0) > 0;
  const needed = Math.ceil((result?.total ?? 0) * PASS_ACCURACY);
  const reviewable = result?.wrongQuestions ?? [];

  if (!result || !node) {
    return <Screen><Text className="font-heavy text-pageTitle text-white">Chưa có kết quả trận</Text><Button className="mt-5" label="Về Quest" onPress={() => router.replace('/quest' as never)} /></Screen>;
  }

  return (
    <Screen>
      <LinearGradient colors={[map.deep, '#172554', '#4C1D95']} className="rounded-card p-6 lg:p-10">
        <Text className="font-strong text-label tracking-[2px] text-cyan-200">{passed ? 'MISSION COMPLETE' : 'MISSION FAILED'}</Text>
        <Text className="mt-2 font-heavy text-pageTitle text-white">{passed ? 'Node đã vượt qua' : 'Chưa vượt qua node'}</Text>
        <Text className="mt-1 font-sans text-bodyLg text-white/70">{map.title} · {node.title}</Text>
        <View className="mt-8 flex-row flex-wrap gap-3">
          <ResultStat value={`${result.correct}/${result.total}`} label="CÂU ĐÚNG" />
          <ResultStat value={result.stars > 0 ? '★'.repeat(result.stars) : '—'} label="SAO NHẬN" accent="#FDE68A" />
          <ResultStat value={`+${result.xp}`} label="XP" accent="#67E8F9" />
          <ResultStat value={result.damage} label="DAMAGE" accent="#86EFAC" />
        </View>
      </LinearGradient>

      {passed ? (
        <Card className="mt-5 border-emerald-100 bg-emerald-50">
          <Text className="font-strong text-cardTitle text-ink">Chiến thắng nhờ kiến thức</Text>
          <Text className="mt-1 font-sans text-body leading-5 text-muted">Bạn đã mở khóa node tiếp theo. {wrong > 0 ? `${wrong} câu sai nằm ngay bên dưới để xem lại.` : 'Không có câu sai trong trận này.'}</Text>
          {hasCosmetic ? <Text className="mt-3 font-strong text-body text-violet-700">★ Phần thưởng: skin trang trí {map.title}</Text> : null}
        </Card>
      ) : (
        <Card className="mt-5 border-rose-100 bg-rose-50">
          <Text className="font-strong text-cardTitle text-ink">Quái vẫn đứng vững</Text>
          <Text className="mt-1 font-sans text-body leading-5 text-muted">Cần đúng ít nhất {needed}/{result.total} câu để mở node tiếp theo. Xem lại {wrong} câu sai rồi đánh lại — đề mỗi trận là đề mới.</Text>
        </Card>
      )}

      <View className="mt-5 flex-row flex-wrap gap-3">
        {passed ? (
          <Button label="Chơi node tiếp theo" iconRight="arrow-right" onPress={() => router.replace(`/quest/map/${map.id}` as never)} />
        ) : (
          <Button label="Đánh lại" iconRight="arrow-right" onPress={() => router.replace(`/quest/battle/${node.id}` as never)} />
        )}
        {reviewable.length > 0 ? (
          <Button label={showReview ? 'Ẩn câu sai' : `Xem lại ${reviewable.length} câu sai`} variant="onDark" onPress={() => setShowReview((v) => !v)} />
        ) : null}
        {!passed ? <Button label="Về bản đồ" variant="onDark" onPress={() => router.replace(`/quest/map/${map.id}` as never)} /> : null}
      </View>

      {showReview ? (
        <View className="mt-5 gap-3">
          {reviewable.map((q, i) => <WrongQuestion key={q.id} q={q} n={i + 1} />)}
        </View>
      ) : null}
    </Screen>
  );
}

function ResultStat({ value, label, accent = '#FFFFFF' }: { value: string | number; label: string; accent?: string }) {
  return <View className="min-w-[100px] rounded-panel border border-white/15 bg-black/20 px-4 py-3"><Text className="font-heavy text-sectionTitle" style={{ color: accent }}>{value}</Text><Text className="mt-1 font-strong text-[10px] tracking-[1px] text-white/55">{label}</Text></View>;
}

/**
 * Một câu sai để xem lại: đề, đáp án đúng, lời giải.
 *
 * Nút "Xem lại câu sai" trước đây chỉ đưa về trang chủ Quest, trong khi thẻ
 * kết quả hứa "câu sai đã được lưu để ôn lại" — lời hứa không có chỗ nào thực
 * hiện. Giờ câu sai hiện ngay tại đây, lúc người học còn nhớ vì sao mình chọn.
 */
function WrongQuestion({ q, n }: { q: QuestQuestion; n: number }) {
  return (
    <View className="rounded-card border border-white/15 bg-slate-900/85 p-4">
      <Text className="font-strong text-label tracking-[1.5px] text-cyan-300">CÂU SAI {n} · {q.skillLabel ?? q.skill}</Text>
      {q.context ? <Text className="mt-2 font-sans text-body leading-6 text-white/70">{q.context}</Text> : null}
      {q.subject === 'math' ? (
        <View className="mt-2"><MathText size={15} weight="semibold" tone="#FFFFFF">{q.prompt}</MathText></View>
      ) : (
        <Text className="mt-2 font-strong text-body leading-6 text-white">{q.prompt}</Text>
      )}
      {q.figure ? (
        <View className="mt-3 self-start rounded-panel bg-white p-3"><MathFigure spec={q.figure} /></View>
      ) : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-1.5 rounded-panel border border-emerald-300/40 bg-emerald-400/10 px-3 py-2">
        <Text className="font-strong text-label text-emerald-200">Đáp án đúng: {'ABCD'[q.correctIndex]} ·</Text>
        {q.subject === 'math' ? (
          <MathText size={14} tone="#A7F3D0">{q.options[q.correctIndex] ?? ''}</MathText>
        ) : (
          <Text className="font-strong text-label text-emerald-200">{q.options[q.correctIndex]}</Text>
        )}
      </View>
      <Text className="mt-3 font-sans text-body leading-6 text-white/75">{q.explanation}</Text>
    </View>
  );
}
