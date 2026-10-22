import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildDuel } from '@/services/duel/duel';
import { scoreTeamAnswer, teamWinners, type TeamPower } from '@/services/duel/team-game';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

type Team = { name: string; icon: string; tone: string };
type Phase = 'setup' | 'board' | 'question' | 'feedback' | 'result';
type Outcome = { correct: boolean; teamIndex: number; correctAnswer: string };

const TEAM_STYLES = [
  { icon: '🦊', tone: '#F0703F', name: 'Đội Cáo' },
  { icon: '🐼', tone: '#4A82D7', name: 'Đội Gấu Trúc' },
  { icon: '🐸', tone: '#26A579', name: 'Đội Ếch' },
  { icon: '🦉', tone: '#8B5BC7', name: 'Đội Cú' },
];

const POWERUPS: TeamPower[] = ['comet', 'double', 'eclipse', 'stardust'];
const POWER_ICONS: Record<TeamPower, string> = { comet: '☄️', double: '💎', eclipse: '🌘', stardust: '✨' };

function makeTeams(count: number): Team[] {
  return TEAM_STYLES.slice(0, count).map((team) => ({ name: team.name, icon: team.icon, tone: team.tone }));
}

function makePowers(count: number, seed: number): Record<number, TeamPower> {
  const indexes = Array.from({ length: count }, (_, index) => index);
  let value = seed >>> 0;
  const random = () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [indexes[index], indexes[target]] = [indexes[target]!, indexes[index]!];
  }
  const countPowers = Math.min(POWERUPS.length, Math.max(1, Math.floor(count / 5)));
  return Object.fromEntries(indexes.slice(0, countPowers).map((index, position) => [index, POWERUPS[position]!])) as Record<number, TeamPower>;
}

export default function TeamShowdown() {
  const params = useLocalSearchParams<{ deck?: string }>();
  const slug = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const deck = useStudyDeck(slug || VOCAB_TOPICS[0]!.slug);
  const { L, en } = useL();
  const [teams, setTeams] = useState<Team[]>(() => makeTeams(2));
  const [gridSize, setGridSize] = useState(8);
  const [phase, setPhase] = useState<Phase>('setup');
  const [roundSeed, setRoundSeed] = useState(() => Date.now());
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [activeTeam, setActiveTeam] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [usedTiles, setUsedTiles] = useState<number[]>([]);
  const [tileResults, setTileResults] = useState<Record<number, boolean>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const questions = useMemo(
    () => deck ? buildDuel(deck.words, `team-showdown:${deck.slug}:${roundSeed}`, gridSize) : [],
    [deck, gridSize, roundSeed],
  );
  const powers = useMemo(() => makePowers(questions.length, roundSeed), [questions.length, roundSeed]);
  const question = activeTile === null ? undefined : questions[activeTile];
  const power = activeTile === null ? null : powers[activeTile] ?? null;
  const winners = teamWinners(scores);

  const chooseTeamCount = (count: number) => {
    setTeams((current) => makeTeams(count).map((team, index) => ({ ...team, name: current[index]?.name ?? team.name })));
  };

  const startGame = () => {
    const actualSeed = Date.now();
    setRoundSeed(actualSeed);
    setScores(teams.map(() => 0));
    setActiveTeam(0);
    setActiveTile(null);
    setUsedTiles([]);
    setTileResults({});
    setOutcome(null);
    setPhase('board');
  };

  const answer = (choiceIndex: number) => {
    if (!question || activeTile === null || phase !== 'question') return;
    const correct = choiceIndex === question.correctIndex;
    const result = scoreTeamAnswer(scores, activeTeam, correct, power);
    setScores(result.scores);
    setUsedTiles((current) => [...current, activeTile]);
    setTileResults((current) => ({ ...current, [activeTile]: correct }));
    setOutcome({
      correct,
      teamIndex: activeTeam,
      correctAnswer: question.options[question.correctIndex] ?? '',
    });
    setPhase('feedback');
    useGameStore.getState().answer(correct, 'duel', { key: `team:${deck?.slug}:${roundSeed}:${activeTile}` });
  };

  const continueTurn = () => {
    if (usedTiles.length >= questions.length) {
      setPhase('result');
      return;
    }
    setActiveTeam((current) => (current + 1) % teams.length);
    setActiveTile(null);
    setOutcome(null);
    setPhase('board');
  };

  const feedbackLine = () => {
    if (!outcome) return '';
    if (!outcome.correct) return L('Chưa đúng — lượt này không cộng điểm.', 'Not quite — no points this turn.');
    if (power === 'comet') return L('Sao chổi! Đội nhận thêm 40 điểm.', 'Comet bonus! Your team earns 40 extra points.');
    if (power === 'double') return L('Tinh thể nhân đôi! Thưởng thêm 100 điểm.', 'Double crystal! Earn another 100 points.');
    if (power === 'eclipse') return L('Nhật thực! Cướp tối đa 25 điểm từ đội dẫn đầu.', 'Eclipse! Take up to 25 points from the leading team.');
    if (power === 'stardust') return L('Bụi sao! Mỗi đội khác nhận 10 điểm.', 'Stardust! Every other team gets 10 points.');
    return L('Chính xác! Đội nhận 100 điểm.', 'Correct! Your team earns 100 points.');
  };

  if (!deck || deck.words.length < 4) {
    return <Screen><Text className="font-heavy text-sectionTitle text-ink">{L('Bộ này cần ít nhất 4 từ để chơi.', 'This deck needs at least 4 words to play.')}</Text><Button className="mt-4 self-start" label={L('Về sảnh game', 'Back to arcade')} onPress={() => router.replace('/duel' as never)} /></Screen>;
  }

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1050 }}>
        <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
          <Pressable accessibilityRole="button" onPress={() => router.replace('/duel' as never)} className="rounded-pill bg-white px-4 py-2.5">
            <Text className="font-semi text-body text-ink">‹  {L('Sảnh game', 'Game arcade')}</Text>
          </Pressable>
          <Text className="font-semi text-label text-muted">{deck.nameVi} · {questions.length} {L('ô câu hỏi', 'question tiles')}</Text>
        </View>

        <View className="overflow-hidden rounded-[26px]" style={{ backgroundColor: '#F3F0FB', borderWidth: 4, borderColor: '#E9BD62', boxShadow: '0 16px 36px rgba(29,24,53,.2)' } as object}>
          <View className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: '#F3F0FB', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.12)' }}>
            <View>
              <Text style={{ color: '#2B2350', fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>{L('BAND9 CLASSROOM ARCADE', 'BAND9 CLASSROOM ARCADE')}</Text>
              <Text className="mt-1 font-heavy" style={{ color: '#2B2350', fontSize: 26 }}>{L('ĐẤU ĐỘI · BẢNG TINH VÂN', 'TEAM SHOWDOWN · STARBOARD')}</Text>
            </View>
            <View className="rounded-2xl px-4 py-2" style={{ backgroundColor: '#F3F0FB' }}>
              <Text className="font-heavy text-bodyLg" style={{ color: '#2B2350' }}>✦ {usedTiles.length}/{questions.length}</Text>
              <Text className="font-semi text-label" style={{ color: '#2B2350' }}>{L('ô đã mở', 'tiles opened')}</Text>
            </View>
          </View>

          <View className="p-4 sm:p-6">
            {phase === 'setup' ? (
              <View className="flex-row flex-wrap gap-4">
                <View className="rounded-[22px] p-5" style={{ flexGrow: 1, flexBasis: 300, backgroundColor: '#F3F0FB' }}>
                  <Text className="font-heavy text-sectionTitle text-ink">{L('Sắp đội và luật chơi', 'Set up teams and rules')}</Text>
                  <Text className="mt-1 font-sans text-body text-muted">{L('Chơi chung trên một màn hình. Mỗi đội lần lượt chọn ô và cùng thảo luận đáp án.', 'Play together on one screen. Teams take turns choosing a tile and discussing the answer.')}</Text>

                  <Text className="mt-5 font-heavy text-body text-ink">{L('Số đội', 'Number of teams')}</Text>
                  <View className="mt-2 flex-row gap-2">
                    {[2, 3, 4].map((count) => <SetupChip key={count} selected={teams.length === count} label={`${count} ${L('đội', 'teams')}`} onPress={() => chooseTeamCount(count)} />)}
                  </View>

                  <Text className="mt-5 font-heavy text-body text-ink">{L('Đặt tên đội', 'Name the teams')}</Text>
                  <View className="mt-2 gap-2">
                    {teams.map((team, index) => <View key={index} className="flex-row items-center gap-2 rounded-2xl px-3 py-2" style={{ backgroundColor: '#F3F0FB' }}>
                      <Text style={{ fontSize: 24 }}>{team.icon}</Text>
                      <TextInput value={team.name} onChangeText={(name) => setTeams((current) => current.map((item, i) => i === index ? { ...item, name } : item))} maxLength={18} placeholder={L('Tên đội', 'Team name')} className="flex-1 py-1 font-semi text-body text-ink" />
                      <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: team.tone }} />
                    </View>)}
                  </View>

                  <Text className="mt-5 font-heavy text-body text-ink">{L('Số ô câu hỏi', 'Question tiles')}</Text>
                  <View className="mt-2 flex-row gap-2">
                    {[8, 16].map((count) => <SetupChip key={count} selected={gridSize === count} disabled={deck.words.length < count} label={`${count} ${L('ô', 'tiles')}`} onPress={() => setGridSize(count)} />)}
                    {deck.words.length < 8 ? <SetupChip selected disabled={false} label={`${deck.words.length} ${L('từ trong bộ', 'words in deck')}`} onPress={() => setGridSize(deck.words.length)} /> : null}
                  </View>

                  <Button className="mt-6 self-start" label={L('Bắt đầu đấu đội', 'Start team game')} iconRight="arrow-right" onPress={startGame} />
                </View>

                <View className="items-center justify-center rounded-[22px] p-6" style={{ flexGrow: 1, flexBasis: 260, backgroundColor: '#EDE5F8' }}>
                  <Text style={{ fontSize: 72 }}>🌌</Text>
                  <Text className="mt-3 text-center font-heavy text-sectionTitle text-ink">{L('Mỗi ô là một thử thách', 'Every tile holds a challenge')}</Text>
                  <Text className="mt-2 max-w-[390px] text-center font-sans text-body text-muted">{L('Trả lời đúng nhận 100 điểm. Một vài ô giấu Sao chổi, Tinh thể nhân đôi, Nhật thực hoặc Bụi sao.', 'Correct answers earn 100 points. A few tiles hide Comet, Double Crystal, Eclipse or Stardust bonuses.')}</Text>
                  <View className="mt-4 flex-row flex-wrap justify-center gap-2">{POWERUPS.map((item) => <View key={item} className="rounded-pill px-3 py-2" style={{ backgroundColor: '#FFFFFF' }}><Text className="font-semi text-label text-ink">{POWER_ICONS[item]} {powerName(item, en)}</Text></View>)}</View>
                </View>
              </View>
            ) : null}

            {phase === 'board' ? (
              <View>
                <View className="mb-4 flex-row flex-wrap gap-2">
                  {teams.map((team, index) => <View key={team.name + index} className="flex-row items-center gap-2 rounded-2xl px-4 py-3" style={{ flexGrow: 1, flexBasis: 180, backgroundColor: index === activeTeam ? team.tone : '#2B2851', borderWidth: index === activeTeam ? 2 : 1, borderColor: index === activeTeam ? '#FFE28A' : 'rgba(255,255,255,.12)' }}>
                    <Text style={{ fontSize: 24 }}>{team.icon}</Text>
                    <View className="min-w-0 flex-1"><Text numberOfLines={1} className="font-heavy text-body" style={{ color: '#2B2350' }}>{team.name || L(`Đội ${index + 1}`, `Team ${index + 1}`)}</Text><Text className="font-semi text-label" style={{ color: '#2B2350' }}>{scores[index] ?? 0} {L('điểm', 'points')}</Text></View>
                    {index === activeTeam ? <Text style={{ fontSize: 21 }}>🎯</Text> : null}
                  </View>)}
                </View>
                <View className="rounded-[22px] p-4 sm:p-5" style={{ backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#484273' }}>
                  <Text className="font-heavy text-center text-bodyLg" style={{ color: '#2B2350' }}>{teams[activeTeam]?.icon}  {L('Đến lượt', 'Up now')}: {teams[activeTeam]?.name || L(`Đội ${activeTeam + 1}`, `Team ${activeTeam + 1}`)}</Text>
                  <Text className="mt-1 text-center font-sans text-label" style={{ color: '#2B2350' }}>{L('Chọn một ô chưa mở để nhận thử thách.', 'Choose an unopened tile to reveal a challenge.')}</Text>
                  <View className="mt-5 flex-row flex-wrap justify-center gap-2.5">
                    {questions.map((item, index) => {
                      const used = usedTiles.includes(index);
                      const result = tileResults[index];
                      return <Pressable key={`${index}-${item.word.word}`} disabled={used} onPress={() => { setActiveTile(index); setPhase('question'); }} accessibilityRole="button" accessibilityLabel={used ? `${L('Ô', 'Tile')} ${index + 1}, ${result ? L('đúng', 'correct') : L('đã dùng', 'used')}` : `${L('Mở ô', 'Open tile')} ${index + 1}`} style={({ pressed }) => ({ width: '22%', minWidth: 62, maxWidth: 112, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: used ? (result ? '#315D50' : '#51425A') : '#F2C665', borderColor: used ? 'rgba(255,255,255,.08)' : '#F3F0FB', borderWidth: 2, borderRadius: 17, borderBottomWidth: used ? 2 : 7, borderBottomColor: used ? 'rgba(0,0,0,.16)' : '#6A4BD9', opacity: used ? 0.76 : 1, transform: [{ translateY: pressed && !used ? 4 : 0 }, { scale: pressed && !used ? 0.97 : 1 }], boxShadow: used ? undefined : '0 5px 14px rgba(245,195,77,.15)' } as object)}>
                        <Text style={{ fontSize: 26, fontWeight: '900', color: used ? '#FFFFFF' : '#302449' }}>{used ? (result ? '✓' : '×') : String(index + 1).padStart(2, '0')}</Text>
                        <Text style={{ marginTop: 2, fontSize: 9, fontWeight: '900', letterSpacing: 1, color: used ? '#D8D0E4' : '#2B2350' }}>{used ? L('XONG', 'DONE') : L('MỞ Ô', 'PICK')}</Text>
                      </Pressable>;
                    })}
                  </View>
                  {usedTiles.length >= questions.length ? <Button className="mt-5 self-center" label={L('Xem bảng kết quả', 'Show final scores')} iconRight="arrow-right" onPress={() => setPhase('result')} /> : null}
                </View>
              </View>
            ) : null}

            {phase === 'question' && question ? (
              <View className="mx-auto w-full rounded-[24px] p-5 sm:p-8" style={{ maxWidth: 850, backgroundColor: '#F3F0FB', borderWidth: 3, borderColor: '#F2CA6B' }}>
                <View className="flex-row flex-wrap items-center justify-between gap-3">
                  <View className="rounded-pill px-3 py-1.5" style={{ backgroundColor: teams[activeTeam]?.tone }}><Text className="font-heavy text-label" style={{ color: '#2B2350' }}>{teams[activeTeam]?.icon} {teams[activeTeam]?.name}</Text></View>
                  <Text className="font-heavy text-label text-muted">{L('Ô câu hỏi', 'TILE')} {activeTile! + 1} / {questions.length}</Text>
                </View>
                <Text className="mt-6 text-center font-heavy text-ink" style={{ fontSize: 30, lineHeight: 39 }}>{question.enToVi ? question.word.word : question.word.meaningVi}</Text>
                {question.enToVi && question.word.ipa ? <Text className="mt-1 text-center font-semi text-label text-muted">{question.word.ipa}</Text> : null}
                {question.enToVi && question.word.example ? <Text className="mx-auto mt-3 max-w-[660px] text-center font-sans text-body text-muted">“{question.word.example}”</Text> : null}
                <View className="mt-6 flex-row flex-wrap gap-3">
                  {question.options.map((option, index) => <Pressable key={`${index}-${option}`} accessibilityRole="button" onPress={() => answer(index)} style={({ pressed }) => ({ minHeight: 66, flexGrow: 1, flexBasis: 260, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 15, backgroundColor: ['#E94B61', '#3296E8', '#D9AA29', '#2DB875'][index % 4], borderRadius: 16, borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,.2)', transform: [{ translateY: pressed ? 4 : 0 }] })}>
                    <Text className="text-center font-heavy text-bodyLg" style={{ color: index === 2 ? '#312044' : '#FFFFFF' }}>{option}</Text>
                  </Pressable>)}
                </View>
              </View>
            ) : null}

            {phase === 'feedback' && question && outcome ? (
              <View className="items-center rounded-[24px] px-5 py-8" style={{ backgroundColor: outcome.correct ? '#EAF7E9' : '#FFF0EE', borderWidth: 2, borderColor: outcome.correct ? '#72C681' : '#EA8B7F' }}>
                <Text style={{ fontSize: 56 }}>{outcome.correct ? '🎉' : '💭'}</Text>
                <Text className="mt-2 text-center font-heavy text-sectionTitle" style={{ color: outcome.correct ? '#22723D' : '#A23D3F' }}>{outcome.correct ? L('Đáp án chính xác!', 'That is correct!') : L('Chưa trúng lần này', 'Not this time')}</Text>
                <Text className="mt-1 text-center font-semi text-bodyLg text-ink">{feedbackLine()}</Text>
                {!outcome.correct ? <Text className="mt-3 text-center font-heavy text-body text-ink">{L('Đáp án:', 'Answer:')} {outcome.correctAnswer}</Text> : null}
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {teams.map((team, index) => <View key={team.name + index} className="rounded-pill px-3 py-2" style={{ backgroundColor: '#FFFFFF' }}><Text className="font-heavy text-label" style={{ color: team.tone }}>{team.icon} {team.name}: {scores[index] ?? 0}</Text></View>)}
                </View>
                <Button className="mt-6" label={usedTiles.length >= questions.length ? L('Xem kết quả', 'View results') : L('Chuyển lượt tiếp', 'Next team')} iconRight="arrow-right" onPress={continueTurn} />
              </View>
            ) : null}

            {phase === 'result' ? (
              <View className="items-center rounded-[24px] px-5 py-8" style={{ backgroundColor: '#F3F0FB' }}>
                <Text style={{ fontSize: 60 }}>🏆</Text>
                <Text className="mt-2 text-center font-heavy text-pageTitle text-ink">{winners.length > 1 ? L('Hòa rồi! Cả lớp cùng thắng.', 'It is a tie! Everyone wins.') : L('Nhà vô địch bảng tinh vân', 'Starboard champions')}</Text>
                <View className="mt-5 w-full gap-2" style={{ maxWidth: 620 }}>
                  {teams.map((team, index) => ({ team, index })).sort((a, b) => (scores[b.index] ?? 0) - (scores[a.index] ?? 0)).map(({ team, index }, rank) => <View key={team.name + index} className="flex-row items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: winners.includes(index) ? '#F3F0FB' : '#F3F0FB' }}><Text className="font-heavy text-bodyLg text-ink">{['🥇', '🥈', '🥉', '🎖️'][rank]}</Text><Text style={{ fontSize: 24 }}>{team.icon}</Text><Text className="flex-1 font-heavy text-body text-ink">{team.name}</Text><Text className="font-heavy text-bodyLg" style={{ color: team.tone }}>{scores[index] ?? 0} {L('điểm', 'points')}</Text></View>)}
                </View>
                <Text className="mt-4 text-center font-semi text-body text-muted">{L(`${Object.values(tileResults).filter(Boolean).length}/${questions.length} câu trả lời đúng · từ đã học vẫn được ghi nhận vào Band9.`, `${Object.values(tileResults).filter(Boolean).length}/${questions.length} correct · your answers still count toward Band9 learning progress.`)}</Text>
                <View className="mt-5 flex-row flex-wrap justify-center gap-3"><Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={startGame} /><Button variant="outline" label={L('Chọn game khác', 'Choose another game')} onPress={() => router.replace('/duel' as never)} /></View>
              </View>
            ) : null}
          </View>

          <View className="flex-row flex-wrap items-center justify-between gap-2 px-5 py-3" style={{ backgroundColor: '#F3F0FB', borderTopWidth: 1, borderTopColor: '#484273' }}>
            <Text style={{ color: '#2B2350', fontFamily: 'monospace', fontSize: 10, fontWeight: '800' }}>BAND9 · {L('ĐẤU ĐỘI', 'TEAM SHOWDOWN')}</Text>
            <Text style={{ color: '#2B2350', fontSize: 10, fontWeight: '900' }}>{teams.length} {L('đội', 'teams')}  ·  {questions.length} {L('câu', 'questions')}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function SetupChip({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} className="rounded-pill px-4 py-2.5" style={{ backgroundColor: selected ? '#1D1B3C' : '#F3F0FB', borderWidth: 1.5, borderColor: selected ? '#E9BD62' : 'transparent', opacity: disabled ? 0.45 : 1 }}><Text className="font-heavy text-label" style={{ color: selected ? '#FFE28A' : '#373148' }}>{label}</Text></Pressable>;
}

function powerName(power: TeamPower, en: boolean): string {
  const labels: Record<TeamPower, [string, string]> = {
    comet: ['Sao chổi', 'Comet'],
    double: ['Nhân đôi', 'Double'],
    eclipse: ['Nhật thực', 'Eclipse'],
    stardust: ['Bụi sao', 'Stardust'],
  };
  return en ? labels[power][1] : labels[power][0];
}
