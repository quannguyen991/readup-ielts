import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Icon } from '@/components/ui';
import { grammarLessonById, type GrammarLessonDetail, type GrammarStep } from '@/data/grammar';
import { useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/**
 * PHÒNG BÀI NGỮ PHÁP: cột trái là mục lục các bước và tiến độ; cột phải là nội dung
 * bước hiện tại. Bước cuối là bài kiểm tra 5 câu không gợi ý.
 */

const INK = '#2B2350';
const ACCENT = '#B94A70';
const CREAM = '#F3F0FB';
const NAVY = '0F1D33';

export default function GrammarLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = typeof id === 'string' ? grammarLessonById(id) : undefined;
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [at, setAt] = useState(0);

  if (!lesson) {
    return (
      <Screen>
        <Text className="font-heavy" style={{ fontSize: 22, color: INK }}>Không tìm thấy bài này.</Text>
        <Button className="mt-4 self-start" label="Về danh sách ngữ pháp" onPress={() => router.replace('/ngu-phap' as never)} />
      </Screen>
    );
  }

  const steps = lesson.steps;
  const total = steps.length + 1; // thêm bước kiểm tra cuối
  const isQuiz = at === steps.length;
  const current = isQuiz ? null : steps[at];

  return (
    <Screen>
      <Pressable onPress={() => router.replace('/ngu-phap' as never)} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#FFFFFF' }}>
        <Text className="font-strong" style={{ color: INK }}>‹ Quay lại</Text>
      </Pressable>

      <View style={{ marginTop: 14, flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        {/* Cột trái: mục lục */}
        <View style={{ width: wide ? 300 : '100%', backgroundColor: '#F3F0FB', borderRadius: 22, borderWidth: 2, borderColor: INK, padding: 18, boxShadow: `0 5px 0 ${INK}` } as object}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1.5, borderColor: INK }}>
              <Text className="font-strong" style={{ color: INK, fontSize: 12 }}>{lesson.level}</Text>
            </View>
            <Text className="font-sans" style={{ color: '#6B5E4E', fontSize: 13 }}>{lesson.titleEn} · {lesson.minutes} phút</Text>
          </View>
          <Text className="font-heavy" style={{ marginTop: 10, fontSize: 24, lineHeight: 30, color: INK }}>{lesson.title}</Text>
          <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: '#4B4036' }}>{lesson.summary}</Text>

          <ProgressRing done={Math.min(at, total)} total={total} />

          <View style={{ marginTop: 14, gap: 4 }}>
            {steps.map((s, i) => (
              <StepRow key={i} label={s.label} done={i < at} active={i === at} onPress={() => setAt(i)} />
            ))}
            <StepRow label="Kiểm tra cuối" done={false} active={isQuiz} onPress={() => setAt(steps.length)} />
          </View>
        </View>

        {/* Cột phải: nội dung bước */}
        <View style={{ flex: 1, minWidth: 0, width: wide ? undefined : '100%' }}>
          <Appear key={at} index={0}>
            {current ? <StepView step={current} /> : <QuizView lesson={lesson} onDone={() => setAt(0)} />}
          </Appear>

          {!isQuiz ? (
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="outline" label="Bước trước" disabled={at === 0} onPress={() => setAt((v) => Math.max(0, v - 1))} />
              <Button label={at === steps.length - 1 ? 'Sang kiểm tra' : 'Tiếp tục'} iconRight="arrow-right" onPress={() => setAt((v) => Math.min(steps.length, v + 1))} />
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = Math.round((Math.min(done, total) / total) * 100);
  return (
    <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <Text className="font-heavy" style={{ color: INK, fontSize: 15 }}>{pct}%</Text>
      </View>
      <Text className="font-sans" style={{ color: '#4B4036', fontSize: 14, flexShrink: 1 }}>Bạn đã đi qua {Math.min(done, total)} / {total} bước.</Text>
    </View>
  );
}

function StepRow({ label, done, active, onPress }: { label: string; done: boolean; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 14, backgroundColor: active ? '#FFFFFF' : 'transparent', borderWidth: active ? 2 : 0, borderColor: ACCENT } as object}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: done || active ? ACCENT : '#B9AE9C', backgroundColor: done ? ACCENT : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text className={active ? 'font-heavy' : 'font-strong'} style={{ color: INK, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function StepView({ step }: { step: GrammarStep }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: INK, padding: 24, gap: 14, boxShadow: `0 5px 0 ${INK}` } as object}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F3F0FB' }}>
        <Text className="font-strong" style={{ color: ACCENT, fontSize: 12, letterSpacing: 0.6 }}>{step.label.toUpperCase()}</Text>
      </View>
      <Text className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: INK }}>{step.title}</Text>
      <Text className="font-sans" style={{ fontSize: 16, lineHeight: 25, color: '#3B3128' }}>{step.body}</Text>

      {step.formula ? (
        <View style={{ backgroundColor: CREAM, borderRadius: 14, borderWidth: 1.5, borderColor: '#D8C9B0', padding: 14 }}>
          <Text className="font-strong" style={{ color: INK, fontSize: 16, letterSpacing: 0.3 }}>{step.formula}</Text>
        </View>
      ) : null}

      {step.bullets ? (
        <View style={{ gap: 8 }}>
          {step.bullets.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '900' }}>•</Text>
              <Text className="font-sans" style={{ flex: 1, fontSize: 15, lineHeight: 22, color: '#3B3128' }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {step.examples ? (
        <View style={{ gap: 10 }}>
          <Text className="font-strong" style={{ color: '#6B5E4E', fontSize: 13, letterSpacing: 0.5 }}>VÍ DỤ</Text>
          {step.examples.map((ex, i) => (
            <ExampleRow key={i} en={ex.en} vi={ex.vi} mark={ex.mark} />
          ))}
        </View>
      ) : null}

      {step.mistakes ? (
        <View style={{ gap: 10 }}>
          {step.mistakes.map((m, i) => (
            <View key={i} style={{ borderRadius: 14, borderWidth: 1.5, borderColor: '#E7D2A8', backgroundColor: '#F3F0FB', padding: 14, gap: 6 }}>
              <Text className="font-sans" style={{ color: '#B42318', fontSize: 15, textDecorationLine: 'line-through' }}>{m.wrong}</Text>
              <Text className="font-strong" style={{ color: '#15803D', fontSize: 16 }}>{m.right}</Text>
              <Text className="font-sans" style={{ color: '#4B4036', fontSize: 14, lineHeight: 20 }}>{m.why}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Một ví dụ: câu tiếng Anh (phần `mark` được tô nổi), nghĩa tiếng Việt, và nút loa. */
function ExampleRow({ en, vi, mark }: { en: string; vi: string; mark?: string }) {
  const parts = mark && en.includes(mark) ? en.split(mark) : [en];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F0FB' }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="volume" size={16} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-sans" style={{ fontSize: 17, color: INK }}>
          {parts.map((p, i) => (
            <Text key={i}>
              {p}
              {i < parts.length - 1 ? <Text className="font-heavy" style={{ color: ACCENT }}>{mark}</Text> : null}
            </Text>
          ))}
        </Text>
        <Text className="font-sans" style={{ fontSize: 14, color: '#6B5E4E', marginTop: 2 }}>{vi}</Text>
      </View>
    </View>
  );
}

function QuizView({ lesson, onDone }: { lesson: GrammarLessonDetail; onDone: () => void }) {
  const [picks, setPicks] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(() => lesson.quiz.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0), [lesson.quiz, picks]);
  const allPicked = picks.every((p) => p !== null);
  const record = useGrammarProgressStore((st) => st.record);

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: INK, padding: 24, gap: 16, boxShadow: `0 5px 0 ${INK}` } as object}>
      <Text className="font-heavy" style={{ fontSize: 26, color: INK }}>Kiểm tra cuối</Text>
      <Text className="font-sans" style={{ fontSize: 15, color: '#4B4036' }}>Năm câu, không có gợi ý. Chọn đáp án rồi nộp bài.</Text>
      {lesson.quiz.map((q, qi) => (
        <View key={qi} style={{ gap: 8 }}>
          <Text className="font-strong" style={{ fontSize: 16, color: INK }}>{qi + 1}. {q.q}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {q.options.map((opt, oi) => {
              const on = picks[qi] === oi;
              const right = submitted && oi === q.answer;
              const wrong = submitted && on && oi !== q.answer;
              return (
                <Pressable
                  key={oi}
                  disabled={submitted}
                  onPress={() => setPicks((p) => p.map((v, i) => (i === qi ? oi : v)))}
                  accessibilityRole="radio"
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 2, borderColor: right ? '#15803D' : wrong ? '#B42318' : on ? INK : '#D8C9B0', backgroundColor: right ? '#DCFCE7' : wrong ? '#FEE2E2' : on ? CREAM : '#FFFFFF' } as object}
                >
                  <Text className="font-strong" style={{ color: INK, fontSize: 15 }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
          {submitted ? <Text className="font-sans" style={{ fontSize: 14, color: '#4B4036' }}>{q.explain}</Text> : null}
        </View>
      ))}
      {!submitted ? (
        <Button label="Nộp bài" disabled={!allPicked} onPress={() => { record(lesson.id, score); setSubmitted(true); }} />
      ) : (
        <View style={{ gap: 10 }}>
          <Text className="font-heavy" style={{ fontSize: 22, color: score >= 4 ? '#15803D' : ACCENT }}>{score} / {lesson.quiz.length} câu đúng</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="outline" label="Học lại từ đầu" onPress={onDone} />
            <Button label="Về danh sách" onPress={() => router.replace('/ngu-phap' as never)} />
          </View>
        </View>
      )}
    </View>
  );
}
