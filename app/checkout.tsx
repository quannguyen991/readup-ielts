import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';

import { planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { QrCode } from '@/components/payment/QrCode';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Card, Icon } from '@/components/ui';
import { PLANS, formatVnd, type PlanId } from '@/lib/billing/plans';
import { hasBankConfig, publicEnv } from '@/lib/env';
import { bankLabel } from '@/lib/payment/banks';
import { transferDescription } from '@/lib/payment/reference';
import { buildVietQrPayload } from '@/lib/payment/vietqr';
import { buildOrder, type BillingCycle } from '@/services/payment/order';
import { useAuthStore } from '@/store/useAuthStore';
import { color, gradient } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { currentLocale, pick, useL } from '@/i18n/useL';

/**
 * Trang thanh toán: QR chuyển khoản + đối chiếu tay.
 *
 * VÌ SAO KHÔNG PHẢI CỔNG THANH TOÁN TỰ ĐỘNG: VNPay, MoMo, PayOS, Casso đều đòi
 * tài khoản doanh nghiệp và khoá API. Chưa có thì luồng thật là: người dùng
 * chuyển khoản kèm MÃ ĐỐI CHIẾU, chủ app đối chiếu sao kê rồi bấm xác nhận.
 *
 * TRANG NÀY NÓI THẲNG ĐIỀU ĐÓ. Không có thanh tiến trình giả, không có "đang xử
 * lý giao dịch" trong khi thật ra không có gì đang chạy. Người dùng biết mình
 * đang chờ một con người, và biết chờ khoảng bao lâu.
 *
 * Khi nào nối được webhook ngân hàng (Casso/SePay) thì chỉ thêm một route ghi
 * `status = 'paid'`; trang này không phải sửa gì — nó vốn đã hỏi lại trạng thái
 * theo chu kỳ.
 */

type Order = {
  id: string;
  plan: PlanId;
  billing_cycle: BillingCycle;
  amount_vnd: number;
  reference: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
};

/** Hỏi lại trạng thái mỗi ngần này. Đối chiếu tay tính bằng phút, không cần dày hơn. */
const POLL_MS = 15_000;

export default function CheckoutScreen() {
  const { L } = useL();
  const params = useLocalSearchParams<{ plan?: string; cycle?: string; group?: string }>();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const token = session?.access_token ?? null;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  /**
   * Vì sao số tiền là số này — "giữ giá cũ", "giá mua nhóm 5 người", "flash
   * sale"... `null` = giá niêm yết bình thường, không cần giải thích gì thêm.
   */
  const [priceLabel, setPriceLabel] = useState<string | null>(null);

  // Đơn hàng dựng ở CLIENT chỉ để hiện giá trước khi máy chủ trả lời. Số tiền
  // thật luôn là số máy chủ lưu — nếu hai bên lệch thì bên máy chủ đúng.
  const spec = useMemo(() => {
    try {
      return buildOrder(String(params.plan ?? ''), params.cycle ?? 'monthly');
    } catch {
      return null;
    }
  }, [params.cycle, params.plan]);

  const createOrder = useCallback(async () => {
    if (!token || !spec) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: spec.plan,
          cycle: spec.cycle,
          ...(params.group ? { group: params.group } : {}),
        }),
      });
      const body = (await res.json()) as {
        order?: Order;
        error?: string;
        priceSource?: string;
        priceLabel?: string;
      };
      if (!res.ok || !body.order) throw new Error(body.error ?? pick(currentLocale(), `Lỗi ${res.status}`, `Error ${res.status}`));
      setOrder(body.order);
      // 'base' = giá niêm yết bình thường, không cần giải thích gì thêm.
      setPriceLabel(body.priceSource && body.priceSource !== 'base' ? (body.priceLabel ?? null) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(currentLocale(), 'Không tạo được đơn.', "Couldn't create the order."));
    } finally {
      setBusy(false);
    }
  }, [params.group, spec, token]);

  useEffect(() => {
    // Hoãn một nhịp cho khỏi gọi setState ngay trong thân effect. Không phải mẹo
    // tránh lint: gọi thẳng thì lượt render đầu bị đẩy thêm một vòng, mà đây là
    // trang người dùng đang chờ để trả tiền.
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) void createOrder();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [createOrder]);

  /*
    Hỏi lại trạng thái theo chu kỳ.

    Dừng ngay khi đơn không còn `pending` — để chạy tiếp là gửi request vô ích
    mãi mãi cho một tab người dùng quên đóng.
  */
  const orderId = order?.id ?? null;
  const pending = order?.status === 'pending';
  const seenPaid = useRef(false);

  useEffect(() => {
    if (!token || !orderId || !pending) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/payments/order', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await res.json()) as { orders?: Order[] };
        const found = (body.orders ?? []).find((o) => o.id === orderId);
        if (found && found.status !== 'pending') {
          setOrder(found);
          if (found.status === 'paid' && !seenPaid.current) {
            seenPaid.current = true;
            // Gói vừa được bật ở máy chủ — kéo hồ sơ về để giao diện đổi ngay,
            // không bắt người dùng tải lại trang.
            void refreshProfile();
          }
        }
      } catch {
        // Mất mạng giữa chừng thì im lặng bỏ qua lượt này. Trang thanh toán
        // không phải chỗ hiện lỗi mạng của một lời gọi nền.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [orderId, pending, refreshProfile, token]);

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!spec) {
    return (
      <Notice
        icon="info"
        title={L('Không rõ bạn muốn mua gói nào', "We couldn't tell which plan you want")}
        body={L('Đường dẫn thiếu thông tin gói. Quay lại trang giá và chọn lại.', 'The link is missing the plan. Go back to pricing and pick again.')}
        action={{ label: L('Xem bảng giá', 'See pricing'), onPress: () => router.replace('/upgrade' as never) }}
      />
    );
  }

  if (status === 'signed_out') {
    return (
      <Notice
        icon="lock"
        title={L('Đăng nhập trước đã', 'Sign in first')}
        body={L(
          'Đơn hàng phải gắn với một tài khoản, nếu không thì lúc chuyển khoản xong không biết bật gói cho ai.',
          "Orders must be linked to an account — otherwise we won't know whose plan to activate after the transfer.",
        )}
        action={{ label: L('Đăng nhập', 'Sign in'), onPress: () => router.push('/auth/sign-in' as never) }}
      />
    );
  }

  if (!hasBankConfig()) {
    return (
      <Notice
        icon="info"
        title={L('Chưa cấu hình tài khoản nhận tiền', 'Payment account not set up')}
        body={L(
          'Chủ app cần khai EXPO_PUBLIC_BANK_BIN, EXPO_PUBLIC_BANK_ACCOUNT và ' +
            'EXPO_PUBLIC_BANK_ACCOUNT_NAME rồi deploy lại. Trước khi có ba giá trị đó, ' +
            'hiện một mã QR ra đây là chỉ dẫn người dùng chuyển tiền đi đâu không rõ.',
          'The app owner needs to set EXPO_PUBLIC_BANK_BIN, EXPO_PUBLIC_BANK_ACCOUNT and ' +
            'EXPO_PUBLIC_BANK_ACCOUNT_NAME, then redeploy. Until those three are set, ' +
            'showing a QR code here would send your money to an unknown destination.',
        )}
        action={{ label: L('Quay lại bảng giá', 'Back to pricing'), onPress: () => router.replace('/upgrade' as never) }}
      />
    );
  }

  const plan = PLANS[spec.plan];
  const tone = planTone(spec.plan);
  const amount = order?.amount_vnd ?? spec.amountVnd;
  const reference = order?.reference ?? '';
  const description = reference ? transferDescription(reference) : '';

  const qrPayload = reference
    ? buildVietQrPayload({
        bankBin: publicEnv.bankBin,
        accountNumber: publicEnv.bankAccount,
        accountName: publicEnv.bankAccountName || null,
        amountVnd: amount,
        description,
      })
    : '';

  if (order?.status === 'paid') {
    return (
      <Notice
        icon="check"
        tint={color.success}
        title={L(`Đã nhận thanh toán — gói ${plan.name} đang chạy`, `Payment received — ${plan.name} is active`)}
        body={L(
          'Cảm ơn bạn. Gói đã được bật trên tài khoản này và đồng bộ sang mọi máy bạn đăng nhập.',
          "Thank you! Your plan is active on this account and synced to every device you're signed in on.",
        )}
        action={{ label: L('Vào học thôi', "Let's study"), onPress: () => router.replace('/dashboard' as never) }}
      />
    );
  }

  if (order?.status === 'failed') {
    return (
      <Notice
        icon="info"
        tint={color.danger}
        title={L('Đơn này đã bị huỷ', 'This order was cancelled')}
        body={L(
          'Người đối chiếu không tìm thấy khoản chuyển khoản khớp mã. Nếu bạn đã chuyển tiền, hãy giữ ảnh chụp giao dịch và liên hệ lại.',
          "The reviewer couldn't find a transfer matching the code. If you did send money, keep a screenshot of the transaction and contact us.",
        )}
        action={{ label: L('Tạo đơn mới', 'Create a new order'), onPress: () => router.replace('/upgrade' as never) }}
      />
    );
  }

  return (
    <Screen>
      {/*
        SỐ TIỀN LÊN ĐẦU, TO NHẤT.

        Bản trước để nó là dòng thứ tư trong một danh sách năm dòng giống hệt nhau
        — cùng cỡ chữ, cùng nền, cùng nút "Chép". Nhưng đây là trang chuyển tiền:
        câu hỏi đầu tiên trong đầu người mở trang là "bao nhiêu", và họ phải quét
        mắt qua bốn dòng mới tìm ra.
      */}
      <Appear>
        <LinearGradient
          colors={[...gradient.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, padding: 20 }}
        >
          <View className="flex-row flex-wrap items-end justify-between gap-4">
            <View className="min-w-0">
              <Text className="font-strong text-label uppercase text-white/75">
                {PLANS[spec.plan].name} · {spec.cycle === 'yearly' ? L('1 năm', '1 year') : L('1 tháng', '1 month')}
              </Text>
              <Text
                className="font-heavy text-white"
                style={{ fontSize: 46, lineHeight: 54, fontVariant: ['tabular-nums'] }}
              >
                {formatVnd(amount)}
              </Text>
              {priceLabel ? (
                <View className="mt-1 flex-row items-center gap-1.5 self-start rounded-pill bg-white/20 px-3 py-1">
                  <Icon name="sparkle" size={13} color="#FFFFFF" />
                  <Text className="font-strong text-label text-white">{priceLabel}</Text>
                </View>
              ) : null}
            </View>

            {/*
              Mã ĐỐI CHIẾU đứng ngang hàng với số tiền, không chôn trong danh sách.
              Thiếu nó thì tiền đã đi mà không đơn nào khớp được — đây là lỗi tốn thời
              gian nhất của cả luồng, nên nó phải đập vào mắt ngay từ đầu.
            */}
            <View className="rounded-panel bg-white/15 px-4 py-3">
              <Text className="font-strong text-label uppercase text-white/75">{L('Mã đối chiếu', 'Reference code')}</Text>
              <Text
                className="mt-0.5 font-heavy text-white"
                style={{ fontSize: 20, lineHeight: 26, letterSpacing: 1 }}
              >
                {reference || '…'}
              </Text>
            </View>
            <PageStickers scene="shop" compact />
          </View>

          <Text className="mt-4 font-sans text-body text-white/80" style={{ lineHeight: 22 }}>
            {L(
              'Chuyển đúng số tiền và đúng nội dung bên dưới. Gói được bật sau khi đối chiếu — thường trong vài giờ, chậm nhất là sang ngày hôm sau.',
              'Transfer the exact amount with the exact note below. Your plan is activated once we match it — usually within a few hours, by the next day at the latest.',
            )}
          </Text>
        </LinearGradient>
      </Appear>

      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-3">
          <Icon name="info" size={16} color={color.danger} />
          <View className="flex-1">
            <Text className="font-sans text-body text-danger-ink">{error}</Text>
            <Button className="mt-2 self-start" label={L('Thử lại', 'Try again')} variant="outline" size="sm" onPress={() => void createOrder()} />
          </View>
        </View>
      ) : null}

      <View className={wide ? 'mt-4 flex-row gap-4' : 'mt-4 gap-4'}>
        <Appear index={1} style={wide ? { width: 300 } : undefined}>
          <Card>
            <View className="flex-row items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="grid" color="#A8843F" size={36} />
              </View>
              <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Quét mã', 'Scan the code')}</Text>
            </View>
            <Text className="mt-1 font-sans text-label text-muted">
              {L(
                'Mở app ngân hàng → quét QR. Số tiền và nội dung đã nằm sẵn trong mã.',
                'Open your banking app → scan the QR. The amount and note are already in the code.',
              )}
            </Text>
            <View className="mt-3 items-center">
              {busy && !qrPayload ? (
                <View
                  className="items-center justify-center rounded-card bg-surfaceAlt"
                  style={{ width: 236, height: 236 }}
                >
                  <Text className="font-sans text-label text-muted">{L('Đang tạo đơn…', 'Creating order…')}</Text>
                </View>
              ) : qrPayload ? (
                <QrCode value={qrPayload} size={236} />
              ) : null}
            </View>
          </Card>
        </Appear>

        <Appear index={2} style={{ flex: 1 }}>
          <Card>
            <View className="flex-row items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="pencil" color="#B07A3A" size={36} />
              </View>
              <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Hoặc chuyển tay', 'Or transfer manually')}</Text>
            </View>
            <Text className="mt-1 font-sans text-label text-muted">
              {L('Bấm vào từng dòng để sao chép.', 'Tap any line to copy it.')}
            </Text>

            <View className="mt-3 gap-2">
              <CopyRow
                label={L('Ngân hàng', 'Bank')}
                value={bankLabel(publicEnv.bankBin)}
                onCopy={() => void copy('bank', bankLabel(publicEnv.bankBin))}
                copied={copied === 'bank'}
              />
              <CopyRow
                label={L('Số tài khoản', 'Account number')}
                value={publicEnv.bankAccount}
                onCopy={() => void copy('account', publicEnv.bankAccount)}
                copied={copied === 'account'}
              />
              {publicEnv.bankAccountName ? (
                <CopyRow
                  label={L('Chủ tài khoản', 'Account holder')}
                  value={publicEnv.bankAccountName}
                  onCopy={() => void copy('holder', publicEnv.bankAccountName)}
                  copied={copied === 'holder'}
                />
              ) : null}
              <CopyRow
                label={L('Số tiền', 'Amount')}
                value={formatVnd(amount)}
                onCopy={() => void copy('amount', String(amount))}
                copied={copied === 'amount'}
                emphasis={tone.ink}
              />
              <CopyRow
                label={L('Nội dung chuyển khoản', 'Transfer note')}
                value={description || '…'}
                onCopy={() => void copy('description', description)}
                copied={copied === 'description'}
                emphasis={tone.ink}
              />
            </View>

            {/*
              Cảnh báo này đứng ngay dưới ô nội dung chứ không nằm cuối trang.
              Sai nội dung là lỗi tốn thời gian nhất của cả luồng: tiền đã đi,
              không đơn nào khớp, và phải đối chiếu tay bằng ảnh chụp giao dịch.
            */}
            <View className="mt-3 flex-row items-start gap-2 rounded-card bg-warning-soft p-2.5">
              <Icon name="info" size={15} color={color.warning} />
              <Text className="flex-1 font-sans text-label text-ink">
                {L('Giữ nguyên nội dung chuyển khoản. Thiếu mã ', "Keep the transfer note as is. Without the code ")}
                <Text className="font-strong">{reference || '…'}</Text>
                {L(' thì khoản tiền không tự khớp được với tài khoản của bạn.', " the payment can't be matched to your account automatically.")}
              </Text>
            </View>
          </Card>
        </Appear>
      </View>

      <Appear index={3}>
        <Card className="mt-4">
          <View className="flex-row items-start gap-3">
            <View aria-hidden>
              <SealIcon name="clock" color="#F2B632" size={40} />
            </View>
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">{L('Sau khi chuyển thì sao?', 'What happens after I transfer?')}</Text>
              <Text className="mt-1 font-sans text-body text-muted">
                {L(
                  `Trang này tự kiểm lại mỗi ${POLL_MS / 1000} giây, bạn không cần tải lại. Gói bật xong là hiện ngay ở đây và ở mọi máy bạn đăng nhập.`,
                  `This page checks again every ${POLL_MS / 1000} seconds — no need to refresh. Once your plan is on, it shows up here and on every device you're signed in on.`,
                )}
              </Text>
              {/*
                CÂU NÀY TRƯỚC ĐÂY NÓI SAI. Nó bảo "xem lại được ở Cài đặt", nhưng trang
                Cài đặt không hề liệt kê đơn nào — ai đóng trang rồi đi tìm sẽ không thấy gì,
                đúng lúc họ đang lo vì vừa chuyển tiền.

                Cái ĐÚNG là: đơn đang chờ được DÙNG LẠI trong vài giờ
                (`REUSE_WINDOW_HOURS` ở `/api/payments/order`), nên mở lại đúng trang này
                với cùng gói và cùng chu kỳ sẽ ra đúng đơn cũ, đúng mã đối chiếu cũ.
              */}
              <Text className="mt-2 font-sans text-body text-muted">
                {L(
                  'Đóng trang cũng không sao: mở lại trang thanh toán của đúng gói này thì ra lại đúng đơn cũ và đúng mã ',
                  "It's fine to close this page: reopen checkout for the same plan and you'll get the same order and the same code ",
                )}
                <Text className="font-strong text-ink">{reference || '…'}</Text>
                {L(', không sinh mã mới.', ' — no new code is created.')}
              </Text>
              <Text className="mt-2 font-sans text-label text-subtle">
                {L(
                  'Đối chiếu do người thật làm, không phải máy — nên đừng chuyển khoản lần thứ hai nếu chưa thấy đổi ngay.',
                  "Matching is done by a real person, not a machine — so please don't transfer a second time if nothing changes right away.",
                )}
              </Text>
            </View>
          </View>
        </Card>
      </Appear>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button
          label={L('Về bảng giá', 'Back to pricing')}
          variant="outline"
          onPress={() => router.replace('/upgrade' as never)}
        />
        <Button
          label={L('Học tiếp trong lúc chờ', 'Keep studying while you wait')}
          variant="ghost"
          onPress={() => router.replace('/dashboard' as never)}
        />
      </View>
    </Screen>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  emphasis,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  emphasis?: string;
}) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={L(`Sao chép ${label}`, `Copy ${label}`)}
      onPress={onCopy}
      className="flex-row items-center justify-between gap-3 rounded-card border border-border bg-surfaceAlt px-3 py-2.5"
    >
      <View className="min-w-0 flex-1">
        <Text className="font-mid text-label text-muted">{label}</Text>
        <Text
          className="mt-0.5 font-strong text-body"
          style={{ color: emphasis ?? color.ink }}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Icon name={copied ? 'check' : 'list'} size={15} color={copied ? color.success : color.subtle} />
        <Text
          className="font-mid text-label"
          style={{ color: copied ? color.success : color.subtle }}
        >
          {copied ? L('Đã chép', 'Copied') : L('Chép', 'Copy')}
        </Text>
      </View>
    </Pressable>
  );
}

function Notice({
  icon,
  tint,
  title,
  body,
  action,
}: {
  icon: 'info' | 'lock' | 'check';
  tint?: string;
  title: string;
  body: string;
  action: { label: string; onPress: () => void };
}) {
  const { L } = useL();
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 460 }}>
        <Card>
          {icon === 'check' ? (
            <View aria-hidden className="mb-3 flex-row items-end gap-2">
              <Motion kind="float">
                <Sticker tilt={-8}>
                  <CuteTrophy size={64} />
                </Sticker>
              </Motion>
              <Motion kind="pop" delay={0.2}>
                <Label text={L('Xong rồi! 🎉', 'All done! 🎉')} color="#22A06B" ink="#FFFFFF" tilt={-5} size={13} />
              </Motion>
            </View>
          ) : null}
          <View className="flex-row items-start gap-3">
            <View aria-hidden>
              <SealIcon name={icon} color={tint ?? '#64748B'} size={40} />
            </View>
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">{title}</Text>
              <Text className="mt-1 font-sans text-body text-muted">{body}</Text>
            </View>
          </View>
          <Button className="mt-4 self-start" label={action.label} onPress={action.onPress} />
        </Card>
      </View>
    </Screen>
  );
}
