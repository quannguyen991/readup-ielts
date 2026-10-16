import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { ALL_LESSONS } from '@/services/hub/grammar-course';
import { MINIMAL_PAIRS } from '@/services/hub/games';
import { speak } from '@/services/hub/speak';

type Q =
  | { kind: 'sound'; say: string; options: string[]; answer: number; hint: string }
  | { kind: 'grammar'; q: string; options: string[]; answer: number; hint: string };

/** Bài tổng hợp: năm câu nghe cặp âm và năm câu ngữ pháp, chọn ngẫu nhiên mỗi lần. */
function makeQuestions(): Q[] {
  const pairs = [...MINIMAL_PAIRS].sort(() => Math.random() - 0.5).slice(0, 5);
  const sounds: Q[] = pairs.map((p) => {
    const flip = Math.random() < 0.5;
    const say = flip ? p.b : p.a;
    const options = flip ? [p.b, p.a] : [p.a, p.b];
    return { kind: 'sound', say, options, answer: options.indexOf(say), hint: `Cặp ${p.contrast}: ${p.a} ${p.aIpa} · ${p.b} ${p.bIpa}` };
  });
  const pool = ALL_LESSONS.flatMap((l) => l.questions.map((q) => ({ l, q })));
  const grammar: Q[] = [...pool].sort(() => Math.random() - 0.5).slice(0, 5).map(({ l, q }) => ({
    kind: 'grammar',
    q: q.q,
    options: q.options,
    answer: q.answer,
    hint: l.title,
  }));
  return [...sounds, ...grammar].sort(() => Math.random() - 0.5);
}

export default function BossTest() {
  const questions = useMemo(makeQuestions, []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = i >= questions.length;
  const q = questions[i];

  const pick = (k: number) => {
    if (!q || picked !== null) return;
    setPicked(k);
    if (k === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setI((n) => n + 1);
  };

  return (
    <HubScreen title="Thử thách cuối chương" subtitle="Mười câu tổng hợp âm và ngữ pháp" back>
      {done ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>Đúng {score}/{questions.length}</Text>
          <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
            {score >= 8 ? 'Rất tốt. Bạn đã nắm chắc các điểm này.' : 'Xem lại các bài ngữ pháp và cặp âm bạn đã sai rồi làm lại.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => { setI(0); setScore(0); setPicked(null); }} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Làm lại</Text>
          </Pressable>
        </View>
      ) : q ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>Câu {i + 1}/{questions.length} · đúng {score}</Text>
          {q.kind === 'sound' ? (
            <Pressable accessibilityRole="button" onPress={() => speak(q.say)} style={{ height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
              <Text style={{ color: HUB.ink, fontWeight: '800' }}>Nghe rồi chọn</Text>
            </Pressable>
          ) : (
            <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '700', lineHeight: 25 }}>{q.q}</Text>
          )}
          {q.options.map((opt, k) => {
            const tone = picked === null ? HUB.line : k === q.answer ? HUB.green : picked === k ? HUB.red : HUB.line;
            return (
              <Pressable key={opt} accessibilityRole="button" onPress={() => pick(k)} style={{ height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tone, backgroundColor: HUB.glassStrong }}>
                <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '700' }}>{opt}</Text>
              </Pressable>
            );
          })}
          {picked !== null ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: HUB.body, fontSize: 13 }}>{q.hint}</Text>
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
