import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { buildFill, buildMcq, isFillCorrect, lessonById, type FillItem, type McqItem } from '@/services/vocab-review/quiz';

import { useVocabReviewStore } from '@/store/useVocabReviewStore';

/**
 * ÔN TẬP MỘT BÀI TỪ VỰNG: chế độ trắc nghiệm ABCD (50 câu) hoặc điền từ vào ô trống.
 * Làm xong thì lưu điểm cao nhất của bài và liệt kê các câu sai để xem lại.
 */

const INK = '#2B2118';
const ACCENT = '#8F6E36';
const CREAM = '#FBF6EC';
const GREEN = '#15803D';
const RED = '#B42318';
const LETTERS = ['A', 'B', 'C', 'D'];

export default function VocabQuizScreen() {
  const { lesson: lessonId, mode: modeParam } = useLocalSearchParams<{ lesson: string; mode?: string }>();
  const mode = modeParam === 'fill' ? 'fill' : 'mcq';
  const lesson = useMemo(() => (typeof lessonId === 'string' ? lessonById(lessonId) : undefined), [lessonId]);
  const mcq = useMemo(() => (lesson && mode === 'mcq' ? buildMcq(lesson) : []), [lesson, mode]);
  const fill = useMemo(() => (lesson && mode === 'fill' ? buildFill(lesson) : []), [lesson, mode]);

  if (!lesson) {
    return (
      <Screen>
        <Text className="font-heavy" style={{ fontSize: 22, color: INK }}>Không tìm thấy bài này.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/tu-vung-cefr' as never)} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
          <Text className="font-strong" style={{ color: ACCENT }}>‹ Về danh sách</Text>
        </Pressable>
      </Screen>
    );
  }

  const title = `${lesson.level} · Bài ${lesson.topicIndex + 1} · ${lesson.topic}`;
  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/tu-vung-cefr' as never)} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#FFFFFF' }}>
        <Text className="font-strong" style={{ color: INK }}>‹ Danh sách bài</Text>
      </Pressable>
      <View style={{ marginTop: 14, backgroundColor: '#0F1D33', borderRadius: 22, borderWidth: 2, borderColor: INK, padding: 20 }}>
        <Text className="font-sans" style={{ fontSize: 13, color: '#D7DCE8' }}>{mode === 'fill' ? 'Điền từ vào ô trống' : 'Trắc nghiệm ABCD · 50 câu'}</Text>
        <Text className="font-heavy" style={{ marginTop: 4, fontSize: 24, color: '#F3D9A0' }}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable accessibilityRole="tab" aria-selected={mode === 'mcq'} onPress={() => router.setParams({ mode: 'mcq' })} style={modeChip(mode === 'mcq')}>
            <Text className="font-strong" style={{ color: mode === 'mcq' ? INK : '#F3D9A0' }}>Trắc nghiệm</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" aria-selected={mode === 'fill'} onPress={() => router.setParams({ mode: 'fill' })} style={modeChip(mode === 'fill')}>
            <Text className="font-strong" style={{ color: mode === 'fill' ? INK : '#F3D9A0' }}>Điền từ</Text>
          </Pressable>
        </View>
      </View>

      {mode === 'mcq' ? <McqRunner key={`${lesson.id}-mcq`} lessonId={lesson.id} questions={mcq} /> : <FillRunner key={`${lesson.id}-fill`} lessonId={lesson.id} questions={fill} />}
    </Screen>
  );
}

function modeChip(on: boolean) {
  return { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 2, borderColor: '#F3D9A0', backgroundColor: on ? '#F3D9A0' : 'transparent' } as const;
}

function McqRunner({ lessonId, questions }: { lessonId: string; questions: McqItem[] }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const record = useVocabReviewStore((s) => s.record);
  const score = picks.reduce<number>((n, p, i) => n + (p !== null && p === questions[i]!.answer ? 1 : 0), 0);
  const finished = at >= questions.length;

  useEffect(() => {
    if (finished) record(`${lessonId}:mcq`, score, questions.length);
  }, [finished, lessonId, score, questions.length, record]);

  if (questions.length === 0) return <Text className="font-sans" style={{ marginTop: 16, color: INK }}>Bài này chưa có câu hỏi.</Text>;

  if (finished) {
    const wrong = questions.map((q, i) => ({ q, i })).filter(({ q, i }) => picks[i] !== q.answer);
    return (
      <View style={{ marginTop: 16, gap: 12 }}>
        <Card>
          <Text className="font-heavy" style={{ fontSize: 26, color: INK }}>{score} / {questions.length} câu đúng</Text>
          <Text className="font-sans" style={{ marginTop: 4, color: '#4B4036' }}>Điểm cao nhất của bài được lưu trên máy này.</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <Btn label="Làm lại" onPress={() => { setPicks(questions.map(() => null)); setAt(0); }} />
          </View>
        </Card>
        {wrong.length > 0 ? (
          <Card>
            <Text className="font-heavy" style={{ fontSize: 18, color: INK }}>Xem lại {wrong.length} câu sai</Text>
            {wrong.map(({ q, i }) => (
              <View key={q.id} style={{ marginTop: 10, gap: 4 }}>
                <Text className="font-strong" style={{ color: INK }}>{i + 1}. {q.prompt}</Text>
                <Text className="font-sans" style={{ color: GREEN }}>Đáp án: {LETTERS[q.answer]}. {q.options[q.answer]}</Text>
                <Text className="font-sans" style={{ color: '#4B4036' }}>{q.explain}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </View>
    );
  }

  const q = questions[at]!;
  const picked = picks[at];
  const answered = picked !== null;
  const choose = (oi: number) => {
    if (answered) return;
    setPicks((p) => p.map((v, i) => (i === at ? oi : v)));
  };

  return (
    <View style={{ marginTop: 16, gap: 12 }}>
      <Progress at={at} total={questions.length} score={score} />
      <Card>
        <Text className="font-sans" style={{ fontSize: 13, color: '#6B5E4E' }}>Câu {at + 1} / {questions.length}</Text>
        <Text className="font-heavy" style={{ marginTop: 6, fontSize: 19, lineHeight: 26, color: INK }}>{q.prompt}</Text>
        <View style={{ marginTop: 14, gap: 10 }}>
          {q.options.map((opt, oi) => {
            const isRight = answered && oi === q.answer;
            const isWrong = answered && oi === picked && oi !== q.answer;
            return (
              <Pressable
                key={oi}
                accessibilityRole="radio"
                accessibilityState={{ checked: picked === oi, disabled: answered }}
                onPress={() => choose(oi)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: isRight ? GREEN : isWrong ? RED : '#E7D2A8', backgroundColor: isRight ? '#DCFCE7' : isWrong ? '#FEE2E2' : '#FFFFFF' }}
              >
                <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', backgroundColor: CREAM }}>
                  <Text className="font-heavy" style={{ color: INK }}>{LETTERS[oi]}</Text>
                </View>
                <Text className="font-strong" style={{ flex: 1, color: INK, fontSize: 16 }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {answered ? <Text className="font-sans" style={{ marginTop: 12, color: '#4B4036', lineHeight: 21 }}>{q.explain}</Text> : null}
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Btn label={at + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp'} disabled={!answered} onPress={() => setAt((v) => v + 1)} />
      </View>
    </View>
  );
}

function FillRunner({ lessonId, questions }: { lessonId: string; questions: FillItem[] }) {
  const [at, setAt] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [results, setResults] = useState<boolean[]>(() => questions.map(() => false));
  const record = useVocabReviewStore((s) => s.record);
  const finished = at >= questions.length;
  const score = results.filter(Boolean).length;

  useEffect(() => {
    if (finished) record(`${lessonId}:fill`, score, questions.length);
  }, [finished, lessonId, score, questions.length, record]);

  if (questions.length === 0) return <Text className="font-sans" style={{ marginTop: 16, color: INK }}>Bài này chưa có câu điền từ.</Text>;

  if (finished) {
    return (
      <View style={{ marginTop: 16, gap: 12 }}>
        <Card>
          <Text className="font-heavy" style={{ fontSize: 26, color: INK }}>{score} / {questions.length} từ đúng</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn label="Làm lại" onPress={() => { setAt(0); setTyped(''); setChecked(questions.map(() => false)); setResults(questions.map(() => false)); }} />
          </View>
        </Card>
      </View>
    );
  }

  const q = questions[at]!;
  const done = checked[at];
  const check = () => {
    if (done || typed.trim() === '') return;
    setChecked((c) => c.map((v, i) => (i === at ? true : v)));
    setResults((r) => r.map((v, i) => (i === at ? isFillCorrect(typed, q.answer) : v)));
  };
  const next = () => {
    setAt((v) => v + 1);
    setTyped('');
  };
  const ok = results[at];

  return (
    <View style={{ marginTop: 16, gap: 12 }}>
      <Progress at={at} total={questions.length} score={score} />
      <Card>
        <Text className="font-sans" style={{ fontSize: 13, color: '#6B5E4E' }}>Câu {at + 1} / {questions.length} · nghĩa: {q.meaningVi}</Text>
        <Text className="font-heavy" style={{ marginTop: 8, fontSize: 19, lineHeight: 28, color: INK }}>{q.sentence}</Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          editable={!done}
          onSubmitEditing={() => (done ? next() : check())}
          placeholder="Gõ từ còn thiếu…"
          placeholderTextColor="#8A7F72"
          autoCapitalize="none"
          style={{ marginTop: 14, borderWidth: 2, borderColor: done ? (ok ? GREEN : RED) : ACCENT, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 17, color: INK, backgroundColor: done ? (ok ? '#DCFCE7' : '#FEE2E2') : '#FFFFFF' } as object}
        />
        {done ? (
          <Text className="font-strong" style={{ marginTop: 10, color: ok ? GREEN : RED }}>
            {ok ? 'Đúng.' : `Chưa đúng. Đáp án: ${q.answer}`}
          </Text>
        ) : null}
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
        {done ? <Btn label={at + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp'} onPress={next} /> : <Btn label="Kiểm tra" disabled={typed.trim() === ''} onPress={check} />}
      </View>
    </View>
  );
}

function Progress({ at, total, score }: { at: number; total: number; score: number }) {
  const pct = total ? Math.round((at / total) * 100) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#EFE6D6', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: 8, backgroundColor: ACCENT } as object} />
      </View>
      <Text className="font-sans" style={{ fontSize: 13, color: '#6B5E4E' }}>Đúng {score} / {at}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: INK, padding: 18, gap: 4, boxShadow: `0 4px 0 ${INK}` } as object}>{children}</View>;
}

function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: disabled ? '#E8E0D0' : '#F2B84B', opacity: disabled ? 0.6 : 1 } as object}
    >
      <Text className="font-strong" style={{ color: INK }}>{label}</Text>
    </Pressable>
  );
}
