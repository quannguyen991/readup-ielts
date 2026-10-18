import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from 'react-native-reanimated';

import { Aura, Banner, Bob, Bolt, Burst, Flash, FloatText, Flow, Glide, JUICE, Pop, Rise, Shake, Stamp, Veil, glowWeb } from '@/components/game/juice';
import { BackPill, HUB, Panel, WEB } from '@/components/game/quest-hub/kit';
import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button, Icon } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { buildDuel, type DuelQuestion } from '@/services/duel/duel';
import { sfx } from '@/services/audio/sfx';
import { playSfx } from '@/services/audio/sfx-ui';
import {
  answerTower,
  BUILD_COST,
  buildBlock,
  buildTower,
  frontmost,
  type Block,
  type Cell,
  COLS,
  createTowerGame,
  LANE,
  MAX_LEVEL,
  onLane,
  pointAt,
  ROWS,
  TICK_MS,
  tickTower,
  TOWER_HEARTS,
  towerAt,
  type TowerEvent,
  type TowerGame,
  upgradeBlock,
  upgradeCost,
  upgradeTower,
  WAVES,
} from '@/services/game/tower';
import { useGameStore } from '@/store/useGameStore';

/**
 * THÁP BAND: tower defense solo. Quái đi theo đường trên lưới 5 × 5; trả lời đúng
 * để có vàng đặt và nâng tháp, trả lời sai thì một con quái lọt tới đích (mất tim).
 * Luật nằm ở `services/game/tower.ts`; màn này chỉ vẽ, nhận thao tác, và chạy nhịp.
 *
 * Hiệu ứng: mỗi sự kiện của engine (bắn, hạ quái, lọt đích, sóng mới) đẻ ra một
 * mục trong `fx`. Mục nào cũng có `at` và `life`: hết hạn thì bị lọc khỏi danh sách
 * ở lần vẽ sau, nên không cần bộ đếm giờ nào để dọn.
 *
 * Mỗi câu gọi `useGameStore.answer` đúng một lần, với nguồn 'vocab'. Câu hỏi lấy
 * từ bộ từ vựng bằng `buildDuel` (cùng cách với Đấu 1–1 và Sảnh Arcade).
 */

const BOARD_MAX = 340;
/** Viền khung quanh bàn chơi (px). */
const FRAME = 8;
const ROUND_LEN = 20;
const GOLD_INK = '#8A5A00';
const CARD = { boxShadow: '0 12px 30px rgba(15,23,42,0.10)' } as object;
/** Màu theo cấp tháp (1, 2, 3): vàng, băng, hồng. */
const LEVEL_COLOR = ['#FFE14D', '#7DD3FC', '#F9A8D4'] as const;
const GRID_LINE = { backgroundColor: 'rgba(147,197,253,0.26)', ...glowWeb('0 0 6px rgba(147,197,253,0.7)') } as object;

/* ---------------------------------------------------------------- hình học */

type Geom = { step: number; gap: number; cell: number; board: number; foe: number };

/** Chia bề ngang bàn chơi thành lưới. Mỗi ô là `step` px trong đó có `gap` px khe. */
function makeGeom(width: number): Geom {
  const step = Math.max(44, Math.min(68, Math.floor(width / COLS)));
  const gap = Math.max(4, Math.round(step * 0.09));
  const cell = step - gap;
  return { step, gap, cell, board: COLS * step - gap, foe: Math.round(cell * 0.5) };
}

/** Toạ độ đơn vị ô (tâm ô là x.5) → px trên bàn chơi. */
const px = (g: Geom, u: number) => u * g.step - g.gap / 2;
const center = (c: Cell): Pt => ({ x: c.c + 0.5, y: c.r + 0.5 });
type Pt = { x: number; y: number };
const CASTLE = pointAt(LANE.length - 1);

/* ---------------------------------------------------------------- hiệu ứng */

type FxBody =
  | { kind: 'burst'; x: number; y: number; colors: string[]; count: number; radius: number; size: number; duration: number }
  | { kind: 'text'; x: number; y: number; text: string; color: string; size: number }
  | { kind: 'bolt'; from: Pt; to: Pt; color: string }
  | { kind: 'banner'; text: string };
type Fx = FxBody & { id: number; at: number; life: number };

let fxSeq = 0;
function fxOf(body: FxBody): Fx {
  fxSeq += 1;
  const life = body.kind === 'burst' ? 900 : body.kind === 'text' ? 1200 : body.kind === 'bolt' ? 320 : 2300;
  return { ...body, id: fxSeq, at: Date.now(), life };
}

/** Đổi các sự kiện của một nhịp thành hiệu ứng. Toạ độ giữ ở đơn vị ô để đổi cỡ màn vẫn đúng. */
function tickFx(prev: TowerGame, next: TowerGame, events: TowerEvent[]): { list: FxBody[]; hit: boolean } {
  const list: FxBody[] = [];
  let hit = false;
  for (const ev of events) {
    if (ev.kind === 'wave') {
      list.push({ kind: 'banner', text: `SÓNG ${ev.wave}/${WAVES}` });
    } else if (ev.kind === 'shot') {
      const t = next.towers.find((x) => x.id === ev.tower) ?? prev.towers.find((x) => x.id === ev.tower);
      const f = next.foes.find((x) => x.id === ev.foe) ?? prev.foes.find((x) => x.id === ev.foe);
      if (!t || !f) continue;
      const color = LEVEL_COLOR[t.level - 1]!;
      const from = center(t.cell);
      list.push({ kind: 'bolt', from, to: pointAt(f.pos), color });
      list.push({ kind: 'burst', x: from.x, y: from.y, colors: [color, '#FFFFFF'], count: 5, radius: 16, size: 4, duration: 260 });
    } else if (ev.kind === 'kill') {
      const f = prev.foes.find((x) => x.id === ev.foe);
      if (!f) continue;
      const p = pointAt(f.pos);
      list.push({
        kind: 'burst',
        x: p.x,
        y: p.y,
        colors: [f.color, '#FFFFFF', JUICE.gold],
        count: ev.boss ? 30 : 18,
        radius: ev.boss ? 96 : 66,
        size: ev.boss ? 11 : 8,
        duration: 720,
      });
      list.push({ kind: 'text', x: p.x, y: p.y - 0.2, text: ev.boss ? 'HẠ BOSS!' : 'Hạ!', color: JUICE.gold, size: ev.boss ? 22 : 17 });
    } else if (ev.kind === 'leak') {
      hit = true;
      list.push({ kind: 'text', x: CASTLE.x, y: CASTLE.y - 0.3, text: '−1 tim', color: '#FF6B6B', size: 24 });
    }
  }
  return { list, hit };
}

function playEvent(ev: TowerEvent) {
  if (ev.kind === 'wave') playSfx('nav');
  else if (ev.kind === 'spawn' && ev.boss) sfx.bossRoar(0);
  else if (ev.kind === 'leak') playSfx('wrong');
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

export default function TowerDefense() {
  const { L } = useL();
  const params = useLocalSearchParams<{ deck?: string }>();
  const [slug, setSlug] = useState(() => (Array.isArray(params.deck) ? params.deck[0] : params.deck) || VOCAB_TOPICS[0]!.slug);
  const deck = useStudyDeck(slug);
  const words = useMemo(() => deck?.words ?? [], [deck]);
  const playable = words.length >= 4;

  const { width: winW } = useWindowDimensions();
  const boardMax = Math.min(BOARD_MAX, Math.min(winW, 920) - 32 - 28 - 2 - FRAME * 2);
  const geom = useMemo(() => makeGeom(boardMax), [boardMax]);
  const flowPts = useMemo<Pt[]>(() => LANE.map((c) => ({ x: px(geom, c.c + 0.5), y: px(geom, c.r + 0.5) })), [geom]);

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<TowerGame>(() => createTowerGame());
  const gameRef = useRef(view);
  const [cursor, setCursor] = useState({ round: 0, i: 0 });
  const [picked, setPicked] = useState<number | null>(null);
  const [gained, setGained] = useState(0);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Cell | null>(null);
  /** Dòng gợi ý dưới bàn. `warn` làm nó rung (ô không đặt được, thiếu vàng). */
  const [hint, setHint] = useState({ text: '', key: 0, warn: false });
  const [fx, setFx] = useState<Fx[]>([]);
  /** Đếm số lần quái lọt đích; đổi thì bàn rung và viền đỏ nháy. */
  const [hit, setHit] = useState(0);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mỗi vòng là một lượt xáo lại bộ từ với hạt khác; hết vòng thì sang vòng mới.
  const questions = useMemo<DuelQuestion[]>(
    () => (playable ? buildDuel(words, `band9-tower:${slug}:${cursor.round}`, Math.min(words.length, ROUND_LEN)) : []),
    [playable, words, slug, cursor.round],
  );
  const q = questions[cursor.i];

  // Nhịp mô phỏng: chỉ chạy khi đang bấm chơi (không tạm dừng, chưa thua/thắng). Dừng khi unmount.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const prev = gameRef.current;
      const { game, events } = tickTower(prev);
      gameRef.current = game;
      setView(game);
      events.forEach(playEvent);
      const made = tickFx(prev, game, events);
      pushFx(made.list);
      if (made.hit) setHit((h) => h + 1);
      if (game.status !== 'playing') setRunning(false);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (view.status === 'won') playSfx('success');
    else if (view.status === 'lost') playSfx('retry');
  }, [view.status]);

  useEffect(() => () => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
  }, []);

  const pushFx = (bodies: FxBody[]) => {
    if (bodies.length === 0) return;
    const items = bodies.map(fxOf);
    const now = Date.now();
    setFx((prev) => [...prev.filter((f) => now - f.at < f.life), ...items].slice(-40));
  };

  const speak = (text: string, warn = false) => setHint((h) => ({ text, warn, key: h.key + 1 }));

  const start = () => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    gameRef.current = createTowerGame();
    setView(gameRef.current);
    setCursor({ round: 0, i: 0 });
    setPicked(null);
    setGained(0);
    setNotice('');
    setSelected(null);
    setHint({ text: '', key: 0, warn: false });
    setFx([]);
    setHit(0);
    setStarted(true);
    setRunning(true);
  };

  const advance = () => {
    setPicked(null);
    setNotice('');
    setGained(0);
    setCursor((c) => (c.i + 1 >= questions.length ? { round: c.round + 1, i: 0 } : { round: c.round, i: c.i + 1 }));
  };

  const answerQuestion = (choice: number) => {
    if (!q || picked !== null || !running || gameRef.current.status !== 'playing') return;
    const correct = choice === q.correctIndex;
    setPicked(choice);
    // Khoá câu theo bộ + từ + chiều hỏi (không chứa đáp án): hỏi lại cùng từ thì không cộng tài nguyên thành phố lần hai.
    useGameStore.getState().answer(correct, 'vocab', { key: `tower:${slug}:${q.word.word}:${q.enToVi ? 'en' : 'vi'}` });
    const prev = gameRef.current;
    const r = answerTower(prev, correct);
    gameRef.current = r.game;
    setView(r.game);
    if (correct) {
      setGained(r.gold);
      setNotice(L(`Đúng! Combo ${r.game.combo}.`, `Correct! Streak ${r.game.combo}.`));
    } else {
      if (frontmost(prev.foes)) {
        setHit((h) => h + 1);
        pushFx([{ kind: 'text', x: CASTLE.x, y: CASTLE.y - 0.3, text: '−1 tim', color: '#FF6B6B', size: 24 }]);
      }
      setNotice(L(`Đáp án là "${q.options[q.correctIndex]}". Một quái đã lọt tới đích!`, `The answer is "${q.options[q.correctIndex]}". One monster reached the end!`));
    }
    // Đủ lâu để "+vàng" bay hết trên thẻ trước khi sang câu mới.
    nextTimer.current = setTimeout(advance, correct ? 1000 : 1100);
  };

  const blockText = (b: Block): string => {
    switch (b) {
      case 'gold': return L(`Cần ${BUILD_COST} vàng. Trả lời đúng để có thêm.`, `Needs ${BUILD_COST} gold. Answer correctly to earn more.`);
      case 'lane': return L('Ô này là đường quái đi. Chọn một ô xanh.', 'That is the monsters\' path. Pick a green cell.');
      case 'occupied': return L('Ô này đã có tháp.', 'A tower already stands here.');
      case 'outside': return L('Ngoài bản đồ.', 'Outside the map.');
      case 'max': return L('Tháp đã lên cấp tối đa.', 'The tower is already at max level.');
      case 'ended': return L('Trận đã kết thúc.', 'The battle is over.');
      default: return L('Không thực hiện được.', 'Cannot do that.');
    }
  };

  const buildAt = () => {
    if (!selected) return;
    const r = buildTower(gameRef.current, selected);
    if (r.block) return speak(blockText(r.block), true);
    gameRef.current = r.game;
    setView(r.game);
    playSfx('flip');
    const c = center(selected);
    pushFx([{ kind: 'burst', x: c.x, y: c.y, colors: ['#FFE14D', '#86EFAC', '#FFFFFF'], count: 14, radius: 58, size: 7, duration: 600 }]);
    speak(L('Đã đặt tháp.', 'Tower built.'));
  };

  const upgradeAt = (towerId: number) => {
    const block = upgradeBlock(gameRef.current, towerId);
    if (block) return speak(blockText(block), true);
    const before = gameRef.current.towers.find((x) => x.id === towerId)!;
    const r = upgradeTower(gameRef.current, towerId);
    gameRef.current = r.game;
    setView(r.game);
    playSfx('flip');
    const c = center(before.cell);
    pushFx([
      { kind: 'burst', x: c.x, y: c.y, colors: ['#FFE14D', '#FFFFFF', '#F59E0B'], count: 22, radius: 84, size: 8, duration: 760 },
      { kind: 'text', x: c.x, y: c.y - 0.4, text: `Cấp ${before.level + 1}!`, color: JUICE.gold, size: 20 },
    ]);
    speak(L('Đã nâng cấp tháp.', 'Tower upgraded.'));
  };

  const pickCell = (cell: Cell) => {
    setSelected(cell);
    if (onLane(cell)) speak(blockText('lane'), true);
    else setHint((h) => ({ ...h, text: '', warn: false }));
  };

  const back = () => router.replace('/quest' as never);
  const secondsLeft = Math.ceil((view.timer * TICK_MS) / 1000);
  const selTower = selected ? towerAt(view, selected) : undefined;
  const selLane = selected ? onLane(selected) : false;
  const buildPreview = selected && !selTower && !selLane ? buildBlock(view, selected) : null;
  const defaultHint = !selected
    ? L('Chọn một ô xanh để đặt tháp, hoặc bấm một tháp để nâng cấp.', 'Pick a green cell to build, or tap a tower to upgrade it.')
    : selTower
      ? L(`Tháp cấp ${selTower.level}.`, `Tower level ${selTower.level}.`)
      : buildPreview === 'gold'
        ? blockText('gold')
        : '';
  const hintText = hint.text || defaultHint;
  const showCard = running && view.status === 'playing' && !!q;
  const liveFx = fx.filter((f) => Date.now() - f.at < f.life);

  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 920, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <BackPill label="Band 9 Quest" onPress={back} />
          {started ? (
            <Text className="font-semi text-label" style={{ color: HUB.muted }}>
              {L('Bộ', 'Deck')}: {deck?.nameVi ?? slug}
            </Text>
          ) : null}
        </View>

        <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -70, width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
            <Aura color={JUICE.gold} size={150} strength={0.25} />
          </View>
          <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: HUB.ink }}>
            {L('Tháp Band', 'Band Tower')}
          </Text>
          <Text className="mt-1 font-sans text-body" style={{ color: HUB.muted }}>
            {L(
              'Trả lời đúng để có vàng, rồi đặt tháp trên ô xanh. Trả lời sai thì một quái lọt tới đích và mất một tim.',
              'Answer correctly for gold, then build towers on green cells. A wrong answer lets one monster reach the end and costs a heart.',
            )}
          </Text>
        </Panel>

        {!started ? (
          <MenuCard slug={slug} onPick={setSlug} playable={playable} words={words.length} onStart={start} />
        ) : (
          <>
            <Panel style={{ marginTop: 14 }} pad={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Shake trigger={view.leaked} amount={6}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {Array.from({ length: TOWER_HEARTS }, (_, i) =>
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
                <Pop key={`g${view.gold}`} from={0.7}>
                  <Text className="font-heavy text-bodyLg" style={{ color: GOLD_INK }}>🪙 {view.gold}</Text>
                </Pop>
                <Text className="font-semi text-label" style={{ color: HUB.ink }}>
                  {L('Sóng', 'Wave')} {view.wave}/{WAVES} ·{' '}
                  {view.phase === 'break' ? L(`nghỉ ${secondsLeft}s`, `break ${secondsLeft}s`) : L(`còn ${view.foes.length} quái`, `${view.foes.length} monsters left`)}
                </Text>
                <Pop key={`c${view.combo}`} from={0.6}>
                  <Text className="font-semi text-label" style={{ color: HUB.muted }}>
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
                      backgroundColor: pressed ? '#E9DCC6' : HUB.raised,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      ...(WEB ? (({ transition: 'transform 120ms ease, background-color 150ms ease' }) as object) : {}),
                    })}
                  >
                    <Text className="font-semi text-body" style={{ color: HUB.ink }}>{running ? L('Tạm dừng', 'Pause') : L('Tiếp tục', 'Resume')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </Panel>

            <Panel style={{ marginTop: 14, alignItems: 'center' }} pad={14}>
              <Board
                view={view}
                geom={geom}
                flowPts={flowPts}
                selected={selected}
                hit={hit}
                fx={liveFx}
                canBuild={view.gold >= BUILD_COST}
                onCell={pickCell}
              />
              <View style={{ marginTop: 12, minHeight: 44, width: '100%', maxWidth: geom.board + FRAME * 2, justifyContent: 'center' }}>
                {view.status !== 'playing' ? null : (
                  <Shake trigger={hint.warn ? hint.key : 0} amount={5}>
                    <Text className="text-center font-sans text-body" style={{ color: hint.warn ? '#B91C1C' : HUB.muted }}>
                      {hintText}
                    </Text>
                  </Shake>
                )}
              </View>
              {view.status !== 'playing' || !selected || selLane ? null : (
                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
                  {selTower ? (
                    selTower.level < MAX_LEVEL ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        label={L(`Nâng cấp lên cấp ${selTower.level + 1} · ${upgradeCost(selTower.level)} vàng`, `Upgrade to level ${selTower.level + 1} · ${upgradeCost(selTower.level)} gold`)}
                        onPress={() => upgradeAt(selTower.id)}
                      />
                    ) : (
                      <Text className="font-sans text-body" style={{ color: HUB.muted }}>{L('Đã cấp tối đa.', 'Max level.')}</Text>
                    )
                  ) : (
                    <Button size="sm" label={L(`Đặt tháp · ${BUILD_COST} vàng`, `Build tower · ${BUILD_COST} gold`)} onPress={buildAt} />
                  )}
                </View>
              )}
            </Panel>

            <View style={{ display: showCard ? 'flex' : 'none' }}>
              {q ? (
                <QuestionCard
                  q={q}
                  index={cursor.i}
                  total={questions.length}
                  picked={picked}
                  wrongKey={view.wrong}
                  gainText={picked !== null && gained > 0 ? `+${gained} vàng` : null}
                  notice={notice}
                  onAnswer={answerQuestion}
                />
              ) : null}
            </View>

            {view.status === 'playing' && !running ? (
              <Panel style={{ marginTop: 14, alignItems: 'center' }} pad={20}>
                <Text className="font-heavy text-sectionTitle" style={{ color: HUB.ink }}>{L('Đang tạm dừng', 'Paused')}</Text>
                <View style={{ marginTop: 12 }}>
                  <Button label={L('Tiếp tục', 'Resume')} iconLeft="play" onPress={() => setRunning(true)} />
                </View>
              </Panel>
            ) : null}
          </>
        )}

        {started && view.status !== 'playing' ? (
          <ResultOverlay
            game={view}
            onAgain={start}
            onOtherDeck={() => {
              if (nextTimer.current) clearTimeout(nextTimer.current);
              setStarted(false);
              setRunning(false);
            }}
            onBack={back}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function MenuCard({ slug, onPick, playable, words, onStart }: { slug: string; onPick: (s: string) => void; playable: boolean; words: number; onStart: () => void }) {
  const { L, en } = useL();
  return (
    <Panel style={{ marginTop: 14, overflow: 'hidden' }} pad={18}>
      <View pointerEvents="none" style={{ position: 'absolute', left: -50, bottom: -80, width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Aura color="#7DD3FC" size={160} strength={0.35} />
      </View>
      <Text className="font-heavy text-sectionTitle" style={{ color: HUB.ink }}>{L('Chọn bộ từ', 'Choose a word deck')}</Text>
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
                borderColor: on ? HUB.gold : 'transparent',
                backgroundColor: on ? HUB.ink : pressed ? '#E9DCC6' : hovered ? HUB.raisedHover : HUB.raised,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                ...(WEB ? (({ transition: 'transform 120ms ease, background-color 150ms ease' }) as object) : {}),
              })}
            >
              <Text className="font-semi text-label" style={{ color: on ? '#FFFDF7' : HUB.ink }}>{en ? t.name : t.nameVi}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text className="mt-3 font-sans text-label" style={{ color: HUB.muted }}>
        {playable
          ? L(`Bộ này có ${words} từ. Câu hỏi lấy từ bộ này.`, `This deck has ${words} words. Questions come from it.`)
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
  flowPts,
  selected,
  hit,
  fx,
  canBuild,
  onCell,
}: {
  view: TowerGame;
  geom: Geom;
  flowPts: Pt[];
  selected: Cell | null;
  hit: number;
  fx: Fx[];
  canBuild: boolean;
  onCell: (cell: Cell) => void;
}) {
  const { L } = useL();
  const g = geom;
  const B = g.board;

  const lines: React.ReactNode[] = [];
  for (let k = 0; k <= COLS; k += 1) {
    lines.push(<View key={`v${k}`} pointerEvents="none" style={{ position: 'absolute', left: k * g.step - g.gap / 2 - 0.5, top: 0, width: 1, height: B, ...GRID_LINE }} />);
  }
  for (let k = 0; k <= ROWS; k += 1) {
    lines.push(<View key={`h${k}`} pointerEvents="none" style={{ position: 'absolute', top: k * g.step - g.gap / 2 - 0.5, left: 0, height: 1, width: B, ...GRID_LINE }} />);
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const cell = { c, r };
      const lane = onLane(cell);
      const tower = towerAt(view, cell);
      const isSel = selected !== null && selected.c === c && selected.r === r;
      const start = LANE[0]!.c === c && LANE[0]!.r === r;
      const end = LANE[LANE.length - 1]!.c === c && LANE[LANE.length - 1]!.r === r;
      const dashed = !lane && !tower && !isSel && canBuild;
      const tone = lane
        ? { backgroundColor: '#E2C48F', borderColor: '#F3DDB2', borderBottomColor: '#A97F4A' }
        : { backgroundColor: '#3B7A4D', borderColor: dashed ? 'rgba(255,255,255,0.5)' : '#5FA371', borderBottomColor: '#24502F' };
      cells.push(
        <Pressable
          key={`${c}-${r}`}
          accessibilityRole="button"
          accessibilityLabel={lane ? L('Đường quái đi', 'Monster path') : tower ? L(`Tháp cấp ${tower.level}`, `Tower level ${tower.level}`) : L('Ô trống', 'Empty cell')}
          onPress={() => onCell(cell)}
          style={({ pressed }: { pressed: boolean }) => ({
            position: 'absolute',
            left: c * g.step,
            top: r * g.step,
            width: g.cell,
            height: g.cell,
            borderRadius: Math.round(g.cell * 0.24),
            borderWidth: isSel ? 3 : 1.5,
            borderBottomWidth: 4.5,
            borderStyle: dashed ? 'dashed' : 'solid',
            alignItems: 'center',
            justifyContent: 'center',
            ...tone,
            borderColor: isSel ? '#FFE14D' : tone.borderColor,
            transform: [{ scale: pressed ? 0.93 : 1 }],
            ...(WEB ? (({ transition: 'transform 120ms ease' }) as object) : {}),
          })}
        >
          {isSel ? <Aura color="#FFE14D" size={g.cell + 6} strength={0.9} /> : null}
          {start ? <Text className="font-heavy" style={{ fontSize: 10, color: '#6B4A1E' }}>{L('Vào', 'In')}</Text> : null}
          {end ? <Aura color="#F87171" size={g.cell * 0.9} strength={0.5} /> : null}
          {end ? <Text style={{ fontSize: g.cell * 0.46 }}>🏰</Text> : null}
        </Pressable>,
      );
    }
  }

  const towers = view.towers.map((t) => {
    const color = LEVEL_COLOR[t.level - 1]!;
    return (
      <View
        key={t.id}
        pointerEvents="none"
        style={{ position: 'absolute', left: t.cell.c * g.step, top: t.cell.r * g.step, width: g.cell, height: g.cell, alignItems: 'center', justifyContent: 'center' }}
      >
        <Aura color={color} size={g.cell * 0.92} strength={0.5} />
        <Pop key={`lv${t.level}`} from={0.2}>
          <Text style={{ fontSize: g.cell * 0.44 }}>🏹</Text>
        </Pop>
        <View style={{ position: 'absolute', bottom: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: 'rgba(15,29,51,0.85)' }}>
          <Text className="font-heavy" style={{ fontSize: 10, color }}>
            {L('Cấp', 'Lv')} {t.level}
          </Text>
        </View>
      </View>
    );
  });

  const foes = view.foes.map((f) => {
    const p = pointAt(f.pos);
    const size = f.boss ? Math.round(g.foe * 1.3) : g.foe;
    const cx = px(g, p.x);
    const cy = px(g, p.y);
    const pct = Math.max(0, Math.min(1, f.hp / f.maxHp)) * 100;
    return (
      <Glide key={f.id} x={cx - size / 2} y={cy - size / 2} duration={TICK_MS}>
        <Pop from={0.3}>
          <Bob amp={2} period={320} style={{ width: size, height: size }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: f.color, borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: size * 0.18, top: size * 0.14, width: size * 0.28, height: size * 0.2, borderRadius: size * 0.14, backgroundColor: 'rgba(255,255,255,0.6)' }} />
            </View>
          </Bob>
        </Pop>
        <View style={{ position: 'absolute', left: size * 0.14, top: size - 1, width: size * 0.72, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <View style={{ position: 'absolute', left: 0, top: -9, width: size, height: 4, borderRadius: 2, backgroundColor: 'rgba(15,29,51,0.75)', overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: 4, backgroundColor: '#4ADE80' }} />
        </View>
        {f.boss ? <Text style={{ position: 'absolute', left: size / 2 - 8, top: -18, fontSize: 14 }}>👑</Text> : null}
      </Glide>
    );
  });

  return (
    <Shake trigger={hit} amount={7}>
      <LinearGradient
        colors={['#1F3C6B', '#0E1B33']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ alignSelf: 'center', padding: FRAME, borderRadius: 22, borderWidth: 1, borderColor: '#2D4A78', ...(glowWeb('0 18px 40px rgba(15,29,51,0.35)') as object) }}
      >
        <View style={{ width: B, height: B }}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: B, height: B, alignItems: 'center', justifyContent: 'center' }}>
            <Aura color="#3B82F6" size={B * 0.9} strength={0.35} />
          </View>
          {lines}
          {cells}
          <Flow points={flowPts} color="#FFF6D0" spacing={12} size={5} />
          {towers}
          {foes}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: B, height: B, overflow: 'hidden' }}>
            {fx.map((f) => {
              if (f.kind === 'bolt') return <Bolt key={f.id} from={{ x: px(g, f.from.x), y: px(g, f.from.y) }} to={{ x: px(g, f.to.x), y: px(g, f.to.y) }} color={f.color} />;
              if (f.kind === 'burst')
                return (
                  <View key={f.id} pointerEvents="none" style={{ position: 'absolute', left: px(g, f.x), top: px(g, f.y), width: 0, height: 0 }}>
                    <Burst seed={String(f.id)} colors={f.colors} count={f.count} radius={f.radius} size={f.size} duration={f.duration} />
                  </View>
                );
              if (f.kind === 'text')
                return (
                  <View key={f.id} pointerEvents="none" style={{ position: 'absolute', left: px(g, f.x), top: px(g, f.y), width: 0, height: 0, alignItems: 'center' }}>
                    <FloatTag text={f.text} color={f.color} size={f.size} />
                  </View>
                );
              return null;
            })}
            {fx.map((f) => (f.kind === 'banner' ? <Banner key={f.id} text={f.text} top={B * 0.36} /> : null))}
          </View>
          <Flash trigger={hit} edge color="#F87171" width={8} radius={16} duration={560} />
        </View>
      </LinearGradient>
    </Shake>
  );
}

function QuestionCard({
  q,
  index,
  total,
  picked,
  wrongKey,
  gainText,
  notice,
  onAnswer,
}: {
  q: DuelQuestion;
  index: number;
  total: number;
  picked: number | null;
  wrongKey: number;
  gainText: string | null;
  notice: string;
  onAnswer: (i: number) => void;
}) {
  const { L } = useL();
  return (
    <Shake trigger={wrongKey} amount={8}>
      <View className="mt-4 rounded-[22px] bg-white p-5" style={CARD}>
        <Text className="font-semi text-label uppercase tracking-[1px]" style={{ color: HUB.muted }}>
          {L('Câu', 'Question')} {index + 1}/{total} · {q.enToVi ? L('chọn nghĩa đúng', 'choose the meaning') : L('chọn từ đúng', 'choose the word')}
        </Text>
        <Text className="mt-3 font-heavy text-pageTitle text-ink">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
        {q.enToVi && q.word.example ? <Text className="mt-2 font-sans text-body" style={{ color: HUB.muted }}>{q.word.example}</Text> : null}
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
        {gainText ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 22, alignItems: 'center' }}>
            <Burst seed={`gain:${q.word.word}`} colors={['#86EFAC', '#FFE14D', '#FFFFFF']} count={14} radius={110} size={7} duration={700} />
            <FloatTag text={gainText} color="#B45309" size={26} />
          </View>
        ) : null}
        <Flash trigger={wrongKey} edge color="#EF4444" width={4} radius={22} duration={560} />
        {notice ? <Text className="mt-3 font-semi text-body" style={{ color: '#B94A70' }}>{notice}</Text> : null}
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
      <Text className="font-semi text-bodyLg text-ink">{label}</Text>
    </Pressable>
  );
}

/** Màn kết thúc: phủ tối màn hình, con dấu THẮNG hoặc HẾT TIM, rồi thống kê. Thắng thì có pháo giấy. */
function ResultOverlay({ game, onAgain, onOtherDeck, onBack }: { game: TowerGame; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
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
      {won ? <Confetti seed={`won-${game.ticks}`} silent /> : null}
    </View>
  );
}

function ResultCard({ game, onAgain, onOtherDeck, onBack }: { game: TowerGame; onAgain: () => void; onOtherDeck: () => void; onBack: () => void }) {
  const { L } = useL();
  const won = game.status === 'won';
  const stats = [
    { label: L('Đúng', 'Correct'), v: game.correct },
    { label: L('Sai', 'Wrong'), v: game.wrong },
    { label: L('Hạ', 'Defeated'), v: game.killed },
    { label: L('Lọt', 'Leaked'), v: game.leaked },
    { label: L('Tháp', 'Towers'), v: game.towers.length },
  ];
  return (
    <View style={{ width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#FFFDF7', padding: 22, alignItems: 'center', ...(glowWeb('0 24px 60px rgba(0,0,0,0.5)') as object) }}>
      <Pop from={0.2}>
        <Text style={{ fontSize: 56 }}>{won ? '🏆' : '💥'}</Text>
      </Pop>
      <View style={{ marginTop: 10 }}>
        <Stamp color={won ? JUICE.good : JUICE.bad}>
          <Text className="font-heavy" style={{ fontSize: 26, letterSpacing: 2, color: won ? '#15803D' : '#B91C1C' }}>
            {won ? L('THẮNG!', 'WON!') : L('HẾT TIM', 'NO HEARTS')}
          </Text>
        </Stamp>
      </View>
      <Text className="mt-3 text-center font-heavy text-pageTitle text-ink">
        {won ? L('Bạn giữ được tháp!', 'You held the tower!') : L('Quái đã phá tháp', 'The monsters broke through')}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {stats.map((s, i) => (
          <Rise key={s.label} index={i}>
            <View style={{ minWidth: 62, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F4EDE1' }}>
              <Text className="font-heavy" style={{ fontSize: 20, color: HUB.ink }}>{s.v}</Text>
              <Text className="font-semi" style={{ fontSize: 12, color: HUB.muted }}>{s.label}</Text>
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
