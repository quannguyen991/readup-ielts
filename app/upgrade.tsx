import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { TrialCard, planTone } from '@/components/billing/PlanUi';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { hasFeature } from '@/lib/billing/entitlements';
import { hasBankConfig } from '@/lib/env';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import {
  PLANS,
  PLAN_ORDER,
  QUOTA_LABEL,
  formatVnd,
  yearlySavingPercent,
  type Feature,
  type PlanId,
  type Quota,
} from '@/lib/billing/plans';
import { usePlanStatus, useBillingStore } from '@/store/useBillingStore';
import { color } from '@/theme/tokens';
import { CrossFade } from '@/components/motion/Motion';

/**
 * Bảng giá.
 *
 * BA QUYẾT ĐỊNH VỀ CÁCH TRÌNH BÀY:
 *
 * 1. Bảng so sánh ghi CẢ những gì gói Free đã có, không chỉ những gì bị khoá.
 *    Bảng chỉ toàn dấu ✗ ở cột Free trông như một lời doạ, mà sự thật là bản
 *    Free ở đây dùng học thật được.
 * 2. Hạn mức ghi bằng SỐ THẬT, kể cả trần của gói cao nhất. Viết "không giới hạn" rồi
 *    âm thầm chặn ở đâu đó là cách nhanh nhất mất niềm tin.
 * 3. Nói thẳng là CHƯA THANH TOÁN ĐƯỢC. Bày nút "Mua ngay" rồi dẫn tới ngõ cụt
 *    còn tệ hơn là không có nút.
 */
export default function UpgradeScreen() {
  const [yearly, setYearly] = useState(true);
  const status = usePlanStatus();

  return (
    <Screen>
      <LightHero
        scene="progress"
        badge="BAND 9 · GÓI HỌC" art="shop"
        line1="Chọn gói"
        line2="học đúng phần mình cần"
        subtitle="Bản Free dùng học thật được — nâng cấp khi bạn cần mở thêm nội dung, không phải để bắt đầu."
        footer={
          <>
            <HeroStat value={status.plan === 'free' ? 'Free' : PLANS[status.plan].name} label="gói hiện tại" />
            <HeroStat value={status.daysLeft === null ? '∞' : String(status.daysLeft)} label="ngày còn lại" />
            <HeroStat value={String(PLAN_ORDER.length)} label="gói lựa chọn" />
          </>
        }
      />

      <View className="mt-4 flex-row items-center justify-center gap-2">
        <CycleTab label="Trả tháng" active={!yearly} onPress={() => setYearly(false)} />
        <CycleTab
          label={`Trả năm · tiết kiệm ${yearlySavingPercent(PLANS[RECOMMENDED])}%`}
          active={yearly}
          onPress={() => setYearly(true)}
        />
      </View>

      <View className="mt-4">
        {/* Gạt tháng / năm: bảng giá mới mờ dần vào thay vì nhảy số tại chỗ. */}
        <CrossFade swapKey={yearly ? 'yearly' : 'monthly'}>
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          {PLAN_ORDER.map((id) => (
            <PlanCard
              key={id}
              id={id}
              yearly={yearly}
              current={status.plan}
              onPickCycle={(next) => setYearly(next === 'yearly')}
            />
          ))}
        </Grid>
        </CrossFade>
      </View>

      <TrialCard />

      <SectionHeader
        className="mt-6"
        title="So sánh chi tiết"
        subtitle={`Số thật, kể cả trần của gói ${PLANS.max.name}.`}
        icon="list"
      />
      <Card className="mt-3" padded={false}>
        <ComparisonTable />
      </Card>

      {/*
        Mua theo nhóm — thẻ riêng, đặt NGAY SAU bảng so sánh vì đây đúng lúc
        người đọc vừa thấy giá và đang cân nhắc, chưa phải cuối trang nơi ít ai
        cuộn tới.
      */}
      <Card className="mt-4">
        <View className="flex-row flex-wrap items-center gap-4">
          <View className="flex-1" style={{ minWidth: 220 }}>
            <Text className="font-strong text-cardTitle text-ink">Mua theo nhóm, càng đông càng rẻ</Text>
            <Text className="mt-1 font-sans text-body text-muted">
              Rủ bạn học cùng mua Plus/Pro/Max trả năm — nhóm 10 người mua Max giảm tới 30%. Mỗi
              người vẫn tự chuyển khoản QR của riêng mình.
            </Text>
          </View>
          <Button
            label="Tạo nhóm mua chung"
            variant="outline"
            iconRight="arrow-right"
            onPress={() => router.push('/group-buy' as never)}
          />
        </View>
      </Card>

      {/*
        Cảnh báo "chưa nối cổng thanh toán" CHỈ hiện khi thật sự chưa nối
        (`!hasBankConfig()`). Bản trước hiện CỐ ĐỊNH bất kể cấu hình — đúng lúc
        mới ra mắt, sai từ lúc QR chuyển khoản đã chạy thật (đã xác nhận qua
        toàn bộ luồng checkout.tsx/order+api.ts đang hoạt động). Nói "chưa
        thanh toán được" trong khi thanh toán ĐANG chạy được là kiểu honest-UI
        ngược — im lặng thì còn hơn nói sai.
      */}
      {!hasBankConfig() ? (
        <Card className="mt-4" variant="flat">
          <View className="flex-row items-start gap-2">
            <Icon name="info" size={17} color={color.warning} />
            <View className="flex-1">
              <Text className="font-strong text-body text-ink">Chưa thanh toán được</Text>
              <Text className="mt-1 font-sans text-body text-muted">
                Cổng thanh toán (quét mã QR chuyển khoản) chưa nối. Nút nâng cấp bên trên hiện chỉ ghi
                nhận lựa chọn trên máy này để bạn xem thử giao diện sau khi mở khoá — chưa trừ tiền và
                chưa đồng bộ lên máy chủ.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Button
        className="mt-4 self-center"
        label="Quay lại học"
        variant="ghost"
        onPress={() => router.back()}
      />
    </Screen>
  );
}

function CycleTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className={`rounded-pill border px-4 py-2 ${
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface'
      }`}
    >
      <Text className={active ? 'font-strong text-body text-white' : 'font-mid text-body text-muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

function PlanCard({
  id,
  yearly,
  current,
  onPickCycle,
}: {
  id: PlanId;
  yearly: boolean;
  current: PlanId;
  onPickCycle: (cycle: 'monthly' | 'yearly') => void;
}) {
  const plan = PLANS[id];
  const tone = planTone(id);
  const setPlan = useBillingStore((s) => s.setPlanLocally);
  const isCurrent = current === id;
  const price = yearly ? plan.yearlyVnd : plan.monthlyVnd;

  /*
    Bấm chọn gói giờ đi tới trang thanh toán, KHÔNG tự bật gói ở client nữa.

    Bản trước gọi `setPlan()` — tức là ai cũng có gói Max bằng một cú bấm. Cái đó
    chấp nhận được khi chưa có đường trả tiền nào; giờ đã có QR chuyển khoản thì
    nó thành một cửa hậu để không.

    Về Free thì vẫn xử ngay tại chỗ: hạ gói không cần ai duyệt.
  */
  const choose = () => {
    if (id === 'free') {
      setPlan('free', null);
      return;
    }
    router.push(`/checkout?plan=${id}&cycle=${yearly ? 'yearly' : 'monthly'}` as never);
  };

  return (
    <Card className="h-full" padded={false}>
      {/* Gói được gợi ý do bảng giá tự khai (`recommended`), không ghim id ở đây —
          đổi gói gợi ý thì sửa một chỗ duy nhất trong plans.ts. */}
      {plan.recommended ? (
        <View
          className="items-center rounded-t-card py-1.5"
          style={{ backgroundColor: tone.solid }}
        >
          <Text className="font-strong text-label text-white">Phù hợp với phần lớn người học</Text>
        </View>
      ) : null}

      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-heavy text-sectionTitle" style={{ color: tone.ink }}>
            {plan.name}
          </Text>
          {isCurrent ? <Badge label="Đang dùng" tone="success" shape="tag" /> : null}
        </View>
        <Text className="mt-1 font-sans text-label text-muted">{plan.tagline}</Text>

        <View className="mt-3 flex-row items-end gap-1">
          <Text className="font-heavy text-stat text-ink">{formatVnd(price)}</Text>
          {price > 0 ? (
            <Text className="mb-1 font-mid text-label text-muted">/{yearly ? 'năm' : 'tháng'}</Text>
          ) : null}
        </View>
        {yearly && price > 0 ? (
          <Text className="mt-0.5 font-sans text-label text-muted">
            ≈ {formatVnd(Math.round(plan.yearlyVnd / 12))}/tháng
          </Text>
        ) : null}

        {/*
          GIÁ CÒN LẠI hiện ngay trên thẻ, không giấu sau nút gạt.

          Nút gạt trả tháng/trả năm ở trên vẫn giữ, nhưng một mình nó bắt người
          dùng phải bấm qua bấm lại mới so được hai con số — mà so hai con số
          chính là việc họ đang làm. Hiện cả hai, và cho bấm mua thẳng cái nào
          cũng được.
        */}
        {price > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onPickCycle(yearly ? 'monthly' : 'yearly')}
            className="mt-2 flex-row items-center justify-between rounded-card border border-border bg-surfaceAlt px-2.5 py-2"
          >
            <View className="min-w-0 flex-1">
              <Text className="font-mid text-label text-muted">
                {yearly ? 'Hoặc trả từng tháng' : 'Hoặc trả cả năm'}
              </Text>
              <Text className="font-strong text-body text-ink">
                {formatVnd(yearly ? plan.monthlyVnd : plan.yearlyVnd)}
                <Text className="font-sans text-label text-muted">
                  {yearly ? '/tháng' : '/năm'}
                </Text>
                {!yearly ? (
                  <Text className="font-sans text-label" style={{ color: tone.ink }}>
                    {'  '}rẻ hơn {yearlySavingPercent(plan)}%
                  </Text>
                ) : null}
              </Text>
            </View>
            <Icon name="chevron-right" size={15} color={color.subtle} />
          </Pressable>
        ) : null}

        <View className="mt-3 gap-1.5">
          {plan.highlights.map((line) => (
            <View key={line} className="flex-row items-start gap-2">
              <Icon name="check" size={15} color={tone.solid} />
              <Text className="flex-1 font-sans text-label text-ink">{line}</Text>
            </View>
          ))}
        </View>

        <View className="mt-4">
          {isCurrent ? (
            <Button label="Gói hiện tại" variant="outline" fullWidth disabled onPress={() => {}} />
          ) : (
            <Button
              label={id === 'free' ? 'Chuyển về Free' : `Chọn gói ${plan.name}`}
              variant={plan.recommended ? 'primary' : 'outline'}
              fullWidth
              onPress={choose}
            />
          )}
        </View>
      </View>
    </Card>
  );
}

const COMPARE_FEATURES: Array<{ feature: Feature; label: string }> = [
  {
    feature: 'math_all_stages',
    label: `Toàn bộ ${CURRICULUM_TOTALS.sets} bộ đề SAT Math (${CURRICULUM_TOTALS.stages} chặng)`,
  },
  { feature: 'math_unlimited_mock', label: 'Thi thử adaptive không giới hạn' },
  { feature: 'reading_unlimited', label: 'Bài đọc không giới hạn' },
  { feature: 'vocab_unlimited', label: 'Sổ từ không giới hạn' },
  { feature: 'writing_offline_grading', label: 'Chấm Writing không cần AI' },
  { feature: 'writing_ai_grading', label: 'Chấm Writing bằng AI, có annotation' },
  { feature: 'model_essays', label: 'Bài mẫu đã kiểm định band' },
  { feature: 'ai_chat', label: 'Chatbox trợ giảng' },
  {
    feature: 'verifiable_credential',
    label: 'Chứng chỉ ký số — người khác kiểm lại được mà không cần tin app',
  },
  { feature: 'priority_support', label: 'Hỗ trợ ưu tiên' },
];

/** Gói được gợi ý — suy từ bảng giá, không gõ tay lần thứ hai. */
const RECOMMENDED: PlanId = PLAN_ORDER.find((id) => PLANS[id].recommended) ?? 'plus';

const COMPARE_QUOTAS: Quota[] = ['reading_per_day', 'mock_per_week', 'ai_calls_per_month', 'vocab_total'];

function ComparisonTable() {
  return (
    <View>
      <View className="flex-row border-b border-border bg-surfaceAlt px-3 py-2.5">
        <Text className="flex-[2] font-strong text-label text-muted">Tính năng</Text>
        {PLAN_ORDER.map((id) => (
          <Text key={id} className="flex-1 text-center font-strong text-label text-ink">
            {PLANS[id].name}
          </Text>
        ))}
      </View>

      {COMPARE_FEATURES.map(({ feature, label }) => (
        <View key={feature} className="flex-row items-center border-b border-border px-3 py-2.5">
          <Text className="flex-[2] font-sans text-label text-ink">{label}</Text>
          {PLAN_ORDER.map((id) => (
            <View key={id} className="flex-1 items-center">
              {hasFeature(id, feature) ? (
                <Icon name="check" size={16} color={color.success} />
              ) : (
                <Text className="font-mid text-label text-subtle">—</Text>
              )}
            </View>
          ))}
        </View>
      ))}

      {COMPARE_QUOTAS.map((quota) => (
        <View key={quota} className="flex-row items-center border-b border-border px-3 py-2.5">
          <Text className="flex-[2] font-sans text-label text-ink">
            Số {QUOTA_LABEL[quota]}
          </Text>
          {PLAN_ORDER.map((id) => {
            const limit = PLANS[id].quotas[quota];
            return (
              <Text key={id} className="flex-1 text-center font-mid text-label text-ink">
                {limit === null ? 'Không giới hạn' : limit}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}
