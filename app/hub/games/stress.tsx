import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { STRESS_WORDS, type StressWord } from '@/services/hub/games';
import { speak } from '@/services/hub/speak';

/** Chạm vào âm tiết được nhấn mạnh nhất của từ. */
export default function StressGame() {
  const rounds = useMemo<StressWord[]>(() => [...STRESS_WORDS].sort(() => Math.random() - 0.5), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = i >= rounds.length;
  const w = rounds[i];

  const pick = (k: number) => {
    if (!w || picked !== null) return;
    setPicked(k);
    if (k === w.primary) setScore((s) => s + 1);
    speak(w.word);
  };

  const next = () => {
    setPicked(null);
    setI((n) => n + 1);
  };

  return (
    <HubScreen title="Trọng âm từ" subtitle="Chạm vào âm tiết được nhấn mạnh nhất" back>
      {done ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>Đúng {score}/{rounds.length}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setI(0); setScore(0); setPicked(null); }} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Chơi lại</Text>
          </Pressable>
        </View>
      ) : w ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>Từ {i + 1}/{rounds.length} · đúng {score}</Text>
          <Text style={{ color: HUB.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{w.word}</Text>
          <Text style={{ color: HUB.muted, fontSize: 13, textAlign: 'center' }}>{w.ipa}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
            {w.syllables.map((syl, k) => {
              const correct = k === w.primary;
              const tone = picked === null ? HUB.line : correct ? HUB.green : picked === k ? HUB.red : HUB.line;
              return (
                <Pressable key={`${syl}-${k}`} accessibilityRole="button" accessibilityLabel={`Âm tiết ${syl}`} onPress={() => pick(k)} style={{ minWidth: 68, height: 60, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tone, backgroundColor: HUB.glassStrong }}>
                  <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>{syl}</Text>
                </Pressable>
              );
            })}
          </View>
          {picked !== null ? (
            <Pressable accessibilityRole="button" onPress={next} style={{ height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Tiếp</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </HubScreen>
  );
}
