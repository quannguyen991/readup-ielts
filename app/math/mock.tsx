import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { Button, Card, StatCard } from '@/components/ui';
import {
  MOCK_MODULE_LENGTH,
  MOCK_MODULE_MINUTES,
  MOCK_TOTAL_QUESTIONS,
  buildMockModule,
} from '@/services/math/mock';
import {
  countCorrect,
  gradeMathSession,
  type GradedAttempt,
  type MathResponse,
} from '@/services/math/grade';
import {
  MODULE_ROUTING_THRESHOLD,
  estimateMathScore,
  routeSecondModule,
  type ModuleTier,
} from '@/services/math/scoring';
import { QuotaPaywall } from '@/components/billing/PlanUi';
import { useBillingStore, useQuota } from '@/store/useBillingStore';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Thi thử phần Math — hai module, module 2 đổi độ khó theo kết quả module 1.
 *
 * Giữa hai module có MÀN NGHỈ, và màn ấy nói thẳng người học vừa được chuyển
 * sang bậc nào. Đề thật không nói, nhưng đây là bài luyện: biết mình vừa bị đẩy
 * xuống bậc dễ hơn là một thông tin đáng giá hơn hẳn việc mô phỏng cho giống.
 */
type Phase =
  | { stage: 'intro' }
  | { stage: 'module1' }
  | { stage: 'break'; tier: ModuleTier; attempts: GradedAttempt[]; elapsedMs: number }
  | { stage: 'module2'; tier: ModuleTier; attempts: GradedAttempt[]; elapsedMs: number };

export default function MathMockScreen() {
  const [seed] = useState(() => String(Date.now()));
  const [phase, setPhase] = useState<Phase>({ stage: 'intro' });

  const module1 = useMemo(() => buildMockModule(seed, 1, 'mixed'), [seed]);
  const module2 = useMemo(
    () => (phase.stage === 'break' || phase.stage === 'module2' ? buildMockModule(seed, 2, phase.tier) : []),
    [phase, seed],
  );

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const mockQuota = useQuota('mock_per_week');
  const consume = useBillingStore((s) => s.consume);

  const finishModule1 = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      const attempts = gradeMathSession(module1, responses);
      const correct = countCorrect(attempts);
      setPhase({
        stage: 'break',
        tier: routeSecondModule(correct, attempts.length),
        attempts,
        elapsedMs,
      });
    },
    [module1],
  );

  const finishModule2 = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      if (phase.stage !== 'module2') return;

      const secondAttempts = gradeMathSession(module2, responses);
      const attempts = [...phase.attempts, ...secondAttempts];
      const rawScore = countCorrect(attempts);
      const totalMs = phase.elapsedMs + elapsedMs;

      const id = addSession({
        mode: 'mock',
        skill: null,
        setId: null,
        attempts,
        rawScore,
        total: attempts.length,
        durationMs: totalMs,
        moduleTier: phase.tier,
        estimatedScore: estimateMathScore(rawScore, attempts.length, phase.tier),
      });

      logStudyTime('mock_test', Math.round(totalMs / 60_000));
      logQuestions(attempts.length);
      // Chỉ trừ lượt khi đã làm XONG cả hai module. Trừ ngay lúc bấm bắt đầu thì
      // ai lỡ tay mở rồi thoát là mất một lượt của cả tuần.
      consume('mock_per_week');
      router.replace(`/math/review/${id}`);
    },
    [addSession, consume, logQuestions, logStudyTime, module2, phase],
  );

  if (phase.stage === 'intro' && !mockQuota.entitlement.allowed) {
    const blocked = mockQuota.entitlement;
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">Thi thử SAT Math</Text>
        <View className="mt-4">
          <QuotaPaywall
            title="Hết lượt thi thử tuần này"
            used={mockQuota.used}
            limit={blocked.reason === 'quota' ? blocked.limit : 1}
            resetsIn="vào thứ Hai tuần sau"
          />
        </View>
        <Button
          className="mt-4 self-start"
          label="Về lộ trình"
          variant="ghost"
          onPress={() => router.replace('/math' as never)}
        />
      </Screen>
    );
  }

  if (phase.stage === 'intro') {
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">Thi thử SAT Math</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Hai module liên tiếp, đúng cấu trúc phần Math của đề số hoá.
        </Text>

        <View className="mt-4">
          <Grid columns={3} tabletColumns={3} mobileColumns={3}>
            <StatCard label="Số câu" value={String(MOCK_TOTAL_QUESTIONS)} icon="clipboard" tone="primary" />
            <StatCard label="Thời gian" value={`${MOCK_MODULE_MINUTES * 2}′`} icon="clock" tone="accent" />
            <StatCard label="Mỗi module" value={String(MOCK_MODULE_LENGTH)} icon="grid" tone="success" />
          </Grid>
        </View>

        <Card className="mt-4">
          <Text className="font-strong text-cardTitle text-ink">Trước khi bắt đầu</Text>
          <View className="mt-2 gap-2">
            <Bullet>
              Đồng hồ chạy lùi và TỰ NỘP khi hết giờ, từng module một. Không tạm dừng được, đúng như
              phòng thi.
            </Bullet>
            <Bullet>
              Làm đúng từ khoảng {Math.round(MODULE_ROUTING_THRESHOLD * 100)}% module 1 trở lên thì
              module 2 sẽ khó hơn — và chỉ nhánh khó mới với tới vùng điểm cao.
            </Bullet>
            <Bullet>
              Điểm 200–800 ở cuối bài là <Text className="font-strong text-ink">ước lượng</Text>.
              College Board không công bố bảng quy đổi của đề số hoá, nên con số ấy dùng để so với
              chính mình lần trước, không phải để so với điểm thi thật.
            </Bullet>
          </View>
          <Button
            className="mt-4"
            label="Bắt đầu module 1"
            iconRight="arrow-right"
            onPress={() => setPhase({ stage: 'module1' })}
          />
        </Card>
      </Screen>
    );
  }

  if (phase.stage === 'module1') {
    return (
      <MathRunner
        title="Thi thử · Module 1"
        subtitle="Độ khó trộn lẫn. Kết quả module này quyết định độ khó của module sau."
        items={module1}
        minutes={MOCK_MODULE_MINUTES}
        phaseLabel="Module 1/2"
        submitLabel="Nộp module 1"
        onFinish={finishModule1}
      />
    );
  }

  if (phase.stage === 'break') {
    const correct = countCorrect(phase.attempts);
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">Xong module 1</Text>
        <Card className="mt-4">
          <Text className="font-strong text-cardTitle text-ink">
            Đúng {correct}/{phase.attempts.length}
          </Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {phase.tier === 'harder'
              ? 'Bạn được chuyển sang module 2 KHÓ HƠN. Đây là nhánh duy nhất với tới vùng điểm cao — làm chậm lại một chút cũng được, đổi lại đừng sai câu dễ.'
              : 'Bạn được chuyển sang module 2 DỄ HƠN. Nhánh này bị chặn trần điểm dù làm đúng hết, nên mục tiêu bây giờ là ăn trọn những câu chắc chắn làm được.'}
          </Text>
          <Text className="mt-2 font-sans text-label text-muted">
            Ngưỡng chuyển nhánh {Math.round(MODULE_ROUTING_THRESHOLD * 100)}% là phỏng theo tài liệu
            luyện thi, không phải quy tắc chính thức của College Board.
          </Text>
          <Button
            className="mt-4"
            label="Bắt đầu module 2"
            iconRight="arrow-right"
            onPress={() => setPhase({ ...phase, stage: 'module2' })}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <MathRunner
      title={`Thi thử · Module 2 (${phase.tier === 'harder' ? 'khó hơn' : 'dễ hơn'})`}
      subtitle="Module cuối. Nộp xong sẽ ra điểm ước lượng và bảng xem lại từng câu."
      items={module2}
      minutes={MOCK_MODULE_MINUTES}
      phaseLabel="Module 2/2"
      submitLabel="Nộp bài và xem điểm"
      onFinish={finishModule2}
    />
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2">
      <Text className="font-strong text-body text-primary-600">•</Text>
      <Text className="flex-1 font-sans text-body text-muted">{children}</Text>
    </View>
  );
}
