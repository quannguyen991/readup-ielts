import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { NeonPageHero } from '@/components/neon/NeonPageHero';
import { Icon } from '@/components/ui/Icon';
import { TILE_TONES } from '@/components/vocab/UnitTile';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { CONFUSABLE_PAIRS, questionsFor, type ConfusablePair, type ConfusableQuestion } from '@/data/confusable-words';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';

/** So sánh từ dễ nhầm: thẻ đối đầu A vs B (nghĩa, ví dụ, mẹo) và luyện điền từ, bấm phím 1–2 để chọn. */
const F = { reg: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', black: 'Nunito_700Bold' };
const ROUND = 10;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function CompareWordsScreen() {
  const { L } = useL();
  const [mode, setMode] = useState<'look' | 'drill'>('look');
  const [query, setQuery] = useState('');
  const pairs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CONFUSABLE_PAIRS.filter((p) => `${p.a} ${p.b} ${p.viA} ${p.viB}`.toLowerCase().includes(q)) : CONFUSABLE_PAIRS;
  }, [query]);

  return (
    <Screen>
      <NeonPageHero scene="vocab" titleScale={0.8} title="affect VS effect" subtitle={L('40 cặp hay dùng lẫn, mỗi cặp một mẹo nhớ.', '40 pairs people mix up, each with a memory tip.')} chips={[{ label: L('Từ dễ nhầm', 'Confusing words'), icon: 'book' }]} />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }} accessibilityRole="tablist">
        {([['look', L('Tra cặp từ', 'Browse')], ['drill', L('Luyện điền từ', 'Fill-in drill')]] as const).map(([k, label]) => {
          const on = mode === k;
          return (
            <Pressable key={k} accessibilityRole="tab" aria-selected={on} onPress={() => setMode(k)} style={{ height: 50, paddingHorizontal: 24, borderRadius: 25, justifyContent: 'center', backgroundColor: on ? '#DB2777' : '#FFFFFF', borderWidth: 2, borderColor: on ? '#DB2777' : '#F3D9E5' }}>
              <Text style={{ fontFamily: F.black, fontSize: 17, color: on ? '#FFFFFF' : '#2B2350' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'look' ? (
        <>
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 18, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F3D9E5' }}>
            <Icon name="search" size={18} color="#DB2777" />
            <TextInput
              accessibilityLabel={L('Tìm cặp từ', 'Search pairs')}
              value={query}
              onChangeText={setQuery}
              placeholder={L('Gõ một từ hoặc nghĩa tiếng Việt…', 'Type a word or meaning…')}
              placeholderTextColor="#A89BB8"
              autoCapitalize="none"
              style={{ flex: 1, fontFamily: F.reg, fontSize: 16, color: '#2B2350', outlineStyle: 'none' as never }}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 18 }}>
            {pairs.map((p, i) => (
              <PairCard key={`${p.a}|${p.b}`} pair={p} index={i} />
            ))}
          </View>
        </>
      ) : (
        <Drill />
      )}
      <View style={{ height: 32 }} />
    </Screen>
  );
}

function PairCard({ pair, index }: { pair: ConfusablePair; index: number }) {
  const [a1, a2] = TILE_TONES[index % TILE_TONES.length]!;
  const [b1, b2] = TILE_TONES[(index + 3) % TILE_TONES.length]!;
  const half = (word: string, vi: string, ex: string, c1: string, c2: string, align: 'left' | 'right') => (
    <View
      style={
        {
          flex: 1,
          minWidth: 0,
          padding: 16,
          paddingTop: 14,
          paddingBottom: 18,
          backgroundColor: c1,
          backgroundImage: `linear-gradient(160deg, ${c1}, ${c2})`,
          [align === 'left' ? 'paddingRight' : 'paddingLeft']: 30,
        } as never
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: F.black, fontSize: 28, lineHeight: 34, color: '#FFFFFF' }}>{word}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Nghe ${word}`} onPress={() => void pronounce(word)} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)' }}>
          <Icon name="volume" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 16, lineHeight: 21, color: '#FFFFFF' }}>{vi}</Text>
      <Text style={{ marginTop: 8, fontFamily: F.reg, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.92)' }}>“{ex}”</Text>
    </View>
  );
  return (
    <View style={{ flexGrow: 1, flexBasis: 440, borderRadius: 28, backgroundColor: '#FFFFFF', overflow: 'hidden', boxShadow: '0 10px 28px rgba(60,40,120,0.12)' } as never}>
      <View style={{ flexDirection: 'row' }}>
        {half(pair.a, pair.viA, pair.exA, a1, a2, 'left')}
        {half(pair.b, pair.viB, pair.exB, b1, b2, 'right')}
        <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' } as never}>
          <Text style={{ fontFamily: F.black, fontSize: 13, color: '#7C2D12' }}>VS</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, paddingHorizontal: 18, backgroundColor: '#FFF7D6' }}>
        <Text style={{ fontSize: 18 }}>💡</Text>
        <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 15, lineHeight: 21, color: '#5B3A00' }}>{pair.tip}</Text>
      </View>
    </View>
  );
}

function Drill() {
  const { L } = useL();
  const [round, setRound] = useState(0);
  const questions = useMemo<ConfusableQuestion[]>(() => shuffle(questionsFor(CONFUSABLE_PAIRS, round)).slice(0, ROUND), [round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= questions.length;
  const q = questions[index];

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setIndex((n) => n + 1);
  };
  const again = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  useHotkeys((e) => {
    if (done) {
      if (e.key === 'Enter') again();
      return;
    }
    if (picked === null && (e.key === '1' || e.key === '2')) pick(Number(e.key) - 1);
    else if (picked !== null && e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  });

  const shell = { marginTop: 18, borderRadius: 30, padding: 24, backgroundColor: '#2B1B6B', backgroundImage: 'linear-gradient(150deg, #2B1B6B, #5B2A9C)', boxShadow: '0 14px 34px rgba(60,30,120,0.35)' } as never;

  if (done) {
    return (
      <View style={shell}>
        <Text style={{ fontFamily: F.bold, fontSize: 14, letterSpacing: 3, color: 'rgba(255,255,255,0.75)' }}>{L('KẾT QUẢ', 'RESULT')}</Text>
        <Text style={{ fontFamily: F.black, fontSize: 64, lineHeight: 72, color: '#FDE68A' }}>{score}/{questions.length}</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 18, color: '#FFFFFF' }}>{score >= 8 ? L('Rất chắc tay!', 'Very solid!') : L('Xem lại mẹo ở tab “Tra cặp từ” rồi thử lại.', 'Review the tips in Browse, then try again.')}</Text>
        <Pressable accessibilityRole="button" onPress={again} style={{ marginTop: 18, alignSelf: 'flex-start', height: 52, paddingHorizontal: 28, borderRadius: 26, justifyContent: 'center', backgroundColor: '#FDE68A' }}>
          <Text style={{ fontFamily: F.black, fontSize: 17, color: '#4A2A00' }}>{L('Làm lượt mới (Enter)', 'New round (Enter)')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={shell}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 14, letterSpacing: 2, color: 'rgba(255,255,255,0.75)' }}>{L(`CÂU ${index + 1}/${questions.length}`, `QUESTION ${index + 1}/${questions.length}`)}</Text>
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
          <View style={{ width: `${(index / questions.length) * 100}%`, height: 8, backgroundColor: '#FDE68A' }} />
        </View>
      </View>
      <Text style={{ marginTop: 18, fontFamily: F.black, fontSize: 28, lineHeight: 38, color: '#FFFFFF' }}>{q!.sentence}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 20 }}>
        {q!.options.map((opt, i) => {
          const isRight = picked !== null && i === q!.answer;
          const isWrong = picked === i && i !== q!.answer;
          return (
            <Pressable
              key={opt}
              accessibilityRole="button"
              onPress={() => pick(i)}
              style={{ flexGrow: 1, flexBasis: 220, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, borderRadius: 22, backgroundColor: isRight ? '#22C55E' : isWrong ? '#EF4444' : '#FFFFFF' }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: isRight || isWrong ? 'rgba(255,255,255,0.3)' : '#F1ECFF' }}>
                <Text style={{ fontFamily: F.black, fontSize: 16, color: isRight || isWrong ? '#FFFFFF' : '#5B2A9C' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: F.black, fontSize: 24, color: isRight || isWrong ? '#FFFFFF' : '#2B2350' }}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked !== null ? (
        <View style={{ marginTop: 16, padding: 16, borderRadius: 20, backgroundColor: '#FFF7D6' }}>
          <Text style={{ fontFamily: F.black, fontSize: 18, color: picked === q!.answer ? '#15803D' : '#B91C1C' }}>
            {picked === q!.answer ? L('Đúng rồi!', 'Correct!') : L(`Chưa đúng, đáp án là “${q!.options[q!.answer]}”.`, `Not quite — the answer is “${q!.options[q!.answer]}”.`)}
          </Text>
          <Text style={{ marginTop: 4, fontFamily: F.bold, fontSize: 15, lineHeight: 21, color: '#5B3A00' }}>💡 {q!.pair.tip}</Text>
          <Pressable accessibilityRole="button" onPress={next} style={{ marginTop: 12, alignSelf: 'flex-start', height: 46, paddingHorizontal: 24, borderRadius: 23, justifyContent: 'center', backgroundColor: '#5B2A9C' }}>
            <Text style={{ fontFamily: F.black, fontSize: 16, color: '#FFFFFF' }}>{L('Câu tiếp (Enter)', 'Next (Enter)')}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={{ marginTop: 16, fontFamily: F.reg, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{L('Bấm phím 1 hoặc 2 để chọn.', 'Press 1 or 2 to choose.')}</Text>
      )}
    </View>
  );
}
