import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type AnimatedStyle } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Confetti } from '@/components/motion/Confetti';
import { Button } from '@/components/ui';
import { Aura, Burst, FloatText, JUICE, Pop, Rise, Shake, Stamp } from '@/components/game/juice';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { buildDuel, isRoomCode, type DuelQuestion } from '@/services/duel/duel';
import { SURVIVAL_LIVES, type ShowMode, type ShowState } from '@/services/duel/hosted';
import { useShowRoom, type ShowRole } from '@/services/duel/useShowRoom';
import { displayableName } from '@/services/gamification/display-name';
import { useAuthStore } from '@/store/useAuthStore';
import { useL } from '@/i18n/useL';

/**
 * ĐẤU CHIẾU LỚP (kiểu Kahoot). Một route, ba vai:
 *   - `?host=1`: chủ phòng — chọn luật, bắt đầu, bấm "Câu tiếp", xem kết quả;
 *   - `?view=screen`: màn chiếu — đặt lên máy chiếu, không chọn đáp án;
 *   - không tham số: học sinh — chọn một trong bốn ô màu trên điện thoại.
 *
 * Mọi màn hình đều vẽ lại từ `state` do chủ phòng phát, nên không máy nào tự tính điểm.
 * Hiệu ứng (nổ, rung, bục vinh danh, pháo giấy) chỉ đổi cách hiện, không đổi luật.
 */

const TILES = [
  { color: '#E21B3C', dark: '#9E0F28', shape: '▲' },
  { color: '#1368CE', dark: '#0B4A99', shape: '◆' },
  { color: '#D89E00', dark: '#9A6F00', shape: '●' },
  { color: '#26890C', dark: '#1A5E08', shape: '■' },
] as const;

const EASE = Easing.out(Easing.cubic);

/** Nền có độ sâu: gradient chéo. Web dùng backgroundImage; native rơi về màu phẳng. */
function gradient(a: string, b: string): ViewStyle {
  return { backgroundColor: a, backgroundImage: `linear-gradient(135deg, ${a}, ${b})` } as ViewStyle;
}

export default function ShowRoute() {
  const params = useLocalSearchParams<{ code: string; deck?: string; host?: string; view?: string }>();
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const code = (params.code ?? '').toUpperCase();
  const role: ShowRole = params.host === '1' ? 'host' : params.view === 'screen' ? 'screen' : 'player';
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const [selfId] = useState(() => `${role[0]}${Math.random().toString(36).slice(2, 10)}`);
  const me = useMemo(() => {
    const named = displayableName((profile as { display_name?: string | null } | null)?.display_name ?? null);
    if (role === 'host') return { id: selfId, name: named ?? L('Chủ phòng', 'Host') };
    if (role === 'screen') return { id: selfId, name: L('Màn chiếu', 'Screen') };
    return { id: selfId, name: named ?? L(`Khách ${selfId.slice(-4).toUpperCase()}`, `Guest ${selfId.slice(-4).toUpperCase()}`) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile, selfId, role]);

  const deckSlug = params.deck ?? '';
  const hostDeck = useStudyDeck(role === 'host' ? deckSlug : '');
  const room = useShowRoom(isRoomCode(code) ? code : '', me, role, hostDeck?.words, deckSlug, 'show');
  const state = room.state;
  // Máy học sinh và màn chiếu lấy bộ từ theo tên bộ mà chủ phòng đã chọn.
  const deck = useStudyDeck(state?.deck || deckSlug);
  const questions = useMemo(
    () => (state && state.seed && deck ? buildDuel(deck.words, state.seed, state.total) : []),
    [state, deck],
  );

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  if (!isRoomCode(code)) {
    return (
      <Screen>
        <Text className="mt-10 text-center font-heavy text-sectionTitle text-ink">{L('Mã phòng không hợp lệ.', 'Invalid room code.')}</Text>
        <Button className="mt-4 self-center" label={L('Về sảnh đấu', 'Back to lobby')} onPress={() => router.replace('/duel' as never)} />
      </Screen>
    );
  }

  const link = Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/duel/show/${code}` : `/duel/show/${code}`;
  const phase = state?.phase ?? 'lobby';
  const big = role === 'screen' ? true : width >= 900;
  const q = state && state.index >= 0 ? questions[state.index] : undefined;
  const alive = !!state && state.mode === 'survival' ? (state.lives[me.id] ?? 0) > 0 : true;
  const inRoster = !!state && state.roster.includes(me.id);
  const left = state ? Math.max(0, Math.ceil((state.at + state.limit - clock) / 1000)) : 0;
  const winnerId = phase === 'done' && state?.ranking ? state.ranking[0] : undefined;
  const iWon = !!winnerId && winnerId === me.id;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: role === 'screen' ? 1180 : 860 }}>
        {/* Thanh trên: mã phòng + số người */}
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Pressable onPress={() => router.replace('/duel' as never)} className="rounded-pill bg-white/85 px-4 py-2">
            <Text className="font-semi text-body text-ink">{L('Sảnh đấu', 'Duel lobby')}</Text>
          </Pressable>
          <View className="flex-row items-center gap-2 rounded-pill px-4 py-2" style={{ ...gradient('#0F1D33', '#22345A'), boxShadow: '0 6px 18px rgba(15,29,51,0.35)' } as ViewStyle}>
            <Text className="font-heavy" style={{ color: '#F3D9A0', letterSpacing: 4 }}>{code}</Text>
            <Text className="font-sans text-label" style={{ color: '#D7DCE8' }}>· {room.players.length} {L('người chơi', 'players')}</Text>
          </View>
        </View>

        {room.status === 'offline' ? (
          <Text className="mt-4 rounded-xl px-3 py-2 font-semi text-label" style={{ backgroundColor: '#FFF4D7', color: '#805D1D' }}>
            {L('Chưa kết nối được máy chủ thời gian thực.', 'Not connected to the live server.')}
          </Text>
        ) : null}

        {/* ------------------------------------------------ sảnh chờ */}
        {phase === 'lobby' || !state ? (
          <Lobby
            role={role}
            code={code}
            link={link}
            players={room.players.map((p) => p.name)}
            screens={room.screens}
            deckName={deck ? (en && deck.kind !== 'custom' ? deck.name : deck.nameVi) : ''}
            canStart={room.players.length > 0 && !!hostDeck && (hostDeck.words?.length ?? 0) >= 4}
            onStart={(mode: ShowMode) => room.start(mode, deckSlug)}
            big={big}
          />
        ) : null}

        {/* ------------------------------------------------ đếm ngược */}
        {phase === 'counting' ? (
          <Panel tone="navy">
            <Text className="font-sans text-bodyLg" style={{ color: '#D7DCE8' }}>{L('Chuẩn bị…', 'Get ready…')}</Text>
            <Pop key={Math.max(1, Math.ceil((state!.at - clock) / 1000))} from={1.8}>
              <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: big ? 130 : 88, lineHeight: big ? 140 : 96, textShadowColor: 'rgba(255,200,80,0.6)', textShadowRadius: 24 }}>
                {Math.max(1, Math.ceil((state!.at - clock) / 1000))}
              </Text>
            </Pop>
            {state!.mode === 'survival' ? (
              <Text className="font-strong text-body" style={{ color: '#F3D9A0' }}>{L(`Sinh tồn · ${SURVIVAL_LIVES} mạng mỗi người`, `Survival · ${SURVIVAL_LIVES} lives each`)}</Text>
            ) : null}
          </Panel>
        ) : null}

        {/* ------------------------------------------------ câu hỏi */}
        {phase === 'question' && q ? (
          <QuestionPanel
            key={`q-${state!.index}`}
            role={role}
            state={state!}
            q={q}
            left={left}
            big={big}
            onPick={(i: number) => room.answer(i)}
            canAnswer={role === 'player' && inRoster && alive}
            onReveal={() => room.advance()}
            selfLives={state!.lives[me.id]}
            eliminated={!alive && inRoster}
            notInRound={role === 'player' && !inRoster}
            playerAnswered={state!.answered.includes(me.id)}
            expected={state!.roster.filter((id) => state!.mode !== 'survival' || (state!.lives[id] ?? 0) > 0).length}
          />
        ) : null}

        {/* ------------------------------------------------ đáp án */}
        {phase === 'reveal' && q && state?.reveal ? (
          <RevealPanel
            key={`r-${state.index}`}
            role={role}
            state={state}
            q={q}
            big={big}
            selfId={me.id}
            onNext={() => room.advance()}
            last={isLastQuestion(state)}
          />
        ) : null}

        {/* ------------------------------------------------ kết thúc */}
        {phase === 'done' && state ? (
          <>
            {iWon || role === 'screen' ? <Confetti seed={`${code}-${state.seed}`} pieces={140} /> : null}
            <RankingPanel
              role={role}
              state={state}
              selfId={me.id}
              big={big}
              onAgain={() => room.start(state.mode, state.deck)}
              canAgain={role === 'host' && room.players.length > 0 && !!hostDeck}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function isLastQuestion(s: ShowState): boolean {
  return s.index + 1 >= s.total || (s.mode === 'survival' && s.roster.filter((id) => (s.lives[id] ?? 0) > 0).length <= 1);
}

/** Thanh có màu chạy mượt tới `pct` (0–1). Dùng cho tiến độ thời gian và số người chọn. */
function GrowBar({ pct, color, track = 'rgba(0,0,0,0.08)', height = 8 }: { pct: number; color: string; track?: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, pct)), { duration: 320, easing: EASE });
  }, [pct, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: 999, backgroundColor: color }, st as AnimatedStyle<ViewStyle>]} />
    </View>
  );
}

/** Khung trắng hoặc chàm có viền và bóng; khung chàm có vòng sáng phía sau. */
function Panel({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'navy' }) {
  const navy = tone === 'navy';
  return (
    <View className="mt-5 items-center gap-3 rounded-[24px] p-6" style={{ ...(navy ? gradient('#16213E', '#0B1426') : { backgroundColor: '#FFFFFF' }), boxShadow: navy ? '0 18px 40px rgba(11,20,38,0.45)' : '0 10px 30px rgba(94,72,35,0.12)', overflow: 'hidden' } as ViewStyle}>
      {navy ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 120, alignItems: 'center' }}>
          <Aura color="#FDE68A" size={220} strength={0.3} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Lobby({
  role,
  code,
  link,
  players,
  screens,
  deckName,
  canStart,
  onStart,
  big,
}: {
  role: ShowRole;
  code: string;
  link: string;
  players: string[];
  screens: number;
  deckName: string;
  canStart: boolean;
  onStart: (mode: ShowMode) => void;
  big: boolean;
}) {
  const { L } = useL();
  const [mode, setMode] = useState<ShowMode>('show');
  return (
    <Panel tone="navy">
      <Text className="font-heavy" style={{ color: '#F3D9A0', fontSize: big ? 30 : 22 }}>{L('VÀO BẰNG MÃ', 'JOIN WITH CODE')}</Text>
      <Pop from={0.3}>
        <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: big ? 110 : 64, letterSpacing: 12, textShadowColor: 'rgba(243,217,160,0.7)', textShadowRadius: 22 }}>{code}</Text>
      </Pop>
      <Text selectable className="font-sans text-body" style={{ color: '#D7DCE8' }}>{link}</Text>
      {deckName ? <Text className="font-strong text-body" style={{ color: '#F3D9A0' }}>{L('Bộ từ:', 'Deck:')} {deckName}</Text> : null}

      <View className="w-full flex-row flex-wrap justify-center gap-2">
        {players.length ? (
          players.map((name, i) => (
            <Pop key={`${name}-${i}`} from={0.2} delay={i * 60}>
              <View className="rounded-pill px-4 py-2" style={{ ...gradient('#FFF4D7', '#F8DFA0'), boxShadow: '0 4px 12px rgba(243,217,160,0.45)' } as ViewStyle}>
                <Text className="font-heavy text-label" style={{ color: '#5B4316' }}>{name}</Text>
              </View>
            </Pop>
          ))
        ) : (
          <Text className="font-sans text-body" style={{ color: '#AEB6C7' }}>{L('Chờ học sinh vào…', 'Waiting for students…')}</Text>
        )}
      </View>
      {role === 'screen' ? null : <Text className="font-sans text-label" style={{ color: '#AEB6C7' }}>{screens ? L(`${screens} màn chiếu đang mở`, `${screens} screen(s) connected`) : ''}</Text>}

      {role === 'host' ? (
        <>
          <View className="flex-row flex-wrap justify-center gap-2">
            <ModeChip label={L('Chiếu lớp: tính điểm', 'Classic: points')} on={mode === 'show'} onPress={() => setMode('show')} />
            <ModeChip label={L(`Sinh tồn: ${SURVIVAL_LIVES} mạng`, `Survival: ${SURVIVAL_LIVES} lives`)} on={mode === 'survival'} onPress={() => setMode('survival')} />
          </View>
          <Button label={L('Bắt đầu', 'Start')} iconRight="arrow-right" disabled={!canStart} onPress={() => onStart(mode)} />
          {!canStart ? <Text className="font-sans text-label" style={{ color: '#AEB6C7' }}>{L('Cần ít nhất một học sinh và bộ từ có từ 4 từ trở lên.', 'Needs at least one student and a deck of 4+ words.')}</Text> : null}
        </>
      ) : null}
      {role === 'player' ? <Text className="font-strong text-body" style={{ color: '#FFFFFF' }}>{L('Chờ chủ phòng bắt đầu…', 'Waiting for the host to start…')}</Text> : null}
    </Panel>
  );
}

function ModeChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={on}
      className="rounded-pill px-4 py-2"
      style={{ ...(on ? gradient('#F3D9A0', '#E0B45E') : { backgroundColor: 'rgba(255,255,255,0.12)' }), transform: [{ scale: on ? 1.05 : 1 }] } as ViewStyle}
    >
      <Text className="font-strong text-label" style={{ color: on ? '#2B1D05' : '#FFFFFF' }}>{label}</Text>
    </Pressable>
  );
}

function QuestionPanel({
  role,
  state,
  q,
  left,
  big,
  onPick,
  canAnswer,
  onReveal,
  selfLives,
  eliminated,
  notInRound,
  playerAnswered,
  expected,
}: {
  role: ShowRole;
  state: ShowState;
  q: DuelQuestion;
  left: number;
  big: boolean;
  onPick: (i: number) => void;
  canAnswer: boolean;
  onReveal: () => void;
  selfLives: number | undefined;
  eliminated: boolean;
  notInRound: boolean;
  playerAnswered: boolean;
  expected: number;
}) {
  const { L } = useL();
  const prompt = q.enToVi ? q.word.word : q.word.meaningVi;
  const pct = Math.max(0, Math.min(1, left / Math.max(1, state.limit / 1000)));
  const urgent = left <= 3;
  return (
    <Panel>
      <View className="w-full flex-row items-center justify-between">
        <Text className="font-strong text-label" style={{ color: '#6B7280' }}>{L('Câu', 'Question')} {state.index + 1}/{state.total}</Text>
        <Pop key={`t-${left}`} from={urgent ? 1.5 : 1.15}>
          <Text className="font-heavy" style={{ fontSize: big ? 40 : 30, color: urgent ? '#E21B3C' : '#0F1D33' }}>{left}s</Text>
        </Pop>
      </View>
      <GrowBar pct={pct} color={urgent ? '#E21B3C' : '#F59E0B'} track="#F0EBE2" height={10} />

      <Rise key={`p-${state.index}`}>
        <Text className="text-center font-heavy text-ink" style={{ fontSize: big ? 60 : 38 }}>{prompt}</Text>
      </Rise>
      <Text className="font-sans text-body" style={{ color: '#6B7280' }}>{q.enToVi ? L('Chọn nghĩa đúng', 'Pick the right meaning') : L('Chọn từ tiếng Anh', 'Pick the English word')}</Text>

      {role === 'player' ? (
        <>
          {state.mode === 'survival' ? <Hearts lives={selfLives ?? 0} /> : null}
          {notInRound ? <Text className="font-strong text-body" style={{ color: '#6B7280' }}>{L('Bạn vào sau ván này nên chỉ xem.', 'You joined after the round started, so you can only watch.')}</Text> : null}
          {eliminated ? (
            <Stamp color="#B42318">
              <Text className="font-heavy" style={{ color: '#B42318', fontSize: 18 }}>{L('BẠN ĐÃ BỊ LOẠI', "YOU'RE OUT")}</Text>
            </Stamp>
          ) : null}
        </>
      ) : null}

      {role === 'player' && canAnswer && !playerAnswered ? (
        <Tiles options={q.options} onPick={onPick} disabled={false} big={big} />
      ) : role === 'player' ? (
        playerAnswered ? (
          <Pop>
            <View className="items-center gap-2 py-4">
              <Aura color="#22C55E" size={120} strength={0.8} />
              <Text className="font-heavy text-sectionTitle" style={{ color: '#15945A' }}>{L('Đã gửi!', 'Sent!')}</Text>
              <Text className="font-sans text-body" style={{ color: '#6B7280' }}>{L('Chờ các bạn khác…', 'Waiting for others…')}</Text>
            </View>
          </Pop>
        ) : null
      ) : (
        <Tiles options={q.options} onPick={() => undefined} disabled big={big} />
      )}

      {role !== 'player' ? (
        <View className="w-full gap-2">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="font-sans text-body" style={{ color: '#6B7280' }}>{L(`Đã trả lời: ${state.answered.length}/${expected}`, `Answered: ${state.answered.length}/${expected}`)}</Text>
            {role === 'host' ? <Button size="sm" variant="outline" label={L('Chốt đáp án', 'Reveal answer')} onPress={onReveal} /> : null}
          </View>
          <GrowBar pct={expected ? state.answered.length / expected : 0} color="#22C55E" track="#EAF7EF" height={6} />
        </View>
      ) : null}
    </Panel>
  );
}

/** Mạng còn lại: tim đầy là đỏ, tim đã mất là xám; đổi số thì tim vừa mất nảy lên. */
function Hearts({ lives }: { lives: number }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: SURVIVAL_LIVES }, (_, i) => {
        const on = i < lives;
        return (
          <Pop key={`${i}-${on}`} from={on ? 1.6 : 1}>
            <Text style={{ fontSize: 26, color: on ? '#E21B3C' : '#CBD2DC' }}>♥</Text>
          </Pop>
        );
      })}
    </View>
  );
}

function Tiles({ options, onPick, disabled, big }: { options: string[]; onPick: (i: number) => void; disabled: boolean; big: boolean }) {
  return (
    <View className="w-full flex-row flex-wrap gap-3">
      {options.map((opt, i) => {
        const t = TILES[i] ?? TILES[0];
        return (
          <Pressable
            key={`${i}-${opt}`}
            disabled={disabled}
            onPress={() => onPick(i)}
            accessibilityRole="button"
            accessibilityLabel={opt}
            className="min-w-[200px] flex-1 flex-row items-center gap-3 rounded-2xl px-5"
            style={{
              ...gradient(t.color, t.dark),
              minHeight: big ? 116 : 90,
              opacity: disabled ? 0.92 : 1,
              boxShadow: `0 8px 0 ${t.dark}, 0 14px 24px rgba(0,0,0,0.18)`,
            } as ViewStyle}
          >
            <Text style={{ color: '#FFFFFF', fontSize: big ? 34 : 26, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 }}>{t.shape}</Text>
            <Text className="flex-1 font-heavy" numberOfLines={3} style={{ color: '#FFFFFF', fontSize: big ? 24 : 19, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 3 }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RevealPanel({
  role,
  state,
  q,
  big,
  selfId,
  onNext,
  last,
}: {
  role: ShowRole;
  state: ShowState;
  q: DuelQuestion;
  big: boolean;
  selfId: string;
  onNext: () => void;
  last: boolean;
}) {
  const { L } = useL();
  const r = state.reveal!;
  const total = Math.max(1, r.counts.reduce((a, b) => a + b, 0));
  const mine = r.correct.includes(selfId);
  const elim = r.eliminated.includes(selfId);
  return (
    <Panel>
      <Text className="font-strong text-label" style={{ color: '#6B7280' }}>{L('Đáp án', 'Answer')} {state.index + 1}/{state.total}</Text>
      <Rise>
        <Text className="text-center font-heavy text-ink" style={{ fontSize: big ? 46 : 30 }}>{q.enToVi ? `${q.word.word} = ${q.word.meaningVi}` : `${q.word.meaningVi} = ${q.word.word}`}</Text>
      </Rise>
      <View className="w-full flex-row flex-wrap gap-3">
        {q.options.map((opt, i) => {
          const ok = i === r.correctIndex;
          const n = r.counts[i] ?? 0;
          const t = TILES[i] ?? TILES[0];
          return (
            <View key={`${i}-${opt}`} className="min-w-[200px] flex-1" style={{ opacity: ok ? 1 : 0.42 }}>
              {ok ? (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <Burst seed={`${state.seed}-${state.index}`} colors={[t.color, '#FFFFFF', '#FFE14D']} count={22} radius={150} size={10} />
                </View>
              ) : null}
              <Pop from={ok ? 1.25 : 1}>
                <View className="justify-center gap-2 rounded-2xl px-5 py-3" style={{ ...(ok ? gradient(t.color, t.dark) : { backgroundColor: '#EEE9E0' }), minHeight: big ? 100 : 80, boxShadow: ok ? `0 10px 26px ${t.dark}88` : undefined } as ViewStyle}>
                  <Text className="font-heavy" style={{ color: ok ? '#FFFFFF' : '#0F1D33', fontSize: big ? 21 : 17 }}>
                    {t.shape} {opt} {ok ? '✓' : ''}
                  </Text>
                  <GrowBar pct={n / total} color={ok ? '#FFFFFF' : '#8A8F98'} track={ok ? 'rgba(255,255,255,0.35)' : '#DCD5C7'} height={6} />
                  <Text className="font-sans text-label" style={{ color: ok ? '#FFFFFF' : '#5B6070' }}>{n} {L('bạn chọn', 'chose')}</Text>
                </View>
              </Pop>
            </View>
          );
        })}
      </View>

      {role === 'player' ? (
        elim ? (
          <Shake trigger={state.index}>
            <Stamp color="#7F1D1D">
              <Text className="font-heavy" style={{ color: '#7F1D1D', fontSize: 20 }}>{L('BẠN BỊ LOẠI', "YOU'RE OUT")}</Text>
            </Stamp>
          </Shake>
        ) : mine ? (
          <Pop from={1.6}>
            <Stamp color="#15945A">
              <Text className="font-heavy" style={{ color: '#15945A', fontSize: 20 }}>{L('ĐÚNG! +điểm', 'CORRECT! +points')}</Text>
            </Stamp>
          </Pop>
        ) : (
          <Shake trigger={state.index}>
            <Stamp color="#B42318">
              <Text className="font-heavy" style={{ color: '#B42318', fontSize: 20 }}>{L('CHƯA ĐÚNG', 'NOT THIS TIME')}</Text>
            </Stamp>
          </Shake>
        )
      ) : null}

      {role === 'host' ? (
        <View className="w-full flex-row flex-wrap items-center justify-between gap-2">
          {state.mode === 'survival' && r.eliminated.length ? (
            <Shake trigger={state.index}>
              <Text className="font-strong text-label" style={{ color: '#B42318' }}>{L('Bị loại: ', 'Out: ')}{r.eliminated.map((id) => state.names[id] ?? '—').join(', ')}</Text>
            </Shake>
          ) : <View />}
          <Button label={last ? L('Xem kết quả', 'See results') : L('Câu tiếp', 'Next question')} iconRight="arrow-right" onPress={onNext} />
        </View>
      ) : null}
    </Panel>
  );
}

/** Bục vinh danh: ba người đầu, hạng 1 ở giữa và cao nhất, bục cao lên dần khi xuất hiện. */
function Podium({ names, scores, ids }: { names: Record<string, string>; scores: Record<string, number>; ids: string[] }) {
  const order = [ids[1], ids[0], ids[2]];
  const heights = [96, 136, 72];
  const colors: [string, string][] = [['#CBD5E1', '#94A3B8'], ['#FDE68A', '#F59E0B'], ['#FDBA74', '#C2410C']];
  return (
    <View className="w-full flex-row items-end justify-center gap-3" style={{ minHeight: 210 }}>
      {order.map((id, col) => {
        if (!id) return <View key={`e-${col}`} style={{ width: 96 }} />;
        const rank = col === 1 ? 1 : col === 0 ? 2 : 3;
        const h = heights[col] ?? 80;
        const [a, b] = colors[rank - 1] ?? (colors[2] as [string, string]);
        return (
          <View key={id} className="items-center" style={{ width: 110 }}>
            {rank === 1 ? <Aura color="#FACC15" size={120} strength={1} /> : null}
            <Pop from={0.3} delay={rank === 1 ? 500 : rank === 2 ? 250 : 0}>
              <Text className="mb-1 font-heavy text-center text-label" numberOfLines={1} style={{ color: '#0F1D33' }}>{names[id] ?? '—'}</Text>
              <Text className="mb-2 text-center font-heavy" style={{ color: '#A46D12' }}>{scores[id] ?? 0}</Text>
            </Pop>
            <GrowPillar height={h} colors={[a, b]} delay={rank === 1 ? 300 : 120} label={String(rank)} />
          </View>
        );
      })}
    </View>
  );
}

/** Cột bục cao dần từ 0 tới `height`, có nhãn hạng ở đỉnh. */
function GrowPillar({ height, colors, delay, label }: { height: number; colors: [string, string]; delay: number; label: string }) {
  const h = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      h.value = withTiming(height, { duration: 700, easing: EASE });
    }, delay);
    return () => clearTimeout(t);
  }, [delay, height, h]);
  const st = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <Animated.View style={[{ width: 110, borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8, ...gradient(colors[0], colors[1]), boxShadow: '0 -4px 14px rgba(0,0,0,0.12)' } as ViewStyle, st as AnimatedStyle<ViewStyle>]}>
      <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 26, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 4 }}>{label}</Text>
    </Animated.View>
  );
}

function RankingPanel({
  role,
  state,
  selfId,
  big,
  onAgain,
  canAgain,
}: {
  role: ShowRole;
  state: ShowState;
  selfId: string;
  big: boolean;
  onAgain: () => void;
  canAgain: boolean;
}) {
  const { L } = useL();
  const order = state.ranking ?? [];
  const winner = order[0];
  const mine = order.indexOf(selfId);
  return (
    <Panel tone="navy">
      <Pop from={0.4}>
        <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: big ? 52 : 34, textShadowColor: 'rgba(243,217,160,0.7)', textShadowRadius: 18 }}>
          {winner === selfId ? L('VÔ ĐỊCH! 🏆', 'CHAMPION! 🏆') : L('KẾT QUẢ', 'RESULTS')}
        </Text>
      </Pop>
      {winner ? <Podium names={state.names} scores={state.scores} ids={order} /> : null}
      {mine >= 0 && role === 'player' ? (
        <FloatText text={`#${mine + 1}`} color="#F3D9A0" size={30} duration={1600} style={{ top: 10, right: 10, alignSelf: 'flex-end' }} />
      ) : null}
      <View className="w-full gap-2" style={{ maxWidth: 600 }}>
        {order.slice(3, 12).map((id, i) => {
          const lives = state.lives[id] ?? 0;
          return (
            <Rise key={id} index={i + 3} style={{ ...(id === selfId ? { borderWidth: 2, borderColor: '#F3D9A0' } : null) } as ViewStyle}>
              <View className="flex-row items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: id === selfId ? 'rgba(243,217,160,0.2)' : 'rgba(255,255,255,0.08)' }}>
                <Text className="font-heavy text-body" style={{ color: '#AEB6C7', width: 28 }}>{i + 4}</Text>
                <Text className="min-w-0 flex-1 font-semi text-body" numberOfLines={1} style={{ color: '#FFFFFF' }}>{state.names[id] ?? '—'}</Text>
                {state.mode === 'survival' ? <Text className="font-strong text-label" style={{ color: lives > 0 ? '#86EFAC' : '#FCA5A5' }}>{lives > 0 ? `♥ ${lives}` : L('loại', 'out')}</Text> : null}
                <Text className="font-heavy text-body" style={{ color: '#F3D9A0' }}>{state.scores[id] ?? 0}</Text>
              </View>
            </Rise>
          );
        })}
      </View>
      {role === 'host' && canAgain ? <Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={onAgain} /> : null}
      {role !== 'host' ? <Text className="font-sans text-label" style={{ color: '#AEB6C7' }}>{L('Chủ phòng có thể bấm “Chơi lại”.', 'The host can start another round.')}</Text> : null}
    </Panel>
  );
}
