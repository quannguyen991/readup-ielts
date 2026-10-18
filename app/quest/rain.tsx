import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from 'react-native-reanimated';

import { Burst, DangerLine, FloatText, JUICE, Pop, Rise, Shake, Starfield, Stamp, Veil, Flash, glowWeb } from '@/components/game/juice';
import { BackPill, HUB, WEB } from '@/components/game/quest-hub/kit';
import { ARENA, ArenaPanel as Panel, glass } from '@/components/game/arena';
import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button, Icon } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { playSfx } from '@/services/audio/sfx-ui';
import {
  answerOf,
  buildRainQuestions,
  createRainGame,
  type Drop,
  FLOOR,
  RAIN_HEARTS,
  RAIN_LENGTH,
  type RainEvent,
  type RainGame,
  seedOf,
  tapRain,
  tickRain,
} from '@/services/game/rain';
import { useGameStore } from '@/store/useGameStore';

/**
 * MƯA TỪ VỰNG: game solo. Từ tiếng Anh hiện trên đầu; bốn bong bóng nghĩa tiếng Việt
 * rơi cùng lúc. Chạm đúng để bắt (cộng điểm, tăng combo); chạm sai, hoặc để bong bóng
 * đúng chạm đáy, là mất một tim. Hết mười câu là thắng; hết tim là thua.
 *
 * Luật nằm ở `services/game/rain.ts`. Màn này chỉ vẽ, nhận thao tác, và chạy nhịp
 * bằng requestAnimationFrame (dừng khi tạm dừng, kết thúc hoặc thoát màn).
 *
 * Mỗi sự kiện trả lời được (bắt đúng, chạm sai, đúng rơi tới đáy) gọi
 * `useGameStore.answer` đúng một lần, nguồn 'vocab'. Tiếng đúng / sai và tiếng mất tim
 * do store phát sẵn, nên màn này không phát thêm.
 */

const FIELD_H = 440;
const BUBBLE_H = 66;
const GOLD_INK = '#B45309';
const CARD = { boxShadow: '0 12px 30px rgba(15,23,42,0.10)' } as object;

/* ---------------------------------------------------------------- hiệu ứng */

type FxBody =
  | { kind: 'burst'; x: number; y: number; colors: string[]; count: number; radius: number; size: number; duration: number }
  | { kind: 'text'; x: number; y: number; text: string; color: string; size: number };
type Fx = FxBody & { id: number; at: number; life: number };

let fxSeq = 0;
function fxOf(body: FxBody): Fx {
  fxSeq += 1;
  return { ...body, id: fxSeq, at: Date.now(), life: body.kind === 'burst' ? 900 : 1200 };
}

/** Chữ bay lên. Giảm chuyển động thì hiện đứng yên (bản bay của juice ẩn chữ khi tắt chuyển động). */
function FloatTag({ text, color, size }: { text: string; color: string; size: number }) {
  const reduced = useReducedMotion();
  if (!reduced) return <FloatText text={text} color={color} size={size} />;
  return (
    <Text style={{ position: 'absolute', top: 0, alignSelf: 'center', fontSize: size, fontWeight: '900', color, textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6 }}>
      {text}
    </Text>
  );
}

/* ---------------------------------------------------------------- màn hình */

export default function RainGameScreen() {
  const { L } = useL();
  const params = useLocalSearchParams<{ deck?: string }>();
  const [slug, setSlug] = useState(() => (Array.isArray(params.deck) ? params.deck[0] : params.deck) || VOCAB_TOPICS[0]!.slug);
  const deck = useStudyDeck(slug);
  const words = useMemo(() => deck?.words ?? [], [deck]);
  const playable = words.length >= 4;

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<RainGame>(() => createRainGame([]));
  const gameRef = useRef(view);
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const roundRef = useRef(0);
  const [fieldW, setFieldW] = useState(0);
  const [fx, setFx] = useState<Fx[]>([]);
  /** Đếm số lần chạm sai hoặc để lọt; đổi thì sân rung và viền đỏ nháy. */
  const [hit, setHit] = useState(0);

  const commit = (game: RainGame, events: RainEvent[]) => {
    gameRef.current = game;
    setView(game);
    const made: FxBody[] = [];
    let missed = false;
    for (const ev of events) {
      const a = answerOf(ev);
      if (a) useGameStore.getState().answer(a.correct, 'vocab', { key: `rain:${slugRef.current}:${a.word}` });
      if (ev.kind === 'caught') {
        made.push({ kind: 'burst', x: ev.x, y: ev.y, colors: ['#86EFAC', '#FFE14D', '#FFFFFF'], count: 20, radius: 96, size: 8, duration: 720 });
        made.push({ kind: 'text', x: ev.x, y: ev.y - 4, text: `+${ev.points}`, color: JUICE.gold, size: 24 });
        if (ev.combo >= 2) made.push({ kind: 'text', x: 50, y: 30, text: `COMBO x${ev.combo}`, color: '#FDE68A', size: 20 });
      } else if (ev.kind === 'wrongTap') {
        missed = true;
        made.push({ kind: 'burst', x: ev.x, y: ev.y, colors: ['#EF4444', '#FCA5A5', '#FFFFFF'], count: 12, radius: 56, size: 6, duration: 520 });
        made.push({ kind: 'text', x: ev.x, y: ev.y - 4, text: L('Sai!', 'Wrong!'), color: '#FCA5A5', size: 20 });
      } else if (ev.kind === 'missed') {
        missed = true;
        made.push({ kind: 'text', x: ev.x, y: FLOOR - 10, text: L('−1 tim', '−1 heart'), color: '#FF6B6B', size: 24 });
      } else if (ev.kind === 'lost') {
        playSfx('retry');
      }
    }
    if (made.length > 0) {
      const items = made.map(fxOf);
      const now = Date.now();
      setFx((prev) => [...prev.filter((f) => now - f.at < f.life), ...items].slice(-40));
    }
    if (missed) setHit((h) => h + 1);
    if (game.status !== 'playing') setRunning(false);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  // Vòng nhịp: chỉ chạy khi đang chơi. Đổi `running` thành false thì vòng dừng và dọn.
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = Date.now();
    const frame = () => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      const prev = gameRef.current;
      const r = tickRain(prev, dt);
      if (r.game !== prev) commitRef.current(r.game, r.events);
      if (r.game.status === 'playing') id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [running]);

  const start = () => {
    roundRef.current += 1;
    const text = `band9-rain:${slug}:${roundRef.current}`;
    const seed = seedOf(text);
    const qs = buildRainQuestions(words, seed, RAIN_LENGTH);
    if (qs.length === 0) return;
    const g = createRainGame(qs, seed);
    gameRef.current = g;
    setView(g);
    setFx([]);
    setHit(0);
    setStarted(true);
    setRunning(g.status === 'playing');
  };

  const tap = (dropId: number) => {
    if (!running) return;
    const prev = gameRef.current;
    const r = tapRain(prev, dropId);
    if (r.game !== prev) commit(r.game, r.events);
  };

  const back = () => router.replace('/quest' as never);
  const liveFx = fx.filter((f) => Date.now() - f.at < f.life);
  const question = view.questions[view.qIndex];
  const W = fieldW || 320;

  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 920, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <BackPill label="Band 9 Quest" onPress={back} />
          {started ? (
            <Text className="font-semi text-label" style={{ color: ARENA.muted }}>
              {L('Bộ', 'Deck')}: {deck?.nameVi ?? slug}
            </Text>
          ) : null}
        </View>

        <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -50, width: 170, height: 170 }}>
            <Burst seed="rain-title" colors={['#7DD3FC', '#FDE68A', '#F0ABFC']} count={10} radius={70} size={6} duration={2400} />
          </View>
          <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: ARENA.gold, textShadowColor: 'rgba(250,204,21,0.4)', textShadowRadius: 12 }}>
            {L('Mưa Từ Vựng', 'Vocab Rain')}
          </Text>
          <Text className="mt-1 font-sans text-body" style={{ color: ARENA.muted }}>
            {L(
              'Từ tiếng Anh hiện trên đầu. Chạm đúng nghĩa tiếng Việt trước khi bong bóng chạm đáy. Chạm sai, hoặc để lọt bong bóng đúng, là mất một tim.',
              'An English word sits on top. Tap the right Vietnamese meaning before its bubble hits the floor. A wrong tap, or letting the right bubble drop, costs a heart.',
            )}
          </Text>
        </Panel>

        {!started ? (
          <MenuCard slug={slug} onPick={setSlug} playable={playable} words={words.length} onStart={start} />
        ) : (
          <>
            <Panel style={{ marginTop: 14 }} pad={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Shake trigger={view.wrong + view.missed} amount={6}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {Array.from({ length: RAIN_HEARTS }, (_, i) =>
                      i < view.hearts ? (
                        <Icon key={`h${i}`} name="heart" size={22} color="#F04438" />
                      ) : (
                        <Pop key={`b${i}`} from={0.3}>
                          <Text style={{ fontSize: 20, opacity: 0.6 }}>💔</Text>
                        </Pop>
                      ),
                    )}
                  </View>
                </Shake>
                <Pop key={`s${view.score}`} from={0.7}>
                  <Text className="font-heavy text-bodyLg" style={{ color: GOLD_INK }}>⭐ {view.score}</Text>
                </Pop>
                <Text className="font-semi text-label" style={{ color: ARENA.ink }}>
                  {L('Câu', 'Question')} {Math.min(view.qIndex + 1, view.questions.length)}/{view.questions.length}
                </Text>
                <Pop key={`c${view.combo}`} from={0.6}>
                  <Text className="font-semi text-label" style={{ color: ARENA.muted }}>
                    {L('Combo', 'Streak')} {view.combo} 🔥
                  </Text>
                </Pop>
                {view.status === 'playing' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setRunning((r) => !r)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: pressed ? ARENA.glassStrong : ARENA.glass,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      ...(WEB ? (({ transition: 'transform 120ms ease, background-color 150ms ease' }) as object) : {}),
                    })}
                  >
                    <Text className="font-semi text-body" style={{ color: ARENA.ink }}>{running ? L('Tạm dừng', 'Pause') : L('Tiếp tục', 'Resume')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </Panel>

            {/* Từ cần bắt: ở đầu màn, phía trên sân rơi. */}
            {question ? (
              <View className="mt-4" style={[glass({ padding: 16, paddingHorizontal: 20 }), { alignItems: 'center' }]}>
                <Text className="font-semi text-label uppercase tracking-[1px]" style={{ color: ARENA.muted }}>
                  {L('Từ cần bắt', 'Word to catch')}
                </Text>
                <Pop key={`w${view.qIndex}`} from={0.5}>
                  <Text className="mt-1 text-center font-heavy text-pageTitle text-white">{question.word}</Text>
                </Pop>
              </View>
            ) : null}

            <View style={{ marginTop: 14, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
              <Field
                view={view}
                width={W}
                onLayout={(e: LayoutChangeEvent) => setFieldW(Math.round(e.nativeEvent.layout.width))}
                fx={liveFx}
                hit={hit}
                onTap={tap}
                paused={!running}
              />
            </View>

            {view.status === 'playing' && !running ? (
              <Panel style={{ marginTop: 14, alignItems: 'center' }} pad={20}>
                <Text className="font-heavy text-sectionTitle" style={{ color: ARENA.ink }}>{L('Đang tạm dừng', 'Paused')}</Text>
                <View style={{ marginTop: 12 }}>
                  <Button label={L('Tiếp tục', 'Resume')} iconLeft="play" onPress={() => setRunning(true)} />
                </View>
              </Panel>
            ) : null}
          </>
        )}

        {started && view.status !== 'playing' ? (
          <ResultOverlay game={view} onAgain={start} onOtherDeck={() => setStarted(false)} onBack={back} />
        ) : null}
      </View>
    </Screen>
  );
}

function MenuCard({ slug, onPick, playable, words, onStart }: { slug: string; onPick: (s: string) => void; playable: boolean; words: number; onStart: () => void }) {
  const { L, en } = useL();
  return (
    <Panel style={{ marginTop: 14 }} pad={18}>
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
      <Text className="mt-3 font-sans text-label" style={{ color: ARENA.muted }}>
        {playable
          ? L(`Bộ này có ${words} từ. Mỗi lượt lấy một từ và bốn nghĩa từ bộ này.`, `This deck has ${words} words. Each round uses one word and four meanings from it.`)
          : L('Bộ này cần ít nhất 4 từ để chơi.', 'This deck needs at least 4 words to play.')}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <Button label={L('Bắt đầu', 'Start')} iconLeft="play" onPress={onStart} disabled={!playable} />
      </View>
    </Panel>
  );
}

/** Sân rơi: nền sao, bong bóng, vạch đáy đỏ. Đây là phần vẽ lại mỗi nhịp. */
function Field({
  view,
  width,
  onLayout,
  fx,
  hit,
  onTap,
  paused,
}: {
  view: RainGame;
  width: number;
  onLayout: (e: LayoutChangeEvent) => void;
  fx: Fx[];
  hit: number;
  onTap: (id: number) => void;
  paused: boolean;
}) {
  const { L } = useL();
  const bw = Math.round(Math.max(70, Math.min(118, width * 0.22)));
  return (
    <Shake trigger={hit} amount={6}>
      <View
        onLayout={onLayout}
        style={{ width: '100%', maxWidth: 560, height: FIELD_H, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#3730A3', ...(glowWeb('0 18px 40px rgba(30,27,75,0.35)') as object) }}
      >
        <LinearGradient colors={['#1E1B4B', '#312E81', '#0C4A6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Starfield seed="rain-stars" count={34} />
        {view.drops.map((d) => (
          <Bubble key={d.id} d={d} width={width} bw={bw} paused={paused} onTap={() => onTap(d.id)} />
        ))}
        <DangerLine height={6} />
        {fx.map((f) => (
          <View key={f.id} pointerEvents="none" style={{ position: 'absolute', left: (f.x / 100) * width, top: (f.y / 100) * FIELD_H, width: 0, height: 0, alignItems: 'center' }}>
            {f.kind === 'burst' ? (
              <Burst seed={String(f.id)} colors={f.colors} count={f.count} radius={f.radius} size={f.size} duration={f.duration} />
            ) : (
              <FloatTag text={f.text} color={f.color} size={f.size} />
            )}
          </View>
        ))}
        <Flash trigger={hit} edge color="#F87171" width={8} radius={22} duration={560} />
        {paused && view.status === 'playing' ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,12,24,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 18 }}>{L('Tạm dừng', 'Paused')}</Text>
          </View>
        ) : null}
      </View>
    </Shake>
  );
}

/** Một bong bóng nghĩa. Lắc ngang nhẹ theo tuổi và pha của nó; nảy ra khi mới xuất hiện. */
function Bubble({ d, width, bw, paused, onTap }: { d: Drop; width: number; bw: number; paused: boolean; onTap: () => void }) {
  const left = (d.x / 100) * width - bw / 2;
  const top = (d.y / 100) * FIELD_H - BUBBLE_H / 2;
  const wobble = Math.sin(d.age / 420 + d.phase) * 5;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left, top, width: bw, height: BUBBLE_H, transform: [{ translateX: wobble }] }}>
      <Pop from={0.3}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={d.text}
          disabled={paused}
          onPress={onTap}
          style={({ pressed }: { pressed: boolean }) => ({
            flex: 1,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            backgroundColor: pressed ? '#BAE6FD' : 'rgba(224,242,254,0.94)',
            justifyContent: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            overflow: 'hidden',
            transform: [{ scale: pressed ? 0.92 : 1 }],
            ...(glowWeb('0 0 14px rgba(125,211,252,0.85), 0 8px 18px rgba(0,0,0,0.35)') as object),
            ...(WEB ? (({ transition: 'transform 120ms ease, background-color 120ms ease' }) as object) : {}),
          })}
        >
          <View pointerEvents="none" style={{ position: 'absolute', left: 8, top: 6, width: bw * 0.22, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
          <Text className="text-center font-semi" numberOfLines={3} style={{ fontSize: 13, lineHeight: 17, color: '#0F172A' }}>
            {d.text}
          </Text>
        </Pressable>
      </Pop>
    </View>
  );
}

/** Màn kết thúc: phủ tối, con dấu THẮNG hoặc HẾT TIM, rồi thống kê. Thắng thì có pháo giấy. */
function ResultOverlay({ game, onAgain, onOtherDeck, onBack }: { game: RainGame; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
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
      <ResultCard game={game} onAgain={onAgain} onOtherDeck={onOtherDeck} onBack={onBack} />
      {won ? <Confetti seed={`rain-won-${game.score}-${game.bestCombo}`} /> : null}
    </View>
  );
}

function ResultCard({ game, onAgain, onOtherDeck, onBack }: { game: RainGame; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
  const { L } = useL();
  const won = game.status === 'won';
  const stats = [
    { label: L('Điểm', 'Score'), v: game.score },
    { label: L('Đúng', 'Correct'), v: game.correct },
    { label: L('Sai', 'Wrong'), v: game.wrong },
    { label: L('Lọt đáy', 'Missed'), v: game.missed },
    { label: L('Combo cao', 'Best combo'), v: game.bestCombo },
  ];
  return (
    <View style={{ width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#101A30', padding: 22, alignItems: 'center', ...(glowWeb('0 24px 60px rgba(0,0,0,0.5)') as object) }}>
      <Pop from={0.2}>
        <Text style={{ fontSize: 56 }}>{won ? '🌈' : '💥'}</Text>
      </Pop>
      <View style={{ marginTop: 10 }}>
        <Stamp color={won ? JUICE.good : JUICE.bad}>
          <Text className="font-heavy" style={{ fontSize: 26, letterSpacing: 2, color: won ? '#15803D' : '#B91C1C' }}>
            {won ? L('THẮNG!', 'WON!') : L('HẾT TIM', 'NO HEARTS')}
          </Text>
        </Stamp>
      </View>
      <Text className="mt-3 text-center font-heavy text-pageTitle text-white">
        {won ? L('Bạn hứng trọn cơn mưa!', 'You caught the whole shower!') : L('Bong bóng đã chạm đáy', 'The bubbles hit the floor')}
      </Text>
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
