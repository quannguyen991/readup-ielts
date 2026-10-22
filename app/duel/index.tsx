import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { isRoomCode, makeRoomCode } from '@/services/duel/duel';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { color } from '@/theme/tokens';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

const BUILTIN_DECKS = [
  ...VOCAB_TOPICS.map((t) => ({ slug: t.slug, name: t.nameVi, nameEn: t.name })),
  ...SAT_VOCAB_LESSONS.map((l) => {
    const name = `${l.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${l.title}`;
    return { slug: l.slug, name, nameEn: name };
  }),
];

type GameCategory = 'live' | 'team' | 'solo';
type ArcadeGame = { key: string; title: string; titleVi: string; detail: string; detailEn: string; icon: string; tone: string; accent: string; category: GameCategory; badge: string; badgeEn: string; cover?: number };

const ARCADE_GAMES: ArcadeGame[] = [
  { key: 'hack', title: 'Cyber Hack', titleVi: 'Cyber Hack', detail: 'Chọn mật mã, giải khóa kho thưởng, rồi nhắm đối thủ để lấy credit và blook.', detailEn: 'Set a password, crack reward caches, then target rivals to steal credits and blooks.', icon: '⌨️', tone: '#183A27', accent: '#65E848', category: 'solo', badge: 'Giải mã · đấu đối thủ', badgeEn: 'Hacking · rival raids', cover: require('../../assets/game-covers/cyber-hack.jpg') },
  { key: 'fishing', title: 'Fishing Frenzy', titleVi: 'Fishing Frenzy', detail: 'Thả câu, chờ cá cắn, kéo lên rồi đấu cân nặng với các đối thủ.', detailEn: 'Cast, wait for a bite, reel in your catch and race rivals by weight.', icon: '🎣', tone: '#0C5364', accent: '#89F2E8', category: 'solo', badge: 'Câu cá · sưu tầm', badgeEn: 'Fishing · collection', cover: require('../../assets/game-covers/fishing-frenzy.jpg') },
  { key: 'forge', title: 'Spell Forge', titleVi: 'Lò Rèn Từ Ngữ', detail: 'Gõ từ, canh nhịp đập búa để rèn bùa, giữ nhiệt lò và chọn phép bổ trợ.', detailEn: 'Spell words, time hammer strikes, keep the furnace hot and choose enchantments.', icon: '🔥', tone: '#2B2350', accent: '#FFC764', category: 'solo', badge: 'Canh nhịp · chế tạo bùa', badgeEn: 'Timing · charm crafting', cover: require('../../assets/game-covers/spell-forge.jpg') },
  { key: 'dino', title: 'Dino Dig', titleVi: 'Đào Hóa Thạch', detail: 'Giải câu hỏi để đào, dùng máy dò và tự chọn ô có thể chứa xương hoặc bẫy.', detailEn: 'Answer to earn a dig, scan the grid and choose between fossils, treasure and traps.', icon: '🦕', tone: '#6A4BD9', accent: '#F7D26B', category: 'solo', badge: 'Bản đồ · 12 ô đào', badgeEn: 'Expedition · 12 tiles', cover: require('../../assets/game-covers/dino-dig.jpg') },
  { key: 'boss', title: 'Boss Raid', titleVi: 'Đột Kích Trùm', detail: 'Chọn nước đi, đỡ đòn phản công, hạ ba quái và chọn chiến lợi phẩm nâng cấp.', detailEn: 'Pick a move, block counterattacks, defeat three guardians and choose your loot upgrades.', icon: '🐉', tone: '#39275F', accent: '#E2B9FF', category: 'solo', badge: 'Đánh trùm · chiến thuật', badgeEn: 'Boss fight · strategy', cover: require('../../assets/game-covers/boss-raid.jpg') },
  { key: 'teams', title: 'Starboard Showdown', titleVi: 'Đấu đội Tinh Vân', detail: 'Các đội chọn ô bí mật, giải từ vựng và mở thưởng bất ngờ.', detailEn: 'Teams pick hidden tiles, solve vocabulary and reveal surprise bonuses.', icon: '🌌', tone: '#47316E', accent: '#F5D276', category: 'team', badge: '2–4 đội · chung màn hình', badgeEn: '2–4 teams · one screen', cover: require('../../assets/game-covers/starboard-showdown.jpg') },
  { key: 'live', title: 'Live Quiz Arena', titleVi: 'Đấu Quiz Live', detail: 'Tạo phòng, chia sẻ mã và đua trả lời cùng cả lớp.', detailEn: 'Host a room, share its code and race through questions together.', icon: '⚡', tone: '#5D2A9C', accent: '#FFD15C', category: 'live', badge: 'Trực tiếp · mã phòng', badgeEn: 'Live · room code', cover: require('../../assets/game-covers/live-quiz-arena.jpg') },
  { key: 'quiz', title: 'Quiz Sprint', titleVi: 'Quiz Tốc Độ', detail: 'Một lượt hỏi đáp ngắn, có tính điểm và bộ từ của riêng bạn.', detailEn: 'A focused round with a score, timer and your own vocabulary deck.', icon: '🏁', tone: '#933C30', accent: '#FFE09A', category: 'solo', badge: 'Gợi nhớ · tốc độ', badgeEn: 'Recall · speed', cover: require('../../assets/game-covers/quiz-sprint.jpg') },
  { key: 'pairs', title: 'Memory Match', titleVi: 'Ghép Cặp Ký Ức', detail: 'Lật ô, tìm cặp từ tiếng Anh khớp với nghĩa tiếng Việt.', detailEn: 'Flip tiles and match English words with their Vietnamese meanings.', icon: '🧩', tone: '#1D518B', accent: '#DAF0FF', category: 'solo', badge: 'Trí nhớ · ghép cặp', badgeEn: 'Memory · matching', cover: require('../../assets/game-covers/memory-match.jpg') },
  { key: 'balloons', title: 'Balloon Dash', titleVi: 'Bóng Bay Từ Vựng', detail: 'Chọn nghĩa đúng trước khi quả bóng bay vụt khỏi màn hình.', detailEn: 'Choose the right meaning before the balloon drifts away.', icon: '🎈', tone: '#762554', accent: '#FFD4E8', category: 'solo', badge: 'Phản xạ · gợi nhớ', badgeEn: 'Reflex · recall', cover: require('../../assets/game-covers/balloon-dash.jpg') },
  { key: 'hangman', title: 'Word Vault', titleVi: 'Kho Từ Bí Ẩn', detail: 'Dựa vào gợi ý, mở từng chữ và giải từ trước khi hết tim.', detailEn: 'Use the clue, reveal letters and solve the word before hearts run out.', icon: '🔐', tone: '#4B3784', accent: '#E4D7FF', category: 'solo', badge: 'Gợi ý · chính tả', badgeEn: 'Clues · spelling', cover: require('../../assets/game-covers/word-vault.jpg') },
  { key: 'sentence', title: 'Sentence Builder', titleVi: 'Xếp Câu Thần Tốc', detail: 'Sắp xếp các ô từ để dựng lại câu ví dụ hoàn chỉnh.', detailEn: 'Rebuild example sentences from shuffled word tiles.', icon: '🪄', tone: '#12656C', accent: '#BDF4E6', category: 'solo', badge: 'Ngữ pháp · trật tự', badgeEn: 'Grammar · order', cover: require('../../assets/game-covers/sentence-builder.jpg') },
  { key: 'cloze', title: 'Cloze Rush', titleVi: 'Điền Khuyết', detail: 'Đọc ví dụ thật rồi tìm từ phù hợp để lấp chỗ trống.', detailEn: 'Read a real example and find the word that completes the gap.', icon: '📝', tone: '#2B2350', accent: '#FFE7AA', category: 'solo', badge: 'Ngữ cảnh · nghĩa', badgeEn: 'Context · meaning', cover: require('../../assets/game-covers/cloze-rush.jpg') },
  { key: 'dictation', title: 'Dictation Dash', titleVi: 'Nghe Chép', detail: 'Nghe từ, viết đúng chính tả và nối dài chuỗi chuẩn.', detailEn: 'Listen, spell the word and build a clean streak.', icon: '🎧', tone: '#245D49', accent: '#CAF3D5', category: 'solo', badge: 'Nghe · chính tả', badgeEn: 'Listening · spelling', cover: require('../../assets/game-covers/dictation-dash.jpg') },
];

const GAME_FILTERS: { key: 'all' | GameCategory; label: string; labelEn: string }[] = [
  { key: 'all', label: 'Tất cả', labelEn: 'All games' },
  { key: 'live', label: 'Đấu live', labelEn: 'Live' },
  { key: 'team', label: 'Đấu đội', labelEn: 'Teams' },
  { key: 'solo', label: 'Chơi cá nhân', labelEn: 'Solo' },
];

/**
 * Sảnh ĐẤU 1–1: chọn bộ từ rồi tạo phòng (nhận mã 5 ký tự để gửi bạn), hoặc
 * nhập mã bạn gửi để vào phòng.
 */
export default function DuelLobby() {
  const { L, en } = useL();
  const customDecks = useCustomDeckStore((s) => s.decks);
  const DECKS = useMemo(() => [
    ...Object.values(customDecks)
      .filter((custom) => custom.words.length >= 4)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((custom) => ({ slug: `${CUSTOM_PREFIX}${custom.id}`, name: custom.name, nameEn: custom.name })),
    ...BUILTIN_DECKS,
  ], [customDecks]);
  const [deck, setDeck] = useState(BUILTIN_DECKS[0]!.slug);
  const [filter, setFilter] = useState('');
  const [code, setCode] = useState('');
  const [gameFilter, setGameFilter] = useState<'all' | GameCategory>('all');
  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return DECKS.filter((d) => !f || d.name.toLowerCase().includes(f) || d.nameEn.toLowerCase().includes(f)).slice(0, 24);
  }, [filter]);
  const joinCode = code.trim().toUpperCase();
  const isCustomDeck = deck.startsWith(CUSTOM_PREFIX);
  const studyDeck = isCustomDeck || VOCAB_TOPICS.some((topic) => topic.slug === deck) ? deck : VOCAB_TOPICS[0]!.slug;
  const visibleGames = gameFilter === 'all' ? ARCADE_GAMES : ARCADE_GAMES.filter((game) => game.category === gameFilter);
  const launchGame = (key: string) => {
    if (key === 'hack' || key === 'fishing' || key === 'teams') {
      router.push(`/duel/${key}?deck=${key === 'teams' ? studyDeck : deck}` as never);
      return;
    }
    if (key === 'forge' || key === 'dino' || key === 'boss') {
      router.push(`/duel/expedition?mode=${key}&deck=${deck}` as never);
      return;
    }
    if (key === 'live') {
      if (isCustomDeck) return;
      router.push(`/duel/${makeRoomCode()}?deck=${deck}&host=1` as never);
      return;
    }
    const routes: Record<string, string> = {
      quiz: 'quiz', pairs: 'pairs', balloons: 'game', hangman: 'hangman',
      sentence: 'sentence', cloze: 'cloze', dictation: 'dictation',
    };
    const route = routes[key];
    if (route) router.push(`/vocabulary/topic/${studyDeck}/${route}` as never);
  };

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          art="duel"
          badge={L('BAND9 GAME ARCADE', 'BAND9 GAME ARCADE')}
          line1={L('Chơi để nhớ lâu hơn,', 'Play to remember more,')}
          line2={L('đấu vui để tiến bộ', 'compete to improve')}
          subtitle={L('Chọn game, chọn bộ từ rồi vào chơi — một mình, cùng đội hoặc cả lớp.', 'Pick a game and a word deck, then play solo, in teams or with a whole class.')}
        />
      </Appear>

      <View className="mt-5 flex-row flex-wrap gap-4">
        <Appear index={1} style={{ flexGrow: 2, flexShrink: 1, flexBasis: 420 }}>
          <View className="rounded-[22px] bg-white p-5" style={CARD}>
            <View className="flex-row flex-wrap items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="plus" color="#F0703F" size={40} />
              </View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('Tạo phòng', 'Create a room')}</Text>
              <View aria-hidden>
                <Motion kind="pop">
                  <Label text={L('Mời bạn ⚔️', 'Invite ⚔️')} color="#F0703F" ink="#FFFFFF" tilt={-4} size={12} />
                </Motion>
              </View>
            </View>
            <Text className="mt-1 font-sans text-body text-muted">{L('Chọn bộ từ để đấu:', 'Pick a word set:')}</Text>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder={L('Tìm bộ từ…', 'Search word sets…')}
              placeholderTextColor="#94A3B8"
              className="mt-3 rounded-2xl px-4 py-2.5 font-sans text-body text-ink"
              style={{ borderWidth: 1.5, borderColor: '#F3F0FB', backgroundColor: '#F3F0FB' }}
            />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {shown.map((d) => {
                const on = d.slug === deck;
                return (
                  <Pressable
                    key={d.slug}
                    onPress={() => setDeck(d.slug)}
                    className="rounded-pill px-3.5 py-2"
                    style={{ backgroundColor: on ? color.primary : '#F3F0FB' }}
                  >
                    <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                      {en ? d.nameEn : d.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {isCustomDeck ? <Text className="mt-2 font-semi text-label" style={{ color: '#6A4BD9' }}>{L('Bộ tự tạo chơi được trên máy này; phòng live cần bộ từ Band9 để mọi người cùng nhận câu hỏi.', 'Custom decks work on this device; live rooms need a Band9 deck so every player receives the same questions.')}</Text> : null}
            <Button
              className="mt-4 self-start"
              label={L('Tạo phòng và mời bạn', 'Create room & invite')}
              iconRight="arrow-right"
              disabled={isCustomDeck}
              onPress={() => router.push(`/duel/${makeRoomCode()}?deck=${deck}&host=1` as never)}
            />
          </View>
        </Appear>

        <Appear index={2} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 280 }}>
          <View className="rounded-[22px] bg-white p-5" style={CARD}>
            <View className="flex-row flex-wrap items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="arrow-right" color="#6A4BD9" size={40} />
              </View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('Vào phòng', 'Join a room')}</Text>
              <View aria-hidden>
                <Motion kind="pop" delay={0.2}>
                  <Label text={L('Có mã? 🔑', 'Got a code? 🔑')} color="#F2B632" ink="#2B2350" tilt={4} size={12} />
                </Motion>
              </View>
            </View>
            <Text className="mt-1 font-sans text-body text-muted">{L('Nhập mã 5 ký tự bạn của bạn gửi:', 'Enter the 5-character code your friend sent:')}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={5}
              placeholder={L('VD: K7Q2M', 'e.g. K7Q2M')}
              placeholderTextColor="#94A3B8"
              className="mt-3 rounded-2xl px-4 py-3 text-center font-heavy text-sectionTitle text-ink"
              style={{ borderWidth: 1.5, borderColor: '#F3F0FB', backgroundColor: '#F3F0FB', letterSpacing: 6 }}
            />
            <Button className="mt-3 self-start" label={L('Vào phòng', 'Join')} disabled={!isRoomCode(joinCode)} onPress={() => router.push(`/duel/${joinCode}` as never)} />
          </View>
        </Appear>
      </View>

      <Appear index={3}>
        <View className="mt-4 overflow-hidden rounded-[26px] p-4 sm:p-6" style={{ backgroundColor: '#20173B' }}>
          <View className="mb-4 flex-row flex-wrap items-end justify-between gap-3 px-1">
            <View>
              <Text className="font-heavy" style={{ color: '#FFE6A2', fontSize: 28 }}>{L('Chọn cuộc chơi', 'Choose your game')}</Text>
              <Text className="mt-1 font-sans text-body" style={{ color: '#D6C8E6' }}>{L(`${ARCADE_GAMES.length} kiểu chơi · cùng một kho từ vựng Band9`, `${ARCADE_GAMES.length} ways to play · one Band9 word library`)}</Text>
            </View>
            <View className="rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,.11)' }}>
              <Text className="font-semi text-label" style={{ color: '#FFFFFF' }}>{L('Bộ từ game:', 'Game deck:')} {studyDeck === deck ? (DECKS.find((d) => d.slug === deck)?.name ?? deck) : L('Chủ đề IELTS gần nhất', 'Closest IELTS topic')}</Text>
            </View>
          </View>

          <View className="mb-4 flex-row flex-wrap gap-2">
            {GAME_FILTERS.map((item) => {
              const selected = gameFilter === item.key;
              return <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setGameFilter(item.key)} className="rounded-pill px-4 py-2.5" style={{ backgroundColor: selected ? '#F3C95D' : 'rgba(255,255,255,.1)' }}><Text className="font-heavy text-label" style={{ color: selected ? '#2E1D46' : '#F4EAF9' }}>{en ? item.labelEn : item.label}</Text></Pressable>;
            })}
          </View>

          <View className="flex-row flex-wrap gap-3" style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12 }}>
            {visibleGames.map((game) => <GameCard key={game.key} game={game} english={en} disabled={game.key === 'live' && isCustomDeck} onPress={() => launchGame(game.key)} />)}
          </View>
        </View>
      </Appear>
      <View className="h-8" />
    </Screen>
  );
}

function GameCard({ game, english, disabled = false, onPress }: { game: ArcadeGame; english: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: '48%', width: '48%', minWidth: 280, borderRadius: 22, overflow: 'hidden', backgroundColor: game.tone, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,.25)', opacity: disabled ? 0.55 : 1, boxShadow: '0 12px 22px rgba(8,5,19,.18)' } as object}>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: game.cover ? 250 : 196, transform: [{ translateY: pressed ? 3 : 0 }, { scale: pressed ? 0.99 : 1 }] })}>
        {game.cover ? (
          <ImageBackground source={game.cover} resizeMode="cover" style={{ height: 132, justifyContent: 'space-between', padding: 14 }}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="rounded-2xl px-2.5 py-1.5" style={{ backgroundColor: 'rgba(19,14,27,.76)' }}><Text className="font-heavy" style={{ color: game.accent, fontSize: 10, letterSpacing: 1.2 }}>{english ? game.badgeEn.toUpperCase() : game.badge.toUpperCase()}</Text></View>
              <Text style={{ fontSize: 28 }}>{game.icon}</Text>
            </View>
          </ImageBackground>
        ) : (
          <View className="flex-row items-center justify-between gap-3 px-5 pt-5">
            <View className="rounded-2xl px-2.5 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,.14)' }}><Text className="font-heavy" style={{ color: game.accent, fontSize: 10, letterSpacing: 1.2 }}>{english ? game.badgeEn.toUpperCase() : game.badge.toUpperCase()}</Text></View>
            <Text style={{ fontSize: 36 }}>{game.icon}</Text>
          </View>
        )}
        <View className={game.cover ? 'px-5 pb-4 pt-3' : 'px-5 pb-4 pt-2'}>
          <Text className="font-heavy text-sectionTitle" style={{ color: '#FFFFFF' }}>{english ? game.title : game.titleVi}</Text>
          <Text className="mt-1 min-h-[48px] font-semi text-body" style={{ color: '#E9E2F0' }}>{english ? game.detailEn : game.detail}</Text>
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="font-heavy text-body" style={{ color: game.accent }}>{LButton(english, game.category)}</Text>
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: game.accent }}><Text className="font-heavy text-bodyLg" style={{ color: '#2A1D3B' }}>›</Text></View>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: game.accent, opacity: 0.9 }} />
      </Pressable>
    </View>
  );
}

function LButton(english: boolean, category: GameCategory): string {
  if (category === 'live') return english ? 'HOST A ROOM' : 'TẠO PHÒNG LIVE';
  if (category === 'team') return english ? 'PLAY TOGETHER' : 'CHƠI CÙNG ĐỘI';
  return english ? 'PLAY THIS GAME' : 'VÀO CHƠI';
}
