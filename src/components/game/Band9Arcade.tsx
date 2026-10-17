import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildDuel, DUEL_LENGTH } from '@/services/duel/duel';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';
import { playArcadeCue } from '@/services/audio/arcade-sfx';
import { HeroSprite } from '@/components/game/HeroSprite';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type ArcadeMode = 'fishing' | 'hack';
type Fish = { name: string; tier: string; weight: number; icon: string; color: string };
type Rival = { id: string; name: string; icon: string; credits: number; pounds: number };
type Output = { kind: 'credits' | 'blook' | 'hack'; label: string; value?: number };

const INITIAL_RIVALS: Rival[] = [
  { id: 'mira', name: 'Mira', icon: '🦊', credits: 35, pounds: 0 },
  { id: 'kai', name: 'Kai', icon: '🐼', credits: 42, pounds: 0 },
  { id: 'sol', name: 'Sol', icon: '🐸', credits: 28, pounds: 0 },
];
const ANSWER_COLORS = ['#E94B61', '#3296E8', '#F4C542', '#2DB875'];
const FISHES = [
  { name: 'Clownfish', tier: 'B Tier', icon: '🐠', color: '#F28C4B', min: 55, max: 140 },
  { name: 'Blue Tang', tier: 'A Tier', icon: '🐟', color: '#42B7E9', min: 90, max: 210 },
  { name: 'Moon Jelly', tier: 'A Tier', icon: '🪼', color: '#B997F5', min: 110, max: 245 },
  { name: 'Golden Marlin', tier: 'S Tier', icon: '🐬', color: '#F6C64B', min: 180, max: 420 },
  { name: 'Megalodon', tier: 'S Tier', icon: '🦈', color: '#8099AF', min: 300, max: 720 },
];

/** Fishing và Cyber Hack giữ vòng hoạt động đã quan sát; chỉ dùng cá/nhân vật và đồ họa nguyên bản của Band9. */
export function Band9Arcade({ mode }: { mode: ArcadeMode }) {
  const params = useLocalSearchParams<{ deck?: string }>();
  const slug = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const deck = useStudyDeck(slug || VOCAB_TOPICS[0]!.slug);
  const { L } = useL();
  const questions = useMemo(() => deck ? buildDuel(deck.words, `band9-${mode}:${slug || deck.slug}`).slice(0, DUEL_LENGTH) : [], [deck, mode, slug]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState(mode === 'fishing' ? 'cast' : 'password');
  const [picked, setPicked] = useState<number | null>(null);
  const [rivals, setRivals] = useState(INITIAL_RIVALS);
  const [totalPounds, setTotalPounds] = useState(0);
  const [liveFish, setLiveFish] = useState<Fish | null>(null);
  const [caughtFish, setCaughtFish] = useState<Fish | null>(null);
  const [castPower, setCastPower] = useState(0);
  const [castPerfect, setCastPerfect] = useState(false);
  const [reelPerfect, setReelPerfect] = useState(false);
  const [credits, setCredits] = useState(0);
  const [blooks, setBlooks] = useState(0);
  const [hackTokens, setHackTokens] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [revealedOutput, setRevealedOutput] = useState<Output | null>(null);
  const [playerPassword, setPlayerPassword] = useState<string | null>(null);
  const [rivalPasswords, setRivalPasswords] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<string | null>(null);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [event, setEvent] = useState('');
  const lock = useRef(false);
  const q = questions[index];
  const isFishing = mode === 'fishing';
  const passwords = useMemo(() => [...new Set(questions.map((item) => item.word.word))].slice(0, 3), [questions]);

  const finishTurn = () => {
    lock.current = false;
    setRevealedOutput(null);
    setLiveFish(null);
    setCaughtFish(null);
    setCastPower(0);
    setCastPerfect(false);
    setReelPerfect(false);
    if (index + 1 >= questions.length) setPhase('result');
    else {
      setIndex((n) => n + 1);
      setPicked(null);
      setTarget(null);
      setScanHint(null);
      setEvent('');
      setPhase(isFishing ? 'cast' : 'question');
    }
  };

  const questionAnswered = (choice: number) => {
    if (!q || picked !== null || lock.current) return;
    lock.current = true;
    setPicked(choice);
    const correct = choice === q.correctIndex;
    useGameStore.getState().answer(correct, 'duel');
    if (isFishing) {
      setRivals((rs) => rs.map((r) => ({ ...r, pounds: r.pounds + 40 + Math.floor(Math.random() * 180) })));
      if (correct && liveFish) {
        playArcadeCue('loot');
        const landedFish = { ...liveFish, weight: liveFish.weight + (castPerfect ? 25 : 0) + (reelPerfect ? 35 : 0) };
        setCaughtFish(landedFish);
        setTotalPounds((n) => n + landedFish.weight);
        setEvent(L(`${landedFish.name} · ${landedFish.tier} · ${landedFish.weight} lbs`, `${landedFish.name} · ${landedFish.tier} · ${landedFish.weight} lbs`));
        setPhase('landing');
        setTimeout(() => setPhase('catch'), 620);
      } else {
        playArcadeCue('impact');
        setEvent(L('INCORRECT — cá đã thoát! Tổng cân nặng cá vẫn được giữ.', 'INCORRECT — fish lost! Your collection total is safe.'));
        setPhase('lost');
      }
      lock.current = false;
      return;
    }
    if (correct) {
      const nextStreak = streak + 1;
      const nextBonus = Math.max(0, (nextStreak - 1) * 5);
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setEvent(L(
        nextBonus ? `ĐÚNG! Chuỗi ×${nextStreak} · kho credits thưởng +${nextBonus}.` : `ĐÚNG! Chuỗi ×${nextStreak} · đúng liên tiếp để tăng thưởng.`,
        nextBonus ? `CORRECT! STREAK ×${nextStreak} · +${nextBonus} credits if found.` : `CORRECT! STREAK ×${nextStreak} · keep it going for bonus credits.`
      ));
      setOutputs(makeOutputs());
      setPhase('correct');
      setTimeout(() => setPhase('reward'), 620);
      lock.current = false;
    } else {
      setStreak(0);
      setEvent(L('INCORRECT — đợi lượt kế tiếp…', 'INCORRECT — wait for the next question…'));
      setTimeout(finishTurn, 3000);
    }
  };

  const questionTimedOut = () => {
    if (!q || picked !== null || lock.current) return;
    lock.current = true;
    setPicked(-1);
    useGameStore.getState().answer(false, 'duel');
    if (isFishing) {
      playArcadeCue('impact');
      setEvent(L('Hết giờ! Dây câu chùng xuống và cá đã thoát.', 'Time ran out! The line went slack and the fish escaped.'));
      setPhase('lost');
      lock.current = false;
      return;
    }
    setStreak(0);
    setEvent(L('HẾT GIỜ! Gói tin đã khóa — lượt tiếp theo đang tới.', 'TIME UP! Packet locked — next round incoming.'));
    setTimeout(finishTurn, 2300);
  };

  const cast = (power = 78) => {
    if (lock.current) return;
    playArcadeCue('cast');
    lock.current = true;
    const perfect = power >= 72 && power <= 90;
    setCastPower(power);
    setCastPerfect(perfect);
    setReelPerfect(false);
    setPhase('casting');
    setEvent(perfect ? L('NÉM CHUẨN! Mồi rơi đúng luồng cá.', 'PERFECT CAST! The bait lands in the feeding current.') : L(`Mồi bay ở lực ${power}% · chờ tín hiệu…`, `Bait launched at ${power}% power · wait for a signal…`));
    setTimeout(() => setPhase('waiting'), 360);
    setTimeout(() => {
      const pool = power >= 72 ? FISHES : power >= 42 ? FISHES.slice(0, 4) : FISHES.slice(0, 3);
      const entry = pool[Math.floor(Math.random() * pool.length)]!;
      const bonus = perfect ? 22 : power >= 42 ? 8 : 0;
      setLiveFish({ ...entry, weight: entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1)) + bonus });
      setPhase('bite');
      playArcadeCue('bite');
      setEvent(L(perfect ? 'CÁ CẮN! Ném chuẩn giúp bạn có cơ hội bắt cá hiếm.' : 'CÁ CẮN CÂU! Canh vạch xanh để kéo đúng nhịp.', perfect ? 'FISH ON! A perfect cast can attract a rare catch.' : 'FISH ON! Hit the green zone to reel at the right moment.'));
      lock.current = false;
    }, 1650 + Math.floor(Math.random() * 850));
  };

  const reel = (position = 0) => {
    if (lock.current) return;
    playArcadeCue('reel');
    lock.current = true;
    const perfect = position >= 64 && position <= 92;
    setReelPerfect(perfect);
    setPhase('question');
    setEvent(perfect ? L('MÓC CHUẨN! +35 lbs nếu trả lời đúng.', 'PERFECT HOOK! +35 lbs if your answer is correct.') : L('Cá đã mắc câu · trả lời nhanh để giữ dây.', 'Fish hooked · answer quickly to keep the line taut.'));
    lock.current = false;
  };

  useEffect(() => {
    if (!isFishing || phase !== 'bite') return undefined;
    const timeout = setTimeout(() => {
      playArcadeCue('impact');
      setEvent(L('Cá giật đứt dây! Lượt câu này đã trôi mất.', 'The fish snapped the line! This cast got away.'));
      setPhase('lost');
    }, 12000);
    return () => clearTimeout(timeout);
  }, [isFishing, L, phase]);

  const choosePassword = (password: string) => {
    if (lock.current) return;
    lock.current = true;
    setPlayerPassword(password);
    const botPasswords: Record<string, string> = {};
    for (const rival of rivals) botPasswords[rival.id] = passwords[Math.floor(Math.random() * passwords.length)] ?? password;
    setRivalPasswords(botPasswords);
    setPhase('question');
    setEvent(L('Mật khẩu đã khóa. Đáp câu hỏi để hack đối thủ.', 'Password locked. Answer questions to hack rivals.'));
    lock.current = false;
  };

  const chooseOutput = (output: Output) => {
    if (lock.current) return;
    playArcadeCue('loot');
    lock.current = true;
    const bonus = output.kind === 'credits' && streak >= 2 ? (streak - 1) * 5 : 0;
    const securedOutput = output.kind === 'credits' ? { ...output, value: (output.value ?? 0) + bonus } : output;
    setRevealedOutput(securedOutput);
    if (output.kind === 'credits') {
      setCredits((n) => n + (securedOutput.value ?? 0));
      setRivals((rs) => rs.map((r) => ({ ...r, credits: r.credits + 10 + Math.floor(Math.random() * 20) })));
      setEvent(bonus > 0
        ? L(`+${securedOutput.value} credits · chuỗi thưởng +${bonus}`, `+${securedOutput.value} credits · streak bonus +${bonus}`)
        : L(`+${securedOutput.value} credits`, `+${securedOutput.value} credits`));
      setPhase('reveal');
      setTimeout(finishTurn, 1300);
    } else if (output.kind === 'blook') {
      setBlooks((n) => n + 1);
      setEvent(L('BLOOK! Đã thêm một nhân vật vào bộ sưu tập ván này.', 'BLOOK! Added one character to this match collection.'));
      setPhase('reveal');
      setTimeout(finishTurn, 1300);
    } else {
      setHackTokens((n) => n + 1);
      setEvent(L('Bạn nhận được HACK! Chọn đối thủ.', 'You got HACK! Choose a target.'));
      setPhase('reveal');
      setTimeout(() => {
        setPhase('target');
        lock.current = false;
      }, 1300);
    }
  };

  const targetRival = (id: string) => {
    if (lock.current) return;
    setTarget(id);
    setScanHint(null);
    setEvent('');
    setPhase('hack');
  };

  const scanTarget = () => {
    if (!target || !rivalPasswords[target] || credits < 12 || scanHint) return;
    setCredits((n) => n - 12);
    setScanHint(rivalPasswords[target]!.slice(0, 1).toUpperCase());
  };

  const hack = (guess: string) => {
    if (lock.current || !target) return;
    lock.current = true;
    const victim = rivals.find((r) => r.id === target);
    setHackTokens((n) => Math.max(0, n - 1));
    if (guess === rivalPasswords[target]) {
      playArcadeCue('impact');
      const taken = Math.min(33, victim?.credits ?? 0);
      setCredits((n) => n + taken);
      setRivals((rs) => rs.map((r) => r.id === target ? { ...r, credits: Math.max(0, r.credits - taken) } : r));
      setEvent(L(`CORRECT! Bạn lấy ${taken} credits từ ${victim?.name}.`, `CORRECT! You took ${taken} credits from ${victim?.name}.`));
    } else setEvent(L('Sai mật khẩu — HACK đã dùng hết.', 'Wrong password — HACK has been used.'));
    setTimeout(finishTurn, 1050);
  };

  const restart = () => {
    lock.current = false;
    setIndex(0); setPicked(null); setRivals(INITIAL_RIVALS); setTotalPounds(0); setLiveFish(null); setCaughtFish(null);
    setCredits(0); setBlooks(0); setHackTokens(0); setStreak(0); setBestStreak(0); setOutputs([]); setRevealedOutput(null); setPlayerPassword(null); setRivalPasswords({}); setTarget(null); setScanHint(null); setEvent('');
    setCastPower(0); setCastPerfect(false); setReelPerfect(false);
    setPhase(isFishing ? 'cast' : 'password');
  };

  if (!deck || !questions.length) {
    if (isFishing) return <Screen><Text className="font-heavy text-sectionTitle text-ink">{L('Bộ từ này chưa đủ câu hỏi.', 'This deck does not have enough questions.')}</Text><Button className="mt-4 self-start" label={L('Về sảnh game', 'Back to games')} onPress={() => router.replace('/duel' as never)} /></Screen>;
    return <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: '#170D2B' }}><Text className="text-center font-heavy text-sectionTitle" style={{ color: '#FFFFFF' }}>{L('Bộ từ này chưa đủ câu hỏi.', 'This deck does not have enough questions.')}</Text><GameButton label={L('VỀ SẢNH GAME', 'BACK TO GAMES')} color="#58E83A" onPress={() => router.replace('/duel' as never)} /></View>;
  }
  const rank = isFishing ? [...rivals].filter((r) => r.pounds > totalPounds).length + 1 : [...rivals].filter((r) => r.credits > credits).length + 1;
  const board = isFishing ? [...rivals].sort((a, b) => b.pounds - a.pounds) : [...rivals].sort((a, b) => b.credits - a.credits);

  if (!isFishing) return <CyberHackScreen phase={phase} q={q} picked={picked} passwords={passwords} outputs={outputs} revealedOutput={revealedOutput} event={event} playerPassword={playerPassword} target={target} scanHint={scanHint} rivals={rivals} credits={credits} hackTokens={hackTokens} blooks={blooks} streak={streak} bestStreak={bestStreak} rank={rank} index={index} total={questions.length} onSetPassword={choosePassword} onAnswer={questionAnswered} onTimeout={questionTimedOut} onChooseOutput={chooseOutput} onTarget={targetRival} onScanTarget={scanTarget} onHack={hack} onRestart={restart} onExit={() => router.replace('/duel' as never)} />;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 960 }}>
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable onPress={() => router.replace('/duel' as never)}><Text className="font-heavy text-bodyLg text-ink">‹ {L('Game lobby', 'Game lobby')}</Text></Pressable>
          <Text className="font-semi text-label text-muted">{deck.nameVi} · {Math.min(index + 1, questions.length)}/{questions.length}</Text>
        </View>

        <View className="overflow-hidden rounded-[26px]" style={{ backgroundColor: isFishing ? '#138AA2' : '#17152F', borderWidth: 3, borderColor: isFishing ? '#35C7CE' : '#6250B5' }}>
          <View className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: isFishing ? '#096579' : '#252047' }}>
            <View>
              <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 26 }}>{isFishing ? '🎣 FISHING FRENZY' : '⌨️ CYBER HACK'}</Text>
              <Text className="mt-1 font-semi text-label" style={{ color: isFishing ? '#C4F9F7' : '#C9F7A1' }}>{isFishing ? L('Cast · Reel · Answer · Catch', 'Cast · Reel · Answer · Catch') : L('Choose a password · Answer · Hack', 'Choose a password · Answer · Hack')}</Text>
            </View>
            <View className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,.22)' }}>
              <Text className="font-heavy text-bodyLg" style={{ color: '#FFFFFF' }}>{isFishing ? `🐟 ${totalPounds} lbs` : `💳 ${credits} credits`}</Text>
              <Text className="font-semi text-label" style={{ color: '#FFFFFF' }}>{L(`Hạng ${rank}`, `Rank ${rank}`)}{!isFishing ? ` · ⚡ ${hackTokens} · 🧸 ${blooks}` : ''}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 px-4 py-3" style={{ backgroundColor: isFishing ? '#0D7289' : '#1D1B3C' }}>
            {board.map((r, i) => <View key={r.id} className="flex-row items-center gap-2 rounded-pill px-3 py-2" style={{ backgroundColor: i === 0 ? '#F5C945' : 'rgba(255,255,255,.14)' }}><Text>{r.icon}</Text><Text className="font-heavy text-label" style={{ color: i === 0 ? '#312044' : '#FFFFFF' }}>{r.name}</Text><Text className="font-heavy text-label" style={{ color: i === 0 ? '#312044' : '#FFFFFF' }}>{isFishing ? `${r.pounds} lbs` : `${r.credits} cr`}</Text></View>)}
          </View>

          <View className="p-4 sm:p-6" style={{ backgroundColor: isFishing ? '#082F49' : '#2E285B' }}>
            {phase === 'result' ? <View className="items-center rounded-[22px] bg-white p-6">
              <Text style={{ fontSize: 58 }}>{isFishing ? '🏆' : '💻'}</Text>
              <Text className="mt-2 text-center font-heavy text-pageTitle text-ink">{rank === 1 ? L('Bạn thắng ván này!', 'You won the game!') : L('Ván chơi kết thúc', 'Game over')}</Text>
              <Text className="mt-2 font-semi text-bodyLg text-muted">{isFishing ? `${totalPounds} lbs · ${L(`hạng ${rank}`, `rank ${rank}`)}` : `${credits} credits · ${L(`hạng ${rank}`, `rank ${rank}`)}`}</Text>
              <View className="mt-5 flex-row flex-wrap justify-center gap-3"><Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={restart} /><Button variant="outline" label={L('Chọn game', 'Choose game')} onPress={() => router.replace('/duel' as never)} /></View>
            </View> : null}

            {isFishing && phase !== 'result' ? <FishingBoard phase={phase} q={q} picked={picked} fish={liveFish} caught={caughtFish} event={event} castPower={castPower} castPerfect={castPerfect} reelPerfect={reelPerfect} onCast={cast} onReel={reel} onAnswer={questionAnswered} onTimeout={questionTimedOut} onContinue={finishTurn} index={index} total={questions.length} /> : null}
          </View>
        </View>
        <Text className="mt-3 text-center font-sans text-label text-muted">{L('Điểm trong game thuộc ván chơi; câu đúng vẫn ghi nhận vào tiến trình Band9.', 'Game points stay in the match; correct answers still count toward Band9 progress.')}</Text>
      </View>
    </Screen>
  );
}

function CyberHackScreen({ phase, q, picked, passwords, outputs, revealedOutput, event, playerPassword, target, scanHint, rivals, credits, hackTokens, blooks, streak, bestStreak, rank, index, total, onSetPassword, onAnswer, onTimeout, onChooseOutput, onTarget, onScanTarget, onHack, onRestart, onExit }: any) {
  const { L } = useL();
  const standings = [...rivals].sort((a: Rival, b: Rival) => b.credits - a.credits);
  const lockedTarget = rivals.find((r: Rival) => r.id === target);
  const eventIsBad = /incorrect|wrong|sai|mất|time up|hết giờ/i.test(event);
  const answerColors = ['#E95169', '#318DE8', '#F2C444', '#2EBB70'];
  const [scan] = useState(() => new Animated.Value(0));
  const [revealScale] = useState(() => new Animated.Value(0.78));
  const [clock, setClock] = useState({ questionIndex: -1, seconds: 15 });
  const secondsLeft = clock.questionIndex === index ? clock.seconds : 15;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReducedMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { alive = false; listener.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion) { scan.setValue(0); return undefined; }
    const scanner = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(scan, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    scanner.start();
    return () => scanner.stop();
  }, [reducedMotion, scan]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    revealScale.setValue(0.78);
    Animated.spring(revealScale, { toValue: 1, speed: 12, bounciness: 12, useNativeDriver: true }).start();
  }, [phase, revealScale]);

  useEffect(() => {
    if (phase !== 'question' || picked !== null) return;
    const deadline = Date.now() + 15_000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setClock({ questionIndex: index, seconds: remaining });
      if (remaining === 0) {
        clearInterval(timer);
        onTimeout();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [index, onTimeout, phase, picked]);

  return <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#170C24' }}>
    <ImageBackground
      source={require('../../../assets/game-covers/cyber-hack.jpg')}
      resizeMode="cover"
      imageStyle={{ opacity: 0.29 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,8,22,.52)' }} />
    <View style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <View style={{ position: 'absolute', top: 235, left: -70, width: 420, height: 1, backgroundColor: 'rgba(101,241,66,.18)', transform: [{ rotate: '-28deg' }] }} />
      <View style={{ position: 'absolute', top: 330, right: -65, width: 390, height: 1, backgroundColor: 'rgba(153,97,204,.28)', transform: [{ rotate: '-28deg' }] }} />
      <View style={{ position: 'absolute', top: 190, right: 105, width: 72, height: 72, borderWidth: 1, borderColor: 'rgba(153,97,204,.28)', transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', bottom: 84, left: 60, width: 50, height: 50, borderWidth: 1, borderColor: 'rgba(101,241,66,.2)', transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', top: 262, left: '12%', width: 5, height: 5, borderRadius: 3, backgroundColor: '#62F13D' }} />
      <View style={{ position: 'absolute', bottom: 210, right: '15%', width: 5, height: 5, borderRadius: 3, backgroundColor: '#B56FEA' }} />
    </View>

    <View style={{ zIndex: 1, minHeight: 72, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2A1443', borderBottomWidth: 2, borderBottomColor: '#502575' }}>
      <Pressable onPress={onExit} style={{ width: 110, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Text style={{ color: '#C6A9E6', fontSize: 26, fontWeight: '900' }}>‹</Text>
        <Text style={{ color: '#D6C2EA', fontSize: 12, fontWeight: '900' }}>{L('THOÁT', 'EXIT')}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#54E837', borderRadius: 8, borderBottomWidth: 4, borderBottomColor: '#218B20' }}><Text style={{ color: '#17300F', fontSize: 22, fontWeight: '900' }}>›_</Text></View>
        <View>
          <Text style={{ color: '#62F33B', fontFamily: 'monospace', fontSize: 23, lineHeight: 24, fontWeight: '900', letterSpacing: 1 }}>CYBER HACK</Text>
          <Text style={{ marginTop: 2, color: '#B797D3', fontFamily: 'monospace', fontSize: 9, fontWeight: '800', letterSpacing: 2 }}>BREAK THE CODE · TAKE THE CREDITS</Text>
        </View>
      </View>
      <View style={{ width: 150, alignItems: 'flex-end' }}>
        <Text style={{ color: '#CBB9DE', fontFamily: 'monospace', fontSize: 10, fontWeight: '800' }}>{L('VÒNG', 'ROUND')} {Math.min(index + 1, total)} / {total}</Text>
        <Text style={{ marginTop: 4, color: '#65EB43', fontSize: 12, fontWeight: '900' }}>● {L('ĐẤU VỚI BOT', 'BOT MATCH')}</Text>
      </View>
    </View>
    <View style={{ height: 4, backgroundColor: '#170D27' }}><View style={{ height: 4, width: `${Math.max(8, ((index + 1) / total) * 100)}%`, backgroundColor: '#61EF3A' }} /></View>

    <View style={{ zIndex: 1, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: 'rgba(20,10,32,.74)', borderBottomWidth: 1, borderBottomColor: '#44215F' }}>
      <View style={{ width: '100%', maxWidth: 1060, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 }}>
        <View style={{ minWidth: 165, flexGrow: 1, flexBasis: 185, minHeight: 58, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#283B24', borderWidth: 2, borderColor: '#5CE739', borderRadius: 10, borderBottomWidth: 5, borderBottomColor: '#2B8E24' }}>
          <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#67E947', borderRadius: 8 }}><Text style={{ fontSize: 21 }}>😎</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: '#E8FFE2', fontSize: 12, fontWeight: '900' }}>{L('BẠN', 'YOU')} · #{rank}</Text><Text style={{ marginTop: 2, color: '#77F256', fontFamily: 'monospace', fontSize: 14, fontWeight: '900' }}>¢ {credits}</Text></View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}><Text style={{ color: '#A7F893', fontSize: 11, fontWeight: '900' }}>⚡ {hackTokens}</Text><Text style={{ color: streak >= 3 ? '#FFE27A' : '#C5E9B9', fontSize: 10, fontWeight: '900' }}>🔥 ×{streak}</Text></View>
        </View>
        {standings.map((r: Rival, i: number) => <View key={r.id} style={{ minWidth: 145, flexGrow: 1, flexBasis: 160, minHeight: 58, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: i === 0 ? '#44331C' : '#332044', borderWidth: 1, borderColor: i === 0 ? '#E2B647' : '#684785', borderRadius: 10, borderBottomWidth: 4, borderBottomColor: i === 0 ? '#A56E24' : '#492D62' }}>
          <Text style={{ fontSize: 26 }}>{r.icon}</Text>
          <View style={{ flex: 1 }}><Text style={{ color: '#EFE5F8', fontSize: 12, fontWeight: '900' }}>{r.name}{i === 0 ? ' ♛' : ''}</Text><Text style={{ marginTop: 2, color: '#D2B7EE', fontFamily: 'monospace', fontSize: 13, fontWeight: '900' }}>¢ {r.credits}</Text></View>
        </View>)}
      </View>
    </View>

    <View style={{ zIndex: 1, flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 14 }}>
      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', marginBottom: 13, paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(7,17,12,.82)', borderWidth: 1, borderColor: '#304B34', borderRadius: 11 }}>
        {[
          { label: L('GIẢI MÃ', 'DECRYPT'), icon: '⌨', active: phase === 'password' || phase === 'question' || phase === 'correct', done: ['reward', 'reveal', 'target', 'hack', 'result'].includes(phase) },
          { label: L('MỞ KHO', 'UNLOCK LOOT'), icon: '▣', active: phase === 'reward' || phase === 'reveal', done: ['target', 'hack', 'result'].includes(phase) },
          { label: L('HACK ĐỐI THỦ', 'HACK A RIVAL'), icon: '⚡', active: phase === 'target' || phase === 'hack', done: phase === 'result' },
        ].map((step, i) => <React.Fragment key={step.label}>
          {i > 0 ? <Text style={{ color: '#52745A', fontFamily: 'monospace', fontSize: 14, fontWeight: '900' }}>›</Text> : null}
          <View style={{ paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: step.active ? '#183B22' : 'transparent', borderWidth: 1, borderColor: step.active ? '#64EF50' : 'transparent', borderRadius: 7, opacity: step.active || step.done ? 1 : 0.55 }}>
            <Text style={{ color: step.active || step.done ? '#8DFF80' : '#849184', fontFamily: 'monospace', fontSize: 12, fontWeight: '900' }}>{step.done ? '✓' : step.icon}</Text>
            <Text style={{ color: step.active || step.done ? '#DAF6D5' : '#9BA79A', fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{step.label}</Text>
          </View>
        </React.Fragment>)}
      </View>
      {phase === 'question' && picked === null ? <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', marginBottom: 11, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(7,17,12,.88)', borderWidth: 1, borderColor: secondsLeft <= 5 ? '#E95663' : '#304B34', borderRadius: 9 }}>
        <View style={{ marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#9DB89C', fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{L('THỜI GIAN GIẢI MÃ', 'TIME TO DECRYPT')}</Text>
          <Animated.Text style={{ color: secondsLeft <= 5 ? '#FF7381' : '#D8F8CF', fontFamily: 'monospace', fontSize: 12, fontWeight: '900', opacity: !reducedMotion && secondsLeft <= 5 ? scan.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 1, 0.55] }) : 1 }}>⌛ {String(secondsLeft).padStart(2, '0')}s</Animated.Text>
        </View>
        <View style={{ height: 5, overflow: 'hidden', backgroundColor: '#26342A', borderRadius: 4 }}><View style={{ width: `${(secondsLeft / 15) * 100}%`, height: 5, backgroundColor: secondsLeft <= 5 ? '#F05D68' : '#63E94B', borderRadius: 4 }} /></View>
      </View> : null}
      {(phase === 'question' || phase === 'correct') && q ? <>
        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Animated.View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: phase === 'correct' ? '#B8FF85' : '#62F13D', opacity: phase === 'correct' || reducedMotion ? 1 : scan.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] }) }} /><Text style={{ color: '#93E779', fontFamily: 'monospace', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{phase === 'correct' ? L('ACCESS GRANTED', 'ACCESS GRANTED') : L('FIREWALL BYPASS', 'FIREWALL BYPASS')}</Text></View>
          <Text style={{ color: '#C6B1DD', fontFamily: 'monospace', fontSize: 11, fontWeight: '800' }}>🔒 {playerPassword ? playerPassword.toUpperCase() : '---'}</Text>
        </View>
        <View style={{ minHeight: 190, overflow: 'hidden', backgroundColor: '#091710', borderRadius: 10, borderWidth: 3, borderColor: '#5CE63C', borderBottomWidth: 8, borderBottomColor: '#276D26' }}>
          <View style={{ minHeight: 34, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#14281B', borderBottomWidth: 1, borderBottomColor: '#355F34' }}>
            <View style={{ flexDirection: 'row', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FA6B6B' }} /><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F4C54A' }} /><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#67EF49' }} /></View>
            <Text style={{ color: '#9EC795', fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>BAND9 / INTRUSION CONSOLE / 0x{String(index + 17).padStart(2, '0')}</Text>
            <Text style={{ color: phase === 'correct' ? '#7DFF59' : '#6BA45D', fontFamily: 'monospace', fontSize: 9, fontWeight: '900' }}>{phase === 'correct' ? '✓ OK' : '● REC'}</Text>
          </View>
          {!reducedMotion && phase === 'question' ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 34, left: 0, right: 0, height: 2, backgroundColor: '#8EFF73', opacity: 0.72, shadowColor: '#72FF60', shadowOpacity: 0.9, shadowRadius: 8, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, 112] }) }] }} /> : null}
          <View style={{ minHeight: 150, paddingHorizontal: 22, paddingVertical: 17, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#6CBA5E', fontFamily: 'monospace', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>{L('GIẢI MÃ GÓI TIN', 'DECRYPT INCOMING PACKET')}</Text>
            <Text style={{ marginTop: 11, color: '#ECFFEA', textAlign: 'center', fontFamily: 'monospace', fontSize: 34, lineHeight: 40, fontWeight: '900' }}>{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
            <Text style={{ marginTop: 9, color: '#8CC780', fontFamily: 'monospace', fontSize: 11, fontWeight: '700' }}>{phase === 'correct' ? 'ACCESS GRANTED  //  CACHE UNLOCKING…' : L('CHỌN ĐÁP ÁN ĐỂ MỞ KHO PHẦN THƯỞNG', 'SELECT A MATCH TO BREACH THE CACHE')}</Text>
          </View>
        </View>
        <View style={{ marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
          {q.options.map((option: string, i: number) => {
            const isPicked = picked === i;
            const isRight = picked !== null && q.correctIndex === i;
            const color = isRight ? '#49D63D' : isPicked ? '#B82F51' : answerColors[i % answerColors.length];
            const labelColor = i === 2 && !isRight && !isPicked ? '#402B0C' : '#FFFFFF';
            return <Pressable key={i} accessibilityRole="button" disabled={picked !== null} onPress={() => onAnswer(i)} style={{ minHeight: 94, paddingHorizontal: 18, paddingVertical: 14, flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: color, borderRadius: 10, borderWidth: isRight || isPicked ? 3 : 1, borderColor: isRight ? '#C5FF9B' : 'rgba(255,255,255,.3)', borderBottomWidth: 7, borderBottomColor: 'rgba(0,0,0,.32)', opacity: picked !== null && !isRight && !isPicked ? 0.58 : 1, transform: [{ scale: phase === 'correct' && isRight ? 1.015 : 1 }] }}>
              <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,12,30,.22)', borderRadius: 8 }}><Text style={{ color: labelColor, fontFamily: 'monospace', fontSize: 16, fontWeight: '900' }}>{['A', 'B', 'C', 'D'][i]}</Text></View>
              <Text style={{ flex: 1, color: labelColor, fontSize: 18, lineHeight: 24, fontWeight: '900' }}>{option}</Text>
              {isRight ? <Text style={{ color: '#F2FFE9', fontSize: 19, fontWeight: '900' }}>✓</Text> : null}
            </Pressable>;
          })}
        </View>
      </> : null}

      {phase === 'password' ? <HackStageCard eyebrow="CREATE YOUR LOCK" title={L('Chọn mật mã của bạn', 'Choose your password')} detail={L('Hãy giữ bí mật. Đối thủ có thể thử đoán khi họ hack bạn.', 'Keep it secret. Rivals may try to guess it when they hack you.')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>{passwords.map((word: string, i: number) => <HackChoice key={word} word={word} icon={['✦', '◈', '⌘'][i % 3]!} color={['#47D73B', '#39B95C', '#269A53'][i % 3]!} onPress={() => onSetPassword(word)} />)}</View>
      </HackStageCard> : null}

      {phase === 'reward' ? <HackStageCard eyebrow="CACHE UNLOCKED" title={L('Chọn một phần thưởng', 'Choose one reward')} detail={event || L('Mỗi ô chứa một món đồ bí mật.', 'Each crate hides a different reward.')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>{outputs.map((_output: Output, i: number) => <Pressable key={i} accessibilityRole="button" onPress={() => onChooseOutput(outputs[i]!)} style={({ pressed }) => ({ width: 210, minHeight: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: ['#173E37', '#30244C', '#3D3520'][i % 3], borderWidth: 2, borderColor: ['#63F06B', '#AA80EA', '#F4CB55'][i % 3], borderRadius: 14, borderBottomWidth: 8, borderBottomColor: 'rgba(0,0,0,.45)', transform: [{ translateY: pressed ? 5 : 0 }, { scale: pressed ? 0.97 : 1 }] })}><View style={{ width: 78, height: 78, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.24)', borderRadius: 18, borderWidth: 1, borderColor: ['#63F06B', '#AA80EA', '#F4CB55'][i % 3] }}><Text style={{ fontSize: 52 }}>📦</Text></View><Text style={{ marginTop: 10, color: ['#91FF96', '#D6B9FF', '#FFE18A'][i % 3], fontFamily: 'monospace', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>{L('KHO BÍ MẬT', 'MYSTERY CACHE')} {String(i + 1).padStart(2, '0')}</Text><Text style={{ marginTop: 3, color: '#A6B6A5', fontFamily: 'monospace', fontSize: 9, fontWeight: '800' }}>TAP TO DECRYPT</Text></Pressable>)}</View>
      </HackStageCard> : null}

      {phase === 'reveal' && revealedOutput ? <HackStageCard eyebrow="DECRYPTION COMPLETE // LOOT SECURED" title={L('Mở khóa thành công!', 'Cache cracked!')} detail={event}>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: revealScale }] }}>
          <View style={{ width: 124, height: 124, alignItems: 'center', justifyContent: 'center', backgroundColor: '#102719', borderRadius: 62, borderWidth: 3, borderColor: '#69F15D', shadowColor: '#56F249', shadowOpacity: 0.55, shadowRadius: 22, elevation: 8 }}>
            <Text style={{ fontSize: 70 }}>{revealedOutput.kind === 'credits' ? '💳' : revealedOutput.kind === 'blook' ? '🤖' : '⚡'}</Text>
          </View>
          <Text style={{ marginTop: 15, color: '#8AFF7D', fontFamily: 'monospace', fontSize: 26, fontWeight: '900', letterSpacing: 1, textAlign: 'center' }}>
            {revealedOutput.kind === 'credits' ? `+${revealedOutput.value} CREDITS` : revealedOutput.kind === 'blook' ? L('BLOOK MỚI!', 'NEW BLOOK!') : 'HACK TOKEN!'}
          </Text>
          <Text style={{ marginTop: 7, color: '#C4DFC0', fontFamily: 'monospace', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{revealedOutput.kind === 'hack' ? L('MỤC TIÊU ĐÃ MỞ KHÓA', 'TARGETS UNLOCKED') : L(`XẾP HẠNG HIỆN TẠI  #${rank}`, `CURRENT RANK  #${rank}`)}</Text>
        </Animated.View>
      </HackStageCard> : null}

      {phase === 'target' ? <HackStageCard eyebrow="HACK TOKEN ACQUIRED" title={L('Chọn mục tiêu', 'Choose a target')} detail={L('Chọn đối thủ để thử lấy credits của họ.', 'Pick a rival and try to steal their credits.')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>{rivals.map((r: Rival) => <Pressable key={r.id} accessibilityRole="button" onPress={() => onTarget(r.id)} style={{ width: 205, minHeight: 142, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#35204B', borderWidth: 2, borderColor: '#9A65C1', borderRadius: 14, borderBottomWidth: 7, borderBottomColor: '#4A2B62' }}><Text style={{ fontSize: 41 }}>{r.icon}</Text><Text style={{ marginTop: 4, color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>{r.name}</Text><Text style={{ marginTop: 4, color: '#6CF34A', fontFamily: 'monospace', fontSize: 14, fontWeight: '900' }}>¢ {r.credits}</Text></Pressable>)}</View>
      </HackStageCard> : null}

      {phase === 'hack' ? <HackStageCard eyebrow="TARGET LOCKED · PASSWORD REQUIRED" title={L(`Đoán mật mã của ${lockedTarget?.name}`, `Guess ${lockedTarget?.name}'s password`)} detail={L('Đoán đúng để lấy tối đa 33 credits!', 'Guess correctly to take up to 33 credits!')}>
        <View style={{ marginBottom: 14, paddingHorizontal: 17, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2F1C43', borderRadius: 10, borderWidth: 1, borderColor: '#704894' }}><Text style={{ fontSize: 25 }}>{lockedTarget?.icon}</Text><Text style={{ color: '#EADAF6', fontWeight: '900' }}>{lockedTarget?.name}</Text><Text style={{ color: '#66F146', fontFamily: 'monospace', fontWeight: '900' }}>¢ {lockedTarget?.credits}</Text></View>
        <Pressable accessibilityRole="button" disabled={Boolean(scanHint) || credits < 12} onPress={onScanTarget} style={({ pressed }) => ({ width: '100%', maxWidth: 625, minHeight: 64, marginBottom: 14, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: scanHint ? '#173D25' : credits >= 12 ? '#302044' : '#222029', borderWidth: 1, borderColor: scanHint ? '#67EA58' : credits >= 12 ? '#9869C0' : '#48444C', borderRadius: 10, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,.35)', opacity: credits >= 12 || scanHint ? 1 : 0.62, transform: [{ translateY: pressed ? 3 : 0 }] })}>
          <Text style={{ fontSize: 27 }}>{scanHint ? '📡' : '🔎'}</Text>
          <View style={{ flex: 1 }}><Text style={{ color: scanHint ? '#94FF88' : '#E8D8F3', fontFamily: 'monospace', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{scanHint ? L('ĐÃ QUÉT · LỘ KÝ TỰ ĐẦU', 'SCAN COMPLETE · FIRST CHARACTER FOUND') : L('QUÉT MẬT KHẨU · 12 CREDITS', 'SCAN PASSWORD · 12 CREDITS')}</Text><Text style={{ marginTop: 3, color: '#B8A7C6', fontFamily: 'monospace', fontSize: 10, fontWeight: '800' }}>{scanHint ? `${L('Mật khẩu bắt đầu bằng', 'Password starts with')}  ${scanHint}` : credits >= 12 ? L('Dùng một lần để lộ ký tự đầu tiên.', 'One use to reveal the first character.') : L('Cần thêm credits để quét.', 'Earn more credits to scan.')}</Text></View>
          {!scanHint && credits >= 12 ? <Text style={{ color: '#C9A6E7', fontFamily: 'monospace', fontSize: 10, fontWeight: '900' }}>−12 ¢</Text> : null}
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>{passwords.map((word: string, i: number) => <HackChoice key={word} word={word} icon={['●', '▲', '◆'][i % 3]!} color={['#36BB55', '#219D47', '#48D339'][i % 3]!} onPress={() => onHack(word)} />)}</View>
      </HackStageCard> : null}

      {phase === 'result' ? <HackStageCard eyebrow="SESSION COMPLETE // FINAL SCORE" title={rank === 1 ? L('Bạn đứng đầu!', 'You are the top hacker!') : L('Ván chơi kết thúc', 'Game over')} detail={`¢ ${credits} · ${L(`Hạng ${rank}`, `Rank ${rank}`)} · 🔥 ×${bestStreak} · 🧸 ${blooks}`}><Text style={{ fontSize: 62 }}>🏆</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}><GameButton label={L('CHƠI LẠI', 'PLAY AGAIN')} color="#4CCF39" onPress={onRestart} /><GameButton label={L('CHỌN GAME', 'GAME LOBBY')} color="#7044A2" onPress={onExit} /></View></HackStageCard> : null}

      {event && phase !== 'reward' && phase !== 'reveal' && phase !== 'question' && phase !== 'correct' ? <View style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'center', backgroundColor: eventIsBad ? '#572036' : '#274423', borderRadius: 9, borderWidth: 1, borderColor: eventIsBad ? '#D74D6A' : '#58C943' }}><Text style={{ color: eventIsBad ? '#FFB3C0' : '#BFFFA8', textAlign: 'center', fontWeight: '900' }}>{event}</Text></View> : null}
      {event && (phase === 'question' || phase === 'correct') ? <View style={{ marginTop: 9, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'center', backgroundColor: eventIsBad ? '#572036' : '#18341F', borderRadius: 7, borderWidth: 1, borderColor: eventIsBad ? '#D74D6A' : '#5DBD43' }}><Text style={{ color: eventIsBad ? '#FFB3C0' : '#BFFFA8', textAlign: 'center', fontFamily: 'monospace', fontSize: 11, fontWeight: '900' }}>{event}</Text></View> : null}
    </View>

    <View style={{ zIndex: 1, minHeight: 34, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#190E27', borderTopWidth: 1, borderTopColor: '#46245F' }}>
      <Text style={{ color: '#A88ABD', fontFamily: 'monospace', fontSize: 10, fontWeight: '800' }}>BAND9 // CYBER NETWORK</Text>
      <Text style={{ color: '#B69BC9', fontSize: 10, fontWeight: '800' }}>¢ {credits}  ·  ⚡ {hackTokens}  ·  🧸 {blooks}</Text>
      <Text style={{ color: '#67EA47', fontFamily: 'monospace', fontSize: 10, fontWeight: '900' }}>● {L('VÁN ĐANG CHẠY', 'MATCH ACTIVE')}</Text>
    </View>
  </View>;
}

function HackStageCard({ eyebrow, title, detail, children }: { eyebrow: string; title: string; detail: string; children: React.ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', padding: 5, backgroundColor: '#5CE943', borderRadius: 17, borderBottomWidth: 8, borderBottomColor: '#236D2C', shadowColor: '#55F043', shadowOpacity: 0.24, shadowRadius: 20, elevation: 7 }}>
    <View style={{ paddingHorizontal: 22, paddingTop: 13, paddingBottom: 22, alignItems: 'center', backgroundColor: '#08150F', borderRadius: 12, borderWidth: 1, borderColor: '#387842' }}>
      <View style={{ width: '100%', marginBottom: 17, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#203C28' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#F46B71' }} /><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#F5C84E' }} /><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#67F34D' }} /><Text style={{ marginLeft: 5, color: '#829D82', fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>BAND9 SECURE SHELL</Text></View>
        <Text style={{ color: '#65EF4D', fontFamily: 'monospace', fontSize: 9, fontWeight: '900' }}>● ENCRYPTED</Text>
      </View>
      <Text style={{ color: '#80E875', fontFamily: 'monospace', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>{eyebrow}</Text>
      <Text style={{ marginTop: 9, color: '#F0FFE9', textAlign: 'center', fontFamily: 'monospace', fontSize: 27, lineHeight: 34, fontWeight: '900' }}>{title}</Text>
      <Text style={{ maxWidth: 620, marginTop: 6, marginBottom: 19, color: '#9BB89A', textAlign: 'center', fontSize: 13, lineHeight: 19, fontWeight: '700' }}>{detail}</Text>
      <View style={{ width: '100%', alignItems: 'center' }}>{children}</View>
    </View>
  </View>;
}

function HackChoice({ word, icon, color, onPress }: { word: string; icon: string; color: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ width: 190, minHeight: 126, paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: color, borderWidth: 2, borderColor: '#A6FF98', borderRadius: 13, borderBottomWidth: 8, borderBottomColor: 'rgba(0,0,0,.48)', transform: [{ translateY: pressed ? 5 : 0 }, { scale: pressed ? 0.97 : 1 }], shadowColor: '#56F249', shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 })}><View style={{ width: 47, height: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.18)', borderRadius: 14 }}><Text style={{ color: 'rgba(255,255,255,.94)', fontFamily: 'monospace', fontSize: 26, fontWeight: '900' }}>{icon}</Text></View><Text style={{ marginTop: 8, color: '#FFFFFF', fontFamily: 'monospace', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>{word.toUpperCase()}</Text><Text style={{ marginTop: 3, color: 'rgba(255,255,255,.74)', fontFamily: 'monospace', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>SECRET KEY</Text></Pressable>;
}

function FishingBoard({ phase, q, picked, fish, caught, event, castPower, castPerfect, reelPerfect, onCast, onReel, onAnswer, onTimeout, onContinue, index, total }: any) {
  const { L } = useL();
  const [bob] = useState(() => new Animated.Value(0));
  const [sceneIn] = useState(() => new Animated.Value(1));
  const [catchPop] = useState(() => new Animated.Value(0.72));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reelPosition, setReelPosition] = useState(8);
  const [biteClock, setBiteClock] = useState({ index: -1, ms: 12000 });
  const [answerClock, setAnswerClock] = useState({ index: -1, seconds: 12 });
  const biteMs = biteClock.index === index ? biteClock.ms : 12000;
  const answerSeconds = answerClock.index === index ? answerClock.seconds : 12;

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReducedMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { alive = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (reducedMotion) { bob.setValue(0); return undefined; }
    const float = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 680, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 680, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    float.start();
    return () => float.stop();
  }, [bob, reducedMotion]);
  useEffect(() => {
    sceneIn.setValue(0);
    const enter = Animated.spring(sceneIn, { toValue: 1, speed: 16, bounciness: 5, useNativeDriver: true });
    enter.start();
    return () => enter.stop();
  }, [phase, sceneIn]);
  useEffect(() => {
    if (phase !== 'catch' || reducedMotion) { catchPop.setValue(1); return undefined; }
    catchPop.setValue(0.72);
    const reveal = Animated.spring(catchPop, { toValue: 1, speed: 12, bounciness: 15, useNativeDriver: true });
    reveal.start();
    return () => reveal.stop();
  }, [catchPop, phase, reducedMotion]);
  useEffect(() => {
    if (phase !== 'bite') return undefined;
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const cycle = (elapsed % 2400) / 2400;
      setReelPosition(cycle <= 0.5 ? cycle * 200 : (1 - cycle) * 200);
      setBiteClock({ index, ms: Math.max(0, 12000 - elapsed) });
    }, 32);
    return () => clearInterval(timer);
  }, [index, phase]);
  useEffect(() => {
    if (phase !== 'question' || picked !== null) return undefined;
    const deadline = Date.now() + 12000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setAnswerClock({ index, seconds: remaining });
      if (remaining === 0) { clearInterval(timer); onTimeout(); }
    }, 100);
    return () => clearInterval(timer);
  }, [index, onTimeout, phase, picked]);

  const floatY = bob.interpolate({ inputRange: [0, 1], outputRange: [3, -8] });
  const labels: Record<string, string> = {
    cast: L('VỊNH SAN HÔ · BẾN 01', 'CORAL COVE · PIER 01'),
    casting: L('QUĂNG MỒI · CANH LỰC', 'CASTING · TIME YOUR POWER'),
    waiting: L('DÂY CÂU ĐANG RUNG', 'LINE IN THE WATER'),
    bite: L('CÓ CÁ CẮN!', 'FISH ON!'),
    question: L('GIỮ DÂY · TRẢ LỜI', 'KEEP THE LINE · ANSWER'),
    landing: L('KÉO CÁ LÊN BỜ!', 'LANDING THE CATCH!'),
    catch: L('KHO BÁU VỪA CẬP BẾN', 'CATCH LANDED'),
    lost: L('CÁ ĐÃ THOÁT', 'FISH GOT AWAY'),
  };
  const fishOnStage = phase === 'bite' || phase === 'question' || phase === 'landing' || phase === 'catch';
  const stageFish = caught ?? fish;
  return (
    <View style={{ minHeight: 390, overflow: 'hidden', borderRadius: 17, backgroundColor: '#07324D' }}>
      <View className="p-3 sm:p-4">
        <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-[16px] px-3 py-2.5" style={{ backgroundColor: '#0A2941', borderWidth: 1, borderColor: 'rgba(96,231,221,.36)' }}>
          <View className="flex-row items-center gap-2.5">
            <View className="rounded-[12px] p-1" style={{ backgroundColor: '#124764' }}>
              <HeroSprite size={36} mood={phase === 'catch' || phase === 'landing' ? 'happy' : phase === 'lost' ? 'tired' : 'idle'} />
            </View>
            <View>
              <Text className="font-heavy text-label" style={{ color: '#7DE7DF', letterSpacing: 1 }}>{labels[phase] ?? labels.cast}</Text>
              <Text className="font-semi" style={{ color: '#F3FAF4', fontSize: 12 }}>{L('Bút Sĩ · thợ câu hạng A', 'Word Knight · A-rank angler')}</Text>
            </View>
          </View>
          <View className="rounded-pill px-3 py-1.5" style={{ backgroundColor: '#173F59', borderWidth: 1, borderColor: '#39758A' }}>
            <Text className="font-heavy text-label" style={{ color: '#FFE08B' }}>🎣 {L('LƯỢT ' + (index + 1) + '/' + total, 'CAST ' + (index + 1) + '/' + total)}</Text>
          </View>
        </View>

        <View className="mt-3 overflow-hidden rounded-[19px]" style={{ height: 144, borderWidth: 1, borderColor: 'rgba(176,255,239,.45)', backgroundColor: '#70D3D1' }}>
          <Svg width="100%" height="100%" viewBox="0 0 1200 190" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
            <Path d="M0 0H1200V190H0Z" fill="#76DAD7" />
            <Circle cx="1000" cy="42" r="28" fill="#FFE69B" opacity={0.95} />
            <Circle cx="1000" cy="42" r="40" fill="#FFE69B" opacity={0.16} />
            <Path d="M0 74Q105 37 220 72T443 69T670 70T905 66T1200 74V112H0Z" fill="#54B6B7" />
            <Path d="M0 99Q100 78 210 98T430 94T655 99T890 91T1200 98V190H0Z" fill="#167D98" />
            <Path d="M0 128Q125 112 250 129T500 126T750 131T1000 124T1200 129V190H0Z" fill="#0E6485" />
            <Path d="M0 153Q90 140 180 153T360 151T540 154T720 149T900 154T1080 150T1200 153V190H0Z" fill="#0A5277" />
            <Path d="M0 124Q70 115 140 124T280 122T420 124T560 121T700 124T840 122T980 124T1120 121T1200 124" fill="none" stroke="#A9F1DF" strokeWidth="4" opacity={0.7} />
            <Path d="M40 150Q110 142 180 150M850 144Q920 136 990 144M1010 166Q1075 158 1140 166" fill="none" stroke="#82DACE" strokeWidth="3" strokeLinecap="round" opacity={0.75} />
            <Path d="M0 89Q58 75 118 89L138 110H0Z" fill="#3B9D95" />
            <Path d="M0 91Q34 48 76 72Q106 39 144 91" fill="none" stroke="#3B9D95" strokeWidth="12" strokeLinecap="round" />
            <Path d="M486 125Q600 151 714 125L690 154Q601 171 511 154Z" fill="#B86647" stroke="#713F45" strokeWidth="5" strokeLinejoin="round" />
            <Path d="M500 131Q600 151 700 131" fill="none" stroke="#FFD084" strokeWidth="4" strokeLinecap="round" />
            <Path d="M590 125V81L610 67" fill="none" stroke="#594D4A" strokeWidth="5" strokeLinecap="round" />
            <Path d="M610 67Q627 84 646 109" fill="none" stroke="#F7F5D6" strokeWidth="2.5" strokeLinecap="round" opacity={0.9} />
            <Circle cx="655" cy="118" r="5" fill="#EF6174" />
            <Circle cx="804" cy="103" r="5" fill="#C5FFF2" opacity={0.85} />
            <Circle cx="836" cy="83" r="3" fill="#C5FFF2" opacity={0.68} />
            <Circle cx="876" cy="112" r="7" fill="#C5FFF2" opacity={0.55} />
          </Svg>
          <Animated.View style={{ position: 'absolute', left: '47%', bottom: 20, transform: [{ translateY: floatY }, { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) }] }}>
            <HeroSprite size={48} mood={phase === 'catch' || phase === 'landing' ? 'happy' : phase === 'lost' ? 'tired' : 'idle'} />
          </Animated.View>
          {fishOnStage && stageFish ? <Animated.View style={{ position: 'absolute', right: '15%', bottom: phase === 'catch' ? 15 : 25, transform: [{ translateY: floatY }, { scale: catchPop }] }}>
            <FishSprite color={stageFish.color} size={phase === 'catch' ? 86 : 66} />
          </Animated.View> : null}
          {phase === 'waiting' || phase === 'bite' ? <Animated.View style={{ position: 'absolute', right: '30%', top: 30, transform: [{ translateY: floatY }] }}>
            <View style={{ width: 13, height: 13, borderRadius: 8, borderWidth: 2, borderColor: '#E8FFEE', backgroundColor: '#F26776' }} />
          </Animated.View> : null}
          <View style={{ position: 'absolute', left: 12, bottom: 10, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: 'rgba(5,46,68,.82)', borderWidth: 1, borderColor: 'rgba(213,255,240,.42)' }}>
            <Text className="font-heavy" style={{ color: '#E5FFF4', fontSize: 10, letterSpacing: 1 }}>{L('VỊNH SAN HÔ', 'CORAL COVE')}</Text>
          </View>
          {phase === 'catch' ? <View style={{ position: 'absolute', right: 14, top: 10, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#FFE08B' }}><Text className="font-heavy" style={{ color: '#563B33', fontSize: 10 }}>✦ RARE CATCH</Text></View> : null}
        </View>

        <Animated.View className="mt-3 items-center rounded-[19px] p-4" style={{ minHeight: 207, backgroundColor: '#FFF1C8', borderWidth: 2, borderColor: '#F1CB73', borderBottomWidth: 6, borderBottomColor: '#C99947', opacity: sceneIn, transform: [{ translateY: sceneIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: sceneIn.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }] } as object}>
          <View pointerEvents="none" style={{ position: 'absolute', top: 10, right: 12, width: 30, height: 4, borderRadius: 4, backgroundColor: '#F0B455' }} />
          <View className="w-full max-w-[620px]">
            {phase === 'cast' ? <View className="w-full items-center py-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-heavy text-sectionTitle" style={{ color: '#153B50' }}>{L('Canh lực ném', 'Time your cast')}</Text>
                <View className="rounded-pill px-2.5 py-1" style={{ backgroundColor: '#D9F5D5' }}><Text className="font-heavy" style={{ color: '#24704E', fontSize: 10 }}>{L('CÁ HIẾM +25 lbs', 'RARE FISH +25 lbs')}</Text></View>
              </View>
              <Text className="mt-1 max-w-[510px] text-center font-sans text-body" style={{ color: '#486477' }}>{L('Thả cần trong vùng xanh để dụ cá quý và tăng trọng lượng.', 'Release in the green zone to attract rare fish and add bonus weight.')}</Text>
              <View className="mt-3 w-full flex-row justify-between"><Text className="font-heavy text-label" style={{ color: '#176C78' }}>{L('LỰC NÉM', 'CAST POWER')}</Text><Text className="font-heavy text-label" style={{ color: '#176C78' }}>{L('VÙNG CHUẨN 72–90%', 'SWEET SPOT 72–90%')}</Text></View>
              <CastChargeControl onCast={onCast} L={L} />
            </View> : null}

            {phase === 'casting' ? <View className="w-full items-center py-2">
              <Text className="font-heavy text-label" style={{ color: '#176C78', letterSpacing: 1 }}>{L('CẦN CÂU ĐANG BAY', 'LINE IN THE AIR')}</Text>
              <Text className="mt-2 text-center font-heavy text-sectionTitle" style={{ color: '#153B50' }}>{event}</Text>
              <Text className="mt-1 font-heavy text-bodyLg" style={{ color: castPerfect ? '#128455' : '#176C78' }}>{L('LỰC NÉM ' + castPower + '%', 'CAST POWER ' + castPower + '%')} {castPerfect ? '✦' : ''}</Text>
              <View className="mt-3 h-3 w-full max-w-[390px] overflow-hidden rounded-full" style={{ backgroundColor: '#D6D6B2' }}><View style={{ width: (castPower + '%') as any, height: 12, borderRadius: 99, backgroundColor: castPerfect ? '#27B979' : '#0C9BB0' }} /></View>
            </View> : null}

            {phase === 'waiting' ? <View className="w-full items-center py-2">
              <View className="flex-row items-center gap-2"><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#35BFD0' }} /><View style={{ width: 16, height: 16, borderRadius: 9, borderWidth: 2, borderColor: '#35BFD0' }} /><View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: '#35BFD0', opacity: 0.72 }} /></View>
              <Text className="mt-2 font-heavy text-sectionTitle" style={{ color: '#153B50' }}>{L('Mồi trôi theo dòng…', 'The bait drifts with the current…')}</Text>
              <Text className="mt-1 text-center font-semi text-body" style={{ color: '#486477' }}>{event}</Text>
              <View className="mt-3 h-2.5 w-full max-w-[390px] overflow-hidden rounded-full" style={{ backgroundColor: '#D6D6B2' }}><Animated.View style={{ height: '100%', width: '44%', borderRadius: 99, backgroundColor: '#0C9BB0', transform: [{ translateX: bob.interpolate({ inputRange: [0, 1], outputRange: [-8, 205] }) }] }} /></View>
              <Text className="mt-2 font-heavy text-label" style={{ color: '#087D8E' }}>{L('ĐANG DÒ TÍN HIỆU CÁ CẮN', 'SEARCHING FOR A BITE')}</Text>
            </View> : null}

            {phase === 'bite' ? <View className="w-full items-center py-1">
              <View className="rounded-pill px-3 py-1" style={{ backgroundColor: '#FFE0A0', borderWidth: 1, borderColor: '#E9BD5D' }}><Text className="font-heavy text-label" style={{ color: '#7D481A' }}>{L('CÁ ĐANG GIẪY · ' + Math.ceil(biteMs / 1000) + 's', 'FISH FIGHTING · ' + Math.ceil(biteMs / 1000) + 's')}</Text></View>
              <Text className="mt-2 text-center font-heavy text-bodyLg" style={{ color: '#183C52' }}>{event}</Text>
              <View className="mt-3 w-full"><View className="mb-1 flex-row justify-between"><Text className="font-heavy text-label" style={{ color: '#176C78' }}>{L('NHỊP KÉO', 'REEL METER')}</Text><Text className="font-heavy text-label" style={{ color: '#158552' }}>{L('VÙNG CHUẨN 64–92%', 'SWEET SPOT 64–92%')}</Text></View><View style={{ height: 22, overflow: 'hidden', backgroundColor: '#DDD8B9', borderRadius: 12, borderWidth: 1, borderColor: '#B5A675' }}><View style={{ position: 'absolute', left: '64%', width: '28%', height: '100%', backgroundColor: 'rgba(38,184,119,.55)', borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#148858' }} /><View style={{ position: 'absolute', left: reelPosition + '%', top: -4, width: 5, height: 30, marginLeft: -2, backgroundColor: '#F24E65', borderRadius: 3, boxShadow: '0 0 8px rgba(220,45,72,.55)' } as object} /></View><View className="mt-1 flex-row justify-between"><Text className="font-semi text-label" style={{ color: '#687A73' }}>0</Text><Text className="font-semi text-label" style={{ color: '#687A73' }}>100</Text></View></View>
              <GameButton label={L('KÉO CẦN!', 'REEL NOW!')} color="#E94D63" onPress={() => onReel(reelPosition)} />
            </View> : null}

            {phase === 'question' && q ? <View className="w-full py-1">
              <View className="flex-row items-center justify-between"><InfoChip icon={reelPerfect ? '🎯' : '🪝'} label={reelPerfect ? L('MÓC CHUẨN · +35 lbs', 'PERFECT HOOK · +35 lbs') : L('DÂY CÂU ĐANG CĂNG', 'LINE IS TIGHT')} /><Text className="font-heavy text-label" style={{ color: answerSeconds <= 3 ? '#D83F57' : '#087D8E' }}>⏱ {answerSeconds}s</Text></View>
              <Text className="mt-2 text-center font-heavy text-pageTitle" style={{ color: '#153B50' }}>{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
              <View className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#D6D6B2' }}><View style={{ height: '100%', width: ((answerSeconds / 12 * 100) + '%') as any, borderRadius: 99, backgroundColor: answerSeconds <= 3 ? '#E95367' : '#159CB0' }} /></View>
              <Text className="mt-1 text-center font-heavy text-label" style={{ color: '#087D8E' }}>{L('TRẢ LỜI TRƯỚC KHI CÁ TUỘT MẤT', 'ANSWER BEFORE THE FISH GETS AWAY')}</Text>
              <View className="mt-3 flex-row flex-wrap gap-3">{q.options.map((option: string, i: number) => <AnswerTile key={i} label={option} color={picked === i ? (i === q.correctIndex ? '#26B875' : '#DB475F') : picked !== null && i === q.correctIndex ? '#26B875' : ANSWER_COLORS[i % 4]!} disabled={picked !== null} onPress={() => onAnswer(i)} />)}</View>
            </View> : null}

            {phase === 'landing' && caught ? <Animated.View className="items-center py-2" style={{ transform: [{ scale: catchPop }] }}>
              <View className="rounded-pill px-3 py-1" style={{ backgroundColor: '#D9F5D5' }}><Text className="font-heavy text-label" style={{ color: '#24704E' }}>{L('CÁ ĐÃ LÊN BỜ!', 'CATCH LANDED!')}</Text></View>
              <Text className="mt-2 text-center font-heavy text-sectionTitle" style={{ color: '#153B50' }}>{caught.name}</Text>
              <Text className="mt-1 text-center font-semi text-body" style={{ color: '#486477' }}>{event}</Text>
              <View className="mt-2 flex-row flex-wrap justify-center gap-2">{castPerfect ? <InfoChip icon="✨" label={L('NÉM CHUẨN +25 lbs', 'PERFECT CAST +25 lbs')} /> : null}{reelPerfect ? <InfoChip icon="🎯" label={L('MÓC CHUẨN +35 lbs', 'PERFECT HOOK +35 lbs')} /> : null}</View>
            </Animated.View> : null}

            {phase === 'catch' && caught ? <Animated.View className="items-center py-1" style={{ transform: [{ scale: catchPop }] }}>
              <View className="flex-row items-center gap-2"><Text className="font-heavy text-label" style={{ color: '#AC6827', letterSpacing: 1 }}>{L('TROPHY CATCH', 'TROPHY CATCH')}</Text><Text style={{ fontSize: 18 }}>✦</Text></View>
              <Text className="mt-1 text-center font-heavy text-pageTitle" style={{ color: '#153B50' }}>{caught.name}</Text>
              <View className="mt-2 flex-row flex-wrap justify-center gap-2"><InfoChip icon="🏅" label={caught.tier} /><InfoChip icon="⚖️" label={String(caught.weight) + ' lbs'} />{castPerfect ? <InfoChip icon="✨" label={L('NÉM CHUẨN', 'PERFECT CAST')} /> : null}{reelPerfect ? <InfoChip icon="🎯" label={L('MÓC CHUẨN', 'PERFECT HOOK')} /> : null}</View>
              <GameButton label={L('NHẬN CHIẾN LỢI PHẨM', 'CLAIM YOUR CATCH')} color="#138FA4" onPress={onContinue} />
            </Animated.View> : null}

            {phase === 'lost' ? <View className="items-center py-3">
              <View className="rounded-pill px-3 py-1" style={{ backgroundColor: '#FFE0A0' }}><Text className="font-heavy text-label" style={{ color: '#7D481A' }}>{L('CÁ ĐÃ THOÁT', 'FISH GOT AWAY')}</Text></View>
              <Text className="mt-2 text-center font-heavy text-sectionTitle" style={{ color: '#153B50' }}>{event}</Text>
              <Text className="mt-1 text-center font-sans text-body" style={{ color: '#486477' }}>{L('Canh lực và nhịp tốt hơn ở lượt tới.', 'Time your cast and reel better next round.')}</Text>
              <GameButton label={L('THỬ CÂU LẠI', 'CAST AGAIN')} color="#138FA4" onPress={onContinue} />
            </View> : null}
          </View>
        </Animated.View>
      </View>
    </View>
  );}

function CastChargeControl({ onCast, L }: { onCast: (power: number) => void; L: (vi: string, en: string) => string }) {
  const [power, setPower] = useState(10);
  const [charging, setCharging] = useState(false);
  const powerValue = useRef(10);
  const startedAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const released = useRef(false);
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const begin = () => {
    if (startedAt.current !== null) return;
    released.current = false;
    startedAt.current = Date.now();
    powerValue.current = 10;
    setPower(10);
    setCharging(true);
    const tick = () => {
      if (startedAt.current === null) return;
      const elapsed = (Date.now() - startedAt.current) % 1800;
      const progress = elapsed <= 900 ? elapsed / 900 : (1800 - elapsed) / 900;
      const nextPower = 10 + progress * 90;
      powerValue.current = nextPower;
      setPower(nextPower);
    };
    timer.current = setInterval(tick, 32);
    tick();
  };
  const release = () => {
    if (startedAt.current === null) return;
    stop();
    startedAt.current = null;
    setCharging(false);
    released.current = true;
    onCast(Math.round(powerValue.current));
  };
  const activate = () => {
    if (released.current) { released.current = false; return; }
    if (startedAt.current !== null) release();
    else onCast(78);
  };
  useEffect(() => () => stop(), []);
  return <View className="mt-3 w-full">
    <View style={{ height: 18, overflow: 'hidden', backgroundColor: '#B9DDD8', borderRadius: 12, borderWidth: 1, borderColor: '#78BEB3' }}>
      <View style={{ position: 'absolute', left: '72%', width: '18%', height: '100%', backgroundColor: 'rgba(41,184,119,.52)', borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#128555' }} />
      <View style={{ position: 'absolute', left: `${power}%`, top: -3, width: 7, height: 22, marginLeft: -3, backgroundColor: '#F04C63', borderRadius: 4, borderWidth: 1, borderColor: '#FFFFFF' }} />
    </View>
    <View className="mt-1 flex-row justify-between"><Text className="font-semi text-label text-muted">0</Text><Text className="font-heavy text-label" style={{ color: '#128555' }}>{charging ? L('THẢ NGAY!', 'RELEASE!') : L('GIỮ NÚT ĐỂ NẠP LỰC', 'HOLD TO CHARGE')}</Text><Text className="font-semi text-label text-muted">100</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={L('Giữ để nạp lực rồi thả để quăng cần', 'Hold to charge, then release to cast')} accessibilityHint={L('Căn vạch đỏ vào vùng xanh để nhận cá hiếm và điểm cân nặng thưởng.', 'Release the red marker in the green zone for rare fish and bonus weight.')} onPressIn={begin} onPressOut={release} onPress={activate} className="mt-3 items-center rounded-[16px] px-8 py-3.5" style={{ backgroundColor: charging ? '#087D91' : '#0C9BB0', borderBottomWidth: charging ? 2 : 5, borderBottomColor: 'rgba(0,0,0,.25)', transform: [{ translateY: charging ? 3 : 0 }] }}><Text className="font-heavy text-bodyLg" style={{ color: '#FFFFFF' }}>{charging ? L('NÉM!', 'CAST!') : L('NHẤN GIỮ ĐỂ NÉM', 'HOLD TO CAST')}</Text></Pressable>
  </View>;
}

function FishSprite({ color, size }: { color: string; size: number }) {
  return <Svg width={size * 1.4} height={size * 0.9} viewBox="0 0 140 90">
    <Path d="M36 45 9 20 13 45 9 70 37 48Z" fill={color} stroke="#164454" strokeWidth={4} strokeLinejoin="round" />
    <Path d="M31 45C43 20 80 12 113 37c7 5 12 8 19 8-7 4-12 8-19 12C81 82 45 71 31 45Z" fill={color} stroke="#164454" strokeWidth={4} strokeLinejoin="round" />
    <Path d="M63 25Q71 12 86 22L78 33Z" fill="#FFFFFF" opacity={0.38} />
    <Path d="M64 65Q76 76 88 66L77 58Z" fill="#164454" opacity={0.35} />
    <Path d="M59 29Q68 45 59 61" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.72} />
    <Path d="M77 22Q87 44 77 68" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.65} />
    <Circle cx={104} cy={39} r={7} fill="#FFFFFF" />
    <Circle cx={106} cy={39} r={3.5} fill="#143446" />
    <Circle cx={107} cy={38} r={1.1} fill="#FFFFFF" />
    <Path d="M119 51q6 2 10 0" fill="none" stroke="#164454" strokeWidth={2.5} strokeLinecap="round" />
    <Ellipse cx={48} cy={43} rx={4} ry={2.5} fill="#FFFFFF" opacity={0.55} />
  </Svg>;
}

function makeOutputs(): Output[] {
  const choices: Output[] = [
    { kind: 'credits', label: 'Credits', value: 10 + Math.floor(Math.random() * 41) },
    { kind: 'credits', label: 'Credits', value: 10 + Math.floor(Math.random() * 41) },
    { kind: 'blook', label: 'Blook' },
    { kind: 'hack', label: 'HACK' },
  ];
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }
  return choices.slice(0, 3);
}

function AnswerTile({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled: boolean }) {
  const darkInk = color === '#F4C542';
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className="min-h-[66px] items-center justify-center rounded-[16px] px-4 py-4" style={{ flexGrow: 1, flexBasis: 250, backgroundColor: color, opacity: disabled ? 0.76 : 1, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,.18)' }}><Text className="text-center font-heavy text-bodyLg" style={{ color: darkInk ? '#312044' : '#FFFFFF' }}>{label}</Text></Pressable>;
}

function GameButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} className="mt-5 rounded-[16px] px-8 py-4" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: color, borderBottomWidth: pressed ? 2 : 5, borderBottomColor: 'rgba(0,0,0,.26)', transform: [{ translateY: pressed ? 3 : 0 }, { scale: pressed ? 0.985 : 1 }], boxShadow: pressed ? '0 1px 4px rgba(0,0,0,.16)' : '0 8px 16px rgba(0,0,0,.18)' } as object}><Text className="text-center font-heavy text-bodyLg" style={{ color: '#FFFFFF' }}>{label}</Text></Pressable>;
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return <View className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: 'rgba(14,117,132,.12)', borderWidth: 1, borderColor: 'rgba(14,117,132,.18)' }}><Text style={{ fontSize: 12 }}>{icon}</Text><Text className="font-heavy" style={{ color: '#176C78', fontSize: 10, letterSpacing: 0.6 }}>{label}</Text></View>;
}
