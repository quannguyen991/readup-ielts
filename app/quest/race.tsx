import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, type AnimatedStyle } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button } from '@/components/ui';
import { ARENA, glass } from '@/components/game/arena';
import { Aura, Burst, FloatText, JUICE, Pop, Rise, Shake, Stamp } from '@/components/game/juice';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildDuel, QUESTION_MS, type DuelQuestion } from '@/services/duel/duel';
import { createRace, FINISH, resolveRaceAnswer, rivalRng, RACE_LENGTH, type RaceState } from '@/services/game/race';
import { newChallengeSeed } from '@/services/duel/challenge';
import type { StudyWord } from '@/services/vocab/topic-study';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

/**
 * ĐUA XE TỪ: trả lời đúng để xe tăng tốc và bứt khỏi đối thủ; trả lời sai thì
 * trượt bánh. Luật ở `services/game/race.ts`; màn này chỉ vẽ và gọi `answer()` một lần mỗi câu.
 */

type Stage = 'pick' | 'play' | 'done';
type Result = { state: RaceState };

const CAR_RED = '#EF4444';
const CAR_BLUE = '#3B82F6';
const LANE = '#1E293B';

export default function RaceScreen() {
  const { L, en } = useL();
  const [stage, setStage] = useState<Stage>('pick');
  const [slug, setSlug] = useState(VOCAB_TOPICS[0]?.slug ?? '');
  const [seed, setSeed] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const deck = useStudyDeck(slug);
  const enough = !!deck && deck.words.length >= 4;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 820 }}>
        <Pressable onPress={() => router.replace('/quest' as never)} className="self-start rounded-pill bg-white/85 px-4 py-2">
          <Text className="font-semi text-body text-white">{L('Quest', 'Quest')}</Text>
        </Pressable>
        <Text className="mt-4 font-heavy text-pageTitle" style={{ color: ARENA.gold, textShadowColor: 'rgba(250,204,21,0.45)', textShadowRadius: 14 }}>{L('Đua Xe Từ', 'Word Racing')}</Text>

        {stage === 'pick' ? (
          <View className="mt-4 overflow-hidden" style={glass({ padding: 20 })}>
            <Text className="font-heavy text-bodyLg" style={{ color: ARENA.ink }}>{L('Chọn bộ từ', 'Pick a deck')}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {VOCAB_TOPICS.map((t) => {
                const on = slug === t.slug;
                return (
                  <Pressable key={t.slug} onPress={() => setSlug(t.slug)} accessibilityRole="radio" aria-checked={on} className="rounded-pill px-4 py-2" style={{ backgroundColor: on ? ARENA.gold : ARENA.glass }}>
                    <Text className="font-strong text-label" style={{ color: on ? '#1B1205' : ARENA.ink }}>{en ? t.name : t.nameVi}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-3 font-sans text-label text-muted">
              {L(`${RACE_LENGTH} câu, mỗi câu ${QUESTION_MS / 1000} giây. Trả lời đúng liên tiếp để tăng tốc.`, `${RACE_LENGTH} questions, ${QUESTION_MS / 1000} seconds each. Chain correct answers to boost.`)}
            </Text>
            <Button
              className="mt-5 self-start"
              label={L('Vào đường đua', 'Start race')}
              iconRight="arrow-right"
              disabled={!enough}
              onPress={() => {
                setSeed(newChallengeSeed());
                setResult(null);
                setStage('play');
              }}
            />
            {!enough && deck ? <Text className="mt-2 font-sans text-label" style={{ color: '#B42318' }}>{L('Bộ này chưa đủ 4 từ.', 'This deck has fewer than 4 words.')}</Text> : null}
          </View>
        ) : null}

        {stage === 'play' && deck ? (
          <Run
            key={seed}
            words={deck.words}
            seed={seed}
            onDone={(r) => {
              setResult(r);
              setStage('done');
            }}
          />
        ) : null}

        {stage === 'done' && result ? <Finish state={result.state} onAgain={() => setStage('pick')} /> : null}
      </View>
    </Screen>
  );
}

function Run({ words, seed, onDone }: { words: readonly StudyWord[]; seed: string; onDone: (r: Result) => void }) {
  const { L } = useL();
  const questions = useMemo<DuelQuestion[]>(() => buildDuel(words, seed, RACE_LENGTH), [words, seed]);
  const rng = useRef(rivalRng(seed));
  const [race, setRace] = useState<RaceState>(() => createRace(questions.length));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [clock, setClock] = useState(() => Date.now());
  const [last, setLast] = useState<{ id: number; ok: boolean; delta: number } | null>(null);
  const finished = useRef(false);
  const q = questions[index];

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const submit = (i: number | null) => {
    if (!q || picked !== null || race.status !== 'racing') return;
    const ms = Math.max(0, Date.now() - shownAt);
    const ok = i !== null && i === q.correctIndex;
    setPicked(i ?? -1);
    useGameStore.getState().answer(ok, 'vocab', { key: `race:${seed}:${index}` });
    const step = resolveRaceAnswer(race, ok, ms, rng.current);
    setRace(step.state);
    setLast({ id: Date.now(), ok, delta: step.delta });
    setTimeout(() => {
      setIndex((n) => n + 1);
      setPicked(null);
      setShownAt(Date.now());
    }, 900);
  };

  const submitRef = useRef(submit);
  useLayoutEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (!q || picked !== null || race.status !== 'racing') return;
    const t = setTimeout(() => submitRef.current(null), Math.max(0, shownAt + QUESTION_MS - Date.now()));
    return () => clearTimeout(t);
  }, [q, picked, shownAt, race.status]);

  const over = race.status !== 'racing';
  useEffect(() => {
    if (!over || finished.current) return;
    finished.current = true;
    const t = setTimeout(() => onDone({ state: race }), 1200);
    return () => clearTimeout(t);
  }, [over, onDone, race]);

  if (!q && !over) return null;
  const left = Math.max(0, Math.ceil((shownAt + QUESTION_MS - clock) / 1000));
  const pct = Math.max(0, Math.min(1, (shownAt + QUESTION_MS - clock) / QUESTION_MS));

  return (
    <View className="mt-4 gap-4">
      <Track me={race.me} rival={race.rival} last={last} status={race.status} />

      <View className="flex-row items-center justify-between rounded-2xl px-4 py-3" style={glass({ padding: 0, paddingHorizontal: 16, paddingVertical: 12 })}>
        <Text className="font-strong text-label" style={{ color: '#6B7280' }}>{L('Câu', 'Question')} {Math.min(race.q + 1, race.total)}/{race.total}</Text>
        <Text className="font-heavy text-body" style={{ color: race.combo >= 2 ? '#F97316' : '#0F1D33' }}>
          {race.combo >= 2 ? `🔥 ×${race.combo}` : L('Combo 0', 'Combo 0')}
        </Text>
        <Pop key={`t-${left}`} from={left <= 3 ? 1.5 : 1.1}>
          <Text className="font-heavy" style={{ fontSize: 24, color: left <= 3 ? '#E21B3C' : '#0F1D33' }}>{left}s</Text>
        </Pop>
      </View>
      <View className="h-2.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#E5E7EB' }}>
        <View className="h-2.5 rounded-pill" style={{ width: `${pct * 100}%`, backgroundColor: left <= 3 ? '#E21B3C' : '#F59E0B' }} />
      </View>

      {q && !over ? (
        <Shake trigger={last && !last.ok ? last.id : 0}>
          <View className="overflow-hidden" style={glass({ padding: 20 })}>
            <View className="items-center">
              {last && last.ok ? <FloatText key={`f-${last.id}`} text={`+${last.delta}`} color="#15945A" size={30} style={{ top: -4 }} /> : null}
              <Rise key={`p-${index}`}>
                <Text className="text-center font-heavy text-white" style={{ fontSize: 38 }}>{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
              </Rise>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-3">
              {q.options.map((opt, i) => {
                const reveal = picked !== null;
                const ok = reveal && i === q.correctIndex;
                const bad = reveal && i === picked && i !== q.correctIndex;
                const c = TILE_COLORS[i] ?? TILE_COLORS[0]!;
                return (
                  <Pressable
                    key={`${i}-${opt}`}
                    disabled={reveal}
                    onPress={() => submit(i)}
                    className="min-w-[200px] flex-1 flex-row items-center gap-3 rounded-2xl px-4 py-4"
                    style={{
                      backgroundColor: ok ? c : bad ? '#7F1D1D' : ARENA.glass,
                      opacity: reveal && !ok && !bad ? 0.5 : 1,
                      boxShadow: ok ? `0 0 26px ${c}` : undefined,
                    } as object}
                  >
                    <Text className="font-heavy" style={{ color: ARENA.ink, fontSize: 18 }}>{['●', '◆', '▲', '■'][i]}</Text>
                    <Text className="flex-1 font-heavy" style={{ color: ARENA.ink, fontSize: 18 }}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Shake>
      ) : null}
    </View>
  );
}

const TILE_COLORS = [JUICE.good, '#3B82F6', '#F59E0B', '#EC4899'] as const;

/**
 * Đường đua: làn tối có vạch đứt, vạch đích kẻ ô, hai xe. Xe chạy bằng lò xo;
 * xe bạn tăng tốc có vệt lửa và nổ khi đúng, trượt bánh có khói khi sai.
 */
function Track({ me, rival, last, status }: { me: number; rival: number; last: { id: number; ok: boolean; delta: number } | null; status: RaceState['status'] }) {
  const { L } = useL();
  return (
    <View className="overflow-hidden rounded-[22px] p-4" style={{ ...gradient('#0F172A', '#1E3A8A'), boxShadow: '0 16px 36px rgba(15,23,42,0.35)' } as ViewStyle}>
      <Aura color="#60A5FA" size={260} strength={0.25} />
      <SpeedLines active={status === 'racing'} />
      <Lane label={L('Bạn', 'You')} pos={me} color={CAR_RED} last={last} lane={0} />
      <View style={{ height: 14 }} />
      <Lane label={L('Đối thủ', 'Rival')} pos={rival} color={CAR_BLUE} last={null} lane={1} />
      {status !== 'racing' ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Stamp color={me >= rival ? '#FACC15' : '#F87171'}>
            <Text className="font-heavy" style={{ color: me >= rival ? '#FACC15' : '#F87171', fontSize: 22 }}>{me >= rival ? L('VỀ NHẤT!', 'FIRST!') : L('VỀ NHÌ', 'SECOND')}</Text>
          </Stamp>
        </View>
      ) : null}
    </View>
  );
}

function gradient(a: string, b: string): ViewStyle {
  return { backgroundColor: a, backgroundImage: `linear-gradient(135deg, ${a}, ${b})` } as ViewStyle;
}

function Lane({ label, pos, color, last, lane }: { label: string; pos: number; color: string; last: { id: number; ok: boolean; delta: number } | null; lane: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(Math.min(FINISH, pos) / FINISH, { damping: 14, stiffness: 120 });
  }, [pos, p]);
  // Xe chạy trên 88% chiều dài làn; 12% cuối dành cho vạch đích.
  const st = useAnimatedStyle(() => ({ left: `${p.value * 88}%` }));
  return (
    <View style={{ height: 64, borderRadius: 16, backgroundColor: LANE, overflow: 'hidden', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '12%', flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={{ width: '50%', height: '16.66%', backgroundColor: (i + lane) % 2 === 0 ? '#F8FAFC' : '#0F172A' }} />
        ))}
      </View>
      <View style={{ position: 'absolute', left: 12, right: '14%', top: '50%', height: 2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <Animated.View style={[{ position: 'absolute', top: 14, width: 84, height: 36 } as ViewStyle, st as AnimatedStyle<ViewStyle>]}>
        <Car color={color} />
        {last && lane === 0 ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 42, top: 6 }}>
            <Burst key={`${last.id}`} seed={`car-${last.id}`} colors={last.ok ? [JUICE.gold, '#FFFFFF', '#FB923C'] : ['#9CA3AF', '#E5E7EB']} count={last.ok ? 16 : 10} radius={last.ok ? 60 : 36} size={8} />
          </View>
        ) : null}
        {last && lane === 0 ? <FloatText key={`lf-${last.id}`} text={last.ok ? `+${last.delta}` : `${last.delta}`} color={last.ok ? '#FACC15' : '#F87171'} size={20} style={{ top: -18, left: 30 }} /> : null}
      </Animated.View>
      <Text style={{ position: 'absolute', left: 10, top: 4, fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)' }}>{label}</Text>
    </View>
  );
}

function Car({ color }: { color: string }) {
  return (
    <View style={{ width: 84, height: 36 }}>
      <View style={{ position: 'absolute', left: 2, top: 10, width: 74, height: 16, borderRadius: 8, backgroundColor: color, boxShadow: `0 0 16px ${color}` } as ViewStyle} />
      <View style={{ position: 'absolute', left: 26, top: 2, width: 32, height: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: 'rgba(255,255,255,0.85)' }} />
      <View style={{ position: 'absolute', left: 14, top: 22, width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827', borderWidth: 2, borderColor: '#E5E7EB' }} />
      <View style={{ position: 'absolute', left: 52, top: 22, width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827', borderWidth: 2, borderColor: '#E5E7EB' }} />
    </View>
  );
}

/** Vạch tốc độ chạy lướt qua nền đường đua, tạo cảm giác đang phóng. */
function SpeedLines({ active }: { active: boolean }) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    x.value = withRepeat(withTiming(-120, { duration: 700, easing: Easing.linear }), -1, false);
  }, [active, x]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: active ? 0.35 : 0 } as ViewStyle, st as AnimatedStyle<ViewStyle>]}>
      {Array.from({ length: 10 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: `${(i * 13) % 100}%`, top: `${(i * 37) % 100}%`, width: 46, height: 2, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
      ))}
    </Animated.View>
  );
}

function Finish({ state, onAgain }: { state: RaceState; onAgain: () => void }) {
  const { L } = useL();
  const won = state.status === 'won';
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
  }, [pulse]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <View className="mt-4 items-center gap-4 overflow-hidden" style={glass({ padding: 24 })}>
      {won ? <Confetti seed={`race-${state.score}-${state.me}`} pieces={140} /> : null}
      <Aura color={won ? '#FACC15' : '#FCA5A5'} size={240} strength={0.3} />
      <Pop from={0.3}>
        <Stamp color={won ? '#15945A' : '#B42318'}>
          <Text className="font-heavy" style={{ color: won ? '#15945A' : '#B42318', fontSize: 34 }}>{won ? L('VỀ NHẤT! 🏁', 'FIRST PLACE! 🏁') : L('VỀ NHÌ', 'SECOND PLACE')}</Text>
        </Stamp>
      </Pop>
      <Animated.View style={st as AnimatedStyle<ViewStyle>}>
        <Text className="font-heavy" style={{ fontSize: 56, color: ARENA.gold }}>{state.score}</Text>
      </Animated.View>
      <Text className="font-sans text-body" style={{ color: ARENA.muted }}>
        {L(`Đúng ${state.correct}/${state.total} · combo cao nhất ×${state.bestCombo}`, `${state.correct}/${state.total} correct · best combo ×${state.bestCombo}`)}
      </Text>
      <Button label={L('Đua lại', 'Race again')} iconLeft="refresh" onPress={onAgain} />
    </View>
  );
}

