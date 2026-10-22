import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { READING } from '@/services/ielts/placement/blueprint';
import { READING_PAPER, type ReadingQuestion } from '@/services/ielts/placement/reading-paper';
import {
  gradeReading,
  isExpired,
  remainingMs,
  setAnswer,
  startReading,
  submitReading,
  type ReadingResult,
  type ReadingSession,
} from '@/services/ielts/placement/session';

/**
 * Kiểm tra đầu vào IELTS — phần Reading, làm đúng luật thi thật: 60 phút, không gợi ý,
 * không xem đáp án trong lúc làm, nộp một lần. Hết giờ thì tự nộp.
 *
 * Đề và luật nằm ở `services/ielts/placement`; màn này chỉ vẽ trạng thái và gọi máy trạng thái.
 */

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function PlacementReadingScreen() {
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [part, setPart] = useState(0);
  const [result, setResult] = useState<ReadingResult | null>(null);

  // Đồng hồ và tự nộp khi hết giờ
  useEffect(() => {
    if (!session || session.submittedAt !== null) return;
    const t = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (isExpired(session, current)) {
        const done = submitReading(session, current);
        setSession(done);
        setResult(gradeReading(done));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [session]);

  const start = () => {
    const t = Date.now();
    setNow(t);
    setResult(null);
    setSession(startReading(t));
  };

  const answer = (n: number, value: string) => {
    if (!session) return;
    setSession(setAnswer(session, n, value, Date.now()));
  };

  const submit = () => {
    if (!session) return;
    const done = submitReading(session, Date.now());
    setSession(done);
    setResult(gradeReading(done));
  };

  if (!session) {
    return (
      <Screen>
        <Card>
          <Text className="font-heavy text-pageTitle text-ink">Kiểm tra đầu vào · Reading</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {READING.questions} câu · 3 bài · {READING.minutes} phút. Làm đúng như thi thật:
          </Text>
          <View className="mt-3 gap-1">
            <Text className="font-sans text-body text-ink">• Không có gợi ý, không xem đáp án trong lúc làm.</Text>
            <Text className="font-sans text-body text-ink">• Bài nộp một lần; hết giờ thì tự nộp.</Text>
            <Text className="font-sans text-body text-ink">• Điểm band là ước lượng từ bảng quy đổi thông dụng, không phải điểm chính thức.</Text>
          </View>
          <Button className="mt-5 self-start" label="Bắt đầu làm bài" onPress={start} />
        </Card>
      </Screen>
    );
  }

  if (result) {
    return (
      <Screen>
        <Card>
          <Text className="font-heavy text-pageTitle text-ink">Kết quả Reading</Text>
          <Text className="mt-2 font-heavy text-sectionTitle text-ink">
            {result.correct}/{result.total} câu đúng · Band ước lượng {result.band.toFixed(1)}
          </Text>
          <Text className="mt-1 font-sans text-label text-muted">Ước lượng từ bảng quy đổi thông dụng; không phải điểm chấm chính thức.</Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label="Làm lại" variant="ghost" onPress={start} />
            <Button label="Về trang IELTS" variant="ghost" onPress={() => router.push('/practice' as never)} />
          </View>
        </Card>
        <Card className="mt-4">
          <Text className="font-heavy text-cardTitle text-ink">Câu sai ({result.wrong.length})</Text>
          <View className="mt-2 gap-2">
            {result.wrong.map((w) => (
              <Text key={w.n} className="font-sans text-label text-body">
                {w.n}. bạn chọn: {w.given} · đáp án: {w.expected}
              </Text>
            ))}
          </View>
        </Card>
      </Screen>
    );
  }

  const left = remainingMs(session, now);
  const passage = READING_PAPER[part]!;
  const unanswered = (passage.questions as ReadingQuestion[]).filter((q) => session.answers[q.n] === undefined).length;

  return (
    <Screen>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-heavy text-sectionTitle text-ink">Reading · Bài {part + 1}/3</Text>
        <Text className="font-heavy text-sectionTitle text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {clock(left)}
        </Text>
      </View>

      <View className="mb-3 flex-row gap-2">
        {READING_PAPER.map((p, i) => (
          <Pressable key={p.id} onPress={() => setPart(i)} accessibilityRole="tab" accessibilityState={{ selected: i === part }}>
            <Text className={`font-strong text-label ${i === part ? 'text-ink' : 'text-muted'}`}>{p.title}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView>
        <Card>
          <Text className="font-heavy text-cardTitle text-ink">{passage.title}</Text>
          <View className="mt-2 gap-3">
            {passage.paragraphs.map((para, i) => (
              <Text key={i} className="font-sans text-body text-ink" style={{ lineHeight: 24 }}>
                {para}
              </Text>
            ))}
          </View>
        </Card>

        <View className="mt-4 gap-4">
          {passage.questions.map((q) => (
            <QuestionRow key={q.n} q={q} value={session.answers[q.n]} onChange={(v) => answer(q.n, v)} />
          ))}
        </View>

        <View className="mt-6 mb-10 flex-row items-center justify-between">
          <Text className="font-sans text-label text-muted">Bài này còn {unanswered} câu chưa làm.</Text>
          <Button label="Nộp bài" onPress={submit} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuestionRow({ q, value, onChange }: { q: ReadingQuestion; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <View className="gap-2">
      <Text className="font-strong text-body text-ink">
        {q.n}. {q.prompt}
      </Text>
      {q.type === 'mcq' ? (
        <View className="gap-1">
          {q.options.map((opt, i) => {
            const on = value === String(i);
            return (
              <Pressable key={i} onPress={() => onChange(String(i))} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                <Text className={`font-sans text-body ${on ? 'text-ink font-strong' : 'text-body'}`}>
                  {'ABCD'[i]}. {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : q.type === 'tfng' ? (
        <View className="flex-row gap-2">
          {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((opt) => (
            <Pressable key={opt} onPress={() => onChange(opt)} accessibilityRole="radio" accessibilityState={{ checked: value === opt }}>
              <Text className={`font-strong text-label ${value === opt ? 'text-ink' : 'text-muted'}`}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput
          value={value ?? ''}
          onChangeText={onChange}
          placeholder="Viết đáp án"
          className="font-sans text-body text-ink"
          style={{ borderWidth: 1, borderColor: '#F3F0FB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
        />
      )}
    </View>
  );
}
