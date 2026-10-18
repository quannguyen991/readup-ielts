import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming, type AnimatedStyle } from 'react-native-reanimated';

import { Aura, Burst, Flash, FloatText, JUICE, Pop, Rise, Shake, Starfield, Stamp, Veil, glowWeb } from '@/components/game/juice';
import { BackPill, HUB, WEB } from '@/components/game/quest-hub/kit';
import { ARENA, ArenaPanel as Panel, glass } from '@/components/game/arena';
import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { buildDuel, type DuelQuestion } from '@/services/duel/duel';
import {
  answerGold,
  BOARD_LEN,
  COMBO_DICE_AT,
  createGoldQuest,
  GOAL,
  type GoldEvent,
  type GoldQuest,
  type GoldReason,
  type TileKind,
  TURNS,
} from '@/services/game/goldquest';
import { useGameStore } from '@/store/useGameStore';

/**
 * ĐƯỜNG VÀNG: game solo kiểu cờ Blooket. Luật nằm ở `services/game/goldquest.ts`;
 * màn này chỉ vẽ, nhận thao tác, và chạy nhịp.
 *
 * Nhịp một lượt: chọn đáp án → (đúng) xúc xắc quay rồi dừng → quân đi từng ô một,
 * mỗi ô một cú nhảy → tới ô đến thì nổ, bay số vàng → sang câu mới. Các bước được
 * đặt bằng `later()` (setTimeout đã gom lại, xoá hết khi thoát màn).
 *
 * Mỗi câu gọi `useGameStore.answer` đúng một lần, với nguồn 'vocab' và khoá
 * `gold:<seed>:<lượt>`. Câu hỏi lấy từ bộ từ bằng `buildDuel`.
 */

const STEP_MS = 240;
const DICE_MS = 700;
const HOLD_MS = 900;
const GOLD_TXT = '#FDE68A';
const MUTED_ON_DARK = '#CBD5E1';

/** Giao diện từng loại ô. `label` là số vàng hiện trên ô. */
const TILE_LOOK: Record<TileKind, { top: string; bottom: string; border: string; emoji: string; label: string; ink: string; burst: string[] }> = {
  plain: { top: '#FFF8EA', bottom: '#EBCB92', border: '#A97F4A', emoji: '', label: '+5', ink: '#6B4A1E', burst: ['#86EFAC', '#FFFFFF'] },
  gold: { top: '#FFF6B0', bottom: '#F5B700', border: '#8A5A00', emoji: '🪙', label: '+10', ink: '#5C3A00', burst: ['#FFE14D', '#FFFFFF', '#F59E0B'] },
  chest: { top: '#FFD39A', bottom: '#F97316', border: '#9A3412', emoji: '🎁', label: '+25', ink: '#7C2D12', burst: ['#FDBA74', '#FFFFFF', '#F97316'] },
  star: { top: '#EDE9FE', bottom: '#8B5CF6', border: '#4C1D95', emoji: '⭐', label: '×2', ink: '#3B0764', burst: ['#C4B5FD', '#FFFFFF'] },
  trap: { top: '#64748B', bottom: '#1E293B', border: '#020617', emoji: '💣', label: '−8', ink: '#FCA5A5', burst: ['#94A3B8', '#334155'] },
};

const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
  ...(glowWeb('0 4px 0 rgba(0,0,0,0.25), 0 8px 14px rgba(0,0,0,0.35)') as object),
} as object;

/* ---------------------------------------------------------------- hình học */

type Geom = { B: number; t: number; R: number; piece: number };
type Pt = { x: number; y: number };

/** Bàn tròn vuông B × B. Ô có cạnh t, tâm nằm trên vòng bán kính R. */
function makeGeom(width: number): Geom {
  const B = Math.max(248, Math.min(340, Math.floor(width)));
  const t = Math.round(B * 0.118);
  const R = B / 2 - t / 2 - 6;
  return { B, t, R, piece: Math.round(t * 0.68) };
}

/** Tâm ô thứ `i` (ô 0 ở đỉnh trên, đi theo chiều kim đồng hồ). */
function ringXY(g: Geom, i: number): Pt {
  const a = -Math.PI / 2 + (i / BOARD_LEN) * Math.PI * 2;
  return { x: g.B / 2 + g.R * Math.cos(a), y: g.B / 2 + g.R * Math.sin(a) };
}

/* ---------------------------------------------------------------- hiệu ứng */

/** `at` là chỉ số ô; -1 là giữa bàn. */
type FxBody =
  | { kind: 'burst'; at: number; colors: string[]; count: number; radius: number; size: number; duration: number }
  | { kind: 'text'; at: number; text: string; color: string; size: number };
type Fx = FxBody & { id: number; born: number; life: number };

let fxSeq = 0;
function fxOf(body: FxBody): Fx {
  fxSeq += 1;
  const life = body.kind === 'burst' ? 900 : 1200;
  return { ...body, id: fxSeq, born: Date.now(), life };
}

/** Chữ bay lên. Giảm chuyển động thì hiện đứng yên (bản bay của juice ẩn chữ khi tắt chuyển động). */
function FloatTag({ text, color, size }: { text: string; color: string; size: number }) {
  const reduced = useReducedMotion();
  if (!reduced) return <FloatText text={text} color={color} size={size} />;
  return (
    <Text style={{ position: 'absolute', top: 0, alignSelf: 'center', fontSize: size, fontWeight: '900', color, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 }}>
      {text}
    </Text>
  );
}

/**
 * Quân cờ nhảy tới toạ độ mới: trượt tuyến tính trong `duration` và nhô lên một chút ở giữa
 * đường đi. Mỗi bước là một lần đổi `x`/`y`, nên mỗi ô là một cú nhảy riêng.
 */
function Hop({ x, y, duration, children }: { x: number; y: number; duration: number; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  const lift = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      tx.value = x;
      ty.value = y;
      lift.value = 0;
      return;
    }
    tx.value = withTiming(x, { duration, easing: Easing.linear });
    ty.value = withTiming(y, { duration, easing: Easing.linear });
    lift.value = withSequence(
      withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: duration / 2, easing: Easing.in(Easing.quad) }),
    );
  }, [x, y, duration, reduced, tx, ty, lift]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value - 12 * lift.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st as AnimatedStyle<object>]}>
      {children}
    </Animated.View>
  );
}

/** Xúc xắc: khi đang quay thì số đổi liên tục; dừng lại thì nảy (Pop) lên số kết quả. */
function Dice({ value, rolling, bonus, keyId, size }: { value: number; rolling: boolean; bonus: number; keyId: number; size: number }) {
  const reduced = useReducedMotion();
  const [face, setFace] = useState(value || 1);
  useEffect(() => {
    if (!rolling || reduced) return;
    const id = setInterval(() => setFace(1 + Math.floor(Math.random() * 3)), 70);
    return () => clearInterval(id);
  }, [rolling, reduced]);
  useEffect(() => {
    if (!rolling && value) setFace(value);
  }, [rolling, value]);
  const shown = rolling ? face : value > 0 ? value : '–';
  return (
    <View style={{ alignItems: 'center' }}>
      <Pop key={`${keyId}-${rolling ? 'r' : 'd'}`} from={0.5}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.24,
            borderWidth: 3,
            borderColor: '#F59E0B',
            backgroundColor: '#101A30',
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW,
          }}
        >
          <Text style={{ fontSize: size * 0.5, fontWeight: '900', color: ARENA.ink }}>{shown}</Text>
        </View>
      </Pop>
      <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '800', color: GOLD_TXT }}>{!rolling && bonus > 0 ? `+${bonus} xúc xắc` : ' '}</Text>
    </View>
  );
}

/** Quân cờ: nhảy theo từng ô, có vòng sáng nếu là quân của bạn. */
function Piece({ at, g, emoji, offset, halo }: { at: number; g: Geom; emoji: string; offset: number; halo: boolean }) {
  const p = ringXY(g, at % BOARD_LEN);
  const size = g.piece;
  return (
    <Hop x={p.x - size / 2 + offset} y={p.y - size / 2} duration={STEP_MS}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {halo ? <Aura color={JUICE.gold} size={g.t * 1.25} strength={0.7} /> : null}
        <Pop key={`s${at}`} from={0.55}>
          <Text style={{ fontSize: size * 0.8 }}>{emoji}</Text>
        </Pop>
      </View>
    </Hop>
  );
}

/* ---------------------------------------------------------------- màn hình */

export default function GoldQuestScreen() {
  const { L } = useL();
  const params = useLocalSearchParams<{ deck?: string }>();
  const [slug, setSlug] = useState(() => (Array.isArray(params.deck) ? params.deck[0] : params.deck) || VOCAB_TOPICS[0]!.slug);
  const [rival, setRival] = useState(true);
  const deck = useStudyDeck(slug);
  const words = useMemo(() => deck?.words ?? [], [deck]);
  const playable = words.length >= 4;

  const { width: winW } = useWindowDimensions();
  const geom = useMemo(() => makeGeom(Math.min(340, winW - 64)), [winW]);

  const [started, setStarted] = useState(false);
  const [seed, setSeed] = useState('');
  const [view, setView] = useState<GoldQuest>(() => createGoldQuest({ seed: 'gq:init' }));
  const gameRef = useRef(view);
  /** Quân đang HIỆN trên bàn (đi từng ô); khác với vị trí thật khi đang đi. */
  const [shownYou, setShownYou] = useState(0);
  const [shownBot, setShownBot] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [dice, setDice] = useState({ value: 0, bonus: 0, rolling: false, key: 0 });
  const [fx, setFx] = useState<Fx[]>([]);
  /** Đếm số lần cần rung/nháy: sai câu hoặc dính bẫy. */
  const [hit, setHit] = useState(0);
  const [showEnd, setShowEnd] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const questions = useMemo<DuelQuestion[]>(() => (playable && seed ? buildDuel(words, seed, TURNS) : []), [playable, words, seed]);
  const q = questions[view.turn];

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const pushFx = (bodies: FxBody[]) => {
    if (bodies.length === 0) return;
    const now = Date.now();
    const items = bodies.map(fxOf);
    setFx((prev) => [...prev.filter((f) => now - f.born < f.life), ...items].slice(-40));
  };

  const start = () => {
    clearTimers();
    const sd = `gq:${slug}:${Date.now().toString(36)}`;
    const g = createGoldQuest({ seed: sd, turns: Math.min(TURNS, words.length), rival });
    gameRef.current = g;
    busyRef.current = false;
    setSeed(sd);
    setView(g);
    setShownYou(0);
    setShownBot(0);
    setBusy(false);
    setPicked(null);
    setNotice('');
    setDice({ value: 0, bonus: 0, rolling: false, key: 0 });
    setFx([]);
    setHit(0);
    setShowEnd(false);
    setStarted(true);
  };

  const finishTurn = () => {
    busyRef.current = false;
    setBusy(false);
    setPicked(null);
    setNotice('');
  };

  const answerQuestion = (choice: number) => {
    const cur = gameRef.current;
    if (!q || picked !== null || busyRef.current || cur.status !== 'playing') return;
    const correct = choice === q.correctIndex;
    busyRef.current = true;
    setBusy(true);
    setPicked(choice);
    useGameStore.getState().answer(correct, 'vocab', { key: `gold:${seed}:${cur.turn}` });

    const r = answerGold(cur, correct);
    gameRef.current = r.game;
    setView(r.game);
    const landEv = r.events.find((e): e is Extract<GoldEvent, { kind: 'land' }> => e.kind === 'land');
    const rollEv = r.events.find((e): e is Extract<GoldEvent, { kind: 'roll' }> => e.kind === 'roll');
    const steps = r.game.you.pos - cur.you.pos;
    const botFrom = cur.bot?.pos ?? 0;
    const botSteps = (r.game.bot?.pos ?? botFrom) - botFrom;
    const botGain = r.game.bot && cur.bot ? r.game.bot.gold - cur.bot.gold : 0;

    if (correct) {
      setNotice(
        landEv
          ? L(`Đúng! Đi ${steps} ô, ${landEv.gain >= 0 ? '+' : ''}${landEv.gain} vàng.`, `Correct! Moved ${steps}, ${landEv.gain >= 0 ? '+' : ''}${landEv.gain} gold.`)
          : L('Đúng!', 'Correct!'),
      );
    } else {
      setHit((h) => h + 1);
      setNotice(L(`Đáp án là "${q.options[q.correctIndex]}". Quân đứng yên, mất 1 combo.`, `The answer is "${q.options[q.correctIndex]}". Your piece stays, -1 streak.`));
    }

    const walkStart = rollEv ? DICE_MS : 260;
    if (rollEv) {
      setDice((d) => ({ value: rollEv.value, bonus: rollEv.bonus, rolling: true, key: d.key + 1 }));
      later(DICE_MS, () => setDice((d) => ({ ...d, rolling: false })));
    }
    for (let k = 1; k <= steps; k += 1) later(walkStart + k * STEP_MS, () => setShownYou(cur.you.pos + k));
    for (let k = 1; k <= botSteps; k += 1) later(walkStart + k * STEP_MS, () => setShownBot(botFrom + k));

    const arriveAt = walkStart + Math.max(steps, botSteps, 1) * STEP_MS;
    later(arriveAt, () => {
      const at = r.game.you.pos % BOARD_LEN;
      const fxs: FxBody[] = [];
      if (landEv) {
        const pal = TILE_LOOK[landEv.tile];
        if (landEv.tile !== 'plain' || landEv.gain > 0) {
          fxs.push({ kind: 'burst', at, colors: pal.burst, count: landEv.tile === 'trap' ? 8 : 16, radius: 56, size: 7, duration: 700 });
        }
        if (landEv.tile === 'trap') {
          setHit((h) => h + 1);
          fxs.push({ kind: 'text', at, text: `−${Math.abs(landEv.gain)}`, color: '#FF6B6B', size: 22 });
        } else {
          fxs.push({ kind: 'text', at, text: `+${landEv.gain}${landEv.boosted ? ' ×2' : ''}`, color: JUICE.gold, size: 22 });
        }
        if (landEv.combo >= COMBO_DICE_AT) {
          fxs.push({ kind: 'text', at: -1, text: `COMBO x${landEv.combo}`, color: JUICE.gold, size: 20 });
        }
      } else {
        fxs.push({ kind: 'text', at, text: L('Đứng yên', 'Stayed'), color: '#FCA5A5', size: 16 });
      }
      if (r.game.bot && botSteps > 0) {
        fxs.push({
          kind: 'text',
          at: r.game.bot.pos % BOARD_LEN,
          text: `🤖 ${botGain >= 0 ? '+' : '−'}${Math.abs(botGain)}`,
          color: '#BAE6FD',
          size: 13,
        });
      }
      pushFx(fxs);
      if (r.game.status !== 'playing') later(600, () => setShowEnd(true));
      else later(HOLD_MS, finishTurn);
    });
  };

  const back = () => {
    clearTimers();
    router.replace('/quest' as never);
  };
  const otherDeck = () => {
    clearTimers();
    busyRef.current = false;
    setBusy(false);
    setShowEnd(false);
    setStarted(false);
  };

  const liveFx = fx.filter((f) => Date.now() - f.born < f.life);
  const pct = Math.min(100, (view.you.gold / GOAL) * 100);
  const distance = Math.min(BOARD_LEN, view.you.pos);
  const roundNo = Math.min(view.turn + 1, view.turns);

  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 920, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <BackPill label="Band 9 Quest" onPress={back} />
          {started ? (
            <Text className="font-semi text-label" style={{ color: ARENA.muted }}>
              {deck?.nameVi ?? slug}
            </Text>
          ) : null}
        </View>

        <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -70, width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
            <Aura color={JUICE.gold} size={150} strength={0.1} />
          </View>
          <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: ARENA.gold, textShadowColor: 'rgba(250,204,21,0.4)', textShadowRadius: 12 }}>
            {L('Đường Vàng', 'Gold Quest')}
          </Text>
          <Text className="mt-1 font-sans text-body" style={{ color: ARENA.muted }}>
            {L(
              'Trả lời đúng để tung xúc xắc và đi tới. Ô vàng, rương, sao cho vàng; ô bẫy trừ vàng. Đi đủ 20 ô hoặc đạt 120 vàng sau 15 lượt là thắng.',
              'Answer correctly to roll and move. Gold, chest and star tiles pay out; traps take gold. Lap the 20 tiles or reach 120 gold in 15 turns to win.',
            )}
          </Text>
        </Panel>

        {!started ? (
          <MenuCard
            slug={slug}
            onPick={setSlug}
            playable={playable}
            words={words.length}
            rival={rival}
            onRival={() => setRival((r) => !r)}
            onStart={start}
          />
        ) : (
          <View style={{ marginTop: 14, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: '#2D4A78', ...(glowWeb('0 18px 40px rgba(15,29,51,0.35)') as object) }}>
            <LinearGradient
              colors={['#2B1B5C', '#14284B', '#0B2A3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
            />
            <Starfield seed="gold-road" count={34} />
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Pop key={`g${view.you.gold}`} from={0.7}>
                  <Text className="font-heavy" style={{ fontSize: 22, color: GOLD_TXT }}>🪙 {view.you.gold}</Text>
                </Pop>
                <Text className="font-semi text-label" style={{ color: MUTED_ON_DARK }}>
                  {L('Lượt', 'Turn')} {roundNo}/{view.turns}
                </Text>
                <Pop key={`c${view.combo}`} from={0.6}>
                  <Text className="font-semi text-label" style={{ color: '#FDBA74' }}>
                    {L('Combo', 'Streak')} {view.combo} 🔥
                  </Text>
                </Pop>
                {view.bot ? (
                  <Text className="font-semi text-label" style={{ color: '#BAE6FD' }}>
                    🤖 {view.bot.gold}
                  </Text>
                ) : null}
              </View>

              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text className="font-semi" style={{ fontSize: 12, color: MUTED_ON_DARK }}>{L(`Mục tiêu ${GOAL} vàng`, `Goal ${GOAL} gold`)}</Text>
                  <Text className="font-semi" style={{ fontSize: 12, color: MUTED_ON_DARK }}>{L(`Đã đi ${distance}/${BOARD_LEN} ô`, `Moved ${distance}/${BOARD_LEN}`)}</Text>
                </View>
                <View style={{ marginTop: 5, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: JUICE.gold }} />
                </View>
              </View>

              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <Board
                  view={view}
                  geom={geom}
                  shownYou={shownYou}
                  shownBot={shownBot}
                  dice={dice}
                  fx={liveFx}
                  hit={hit}
                />
              </View>

              <View style={{ marginTop: 10, minHeight: 40, justifyContent: 'center' }}>
                <Text className="text-center font-sans text-body" style={{ color: '#E2E8F0' }}>
                  {notice || (busy ? L('Quân đang đi…', 'Moving…') : L('Chọn một đáp án.', 'Pick an answer.'))}
                </Text>
              </View>

              {q && view.status === 'playing' ? (
                <QuestionCard
                  q={q}
                  index={view.turn}
                  total={view.turns}
                  picked={picked}
                  wrongKey={hit}
                  onAnswer={answerQuestion}
                />
              ) : null}
            </View>
          </View>
        )}

        {started && showEnd && view.status !== 'playing' ? (
          <ResultOverlay game={view} rival={rival} onAgain={start} onOtherDeck={otherDeck} onBack={back} />
        ) : null}
      </View>
    </Screen>
  );
}

function MenuCard({
  slug,
  onPick,
  playable,
  words,
  rival,
  onRival,
  onStart,
}: {
  slug: string;
  onPick: (s: string) => void;
  playable: boolean;
  words: number;
  rival: boolean;
  onRival: () => void;
  onStart: () => void;
}) {
  const { L, en } = useL();
  return (
    <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
      <Text className="font-heavy text-sectionTitle" style={{ color: ARENA.ink }}>{L('Chọn bộ từ', 'Choose a word deck')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {VOCAB_TOPICS.map((t) => {
          const on = t.slug === slug;
          return (
            <Pressable
              key={t.slug}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onPick(t.slug)}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1.5,
                borderColor: on ? ARENA.goldSoft : ARENA.line,
                backgroundColor: on ? ARENA.gold : pressed || hovered ? ARENA.glassStrong : ARENA.glass,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                ...(WEB ? (({ transition: 'transform 120ms ease, background-color 150ms ease' }) as object) : {}),
              })}
            >
              <Text className="font-semi text-label" style={{ color: on ? '#1B1205' : ARENA.ink }}>{en ? t.name : t.nameVi}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: rival }}
        onPress={onRival}
        style={({ pressed }: { pressed: boolean }) => ({
          marginTop: 12,
          alignSelf: 'flex-start',
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 7,
          backgroundColor: rival ? '#DBEAFE' : pressed ? '#E9DCC6' : ARENA.glass,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Text className="font-semi text-label" style={{ color: ARENA.ink }}>
          {rival ? L('🤖 Có bot đối thủ', '🤖 Rival bot on') : L('Không có bot đối thủ', 'No rival bot')}
        </Text>
      </Pressable>

      <Text className="mt-3 font-sans text-label" style={{ color: ARENA.muted }}>
        {playable
          ? L(`Bộ này có ${words} từ. Mỗi lượt một câu từ bộ này.`, `This deck has ${words} words. Each turn is one question from it.`)
          : L('Bộ này cần ít nhất 4 từ để chơi.', 'This deck needs at least 4 words to play.')}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <Button label={L('Bắt đầu', 'Start')} iconLeft="play" onPress={onStart} disabled={!playable} />
      </View>
    </Panel>
  );
}

function Board({
  view,
  geom,
  shownYou,
  shownBot,
  dice,
  fx,
  hit,
}: {
  view: GoldQuest;
  geom: Geom;
  shownYou: number;
  shownBot: number;
  dice: { value: number; bonus: number; rolling: boolean; key: number };
  fx: Fx[];
  hit: number;
}) {
  const { L } = useL();
  const g = geom;
  const { B, t, R } = g;
  const loc = (at: number): Pt => (at < 0 ? { x: B / 2, y: B / 2 } : ringXY(g, at));

  const tiles = Array.from({ length: BOARD_LEN }, (_, i) => {
    const kind = view.board[i]!;
    const look = TILE_LOOK[kind];
    const p = ringXY(g, i);
    return (
      <View
        key={`t${i}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: p.x - t / 2,
          top: p.y - t / 2,
          width: t,
          height: t,
          borderRadius: t * 0.3,
          borderWidth: 2,
          borderBottomWidth: 4,
          borderColor: look.border,
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOW,
        }}
      >
        <LinearGradient
          colors={[look.top, look.bottom]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: t * 0.3 }}
        />
        {look.emoji ? <Text style={{ fontSize: t * 0.34 }}>{look.emoji}</Text> : null}
        <Text style={{ fontSize: Math.max(9, t * 0.25), fontWeight: '900', color: look.ink }}>{look.label}</Text>
        {i === 0 ? (
          <View style={{ position: 'absolute', top: -7, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6, backgroundColor: '#16A34A' }}>
            <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFFFFF' }}>{L('Vào', 'Start')}</Text>
          </View>
        ) : null}
      </View>
    );
  });

  const half = view.bot ? t * 0.18 : 0;
  return (
    <Shake trigger={hit} amount={7}>
      <View style={{ width: B, height: B }}>
        {/* Đĩa bàn: tròn, tối, viền sáng nhạt. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: B,
            height: B,
            borderRadius: B / 2,
            backgroundColor: 'rgba(15,29,51,0.5)',
            borderWidth: 1,
            borderColor: 'rgba(147,197,253,0.25)',
          }}
        />
        <View pointerEvents="none" style={{ position: 'absolute', left: B / 2 - R, top: B / 2 - R, width: 2 * R, height: 2 * R, borderRadius: R, borderWidth: 2, borderColor: 'rgba(253,230,138,0.22)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: B, height: B, alignItems: 'center', justifyContent: 'center' }}>
          <Aura color="#3B82F6" size={B * 0.7} strength={0.35} />
        </View>

        {tiles}

        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: B, height: B, alignItems: 'center', justifyContent: 'center' }}>
          <Dice value={dice.value} rolling={dice.rolling} bonus={dice.bonus} keyId={dice.key} size={Math.round(t * 1.45)} />
        </View>

        <Piece at={shownYou} g={g} emoji="🏃" offset={-half} halo />
        {view.bot ? <Piece at={shownBot} g={g} emoji="🤖" offset={half} halo={false} /> : null}

        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: B, height: B, overflow: 'hidden' }}>
          {fx.map((f) => {
            if (f.kind === 'burst') {
              const p = loc(f.at);
              return (
                <View key={f.id} pointerEvents="none" style={{ position: 'absolute', left: p.x, top: p.y, width: 0, height: 0 }}>
                  <Burst seed={String(f.id)} colors={f.colors} count={f.count} radius={f.radius} size={f.size} duration={f.duration} />
                </View>
              );
            }
            if (f.kind === 'text') {
              const p = loc(f.at);
              return (
                <View key={f.id} pointerEvents="none" style={{ position: 'absolute', left: p.x, top: p.y - t * 0.2, width: 0, height: 0, alignItems: 'center' }}>
                  <FloatTag text={f.text} color={f.color} size={f.size} />
                </View>
              );
            }
            return null;
          })}
        </View>
        <Flash trigger={hit} edge color="#F87171" width={6} radius={22} duration={560} />
      </View>
    </Shake>
  );
}

function QuestionCard({
  q,
  index,
  total,
  picked,
  wrongKey,
  onAnswer,
}: {
  q: DuelQuestion;
  index: number;
  total: number;
  picked: number | null;
  wrongKey: number;
  onAnswer: (i: number) => void;
}) {
  const { L } = useL();
  return (
    <Shake trigger={wrongKey} amount={8}>
      <View className="mt-4" style={glass({ padding: 20 })}>
        <Text className="font-semi text-label uppercase tracking-[1px]" style={{ color: ARENA.muted }}>
          {L('Lượt', 'Turn')} {index + 1}/{total} · {q.enToVi ? L('chọn nghĩa đúng', 'choose the meaning') : L('chọn từ đúng', 'choose the word')}
        </Text>
        <Text className="mt-3 font-heavy text-pageTitle text-white">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
        {q.enToVi && q.word.example ? <Text className="mt-2 font-sans text-body" style={{ color: ARENA.muted }}>{q.word.example}</Text> : null}
        <View className="mt-4 gap-2.5">
          {q.options.map((opt, i) => (
            <Option
              key={`${i}-${opt}`}
              label={opt}
              selected={picked === i}
              correct={picked !== null && i === q.correctIndex}
              wrong={picked === i && i !== q.correctIndex}
              disabled={picked !== null}
              onPress={() => onAnswer(i)}
            />
          ))}
        </View>
      </View>
    </Shake>
  );
}

function Option({ label, onPress, disabled, selected, correct, wrong }: { label: string; onPress: () => void; disabled?: boolean; selected?: boolean; correct?: boolean; wrong?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: correct ? '#16A34A' : wrong ? '#F04438' : selected ? '#B94A70' : hovered ? '#D9C8A8' : '#F5CADB',
        backgroundColor: correct ? '#DCFCE7' : wrong ? '#FEECEB' : pressed && !disabled ? '#FBF5EA' : '#FFFFFF',
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        ...(correct ? glowWeb('0 0 18px 2px rgba(34,197,94,0.55)') : {}),
        ...(WEB ? (({ transition: 'transform 120ms ease, background-color 160ms ease, box-shadow 200ms ease' }) as object) : {}),
      })}
    >
      <Text className="font-semi text-bodyLg text-white">{label}</Text>
    </Pressable>
  );
}

/** Màn kết thúc: phủ tối, con dấu THẮNG hoặc HẾT LƯỢT, rồi thống kê. Thắng thì có pháo giấy. */
function ResultOverlay({ game, rival, onAgain, onOtherDeck, onBack }: { game: GoldQuest; rival: boolean; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
  const won = game.status === 'won';
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: (WEB ? 'fixed' : 'absolute') as 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Veil color={won ? 'rgba(8,12,24,0.5)' : 'rgba(8,12,24,0.8)'} duration={won ? 700 : 1300} />
      <ResultCard game={game} rival={rival} onAgain={onAgain} onOtherDeck={onOtherDeck} onBack={onBack} />
      {won ? <Confetti seed={`gold-${game.seed}`} silent /> : null}
    </View>
  );
}

function ResultCard({ game, rival, onAgain, onOtherDeck, onBack }: { game: GoldQuest; rival: boolean; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
  const { L } = useL();
  const won = game.status === 'won';
  const reasonText: Record<GoldReason, string> = {
    lap: L('Bạn đi đủ một vòng trước!', 'You lapped the road first!'),
    goal: L(`Đạt ${GOAL} vàng!`, `Reached ${GOAL} gold!`),
    beat: L('Vượt bot về vàng!', 'You out-earned the bot!'),
    behind: L('Bot nhiều vàng hơn.', 'The bot finished with more gold.'),
    short: L(`Chưa đủ ${GOAL} vàng.`, `Short of ${GOAL} gold.`),
  };
  const stats = [
    { label: L('Vàng', 'Gold'), v: String(game.you.gold) },
    { label: L('Đúng', 'Correct'), v: String(game.correct) },
    { label: L('Sai', 'Wrong'), v: String(game.wrong) },
    { label: L('Combo cao', 'Best streak'), v: String(game.maxCombo) },
    { label: L('Ô đã đi', 'Tiles'), v: `${Math.min(BOARD_LEN, game.you.pos)}/${BOARD_LEN}` },
    ...(rival && game.bot ? [{ label: L('Bot', 'Bot'), v: String(game.bot.gold) }] : []),
  ];
  return (
    <View style={{ width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#101A30', padding: 22, alignItems: 'center', ...(glowWeb('0 24px 60px rgba(0,0,0,0.5)') as object) }}>
      <Pop from={0.2}>
        <Text style={{ fontSize: 56 }}>{won ? '🏆' : '💫'}</Text>
      </Pop>
      <View style={{ marginTop: 10 }}>
        <Stamp color={won ? JUICE.good : JUICE.bad}>
          <Text className="font-heavy" style={{ fontSize: 26, letterSpacing: 2, color: won ? '#15803D' : '#B91C1C' }}>
            {won ? L('THẮNG!', 'WON!') : L('HẾT LƯỢT', 'TIME UP')}
          </Text>
        </Stamp>
      </View>
      <Text className="mt-3 text-center font-heavy text-pageTitle text-white">{reasonText[game.reason ?? 'short']}</Text>
      <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {stats.map((s, i) => (
          <Rise key={s.label} index={i}>
            <View style={{ minWidth: 62, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F4EDE1' }}>
              <Text className="font-heavy" style={{ fontSize: 20, color: ARENA.ink }}>{s.v}</Text>
              <Text className="font-semi" style={{ fontSize: 12, color: ARENA.muted }}>{s.label}</Text>
            </View>
          </Rise>
        ))}
      </View>
      <View className="mt-5 flex-row flex-wrap justify-center gap-3">
        <Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={onAgain} />
        <Button variant="outline" label={L('Chọn bộ khác', 'Choose another deck')} onPress={onOtherDeck} />
        <Button variant="ghost" label={L('Về Quest', 'Back to Quest')} onPress={onBack} />
      </View>
    </View>
  );
}
