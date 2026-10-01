import React, { useCallback, useEffect, useState } from 'react';
import { SITE_ORIGIN } from '@/lib/site';
import { Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Card, Icon } from '@/components/ui';
import { PLANS } from '@/lib/billing/plans';
import {
  MAX_REWARD_PLAN,
  MAX_TIER_REFERRALS,
  REFERRALS_PER_REWARD,
  REWARD_MONTHS,
  REWARD_PLAN,
  toNextReward,
} from '@/services/referral/rewards';
import { useAuthStore } from '@/store/useAuthStore';
import { color, gradient } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge } from '@/components/illust/Cute';
import { CuteChat, Motion } from '@/components/illust/CuteMore';
import { currentLocale, pick, useL } from '@/i18n/useL';

/**
 * Mời bạn bè, hai mốc: đủ 15 lượt hợp lệ → 3 tháng Pro; từ 30 lượt → 3 tháng Max.
 *
 * ĐIỀU KIỆN ĐƯỢC NÓI NGAY Ở TRÊN, không giấu xuống dòng chữ nhỏ cuối trang.
 * Người dùng mời mười người rồi mới biết "hợp lệ" nghĩa là gì thì họ có lý do
 * chính đáng để nghĩ mình bị lừa — và một cơ chế giới thiệu mất niềm tin thì
 * không ai dùng nữa.
 */
export default function InviteScreen() {
  const { L } = useL();
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const token = session?.access_token ?? null;

  const [data, setData] = useState<{
    code: string;
    invited: number;
    qualified: number;
    creditMonths: number;
    justApplied: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
      const body = (await res.json()) as typeof data & { error?: string };
      if (!res.ok || !body) throw new Error(body?.error ?? pick(currentLocale(), `Lỗi ${res.status}`, `Error ${res.status}`));
      setData(body);
      // Phần thưởng vừa được kích hoạt ở máy chủ — kéo hồ sơ về để huy hiệu gói
      // trên sidebar đổi ngay, không bắt người dùng tải lại trang.
      if (body.justApplied > 0) void refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(currentLocale(), 'Không tải được thông tin mời.', "Couldn't load your invite info."));
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, token]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) void load();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  if (status === 'signed_out') {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 440 }}>
          <Card>
            <View aria-hidden className="mb-3 self-start">
              <Motion kind="float">
                <Sticker tilt={-8}>
                  <CuteChat size={60} />
                </Sticker>
              </Motion>
            </View>
            <View className="flex-row items-start gap-3">
              <Icon name="lock" size={18} color={color.muted} />
              <View className="flex-1">
                <Text className="font-strong text-cardTitle text-ink">{L('Cần đăng nhập', 'Sign in required')}</Text>
                <Text className="mt-1 font-sans text-body text-muted">
                  {L('Đăng nhập để lấy mã mời.', 'Sign in to get your invite code.')}
                </Text>
              </View>
            </View>
            <Button
              className="mt-4 self-start"
              label={L('Đăng nhập', 'Sign in')}
              onPress={() => router.push('/auth/sign-in' as never)}
            />
          </Card>
        </View>
      </Screen>
    );
  }

  const code = data?.code ?? '';
  const link = code ? `${SITE_ORIGIN}/intro?ref=${code}` : '';
  const qualified = data?.qualified ?? 0;
  const invited = data?.invited ?? 0;
  const remaining = toNextReward(qualified);
  const tone = planTone(REWARD_PLAN);

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

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
              <Label text={L('Rủ bạn, nhận quà 🎁', 'Invite friends, get rewards 🎁')} color="#F2B632" ink="#2A1B02" tilt={-4} size={12} />
            </Motion>
          </View>
          <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
            {L(
              `Mời ${REFERRALS_PER_REWARD} người học → ${REWARD_MONTHS} tháng ${PLANS[REWARD_PLAN].name}`,
              `Invite ${REFERRALS_PER_REWARD} learners → ${REWARD_MONTHS} months of ${PLANS[REWARD_PLAN].name}`,
            )}
          </Text>
          </View>
          <PageStickers scene="shop" compact />
          </View>
          <Text className="mt-2 font-sans text-body text-white/90" style={{ maxWidth: 560 }}>
            {L(
              `Đủ ${MAX_TIER_REFERRALS} lượt thì phần thưởng nâng lên gói ${PLANS[MAX_REWARD_PLAN].name} — kể cả những tháng đang treo cũng được bật ở mức đó.`,
              `Reach ${MAX_TIER_REFERRALS} and the reward upgrades to ${PLANS[MAX_REWARD_PLAN].name} — including any months still on hold.`,
            )}
          </Text>
          <Text className="mt-1.5 font-sans text-label text-white/75" style={{ maxWidth: 560 }}>
            {L(
              `Không giới hạn số lần: cứ đủ thêm ${REFERRALS_PER_REWARD} lượt là thêm ${REWARD_MONTHS} tháng nữa.`,
              `No limit: every ${REFERRALS_PER_REWARD} more adds another ${REWARD_MONTHS} months.`,
            )}
          </Text>
        </LinearGradient>
      </Appear>

      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-3">
          <Icon name="info" size={16} color={color.danger} />
          <View className="flex-1">
            <Text className="font-sans text-body text-danger-ink">{error}</Text>
            <Button
              className="mt-2 self-start"
              label={L('Thử lại', 'Try again')}
              variant="outline"
              size="sm"
              onPress={() => void load()}
            />
          </View>
        </View>
      ) : null}

      {data?.justApplied ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <View aria-hidden>
            <Motion kind="pop">
              <Badge icon="star" color="#22A06B" size={26} />
            </Motion>
          </View>
          <Text className="flex-1 font-sans text-body text-ink">
            {L(
              `Vừa cộng ${data.justApplied} tháng gói ${PLANS[REWARD_PLAN].name} cho bạn. Cảm ơn!`,
              `We just added ${data.justApplied} months of ${PLANS[REWARD_PLAN].name} to your account. Thank you!`,
            )}
          </Text>
        </View>
      ) : null}

      {data && data.creditMonths > 0 ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-warning-soft p-3">
          <Icon name="clock" size={16} color={color.warning} />
          <Text className="flex-1 font-sans text-body text-ink">
            {L(
              `Bạn đang dùng gói cao hơn ${PLANS[REWARD_PLAN].name}, nên ${data.creditMonths} tháng phần thưởng đang được giữ lại — chúng tự bật khi gói hiện tại hết hạn. Không mất đi đâu cả.`,
              `You're on a plan above ${PLANS[REWARD_PLAN].name}, so ${data.creditMonths} reward months are on hold — they switch on when your current plan ends. Nothing is lost.`,
            )}
          </Text>
        </View>
      ) : null}

      {/* ------------------------------------------------------ tiến độ */}
      <Appear index={1}>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-end justify-between gap-2">
            <View className="flex-row items-center gap-3">
            <View aria-hidden>
              <SealIcon name="trophy" color="#F2B632" size={44} />
            </View>
            <View>
              <Text className="font-mid text-label text-muted">{L('Lượt mời hợp lệ', 'Qualified invites')}</Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-heavy text-ink" style={{ fontSize: 34 }}>
                  {loading && !data ? '—' : qualified}
                </Text>
                <Text className="font-sans text-body text-muted">
                  {L(`/ ${REFERRALS_PER_REWARD} tới mốc tiếp theo`, `/ ${REFERRALS_PER_REWARD} to the next reward`)}
                </Text>
              </View>
            </View>
            </View>
            {invited > qualified ? (
              <Text className="font-sans text-label text-subtle">
                {L(
                  `${invited - qualified} người đã vào nhưng chưa học bài nào`,
                  `${invited - qualified} joined but haven't finished a lesson yet`,
                )}
              </Text>
            ) : null}
          </View>

          {/* Ô vuông từng lượt thay vì thanh phần trăm: mốc là MƯỜI người cụ thể,
              và đếm được bằng mắt thì cảm giác gần đích rõ hơn nhiều. */}
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {Array.from({ length: REFERRALS_PER_REWARD }).map((_, i) => {
              const done = i < qualified % REFERRALS_PER_REWARD || (qualified > 0 && qualified % REFERRALS_PER_REWARD === 0);
              return (
                <View
                  key={i}
                  className="h-8 flex-1 rounded-card border"
                  style={{
                    minWidth: 24,
                    backgroundColor: done ? tone.solid : color.surfaceAlt,
                    borderColor: done ? tone.solid : color.border,
                  }}
                />
              );
            })}
          </View>

          <Text className="mt-2 font-sans text-label text-muted">
            {qualified === 0
              ? L(`Còn ${REFERRALS_PER_REWARD} lượt nữa là tới mốc đầu tiên.`, `${REFERRALS_PER_REWARD} more to your first reward.`)
              : L(`Còn ${remaining} lượt nữa.`, `${remaining} more to go.`)}
          </Text>
        </Card>
      </Appear>

      {/* -------------------------------------------------- mã và liên kết */}
      <Appear index={2}>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="gift" color="#F472B6" size={38} />
            </View>
            <Text className="font-strong text-cardTitle text-ink">{L('Mã mời của bạn', 'Your invite code')}</Text>
            <View aria-hidden>
              <Label text={L('Của riêng bạn ✨', 'All yours ✨')} color="#B07A3A" ink="#FFFFFF" tilt={4} size={11} />
            </View>
          </View>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-card px-4 py-3" style={{ backgroundColor: tone.soft }}>
              <Text className="font-heavy" style={{ fontSize: 24, letterSpacing: 3, color: tone.ink }}>
                {code || '……'}
              </Text>
            </View>
            <Button
              label={copied === 'link' ? L('Đã chép link', 'Link copied') : L('Chép link mời', 'Copy invite link')}
              iconLeft={copied === 'link' ? 'check' : 'list'}
              disabled={!link}
              onPress={() => void copy('link', link)}
            />
            <Button
              label={L('Chia sẻ', 'Share')}
              variant="outline"
              disabled={!link}
              onPress={() =>
                void Share.share({
                  message: L(
                    `Mình đang luyện IELTS và SAT Math trên Band 9, thấy ổn nên rủ bạn. Vào bằng link này nhé: ${link}`,
                    `I'm prepping for IELTS and SAT Math on Band 9 and it's been great — join me with this link: ${link}`,
                  ),
                })
              }
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void copy('link2', link)}
            className="mt-3 rounded-card border border-border bg-surfaceAlt px-3 py-2.5"
          >
            <Text className="font-mid text-label text-muted">{L('Liên kết', 'Link')}</Text>
            <Text className="mt-0.5 font-sans text-body text-ink" numberOfLines={1}>
              {link || L('Đang lấy mã…', 'Getting your code…')}
            </Text>
          </Pressable>
        </Card>
      </Appear>

      {/* --------------------------------------------- điều kiện, nói thẳng */}
      <Appear index={3}>
        <Card className="mt-4">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="shield" color="#22A06B" size={38} />
            </View>
            <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Lượt nào được tính', 'What counts')}</Text>
          </View>
          <View className="mt-2 gap-2">
            <Rule
              ok
              text={L('Bạn được mời phải tạo tài khoản và làm xong ít nhất một bài.', 'Your friend signs up and finishes at least one lesson.')}
            />
            <Rule
              ok={false}
              text={L('Chưa học bài nào thì chưa tính.', 'No lesson yet means it doesn\'t count yet.')}
            />
            <Rule
              ok={false}
              text={L('Mỗi người chỉ tính cho một người mời, trong 30 ngày đầu.', 'One referrer per person, within the first 30 days.')}
            />
          </View>
          <Text className="mt-3 font-sans text-label text-subtle">
            {L('Phải học thật để thưởng đến đúng người.', 'Real study keeps rewards fair.')}
          </Text>
        </Card>
      </Appear>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label={L('Tải lại tiến độ', 'Refresh progress')} variant="outline" iconLeft="refresh" onPress={() => void load()} />
        <Button label={L('Xem các gói', 'See plans')} variant="ghost" onPress={() => router.push('/upgrade' as never)} />
      </View>
    </Screen>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Icon name={ok ? 'check' : 'close'} size={15} color={ok ? color.success : color.subtle} />
      <Text className="flex-1 font-sans text-body text-body">{text}</Text>
    </View>
  );
}
