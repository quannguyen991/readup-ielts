import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type AnimatedStyle } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Aura, Burst, FallIn, Flash, FloatText, JUICE, Pop, Rise, Shake, Stamp, Veil, glowWeb } from '@/components/game/juice';
import { BackPill, HUB, WEB } from '@/components/game/quest-hub/kit';
import { ARENA, ArenaPanel as Panel, glass } from '@/components/game/arena';
import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button, Icon } from '@/components/ui';
import { ArenaPanel as Card } from '@/components/game/arena';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { sfx } from '@/services/audio/sfx';
import { playSfx } from '@/services/audio/sfx-ui';
import { buildDuel, type DuelQuestion } from '@/services/duel/duel';
import {
  BAKERY_COIN,
  createCafe,
  type CafeCustomer,
  type CafeEvent,
  type CafeState,
  isGoodShift,
  MAX_SEATS,
  MAX_STARS,
  nextUpgradeCost,
  secondsLeft,
  seatsOf,
  serveCafe,
  tickCafe,
  type UpgradeBlock,
  type UpgradeKind,
  UPGRADE_KINDS,
  UPGRADES,
  upgradeCafe,
} from '@/services/game/cafe';
import { useGameStore } from '@/store/useGameStore';

/**
 * QUÁN CÀ PHÊ BAND 9: solo kiểu Blooket "Café". Khách đến gọi món là một từ; chọn
 * nghĩa đúng để phục vụ. Luật nằm ở `services/game/cafe.ts`; màn này chỉ vẽ, nhận thao
 * tác, và chạy nhịp đồng hồ.
 *
 * Câu hỏi lấy từ `buildDuel` (cùng hạt với mã ca), nên khách thứ n luôn gọi cùng một
 * câu. Mỗi lần phục vụ (đúng hoặc sai) gọi `useGameStore.answer` đúng một lần, với
 * khoá `cafe:<hạt>:<số khách>`. Khách bỏ đi vì hết kiên nhẫn không gọi `answer`.
 */

const TICK_MS = 100;
/** Số câu dựng sẵn cho một ca; khách thứ n dùng câu (n-1) mod số câu. */
const POOL = 40;
/** Thời gian một hiệu ứng tồn tại (ms) trước khi bị gỡ khỏi màn. */
const LIFE = 1200;
const SEAT = 50;
const SLOT = SEAT + 8;
const GOLD_INK = ARENA.gold;
const CARD = { boxShadow: '0 12px 30px rgba(15,23,42,0.10)' } as object;
const TONES = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA'] as const;
const FACES = ['🙂', '😊', '🤓', '😎', '🥳', '🧐', '😌', '🤠'] as const;
const UPGRADE_UI: Record<UpgradeKind, { glyph: string; name: { vi: string; en: string }; desc: { vi: string; en: string } }> = {
  seat: { glyph: '🪑', name: { vi: 'Ghế thêm', en: 'Extra seat' }, desc: { vi: 'Thêm một chỗ trong hàng', en: 'One more place in line' } },
  machine: { glyph: '☕', name: { vi: 'Máy pha nhanh', en: 'Quick brewer' }, desc: { vi: 'Khách kiên nhẫn lâu hơn', en: 'Customers wait longer' } },
  bakery: { glyph: '🥐', name: { vi: 'Bánh ngọt', en: 'Sweet pastry' }, desc: { vi: `+${BAKERY_COIN} coin mỗi lần đúng`, en: `+${BAKERY_COIN} coin per correct serve` } },
};

/** Hiệu ứng đang hiện trên quầy. `id` để React nhận ra từng cái khi gỡ. */
type FxBody =
  | { kind: 'burst'; colors: string[] }
  | { kind: 'text'; text: string; color: string; size: number; top: number }
  | { kind: 'stamp'; text: string; color: string }
  | { kind: 'coin' };
type Fx = FxBody & { id: number };

function mixHex(a: string, b: string, t: number): string {
  const parts = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const from = parts(a);
  const to = parts(b);
  return `#${from.map((v, i) => Math.round(v + (to[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Thanh kiên nhẫn: xanh khi còn nhiều, đỏ khi sắp bỏ đi. */
const patienceColor = (k: number) => mixHex('#EF4444', '#22C55E', Math.max(0, Math.min(1, k)));

export default function CafeGame() {
  const { L } = useL();
  const params = useLocalSearchParams<{ deck?: string }>();
  const [slug, setSlug] = useState(() => (Array.isArray(params.deck) ? params.deck[0] : params.deck) || VOCAB_TOPICS[0]!.slug);
  const deck = useStudyDeck(slug);
  const words = useMemo(() => deck?.words ?? [], [deck]);
  const playable = words.length >= 4;

  const [started, setStarted] = useState(false);
  const [seed, setSeed] = useState('');
  const [view, setView] = useState<CafeState>(() => createCafe('idle'));
  const gameRef = useRef<CafeState>(view);
  const [selId, setSelId] = useState<number | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const fxSeq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Đổi mỗi lần phục vụ sai: quầy rung và viền đỏ nháy. */
  const [wrongKey, setWrongKey] = useState(0);
  const [hint, setHint] = useState({ text: '', key: 0, warn: false });

  const questions = useMemo<DuelQuestion[]>(
    () => (playable && seed ? buildDuel(words, seed, POOL) : []),
    [playable, words, seed],
  );
  const questionFor = (serial: number): DuelQuestion | undefined =>
    questions.length ? questions[(serial - 1) % questions.length] : undefined;

  const running = started && view.status === 'open';

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
  }, []);

  const pushFx = (bodies: FxBody[]) => {
    if (bodies.length === 0) return;
    const items = bodies.map((b) => ({ ...b, id: ++fxSeq.current }) as Fx);
    setFx((prev) => [...prev, ...items].slice(-24));
    const ids = items.map((i) => i.id);
    timers.current.push(setTimeout(() => setFx((prev) => prev.filter((f) => !ids.includes(f.id))), LIFE));
  };

  const speak = (text: string, warn = false) => setHint((h) => ({ text, warn, key: h.key + 1 }));

  const blockText = (b: UpgradeBlock): string => {
    switch (b) {
      case 'ended': return L('Quán đã đóng cửa.', 'The café is closed.');
      case 'max': return L('Đã nâng hết cấp.', 'Already at max level.');
      default: return L('Chưa đủ coin.', 'Not enough coin.');
    }
  };

  /** Đổi các sự kiện của engine thành hiệu ứng và dòng gợi ý. */
  const react = (events: CafeEvent[], answer = '') => {
    for (const e of events) {
      if (e.kind === 'turnaway') {
        speak(L('Hết ghế, một khách quay lưng đi. Không mất sao.', 'No seat free, one customer walks out. No star lost.'));
      } else if (e.kind === 'abandon') {
        sfx.hurt();
        pushFx([{ kind: 'text', text: '−1 sao', color: '#FF6B6B', size: 24, top: 60 }]);
        speak(L('Khách hết kiên nhẫn và bỏ đi. Mất 1 sao.', 'A customer ran out of patience and left. 1 star lost.'), true);
      } else if (e.kind === 'served') {
        pushFx([
          { kind: 'burst', colors: ['#FFE14D', '#F59E0B', '#FFFFFF', '#86EFAC'] },
          { kind: 'stamp', text: L('CẢM ƠN!', 'THANK YOU!'), color: JUICE.good },
          { kind: 'text', text: `+${e.coin} coin`, color: '#B45309', size: 26, top: 58 },
          ...(e.combo >= 2 ? [{ kind: 'text' as const, text: `COMBO x${e.combo}`, color: '#EA580C', size: 20, top: 100 }] : []),
          { kind: 'coin' },
        ]);
        speak(
          e.boosted
            ? L(`Đúng! +${e.coin} coin, combo nhân 1,5.`, `Correct! +${e.coin} coin, combo boost 1.5x.`)
            : L(`Đúng! +${e.coin} coin.`, `Correct! +${e.coin} coin.`),
        );
      } else if (e.kind === 'wrong') {
        sfx.hurt();
        setWrongKey((k) => k + 1);
        pushFx([
          { kind: 'stamp', text: L('SAI RỒI', 'WRONG'), color: JUICE.bad },
          { kind: 'text', text: '−1 sao', color: '#FF6B6B', size: 24, top: 60 },
        ]);
        speak(
          L(`Đáp án là "${answer}". Khách bỏ đi, mất 1 sao.`, `The answer is "${answer}". The customer left, 1 star lost.`),
          true,
        );
      } else if (e.kind === 'closed') {
        if (e.reason === 'stars') {
          pushFx([{ kind: 'stamp', text: L('QUÁN ĐÓNG!', 'CLOSED!'), color: JUICE.bad }]);
          playSfx('retry');
        } else {
          playSfx('success');
        }
      }
    }
  };
  const reactRef = useRef(react);
  reactRef.current = react;

  // Nhịp đồng hồ: chỉ chạy khi ca đang mở. Dừng khi hết giờ, hết sao, hoặc rời màn.
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(500, now - last);
      last = now;
      const r = tickCafe(gameRef.current, dt);
      gameRef.current = r.state;
      setView(r.state);
      reactRef.current(r.events);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    const sd = `${slug}:${Date.now().toString(36)}`;
    const s = createCafe(sd);
    gameRef.current = s;
    setSeed(sd);
    setView(s);
    setSelId(null);
    setFx([]);
    setStarted(true);
    speak(L('Quán mở cửa! Chọn nghĩa đúng để phục vụ.', 'Doors open! Pick the right meaning to serve.'));
    pushFx([{ kind: 'stamp', text: L('MỞ QUÁN!', 'OPEN!'), color: JUICE.gold }]);
  };

  const serve = (c: CafeCustomer, choice: number) => {
    const q = questionFor(c.serial);
    if (!q || !seed) return;
    const correct = choice === q.correctIndex;
    const r = serveCafe(gameRef.current, c.id, correct);
    // Khách đã được phục vụ thì không còn trong hàng: bấm lần hai không tới được đây.
    if (!r.ok) return;
    useGameStore.getState().answer(correct, 'vocab', { key: `cafe:${seed}:${c.serial}` });
    gameRef.current = r.state;
    setView(r.state);
    setSelId(null);
    reactRef.current(r.events, q.options[q.correctIndex] ?? '');
  };

  const buy = (kind: UpgradeKind) => {
    const r = upgradeCafe(gameRef.current, kind);
    if (r.block) {
      speak(blockText(r.block), true);
      return;
    }
    gameRef.current = r.state;
    setView(r.state);
    playSfx('flip');
    pushFx([
      { kind: 'burst', colors: ['#FFE14D', '#FFFFFF', '#F59E0B'] },
      { kind: 'text', text: L('Nâng cấp!', 'Upgraded!'), color: JUICE.gold, size: 22, top: 60 },
    ]);
    speak(L('Đã nâng cấp.', 'Upgraded.'));
  };

  const back = () => router.replace('/quest' as never);
  const queue = view.queue;
  const sel = queue.find((c) => c.id === selId) ?? queue[0];
  const selQ = sel ? questionFor(sel.serial) : undefined;
  const seats = seatsOf(view.levels.seat);
  const secs = secondsLeft(view);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <BackPill label="Band 9 Quest" onPress={back} />
          {started ? (
            <Text className="font-semi text-label" style={{ color: ARENA.muted }}>
              {L('Bộ', 'Deck')}: {deck?.nameVi ?? slug}
            </Text>
          ) : null}
        </View>

        <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={16}>
          <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: ARENA.gold, textShadowColor: 'rgba(250,204,21,0.4)', textShadowRadius: 12 }}>
            {L('Quán Cà Phê Band 9', 'Band 9 Café')}
          </Text>
          <Text className="mt-1 font-sans text-body" style={{ color: ARENA.muted }}>
            {L(
              'Khách gọi món là một từ. Chọn đúng nghĩa để phục vụ; sai hoặc khách bỏ đi thì mất 1 sao.',
              'Customers order a word. Pick its right meaning to serve; a wrong serve or a walk-out costs 1 star.',
            )}
          </Text>
        </Panel>

        {!started ? (
          <MenuCard slug={slug} onPick={setSlug} playable={playable} words={words.length} onStart={start} />
        ) : (
          <>
            <Panel style={{ marginTop: 14 }} pad={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Pop key={`t${secs}`} from={0.8}>
                  <Text className="font-heavy text-bodyLg" style={{ color: secs <= 10 ? '#B91C1C' : ARENA.ink }}>⏱ {clock}</Text>
                </Pop>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {Array.from({ length: MAX_STARS }, (_, i) => (
                    <Icon key={i} name={i < view.stars ? 'star-fill' : 'star'} size={22} color={i < view.stars ? '#F59E0B' : '#CBB89A'} />
                  ))}
                </View>
                <Pop key={`c${view.coins}`} from={0.7}>
                  <Text className="font-heavy text-bodyLg" style={{ color: GOLD_INK }}>🪙 {view.coins}</Text>
                </Pop>
                <Pop key={`k${view.combo}`} from={0.6}>
                  <Text className="font-semi text-label" style={{ color: view.combo >= 4 ? '#EA580C' : ARENA.muted }}>
                    {L('Combo', 'Combo')} {view.combo}{view.combo >= 4 ? ' ×1,5' : ''}
                  </Text>
                </Pop>
              </View>
            </Panel>

            {/* Quầy gỗ: hàng khách, hộp tiền và hiệu ứng phục vụ. */}
            <View style={{ marginTop: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#5A3414', ...(CARD as object) }}>
              <LinearGradient colors={['#D9A56A', '#B77A40', '#8A5524']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: -40, top: -60, width: 180, height: 180 }}>
                <Aura color="#FFE9A8" size={160} strength={0.1} />
              </View>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <Text className="font-semi text-label" style={{ color: '#FFF7E6', marginTop: 10 }}>
                    {L('Hàng chờ', 'Queue')} {view.queue.length}/{seats}
                  </Text>
                  <View style={{ width: 96, height: 46, borderRadius: 12, backgroundColor: '#3B2412', borderWidth: 2, borderColor: '#F5C56B', alignItems: 'center', justifyContent: 'center' }}>
                    <Pop key={`e${view.earned}`} from={0.7}>
                      <Text className="font-heavy" style={{ color: '#FFE9A8', fontSize: 14 }}>
                        {L('Tổng', 'Total')} {view.earned}
                      </Text>
                    </Pop>
                    {fx.filter((f) => f.kind === 'coin').map((f) => (
                      <FallIn key={f.id} distance={54} style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' }}>
                        <Text style={{ fontSize: 22 }}>🪙</Text>
                      </FallIn>
                    ))}
                  </View>
                </View>

                <Shake trigger={wrongKey} amount={8}>
                  <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    {Array.from({ length: MAX_SEATS }, (_, i) => {
                      if (i >= seats) return null;
                      const c = queue[i];
                      return c ? (
                        <Pop key={c.id} from={0.3}>
                          <Seat c={c} selected={sel?.id === c.id} onPress={() => setSelId(c.id)} />
                        </Pop>
                      ) : (
                        <EmptySeat key={`empty-${i}`} />
                      );
                    })}
                  </View>
                </Shake>

                <FxLayer fx={fx.filter((f) => f.kind !== 'coin')} />
              </View>
              <Flash trigger={wrongKey} edge color="#EF4444" width={4} radius={22} duration={560} />
            </View>

            {sel && selQ ? (
              <Card className="mt-4" style={CARD}>
                <Text className="font-semi text-label uppercase tracking-[1px]" style={{ color: ARENA.muted }}>
                  {L(`Khách #${sel.serial} gọi`, `Customer #${sel.serial} orders`)} · {selQ.enToVi ? L('chọn nghĩa đúng', 'choose the meaning') : L('chọn từ đúng', 'choose the word')}
                </Text>
                <Text className="mt-3 font-heavy text-pageTitle text-white">{selQ.enToVi ? selQ.word.word : selQ.word.meaningVi}</Text>
                {selQ.enToVi && selQ.word.example ? <Text className="mt-2 font-sans text-body" style={{ color: ARENA.muted }}>{selQ.word.example}</Text> : null}
                <View className="mt-4 gap-2.5">
                  {selQ.options.map((opt, i) => (
                    <Choice key={`${sel.id}-${i}-${opt}`} label={opt} onPress={() => serve(sel, i)} />
                  ))}
                </View>
              </Card>
            ) : (
              <Card className="mt-4" style={CARD}>
                <Text className="font-sans text-body" style={{ color: ARENA.muted }}>
                  {L('Quầy đang vắng. Khách tiếp theo sẽ đến sau vài giây.', 'The counter is quiet. The next customer arrives in a few seconds.')}
                </Text>
              </Card>
            )}

            <View style={{ marginTop: 14, minHeight: 40, justifyContent: 'center' }}>
              <Shake trigger={hint.warn ? hint.key : 0} amount={5}>
                <Text className="text-center font-sans text-body" style={{ color: hint.warn ? '#B91C1C' : ARENA.muted }}>
                  {hint.text || L('Bấm một khách để chọn, rồi chọn nghĩa đúng.', 'Tap a customer, then pick the right meaning.')}
                </Text>
              </Shake>
            </View>

            <Text className="mt-2 font-heavy text-sectionTitle" style={{ color: ARENA.ink }}>{L('Nâng cấp quán', 'Upgrade the café')}</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {UPGRADE_KINDS.map((kind) => (
                <UpgradeTile key={kind} kind={kind} s={view} onBuy={() => buy(kind)} />
              ))}
            </View>
          </>
        )}

        {started && view.status === 'done' ? (
          <ResultOverlay
            s={view}
            onAgain={start}
            onOtherDeck={() => {
              setStarted(false);
              setFx([]);
            }}
            onBack={back}
          />
        ) : null}
      </View>
    </Screen>
  );
}

/* ---------------------------------------------------------------- hiển thị */

/** Một khách trong hàng: khung tròn màu, thanh kiên nhẫn chạy nhỏ dần bên dưới. */
function Seat({ c, selected, onPress }: { c: CafeCustomer; selected: boolean; onPress: () => void }) {
  const k = Math.max(0, 1 - c.age / c.patience);
  const tone = TONES[(c.serial - 1) % TONES.length]!;
  const face = FACES[(c.serial - 1) % FACES.length]!;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ width: SLOT, alignItems: 'center' }}
    >
      <View
        style={[
          {
            width: SEAT,
            height: SEAT,
            borderRadius: SEAT / 2,
            backgroundColor: tone,
            borderWidth: selected ? 4 : 2,
            borderColor: selected ? '#FFE14D' : '#FFF7E6',
            alignItems: 'center',
            justifyContent: 'center',
          } as ViewStyle,
          glowWeb(selected ? '0 0 16px 4px rgba(255,225,77,0.85)' : '0 4px 10px rgba(0,0,0,0.25)') as ViewStyle,
        ]}
      >
        <Text style={{ fontSize: 22 }}>{face}</Text>
      </View>
      <PatienceBar k={k} />
      <Text className="font-semi" style={{ marginTop: 4, fontSize: 11, color: '#FFF7E6' }}>#{c.serial}</Text>
    </Pressable>
  );
}

/** Chỗ trống trong hàng: vòng nét đứt. */
function EmptySeat() {
  return (
    <View style={{ width: SLOT, alignItems: 'center' }}>
      <View style={{ width: SEAT, height: SEAT, borderRadius: SEAT / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,247,230,0.55)' }} />
      <View style={{ marginTop: 6, width: SEAT, height: 6 }} />
    </View>
  );
}

/** Thanh kiên nhẫn: co dần theo `k` (0 đến 1), trượt mượt giữa hai nhịp. */
function PatienceBar({ k }: { k: number }) {
  const w = useSharedValue(k);
  useEffect(() => {
    w.value = withTiming(k, { duration: TICK_MS });
  }, [k, w]);
  const st = useAnimatedStyle(() => ({ width: `${Math.max(0, w.value) * 100}%` }));
  return (
    <View style={{ marginTop: 6, width: SEAT, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: patienceColor(k) }, st as AnimatedStyle<ViewStyle>]} />
    </View>
  );
}

/** Lớp hiệu ứng nằm đè lên quầy: nổ, số bay, con dấu. Mỗi mục tự gỡ sau `LIFE` ms. */
function FxLayer({ fx }: { fx: Fx[] }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {fx.map((f) => {
        if (f.kind === 'burst') {
          return <Burst key={f.id} seed={`cafe-${f.id}`} colors={f.colors} count={16} radius={100} size={8} duration={700} />;
        }
        if (f.kind === 'text') {
          return <FloatText key={f.id} text={f.text} color={f.color} size={f.size} style={{ top: f.top }} />;
        }
        if (f.kind === 'stamp') {
          return (
            <View key={f.id} style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' }}>
              <Stamp color={f.color}>
                <Text className="font-heavy" style={{ fontSize: 18, letterSpacing: 1.5, color: f.color }}>{f.text}</Text>
              </Stamp>
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

/** Một lựa chọn nghĩa. Bấm là phục vụ luôn; khách đó rời hàng ngay nên không cần trạng thái đã chọn. */
function Choice({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: hovered ? ARENA.goldSoft : ARENA.line,
        backgroundColor: pressed ? ARENA.glassStrong : ARENA.glass,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...(WEB ? (({ transition: 'transform 120ms ease, background-color 160ms ease, border-color 160ms ease' }) as object) : {}),
      })}
    >
      <Text className="font-semi text-bodyLg text-white">{label}</Text>
    </Pressable>
  );
}

/** Ô nâng cấp: cấp hiện tại bằng chấm vàng, giá kế tiếp ở dưới. Bấm khi thiếu coin thì chỉ báo. */
function UpgradeTile({ kind, s, onBuy }: { kind: UpgradeKind; s: CafeState; onBuy: () => void }) {
  const { L } = useL();
  const lvl = s.levels[kind];
  const max = UPGRADES[kind].max;
  const cost = nextUpgradeCost(s, kind);
  const can = cost !== null && s.coins >= cost && s.status === 'open';
  const info = UPGRADE_UI[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={s.status !== 'open'}
      onPress={onBuy}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flexGrow: 1,
        flexBasis: 96,
        minWidth: 96,
        borderRadius: 16,
        padding: 10,
        backgroundColor: ARENA.glass,
        borderWidth: 1.5,
        borderColor: can ? '#E9B949' : hovered ? '#D9C8A8' : '#EADFCF',
        opacity: cost === null ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        ...(WEB ? (({ transition: 'transform 120ms ease, border-color 160ms ease' }) as object) : {}),
      })}
    >
      <Pop key={lvl} from={0.6}>
        <View>
          <Text style={{ fontSize: 22 }}>{info.glyph}</Text>
          <Text className="font-heavy text-label" style={{ color: ARENA.ink, marginTop: 4 }}>{L(info.name.vi, info.name.en)}</Text>
          <Text style={{ fontSize: 12, color: ARENA.muted, marginTop: 2 }}>{L(info.desc.vi, info.desc.en)}</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
            {Array.from({ length: max }, (_, i) => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < lvl ? '#E9B949' : '#EADFCF' }} />
            ))}
          </View>
          <Text className="font-semi" style={{ marginTop: 6, fontSize: 12, color: can ? GOLD_INK : ARENA.muted }}>
            {cost === null ? L('Đã tối đa', 'Max level') : `${cost} coin`}
          </Text>
        </View>
      </Pop>
    </Pressable>
  );
}

function MenuCard({ slug, onPick, playable, words, onStart }: { slug: string; onPick: (s: string) => void; playable: boolean; words: number; onStart: () => void }) {
  const { L, en } = useL();
  return (
    <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
      <View pointerEvents="none" style={{ position: 'absolute', left: -50, bottom: -80, width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Aura color="#FDBA74" size={160} strength={0.3} />
      </View>
      <Text className="font-heavy text-sectionTitle" style={{ color: ARENA.ink }}>{L('Chọn bộ từ', 'Choose a word deck')}</Text>
      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                paddingHorizontal: 14,
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
      </View>
      <Text className="mt-3 font-sans text-label" style={{ color: ARENA.muted }}>
        {playable
          ? L(`Bộ này có ${words} từ. Khách gọi từ trong bộ này.`, `This deck has ${words} words. Customers order from it.`)
          : L('Bộ này cần ít nhất 4 từ để chơi.', 'This deck needs at least 4 words to play.')}
      </Text>
      <Text className="mt-2 font-sans text-body" style={{ color: ARENA.muted }}>
        {L(
          'Ca 90 giây. Khách đến khoảng mỗi 5 giây, xếp tối đa 3 người (có thể nâng lên 5). Hết 3 sao thì quán đóng cửa sớm.',
          'A 90-second shift. A customer arrives about every 5 seconds, up to 3 in line (upgradable to 5). Out of 3 stars, the café closes early.',
        )}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <Button label={L('Mở quán', 'Open the café')} iconLeft="play" onPress={onStart} disabled={!playable} />
      </View>
    </Panel>
  );
}

/** Màn kết thúc: phủ tối màn hình, con dấu, thống kê. Hết giờ còn đủ sao thì có pháo giấy. */
function ResultOverlay({ s, onAgain, onOtherDeck, onBack }: { s: CafeState; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
  const { L } = useL();
  const byStars = s.endReason === 'stars';
  const good = isGoodShift(s);
  const stats = [
    { label: L('Coin kiếm được', 'Coin earned'), v: String(s.earned) },
    { label: L('Khách phục vụ', 'Served'), v: String(s.served) },
    { label: L('Combo cao nhất', 'Best combo'), v: String(s.bestCombo) },
    { label: L('Sao còn lại', 'Stars left'), v: `${s.stars}/${MAX_STARS}` },
  ];
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
      <Veil color={byStars ? 'rgba(8,12,24,0.8)' : 'rgba(8,12,24,0.5)'} duration={byStars ? 1300 : 700} />
      <View style={{ width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#101A30', padding: 22, alignItems: 'center', ...(glowWeb('0 24px 60px rgba(0,0,0,0.5)') as object) }}>
        <Pop from={0.2}>
          <Text style={{ fontSize: 56 }}>{byStars ? '🚪' : '☕'}</Text>
        </Pop>
        <View style={{ marginTop: 10 }}>
          <Stamp color={byStars ? JUICE.bad : JUICE.good}>
            <Text className="font-heavy" style={{ fontSize: 26, letterSpacing: 2, color: byStars ? '#B91C1C' : '#15803D' }}>
              {byStars ? L('QUÁN ĐÓNG!', 'CLOSED!') : L('CẢM ƠN!', 'THANK YOU!')}
            </Text>
          </Stamp>
        </View>
        <Text className="mt-3 text-center font-heavy text-pageTitle text-white">
          {byStars ? L('Hết sao, quán đóng cửa sớm', 'Out of stars, the café closed early') : L('Hết ca, khách về đầy đủ', 'Shift over, all customers served')}
        </Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {stats.map((x, i) => (
            <Rise key={x.label} index={i}>
              <View style={{ minWidth: 80, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: ARENA.glassStrong }}>
                <Text className="font-heavy" style={{ fontSize: 20, color: ARENA.ink }}>{x.v}</Text>
                <Text className="font-semi" style={{ fontSize: 12, color: ARENA.muted, textAlign: 'center' }}>{x.label}</Text>
              </View>
            </Rise>
          ))}
        </View>
        <Text className="mt-3 text-center font-sans text-label" style={{ color: ARENA.muted }}>
          {L(`Bỏ đi ${s.missed} · Sai ${s.wrong} · Quay đi ${s.turnedAway}`, `Walked out ${s.missed} · Wrong ${s.wrong} · Turned away ${s.turnedAway}`)}
        </Text>
        <View className="mt-5 flex-row flex-wrap justify-center gap-3">
          <Button label={L('Mở quán lại', 'Open again')} iconLeft="refresh" onPress={onAgain} />
          <Button variant="outline" label={L('Chọn bộ khác', 'Choose another deck')} onPress={onOtherDeck} />
          <Button variant="ghost" label={L('Về Quest', 'Back to Quest')} onPress={onBack} />
        </View>
      </View>
      {good ? <Confetti seed={`cafe-${s.seed}`} silent /> : null}
    </View>
  );
}
