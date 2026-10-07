import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { RwRunner } from '@/components/sat-rw/RwRunner';
import { Button, Card } from '@/components/ui';
import { buildRwModule, routeRwSecondModule, RW_MODULE_LENGTH, RW_MODULE_MINUTES, type ModuleTier as RwModuleTier } from '@/services/sat-rw/mock/build';
import { estimateRwScore } from '@/services/sat-rw/mock/scoring';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

type Phase =
  | { kind: 'intro' }
  | { kind: 'module1' }
  | { kind: 'module2'; tier: RwModuleTier; firstCorrect: number }
  | { kind: 'result'; tier: RwModuleTier; correct: number; total: number };

export default function SatReadingWritingTestScreen() {
  const { L } = useL();
  const params = useLocalSearchParams<{ form?: string }>();
  const form = typeof params.form === 'string' ? params.form : null;
  const [seed] = useState(() => form ? `band9:${form}:reading-writing:v1` : `band9:rw:${Date.now()}`);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const firstModule = useMemo(() => buildRwModule(seed, 1, 'mixed'), [seed]);
  const secondModule = useMemo(() => phase.kind === 'module2'
    ? buildRwModule(seed, 2, phase.tier, new Set(firstModule.items.map((item) => item.id)))
    : null, [firstModule.items, phase, seed]);

  if (phase.kind === 'intro') {
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">{L('Thi thử SAT Reading and Writing', 'SAT Reading and Writing practice test')}</Text>
        {form ? <Text className="mt-1 font-semi text-label text-muted">{L('Bộ đề', 'Form')} {form.replace('form-', '')} / 50</Text> : null}
        <Card className="mt-4">
          <Text className="font-strong text-cardTitle text-ink">{L('Hai module thích ứng', 'Two adaptive modules')}</Text>
          <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 23 }}>
            {L(`${RW_MODULE_LENGTH} câu trong mỗi module, ${RW_MODULE_MINUTES} phút. Module 2 đổi độ khó theo module 1. Điểm 200–800 cuối bài là ước lượng để theo dõi tiến bộ.`, `${RW_MODULE_LENGTH} questions per module, ${RW_MODULE_MINUTES} minutes. Module 2 adapts to your first module. The final 200–800 score is an estimate for tracking progress.`)}
          </Text>
          <Button className="mt-4" label={L('Bắt đầu module 1', 'Start module 1')} onPress={() => setPhase({ kind: 'module1' })} />
          <Button className="mt-2 self-start" label={L('Về bộ đề', 'Back to forms')} variant="ghost" onPress={() => router.replace('/sat/practice-tests' as never)} />
        </Card>
      </Screen>
    );
  }

  if (phase.kind === 'module1') {
    return (
      <RwRunner
        title={L('Reading and Writing', 'Reading and Writing')}
        phaseLabel={L(`Module 1/2 · ${RW_MODULE_MINUTES} phút`, `Module 1/2 · ${RW_MODULE_MINUTES} min`)}
        items={firstModule.items}
        minutes={RW_MODULE_MINUTES}
        onFinish={(answers) => {
          const correct = firstModule.items.reduce((sum, item, index) => sum + Number(answers[index] === item.answerIndex), 0);
          setPhase({ kind: 'module2', tier: routeRwSecondModule(correct, firstModule.items.length), firstCorrect: correct });
        }}
        onExit={() => router.replace('/sat/practice-tests' as never)}
      />
    );
  }

  if (phase.kind === 'module2' && secondModule) {
    return (
      <RwRunner
        key="rw-module-two"
        title={L('Reading and Writing', 'Reading and Writing')}
        phaseLabel={L(`Module 2/2 · ${phase.tier === 'harder' ? 'nhánh khó' : 'nhánh dễ'}`, `Module 2/2 · ${phase.tier} route`)}
        items={secondModule.items}
        minutes={RW_MODULE_MINUTES}
        onFinish={(answers) => {
          const secondCorrect = secondModule.items.reduce((sum, item, index) => sum + Number(answers[index] === item.answerIndex), 0);
          const correct = phase.firstCorrect + secondCorrect;
          useGameStore.getState().awardBatch(correct, firstModule.items.length + secondModule.items.length, 'verbal', seed);
          setPhase({ kind: 'result', tier: phase.tier, correct, total: firstModule.items.length + secondModule.items.length });
        }}
        onExit={() => router.replace('/sat/practice-tests' as never)}
      />
    );
  }

  if (phase.kind === 'result') {
    const score = estimateRwScore(phase.correct, phase.total, phase.tier);
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">{L('Kết quả Reading and Writing', 'Reading and Writing result')}</Text>
        {form ? <Text className="mt-1 font-semi text-label text-muted">{L('Bộ đề', 'Form')} {form.replace('form-', '')} / 50</Text> : null}
        <Card className="mt-4 items-center">
          <Text className="font-heavy text-stat text-primary-700">{score}</Text>
          <Text className="font-semi text-body text-muted">{L('điểm ước lượng · thang 200–800', 'estimated score · 200–800 scale')}</Text>
          <Text className="mt-3 font-strong text-cardTitle text-ink">{phase.correct}/{phase.total} {L('câu đúng', 'correct')}</Text>
          <Text className="mt-1 font-sans text-label text-muted">{L(`Module 2: nhánh ${phase.tier === 'harder' ? 'khó' : 'dễ'}. Thang điểm thật dùng mô hình thích ứng và IRT; đây là số theo dõi, không thay điểm College Board.`, `Module 2: ${phase.tier} route. Official scores use an adaptive IRT model; this estimate is for practice, not a College Board score.`)}</Text>
          <View className="mt-4 w-full" style={{ gap: 10 }}>
            <Button label={L('Về bộ đề SAT', 'Back to SAT forms')} onPress={() => router.replace('/sat/practice-tests' as never)} />
            <Button label={L('Về lộ trình SAT', 'Back to SAT')} variant="outline" onPress={() => router.replace('/sat' as never)} />
          </View>
        </Card>
      </Screen>
    );
  }

  return null;
}
