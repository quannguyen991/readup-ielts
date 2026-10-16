import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { MINIMAL_PAIRS, type MinimalPair } from '@/services/hub/games';
import { speak } from '@/services/hub/speak';

const ROUNDS = 8;

type Round = { pair: MinimalPair; say: 'a' | 'b' };

function makeRounds(): Round[] {
  const shuffled = [...MINIMAL_PAIRS].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
  return shuffled.map((pair) => ({ pair, say: Math.random() < 0.5 ? 'a' : 'b' }));
}

/** Nghe một từ, chọn đúng từ vừa nghe trong hai từ dễ nhầm. */
export default function MinimalPairsGame() {
  const rounds = useMemo(makeRounds, []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);

  const done = i >= rounds.length;
  const round = rounds[i];

  const choose = (side: 'a' | 'b') => {
    if (!round || picked) return;
    setPicked(side);
    if (side === round.say) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setI((n) => n + 1);
  };

  const reset = () => {
    setI(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <HubScreen title="Cặp âm tối thiểu" subtitle="Nghe rồi chọn đúng từ" back>
      {done ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>Đúng {score}/{rounds.length}</Text>
          <Pressable accessibilityRole="button" onPress={reset} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Chơi lại</Text>
          </Pressable>
        </View>
      ) : round ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>Câu {i + 1}/{rounds.length} · đúng {score}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Nghe từ" onPress={() => speak(round.say === 'a' ? round.pair.a : round.pair.b)} style={{ height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Nghe</Text>
          </Pressable>
          {(['a', 'b'] as const).map((side) => {
            const word = side === 'a' ? round.pair.a : round.pair.b;
            const ipa = side === 'a' ? round.pair.aIpa : round.pair.bIpa;
            const correct = side === round.say;
            const tone = picked === null ? HUB.line : correct ? HUB.green : picked === side ? HUB.red : HUB.line;
            return (
              <Pressable key={side} accessibilityRole="button" onPress={() => choose(side)} style={{ height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tone, backgroundColor: HUB.glass }}>
                <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>{word}</Text>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>{ipa}</Text>
              </Pressable>
            );
          })}
          {picked ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: HUB.body, fontSize: 13 }}>Cặp âm: {round.pair.contrast}. {picked === round.say ? 'Chính xác!' : 'Chưa đúng. Đáp án là từ được đọc.'}</Text>
              <Pressable accessibilityRole="button" onPress={next} style={{ height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Tiếp</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </HubScreen>
  );
}
