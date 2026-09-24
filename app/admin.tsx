import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { PlanBadge, planTone } from '@/components/billing/PlanUi';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { PLANS, PLAN_ORDER, formatVnd, type PlanId } from '@/lib/billing/plans';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { type UserActivity } from '@/services/admin/activity';

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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setUsers(body.users ?? []);
      setTotal(body.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách.');
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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setBanner(
        `${user.email ?? user.id} → ${PLANS[plan].name}` +
          (months ? ` (${months} tháng)` : ' (không hết hạn)') +
          (body.auditWarning ? ` · ⚠ nhật ký không ghi được: ${body.auditWarning}` : ''),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đổi được gói.');
    }
  };

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const u of users) out[u.plan] = (out[u.plan] ?? 0) + 1;
    return out;
  }, [users]);

  if (status === 'signed_out') return <Blocked reason="Cần đăng nhập trước." />;
  if (profile && profile.role !== 'admin') {
    return <Blocked reason="Tài khoản này không có quyền quản trị." />;
  }

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1" style={{ minWidth: 240 }}>
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-pageTitle text-ink">Quản trị</Text>
              <Badge label="ADMIN" tone="accent" shape="tag" uppercase />
            </View>
            <Text className="mt-1 font-sans text-body text-muted">
              Cấp gói bằng tay sau khi đối chiếu chuyển khoản. Mọi thay đổi đều được ghi nhật ký
              kèm giá trị trước và sau.
            </Text>
          </View>
          <Button label="Tải lại" variant="outline" iconLeft="refresh" onPress={() => void load()} />
        </View>
      </Appear>

      <Appear index={1}>
        <StatsPanel token={token} />
      </Appear>

      <Appear index={1}>
        {/* Đối chiếu thanh toán đứng TRƯỚC vì đó là việc phải làm hằng ngày;
            danh sách người dùng chỉ tra khi cần. */}
        <View className="mt-4 flex-row gap-2">
          <TabPill label="Đối chiếu thanh toán" active={tab === 'payments'} onPress={() => setTab('payments')} />
          <TabPill label="Nhóm mua chung" active={tab === 'groups'} onPress={() => setTab('groups')} />
          <TabPill label="Người dùng & gói" active={tab === 'users'} onPress={() => setTab('users')} />
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
          <Stat label="tài khoản" value={String(total)} />
          {PLAN_ORDER.map((id) => (
            <Stat key={id} label={PLANS[id].name} value={String(counts[id] ?? 0)} tint={planTone(id).solid} />
          ))}
        </View>
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
              placeholder="Tìm theo email"
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
            <Text className="font-sans text-body text-muted">Đang tải…</Text>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {query ? 'Không có tài khoản nào khớp.' : 'Chưa có tài khoản nào.'}
            </Text>
          </Card>
        ) : (
          users.map((user, index) => (
            <Appear key={user.id} index={index + 4}>
              <UserRow user={user} token={token} onSetPlan={setPlan} />
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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setItems(body.payments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách đơn.');
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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setBanner(
        action === 'confirm'
          ? `Đã bật gói ${PLANS[item.plan].name} cho ${item.email ?? item.user_id}` +
              (body.expiresAt ? ` tới ${formatDate(body.expiresAt)}` : '')
          : `Đã huỷ đơn ${item.reference ?? item.id}`,
      );
      await load();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xử lý được đơn.');
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <View className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row gap-2">
          <TabPill label={`Đang chờ${status === 'pending' ? ` (${pendingCount})` : ''}`} active={status === 'pending'} onPress={() => setStatus('pending')} small />
          <TabPill label="Tất cả" active={status === 'all'} onPress={() => setStatus('all')} small />
        </View>
        <Button label="Tải lại" variant="outline" size="sm" iconLeft="refresh" onPress={() => void load()} />
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
            <Text className="font-sans text-body text-muted">Đang tải…</Text>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {status === 'pending'
                ? 'Không có đơn nào đang chờ. Sạch sẽ.'
                : 'Chưa có đơn thanh toán nào.'}
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
  const tone = planTone(item.plan);
  const STATUS_LABEL: Record<AdminPayment['status'], { text: string; tone: string }> = {
    pending: { text: 'đang chờ', tone: color.warning },
    paid: { text: 'đã thanh toán', tone: color.success },
    failed: { text: 'đã huỷ', tone: color.danger },
    refunded: { text: 'đã hoàn tiền', tone: color.subtle },
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
              {item.billing_cycle === 'yearly' ? '1 năm' : '1 tháng'}
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
                {item.reference ?? '(không có mã)'}
              </Text>
            </View>
            <Text className="font-sans text-label text-subtle">
              tạo {formatDate(item.created_at)}
              {item.paid_at ? ` · xác nhận ${formatDate(item.paid_at)}` : ''}
            </Text>
          </View>

          {item.admin_note ? (
            <Text className="mt-1 font-sans text-label text-muted">Ghi chú: {item.admin_note}</Text>
          ) : null}
        </View>

        {item.status === 'pending' ? (
          <View className="flex-row items-center gap-2">
            <Button label="Huỷ đơn" variant="outline" size="sm" onPress={() => onAct(item, 'reject')} />
            <Button label="Đã nhận tiền" size="sm" iconRight="check" onPress={() => onAct(item, 'confirm')} />
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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setItems(body.groups ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách nhóm.');
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
      if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setBanner(
        `Đã chốt nhóm ${item.code}: ${body.settledSize ?? 0}/${item.target_size} người đã trả` +
          (item.leaderEmail ? ` (trưởng nhóm ${item.leaderEmail})` : ''),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không chốt được nhóm.');
    }
  };

  return (
    <View className="mt-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row gap-2">
          <TabPill label="Đang mở" active={status === 'collecting'} onPress={() => setStatus('collecting')} small />
          <TabPill label="Tất cả" active={status === 'all'} onPress={() => setStatus('all')} small />
        </View>
        <Button label="Tải lại" variant="outline" size="sm" iconLeft="refresh" onPress={() => void load()} />
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
            <Text className="font-sans text-body text-muted">Đang tải…</Text>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Text className="font-sans text-body text-muted">
              {status === 'collecting' ? 'Không có nhóm nào đang mở.' : 'Chưa có nhóm mua chung nào.'}
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
  const tone = planTone(item.plan);
  const STATUS_LABEL: Record<AdminGroup['status'], { text: string; tone: string }> = {
    collecting: { text: item.pastDeadline ? 'đang mở · đã quá hạn' : 'đang mở', tone: item.pastDeadline ? color.warning : color.success },
    settled: { text: 'đã chốt', tone: color.subtle },
    expired: { text: 'đã hết hạn', tone: color.danger },
  };
  const label = STATUS_LABEL[item.status];

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <PlanBadge plan={item.plan} />
            <Text className="font-heavy text-cardTitle" style={{ color: tone.ink }}>
              {item.paidCount}/{item.target_size} người
            </Text>
            <Text className="font-sans text-label text-muted">giảm {item.discount_percent}%</Text>
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
              tạo {formatDate(item.created_at)} · hạn {formatDate(item.settle_by)}
              {item.settled_at ? ` · chốt ${formatDate(item.settled_at)}` : ''}
            </Text>
          </View>
        </View>

        {item.status === 'collecting' ? (
          <Button label="Chốt nhóm" size="sm" iconRight="check" onPress={() => onSettle(item)} />
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

function UserRow({
  user,
  token,
  onSetPlan,
}: {
  user: AdminUser;
  token: string | null;
  onSetPlan: (user: AdminUser, plan: PlanId, months: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
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
      if (!res.ok || !body.activity) throw new Error(body.error ?? `Lỗi ${res.status}`);
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
              {user.email ?? '(không có email)'}
            </Text>
            {user.role === 'admin' ? <Badge label="admin" tone="accent" shape="tag" /> : null}
            {user.missingProfile ? <Badge label="thiếu hồ sơ" tone="danger" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-sans text-label text-muted">
            {user.displayName ? `${user.displayName} · ` : ''}
            tạo {formatDate(user.createdAt)}
            {user.lastSignInAt ? ` · đăng nhập gần nhất ${formatDate(user.lastSignInAt)}` : ' · chưa đăng nhập lần nào'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-end">
            <PlanBadge plan={user.plan} />
            <Text className="mt-0.5 font-sans text-label text-subtle">
              {user.plan === 'free'
                ? '—'
                : user.planExpiresAt
                  ? `hết hạn ${formatDate(user.planExpiresAt)}`
                  : 'không hết hạn'}
            </Text>
          </View>
          <Button
            label={activity ? 'Ẩn hoạt động' : 'Hoạt động'}
            variant="ghost"
            size="sm"
            onPress={() => void toggleActivity()}
          />
          <Button
            label={open ? 'Đóng' : 'Đổi gói'}
            variant="outline"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
        </View>
      </View>

      {open ? (
        <View className="mt-3 border-t border-border pt-3">
          <Text className="font-mid text-label text-muted">Thời hạn</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {[1, 3, 6, 12].map((n) => (
              <Chip key={n} label={`${n} tháng`} active={months === n} onPress={() => setMonths(n)} />
            ))}
            <Chip label="Không hết hạn" active={months === null} onPress={() => setMonths(null)} />
          </View>

          <Text className="mt-3 font-mid text-label text-muted">Cấp gói</Text>
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
        <Text className="mt-3 font-sans text-label text-muted">Đang đọc dữ liệu học…</Text>
      ) : null}
      {activityState === 'error' ? (
        <Text className="mt-3 font-sans text-label text-danger">
          Không đọc được hoạt động của tài khoản này.
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
  const items: [string, string][] = [
    ['Ngày có học', String(activity.activeDays)],
    ['Tổng thời gian', `${activity.minutes} phút`],
    ['Số câu đã làm', String(activity.questions)],
    ['Phiên đọc và đề', String(activity.readingSessions)],
    ['Phiên SAT Math', String(activity.mathSessions)],
    ['Bài đọc', `${activity.articlesRead} mở · ${activity.articlesFinished} xong`],
    ['Sổ từ', `${activity.vocabWords} từ · ${activity.fsrsCards} thẻ`],
    ['Đã lưu', String(activity.bookmarks)],
  ];

  return (
    <View className="mt-3 border-t border-border pt-3">
      <View className="flex-row flex-wrap items-baseline gap-2">
        <Text className="font-strong text-label text-ink">Hoạt động</Text>
        <Text className="font-sans text-label text-subtle">
          {activity.lastSyncAt
            ? `đồng bộ gần nhất ${formatDate(activity.lastSyncAt)}`
            : 'chưa đồng bộ lần nào'}
          {activity.firstDay ? ` · học từ ${activity.firstDay}` : ''}
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
          Máy người dùng đang ghi gói {activity.planOnDevice}, hồ sơ là {plan} — họ cần mở app
          để đồng bộ lại.
        </Text>
      ) : null}

      {activity.syncedStores.length === 0 ? (
        <Text className="mt-2 font-sans text-label text-subtle">
          Tài khoản này chưa từng đồng bộ: dữ liệu học (nếu có) vẫn nằm trên trình duyệt của họ.
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
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 420 }}>
        <Card>
          <View className="flex-row items-start gap-2">
            <Icon name="lock" size={18} color={color.danger} />
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">Không vào được</Text>
              <Text className="mt-1 font-sans text-body text-muted">{reason}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label="Đăng nhập" onPress={() => router.push('/auth/sign-in' as never)} />
            <Button
              label="Về Tổng quan"
              variant="outline"
              onPress={() => router.replace('/dashboard' as never)}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

type Stats = import('@/services/admin/stats').UserStats;

/**
 * Tổng quan người dùng: số tài khoản, người học thật 7/30 ngày, gói đang dùng.
 * Lượt xem của người dùng chế độ Khách không có ở đây — xem Vercel Analytics.
 */
function StatsPanel({ token }: { token: string | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        const body = (await res.json()) as { stats?: Stats; error?: string };
        if (!res.ok) throw new Error(body.error ?? `Lỗi ${res.status}`);
        if (!cancelled) setStats(body.stats ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được thống kê.');
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
          Thống kê: {error}
        </Text>
      </Card>
    );
  }
  if (!stats) return null;

  const tiles: [string, string, string][] = [
    [String(stats.accounts), 'tài khoản', `+${stats.signups7} trong 7 ngày · +${stats.signups30} trong 30 ngày`],
    [String(stats.learners7), 'người học trong 7 ngày', `${stats.learners30} trong 30 ngày · ${stats.learnersEver} từng học`],
    [String(stats.signedIn7), 'đăng nhập trong 7 ngày', `${stats.signedIn30} trong 30 ngày`],
  ];
  return (
    <Card className="mt-4">
      <Text className="font-strong text-cardTitle text-ink">Tổng quan người dùng</Text>
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
          <Badge key={plan} label={`${plan}: ${n}`} tone="neutral" />
        ))}
        {stats.signupsByMonth.map(([month, n]) => (
          <Badge key={month} label={`Đăng ký ${month}: ${n}`} tone="info" />
        ))}
      </View>
      <Text className="mt-3 font-sans text-label text-muted">
        Người dùng chế độ Khách không đăng nhập nên không có trong các số này — lượt truy cập của họ xem ở Vercel → Analytics.
      </Text>
    </Card>
  );
}
