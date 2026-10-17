import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { GREEN, RED, useHotkeys } from '@/components/vocab/study/StudyKit';
import { buildDuel, emptyTally, isRoomCode, MAX_DUEL_PLAYERS, QUESTION_MS, verdictTitle, type PlayerTally } from '@/services/duel/duel';
import { useDuelRoom, type DuelPlayer } from '@/services/duel/useDuelRoom';
import { displayableName } from '@/services/gamification/display-name';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge } from '@/components/illust/Cute';
import { CuteChat, CuteRocket, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { currentLocale, useL } from '@/i18n/useL';

/** Bản tiếng Anh cho câu kết của `verdictTitle` (dữ liệu gốc giữ tiếng Việt). */
const VERDICT_EN: Record<string, string> = {
  'Xong!': 'Done!',
  'Hoà!': "It's a draw!",
  'Thắng sát nút! 🏆': 'Won by a whisker! 🏆',
  'Bạn thắng! 🏆': 'You win! 🏆',
  'Thua sát nút!': 'Lost by a whisker!',
  'Thua rồi — phục thù nhé!': 'You lost — time for a rematch!',
};

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

/**
 * PHÒNG ĐẤU 1–1 (`services/duel`). Chờ đủ hai người → chủ phòng bấm bắt đầu →
 * đếm ngược → mỗi người làm 10 câu theo nhịp của mình (10 giây mỗi câu), thấy
 * điểm của đối thủ chạy thời gian thực → xong cả hai thì báo thắng thua.
 */
export default function DuelRoom() {
  const params = useLocalSearchParams<{ code: string; deck?: string; host?: string }>();
  const { L, en } = useL();
  const code = (params.code ?? '').toUpperCase();
  const isHost = params.host === '1';
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const [guestId] = useState(() => `g${Math.random().toString(36).slice(2, 10)}`);
  const me = useMemo<DuelPlayer>(() => {
    const named = displayableName((profile as { display_name?: string | null } | null)?.display_name ?? null);
    const id = guestId;
    return { id, name: named ?? (currentLocale() === 'en' ? `Guest ${id.slice(-4).toUpperCase()}` : `Khách ${id.slice(-4).toUpperCase()}`) };
  }, [session, profile, guestId]);

  const room = useDuelRoom(isRoomCode(code) ? code : '', me, isHost ? params.deck : undefined);
  const deckSlug = room.start?.deck ?? params.deck ?? room.lobbyDeck ?? '';
  const deck = useStudyDeck(deckSlug);
  const questions = useMemo(() => (room.start && deck ? buildDuel(deck.words, room.start.seed) : []), [room.start, deck]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [shownAt, setShownAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [lastSeed, setLastSeed] = useState<string | null>(null);

  // Ván mới (kể cả đấu lại): về câu 1 — điều chỉnh state lúc render theo ván đang chạy.
  if (room.start && room.start.seed !== lastSeed) {
    setLastSeed(room.start.seed);
    setIndex(0);
    setPicked(null);
    setShownAt(room.start.at);
  }

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  // Host khóa danh sách vào đúng thời điểm bắt đầu để người vào muộn không chen vào giữa ván.
  const roster = room.start?.players ?? room.players.slice(0, MAX_DUEL_PLAYERS).map((player) => player.id);
  const seated = room.players.filter((player) => roster.includes(player.id));
  const playerIndex = room.players.findIndex((player) => player.id === me.id);
  const full = playerIndex >= MAX_DUEL_PLAYERS || (!!room.start && !room.start.players.includes(me.id));
  const opponent = seated.find((player) => player.id !== me.id) ?? null;
  const mine = room.tallies[me.id] ?? emptyTally();
  const theirs = opponent ? room.tallies[opponent.id] ?? emptyTally() : emptyTally();
  const started = !!room.start && clock >= room.start.at;
  const counting = !!room.start && clock < room.start.at;
  const myDone = !!room.finished[me.id];
  const standings = seated
    .map((player) => ({ player, tally: room.tallies[player.id] ?? emptyTally(), done: !!room.finished[player.id] }))
    .sort((a, b) => b.tally.score - a.tally.score || a.tally.ms - b.tally.ms);
  const activeIds = roster.filter((id) => seated.some((player) => player.id === id));
  const allDone = myDone && activeIds.every((id) => !!room.finished[id]);
  const q = questions[index];

  const submit = (i: number | null) => {
    if (!q || picked !== null || myDone || full) return;
    const ms = Math.max(0, Date.now() - shownAt);
    const ok = i !== null && i === q.correctIndex;
    setPicked(i ?? -1);
    useGameStore.getState().answer(ok, 'duel');
    room.answer(index, ok, ms);
    setTimeout(() => {
      if (index + 1 >= questions.length) room.finish();
      else {
        setIndex((n) => n + 1);
        setPicked(null);
        setShownAt(Date.now());
      }
    }, 650);
  };

  // Bộ hẹn giờ gọi bản `submit` MỚI NHẤT (cập nhật sau mỗi lần render).
  const submitRef = useRef(submit);
  useLayoutEffect(() => {
    submitRef.current = submit;
  });

  // Hết 10 giây mà chưa chọn: tính là sai.
  useEffect(() => {
    if (!started || myDone || picked !== null || !q || full) return;
    const left = shownAt + QUESTION_MS - Date.now();
    const t = setTimeout(() => submitRef.current(null), Math.max(0, left));
    return () => clearTimeout(t);
  }, [started, myDone, picked, q, shownAt, full]);

  useHotkeys((e) => {
    const n = Number(e.key);
    if (started && !myDone && n >= 1 && n <= 4) submit(n - 1);
  });

  if (!isRoomCode(code)) {
    return (
      <Screen>
        <Text className="mt-10 text-center font-heavy text-sectionTitle text-ink">{L('Mã phòng không hợp lệ.', 'Invalid room code.')}</Text>
        <Button className="mt-4 self-center" label={L('Về sảnh đấu', 'Back to lobby')} onPress={() => router.replace('/duel' as never)} />
      </Screen>
    );
  }

  const link = Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/duel/${code}` : `/duel/${code}`;
  const theirBest = standings.find((row) => row.player.id !== me.id)?.tally ?? null;
  const myRank = standings.findIndex((row) => row.player.id === me.id) + 1;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 820 }}>
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Pressable onPress={() => router.replace('/duel' as never)} className="flex-row items-center gap-2 rounded-pill bg-white/85 px-4 py-2">
            <Icon name="chevron-left" size={18} color={color.ink} />
            <Text className="font-semi text-body text-ink">{L('Sảnh đấu', 'Duel lobby')}</Text>
          </Pressable>
          <View className="min-w-0 flex-row items-center gap-2" style={{ flexShrink: 1 }}>
          <View aria-hidden>
            <SealIcon name="flame" color="#F0703F" size={34} />
          </View>
          <Text className="min-w-0 font-heavy text-bodyLg text-ink" style={{ flexShrink: 1 }}>
            {L('Phòng', 'Room')} <Text style={{ letterSpacing: 3 }}>{code}</Text>
            {deck ? <Text className="font-sans text-body text-muted"> · {en && deck.kind !== 'custom' ? deck.name : deck.nameVi}</Text> : null}
          </Text>
          </View>
        </View>

        <View className="mt-4 rounded-[22px] bg-white p-4" style={CARD}>
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2"><Text className="font-heavy text-bodyLg text-ink">{L('Bảng xếp hạng trực tiếp', 'Live leaderboard')}</Text><Text className="font-semi text-label text-muted">{seated.length}/{MAX_DUEL_PLAYERS} {L('người chơi', 'players')}</Text></View>
          <View className="flex-row flex-wrap gap-2">
            {standings.length ? standings.slice(0, 12).map((row, index) => <View key={row.player.id} className="flex-row items-center gap-2 rounded-2xl px-3 py-2" style={{ flexGrow: 1, flexBasis: 190, backgroundColor: row.player.id === me.id ? '#FFF4D7' : '#F7F4EF', borderWidth: row.player.id === me.id ? 1.5 : 1, borderColor: row.player.id === me.id ? '#E8BE66' : '#EEE8DD' }}><Text className="font-heavy text-label" style={{ color: index === 0 ? '#A46D12' : '#7D8290' }}>{index + 1}.</Text><Text numberOfLines={1} className="min-w-0 flex-1 font-semi text-label text-ink">{row.player.name}{row.player.id === me.id ? ` ${L('(bạn)', '(you)')}` : ''}</Text><Text className="font-heavy text-body" style={{ color: '#A46D12' }}>{row.tally.score}</Text>{row.done ? <Text style={{ color: '#15945A' }}>✓</Text> : null}</View>) : <Text className="font-sans text-label text-muted">{L('Chờ người chơi vào phòng…', 'Waiting for players to join…')}</Text>}
          </View>
        </View>

        <CrossFade swapKey={allDone ? 'done' : started ? `q-${index}` : counting ? 'count' : 'lobby'}>
          <View className="mt-4 rounded-[22px] bg-white p-6" style={CARD}>
            {room.status === 'offline' && !isHost ? (
              <Text className="font-sans text-bodyLg text-ink">{L('Không kết nối được máy chủ thời gian thực. Kiểm tra mạng rồi tải lại trang.', "Couldn't reach the live server. Check your connection and reload the page.")}</Text>
            ) : full ? (
              <View className="items-start">
                <View aria-hidden className="mb-3">
                  <Motion kind="wobble">
                    <Badge icon="bolt" color="#F2B632" size={48} />
                  </Motion>
                </View>
                <Text className="font-heavy text-sectionTitle text-ink">{room.start ? L('Ván đã bắt đầu', 'This round has already started') : L('Phòng đã đủ người', 'This room is full')}</Text>
                <Text className="mt-1 font-sans text-bodyLg text-muted">{room.start ? L('Bạn có thể vào phòng tiếp theo bằng mã mới.', 'Join the next room with a new code.') : L(`Phòng nhận tối đa ${MAX_DUEL_PLAYERS} người.`, `This room supports up to ${MAX_DUEL_PLAYERS} players.`)}</Text>
                <Button className="mt-4" label={L('Về sảnh đấu', 'Back to lobby')} onPress={() => router.replace('/duel' as never)} />
              </View>
            ) : allDone ? (
              <View className="items-center">
                <View aria-hidden className="mb-3 items-center">
                  <View style={{ marginBottom: -4, zIndex: 2 }}>
                    <Motion kind="pop">
                      <Label text={L('Về đích! 🏁', 'Finished! 🏁')} color="#22A06B" ink="#FFFFFF" tilt={-5} size={13} />
                    </Motion>
                  </View>
                  <Motion kind="float">
                    <Sticker tilt={-6}>
                      <CuteTrophy size={72} />
                    </Sticker>
                  </Motion>
                </View>
                <Text className="font-heavy text-hero text-ink">
                  {verdictLabel(verdictTitle(mine, theirBest), en)}
                </Text>
                <Text className="mt-2 font-sans text-bodyLg text-muted">
                  {L(`Hạng ${myRank} · ${mine.score} điểm · đúng ${mine.correct}/${questions.length}`, `Rank ${myRank} · ${mine.score} points · ${mine.correct}/${questions.length} correct`)}
                </Text>
                <View className="mt-4 w-full gap-2" style={{ maxWidth: 580 }}>{standings.map((row, index) => <View key={row.player.id} className="flex-row items-center gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: row.player.id === me.id ? '#FFF4D7' : '#F7F4EF' }}><Text className="font-heavy text-label text-muted">{index + 1}</Text><Text className="flex-1 font-semi text-body text-ink">{row.player.name}</Text><Text className="font-heavy text-body" style={{ color: '#A46D12' }}>{row.tally.score}</Text><Text className="font-semi text-label text-muted">{row.tally.correct}/{questions.length}</Text></View>)}</View>
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {isHost ? <Button label={L('Đấu lại', 'Rematch')} iconLeft="refresh" onPress={() => room.begin(deckSlug)} /> : null}
                  <Button variant="outline" label={L('Về sảnh', 'Back to lobby')} onPress={() => router.replace('/duel' as never)} />
                </View>
                {!isHost ? <Text className="mt-2 font-sans text-label text-muted">{L('Chủ phòng có thể bấm “Đấu lại”.', 'The host can start a rematch.')}</Text> : null}
              </View>
            ) : myDone ? (
              <View className="items-center">
                <View aria-hidden className="mb-2">
                  <Motion kind="float">
                    <Sticker tilt={8}>
                      <CuteRocket size={56} />
                    </Sticker>
                  </Motion>
                </View>
                <Text className="text-center font-semi text-bodyLg text-ink">{L('Bạn đã xong — chờ những người chơi còn lại…', 'You are done — waiting for the other players…')}</Text>
              </View>
            ) : counting && room.start ? (
              <View className="items-center py-6">
                <Text className="font-sans text-bodyLg text-muted">{L('Chuẩn bị…', 'Get ready…')}</Text>
                <Text className="font-heavy text-ink" style={{ fontSize: 72, lineHeight: 84 }}>
                  {Math.max(1, Math.ceil((room.start.at - clock) / 1000))}
                </Text>
              </View>
            ) : started && q ? (
              <View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
                    {L('Câu', 'Question')} {index + 1}/{questions.length} · {q.enToVi ? L('Chọn nghĩa đúng', 'Pick the right meaning') : L('Chọn từ tiếng Anh', 'Pick the English word')}
                  </Text>
                  <Text className="font-strong text-label" style={{ color: '#B45309' }}>
                    {Math.max(0, Math.ceil((shownAt + QUESTION_MS - clock) / 1000))}s
                  </Text>
                </View>
                <View className="mt-2 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F0EBE2' }}>
                  <View className="h-1.5 rounded-pill" style={{ width: `${Math.max(0, 1 - (clock - shownAt) / QUESTION_MS) * 100}%`, backgroundColor: '#F59E0B' }} />
                </View>
                <Text className="mt-4 font-heavy text-pageTitle text-ink">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
                <View className="mt-5 gap-2.5">
                  {q.options.map((opt, i) => {
                    const reveal = picked !== null;
                    const ok = reveal && i === q.correctIndex;
                    const bad = reveal && i === picked && i !== q.correctIndex;
                    return (
                      <Pressable
                        key={`${i}-${opt}`}
                        disabled={reveal}
                        onPress={() => submit(i)}
                        className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
                        style={{ borderWidth: 1.5, borderColor: ok ? GREEN : bad ? RED : '#F0EBE2', backgroundColor: ok ? '#ECFDF3' : bad ? '#FFF1F2' : '#FFFFFF' }}
                      >
                        <Text className="font-strong text-label text-muted">{i + 1}</Text>
                        <Text className="flex-1 font-semi text-bodyLg text-ink">{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
                {room.status === 'offline' && isHost ? <Text className="mb-3 rounded-xl px-3 py-2 font-semi text-label" style={{ backgroundColor: '#FFF4D7', color: '#805D1D' }}>{L('Máy chủ live chưa kết nối. Bạn vẫn có thể mở ván thử một mình.', 'Live server is offline. You can still launch a solo test.')}</Text> : null}
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                  <Text className="font-heavy text-sectionTitle text-ink">{seated.length > 1 ? L(`Đã vào phòng · ${seated.length} người`, `Room ready · ${seated.length} players`) : L('Mời bạn vào phòng', 'Invite players')}</Text>
                  </View>
                  <View aria-hidden>
                    <Motion kind="wobble">
                      <Sticker tilt={8}>
                        <CuteChat size={48} />
                      </Sticker>
                    </Motion>
                  </View>
                </View>
                <Text className="mt-1 font-sans text-bodyLg text-muted">
                  {opponent
                    ? isHost
                      ? L('Bấm bắt đầu khi lớp đã sẵn sàng. Có thể chơi một mình để thử.', 'Start when the class is ready, or launch a solo test.')
                      : L('Chờ chủ phòng bắt đầu…', 'Waiting for the host to start…')
                    : L(`Chia sẻ mã ${code} hoặc đường dẫn để mời cả lớp.`, `Share code ${code} or the link to invite your class.`)}
                </Text>
                {!opponent ? (
                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    <Text selectable className="rounded-xl px-3 py-2 font-sans text-body text-ink" style={{ backgroundColor: '#F9F6F1' }}>
                      {link}
                    </Text>
                    {Platform.OS === 'web' ? (
                      <Button
                        size="sm"
                        variant="outline"
                    label={L('Mời người chơi', 'Invite players')}
                        onPress={() =>
                          void (navigator.share
                            ? navigator.share({ text: L(`Đấu từ vựng với mình trên Band 9 — mã phòng ${code}`, `Duel me on vocabulary on Band 9 — room code ${code}`), url: link }).catch(() => {})
                            : navigator.clipboard.writeText(link))
                        }
                      />
                    ) : null}
                  </View>
                ) : null}
                {isHost ? (
                  <Button className="mt-4 self-start" label={L('Bắt đầu ván live', 'Start live game')} iconRight="arrow-right" disabled={!deck} onPress={() => room.begin(deckSlug)} />
                ) : null}
                {room.status === 'connecting' ? <Text className="mt-3 font-sans text-label text-muted">{L('Đang kết nối…', 'Connecting…')}</Text> : null}
              </View>
            )}
          </View>
        </CrossFade>
      </View>
    </Screen>
  );
}

function verdictLabel(vi: string, en: boolean): string {
  return en ? (VERDICT_EN[vi] ?? vi) : vi;
}

function ScoreBar({ name, t, total, tone, done }: { name: string; t: PlayerTally; total: number; tone: string; done: boolean }) {
  const { L } = useL();
  return (
    <Appear style={{ flexGrow: 1, flexShrink: 1, flexBasis: 260 }}>
      <View className="rounded-2xl bg-white px-4 py-3" style={CARD}>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
            {name}
          </Text>
          {done ? (
            <View aria-hidden>
              <Badge icon="check" color="#22A06B" size={24} />
            </View>
          ) : null}
          <Text className="font-heavy text-bodyLg" style={{ color: tone }}>
            {t.score}
          </Text>
        </View>
        <View className="mt-2 h-2.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F8F2E8' }}>
          <View className="h-2.5 rounded-pill" style={{ width: `${(t.answered / Math.max(total, 1)) * 100}%`, backgroundColor: tone }} />
        </View>
        <Text className="mt-1 font-sans text-label text-muted">
          {L(`${t.answered}/${total} câu · đúng ${t.correct}`, `${t.answered}/${total} questions · ${t.correct} right`)}
          {done ? L(' · về đích', ' · finished') : ''}
        </Text>
      </View>
    </Appear>
  );
}
