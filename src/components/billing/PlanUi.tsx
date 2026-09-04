import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import { PLANS, formatVnd, planOf, type Feature, type PlanId } from '@/lib/billing/plans';
import { requiredPlanFor } from '@/lib/billing/entitlements';
import { usePlanStatus } from '@/store/useBillingStore';
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
  const { plan, daysLeft: left, expired, source } = usePlanStatus();

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
