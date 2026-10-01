import React, { useEffect, useState } from 'react';
import { SITE_ORIGIN } from '@/lib/site';
import { Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { currentLocale, pick, useL } from '@/i18n/useL';
import { PLANS, PLAN_ORDER, formatVnd, type PlanId } from '@/lib/billing/plans';
import { GROUP_BUY_SIZES, GROUP_BUY_TIERS, groupBuyDiscountPercent, groupBuyYearlyPrice, type GroupSize } from '@/services/payment/pricing-rules';
import { useAuthStore } from '@/store/useAuthStore';
import { color, gradient } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Badge as SealBadge } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';

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
  const { L } = useL();
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
      if (!res.ok || !body.group) throw new Error(body.error ?? L(`Lỗi ${res.status}`, `Error ${res.status}`));
      setCreated({ code: body.group.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : L('Không tạo được nhóm.', 'Could not create the group.'));
    } finally {
      setBusy(false);
    }
  };

  const link = created ? `${SITE_ORIGIN}/group-buy?code=${created.code}` : '';
  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  if (status === 'signed_out') {
    return (
      <SignInNotice
        body={L(
          'Tạo nhóm mua chung gắn với tài khoản của bạn — phải đăng nhập mới biết đơn của người tham gia thuộc nhóm nào.',
          'A group buy is tied to your account — sign in so we know which group each member’s order belongs to.',
        )}
      />
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
          <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
          <View aria-hidden className="mb-2 self-start">
            <Motion kind="pop">
              <Label text={L('Đông vui, giá rẻ 👥', 'More friends, lower price 👥')} color="#F2B632" ink="#2A1B02" tilt={-4} size={12} />
            </Motion>
          </View>
          <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
            {L('Mua theo nhóm, càng đông càng rẻ', 'Buy as a group — the bigger, the cheaper')}
          </Text>
          <Text className="mt-2 font-sans text-body text-white/90" style={{ maxWidth: 560 }}>
            {L(
              'Rủ bạn học cùng mua một gói trả năm — mỗi người vẫn tự chuyển khoản QR của riêng mình, chỉ khác là số tiền đã giảm theo đúng mốc số người của nhóm.',
              'Invite study friends to buy a yearly plan together — everyone still pays with their own QR transfer, just at the price discounted for the group size.',
            )}
          </Text>
          </View>
          <PageStickers scene="shop" compact />
          </View>
        </LinearGradient>
      </Appear>

      {created ? (
        <Appear index={1}>
          <Card className="mt-4">
            <View className="flex-row items-center gap-2.5">
              <View aria-hidden>
                <Motion kind="pop">
                  <SealBadge icon="check" color="#22A06B" size={36} />
                </Motion>
              </View>
              <Text className="flex-1 font-strong text-cardTitle text-ink">
                {L(
                  `Đã tạo nhóm ${PLANS[plan].name} · ${targetSize} người · giảm ${percent}%`,
                  `${PLANS[plan].name} group created · ${targetSize} people · ${percent}% off`,
                )}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-card px-4 py-3" style={{ backgroundColor: tone.soft }}>
                <Text className="font-heavy" style={{ fontSize: 22, letterSpacing: 2, color: tone.ink }}>
                  {created.code}
                </Text>
              </View>
              <Button
                label={copied === 'link' ? L('Đã chép link', 'Link copied') : L('Chép link mời', 'Copy invite link')}
                iconLeft={copied === 'link' ? 'check' : 'list'}
                onPress={() => void copy('link', link)}
              />
              <Button
                label={L('Chia sẻ', 'Share')}
                variant="outline"
                onPress={() =>
                  void Share.share({
                    message: L(
                      `Mình đang rủ mua chung gói ${PLANS[plan].name} trên Band 9, đủ ${targetSize} người thì mỗi người giảm ${percent}%. Vào xem: ${link}`,
                      `I'm getting a group together for Band 9 ${PLANS[plan].name}: with ${targetSize} people, everyone gets ${percent}% off. Take a look: ${link}`,
                    ),
                  })
                }
              />
            </View>

            <Text className="mt-3 font-sans text-label text-muted">
              {L(
                'Mỗi người bấm link, xem giá đã giảm rồi tự thanh toán QR của mình — không ai phải góp tiền trước cho người khác. Nhóm mở trong 7 ngày; sau đó admin đối chiếu số người đã trả thật để chốt nhóm.',
                'Each person opens the link, sees the discounted price and pays with their own QR — nobody pays upfront for anyone else. The group stays open for 7 days; then an admin checks how many actually paid and closes the group.',
              )}
            </Text>
          </Card>
        </Appear>
      ) : (
        <>
          <Appear index={1}>
            <Card className="mt-4">
              <View className="flex-row items-center gap-2.5">
                <View aria-hidden>
                  <SealIcon name="gift" color="#F472B6" size={36} />
                </View>
                <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Chọn gói', 'Choose a plan')}</Text>
              </View>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {CREATABLE_PLANS.map((id) => (
                  <ChoiceChip key={id} label={PLANS[id].name} active={plan === id} onPress={() => setPlan(id)} />
                ))}
              </View>

              <View className="mt-4 flex-row flex-wrap items-center gap-2.5">
                <View aria-hidden>
                  <SealIcon name="target" color="#B07A3A" size={36} />
                </View>
                <Text className="font-strong text-cardTitle text-ink">{L('Mốc số người', 'Group size')}</Text>
                {percent > 0 ? (
                  <View aria-hidden>
                    <Label text={`−${percent}% 🔥`} color="#F0703F" ink="#FFFFFF" tilt={-4} size={11} />
                  </View>
                ) : null}
              </View>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {GROUP_BUY_SIZES.map((size) => (
                  <ChoiceChip
                    key={size}
                    label={L(
                      `${size} người · giảm ${GROUP_BUY_TIERS[plan as Exclude<PlanId, 'free'>][size]}%`,
                      `${size} people · ${GROUP_BUY_TIERS[plan as Exclude<PlanId, 'free'>][size]}% off`,
                    )}
                    active={targetSize === size}
                    onPress={() => setTargetSize(size)}
                  />
                ))}
              </View>

              <View className="mt-4 rounded-card p-3" style={{ backgroundColor: tone.soft }}>
                <Text className="font-sans text-label text-muted">
                  {L(
                    `Giá niêm yết ${formatVnd(PLANS[plan].yearlyVnd)}/năm → mỗi người trong nhóm trả`,
                    `List price ${formatVnd(PLANS[plan].yearlyVnd)}/year → each group member pays`,
                  )}
                </Text>
                <Text className="mt-0.5 font-heavy text-stat" style={{ color: tone.ink }}>
                  {formatVnd(price)}{L('/năm', '/year')}
                </Text>
              </View>

              {error ? (
                <Text className="mt-3 font-sans text-label" style={{ color: color.danger }}>
                  {error}
                </Text>
              ) : null}

              <Button
                className="mt-4 self-start"
                label={busy ? L('Đang tạo…', 'Creating…') : L('Tạo nhóm, lấy link mời', 'Create group & get invite link')}
                iconRight="arrow-right"
                disabled={busy}
                onPress={() => void create()}
              />
            </Card>
          </Appear>

          <Appear index={2}>
            <Card className="mt-4" variant="flat">
              <View className="flex-row items-center gap-2">
                <View aria-hidden>
                  <SealIcon name="info" color="#A8843F" size={30} />
                </View>
                <Text className="min-w-0 flex-1 font-strong text-body text-ink">{L('Cách hoạt động', 'How it works')}</Text>
              </View>
              <View className="mt-2 gap-1.5">
                <Rule text={L('Chỉ áp dụng gói trả NĂM, không áp dụng gói tháng.', 'Yearly plans only — not monthly plans.')} />
                <Rule text={L('Mỗi người tự thanh toán QR của mình — không ai giữ tiền hộ ai.', 'Everyone pays with their own QR — nobody holds money for anyone else.')} />
                <Rule
                  text={L(
                    'Nhóm mở 7 ngày. Chưa đủ người thì admin tự hạ xuống mốc thấp hơn tương ứng số người đã trả thật, và bù chênh lệch bằng cách cộng thêm ngày dùng, không hoàn tiền.',
                    'Groups stay open for 7 days. If the group falls short, an admin moves it down to the tier matching how many actually paid and makes up the difference with extra days of access, not refunds.',
                  )}
                />
                <Rule
                  text={L(
                    'Tham gia nhóm KHÔNG tự tính là một lượt mời bạn hợp lệ — hai cơ chế tách biệt.',
                    'Joining a group does NOT count as a valid friend referral — the two are separate.',
                  )}
                />
              </View>
            </Card>
          </Appear>
        </>
      )}

      <Button className="mt-4 self-start" label={L('Xem các gói', 'See plans')} variant="ghost" onPress={() => router.push('/upgrade' as never)} />
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
  const { L } = useL();
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
        if (!res.ok || 'error' in body) throw new Error((body as { error?: string }).error ?? pick(currentLocale(), `Lỗi ${res.status}`, `Error ${res.status}`));
        setData(body);
        // Tính ở đây (trong effect), không phải trong useMemo lúc render — Date.now()
        // là hàm không thuần, gọi trong lúc render bị React Compiler cấm.
        const ms = new Date(body.group.settle_by).getTime() - Date.now();
        setDaysLeft(Math.max(0, Math.ceil(ms / (24 * 3600_000))));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : pick(currentLocale(), 'Không tra được nhóm.', 'Could not look up the group.'));
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
          <Text className="font-sans text-body text-muted">{L('Đang tra mã nhóm…', 'Looking up group code…')}</Text>
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
              {error ?? L('Không tìm thấy nhóm.', 'Group not found.')}
            </Text>
          </View>
          <Button className="mt-3 self-start" label={L('Tạo nhóm mới', 'Create a new group')} onPress={() => router.replace('/group-buy' as never)} />
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
          <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
            <Badge label={L(`Nhóm ${group.code}`, `Group ${group.code}`)} tone="neutral" shape="tag" />
            {inactive ? <Badge label={L('Đã hết hạn nhận thêm người', 'No longer accepting members')} tone="warning" shape="tag" /> : null}
            {!inactive ? (
              <View aria-hidden>
                <Motion kind="pop">
                  <Label text={L('Đang gom người 🙌', 'Gathering people 🙌')} color="#22A06B" ink="#FFFFFF" tilt={-4} size={11} />
                </Motion>
              </View>
            ) : null}
          </View>
          <PageStickers scene="shop" compact />
          </View>

          <Text className="mt-2 font-heavy text-pageTitle" style={{ color: tone.ink }}>
            {L(`Mua chung gói ${plan.name} — ${group.target_size} người`, `Group buy: ${plan.name} — ${group.target_size} people`)}
          </Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {L(
              `Giảm ${group.discount_percent}% so với giá niêm yết ${formatVnd(plan.yearlyVnd)}/năm.`,
              `${group.discount_percent}% off the list price of ${formatVnd(plan.yearlyVnd)}/year.`,
            )}
          </Text>

          <View className="mt-3 rounded-card p-3" style={{ backgroundColor: tone.soft }}>
            <Text className="font-sans text-label text-muted">{L('Mỗi người trả', 'Each person pays')}</Text>
            <Text className="mt-0.5 font-heavy text-stat" style={{ color: tone.ink }}>
              {formatVnd(data.priceVnd)}{L('/năm', '/year')}
            </Text>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-4">
            <View>
              <Text className="font-mid text-label text-muted">{L('Đã thanh toán', 'Paid')}</Text>
              <Text className="font-strong text-body text-ink">{data.paidCount}/{group.target_size} {L('người', 'people')}</Text>
            </View>
            {daysLeft !== null ? (
              <View>
                <Text className="font-mid text-label text-muted">{L('Còn nhận người', 'Open for')}</Text>
                <Text className="font-strong text-body text-ink">{L(`${daysLeft} ngày`, `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`)}</Text>
              </View>
            ) : null}
          </View>

          <Button
            className="mt-4 self-start"
            label={
              inactive
                ? L('Nhóm không còn nhận thêm — mua giá niêm yết', 'Group is closed — buy at list price')
                : L('Tham gia — thanh toán ngay', 'Join — pay now')
            }
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
            {L('Bạn tự chuyển khoản QR của riêng mình — không gửi tiền cho trưởng nhóm.', 'You pay with your own QR transfer — never send money to the group leader.')}
          </Text>
        </Card>
      </Appear>

      <Button className="mt-4 self-start" label={L('Tạo nhóm của riêng bạn', 'Start your own group')} variant="ghost" onPress={() => router.push('/group-buy' as never)} />
    </Screen>
  );
}

// ------------------------------------------------------------------- dùng chung

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
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
  const { L } = useL();
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 440 }}>
        <Card className="mt-4">
          <View className="flex-row items-start gap-3">
            <Icon name="lock" size={18} color={color.muted} />
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">{L('Cần đăng nhập', 'Sign in required')}</Text>
              <Text className="mt-1 font-sans text-body text-muted">{body}</Text>
            </View>
          </View>
          <Button className="mt-4 self-start" label={L('Đăng nhập', 'Sign in')} onPress={() => router.push('/auth/sign-in' as never)} />
        </Card>
      </View>
    </Screen>
  );
}
