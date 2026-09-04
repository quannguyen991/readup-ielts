import React, { useEffect, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { PLANS, PLAN_ORDER, formatVnd, type PlanId } from '@/lib/billing/plans';
import { GROUP_BUY_SIZES, GROUP_BUY_TIERS, groupBuyDiscountPercent, groupBuyYearlyPrice, type GroupSize } from '@/services/payment/pricing-rules';
import { useAuthStore } from '@/store/useAuthStore';
import { color, gradient } from '@/theme/tokens';

/**
 * Mua theo nhóm: càng đông người cùng mua một gói (chu kỳ NĂM), giá càng giảm.
 *
 * HAI CHẾ ĐỘ trên CÙNG một màn, phân biệt bằng việc URL có `?code=` hay không:
 *
 *   Không có code → TẠO NHÓM: chọn gói + mốc người, xem giá, tạo mã chia sẻ.
 *   Có code       → THAM GIA: tra mã, xem nhóm đang rủ mua gì, bấm là sang
 *                   thẳng /checkout với mã nhóm — mỗi người tự chuyển khoản
 *                   QR của riêng mình, không có bước "góp tiền chung" nào.
 *
 * Giá luôn tính LẠI ở đây từ `PLANS[...].yearlyVnd` hiện tại (qua
 * `groupBuyYearlyPrice`), không lưu số cứng — tăng giá niêm yết thì giá nhóm
 * hiện đúng theo, không cần sửa hai chỗ.
 */
export default function GroupBuyScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return code ? <JoinGroup code={code} /> : <CreateGroup />;
}

// ------------------------------------------------------------------ tạo nhóm

const CREATABLE_PLANS: PlanId[] = PLAN_ORDER.filter((id) => id !== 'free');

function CreateGroup() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token ?? null;

  const [plan, setPlan] = useState<PlanId>('max');
  const [targetSize, setTargetSize] = useState<GroupSize>(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const tone = planTone(plan);
  const price = groupBuyYearlyPrice(plan, targetSize);
  const percent = groupBuyDiscountPercent(plan, targetSize);

  const create = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-groups', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, targetSize }),
      });
      const body = (await res.json()) as { group?: { code: string }; error?: string };
      if (!res.ok || !body.group) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setCreated({ code: body.group.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được nhóm.');
    } finally {
      setBusy(false);
    }
  };

  const link = created ? `https://readup-ielts.vercel.app/group-buy?code=${created.code}` : '';
  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  if (status === 'signed_out') {
    return (
      <SignInNotice body="Tạo nhóm mua chung gắn với tài khoản của bạn — phải đăng nhập mới biết đơn của người tham gia thuộc nhóm nào." />
    );
  }

  return (
    <Screen>
      <Appear>
        <LinearGradient
          colors={[...gradient.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 22 }}
        >
          <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
            Mua theo nhóm, càng đông càng rẻ
          </Text>
          <Text className="mt-2 font-sans text-body text-white/90" style={{ maxWidth: 560 }}>
            Rủ bạn học cùng mua một gói trả năm — mỗi người vẫn tự chuyển khoản QR của riêng mình,
            chỉ khác là số tiền đã giảm theo đúng mốc số người của nhóm.
          </Text>
        </LinearGradient>
      </Appear>

      {created ? (
        <Appear index={1}>
          <Card className="mt-4">
            <View className="flex-row items-start gap-2">
              <Icon name="check" size={16} color={color.success} />
              <Text className="flex-1 font-strong text-cardTitle text-ink">
                Đã tạo nhóm {PLANS[plan].name} · {targetSize} người · giảm {percent}%
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-card px-4 py-3" style={{ backgroundColor: tone.soft }}>
                <Text className="font-heavy" style={{ fontSize: 22, letterSpacing: 2, color: tone.ink }}>
                  {created.code}
                </Text>
              </View>
              <Button
                label={copied === 'link' ? 'Đã chép link' : 'Chép link mời'}
                iconLeft={copied === 'link' ? 'check' : 'list'}
                onPress={() => void copy('link', link)}
              />
              <Button
                label="Chia sẻ"
                variant="outline"
                onPress={() =>
                  void Share.share({
                    message: `Mình đang rủ mua chung gói ${PLANS[plan].name} trên ReadUp, đủ ${targetSize} người thì mỗi người giảm ${percent}%. Vào xem: ${link}`,
                  })
                }
              />
            </View>

            <Text className="mt-3 font-sans text-label text-muted">
              Mỗi người bấm link, xem giá đã giảm rồi tự thanh toán QR của mình — không ai phải góp
              tiền trước cho người khác. Nhóm mở trong 7 ngày; sau đó admin đối chiếu số người đã trả
              thật để chốt nhóm.
            </Text>
          </Card>
        </Appear>
      ) : (
        <>
          <Appear index={1}>
            <Card className="mt-4">
              <Text className="font-strong text-cardTitle text-ink">Chọn gói</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {CREATABLE_PLANS.map((id) => (
                  <ChoiceChip key={id} label={PLANS[id].name} active={plan === id} onPress={() => setPlan(id)} />
                ))}
              </View>

              <Text className="mt-4 font-strong text-cardTitle text-ink">Mốc số người</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {GROUP_BUY_SIZES.map((size) => (
                  <ChoiceChip
                    key={size}
                    label={`${size} người · giảm ${GROUP_BUY_TIERS[plan as Exclude<PlanId, 'free'>][size]}%`}
                    active={targetSize === size}
                    onPress={() => setTargetSize(size)}
                  />
                ))}
              </View>

              <View className="mt-4 rounded-card p-3" style={{ backgroundColor: tone.soft }}>
                <Text className="font-sans text-label text-muted">
                  Giá niêm yết {formatVnd(PLANS[plan].yearlyVnd)}/năm → mỗi người trong nhóm trả
                </Text>
                <Text className="mt-0.5 font-heavy text-stat" style={{ color: tone.ink }}>
                  {formatVnd(price)}/năm
                </Text>
              </View>

              {error ? (
                <Text className="mt-3 font-sans text-label" style={{ color: color.danger }}>
                  {error}
                </Text>
              ) : null}

              <Button
                className="mt-4 self-start"
                label={busy ? 'Đang tạo…' : 'Tạo nhóm, lấy link mời'}
                iconRight="arrow-right"
                disabled={busy}
                onPress={() => void create()}
              />
            </Card>
          </Appear>

          <Appear index={2}>
            <Card className="mt-4" variant="flat">
              <Text className="font-strong text-body text-ink">Cách hoạt động</Text>
              <View className="mt-2 gap-1.5">
                <Rule text="Chỉ áp dụng gói trả NĂM, không áp dụng gói tháng." />
                <Rule text="Mỗi người tự thanh toán QR của mình — không ai giữ tiền hộ ai." />
                <Rule text="Nhóm mở 7 ngày. Chưa đủ người thì admin tự hạ xuống mốc thấp hơn tương ứng số người đã trả thật, và bù chênh lệch bằng cách cộng thêm ngày dùng, không hoàn tiền." />
                <Rule text="Tham gia nhóm KHÔNG tự tính là một lượt mời bạn hợp lệ — hai cơ chế tách biệt." />
              </View>
            </Card>
          </Appear>
        </>
      )}

      <Button className="mt-4 self-start" label="Xem các gói" variant="ghost" onPress={() => router.push('/upgrade' as never)} />
    </Screen>
  );
}

// -------------------------------------------------------------------- tham gia

type GroupInfo = {
  group: {
    id: string;
    code: string;
    plan: PlanId;
    target_size: GroupSize;
    discount_percent: number;
    status: 'collecting' | 'settled' | 'expired';
    settle_by: string;
  };
  paidCount: number;
  priceVnd: number;
  expired: boolean;
};

function JoinGroup({ code }: { code: string }) {
  const [data, setData] = useState<GroupInfo | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/payment-groups?code=${encodeURIComponent(code)}`);
        const body = (await res.json()) as (GroupInfo & { error?: string }) | { error: string };
        if (cancelled) return;
        if (!res.ok || 'error' in body) throw new Error((body as { error?: string }).error ?? `Lỗi ${res.status}`);
        setData(body);
        // Tính ở đây (trong effect), không phải trong useMemo lúc render — Date.now()
        // là hàm không thuần, gọi trong lúc render bị React Compiler cấm.
        const ms = new Date(body.group.settle_by).getTime() - Date.now();
        setDaysLeft(Math.max(0, Math.ceil(ms / (24 * 3600_000))));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không tra được nhóm.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <Screen>
        <Card className="mt-4">
          <Text className="font-sans text-body text-muted">Đang tra mã nhóm…</Text>
        </Card>
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Card className="mt-4">
          <View className="flex-row items-start gap-2">
            <Icon name="info" size={16} color={color.danger} />
            <Text className="flex-1 font-sans text-body text-danger-ink">
              {error ?? 'Không tìm thấy nhóm.'}
            </Text>
          </View>
          <Button className="mt-3 self-start" label="Tạo nhóm mới" onPress={() => router.replace('/group-buy' as never)} />
        </Card>
      </Screen>
    );
  }

  const { group } = data;
  const plan = PLANS[group.plan];
  const tone = planTone(group.plan);
  const inactive = data.expired || group.status !== 'collecting';

  return (
    <Screen>
      <Appear>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={`Nhóm ${group.code}`} tone="neutral" shape="tag" />
            {inactive ? <Badge label="Đã hết hạn nhận thêm người" tone="warning" shape="tag" /> : null}
          </View>

          <Text className="mt-2 font-heavy text-pageTitle" style={{ color: tone.ink }}>
            Mua chung gói {plan.name} — {group.target_size} người
          </Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Giảm {group.discount_percent}% so với giá niêm yết {formatVnd(plan.yearlyVnd)}/năm.
          </Text>

          <View className="mt-3 rounded-card p-3" style={{ backgroundColor: tone.soft }}>
            <Text className="font-sans text-label text-muted">Mỗi người trả</Text>
            <Text className="mt-0.5 font-heavy text-stat" style={{ color: tone.ink }}>
              {formatVnd(data.priceVnd)}/năm
            </Text>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-4">
            <View>
              <Text className="font-mid text-label text-muted">Đã thanh toán</Text>
              <Text className="font-strong text-body text-ink">{data.paidCount}/{group.target_size} người</Text>
            </View>
            {daysLeft !== null ? (
              <View>
                <Text className="font-mid text-label text-muted">Còn nhận người</Text>
                <Text className="font-strong text-body text-ink">{daysLeft} ngày</Text>
              </View>
            ) : null}
          </View>

          <Button
            className="mt-4 self-start"
            label={inactive ? 'Nhóm không còn nhận thêm — mua giá niêm yết' : 'Tham gia — thanh toán ngay'}
            iconRight="arrow-right"
            onPress={() =>
              router.push(
                (inactive
                  ? `/checkout?plan=${group.plan}&cycle=yearly`
                  : `/checkout?plan=${group.plan}&cycle=yearly&group=${group.code}`) as never,
              )
            }
          />

          <Text className="mt-3 font-sans text-label text-subtle">
            Bạn tự chuyển khoản QR của riêng mình — không gửi tiền cho trưởng nhóm.
          </Text>
        </Card>
      </Appear>

      <Button className="mt-4 self-start" label="Tạo nhóm của riêng bạn" variant="ghost" onPress={() => router.push('/group-buy' as never)} />
    </Screen>
  );
}

// ------------------------------------------------------------------- dùng chung

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="rounded-pill border px-3 py-1.5"
      style={{
        borderColor: active ? color.primary : color.border,
        backgroundColor: active ? color.primarySoft : color.surface,
      }}
    >
      <Text className={active ? 'font-strong text-label' : 'font-sans text-label'} style={{ color: active ? color.primary : color.body }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Icon name="check" size={14} color={color.success} />
      <Text className="flex-1 font-sans text-label text-ink">{text}</Text>
    </View>
  );
}

function SignInNotice({ body }: { body: string }) {
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 440 }}>
        <Card className="mt-4">
          <View className="flex-row items-start gap-3">
            <Icon name="lock" size={18} color={color.muted} />
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">Cần đăng nhập</Text>
              <Text className="mt-1 font-sans text-body text-muted">{body}</Text>
            </View>
          </View>
          <Button className="mt-4 self-start" label="Đăng nhập" onPress={() => router.push('/auth/sign-in' as never)} />
        </Card>
      </View>
    </Screen>
  );
}
