import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  PLANS,
  TRIAL_AI_PLAN,
  TRIAL_DAYS,
  TRIAL_PLANS,
  formatVnd,
  planName,
  planOf,
  type Feature,
  type PlanId,
} from '@/lib/billing/plans';
import { requiredPlanFor } from '@/lib/billing/entitlements';
import { useBillingStore, usePlanStatus } from '@/store/useBillingStore';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Các mảnh giao diện liên quan tới gói.
 *
 * NGUYÊN TẮC VIẾT CHỮ Ở ĐÂY: nói rõ đang thiếu gì và mở được gì, KHÔNG doạ và
 * không giả vờ hết hàng. Người học bị chặn giữa buổi học đã đủ bực; thêm một câu
 * bán hàng kiểu "chỉ hôm nay" là họ đóng app luôn.
 */

/** Màu đi lên theo bậc: xám → lam → tím → cam. Nhìn thứ tự là đoán được thứ hạng. */
const PLAN_TONE: Record<PlanId, { solid: string; soft: string; ink: string }> = {
  free: { solid: '#64748B', soft: '#FBF7F1', ink: '#334155' },
  plus: { solid: '#B8955A', soft: '#F7F0E1', ink: '#A8843F' },
  pro: { solid: '#D5B377', soft: '#FCF8F2', ink: '#B78939' },
  max: { solid: '#F97316', soft: '#FFF0E4', ink: '#C2410C' },
};

export function planTone(plan: PlanId) {
  return PLAN_TONE[plan];
}

/**
 * Ba–bốn dòng "gói này mở gì" khi giao diện ở tiếng Anh. Bản tiếng Việt nằm ở
 * `PLANS[id].highlights` (nguồn sự thật) — sửa bên đó thì sửa cả ở đây.
 */
const HIGHLIGHTS_EN: Record<PlanId, string[]> = {
  free: ['The full 19-skill diagnostic', 'The whole Algebra stage, 500+ questions', '5 reading passages a day'],
  plus: [
    `All ${CURRICULUM_TOTALS.stages} stages · ${CURRICULUM_TOTALS.sets} sets unlocked`,
    'Unlimited reading and mock tests',
    '20 Writing gradings a month',
  ],
  pro: ['Everything in Plus', 'AI tutor right inside each passage', '120 AI requests a month'],
  max: ['Everything in Pro', 'Signed credential — anyone can verify it', '720 AI requests a month', 'Same-day priority support'],
};

/** Dòng "gói này mở gì" theo ngôn ngữ; thiếu bản tiếng Anh thì về bản tiếng Việt. */
export function planHighlights(plan: PlanId, en: boolean): string[] {
  return en ? HIGHLIGHTS_EN[plan] ?? PLANS[plan].highlights : PLANS[plan].highlights;
}

export function PlanBadge({ plan, compact = false }: { plan: PlanId; compact?: boolean }) {
  const tone = PLAN_TONE[plan];
  const { L, en } = useL();
  return (
    <View
      className="flex-row items-center gap-1 rounded-pill px-2 py-0.5"
      style={{ backgroundColor: tone.soft }}
    >
      {plan === 'max' ? <Icon name="trophy" size={12} color={tone.solid} /> : null}
      <Text className="font-strong text-label" style={{ color: tone.ink }}>
        {compact ? planName(plan, en) : L(`Gói ${PLANS[plan].name}`, `${planName(plan, true)} plan`)}
      </Text>
    </View>
  );
}

/** Số lượt AI mỗi tháng khi đang học thử — cùng con số máy chủ dùng. */
export const TRIAL_AI_CALLS = PLANS[TRIAL_AI_PLAN].quotas.ai_calls_per_month ?? 0;

/**
 * Thẻ HỌC THỬ 5 NGÀY.
 *
 * Người học CHỌN thử Plus hoặc Pro (một lượt cho cả hai).
 * Nói rõ ba thứ ngay trên thẻ: mở gì (nội dung của gói đã chọn), GIỮ NGUYÊN gì
 * (lượt AI vẫn là mức Free), và hết hạn thì sao (về Free, dữ liệu còn nguyên).
 * Giấu chuyện AI bị giới hạn đến lúc bấm chấm bài mới lộ ra là kiểu gài khiến
 * người ta thấy bị lừa, dù hạn mức đó hoàn toàn hợp lý.
 *
 * Đang học thử thì thẻ đổi sang đếm ngày còn lại; đã dùng rồi thì ẩn.
 */
export function TrialCard({ className = 'mt-4' }: { className?: string }) {
  const status = usePlanStatus();
  const start = useBillingStore((s) => s.startTrial);
  const tone = PLAN_TONE[status.onTrial ? status.plan : 'pro'];
  const { L } = useL();

  if (status.onTrial) {
    return (
      <View
        className={`${className} flex-row flex-wrap items-center gap-3 rounded-card px-4 py-3`}
        style={{ backgroundColor: tone.soft }}
      >
        <Icon name="clock" size={18} color={tone.solid} />
        <Text className="flex-1 font-sans text-body text-ink" style={{ minWidth: 200 }}>
          <Text className="font-strong" style={{ color: tone.ink }}>
            {L(
              `Đang học thử ${PLANS[status.plan].name} · còn ${status.daysLeft ?? 0} ngày.`,
              `${PLANS[status.plan].name} trial · ${status.daysLeft ?? 0} days left.`,
            )}
          </Text>{' '}
          {L(
            `Mở hết nội dung; lượt AI vẫn ${TRIAL_AI_CALLS} lượt mỗi tháng như gói Free.`,
            `All content unlocked; AI stays at ${TRIAL_AI_CALLS} requests a month, same as Free.`,
          )}
        </Text>
      </View>
    );
  }

  if (!status.canStartTrial) return null;

  return (
    <View
      className={`${className} overflow-hidden rounded-card`}
      // Dải xanh nhạt cùng tông thanh bên (người dùng chọn 27/09/2026), thay khối tím đậm.
      style={{
        backgroundColor: '#B8955A',
        ...(Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(100deg, #D9BC7F 0%, #A8843F 100%)' } as object) : null),
      }}
    >
      <View className="flex-row flex-wrap items-center gap-4 p-4 md:p-5">
        <View
          className="items-center justify-center rounded-panel"
          style={{ width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.14)' }}
        >
          <Text className="font-heavy text-white" style={{ fontSize: 30, lineHeight: 32 }}>
            {TRIAL_DAYS}
          </Text>
          <Text className="font-strong text-white" style={{ fontSize: 12, letterSpacing: 1 }}>
            {L('NGÀY', 'DAYS')}
          </Text>
        </View>
        <View className="flex-1" style={{ minWidth: 220 }}>
          <Text className="font-strong text-cardTitle text-white">
            {L(`Học thử ${TRIAL_DAYS} ngày gói Plus hoặc Pro`, `Try Plus or Pro free for ${TRIAL_DAYS} days`)}
          </Text>
          <Text className="mt-1 font-sans text-label" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {L(
              `Không cần thẻ · AI vẫn ${TRIAL_AI_CALLS} lượt/tháng · hết hạn tự về Free.`,
              `No card needed · AI stays at ${TRIAL_AI_CALLS} requests/month · returns to Free when it ends.`,
            )}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {TRIAL_PLANS.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={L(`Học thử gói ${PLANS[id].name} ${TRIAL_DAYS} ngày`, `Try ${PLANS[id].name} free for ${TRIAL_DAYS} days`)}
              onPress={() => start(id)}
              className="flex-row items-center gap-2 rounded-2xl bg-white px-4 py-2"
            >
              <Text className="flex-1 font-strong text-label" style={{ color: PLAN_TONE[id].ink }}>
                {L(`Thử ${PLANS[id].name}`, `Try ${PLANS[id].name}`)}
              </Text>
              <Icon name="arrow-right" size={15} color={PLAN_TONE[id].ink} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Thẻ chặn khi tính năng nằm ngoài gói hiện tại.
 *
 * Luôn nói ĐÚNG BA THỨ: đang thiếu gì, gói nào mở được, và giá bao nhiêu. Thiếu
 * giá thì người dùng phải bấm thêm một lần nữa mới biết có đáng không.
 */
export function FeaturePaywall({
  feature,
  title,
  description,
}: {
  feature: Feature;
  title: string;
  description: string;
}) {
  const required = requiredPlanFor(feature);
  const plan = PLANS[required];
  const tone = PLAN_TONE[required];
  const status = usePlanStatus();
  const startTrial = useBillingStore((s) => s.startTrial);
  // Gói cần để mở tính năng này thử được (Plus/Pro) thì mời học thử đúng gói ấy trước khi mời trả tiền.
  const trialOpens = status.canStartTrial && TRIAL_PLANS.includes(required);
  const { L, en } = useL();

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-panel"
          style={{ backgroundColor: tone.soft }}
        >
          <Icon name="lock" size={20} color={tone.solid} />
        </View>
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-cardTitle text-ink">{title}</Text>
            <PlanBadge plan={required} />
          </View>
          <Text className="mt-1 font-sans text-body text-muted">{description}</Text>

          <View className="mt-3 gap-1.5">
            {planHighlights(required, en).map((line) => (
              <View key={line} className="flex-row items-start gap-2">
                <Icon name="check" size={15} color={tone.solid} />
                <Text className="flex-1 font-sans text-label text-ink">{line}</Text>
              </View>
            ))}
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-3">
            <Button
              label={L(`Mở khoá · ${formatVnd(plan.monthlyVnd)}/tháng`, `Unlock · ${formatVnd(plan.monthlyVnd)}/month`)}
              iconRight="arrow-right"
              onPress={() => router.push('/upgrade' as never)}
            />
            <Text className="font-sans text-label text-muted">
              {L(`hoặc ${formatVnd(plan.yearlyVnd)}/năm`, `or ${formatVnd(plan.yearlyVnd)}/year`)}
            </Text>
          </View>
          {trialOpens ? (
            <Button
              className="mt-2 self-start"
              label={L(`Học thử ${plan.name} ${TRIAL_DAYS} ngày miễn phí`, `Try ${plan.name} free for ${TRIAL_DAYS} days`)}
              variant="outline"
              iconRight="sparkle"
              onPress={() => startTrial(required)}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/**
 * Thẻ chặn khi hết lượt trong chu kỳ.
 *
 * Khác `FeaturePaywall` ở một điểm quan trọng: hết lượt là chuyện TẠM THỜI, nên
 * phải nói rõ khi nào có lại. Không nói thì nó trông y hệt một bức tường vĩnh
 * viễn, và người dùng mất luôn lý do quay lại ngày mai.
 */
export function QuotaPaywall({
  title,
  used,
  limit,
  resetsIn,
  requiredPlan = 'plus',
}: {
  title: string;
  used: number;
  limit: number;
  resetsIn: string;
  requiredPlan?: PlanId;
}) {
  const { L } = useL();
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-panel"
          style={{ backgroundColor: color.warningSoft }}
        >
          <Icon name="clock" size={20} color={color.warning} />
        </View>
        <View className="flex-1">
          <Text className="font-strong text-cardTitle text-ink">{title}</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {L(
              `Bạn đã dùng ${used}/${limit} lượt. Lượt mới có lại ${resetsIn} — hoặc mở khoá không giới hạn với gói ${PLANS[requiredPlan].name}.`,
              `You've used ${used}/${limit}. More become available ${resetsIn} — or go unlimited with ${PLANS[requiredPlan].name}.`,
            )}
          </Text>
          <Button
            className="mt-3 self-start"
            label={L(`Xem gói ${PLANS[requiredPlan].name}`, `See ${PLANS[requiredPlan].name}`)}
            variant="outline"
            iconRight="arrow-right"
            onPress={() => router.push('/upgrade' as never)}
          />
        </View>
      </View>
    </Card>
  );
}

/** Dải nhắc gói ở đầu trang — chỉ hiện khi đang dùng Free hoặc sắp hết hạn. */
export function PlanNudge() {
  const { plan, daysLeft: left, expired, source, canStartTrial, onTrial } = usePlanStatus();
  const { L } = useL();

  if (canStartTrial || onTrial) return <TrialCard />;
  if (plan !== 'free' && (left === null || left > 3)) return null;

  const expiringSoon = plan !== 'free' && left !== null && left <= 3;

  return (
    <Pressable onPress={() => router.push('/upgrade' as never)}>
      <Card variant="flat" className="mt-4">
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-3" style={{ minWidth: 220 }}>
            <Icon
              name={expiringSoon ? 'clock' : 'sparkle'}
              size={18}
              color={expiringSoon ? color.warning : color.primary}
            />
            <Text className="flex-1 font-sans text-body text-ink">
              {expiringSoon
                ? L(
                    `Gói ${planOf(plan).name} còn ${left} ngày. Gia hạn để không mất quyền truy cập.`,
                    `${planOf(plan).name} has ${left} days left. Renew to keep your access.`,
                  )
                : expired
                  ? L(
                      'Gói đã hết hạn — bạn đang dùng bản Free. Dữ liệu học vẫn còn nguyên.',
                      "Your plan has expired — you're on Free now. All your study data is still here.",
                    )
                  : source === 'trial'
                    ? L(
                        'Bản dùng thử đã kết thúc. Nâng cấp để mở lại toàn bộ nội dung.',
                        'Your trial has ended. Upgrade to unlock all content again.',
                      )
                    : L(
                        `Bạn đang dùng gói Free. Mở toàn bộ ${CURRICULUM_TOTALS.sets} bộ đề SAT Math và bỏ giới hạn bài đọc.`,
                        `You're on Free. Unlock all ${CURRICULUM_TOTALS.sets} SAT Math sets and unlimited reading.`,
                      )}
            </Text>
          </View>
          <Badge label={L('Xem gói', 'See plans')} tone="primary" />
        </View>
      </Card>
    </Pressable>
  );
}
