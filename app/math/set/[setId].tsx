import React, { useCallback, useMemo } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { Button, Card } from '@/components/ui';
import { FeaturePaywall } from '@/components/billing/PlanUi';
import { isStageUnlocked, requiredPlanFor } from '@/lib/billing/entitlements';
import { PLANS } from '@/lib/billing/plans';
import { MATH_SET_KIND_STYLE } from '@/lib/math/theme';
import { buildSetItems, getSet, getUnitOfSet, stageIndexOfSet } from '@/services/math/curriculum';
import { usePlan } from '@/store/useBillingStore';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathSetProgress, useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Làm một bộ đề của lộ trình.
 *
 * Hạt lấy từ SỐ LƯỢT ĐÃ LÀM XONG bộ này, không lấy từ đồng hồ: nhờ vậy bỏ dở
 * giữa chừng rồi mở lại vẫn đúng bộ câu đang làm dở, còn làm xong rồi vào lại
 * thì ra đề mới. Lấy theo đồng hồ thì chỉ cần lỡ tay tải lại trang là mất sạch
 * những câu đã nghĩ.
 */
export default function MathSetScreen() {
  const { setId } = useLocalSearchParams<{ setId?: string }>();
  const set = setId ? getSet(setId) : undefined;
  const unit = setId ? getUnitOfSet(setId) : undefined;

  const plan = usePlan();
  const stageLocked = !!setId && !isStageUnlocked(plan, stageIndexOfSet(setId));

  const progressBySet = useMathSetProgress();
  const rounds = set ? (progressBySet[set.id]?.rounds ?? 0) : 0;

  const items = useMemo(() => (set ? buildSetItems(set, rounds) : []), [set, rounds]);

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      if (!set) return;
      const attempts = gradeMathSession(items, responses);
      const id = addSession({
        mode: 'lesson',
        // Bộ luyện một kỹ năng thì ghi kỹ năng ấy; bộ ôn trộn và đề tổng hợp
        // trải nhiều kỹ năng nên để trống, đúng như ràng buộc của lược đồ.
        skill: set.skills.length === 1 ? (set.skills[0] ?? null) : null,
        setId: set.id,
        attempts,
        rawScore: countCorrect(attempts),
        total: attempts.length,
        durationMs: elapsedMs,
        moduleTier: null,
        estimatedScore: null,
      });

      logStudyTime(set.kind === 'exam' ? 'mock_test' : 'practice', Math.round(elapsedMs / 60_000));
      logQuestions(attempts.length);
      router.replace(`/math/review/${id}` as never);
    },
    [addSession, items, logQuestions, logStudyTime, set],
  );

  if (!set) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Không có bộ đề này</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Đường dẫn trỏ tới một bộ đề không nằm trong lộ trình.
          </Text>
          <Button className="mt-3" label="Về lộ trình" onPress={() => router.replace('/math' as never)} />
        </Card>
      </Screen>
    );
  }

  if (stageLocked) {
    return (
      <Screen>
        <FeaturePaywall
          feature="math_all_stages"
          title={`"${set.title}" thuộc chặng chưa mở`}
          description={
            `Bài này nằm ở ${unit?.title ?? 'một chặng sau'}. Gói Free mở trọn chặng Đại số — ` +
            `25 bộ đề, hơn 500 câu. Bốn chặng còn lại cần gói ${PLANS[requiredPlanFor('math_all_stages')].name} trở lên.`
          }
        />
        <Button
          className="mt-4 self-start"
          label="Về lộ trình"
          variant="ghost"
          onPress={() => router.replace('/math' as never)}
        />
      </Screen>
    );
  }

  const kind = MATH_SET_KIND_STYLE[set.kind];

  return (
    <MathRunner
      surface="paper"
      title={`${unit ? `${unit.title} · ` : ''}${set.title}`}
      subtitle={kind.purpose}
      items={items}
      minutes={set.minutes}
      phaseLabel={rounds > 0 ? `Lượt ${rounds + 1}` : undefined}
      submitLabel="Nộp và xem lời giải"
      // Bộ học thì cho xem lời giải ngay; bộ tốc độ, kiểm tra và đề thì không —
      // ba loại đó mô phỏng phòng thi.
      instantSolution={set.kind === 'warmup' || set.kind === 'practice'}
      onFinish={finish}
    />
  );
}
