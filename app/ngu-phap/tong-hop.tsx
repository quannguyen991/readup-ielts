import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { PC, SectionCard, useCourseFonts } from '@/components/hub/PhonemeCourse';
import { Screen } from '@/components/layout/Screen';
import { NeonPageHero } from '@/components/neon/NeonPageHero';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { CEFR_LEVELS, lessonsOfLevel, type CefrLevel, type GrammarQuizItem } from '@/data/grammar';
import { useL } from '@/i18n/useL';
import { useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/**
 * Bài kiểm tra tổng hợp theo cấp: 15 câu rút ngẫu nhiên từ phần kiểm tra cuối của mọi bài trong cấp,
 * làm từng câu một, bấm phím 1–4 để chọn. Đạt từ 11/15. Điểm cao nhất lưu theo mã `final-<cấp>`.
 */
const TOTAL = 15;
const FINAL_PASS = 11;
const SOFT = { boxShadow: '0 6px 24px rgba(60, 40, 120, 0.08)' } as object;

type Q = GrammarQuizItem & { lessonId: string; lessonTitle: string };

function buildQuestions(level: CefrLevel): Q[] {
  const all: Q[] = lessonsOfLevel(level).flatMap((l) => l.quiz.map((q) => ({ ...q, lessonId: l.id, lessonTitle: l.title })));
  const a = [...all];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, TOTAL);
}

export default function GrammarFinalTest() {
  useCourseFonts();
  const { L } = useL();
  const { level: raw } = useLocalSearchParams<{ level?: string }>();
  const level: CefrLevel = (CEFR_LEVELS as readonly string[]).includes(String(raw)) ? (raw as CefrLevel) : 'A1';
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildQuestions(level), [level, round]);
  const record = useGrammarProgressStore((s) => s.record);
  const bestBefore = useGrammarProgressStore((s) => s.best[`final-${level}`]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Q[]>([]);
  const [score, setScore] = useState(0);
  const total = questions.length;
  const done = index >= total;
  const q = questions[index];

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
    else setWrong((w) => [...w, q]);
  };
  const next = () => {
    const last = index + 1 >= total;
    setPicked(null);
    setIndex((n) => n + 1);
    if (last) record(`final-${level}`, score);
  };
  const again = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setWrong([]);
    setScore(0);
  };

  useHotkeys((e) => {
    if (done) {
      if (e.key === 'Enter') again();
      return;
    }
    if (picked === null && /^[1-4]$/.test(e.key) && Number(e.key) <= (q?.options.length ?? 0)) pick(Number(e.key) - 1);
    else if (picked !== null && e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  });

  return (
    <Screen>
      <NeonPageHero
        scene="path"
        titleScale={0.7}
        title={L(`Kiểm tra tổng hợp ${level}`, `${level} review test`)}
        subtitle={L(`${TOTAL} câu từ mọi bài của cấp ${level}. Đạt từ ${FINAL_PASS}/${TOTAL}.`, `${TOTAL} questions from every ${level} lesson. Pass at ${FINAL_PASS}/${TOTAL}.`)}
        chips={bestBefore !== undefined ? [{ label: L(`Điểm cao nhất ${bestBefore}/${TOTAL}`, `Best ${bestBefore}/${TOTAL}`), icon: 'star5' }] : undefined}
      />

      {total === 0 ? (
        <SectionCard title={L('Chưa có câu hỏi', 'No questions')}>
          <Text style={{ fontFamily: PC.body, fontSize: 15, color: PC.ink }}>{L('Cấp này chưa có bài kiểm tra.', 'This level has no quiz yet.')}</Text>
        </SectionCard>
      ) : done ? (
        <SectionCard title={L('Kết quả', 'Result')}>
          <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 44, color: score >= FINAL_PASS ? '#16814E' : PC.purple }}>{score}/{total}</Text>
          <Text style={{ marginTop: 4, fontFamily: PC.body, fontWeight: '700', fontSize: 16, color: PC.ink }}>
            {score >= FINAL_PASS ? L(`Đạt! Bạn đã vững cấp ${level}.`, `Passed! You have ${level} under control.`) : L('Chưa đạt, ôn lại các bài bên dưới rồi thử lại.', 'Not yet — review the lessons below and try again.')}
          </Text>
          {wrong.length ? (
            <View style={{ marginTop: 14, gap: 8 }}>
              <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 16, color: PC.ink }}>{L('Bài cần xem lại', 'Lessons to review')}</Text>
              {[...new Map(wrong.map((w) => [w.lessonId, w.lessonTitle])).entries()].map(([id, title]) => (
                <Pressable key={id} accessibilityRole="link" onPress={() => router.push(`/ngu-phap/${id}` as never)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#FBFAFF', borderWidth: 1.5, borderColor: PC.line }}>
                  <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: PC.purple }}>{title} →</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Pressable accessibilityRole="button" onPress={again} style={{ height: 48, paddingHorizontal: 24, borderRadius: 24, justifyContent: 'center', backgroundColor: PC.purple }}>
              <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: '#FFFFFF' }}>{L('Làm đề mới (Enter)', 'New test (Enter)')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/ngu-phap' as never)} style={{ height: 48, paddingHorizontal: 24, borderRadius: 24, justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: PC.purple }}>
              <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: PC.purple }}>{L('Về danh sách bài', 'Back to lessons')}</Text>
            </Pressable>
          </View>
        </SectionCard>
      ) : (
        <SectionCard title={L(`Câu ${index + 1}/${total}`, `Question ${index + 1}/${total}`)}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#EFEBFA', overflow: 'hidden', marginBottom: 14 }}>
            <View style={{ width: `${(index / total) * 100}%`, height: 8, backgroundColor: PC.purple }} />
          </View>
          <Text style={{ fontFamily: PC.display, fontWeight: '700', fontSize: 22, lineHeight: 30, color: PC.ink }}>{q!.q}</Text>
          <View style={{ gap: 10, marginTop: 14 }}>
            {q!.options.map((opt, i) => {
              const right = picked !== null && i === q!.answer;
              const bad = picked === i && i !== q!.answer;
              return (
                <Pressable key={i} accessibilityRole="button" onPress={() => pick(i)} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: right ? '#EAF9F0' : bad ? '#FDECEC' : '#FFFFFF', borderWidth: 2, borderColor: right ? '#22C55E' : bad ? '#EF4444' : PC.line }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEBFA' }}>
                    <Text style={{ fontFamily: PC.display, fontWeight: '400', fontSize: 14, color: PC.purple }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontFamily: PC.body, fontSize: 16, color: PC.ink }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
          {picked !== null ? (
            <View style={{ marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: '#F3F0FB' }}>
              <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: picked === q!.answer ? '#16814E' : '#B91C1C' }}>{picked === q!.answer ? L('Đúng rồi!', 'Correct!') : L('Chưa đúng.', 'Not quite.')}</Text>
              <Text style={{ marginTop: 4, fontFamily: PC.body, fontSize: 14, lineHeight: 20, color: PC.ink }}>{q!.explain}</Text>
              <Pressable accessibilityRole="button" onPress={next} style={{ marginTop: 12, alignSelf: 'flex-start', height: 44, paddingHorizontal: 22, borderRadius: 22, justifyContent: 'center', backgroundColor: PC.purple }}>
                <Text style={{ fontFamily: PC.body, fontWeight: '700', fontSize: 15, color: '#FFFFFF' }}>{index + 1 >= total ? L('Xem kết quả (Enter)', 'See result (Enter)') : L('Câu tiếp (Enter)', 'Next (Enter)')}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ marginTop: 14, fontFamily: PC.body, fontSize: 13, color: '#6B6590' }}>{L('Bấm phím 1–4 để chọn.', 'Press 1–4 to choose.')}</Text>
          )}
        </SectionCard>
      )}
      <View style={{ height: 32 }} />
    </Screen>
  );
}
