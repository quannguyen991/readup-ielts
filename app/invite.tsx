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

/**
 * Mời bạn bè, hai mốc: đủ 15 lượt hợp lệ → 3 tháng Pro; từ 30 lượt → 3 tháng Max.
 *
 * ĐIỀU KIỆN ĐƯỢC NÓI NGAY Ở TRÊN, không giấu xuống dòng chữ nhỏ cuối trang.
 * Người dùng mời mười người rồi mới biết "hợp lệ" nghĩa là gì thì họ có lý do
 * chính đáng để nghĩ mình bị lừa — và một cơ chế giới thiệu mất niềm tin thì
 * không ai dùng nữa.
 */
export default function InviteScreen() {
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
      if (!res.ok || !body) throw new Error(body?.error ?? `Lỗi ${res.status}`);
      setData(body);
      // Phần thưởng vừa được kích hoạt ở máy chủ — kéo hồ sơ về để huy hiệu gói
      // trên sidebar đổi ngay, không bắt người dùng tải lại trang.
      if (body.justApplied > 0) void refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin mời.');
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
                <Text className="font-strong text-cardTitle text-ink">Cần đăng nhập</Text>
                <Text className="mt-1 font-sans text-body text-muted">
                  Mã mời gắn với tài khoản, nên phải đăng nhập thì mới cấp được — và mới biết cộng
                  lượt cho ai.
                </Text>
              </View>
            </View>
            <Button
              className="mt-4 self-start"
              label="Đăng nhập"
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
              <Label text="Rủ bạn, nhận quà 🎁" color="#F2B632" ink="#2A1B02" tilt={-4} size={12} />
            </Motion>
          </View>
          <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
            Mời {REFERRALS_PER_REWARD} người học → {REWARD_MONTHS} tháng {PLANS[REWARD_PLAN].name}
          </Text>
          </View>
          <PageStickers scene="shop" compact />
          </View>
          <Text className="mt-2 font-sans text-body text-white/90" style={{ maxWidth: 560 }}>
            Đủ {MAX_TIER_REFERRALS} lượt thì phần thưởng nâng lên gói{' '}
            {PLANS[MAX_REWARD_PLAN].name} — kể cả những tháng đang treo cũng được bật ở mức đó.
          </Text>
          <Text className="mt-1.5 font-sans text-label text-white/75" style={{ maxWidth: 560 }}>
            Không giới hạn số lần: cứ đủ thêm {REFERRALS_PER_REWARD} lượt là thêm{' '}
            {REWARD_MONTHS} tháng nữa.
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
              label="Thử lại"
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
            Vừa cộng {data.justApplied} tháng gói {PLANS[REWARD_PLAN].name} cho bạn. Cảm ơn!
          </Text>
        </View>
      ) : null}

      {data && data.creditMonths > 0 ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-warning-soft p-3">
          <Icon name="clock" size={16} color={color.warning} />
          <Text className="flex-1 font-sans text-body text-ink">
            Bạn đang dùng gói cao hơn {PLANS[REWARD_PLAN].name}, nên {data.creditMonths} tháng phần
            thưởng đang được giữ lại — chúng tự bật khi gói hiện tại hết hạn. Không mất đi đâu cả.
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
              <Text className="font-mid text-label text-muted">Lượt mời hợp lệ</Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-heavy text-ink" style={{ fontSize: 34 }}>
                  {loading && !data ? '—' : qualified}
                </Text>
                <Text className="font-sans text-body text-muted">
                  / {REFERRALS_PER_REWARD} tới mốc tiếp theo
                </Text>
              </View>
            </View>
            </View>
            {invited > qualified ? (
              <Text className="font-sans text-label text-subtle">
                {invited - qualified} người đã vào nhưng chưa học bài nào
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
              ? `Còn ${REFERRALS_PER_REWARD} lượt nữa là tới mốc đầu tiên.`
              : `Còn ${remaining} lượt nữa.`}
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
            <Text className="font-strong text-cardTitle text-ink">Mã mời của bạn</Text>
            <View aria-hidden>
              <Label text="Của riêng bạn ✨" color="#B07A3A" ink="#FFFFFF" tilt={4} size={11} />
            </View>
          </View>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-card px-4 py-3" style={{ backgroundColor: tone.soft }}>
              <Text className="font-heavy" style={{ fontSize: 24, letterSpacing: 3, color: tone.ink }}>
                {code || '……'}
              </Text>
            </View>
            <Button
              label={copied === 'link' ? 'Đã chép link' : 'Chép link mời'}
              iconLeft={copied === 'link' ? 'check' : 'list'}
              disabled={!link}
              onPress={() => void copy('link', link)}
            />
            <Button
              label="Chia sẻ"
              variant="outline"
              disabled={!link}
              onPress={() =>
                void Share.share({
                  message: `Mình đang luyện IELTS và SAT Math trên Band 9, thấy ổn nên rủ bạn. Vào bằng link này nhé: ${link}`,
                })
              }
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void copy('link2', link)}
            className="mt-3 rounded-card border border-border bg-surfaceAlt px-3 py-2.5"
          >
            <Text className="font-mid text-label text-muted">Liên kết</Text>
            <Text className="mt-0.5 font-sans text-body text-ink" numberOfLines={1}>
              {link || 'Đang lấy mã…'}
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
            <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">Lượt nào được tính</Text>
          </View>
          <View className="mt-2 gap-2">
            <Rule
              ok
              text={`Người bạn mời mở link, tạo tài khoản, rồi LÀM XONG ÍT NHẤT MỘT BÀI — đọc, viết hoặc SAT Math đều được.`}
            />
            <Rule
              ok={false}
              text="Chỉ tạo tài khoản rồi bỏ đó thì chưa tính. Bạn vẫn thấy họ trong danh sách, ở trạng thái chờ."
            />
            <Rule
              ok={false}
              text="Mỗi người chỉ được tính cho đúng một người giới thiệu, và chỉ khai được trong 30 ngày đầu."
            />
          </View>
          <Text className="mt-3 font-sans text-label text-subtle">
            Điều kiện “phải học thật” không phải để làm khó bạn — nó để phần thưởng đi tới người
            thật sự rủ được bạn bè vào học, chứ không phải người tạo được mười email.
          </Text>
        </Card>
      </Appear>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Tải lại tiến độ" variant="outline" iconLeft="refresh" onPress={() => void load()} />
        <Button label="Xem các gói" variant="ghost" onPress={() => router.push('/upgrade' as never)} />
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
