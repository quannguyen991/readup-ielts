import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';

import { Logo } from './Logo';
import { Icon } from '@/components/ui/Icon';
import { IconCircle } from '@/components/ui/IconCircle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PlanBadge } from '@/components/billing/PlanUi';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey } from '@/navigation/nav-items';
import { usePlan } from '@/store/useBillingStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color, layout, shadow } from '@/theme/tokens';

/**
 * Sidebar trái — THẺ NỔI, không dính mép màn hình.
 *
 * Từ chỗ là một cột có viền phải chạm hai mép, giờ nó là một thẻ bo 16px có
 * khoảng thở quanh bốn phía và đổ bóng nhẹ. Đây cũng là chỗ duy nhất còn điều
 * hướng ở khổ desktop, nên nó ôm luôn logo trên đỉnh và tài khoản dưới đáy —
 * hai thứ trước đây nằm ở thanh ngang đã bỏ.
 *
 * Danh sách mục cuộn được riêng, còn logo và tài khoản đứng yên: 11 mục cộng
 * card streak vượt chiều cao màn hình laptop 13 inch, mà cuộn cả thẻ thì logo
 * trôi mất.
 */
export function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  return (
    <View className="h-full py-3 pl-3" style={{ width: layout.sidebarWidth + 12 }}>
      <View
        className="flex-1 rounded-card border border-border bg-surface px-3 pb-3 pt-4"
        style={Platform.OS === 'web' ? webShadow : shadow.card}
      >
        <View className="px-1">
          <Logo />
        </View>

        <ScrollView
          className="mt-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {groups.map((group, groupIndex) => (
            <View key={group.key} className={groupIndex === 0 ? '' : 'mt-4'}>
              {group.title ? (
                <Text className="mb-1.5 px-3 font-strong text-label uppercase tracking-wide text-subtle">
                  {group.title}
                </Text>
              ) : null}

              <View className="gap-0.5">
                {group.items.map((item) => {
                  const active = activeKey === item.key;
                  return (
                    <Link key={item.key} href={item.href as never} asChild>
                      <View
                        accessibilityRole="link"
                        accessibilityState={{ selected: active }}
                        className={[
                          'flex-row items-center gap-3 rounded-panel px-3 py-2.5',
                          active ? 'bg-primary-50' : 'bg-transparent',
                        ].join(' ')}
                      >
                        {/* Vạch chỉ mục đang mở — dấu hiệu thứ hai ngoài màu nền,
                            để người phân biệt màu kém vẫn thấy mình đang ở đâu. */}
                        <View
                          className={[
                            'h-5 w-1 rounded-pill',
                            active ? 'bg-primary-600' : 'bg-transparent',
                          ].join(' ')}
                        />
                        <Icon
                          name={item.icon}
                          size={19}
                          color={active ? color.primary : color.muted}
                          strokeWidth={active ? 2 : 1.7}
                        />
                        <Text
                          className={[
                            'text-body',
                            active ? 'font-semi text-primary-700' : 'font-mid text-body',
                          ].join(' ')}
                        >
                          {item.label}
                        </Text>
                      </View>
                    </Link>
                  );
                })}
              </View>
            </View>
          ))}

          <StreakCard />
        </ScrollView>

        <AccountRow />
      </View>
    </View>
  );
}

/** Bóng đổ mềm hơn `shadow.card` một chút, vì thẻ này cao gần hết màn hình. */
const webShadow = {
  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.07)',
} as const;

/**
 * Card nhịp học — SỐ THẬT CỦA CHÍNH NGƯỜI DÙNG.
 *
 * Bản trước ghi cứng "Chuỗi 7 ngày 🔥" và "45 / 60 phút hôm nay" cho MỌI người,
 * kể cả người vừa mở app lần đầu và chưa học một phút nào. Đó không phải chỗ
 * trống chờ dữ liệu — nó là một con số bịa hiện ra như thật, và nó phá đúng thứ
 * mà cả app đang cố xây: người dùng tin những con số ở đây.
 *
 * Chưa học ngày nào thì nói thẳng là chưa, và mời bắt đầu.
 */
function StreakCard() {
  const daily = useStudyStore((s) => s.daily);
  const goalMinutes = useStudyStore((s) => s.dailyGoalMinutes);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  const minutesToday = Math.round(daily[todayKey]?.minutes ?? 0);

  // Chuỗi ngày: đếm ngược từ hôm nay, dừng ở ngày đầu tiên không học.
  let streak = 0;
  for (let back = 0; back < 400; back += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const minutes = daily[key]?.minutes ?? 0;
    if (minutes > 0) streak += 1;
    // Hôm nay chưa học thì chuỗi chưa đứt — nó chỉ đứt khi HÔM QUA cũng trống.
    else if (back > 0) break;
  }

  const percent = goalMinutes > 0 ? Math.min(100, (minutesToday / goalMinutes) * 100) : 0;

  return (
    <View className="mt-4 items-center rounded-card border border-warning-soft bg-warning-soft px-4 py-4">
      <IconCircle name="flame" tone="warning" size={44} />
      <Text className="mt-2 text-center font-strong text-body text-ink">
        {streak > 0 ? `Chuỗi ${streak} ngày 🔥` : 'Bắt đầu chuỗi hôm nay'}
      </Text>
      <Text className="mt-1 text-center font-sans text-label text-muted">
        {streak > 0
          ? 'Giữ nhịp mỗi ngày là thứ đưa bạn tới đích.'
          : 'Học vài phút thôi cũng tính — cái khó là ngày đầu tiên.'}
      </Text>
      <ProgressBar value={percent} tone="warning" className="mt-3 w-full" />
      <Text className="mt-2 font-mid text-label text-muted">
        {minutesToday} / {goalMinutes} phút hôm nay
      </Text>
    </View>
  );
}

/**
 * Hàng tài khoản dưới đáy sidebar.
 *
 * Chưa đăng nhập thì đây là lời mời, không phải rào chắn: nói rõ dữ liệu đang
 * nằm trên máy này và đăng nhập để mang đi nơi khác. Đã đăng nhập thì nó dẫn
 * sang Cài đặt, nơi có trạng thái đồng bộ và nút đăng xuất.
 */
function AccountRow() {
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const available = useAuthStore((s) => s.available);
  const name = useDisplayName();
  const plan = usePlan();

  if (!signedIn) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/auth/sign-in' as never)}
        className="mt-3 rounded-panel border border-dashed border-borderStrong px-3 py-2.5"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-surfaceAlt">
            <Icon name="plus" size={17} color={color.muted} />
          </View>
          <View className="flex-1">
            <Text className="font-semi text-body text-ink">Đăng nhập</Text>
            <Text className="font-sans text-label text-muted" numberOfLines={1}>
              {available ? 'Để giữ tiến độ khi đổi máy' : 'Chưa nối máy chủ'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/settings' as never)}
      className="mt-3 flex-row items-center gap-2.5 rounded-panel border border-border px-2.5 py-2"
    >
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100">
        <Text className="font-strong text-body text-accent-700">
          {name.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-semi text-body text-ink" numberOfLines={1}>
          {name}
        </Text>
        <View className="mt-0.5 flex-row">
          <PlanBadge plan={plan} compact />
        </View>
      </View>
      <Icon name="chevron-right" size={16} color={color.subtle} />
    </Pressable>
  );
}
