import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

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
import { PageStickers, SealIcon, type ArtScene } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteRocket, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

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
  const { L } = useL();
  const params = useLocalSearchParams<{ form?: string }>();
  const form = typeof params.form === 'string' ? params.form : null;
  const [seed] = useState(() => form ? `band9:${form}:math:v1` : String(Date.now()));
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
        <PageTitle text={L('Thi thử SAT Math', 'SAT Math mock test')} scene="test" />
        <View className="mt-4">
          <QuotaPaywall
            title={L('Hết lượt thi thử tuần này', "You've used this week's mock tests")}
            used={mockQuota.used}
            limit={blocked.reason === 'quota' ? blocked.limit : 1}
            resetsIn={L('vào thứ Hai tuần sau', 'next Monday')}
          />
        </View>
        <Button
          className="mt-4 self-start"
          label={L('Về lộ trình', 'Back to the path')}
          variant="ghost"
          onPress={() => router.replace('/math' as never)}
        />
      </Screen>
    );
  }

  if (phase.stage === 'intro') {
    return (
      <Screen>
        <PageTitle text={L(form ? `Thi thử SAT Math · Đề ${form.slice(-2)}` : 'Thi thử SAT Math', form ? `SAT Math mock · Form ${form.slice(-2)}` : 'SAT Math mock test')} scene="test">
          <Text className="mt-1 font-sans text-body text-muted">
            {L(
              'Hai module liên tiếp, đúng cấu trúc phần Math của đề số hoá.',
              'Two back-to-back modules, matching the structure of the digital SAT Math section.',
            )}
          </Text>
        </PageTitle>

        <View className="mt-4">
          <Grid columns={3} tabletColumns={3} mobileColumns={3}>
            <StatCard label={L('Số câu', 'Questions')} value={String(MOCK_TOTAL_QUESTIONS)} icon="clipboard" tone="primary" />
            <StatCard label={L('Thời gian', 'Time')} value={`${MOCK_MODULE_MINUTES * 2}′`} icon="clock" tone="accent" />
            <StatCard label={L('Mỗi module', 'Per module')} value={String(MOCK_MODULE_LENGTH)} icon="grid" tone="success" />
          </Grid>
        </View>

        <Card className="mt-4">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="clock" color="#F0703F" size={36} />
            </View>
            <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Trước khi bắt đầu', 'Before you start')}</Text>
            <View aria-hidden>
              <Label text={L('Tự nộp khi hết giờ ⏱', 'Auto-submits at time-up ⏱')} color="#F2B632" tilt={4} size={11} />
            </View>
          </View>
          <View className="mt-2 gap-2">
            <Bullet>
              {L('Hết giờ là tự nộp, không tạm dừng.', 'Auto-submits when time runs out. No pausing.')}
            </Bullet>
            <Bullet>
              {L(
                `Làm đúng từ khoảng ${Math.round(MODULE_ROUTING_THRESHOLD * 100)}% module 1 trở lên thì module 2 sẽ khó hơn — và chỉ nhánh khó mới với tới vùng điểm cao.`,
                `Get about ${Math.round(MODULE_ROUTING_THRESHOLD * 100)}% or more of module 1 right and module 2 gets harder — only the harder route can reach the top scores.`,
              )}
            </Bullet>
            <Bullet>
              {L('Điểm 200–800 ở cuối bài là ', 'The 200–800 score at the end is an ')}
              <Text className="font-strong text-ink">{L('ước lượng', 'estimate')}</Text>
              {L(
                '. College Board không công bố bảng quy đổi của đề số hoá, nên con số ấy dùng để so với chính mình lần trước, không phải để so với điểm thi thật.',
                ". College Board doesn't publish a conversion table for the digital test, so use it to compare with your own previous attempts, not with a real exam score.",
              )}
            </Bullet>
          </View>
          <Button
            className="mt-4"
            label={L('Bắt đầu module 1', 'Start module 1')}
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
        surface="paper"
        title={L('Thi thử · Module 1', 'Mock test · Module 1')}
        subtitle={L(
          'Độ khó trộn lẫn. Kết quả module này quyết định độ khó của module sau.',
          'Mixed difficulty. Your result here decides how hard the next module is.',
        )}
        items={module1}
        minutes={MOCK_MODULE_MINUTES}
        phaseLabel="Module 1/2"
        submitLabel={L('Nộp module 1', 'Submit module 1')}
        onFinish={finishModule1}
      />
    );
  }

  if (phase.stage === 'break') {
    const correct = countCorrect(phase.attempts);
    return (
      <Screen>
        <PageTitle text={L('Xong module 1', 'Module 1 done')} scene="progress" />
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center gap-3">
            <View aria-hidden>
              <Motion kind="wobble">
                <Sticker tilt={-8}>
                  {phase.tier === 'harder' ? <CuteRocket size={52} /> : <CuteTrophy size={52} />}
                </Sticker>
              </Motion>
            </View>
            <Text className="font-strong text-cardTitle text-ink">
              {L(`Đúng ${correct}/${phase.attempts.length}`, `${correct}/${phase.attempts.length} correct`)}
            </Text>
            <View aria-hidden>
              <Label
                text={phase.tier === 'harder' ? L('Nhánh khó 🚀', 'Harder route 🚀') : L('Nhánh dễ 🎯', 'Easier route 🎯')}
                color={phase.tier === 'harder' ? '#F0703F' : '#B07A3A'}
                ink="#FFFFFF"
                tilt={4}
                size={12}
              />
            </View>
          </View>
          <Text className="mt-2 font-sans text-body text-muted">
            {phase.tier === 'harder'
              ? L('Module 2 KHÓ HƠN: mở được vùng điểm cao. Đừng sai câu dễ.', 'HARDER module 2: high scores are open. Don\'t miss easy ones.')
              : L('Module 2 DỄ HƠN: có trần điểm. Ăn chắc từng câu.', 'EASIER module 2: scores are capped. Secure every question.')}
          </Text>
          <Text className="mt-2 font-sans text-label text-muted">
            {L(
              `Ngưỡng chuyển nhánh ${Math.round(MODULE_ROUTING_THRESHOLD * 100)}% là phỏng theo tài liệu luyện thi, không phải quy tắc chính thức của College Board.`,
              `The ${Math.round(MODULE_ROUTING_THRESHOLD * 100)}% routing threshold is based on prep materials, not an official College Board rule.`,
            )}
          </Text>
          <Button
            className="mt-4"
            label={L('Bắt đầu module 2', 'Start module 2')}
            iconRight="arrow-right"
            onPress={() => setPhase({ ...phase, stage: 'module2' })}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <MathRunner
      surface="paper"
      title={L(
        `Thi thử · Module 2 (${phase.tier === 'harder' ? 'khó hơn' : 'dễ hơn'})`,
        `Mock test · Module 2 (${phase.tier === 'harder' ? 'harder' : 'easier'})`,
      )}
      subtitle={L(
        'Module cuối. Nộp xong sẽ ra điểm ước lượng và bảng xem lại từng câu.',
        "Final module. After submitting you'll get a score estimate and a question-by-question review.",
      )}
      items={module2}
      minutes={MOCK_MODULE_MINUTES}
      phaseLabel="Module 2/2"
      submitLabel={L('Nộp bài và xem điểm', 'Submit and see score')}
      onFinish={finishModule2}
    />
  );
}

function PageTitle({ text, scene, children }: { text: string; scene: ArtScene; children?: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="min-w-0 flex-1">
        <Text className="font-heavy text-pageTitle text-ink">{text}</Text>
        {children}
      </View>
      <View aria-hidden>
        <PageStickers scene={scene} />
      </View>
    </View>
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
