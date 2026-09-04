import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { PlanBadge } from '@/components/billing/PlanUi';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { PLANS, formatVnd } from '@/lib/billing/plans';
import { usePlanStatus } from '@/store/useBillingStore';
import { deleteAccount, updateProfile } from '@/services/auth/session';
import { registeredStoreKeys } from '@/services/sync/engine';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useSyncLabel, useSyncStore } from '@/store/useSyncStore';
import { color } from '@/theme/tokens';

/**
 * Thẻ tài khoản trong Cài đặt.
 *
 * Ba việc, xếp theo tần suất dùng: xem trạng thái đồng bộ, sửa tên, và — cuối
 * cùng, tách hẳn ra — xoá tài khoản.
 *
 * XOÁ TÀI KHOẢN CÓ HAI BƯỚC và bước hai bắt gõ đúng chữ. Đây là thao tác duy
 * nhất trong app không hoàn tác được, nên một cú chạm nhầm không được phép đủ
 * để thực hiện nó.
 */
export function AccountCard() {
  const status = useAuthStore((s) => s.status);
  const available = useAuthStore((s) => s.available);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const name = useDisplayName();

  const syncNow = useSyncStore((s) => s.syncNow);
  const syncStatus = useSyncStore((s) => s.status);
  const syncLabel = useSyncLabel();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (status !== 'signed_in' || !user) {
    return (
      <Card className="mt-4">
        <SectionHeader
          title="Tài khoản"
          subtitle="Dữ liệu học đang nằm trên thiết bị này"
          icon="settings"
          right={<Badge label={available ? 'Chưa đăng nhập' : 'Chưa nối máy chủ'} tone="neutral" />}
        />
        <Text className="mt-3 font-sans text-body text-muted">
          App chạy được đầy đủ mà không cần tài khoản. Đăng nhập chỉ để hai việc: giữ tiến độ khi
          đổi máy, và không mất dữ liệu nếu xoá trình duyệt.
        </Text>
        <PlanRow />
        <Button
          className="mt-3 self-start"
          label="Đăng nhập"
          iconRight="arrow-right"
          disabled={!available}
          onPress={() => router.push('/auth/sign-in' as never)}
        />
      </Card>
    );
  }

  const saveName = async () => {
    setError(null);
    const value = draft.trim();
    if (value.length < 1) {
      setError('Tên không được để trống.');
      return;
    }
    const result = await updateProfile(user.id, { displayName: value });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await refreshProfile();
    setEditing(false);
  };

  const runDelete = async () => {
    setError(null);
    const result = await deleteAccount();
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.replace('/dashboard' as never);
  };

  return (
    <Card className="mt-4">
      <SectionHeader
        title="Tài khoản"
        subtitle={user.email ?? user.phone ?? 'Đã đăng nhập'}
        icon="settings"
        right={<Badge label="Đã đăng nhập" tone="success" />}
      />

      {/* ---------------------------------------------------------- tên */}
      <View className="mt-4">
        <Text className="font-mid text-label text-muted">Tên hiển thị</Text>
        {editing ? (
          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              placeholder="Tên của bạn"
              placeholderTextColor={color.subtle}
              className="min-w-[180px] flex-1 rounded-card border border-borderStrong bg-surface px-3 py-2 font-sans text-body text-ink"
            />
            <Button label="Lưu" size="sm" onPress={saveName} />
            <Button label="Huỷ" size="sm" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View className="mt-1.5 flex-row items-center gap-2">
            <Text className="font-strong text-body text-ink">{name}</Text>
            <Button
              label="Đổi tên"
              size="sm"
              variant="ghost"
              onPress={() => {
                setDraft(name);
                setEditing(true);
              }}
            />
          </View>
        )}
      </View>

      <PlanRow />

      {/* ------------------------------------------------------ đồng bộ */}
      <View className="mt-4 rounded-card border border-border bg-canvas p-3">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-1" style={{ minWidth: 200 }}>
            <Text className="font-strong text-body text-ink">Đồng bộ</Text>
            <Text className="mt-0.5 font-sans text-label text-muted">{syncLabel}</Text>
          </View>
          <Button
            label="Đồng bộ ngay"
            size="sm"
            variant="outline"
            loading={syncStatus === 'syncing'}
            onPress={() => void syncNow(user.id, 'merge')}
          />
        </View>
        <Text className="mt-2 font-sans text-label text-muted">
          Đang đồng bộ: {registeredStoreKeys().join(', ')}. Dữ liệu được GỘP hai chiều — làm bài
          trên điện thoại lúc mất mạng thì lần đồng bộ sau vẫn giữ nguyên, không bị máy khác ghi đè.
        </Text>
      </View>

      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
          <Icon name="info" size={16} color={color.danger} />
          <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Đăng xuất" variant="outline" onPress={() => void signOut()} />
      </View>

      {/* --------------------------------------------------- xoá tài khoản */}
      <View className="mt-5 rounded-card border border-danger-soft bg-danger-soft p-3">
        <Text className="font-strong text-body text-danger-ink">Xoá tài khoản</Text>
        <Text className="mt-1 font-sans text-label text-danger-ink">
          Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu học trên máy chủ. Không hoàn tác được.
        </Text>

        {confirmDelete ? (
          <View className="mt-3">
            <Text className="font-mid text-label text-danger-ink">
              Gõ XOA TAI KHOAN để xác nhận:
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              placeholder="XOA TAI KHOAN"
              placeholderTextColor={color.subtle}
              className="mt-1.5 rounded-card border border-danger bg-surface px-3 py-2 font-sans text-body text-ink"
            />
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Button
                label="Xoá vĩnh viễn"
                variant="danger"
                size="sm"
                disabled={confirmText.trim().toUpperCase() !== 'XOA TAI KHOAN'}
                onPress={runDelete}
              />
              <Button
                label="Giữ lại"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setConfirmDelete(false);
                  setConfirmText('');
                }}
              />
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmDelete(true)}
            className="mt-3 self-start rounded-pill border border-danger px-3 py-1.5"
          >
            <Text className="font-strong text-label text-danger-ink">Tôi muốn xoá tài khoản</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

/**
 * Hàng gói trong Cài đặt.
 *
 * Ghi rõ `source` khi gói chưa được máy chủ xác nhận. Hiện tên gói trơn cho một
 * gói mới chỉ nằm trong localStorage là nói quá về thứ mình đang có.
 */
function PlanRow() {
  const { plan, daysLeft: left, source } = usePlanStatus();
  const detail = PLANS[plan];

  return (
    <View className="mt-4 rounded-card border border-border bg-canvas p-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row items-center gap-2">
            <Text className="font-strong text-body text-ink">Gói hiện tại</Text>
            <PlanBadge plan={plan} />
          </View>
          <Text className="mt-1 font-sans text-label text-muted">
            {plan === 'free'
              ? `${detail.tagline} · ${formatVnd(0)}`
              : `${formatVnd(detail.monthlyVnd)}/tháng${left !== null ? ` · còn ${left} ngày` : ''}`}
          </Text>
          {source !== 'server' && plan !== 'free' ? (
            <Text className="mt-1 font-sans text-label text-warning-ink">
              Gói này mới ghi trên máy, máy chủ chưa xác nhận — vì chưa nối cổng thanh toán.
            </Text>
          ) : null}
        </View>
        <Button
          label={plan === 'free' ? 'Xem gói' : 'Đổi gói'}
          variant="outline"
          size="sm"
          onPress={() => router.push('/upgrade' as never)}
        />
      </View>
    </View>
  );
}
