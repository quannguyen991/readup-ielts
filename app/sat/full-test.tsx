import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { RwRunner } from '@/components/sat-rw/RwRunner';
import { Button, Card, StatCard } from '@/components/ui';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import type { MockItem } from '@/services/sat-rw/mock/item';
import {
  BREAK_MINUTES,
  FULL_TEST_QUESTIONS,
  FULL_TEST_TESTING_MINUTES,
  endBreak,
  fullTestScore,
  stageIndex,
  stageLabel,
  startFullTest,
  submitModule,
  TOTAL_STAGES,
  type FullTestState,
} from '@/services/sat-rw/mock/full-test';
import { color, spacing as space } from '@/theme/tokens';

/**
 * Bài thi SAT đầy đủ, đúng khổ đề số hoá.
 *
 * MÀN HÌNH KHÔNG GIỮ LUẬT NÀO. Toàn bộ thứ tự chặng, thích ứng và quy điểm nằm ở
 * `services/sat-rw/mock/full-test.ts` và có test thuần. Ở đây chỉ có: vẽ chặng
 * hiện tại, nhận kết quả, gọi `submitModule`. Luật nằm trong màn hình thì mỗi lần
 * đổi giao diện là một lần luật có thể trôi mà không ai thấy.
 *
 * HẠT GIỐNG CỐ ĐỊNH THEO LƯỢT THI. Sinh một lần lúc bắt đầu rồi giữ nguyên, nên
 * người học đóng app mở lại vẫn là đúng đề ấy — và hai người gửi nhau mã đề thì
 * làm chung một bài.
 */

export default function SatFullTestScreen() {
  const [state, setState] = useState<FullTestState | null>(null);

  const start = useCallback(() => {
    setState(startFullTest(`full-${Date.now()}`));
  }, []);

  if (!state) return <Intro onStart={start} />;

  const { stage } = state;

  if (stage.kind === 'rw') {
    return (
      <RwRunner
        key={`rw-${stage.module}`}
        title="Reading and Writing"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        onFinish={(answers) => {
          const correct = countRwCorrect(stage.items, answers);
          setState((s) => (s ? submitModule(s, { correct, total: stage.items.length }) : s));
        }}
      />
    );
  }

  if (stage.kind === 'math') {
    return (
      <MathRunner
        key={`math-${stage.module}`}
        title="Math"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        submitLabel="Nộp module"
        onFinish={(responses: MathResponse[]) => {
          const correct = countCorrect(gradeMathSession(stage.items, responses));
          setState((s) => (s ? submitModule(s, { correct, total: stage.items.length }) : s));
        }}
      />
    );
  }

  if (stage.kind === 'break') {
    return <BreakScreen onContinue={() => setState((s) => (s ? endBreak(s) : s))} />;
  }

  return <ResultScreen state={state} onRestart={start} />;
}

/**
 * Đếm câu đúng cho một module R&W.
 *
 * Không lưu đáp án người học vào state chung: màn này chỉ cần CON SỐ để chọn
 * module sau và để quy điểm. Giữ cả bài làm ở đây sẽ biến một màn hình thành nơi
 * chứa dữ liệu, mà nơi chứa dữ liệu thì phải có người dọn.
 */
function countRwCorrect(items: MockItem[], answers: (number | null)[]): number {
  return items.reduce((n, item, i) => (answers[i] === item.answerIndex ? n + 1 : n), 0);
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Thi thử SAT đầy đủ</Text>
      <Text className="mt-2 max-w-[640px] font-sans text-bodyLg text-muted" style={{ lineHeight: 24 }}>
        Đúng khổ đề số hoá: {FULL_TEST_QUESTIONS} câu, {FULL_TEST_TESTING_MINUTES} phút làm bài,
        nghỉ {BREAK_MINUTES} phút giữa hai phần.
      </Text>

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">Bài thi đi thế nào</Text>
        <View className="mt-2">
          {[
            'Reading and Writing — module 1, 27 câu, 32 phút',
            'Reading and Writing — module 2, 27 câu, 32 phút',
            `Nghỉ ${BREAK_MINUTES} phút`,
            'Math — module 1, 22 câu, 35 phút',
            'Math — module 2, 22 câu, 35 phút',
          ].map((line) => (
            <Text key={line} className="mt-1 font-sans text-body text-body">
              {'·  '}
              {line}
            </Text>
          ))}
        </View>
      </Card>

      <Card className="mt-3">
        <Text className="font-strong text-body text-ink">Hai điều nên biết trước</Text>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          <Text style={{ color: color.ink, fontWeight: '700' }}>Module 2 khó dễ tuỳ module 1.</Text>{' '}
          Làm tốt phần đầu thì phần sau khó hơn — và trần điểm cũng cao hơn. Đây là cách đề
          thật hoạt động, không phải hình phạt.
        </Text>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          <Text style={{ color: color.ink, fontWeight: '700' }}>Nộp module là không quay lại.</Text>{' '}
          Hết giờ thì tự nộp, kể cả khi còn câu chưa làm.
        </Text>
      </Card>

      <View className="mt-5 flex-row gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button label="Bắt đầu thi" onPress={onStart} />
        <Button variant="ghost" label="Để sau" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function BreakScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <Screen>
      <View className="items-center" style={{ paddingTop: 48 }}>
        <Text className="font-heavy text-pageTitle text-ink">Nghỉ {BREAK_MINUTES} phút</Text>
        <Text
          className="mt-3 max-w-[520px] text-center font-sans text-bodyLg text-muted"
          style={{ lineHeight: 24 }}
        >
          Xong phần Reading and Writing. Đứng dậy, uống nước, đừng xem lại câu vừa làm —
          phần sau là Math và nó không liên quan gì tới phần vừa rồi.
        </Text>
        <View className="mt-6">
          <Button label="Vào phần Math" onPress={onContinue} />
        </View>
        <Text className="mt-3 font-sans text-label text-subtle">
          Bấm khi bạn sẵn sàng — đồng hồ phần Math bắt đầu từ lúc đó.
        </Text>
      </View>
    </Screen>
  );
}

function ResultScreen({ state, onRestart }: { state: FullTestState; onRestart: () => void }) {
  const score = fullTestScore(state);
  if (!score) return null;

  const rwTier = state.rw.tier === 'harder' ? 'module 2 khó' : 'module 2 dễ';
  const mathTier = state.math.tier === 'harder' ? 'module 2 khó' : 'module 2 dễ';

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Kết quả</Text>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <StatCard label="Tổng" value={String(score.total)} icon="trending" caption="thang 400–1600" />
        <StatCard
          label="Reading and Writing"
          value={String(score.readingWriting)}
          icon="book"
          caption={rwTier}
        />
        <StatCard label="Math" value={String(score.math)} icon="grid" caption={mathTier} />
      </View>

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">Con số này là ƯỚC LƯỢNG</Text>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          College Board không công bố bảng quy đổi của đề số hoá, và bảng ấy còn đổi theo
          từng kỳ thi. Đây là phỏng theo, đủ để theo dõi tiến bộ giữa các lần làm — không đủ
          để dự đoán điểm thi thật.
        </Text>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          Trần điểm phụ thuộc module 2 bạn được đưa vào: {rwTier} cho Reading and Writing,
          {' '}
          {mathTier} cho Math. Đúng như đề thật.
        </Text>
      </Card>

      <Card className="mt-3">
        <Text className="font-strong text-body text-ink">Số câu đúng từng module</Text>
        <View className="mt-2">
          <Line label="R&W module 1" r={state.rw.module1} />
          <Line label="R&W module 2" r={state.rw.module2} />
          <Line label="Math module 1" r={state.math.module1} />
          <Line label="Math module 2" r={state.math.module2} />
        </View>
      </Card>

      <View className="mt-5 flex-row gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button label="Thi lại đề khác" onPress={onRestart} />
        <Button variant="ghost" label="Về trang SAT" onPress={() => router.replace('/sat')} />
      </View>
    </Screen>
  );
}

function Line({ label, r }: { label: string; r: { correct: number; total: number } | null }) {
  return (
    <View className="mt-1 flex-row justify-between">
      <Text className="font-sans text-body text-body">{label}</Text>
      <Text className="font-semi text-body text-ink">{r ? `${r.correct}/${r.total}` : '—'}</Text>
    </View>
  );
}

/** Dùng ở thanh tiến độ nếu về sau muốn hiện; giữ export để không mất khi refactor. */
export const __stageHelpers = { stageLabel, stageIndex, TOTAL_STAGES };
