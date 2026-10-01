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
import { useL } from '@/i18n/useL';

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
  const { L } = useL();

  if (status !== 'signed_in' || !user) {
    return (
      <Card className="mt-4">
        <SectionHeader
          title={L('Tài khoản', 'Account')}
          subtitle={L('Dữ liệu học đang nằm trên thiết bị này', 'Your study data lives on this device')}
          icon="settings"
          right={<Badge label={available ? L('Chưa đăng nhập', 'Not signed in') : L('Chưa nối máy chủ', 'No server connection')} tone="neutral" />}
        />
        <Text className="mt-3 font-sans text-body text-muted">
          {L('App chạy được đầy đủ mà không cần tài khoản. Đăng nhập chỉ để hai việc: giữ tiến độ khi đổi máy, và không mất dữ liệu nếu xoá trình duyệt.', "The app works fully without an account. Signing in does just two things: keeps your progress when you switch devices, and protects your data if you clear the browser.")}
        </Text>
        <PlanRow />
        <Button
          className="mt-3 self-start"
          label={L('Đăng nhập', 'Sign in')}
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
      setError(L('Tên không được để trống.', "Name can't be empty."));
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
        title={L('Tài khoản', 'Account')}
        subtitle={user.email ?? user.phone ?? L('Đã đăng nhập', 'Signed in')}
        icon="settings"
        right={<Badge label={L('Đã đăng nhập', 'Signed in')} tone="success" />}
      />

      {/* ---------------------------------------------------------- tên */}
      <View className="mt-4">
        <Text className="font-mid text-label text-muted">{L('Tên hiển thị', 'Display name')}</Text>
        {editing ? (
          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              placeholder={L('Tên của bạn', 'Your name')}
              placeholderTextColor={color.subtle}
              className="min-w-[180px] flex-1 rounded-card border border-borderStrong bg-surface px-3 py-2 font-sans text-body text-ink"
            />
            <Button label={L('Lưu', 'Save')} size="sm" onPress={saveName} />
            <Button label={L('Huỷ', 'Cancel')} size="sm" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View className="mt-1.5 flex-row items-center gap-2">
            <Text className="font-strong text-body text-ink">{name}</Text>
            <Button
              label={L('Đổi tên', 'Rename')}
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
            <Text className="font-strong text-body text-ink">{L('Đồng bộ', 'Sync')}</Text>
            <Text className="mt-0.5 font-sans text-label text-muted">{syncLabel}</Text>
          </View>
          <Button
            label={L('Đồng bộ ngay', 'Sync now')}
            size="sm"
            variant="outline"
            loading={syncStatus === 'syncing'}
            onPress={() => void syncNow(user.id, 'merge')}
          />
        </View>
        <Text className="mt-2 font-sans text-label text-muted">
          {L(
            `Đang đồng bộ: ${registeredStoreKeys().join(', ')}. Dữ liệu được GỘP hai chiều — làm bài trên điện thoại lúc mất mạng thì lần đồng bộ sau vẫn giữ nguyên, không bị máy khác ghi đè.`,
            `Syncing: ${registeredStoreKeys().join(', ')}. Data is MERGED both ways — work done offline on your phone is kept on the next sync, never overwritten by another device.`,
          )}
        </Text>
      </View>

      {error ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
          <Icon name="info" size={16} color={color.danger} />
          <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label={L('Đăng xuất', 'Sign out')} variant="outline" onPress={() => void signOut()} />
      </View>

      {/* --------------------------------------------------- xoá tài khoản */}
      <View className="mt-5 rounded-card border border-danger-soft bg-danger-soft p-3">
        <Text className="font-strong text-body text-danger-ink">{L('Xoá tài khoản', 'Delete account')}</Text>
        <Text className="mt-1 font-sans text-label text-danger-ink">
          {L('Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu học trên máy chủ. Không hoàn tác được.', 'Permanently deletes your account and all study data on the server. This cannot be undone.')}
        </Text>

        {confirmDelete ? (
          <View className="mt-3">
            <Text className="font-mid text-label text-danger-ink">
              {L('Gõ XOA TAI KHOAN để xác nhận:', 'Type XOA TAI KHOAN to confirm:')}
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
                label={L('Xoá vĩnh viễn', 'Delete permanently')}
                variant="danger"
                size="sm"
                disabled={confirmText.trim().toUpperCase() !== 'XOA TAI KHOAN'}
                onPress={runDelete}
              />
              <Button
                label={L('Giữ lại', 'Keep it')}
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
            <Text className="font-strong text-label text-danger-ink">{L('Tôi muốn xoá tài khoản', 'I want to delete my account')}</Text>
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
  const { L, en } = useL();

  return (
    <View className="mt-4 rounded-card border border-border bg-canvas p-3">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row items-center gap-2">
            <Text className="font-strong text-body text-ink">{L('Gói hiện tại', 'Current plan')}</Text>
            <PlanBadge plan={plan} />
          </View>
          <Text className="mt-1 font-sans text-label text-muted">
            {plan === 'free'
              ? `${L(detail.tagline, 'Real studying, not a trial')} · ${formatVnd(0, en)}`
              : L(
                  `${formatVnd(detail.monthlyVnd)}/tháng${left !== null ? ` · còn ${left} ngày` : ''}`,
                  `${formatVnd(detail.monthlyVnd)}/month${left !== null ? ` · ${left} days left` : ''}`,
                )}
          </Text>
          {source !== 'server' && plan !== 'free' ? (
            <Text className="mt-1 font-sans text-label text-warning-ink">
              {L('Gói này mới ghi trên máy, máy chủ chưa xác nhận — vì chưa nối cổng thanh toán.', "This plan is only saved on this device and hasn't been confirmed by the server — payments aren't connected yet.")}
            </Text>
          ) : null}
        </View>
        <Button
          label={plan === 'free' ? L('Xem gói', 'See plans') : L('Đổi gói', 'Change plan')}
          variant="outline"
          size="sm"
          onPress={() => router.push('/upgrade' as never)}
        />
      </View>
    </View>
  );
}
