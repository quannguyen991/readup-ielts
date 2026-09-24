import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { CrossFade, PressScale } from '@/components/motion/Motion';
import { QuestBackdrop, BattleCharacters, BattleDamageFlash } from '@/components/quest/QuestVisual';
import { HealthBar, QuestStat } from '@/components/quest/QuestHud';
import { MathFigure } from '@/components/math/MathFigure';
import { MathText } from '@/components/math/MathText';
import { ItemBody } from '@/components/sat-rw/ItemBody';
import { Button } from '@/components/ui';
import { getQuestMap, getQuestNode } from '@/services/quest/maps';
import { resolveCombatAnswer } from '@/services/quest/combat';
import { useQuestStore } from '@/store/useQuestStore';
import { playQuestAttackSound, playQuestDamageSound, playQuestHitSound } from '@/services/audio/chime';

export default function QuestBattleScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const node = getQuestNode(battleId);
  const map = getQuestMap(node?.mapId);
  const activeBattle = useQuestStore((s) => s.activeBattle);
  const startBattle = useQuestStore((s) => s.startBattle);
  const finishBattle = useQuestStore((s) => s.finishBattle);
  const clearActiveBattle = useQuestStore((s) => s.clearActiveBattle);

  useEffect(() => {
    if (node && (!activeBattle || activeBattle.nodeId !== node.id)) startBattle(node.id, 'mixed');
  }, [activeBattle, node, startBattle]);

  const battle = activeBattle?.nodeId === node?.id ? activeBattle : null;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(node?.kind === 'boss' ? 260 : 170);
  const [combo, setCombo] = useState(0);
  const [damage, setDamage] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'attack' | 'counter'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const reducedMotion = useReducedMotion();

  const question = battle?.questions[index];
  const enemyMax = node?.kind === 'boss' ? 260 : 170;
  const finished = Boolean(question && revealed && (index >= (battle?.questions.length ?? 1) - 1 || enemyHp <= 0));
  const status = !revealed ? 'CHỌN ĐÁP ÁN ĐỂ KHAI HỎA' : selected === question?.correctIndex ? 'PHÁO KHAI HỎA · + DAMAGE' : 'QUÁI PHẢN CÔNG · TÊN LỬA ĐÁNH TRÚNG';

  const progress = useMemo(() => `${Math.min(index + (revealed ? 1 : 0), battle?.questions.length ?? 0)}/${battle?.questions.length ?? 0}`, [battle?.questions.length, index, revealed]);
  const screenShake = useSharedValue(0);
  const screenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: screenShake.value }, { translateY: screenShake.value * 0.35 }] }));

  useEffect(() => {
    if (reducedMotion) {
      // Reanimated shared values are intentionally mutable animation targets.
      // eslint-disable-next-line react-hooks/immutability
      screenShake.value = 0;
      return;
    }
    screenShake.value = phase === 'counter'
      ? withSequence(withTiming(-8, { duration: 45, easing: Easing.out(Easing.quad) }), withTiming(7, { duration: 55 }), withTiming(-4, { duration: 45 }), withTiming(0, { duration: 90 }))
      : phase === 'attack'
        ? withSequence(withTiming(3, { duration: 50 }), withTiming(0, { duration: 100 }))
        : withTiming(0, { duration: 100 });
    // phase is the one-shot trigger for the screen impact animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  if (!node || !battle || !question) {
    return <View className="flex-1 items-center justify-center bg-slate-950"><Text className="font-sans text-body text-white">Đang chuẩn bị chiến trường…</Text></View>;
  }

  const choose = (choice: number) => {
    if (revealed) return;
    const outcome = resolveCombatAnswer({
      isCorrect: choice === question.correctIndex,
      combo,
      playerHp,
      enemyHp,
      enemyMaxHp: enemyMax,
    });
    setSelected(choice);
    setRevealed(true);
    setCombo(outcome.combo);
    setPlayerHp(outcome.playerHp);
    setEnemyHp(outcome.enemyHp);
    setDamage((value) => value + outcome.damage);
    setPhase(outcome.correct ? 'attack' : 'counter');
    if (outcome.correct && soundEnabled) {
      playQuestAttackSound();
      playQuestHitSound();
    } else if (!outcome.correct && soundEnabled) {
      playQuestDamageSound();
    }
    if (!outcome.correct) setWrongIds((ids) => [...ids, question.id]);
  };

  const complete = () => {
    const allWrongIds = selected !== question.correctIndex && !wrongIds.includes(question.id)
      ? [...wrongIds, question.id]
      : wrongIds;
    finishBattle({
      battleId: battle.id,
      nodeId: node.id,
      mapId: map.id,
      // Tính trên số câu ĐÃ TRẢ LỜI: hạ quái sớm thì các câu còn lại chưa làm,
      // đếm chúng là "đúng" sẽ thổi phồng độ chính xác và số sao.
      correct: index + 1 - allWrongIds.length,
      total: index + 1,
      damage,
      wrongQuestionIds: allWrongIds,
      wrongQuestions: battle.questions.filter((q) => allWrongIds.includes(q.id)),
    });
    router.replace(`/quest/result/${node.id}` as never);
  };

  const next = () => {
    if (finished) return complete();
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setPhase('idle');
  };

  return (
    <Animated.View className="flex-1 bg-slate-950" style={screenStyle}>
      <View className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 lg:px-8 lg:py-6">
        <View className="flex-row items-center justify-between gap-3">
          <Button label="Rời trận" variant="onDark" iconLeft="chevron-left" onPress={() => { clearActiveBattle(); router.replace(`/quest/map/${map.id}` as never); }} />
          <View className="items-end"><Text className="font-strong text-label tracking-[1.5px] text-white/60">{map.title.toUpperCase()}</Text><Text className="mt-1 font-sans text-label text-white/50">Node {node.index} · Câu {progress}</Text><Pressable onPress={() => setSoundEnabled((value) => !value)} className="mt-2 rounded-pill border border-white/15 bg-white/10 px-3 py-1"><Text className="font-strong text-[10px] text-white/70">{soundEnabled ? 'ÂM THANH BẬT' : 'ÂM THANH TẮT'}</Text></Pressable></View>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <QuestStat icon="❤" value={playerHp} label="HP" tone="#86EFAC" />
          <QuestStat icon="◈" value={enemyHp} label="ENEMY HP" tone="#FDA4AF" />
          <QuestStat icon="✦" value={combo} label="COMBO" tone="#FDE68A" />
          <QuestStat icon="⚡" value={damage} label="DAMAGE" tone="#67E8F9" />
        </View>

          <QuestBackdrop map={map} minHeight={330}>
          <View className="absolute inset-x-5 top-5 flex-row gap-4" style={{ zIndex: 5 }}>
            <HealthBar value={playerHp} max={100} color="#86EFAC" label="READUP UNIT" />
            <HealthBar value={enemyHp} max={enemyMax} color="#FB7185" label={map.boss} />
          </View>
          <BattleCharacters map={map} phase={phase} />
          {/*
            Căn giữa bằng một hàng tràn ngang chứ không bằng left-1/2 + dịch trái:
            kiểu cũ chỉ cho viên này nửa bề ngang khung, nên trên điện thoại nó
            xuống dòng và đè lên nhãn READUP UNIT / ENEMY. Màn hẹp thì nâng lên
            trên hai nhãn đó.
          */}
          <View pointerEvents="none" className="absolute inset-x-0 bottom-12 items-center lg:bottom-5" style={{ zIndex: 6 }}>
            <View className="rounded-pill border border-white/20 bg-black/55 px-4 py-2">
              <Text numberOfLines={1} className="font-strong text-label text-white">{status}</Text>
            </View>
          </View>
        </QuestBackdrop>

        <View className="mt-4 flex-1 rounded-card border border-white/10 bg-slate-900 p-4 lg:p-6">
          <CrossFade swapKey={`${question.id}:${revealed}`}>
            <View>
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-strong text-label tracking-[1.5px] text-cyan-300">SAT {question.subject === 'math' ? 'MATH' : 'VERBAL'} · {question.skillLabel ?? question.skill}</Text>
                <Text className="font-sans text-label text-white/45">CÂU {index + 1}</Text>
              </View>
              {/*
                Đoạn văn Verbal in trên TẤM GIẤY SÁNG, đủ cả bảng số và phần gạch
                chân, bằng đúng component của phòng thi SAT R&W. Trước đây nó bị
                cắt còn 4 dòng trên nền tối — câu hỏi vẫn hiện nhưng bài để trả
                lời thì không đọc hết được.
              */}
              {question.rwItem ? (
                <View className="mt-3 rounded-panel bg-[#FBF8F1] px-4 py-3">
                  <ItemBody item={question.rwItem} />
                </View>
              ) : question.context ? (
                <Text className="mt-3 rounded-panel bg-slate-800 p-3 font-sans text-body leading-6 text-white/80">{question.context}</Text>
              ) : null}
              {question.subject === 'math' ? (
                <View className="mt-4">
                  <MathText size={17} weight="semibold" tone="#FFFFFF">{question.prompt}</MathText>
                </View>
              ) : (
                <Text className="mt-4 font-strong text-bodyLg leading-6 text-white">{question.prompt}</Text>
              )}
              {question.figure ? (
                <View className="mt-3 self-start rounded-panel bg-white p-3">
                  <MathFigure spec={question.figure} />
                </View>
              ) : null}
              <View className="mt-4 gap-2">
                {question.options.map((option, optionIndex) => {
                  const picked = selected === optionIndex;
                  const correct = revealed && optionIndex === question.correctIndex;
                  const wrong = revealed && picked && !correct;
                  return (
                    <PressScale key={`${question.id}:${optionIndex}`}>
                      <Pressable onPress={() => choose(optionIndex)} accessibilityRole="radio" aria-selected={picked} aria-disabled={revealed} className={`flex-row items-center gap-3 rounded-panel border px-3.5 py-3 ${correct ? 'border-emerald-300 bg-emerald-400/15' : wrong ? 'border-rose-300 bg-rose-400/15' : picked ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-slate-800'}`}>
                        <View className={`h-7 w-7 items-center justify-center rounded-full border ${correct ? 'border-emerald-300 bg-emerald-400/20' : wrong ? 'border-rose-300 bg-rose-400/20' : 'border-white/20'}`}><Text className="font-strong text-label text-white">{'ABCD'[optionIndex]}</Text></View>
                        {question.subject === 'math' ? (
                          <View className="flex-1"><MathText size={15} tone="#FFFFFF">{option}</MathText></View>
                        ) : (
                          <Text className="flex-1 font-sans text-body text-white">{option}</Text>
                        )}
                        {correct ? <Text className="text-lg text-emerald-300">✓</Text> : wrong ? <Text className="text-lg text-rose-300">×</Text> : null}
                      </Pressable>
                    </PressScale>
                  );
                })}
              </View>
              {revealed ? <View className="mt-4 rounded-panel border border-amber-300/20 bg-amber-200/10 p-3"><Text className="font-strong text-label text-amber-200">{selected === question.correctIndex ? 'Đúng rồi — khai hỏa!' : 'Quái phản công. Ghi nhớ lỗi này:'}</Text><Text className="mt-1 font-sans text-body leading-5 text-white/75">{question.explanation}</Text></View> : null}
            </View>
          </CrossFade>
          {revealed ? <Button className="mt-5 self-end" label={finished ? 'Nhận phần thưởng' : 'Câu tiếp theo'} iconRight="arrow-right" onPress={next} /> : null}
        </View>
      </View>
      <BattleDamageFlash phase={phase} disabled={reducedMotion} />
    </Animated.View>
  );
}
