import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildDuel, DUEL_LENGTH, pointsFor } from '@/services/duel/duel';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

type Rival = { id: string; name: string; glyph: string; coins: number };
type Phase = 'question' | 'fish' | 'hack' | 'result';

const START_RIVALS: Rival[] = [
  { id: 'mira', name: 'Mira', glyph: '🦊', coins: 34 },
  { id: 'kai', name: 'Kai', glyph: '🐼', coins: 28 },
  { id: 'sol', name: 'Sol', glyph: '🐸', coins: 41 },
];
const CARD = { boxShadow: '0 12px 30px rgba(15,23,42,0.10)' } as object;

/** Arcade cảm hứng từ quiz → câu cá → Hack; đối thủ máy giúp chơi được ngay, không cần tạo phòng. */
export default function FishingArcade() {
  const params = useLocalSearchParams<{ deck?: string }>();
  const slug = Array.isArray(params.deck) ? params.deck[0] : params.deck;
  const deck = useStudyDeck(slug || VOCAB_TOPICS[0]!.slug);
  const { L } = useL();
  const questions = useMemo(() => deck ? buildDuel(deck.words, `band9-fishing:${slug || deck.slug}`).slice(0, DUEL_LENGTH) : [], [deck, slug]);
  const [phase, setPhase] = useState<Phase>('question');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [rivals, setRivals] = useState(START_RIVALS);
  const [target, setTarget] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const actionUsed = useRef(false);
  const q = questions[index];

  const finishOrNext = () => {
    actionUsed.current = false;
    if (index + 1 >= questions.length) setPhase('result');
    else {
      setIndex((n) => n + 1);
      setPicked(null);
      setTarget(null);
      setNotice('');
      setPhase('question');
    }
  };

  const answer = (choice: number) => {
    if (!q || picked !== null) return;
    const correct = choice === q.correctIndex;
    setPicked(choice);
    useGameStore.getState().answer(correct, 'duel');
    if (correct) {
      setCombo((c) => c + 1);
      setScore((s) => s + pointsFor(true, 3500));
      setPhase('fish');
      setNotice(L('Chuẩn! Chọn vùng nước để thả câu.', 'Nice catch! Choose a fishing spot.'));
    } else {
      setCombo(0);
      setNotice(L(`Đáp án: ${q.options[q.correctIndex]}. Thử câu tiếp nhé!`, `Answer: ${q.options[q.correctIndex]}. Try the next one!`));
      setTimeout(finishOrNext, 1100);
    }
  };

  const fish = (spot: 'shore' | 'reef' | 'deep') => {
    if (actionUsed.current) return;
    actionUsed.current = true;
    const roll = Math.random();
    const catchCoins = spot === 'shore' ? 16 + Math.floor(Math.random() * 8)
      : spot === 'reef' ? (roll < 0.78 ? 30 + Math.floor(Math.random() * 26) : 0)
        : (roll < 0.48 ? 75 + Math.floor(Math.random() * 41) : 0);
    setCoins((n) => n + catchCoins);
    setRivals((rs) => rs.map((r) => ({ ...r, coins: r.coins + Math.floor(Math.random() * 12) + 7 })));
    setNotice(catchCoins ? L(`Cá cắn câu! +${catchCoins} xu.`, `Big catch! +${catchCoins} coins.`) : L('Cá lớn thoát mất! Không sao, bạn vẫn giữ điểm câu hỏi.', 'The big one got away! You keep your quiz points.'));
    if ((combo + 1) % 3 === 0) {
      setTimeout(() => { actionUsed.current = false; setTarget(null); setPhase('hack'); }, 650);
    } else setTimeout(finishOrNext, 850);
  };

  const hack = (meaningIndex: number) => {
    if (!q || !target || actionUsed.current) return;
    actionUsed.current = true;
    if (meaningIndex === q.correctIndex) {
      const victim = rivals.find((r) => r.id === target);
      const stolen = Math.min(24, victim?.coins ?? 0);
      setCoins((n) => n + stolen);
      setRivals((rs) => rs.map((r) => r.id === target ? { ...r, coins: Math.max(0, r.coins - stolen) } : r));
      setNotice(L(`Hack thành công! Chuyển ${stolen} xu từ ${victim?.name} sang bạn.`, `Hack successful! ${stolen} coins transferred from ${victim?.name} to you.`));
    } else setNotice(L('Sai mật mã — quyền Hack đã dùng hết.', 'Wrong code — your Hack token is gone.'));
    setTimeout(finishOrNext, 1050);
  };

  if (!deck || !questions.length) {
    return <Screen><Text className="font-heavy text-sectionTitle text-ink">{L('Bộ này chưa đủ từ để chơi.', 'This deck needs more words to play.')}</Text><Button className="mt-4 self-start" label={L('Về sảnh đấu', 'Back to arcade')} onPress={() => router.replace('/duel' as never)} /></Screen>;
  }

  const sorted = [...rivals].sort((a, b) => b.coins - a.coins);
  const playerPlace = sorted.filter((r) => r.coins > coins).length + 1;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 920 }}>
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <Pressable onPress={() => router.replace('/duel' as never)} className="rounded-pill bg-white px-4 py-2"><Text className="font-semi text-body text-ink">‹  {L('Sảnh đấu', 'Arcade')}</Text></Pressable>
          <Text className="font-semi text-label text-muted">{deck.nameVi} · {phase === 'result' ? questions.length : index + 1}/{questions.length} {L('câu', 'questions')}</Text>
        </View>

        <View className="mt-4 rounded-[24px] p-5" style={{ backgroundColor: '#FFFDF7' }}>
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View style={{ flex: 1, minWidth: 210 }}>
              <Text className="font-heavy" style={{ color: '#2A1808', fontSize: 28 }}>{L('BẾN CÁ BÍ MẬT', 'SECRET FISHING COVE')}</Text>
              <Text className="mt-1 font-sans text-body" style={{ color: '#2A1808' }}>{L('Đúng để câu cá · mỗi 3 combo mở một lần Hack', 'Answer to fish · every 3-streak earns a Hack')}</Text>
            </View>
            <View className="rounded-2xl px-4 py-2" style={{ backgroundColor: '#FFFDF7' }}><Text className="font-heavy text-bodyLg" style={{ color: '#8A5A00' }}>🪙 {coins} xu</Text><Text className="font-semi text-label" style={{ color: '#2A1808' }}>{L(`Hạng ${playerPlace}`, `Rank ${playerPlace}`)} · {score} pts</Text></View>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {sorted.map((r) => <View key={r.id} className="flex-row items-center gap-2 rounded-pill px-3 py-2" style={{ backgroundColor: '#FFFDF7' }}><Text>{r.glyph}</Text><Text className="font-semi text-label" style={{ color: '#2A1808' }}>{r.name}</Text><Text className="font-heavy text-label" style={{ color: '#8A5A00' }}>{r.coins}🪙</Text></View>)}
          </View>
        </View>

        <View className="mt-4 rounded-[22px] bg-white p-5" style={CARD}>
          {phase === 'result' ? (
            <View className="items-center py-5">
              <Text style={{ fontSize: 54 }}>🏆</Text>
              <Text className="mt-2 text-center font-heavy text-pageTitle text-ink">{playerPlace === 1 ? L('Bạn làm chủ bến cá!', 'You rule the cove!') : L('Hết giờ câu cá!', 'Fishing time is up!')}</Text>
              <Text className="mt-2 font-semi text-bodyLg text-muted">{L(`Hạng ${playerPlace} · ${coins} xu · ${score} điểm`, `Rank ${playerPlace} · ${coins} coins · ${score} points`)}</Text>
              <View className="mt-5 flex-row flex-wrap justify-center gap-3"><Button label={L('Chơi lại', 'Play again')} iconLeft="refresh" onPress={() => { setIndex(0); setPicked(null); setCombo(0); setCoins(0); setScore(0); setRivals(START_RIVALS); setPhase('question'); }} /><Button variant="outline" label={L('Chọn bộ khác', 'Choose another deck')} onPress={() => router.replace('/duel' as never)} /></View>
            </View>
          ) : phase === 'fish' ? (
            <View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('Chọn chỗ thả câu', 'Choose your fishing spot')}</Text>
              <Text className="mt-1 font-sans text-body text-muted">{notice} {L(`Combo ${combo} 🔥`, `Streak ${combo} 🔥`)}</Text>
              <View className="mt-4 flex-row flex-wrap gap-3">
                <FishingSpot title={L('Bờ cạn', 'Shallow')} icon="🦐" detail={L('An toàn · 16–23 xu', 'Safe · 16–23 coins')} onPress={() => fish('shore')} />
                <FishingSpot title={L('Rạn san hô', 'Coral reef')} icon="🐠" detail={L('78% · 30–55 xu', '78% · 30–55 coins')} onPress={() => fish('reef')} />
                <FishingSpot title={L('Biển sâu', 'Deep sea')} icon="🦈" detail={L('48% · 75–115 xu', '48% · 75–115 coins')} onPress={() => fish('deep')} />
              </View>
            </View>
          ) : phase === 'hack' && q ? (
            <View>
              <Text className="font-heavy text-sectionTitle text-ink">{L('⚡ Cơ hội Hack!', '⚡ Hack token!')}</Text>
              <Text className="mt-1 font-sans text-body text-muted">{L('Chọn đối thủ, rồi giải mật mã nghĩa từ để lấy 24 xu.', 'Pick a rival, then crack the word code to steal up to 24 coins.')}</Text>
              <View className="mt-4 flex-row flex-wrap gap-2">{rivals.map((r) => <Pressable key={r.id} onPress={() => setTarget(r.id)} className="rounded-pill px-4 py-2" style={{ backgroundColor: target === r.id ? '#101A36' : '#F8F5EF' }}><Text className="font-semi text-body" style={{ color: target === r.id ? '#F3EDE1' : '#1A1A33' }}>{r.glyph} {r.name} · {r.coins}🪙</Text></Pressable>)}</View>
              <Text className="mt-4 font-heavy text-bodyLg text-ink">{q.enToVi ? q.word.word : q.word.meaningVi} {q.enToVi ? q.word.ipa : ''}</Text>
              <View className="mt-3 gap-2">{q.options.map((opt, i) => <Option key={`hack-${i}`} label={opt} disabled={!target} onPress={() => hack(i)} />)}</View>
              {notice ? <Text className="mt-3 font-semi text-body" style={{ color: '#6A4BD9' }}>{notice}</Text> : null}
            </View>
          ) : q ? (
            <View>
              <View className="flex-row items-center justify-between"><Text className="font-semi text-label uppercase tracking-[1px] text-muted">{L('Câu', 'Question')} {index + 1}/{questions.length} · {L('chọn nghĩa đúng', 'choose the meaning')}</Text><Text className="font-heavy text-label" style={{ color: '#6A4BD9' }}>{combo} 🔥</Text></View>
              <Text className="mt-4 font-heavy text-pageTitle text-ink">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
              {q.enToVi && q.word.example ? <Text className="mt-2 font-sans text-body text-muted">{q.word.example}</Text> : null}
              <View className="mt-5 gap-2.5">{q.options.map((opt, i) => <Option key={`${i}-${opt}`} label={`${i + 1}.  ${opt}`} selected={picked === i} correct={picked !== null && i === q.correctIndex} wrong={picked === i && i !== q.correctIndex} disabled={picked !== null} onPress={() => answer(i)} />)}</View>
              {notice ? <Text className="mt-3 font-semi text-body" style={{ color: '#6A4BD9' }}>{notice}</Text> : null}
            </View>
          ) : null}
        </View>
        <Text className="mt-3 text-center font-sans text-label text-muted">{L('Xu chỉ dùng trong ván chơi · trả lời đúng vẫn tích lũy tiến trình Band9.', 'Coins stay in this match · correct answers still count toward your Band9 progress.')}</Text>
      </View>
    </Screen>
  );
}

function Option({ label, onPress, disabled, selected, correct, wrong }: { label: string; onPress: () => void; disabled?: boolean; selected?: boolean; correct?: boolean; wrong?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className="rounded-2xl px-4 py-3.5" style={{ borderWidth: 1.5, borderColor: correct ? '#16A34A' : wrong ? '#F04438' : selected ? '#6A4BD9' : '#F0E9DC', backgroundColor: correct ? '#E8F8EE' : wrong ? '#FEECEB' : '#FFFFFF' }}><Text className="font-semi text-bodyLg text-ink">{label}</Text></Pressable>;
}

function FishingSpot({ title, icon, detail, onPress }: { title: string; icon: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} className="items-center rounded-[18px] px-4 py-4" style={{ flexGrow: 1, flexBasis: 155, backgroundColor: '#F9F6F1', borderWidth: 1, borderColor: '#F0E9DC' }}><Text style={{ fontSize: 32 }}>{icon}</Text><Text className="mt-1 font-heavy text-body text-ink">{title}</Text><Text className="mt-1 text-center font-sans text-label text-muted">{detail}</Text></Pressable>;
}
