import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { PlanBadge, planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { PLANS, PLAN_ORDER, formatVnd, type PlanId } from '@/lib/billing/plans';
import { currentLocale, pick, useL, type Bi, bi } from '@/i18n/useL';
import type { Locale } from '@/i18n/keys';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { type UserActivity } from '@/services/admin/activity';
import { BarChart } from '@/components/charts';
import type { TrafficSummary } from '@/services/analytics/traffic';

/**
 * Trang quản trị: xem người dùng và CẤP GÓI BẰNG TAY.
 *
 * VÌ SAO TỒN TẠI: chưa có cổng thanh toán. Quy trình thật hiện nay là người
 * dùng chuyển khoản, chủ app đối chiếu rồi bật gói cho họ. Không có trang này
 * thì thao tác đó phải làm bằng SQL trong dashboard Supabase — chậm, dễ gõ nhầm
 * `user_id`, và không để lại dấu vết gì.
 *
 * MÀN NÀY KHÔNG PHẢI HÀNG RÀO BẢO MẬT. Nó chỉ ẩn/hiện nút. Quyền thật nằm ở
 * `src/services/admin/guard.ts`: mọi route đều tự đọc vai trò từ database bằng
 * service key. Người sửa JavaScript trong trình duyệt để mở được màn này vẫn
 * nhận 403 ở mọi lời gọi.
 */

/** Câu cho code ngoài lượt vẽ (xử lý sự kiện, gọi API): đọc ngôn ngữ lúc chạy. */
const tr = (vi: string, en: string): string => pick(currentLocale(), vi, en);

type AdminUser = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  displayName: string | null;
  plan: PlanId;
  planExpiresAt: string | null;
  role: 'user' | 'admin';
  missingProfile: boolean;
};

export default function AdminScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const { L } = useL();

  const [tab, setTab] = useState<'users' | 'payments' | 'groups'>('payments');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const token = session?.access_token ?? null;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { users?: AdminUser[]; total?: number; error?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setUsers(body.users ?? []);
      setTotal(body.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không tải được danh sách.', 'Could not load the list.'));
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  /*
    Chờ 250ms sau phím cuối rồi mới gọi.

    Không có nó thì gõ "nguyen" bắn sáu lời gọi, và lời gọi của lần gõ trước có
    thể về SAU lần gõ sau rồi đè lên — danh sách hiện kết quả của một chuỗi tìm
    kiếm không còn nằm trong ô nữa. `cancelled` chặn nốt phần đè đó.
  */
  useEffect(() => {
    if (tab !== 'users') return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) void load();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load, tab]);

  const setPlan = async (user: AdminUser, plan: PlanId, months: number | null) => {
    if (!token) return;
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan, months }),
      });
      const body = (await res.json()) as { error?: string; auditWarning?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setBanner(
        `${user.email ?? user.id} → ${PLANS[plan].name}` +
          (months
            ? tr(` (${months} tháng)`, ` (${months} ${months === 1 ? 'month' : 'months'})`)
            : tr(' (không hết hạn)', ' (no expiry)')) +
          (body.auditWarning ? tr(` · ⚠ nhật ký không ghi được: ${body.auditWarning}`, ` · ⚠ audit log not written: ${body.auditWarning}`) : ''),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không đổi được gói.', 'Could not change the plan.'));
    }
  };

  /** Tặng sao: một người (`user`) hoặc tất cả (`user = null`). */
  const giftStars = async (user: AdminUser | null, stars: number) => {
    if (!token) return;
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/stars', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(user ? { userId: user.id, stars } : { all: true, stars }),
      });
      const body = (await res.json()) as { error?: string; recipients?: number; auditWarning?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setBanner(
        (user
          ? tr(
              `Đã tặng ${stars.toLocaleString('vi-VN')} ⭐ cho ${user.email ?? user.id}`,
              `Gifted ${stars.toLocaleString('en-US')} ⭐ to ${user.email ?? user.id}`,
            )
          : tr(
              `Đã tặng ${stars.toLocaleString('vi-VN')} ⭐ cho ${body.recipients ?? 0} tài khoản`,
              `Gifted ${stars.toLocaleString('en-US')} ⭐ to ${body.recipients ?? 0} accounts`,
            )) +
          tr(
            ' — người nhận thấy sao ở lần đồng bộ kế tiếp (mở app / tải lại trang).',
            ' — recipients see the stars on their next sync (open the app / reload the page).',
          ) +
          (body.auditWarning ? tr(` · ⚠ nhật ký không ghi được: ${body.auditWarning}`, ` · ⚠ audit log not written: ${body.auditWarning}`) : ''),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không tặng được sao.', 'Could not gift stars.'));
    }
  };

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const u of users) out[u.plan] = (out[u.plan] ?? 0) + 1;
    return out;
  }, [users]);

  if (status === 'signed_out') return <Blocked reason={L('Cần đăng nhập trước.', 'Please sign in first.')} />;
  if (profile && profile.role !== 'admin') {
    return <Blocked reason={L('Tài khoản này không có quyền quản trị.', 'This account does not have admin access.')} />;
  }

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1" style={{ minWidth: 240 }}>
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-pageTitle text-ink">{L('Quản trị', 'Admin')}</Text>
              <Badge label="ADMIN" tone="accent" shape="tag" uppercase />
            </View>
            <Text className="mt-1 font-sans text-body text-muted">
              {L(
                'Cấp gói bằng tay sau khi đối chiếu chuyển khoản. Mọi thay đổi đều được ghi nhật ký kèm giá trị trước và sau.',
                'Grant plans manually after matching bank transfers. Every change is logged with before and after values.',
              )}
            </Text>
          </View>
          <Button label={L('Tải lại', 'Reload')} variant="outline" iconLeft="refresh" onPress={() => void load()} />
        </View>
      </Appear>

      <Appear index={1}>
        <StatsPanel token={token} />
      </Appear>

      <Appear index={1}>
        <TrafficPanel token={token} />
      </Appear>

      <Appear index={1}>
        {/* Đối chiếu thanh toán đứng TRƯỚC vì đó là việc phải làm hằng ngày;
            danh sách người dùng chỉ tra khi cần. */}
        <View className="mt-4 flex-row gap-2">
          <TabPill label={L('Đối chiếu thanh toán', 'Payment matching')} active={tab === 'payments'} onPress={() => setTab('payments')} />
          <TabPill label={L('Nhóm mua chung', 'Group buys')} active={tab === 'groups'} onPress={() => setTab('groups')} />
          <TabPill label={L('Người dùng & gói', 'Users & plans')} active={tab === 'users'} onPress={() => setTab('users')} />
        </View>
      </Appear>

      {tab === 'payments' ? (
        <Appear>
          <PaymentsPanel token={token} onDone={() => void load()} />
        </Appear>
      ) : null}
      {tab === 'groups' ? (
        <Appear>
          <GroupsPanel token={token} />
        </Appear>
      ) : null}

      {tab === 'users' ? (
      <Appear index={2}>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Stat label={L('tài khoản', 'accounts')} value={String(total)} />
          {PLAN_ORDER.map((id) => (
            <Stat key={id} label={PLANS[id].name} value={String(counts[id] ?? 0)} tint={planTone(id).solid} />
          ))}
        </View>
      </Appear>
      ) : null}

      {tab === 'users' ? (
        <Appear index={2}>
          <GiftAllCard total={total} onGift={(n) => void giftStars(null, n)} />
        </Appear>
      ) : null}

      {tab === 'users' ? (
      <Appear index={3}>
        <View className="mt-4 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-card border border-borderStrong bg-surface px-3">
            <Icon name="search" size={16} color={color.subtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={L('Tìm theo email', 'Search by email')}
              placeholderTextColor={color.subtle}
              autoCapitalize="none"
              className="flex-1 py-2.5 font-sans text-body text-ink"
            />
          </View>
        </View>
      </Appear>
      ) : null}

      {banner ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <Icon name="check" size={16} color={color.success} />
          <Text className="flex-1 font-sans text-body text-ink">{banner}</Text>
        </View>
      ) : null}

      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-3">
          <Icon name="info" size={16} color={color.danger} />
          <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
        </View>
      ) : null}

      {tab === 'users' ? (
      <View className="mt-4 gap-3">
        {loading && users.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">{L('Đang tải…', 'Loading…')}</Text>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {query ? L('Không có tài khoản nào khớp.', 'No matching accounts.') : L('Chưa có tài khoản nào.', 'No accounts yet.')}
            </Text>
          </Card>
        ) : (
          users.map((user, index) => (
            <Appear key={user.id} index={index + 4}>
              <UserRow user={user} token={token} onSetPlan={setPlan} onGift={(u, n) => void giftStars(u, n)} />
            </Appear>
          ))
        )}
      </View>
      ) : null}
    </Screen>
  );
}

// ------------------------------------------------------- đối chiếu thanh toán

type AdminPayment = {
  id: string;
  user_id: string;
  email: string | null;
  plan: PlanId;
  amount_vnd: number;
  billing_cycle: 'monthly' | 'yearly';
  months: number | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  reference: string | null;
  admin_note: string | null;
  created_at: string;
  paid_at: string | null;
};

/**
 * Danh sách đơn chờ đối chiếu.
 *
 * Quy trình thật: mở app ngân hàng, tìm khoản tiền có MÃ ĐỐI CHIẾU trong nội
 * dung, so số tiền, rồi bấm xác nhận. Mã dán được ngay từ đây để tìm trong sao kê.
 *
 * KHÔNG có nút "xác nhận tất cả". Mỗi đơn là một khoản tiền thật, và một nút gộp
 * là cách nhanh nhất để một buổi chiều lơ đãng cấp gói cho cả những người chưa
 * chuyển đồng nào.
 */
function PaymentsPanel({ token, onDone }: { token: string | null; onDone: () => void }) {
  const { L } = useL();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [status, setStatus] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { payments?: AdminPayment[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setItems(body.payments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không tải được danh sách đơn.', 'Could not load payments.'));
    } finally {
      setLoading(false);
    }
  }, [status, token]);

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

  const act = async (item: AdminPayment, action: 'confirm' | 'reject') => {
    if (!token) return;
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: item.id, action }),
      });
      const body = (await res.json()) as { error?: string; plan?: string; expiresAt?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setBanner(
        action === 'confirm'
          ? tr(
              `Đã bật gói ${PLANS[item.plan].name} cho ${item.email ?? item.user_id}`,
              `Enabled ${PLANS[item.plan].name} for ${item.email ?? item.user_id}`,
            ) + (body.expiresAt ? tr(` tới ${formatDate(body.expiresAt, 'vi')}`, ` until ${formatDate(body.expiresAt, 'en')}`) : '')
          : tr(`Đã huỷ đơn ${item.reference ?? item.id}`, `Cancelled payment ${item.reference ?? item.id}`),
      );
      await load();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không xử lý được đơn.', 'Could not process the payment.'));
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <View className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row gap-2">
          <TabPill label={`${L('Đang chờ', 'Pending')}${status === 'pending' ? ` (${pendingCount})` : ''}`} active={status === 'pending'} onPress={() => setStatus('pending')} small />
          <TabPill label={L('Tất cả', 'All')} active={status === 'all'} onPress={() => setStatus('all')} small />
        </View>
        <Button label={L('Tải lại', 'Reload')} variant="outline" size="sm" iconLeft="refresh" onPress={() => void load()} />
      </View>

      {banner ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <Icon name="check" size={16} color={color.success} />
          <Text className="flex-1 font-sans text-body text-ink">{banner}</Text>
        </View>
      ) : null}
      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-3">
          <Icon name="info" size={16} color={color.danger} />
          <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
        </View>
      ) : null}

      <View className="mt-3 gap-3">
        {loading && items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">{L('Đang tải…', 'Loading…')}</Text>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {status === 'pending'
                ? L('Không có đơn nào đang chờ. Sạch sẽ.', 'No pending payments. All clear.')
                : L('Chưa có đơn thanh toán nào.', 'No payments yet.')}
            </Text>
          </Card>
        ) : (
          items.map((item, index) => (
            <Appear key={item.id} index={index}>
              <PaymentRow item={item} onAct={act} />
            </Appear>
          ))
        )}
      </View>
    </View>
  );
}

function PaymentRow({
  item,
  onAct,
}: {
  item: AdminPayment;
  onAct: (item: AdminPayment, action: 'confirm' | 'reject') => void;
}) {
  const { L, locale } = useL();
  const tone = planTone(item.plan);
  const STATUS_LABEL: Record<AdminPayment['status'], { text: string; tone: string }> = {
    pending: { text: L('đang chờ', 'pending'), tone: color.warning },
    paid: { text: L('đã thanh toán', 'paid'), tone: color.success },
    failed: { text: L('đã huỷ', 'cancelled'), tone: color.danger },
    refunded: { text: L('đã hoàn tiền', 'refunded'), tone: color.subtle },
  };
  const label = STATUS_LABEL[item.status];

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <PlanBadge plan={item.plan} />
            <Text className="font-heavy text-cardTitle" style={{ color: tone.ink }}>
              {formatVnd(item.amount_vnd)}
            </Text>
            <Text className="font-sans text-label text-muted">
              {item.billing_cycle === 'yearly' ? L('1 năm', '1 year') : L('1 tháng', '1 month')}
            </Text>
            <Text className="font-mid text-label" style={{ color: label.tone }}>
              · {label.text}
            </Text>
          </View>

          <Text className="mt-1 font-strong text-body text-ink" numberOfLines={1}>
            {item.email ?? item.user_id}
          </Text>

          {/*
            Mã đối chiếu để cỡ lớn và tách riêng: đây là thứ người đối chiếu phải
            tìm trong sao kê ngân hàng, và tìm bằng mắt trên một danh sách dài.
          */}
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-card bg-canvas px-2.5 py-1.5">
              <Text className="font-heavy text-body text-ink" style={{ letterSpacing: 1 }}>
                {item.reference ?? L('(không có mã)', '(no reference)')}
              </Text>
            </View>
            <Text className="font-sans text-label text-subtle">
              {L('tạo', 'created')} {formatDate(item.created_at, locale)}
              {item.paid_at ? ` · ${L('xác nhận', 'confirmed')} ${formatDate(item.paid_at, locale)}` : ''}
            </Text>
          </View>

          {item.admin_note ? (
            <Text className="mt-1 font-sans text-label text-muted">{L('Ghi chú', 'Note')}: {item.admin_note}</Text>
          ) : null}
        </View>

        {item.status === 'pending' ? (
          <View className="flex-row items-center gap-2">
            <Button label={L('Huỷ đơn', 'Cancel payment')} variant="outline" size="sm" onPress={() => onAct(item, 'reject')} />
            <Button label={L('Đã nhận tiền', 'Payment received')} size="sm" iconRight="check" onPress={() => onAct(item, 'confirm')} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------- nhóm mua chung

type AdminGroup = {
  id: string;
  leader_id: string;
  leaderEmail: string | null;
  plan: PlanId;
  target_size: number;
  discount_percent: number;
  code: string;
  status: 'collecting' | 'settled' | 'expired';
  created_at: string;
  settle_by: string;
  settled_size: number | null;
  settled_at: string | null;
  paidCount: number;
  pastDeadline: boolean;
};

/**
 * Danh sách nhóm mua chung cần để ý: nhóm đang mở, hoặc mọi trạng thái.
 *
 * CHỐT NHÓM ở đây chỉ ghi lại số người đã trả — không tự bù ngày cho nhóm
 * thiếu người. Nhóm quá hạn mà chưa đủ người thì admin đọc `paidCount` rồi tự
 * quyết định bù bằng `/api/admin/plan` (tab "Người dùng & gói"), đúng như đã
 * ghi trong `app/api/admin/payment-groups+api.ts`.
 */
function GroupsPanel({ token }: { token: string | null }) {
  const { L } = useL();
  const [items, setItems] = useState<AdminGroup[]>([]);
  const [status, setStatus] = useState<'collecting' | 'all'>('collecting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-groups?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { groups?: AdminGroup[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setItems(body.groups ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không tải được danh sách nhóm.', 'Could not load groups.'));
    } finally {
      setLoading(false);
    }
  }, [status, token]);

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

  const settle = async (item: AdminGroup) => {
    if (!token) return;
    setBanner(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/payment-groups', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: item.id }),
      });
      const body = (await res.json()) as { error?: string; settledSize?: number };
      if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setBanner(
        tr(
          `Đã chốt nhóm ${item.code}: ${body.settledSize ?? 0}/${item.target_size} người đã trả`,
          `Settled group ${item.code}: ${body.settledSize ?? 0}/${item.target_size} paid`,
        ) + (item.leaderEmail ? tr(` (trưởng nhóm ${item.leaderEmail})`, ` (leader ${item.leaderEmail})`) : ''),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Không chốt được nhóm.', 'Could not settle the group.'));
    }
  };

  return (
    <View className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row gap-2">
          <TabPill label={L('Đang mở', 'Open')} active={status === 'collecting'} onPress={() => setStatus('collecting')} small />
          <TabPill label={L('Tất cả', 'All')} active={status === 'all'} onPress={() => setStatus('all')} small />
        </View>
        <Button label={L('Tải lại', 'Reload')} variant="outline" size="sm" iconLeft="refresh" onPress={() => void load()} />
      </View>

      {banner ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <Icon name="check" size={16} color={color.success} />
          <Text className="flex-1 font-sans text-body text-ink">{banner}</Text>
        </View>
      ) : null}
      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-3">
          <Icon name="info" size={16} color={color.danger} />
          <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
        </View>
      ) : null}

      <View className="mt-3 gap-3">
        {loading && items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">{L('Đang tải…', 'Loading…')}</Text>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {status === 'collecting' ? L('Không có nhóm nào đang mở.', 'No open groups.') : L('Chưa có nhóm mua chung nào.', 'No group buys yet.')}
            </Text>
          </Card>
        ) : (
          items.map((item, index) => (
            <Appear key={item.id} index={index}>
              <GroupRow item={item} onSettle={settle} />
            </Appear>
          ))
        )}
      </View>
    </View>
  );
}

function GroupRow({ item, onSettle }: { item: AdminGroup; onSettle: (item: AdminGroup) => void }) {
  const { L, locale } = useL();
  const tone = planTone(item.plan);
  const STATUS_LABEL: Record<AdminGroup['status'], { text: string; tone: string }> = {
    collecting: {
      text: item.pastDeadline ? L('đang mở · đã quá hạn', 'open · past deadline') : L('đang mở', 'open'),
      tone: item.pastDeadline ? color.warning : color.success,
    },
    settled: { text: L('đã chốt', 'settled'), tone: color.subtle },
    expired: { text: L('đã hết hạn', 'expired'), tone: color.danger },
  };
  const label = STATUS_LABEL[item.status];

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <PlanBadge plan={item.plan} />
            <Text className="font-heavy text-cardTitle" style={{ color: tone.ink }}>
              {item.paidCount}/{item.target_size} {L('người', 'people')}
            </Text>
            <Text className="font-sans text-label text-muted">{L(`giảm ${item.discount_percent}%`, `${item.discount_percent}% off`)}</Text>
            <Text className="font-mid text-label" style={{ color: label.tone }}>
              · {label.text}
            </Text>
          </View>

          <Text className="mt-1 font-strong text-body text-ink" numberOfLines={1}>
            {item.leaderEmail ?? item.leader_id}
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-card bg-canvas px-2.5 py-1.5">
              <Text className="font-heavy text-body text-ink" style={{ letterSpacing: 1 }}>
                {item.code}
              </Text>
            </View>
            <Text className="font-sans text-label text-subtle">
              {L('tạo', 'created')} {formatDate(item.created_at, locale)} · {L('hạn', 'deadline')} {formatDate(item.settle_by, locale)}
              {item.settled_at ? ` · ${L('chốt', 'settled')} ${formatDate(item.settled_at, locale)}` : ''}
            </Text>
          </View>
        </View>

        {item.status === 'collecting' ? (
          <Button label={L('Chốt nhóm', 'Settle group')} size="sm" iconRight="check" onPress={() => onSettle(item)} />
        ) : null}
      </View>
    </Card>
  );
}

function TabPill({
  label,
  active,
  onPress,
  small = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className={small ? 'rounded-pill px-3 py-1.5' : 'rounded-pill px-4 py-2'}
      style={{ backgroundColor: active ? color.primary : color.surface }}
    >
      <Text
        className={active ? 'font-strong text-label' : 'font-mid text-label'}
        style={{ color: active ? color.white : color.body }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const GIFT_PRESETS = [100, 500, 1000, 5000];

/** Chọn số sao (nút nhanh hoặc tự gõ) rồi bấm tặng. */
function GiftPicker({ confirmLabel, onGift }: { confirmLabel: (n: number) => string; onGift: (n: number) => void }) {
  const { L, locale } = useL();
  const [amount, setAmount] = useState(500);
  const [text, setText] = useState('');
  const n = text ? Number(text.replace(/[^0-9]/g, '')) : amount;
  const valid = Number.isInteger(n) && n >= 1 && n <= 100000;
  return (
    <View style={{ gap: 8 }}>
      <Text className="font-mid text-label text-muted">{L('Số sao tặng', 'Stars to gift')}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        {GIFT_PRESETS.map((v) => (
          <Chip
            key={v}
            label={`${v.toLocaleString(numberLocale(locale))} ⭐`}
            active={!text && amount === v}
            onPress={() => {
              setText('');
              setAmount(v);
            }}
          />
        ))}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={L('Số khác', 'Other')}
          placeholderTextColor={color.subtle}
          keyboardType="number-pad"
          className="rounded-pill border border-borderStrong bg-surface px-3 py-2 font-sans text-body text-ink"
          style={{ width: 110 }}
        />
      </View>
      <View className="flex-row">
        <Button label={valid ? confirmLabel(n) : L('Nhập từ 1 tới 100.000 sao', 'Enter 1 to 100,000 stars')} variant="brand" size="sm" iconLeft="star" disabled={!valid} onPress={() => onGift(n)} />
      </View>
    </View>
  );
}

/** Tặng sao cho TẤT CẢ tài khoản — bấm hai bước để không lỡ tay. */
function GiftAllCard({ total, onGift }: { total: number; onGift: (n: number) => void }) {
  const { L, locale } = useL();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  return (
    <Card className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
          <Text className="font-strong text-body text-ink">{L('Tặng sao cho mọi người', 'Gift stars to everyone')}</Text>
          <Text className="mt-0.5 font-sans text-label text-muted">
            {L(
              'Mỗi tài khoản nhận một khoản sao riêng, không trùng, không mất khi đồng bộ. Có ghi nhật ký.',
              "Each account gets its own star grant — no duplicates, not lost on sync. It's logged.",
            )}
          </Text>
        </View>
        <Button label={open ? L('Đóng', 'Close') : L('Tặng tất cả', 'Gift all')} variant="outline" size="sm" iconLeft="star" onPress={() => { setOpen((v) => !v); setPending(null); }} />
      </View>
      {open ? (
        <View className="mt-3 border-t border-border pt-3">
          {pending === null ? (
            <GiftPicker confirmLabel={(n) =>
                L(
                  `Tặng ${n.toLocaleString('vi-VN')} ⭐ cho tất cả (${total} tài khoản)`,
                  `Gift ${n.toLocaleString('en-US')} ⭐ to everyone (${total} accounts)`,
                )
              } onGift={(n) => setPending(n)} />
          ) : (
            <View style={{ gap: 8 }}>
              <Text className="font-strong text-body text-ink">
                {L(
                  `Chắc chắn tặng ${pending.toLocaleString('vi-VN')} ⭐ cho TẤT CẢ ${total} tài khoản? Thao tác này không hoàn tác bằng một nút được.`,
                  `Really gift ${pending.toLocaleString(numberLocale(locale))} ⭐ to ALL ${total} accounts? This can't be undone with one button.`,
                )}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Button label={L('Xác nhận tặng', 'Confirm gift')} variant="brand" size="sm" onPress={() => { onGift(pending); setPending(null); setOpen(false); }} />
                <Button label={L('Huỷ', 'Cancel')} variant="outline" size="sm" onPress={() => setPending(null)} />
              </View>
            </View>
          )}
        </View>
      ) : null}
    </Card>
  );
}

function UserRow({
  user,
  token,
  onSetPlan,
  onGift,
}: {
  user: AdminUser;
  token: string | null;
  onSetPlan: (user: AdminUser, plan: PlanId, months: number | null) => void;
  onGift: (user: AdminUser, stars: number) => void;
}) {
  const { L, locale } = useL();
  const [open, setOpen] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [months, setMonths] = useState<number | null>(1);

  /*
    Hoạt động học đọc theo YÊU CẦU, không tải sẵn cùng danh sách: payload của một
    tài khoản đã hơn 150 KB, nhân với một trăm dòng là vài chục megabyte cho một
    bảng mà người duyệt chỉ nhìn vài dòng.
  */
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [activityState, setActivityState] = useState<'idle' | 'loading' | 'error'>('idle');

  const toggleActivity = async () => {
    if (!token) return;
    if (activity) {
      setActivity(null);
      return;
    }
    setActivityState('loading');
    try {
      const res = await fetch(`/api/admin/activity?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { activity?: UserActivity; error?: string };
      if (!res.ok || !body.activity) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
      setActivity(body.activity);
      setActivityState('idle');
    } catch {
      setActivityState('error');
    }
  };

  return (
    <Card>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-body text-ink" numberOfLines={1}>
              {user.email ?? L('(không có email)', '(no email)')}
            </Text>
            {user.role === 'admin' ? <Badge label="admin" tone="accent" shape="tag" /> : null}
            {user.missingProfile ? <Badge label={L('thiếu hồ sơ', 'no profile')} tone="danger" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-sans text-label text-muted">
            {user.displayName ? `${user.displayName} · ` : ''}
            {L('tạo', 'created')} {formatDate(user.createdAt, locale)}
            {user.lastSignInAt
              ? ` · ${L('đăng nhập gần nhất', 'last sign-in')} ${formatDate(user.lastSignInAt, locale)}`
              : L(' · chưa đăng nhập lần nào', ' · never signed in')}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-end">
            <PlanBadge plan={user.plan} />
            <Text className="mt-0.5 font-sans text-label text-subtle">
              {user.plan === 'free'
                ? '—'
                : user.planExpiresAt
                  ? `${L('hết hạn', 'expires')} ${formatDate(user.planExpiresAt, locale)}`
                  : L('không hết hạn', 'no expiry')}
            </Text>
          </View>
          <Button
            label={activity ? L('Ẩn hoạt động', 'Hide activity') : L('Hoạt động', 'Activity')}
            variant="ghost"
            size="sm"
            onPress={() => void toggleActivity()}
          />
          <Button
            label={gifting ? L('Đóng', 'Close') : L('Tặng sao', 'Gift stars')}
            variant="ghost"
            size="sm"
            iconLeft="star"
            onPress={() => setGifting((v) => !v)}
          />
          <Button
            label={open ? L('Đóng', 'Close') : L('Đổi gói', 'Change plan')}
            variant="outline"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
        </View>
      </View>

      {gifting ? (
        <View className="mt-3 border-t border-border pt-3">
          <GiftPicker
            confirmLabel={(n) =>
              L(
                `Tặng ${n.toLocaleString('vi-VN')} ⭐ cho ${user.email ?? 'tài khoản này'}`,
                `Gift ${n.toLocaleString('en-US')} ⭐ to ${user.email ?? 'this account'}`,
              )
            }
            onGift={(n) => {
              setGifting(false);
              onGift(user, n);
            }}
          />
        </View>
      ) : null}

      {open ? (
        <View className="mt-3 border-t border-border pt-3">
          <Text className="font-mid text-label text-muted">{L('Thời hạn', 'Duration')}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {[1, 3, 6, 12].map((n) => (
              <Chip key={n} label={L(`${n} tháng`, `${n} ${n === 1 ? 'month' : 'months'}`)} active={months === n} onPress={() => setMonths(n)} />
            ))}
            <Chip label={L('Không hết hạn', 'No expiry')} active={months === null} onPress={() => setMonths(null)} />
          </View>

          <Text className="mt-3 font-mid text-label text-muted">{L('Cấp gói', 'Grant plan')}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {PLAN_ORDER.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  // Gói Free không có thời hạn — truyền `months` vào chỉ tạo ra
                  // một ngày hết hạn vô nghĩa trong nhật ký.
                  onSetPlan(user, id, id === 'free' ? null : months);
                }}
                className="rounded-pill px-3 py-2"
                style={{ backgroundColor: planTone(id).soft }}
              >
                <Text className="font-strong text-label" style={{ color: planTone(id).ink }}>
                  {PLANS[id].name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {activityState === 'loading' ? (
        <Text className="mt-3 font-sans text-label text-muted">{L('Đang đọc dữ liệu học…', 'Loading study data…')}</Text>
      ) : null}
      {activityState === 'error' ? (
        <Text className="mt-3 font-sans text-label text-danger">
          {L('Không đọc được hoạt động của tài khoản này.', "Couldn't load this account's activity.")}
        </Text>
      ) : null}
      {activity ? (
        <Appear>
          <ActivityPanel activity={activity} plan={user.plan} />
        </Appear>
      ) : null}
    </Card>
  );
}

/**
 * Hoạt động học của một tài khoản — chỉ số đếm, không có nội dung.
 *
 * Người duyệt cần ba câu trả lời: tài khoản này có học thật không (để xét hoàn
 * tiền và lượt mời hợp lệ), học lần cuối bao giờ, và máy của họ đang thấy gói
 * nào. Không cần đọc bài viết hay ghi chú của ai, nên API cũng không trả ra.
 */
function ActivityPanel({ activity, plan }: { activity: UserActivity; plan: PlanId }) {
  const { L, locale } = useL();
  const items: [string, string][] = [
    [L('Ngày có học', 'Study days'), String(activity.activeDays)],
    [L('Tổng thời gian', 'Total time'), L(`${activity.minutes} phút`, `${activity.minutes} min`)],
    [L('Số câu đã làm', 'Questions answered'), String(activity.questions)],
    [L('Phiên đọc và đề', 'Reading & test sessions'), String(activity.readingSessions)],
    [L('Phiên SAT Math', 'SAT Math sessions'), String(activity.mathSessions)],
    [
      L('Bài đọc', 'Articles'),
      L(`${activity.articlesRead} mở · ${activity.articlesFinished} xong`, `${activity.articlesRead} opened · ${activity.articlesFinished} finished`),
    ],
    [L('Sổ từ', 'Word bank'), L(`${activity.vocabWords} từ · ${activity.fsrsCards} thẻ`, `${activity.vocabWords} words · ${activity.fsrsCards} cards`)],
    [L('Đã lưu', 'Saved'), String(activity.bookmarks)],
  ];

  return (
    <View className="mt-3 border-t border-border pt-3">
      <View className="flex-row flex-wrap items-baseline gap-2">
        <Text className="font-strong text-label text-ink">{L('Hoạt động', 'Activity')}</Text>
        <Text className="font-sans text-label text-subtle">
          {activity.lastSyncAt
            ? `${L('đồng bộ gần nhất', 'last sync')} ${formatDate(activity.lastSyncAt, locale)}`
            : L('chưa đồng bộ lần nào', 'never synced')}
          {activity.firstDay ? ` · ${L('học từ', 'studying since')} ${activity.firstDay}` : ''}
        </Text>
      </View>

      <View className="mt-2 flex-row flex-wrap gap-2">
        {items.map(([label, value]) => (
          <View key={label} className="rounded-card border border-border bg-surfaceAlt px-3 py-2">
            <Text className="font-mid text-label text-muted">{label}</Text>
            <Text className="mt-0.5 font-strong text-body text-ink">{value}</Text>
          </View>
        ))}
      </View>

      {/*
        Gói ghi trên máy người dùng lệch với hồ sơ là chuyện BÌNH THƯỜNG ngay sau
        khi admin đổi gói: máy họ chỉ biết khi mở app lần sau. Nói rõ để người
        duyệt không tưởng là hỏng, và cũng để biết vì sao người dùng kêu "đã trả
        tiền mà chưa thấy gói".
      */}
      {activity.planOnDevice && activity.planOnDevice !== plan ? (
        <Text className="mt-2 font-sans text-label text-warning-ink">
          {L(
            `Máy người dùng đang ghi gói ${activity.planOnDevice}, hồ sơ là ${plan} — họ cần mở app để đồng bộ lại.`,
            `The user's device shows plan ${activity.planOnDevice}, but the profile says ${plan} — they need to open the app to sync.`,
          )}
        </Text>
      ) : null}

      {activity.syncedStores.length === 0 ? (
        <Text className="mt-2 font-sans text-label text-subtle">
          {L(
            'Tài khoản này chưa từng đồng bộ: dữ liệu học (nếu có) vẫn nằm trên trình duyệt của họ.',
            "This account has never synced: any study data is still in the user's browser.",
          )}
        </Text>
      ) : null}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
      <Text
        className={active ? 'font-strong text-label' : 'font-sans text-label'}
        style={{ color: active ? color.primary : color.body }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View
      className="flex-row items-baseline gap-1.5 rounded-pill border px-3 py-1.5"
      style={{ borderColor: tint ? `${tint}44` : color.border, backgroundColor: color.surface }}
    >
      <Text className="font-heavy text-body" style={{ color: tint ?? color.ink }}>
        {value}
      </Text>
      <Text className="font-sans text-label text-muted">{label}</Text>
    </View>
  );
}

function Blocked({ reason }: { reason: string }) {
  const { L } = useL();
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 420 }}>
        <Card>
          <View className="flex-row items-start gap-2">
            <Icon name="lock" size={18} color={color.danger} />
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">{L('Không vào được', 'Access denied')}</Text>
              <Text className="mt-1 font-sans text-body text-muted">{reason}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label={L('Đăng nhập', 'Sign in')} onPress={() => router.push('/auth/sign-in' as never)} />
            <Button
              label={L('Về Tổng quan', 'Back to dashboard')}
              variant="outline"
              onPress={() => router.replace('/dashboard' as never)}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function formatDate(iso: string, locale: Locale = 'vi'): string {
  const d = new Date(iso);
  if (locale === 'en') return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function numberLocale(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'vi-VN';
}

/** Nhãn máy chủ tự dựng bằng tiếng Việt (`services/admin/stats.ts`, `services/analytics/traffic.ts`). */
function serverLabel(label: string, locale: Locale): string {
  if (locale !== 'en') return label;
  return label
    .replace(' · còn hạn', ' · active')
    .replace(' · hết hạn', ' · expired')
    .replace(/^Khác$/, 'Other')
    .replace(/^Không rõ$/, 'Unknown');
}

type Stats = import('@/services/admin/stats').UserStats;

/**
 * Tổng quan người dùng: số tài khoản, người học thật 7/30 ngày, gói đang dùng.
 * Lượt xem của người dùng chế độ Khách không có ở đây — xem Vercel Analytics.
 */
function StatsPanel({ token }: { token: string | null }) {
  const { L, locale } = useL();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        const body = (await res.json()) as { stats?: Stats; error?: string };
        if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
        if (!cancelled) setStats(body.stats ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : tr('Không tải được thống kê.', 'Could not load stats.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <Card className="mt-4">
        <Text className="font-sans text-body" style={{ color: color.danger }}>
          {L('Thống kê', 'Stats')}: {error}
        </Text>
      </Card>
    );
  }
  if (!stats) return null;

  const tiles: [string, string, string][] = [
    [
      String(stats.accounts),
      L('tài khoản', 'accounts'),
      L(`+${stats.signups7} trong 7 ngày · +${stats.signups30} trong 30 ngày`, `+${stats.signups7} in 7 days · +${stats.signups30} in 30 days`),
    ],
    [
      String(stats.learners7),
      L('người học trong 7 ngày', 'learners in 7 days'),
      L(`${stats.learners30} trong 30 ngày · ${stats.learnersEver} từng học`, `${stats.learners30} in 30 days · ${stats.learnersEver} ever studied`),
    ],
    [String(stats.signedIn7), L('đăng nhập trong 7 ngày', 'signed in within 7 days'), L(`${stats.signedIn30} trong 30 ngày`, `${stats.signedIn30} in 30 days`)],
  ];
  return (
    <Card className="mt-4">
      <Text className="font-strong text-cardTitle text-ink">{L('Tổng quan người dùng', 'User overview')}</Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        {tiles.map(([value, label, sub]) => (
          <View key={label} className="rounded-2xl bg-canvas px-4 py-3" style={{ minWidth: 190, flexGrow: 1 }}>
            <Text className="font-heavy text-stat text-ink">{value}</Text>
            <Text className="font-semi text-body text-ink">{label}</Text>
            <Text className="mt-0.5 font-sans text-label text-muted">{sub}</Text>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {Object.entries(stats.plans).map(([plan, n]) => (
          <Badge key={plan} label={`${serverLabel(plan, locale)}: ${n}`} tone="neutral" />
        ))}
        {stats.signupsByMonth.map(([month, n]) => (
          <Badge key={month} label={`${L('Đăng ký', 'Sign-ups')} ${month}: ${n}`} tone="info" />
        ))}
      </View>
      <Text className="mt-3 font-sans text-label text-muted">
        {L(
          'Người dùng chế độ Khách không đăng nhập nên không có trong các số này — lượt truy cập của họ xem ở Vercel → Analytics.',
          "Guest-mode users don't sign in, so they aren't in these numbers — see their visits in Vercel → Analytics.",
        )}
      </Text>
    </Card>
  );
}

const DEVICE_LABEL: Record<string, Bi> = {
  mobile: { vi: '📱 Điện thoại', en: '📱 Phone' },
  tablet: { vi: '📟 Máy tính bảng', en: '📟 Tablet' },
  desktop: { vi: '💻 Máy tính', en: '💻 Desktop' },
};

/**
 * LƯỢT TRUY CẬP WEB — bộ đếm riêng của app (`/api/track` → bảng `page_views`),
 * đếm cả người KHÔNG đăng nhập. Người dùng muốn xem ngay ở đây thay vì mở Vercel
 * (26/09/2026). Số chia thiết bị / hệ điều hành / trình duyệt đếm theo NGƯỜI.
 */
function TrafficPanel({ token }: { token: string | null }) {
  const { L, locale } = useL();
  const [days, setDays] = useState<7 | 30>(7);
  const [summary, setSummary] = useState<TrafficSummary | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/traffic?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
        const body = (await res.json()) as { summary?: TrafficSummary; setupNeeded?: boolean; error?: string };
        if (!res.ok) throw new Error(body.error ?? `${tr('Lỗi', 'Error')} ${res.status}`);
        if (cancelled) return;
        setSetupNeeded(!!body.setupNeeded);
        setSummary(body.summary ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : tr('Không tải được lượt truy cập.', 'Could not load traffic.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  return (
    <Card className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-strong text-cardTitle text-ink">{L('Lượt truy cập web', 'Web traffic')}</Text>
        <View className="flex-row gap-2">
          <TabPill label={L('7 ngày', '7 days')} active={days === 7} onPress={() => setDays(7)} small />
          <TabPill label={L('30 ngày', '30 days')} active={days === 30} onPress={() => setDays(30)} small />
        </View>
      </View>

      {error ? (
        <Text className="mt-2 font-sans text-body" style={{ color: color.danger }}>
          {error}
        </Text>
      ) : setupNeeded ? (
        <View className="mt-3 gap-2 rounded-2xl bg-canvas p-4">
          <Text className="font-strong text-body text-ink">{L('Chưa tạo bảng đếm trên Supabase', 'The counter table has not been created in Supabase')}</Text>
          <Text className="font-sans text-body text-muted">
            {L(
              'Mở Supabase → SQL Editor, dán toàn bộ nội dung file supabase/migrations/20260926000100_page_views.sql rồi bấm Run. Làm một lần; từ lúc đó app bắt đầu đếm (không có số liệu những ngày trước).',
              'Open Supabase → SQL Editor, paste the whole file supabase/migrations/20260926000100_page_views.sql and click Run. Do it once; the app starts counting from then on (no data for earlier days).',
            )}
          </Text>
        </View>
      ) : !summary ? (
        <Text className="mt-2 font-sans text-body text-muted">{L('Đang tải…', 'Loading…')}</Text>
      ) : (
        <View>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {(
              [
                [summary.visitors, L('người truy cập', 'visitors'), L(`hôm nay ${summary.today.visitors}`, `today ${summary.today.visitors}`)],
                [summary.views, L('lượt xem trang', 'page views'), L(`hôm nay ${summary.today.views}`, `today ${summary.today.views}`)],
                [
                  summary.sessions,
                  L('lượt mở web', 'sessions'),
                  L(`${summary.signedInVisitors} người có đăng nhập`, `${summary.signedInVisitors} signed in`),
                ],
              ] as [number, string, string][]
            ).map(([value, label, sub]) => (
              <View key={label} className="rounded-2xl bg-canvas px-4 py-3" style={{ minWidth: 170, flexGrow: 1 }}>
                <Text className="font-heavy text-stat text-ink">{value.toLocaleString(numberLocale(locale))}</Text>
                <Text className="font-semi text-body text-ink">{label}</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">{sub}</Text>
              </View>
            ))}
          </View>

          <Text className="mt-4 font-semi text-label text-muted">{L('NGƯỜI TRUY CẬP MỖI NGÀY (cột xanh) · LƯỢT XEM (cột cam)', 'VISITORS PER DAY (blue bars) · PAGE VIEWS (orange bars)')}</Text>
          <View className="mt-2">
            <BarChart
              height={170}
              showSecondary
              data={summary.daily.map((d) => ({ label: d.day.slice(8, 10) + '/' + d.day.slice(5, 7), value: d.visitors, secondary: d.views }))}
            />
          </View>

          <View className="mt-4 flex-row flex-wrap gap-4">
            <Split
              title={L('Thiết bị', 'Devices')}
              rows={summary.devices.map(([k, n]) => [DEVICE_LABEL[k] ? bi(DEVICE_LABEL[k], locale) : serverLabel(k, locale), n])}
              total={summary.visitors}
            />
            <Split title={L('Hệ điều hành', 'Operating systems')} rows={localRows(summary.os, locale)} total={summary.visitors} />
            <Split title={L('Trình duyệt / app mở link', 'Browsers / in-app browsers')} rows={localRows(summary.browsers, locale)} total={summary.visitors} />
            <Split
              title={L('Nguồn vào', 'Referrers')}
              rows={localRows(summary.referrers, locale)}
              total={summary.visitors}
              empty={L('Chưa có ai vào từ trang khác', 'No visits from other sites yet')}
            />
            <Split title={L('Nước', 'Countries')} rows={localRows(summary.countries, locale)} total={summary.visitors} />
            <Split title={L('Trang xem nhiều (lượt)', 'Top pages (views)')} rows={localRows(summary.pages, locale)} total={summary.views} />
          </View>
          <Text className="mt-3 font-sans text-label text-muted">
            {L(
              'Đếm ẩn danh: không IP, không email. Không đếm bot, bản chạy trên máy và chính trang quản trị.',
              "Anonymous counting: no IPs, no emails. Bots, local builds and the admin page itself aren't counted.",
            )}
          </Text>
        </View>
      )}
    </Card>
  );
}

function localRows(rows: [string, number][], locale: Locale): [string, number][] {
  return rows.map(([k, n]) => [serverLabel(k, locale), n]);
}

function Split({ title, rows, total, empty }: { title: string; rows: [string, number][]; total: number; empty?: string }) {
  const { L } = useL();
  return (
    <View style={{ minWidth: 240, flexGrow: 1, flexBasis: 240 }}>
      <Text className="font-strong text-body text-ink">{title}</Text>
      {rows.length === 0 ? (
        <Text className="mt-1 font-sans text-label text-muted">{empty ?? L('Chưa có số liệu', 'No data yet')}</Text>
      ) : (
        <View className="mt-1.5 gap-1.5">
          {rows.map(([label, n]) => (
            <View key={label}>
              <View className="flex-row justify-between gap-2">
                <Text className="flex-1 font-sans text-label text-ink" numberOfLines={1}>
                  {label}
                </Text>
                <Text className="font-semi text-label text-muted">
                  {n} · {total > 0 ? Math.round((n / total) * 100) : 0}%
                </Text>
              </View>
              <View className="mt-0.5 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F6F3EE' }}>
                <View style={{ height: 6, width: '100%', backgroundColor: color.primary, transform: [{ scaleX: total > 0 ? Math.min(1, n / total) : 0 }], transformOrigin: 'left' }} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
