import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { dayKeyOf } from '@/services/hub/daily';
import { gradeLesson, lessonById } from '@/services/hub/grammar-course';
import { useHubStore } from '@/store/useHubStore';
import { useLessonStore } from '@/store/useLessonStore';

type Phase = 'learn' | 'quiz' | 'result';

export default function GrammarLessonPage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id);
  const completeLesson = useHubStore((s) => s.completeLesson);
  const [phase, setPhase] = useState<Phase>('learn');
  const [q, setQ] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);

  if (!lesson) {
    return (
      <HubScreen title="Không tìm thấy bài" back>
        <Text style={{ color: HUB.body }}>Bài này chưa có trong khoá học.</Text>
      </HubScreen>
    );
  }

  const total = lesson.questions.length;
  const current = lesson.questions[q];
  const result = phase === 'result' ? gradeLesson(lesson, picks) : null;

  const answer = (k: number) => {
    if (chosen !== null || !current) return;
    setChosen(k);
    setPicks((p) => [...p, k]);
  };

  const nextQuestion = () => {
    setChosen(null);
    if (q + 1 >= total) {
      const r = gradeLesson(lesson, [...picks]);
      if (r.passed) {
        completeLesson(lesson.id);
        useLessonStore.getState().markDone(`hub:${lesson.id}`);
        markTaskDone(dayKeyOf(new Date()), `grammar:${lesson.id}`);
      }
      setPhase('result');
    } else {
      setQ((n) => n + 1);
    }
  };

  const restart = () => {
    setPhase('learn');
    setQ(0);
    setPicks([]);
    setChosen(null);
  };

  return (
    <HubScreen title={lesson.title} subtitle={lesson.subtitle} back>
      {phase === 'learn' ? (
        <View style={{ gap: 14 }}>
          <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Quy tắc</Text>
            {lesson.rules.map((r) => (
              <Text key={r} style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>• {r}</Text>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => setPhase('quiz')} style={{ height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Làm bài kiểm tra ({total} câu)</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'quiz' && current ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>Câu {q + 1}/{total}</Text>
          <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '700', lineHeight: 26 }}>{current.q}</Text>
          {current.options.map((opt, k) => {
            const isAnswer = k === current.answer;
            const tone = chosen === null ? HUB.line : isAnswer ? HUB.green : chosen === k ? HUB.red : HUB.line;
            return (
              <Pressable key={opt} accessibilityRole="button" onPress={() => answer(k)} style={{ height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tone, backgroundColor: HUB.glassStrong }}>
                <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '700' }}>{opt}</Text>
              </Pressable>
            );
          })}
          {chosen !== null ? (
            <Pressable accessibilityRole="button" onPress={nextQuestion} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{q + 1 >= total ? 'Xem kết quả' : 'Câu tiếp'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {phase === 'result' && result ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>{result.passed ? 'Đạt' : 'Chưa đạt'}: {result.correct}/{result.total}</Text>
          <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
            {result.passed ? 'Bài đã được ghi vào tiến độ của bạn.' : 'Cần đúng ít nhất 2/3 câu để đạt. Đọc lại quy tắc rồi làm lại nhé.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={restart} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Làm lại</Text>
          </Pressable>
        </View>
      ) : null}
    </HubScreen>
  );
}
