import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  PLANS,
  TRIAL_AI_PLAN,
  TRIAL_DAYS,
  TRIAL_PLAN,
  formatVnd,
  planOf,
  type Feature,
  type PlanId,
} from '@/lib/billing/plans';
import { requiredPlanFor } from '@/lib/billing/entitlements';
import { useBillingStore, usePlanStatus } from '@/store/useBillingStore';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { color } from '@/theme/tokens';

/**
 * Các mảnh giao diện liên quan tới gói.
 *
 * NGUYÊN TẮC VIẾT CHỮ Ở ĐÂY: nói rõ đang thiếu gì và mở được gì, KHÔNG doạ và
 * không giả vờ hết hàng. Người học bị chặn giữa buổi học đã đủ bực; thêm một câu
 * bán hàng kiểu "chỉ hôm nay" là họ đóng app luôn.
 */

/** Màu đi lên theo bậc: xám → lam → tím → cam. Nhìn thứ tự là đoán được thứ hạng. */
const PLAN_TONE: Record<PlanId, { solid: string; soft: string; ink: string }> = {
  free: { solid: '#64748B', soft: '#F1F4FB', ink: '#334155' },
  plus: { solid: '#2563EB', soft: '#EFF5FF', ink: '#1D4FD7' },
  pro: { solid: '#A855F7', soft: '#F8EFFF', ink: '#7E22CE' },
  max: { solid: '#F97316', soft: '#FFF0E4', ink: '#C2410C' },
};

export function planTone(plan: PlanId) {
  return PLAN_TONE[plan];
}

export function PlanBadge({ plan, compact = false }: { plan: PlanId; compact?: boolean }) {
  const tone = PLAN_TONE[plan];
  return (
    <View
      className="flex-row items-center gap-1 rounded-pill px-2 py-0.5"
      style={{ backgroundColor: tone.soft }}
    >
      {plan === 'max' ? <Icon name="trophy" size={12} color={tone.solid} /> : null}
      <Text className="font-strong text-label" style={{ color: tone.ink }}>
        {compact ? PLANS[plan].name : `Gói ${PLANS[plan].name}`}
      </Text>
    </View>
  );
}

/** Số lượt AI mỗi tháng khi đang học thử — cùng con số máy chủ dùng. */
export const TRIAL_AI_CALLS = PLANS[TRIAL_AI_PLAN].quotas.ai_calls_per_month ?? 0;

/**
 * Thẻ HỌC THỬ 5 NGÀY.
 *
 * Nói rõ ba thứ ngay trên thẻ: mở gì (toàn bộ nội dung gói Pro), GIỮ NGUYÊN gì
 * (lượt AI vẫn là mức Free), và hết hạn thì sao (về Free, dữ liệu còn nguyên).
 * Giấu chuyện AI bị giới hạn đến lúc bấm chấm bài mới lộ ra là kiểu gài khiến
 * người ta thấy bị lừa, dù hạn mức đó hoàn toàn hợp lý.
 *
 * Đang học thử thì thẻ đổi sang đếm ngày còn lại; đã dùng rồi thì ẩn.
 */
export function TrialCard({ className = 'mt-4' }: { className?: string }) {
  const status = usePlanStatus();
  const start = useBillingStore((s) => s.startVipTrial);
  const tone = PLAN_TONE[TRIAL_PLAN];

  if (status.onTrial) {
    return (
      <View
        className={`${className} flex-row flex-wrap items-center gap-3 rounded-card px-4 py-3`}
        style={{ backgroundColor: tone.soft }}
      >
        <Icon name="clock" size={18} color={tone.solid} />
        <Text className="flex-1 font-sans text-body text-ink" style={{ minWidth: 200 }}>
          <Text className="font-strong" style={{ color: tone.ink }}>
            Đang học thử {PLANS[TRIAL_PLAN].name} · còn {status.daysLeft ?? 0} ngày.
          </Text>{' '}
          Mở hết nội dung; lượt AI vẫn {TRIAL_AI_CALLS} lượt mỗi tháng như gói Free.
        </Text>
      </View>
    );
  }

  if (!status.canStartTrial) return null;

  return (
    <View
      className={`${className} overflow-hidden rounded-card`}
      style={{ backgroundColor: tone.ink }}
    >
      <View className="flex-row flex-wrap items-center gap-4 p-4 md:p-5">
        <View
          className="items-center justify-center rounded-panel"
          style={{ width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.14)' }}
        >
          <Text className="font-heavy text-white" style={{ fontSize: 30, lineHeight: 32 }}>
            {TRIAL_DAYS}
          </Text>
          <Text className="font-strong text-white" style={{ fontSize: 10, letterSpacing: 1 }}>
            NGÀY
          </Text>
        </View>
        <View className="flex-1" style={{ minWidth: 220 }}>
          <Text className="font-strong text-cardTitle text-white">
            Học thử {TRIAL_DAYS} ngày, mở hết nội dung
          </Text>
          <Text className="mt-1 font-sans text-label" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Mọi bộ đề, bài học, bài mẫu của gói {PLANS[TRIAL_PLAN].name}. Lượt AI vẫn giữ{' '}
            {TRIAL_AI_CALLS} lượt/tháng như gói Free. Không cần thẻ, hết hạn tự về Free, dữ liệu
            học giữ nguyên.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={start}
          className="flex-row items-center gap-2 rounded-pill bg-white px-4 py-2.5"
        >
          <Text className="font-strong text-label" style={{ color: tone.ink }}>
            Bắt đầu học thử
          </Text>
          <Icon name="arrow-right" size={15} color={tone.ink} />
        </Pressable>
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
  const startTrial = useBillingStore((s) => s.startVipTrial);
  // Học thử mở được đúng tính năng này thì mời học thử trước khi mời trả tiền.
  const trialOpens = status.canStartTrial && planOf(TRIAL_PLAN).features.includes(feature);

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
            {plan.highlights.map((line) => (
              <View key={line} className="flex-row items-start gap-2">
                <Icon name="check" size={15} color={tone.solid} />
                <Text className="flex-1 font-sans text-label text-ink">{line}</Text>
              </View>
            ))}
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-3">
            <Button
              label={`Mở khoá · ${formatVnd(plan.monthlyVnd)}/tháng`}
              iconRight="arrow-right"
              onPress={() => router.push('/upgrade' as never)}
            />
            <Text className="font-sans text-label text-muted">
              hoặc {formatVnd(plan.yearlyVnd)}/năm
            </Text>
          </View>
          {trialOpens ? (
            <Button
              className="mt-2 self-start"
              label={`Học thử ${TRIAL_DAYS} ngày miễn phí`}
              variant="outline"
              iconRight="sparkle"
              onPress={startTrial}
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
            Bạn đã dùng {used}/{limit} lượt. Lượt mới có lại {resetsIn} — hoặc mở khoá không giới hạn
            với gói {PLANS[requiredPlan].name}.
          </Text>
          <Button
            className="mt-3 self-start"
            label={`Xem gói ${PLANS[requiredPlan].name}`}
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
                ? `Gói ${planOf(plan).name} còn ${left} ngày. Gia hạn để không mất quyền truy cập.`
                : expired
                  ? 'Gói đã hết hạn — bạn đang dùng bản Free. Dữ liệu học vẫn còn nguyên.'
                  : source === 'trial'
                    ? 'Bản dùng thử đã kết thúc. Nâng cấp để mở lại toàn bộ nội dung.'
                    : `Bạn đang dùng gói Free. Mở toàn bộ ${CURRICULUM_TOTALS.sets} bộ đề SAT Math và bỏ giới hạn bài đọc.`}
            </Text>
          </View>
          <Badge label="Xem gói" tone="primary" />
        </View>
      </Card>
    </Pressable>
  );
}
