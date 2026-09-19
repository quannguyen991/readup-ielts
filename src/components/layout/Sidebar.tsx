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
import { useLeftEdgeHover } from '@/lib/useHover';
import { color, layout, shadow } from '@/theme/tokens';

/**
 * Sidebar trái — THANH GỌN, bung ra khi rê chuột.
 *
 * Bình thường rộng 68px và chỉ có biểu tượng, nên nó lấy rất ít bề ngang của
 * bài đọc. Rê chuột vào là bung thành thẻ 232px có đủ tên mục, và thẻ bung NẰM
 * ĐÈ lên nội dung chứ không đẩy nội dung sang phải: đẩy thì cả trang chạy ngang
 * mỗi lần chuột đi qua mép trái, chữ nhảy giữa lúc đang đọc.
 *
 * Lúc thu gọn vẫn nhận ra mục đang mở: nền xanh nhạt cộng vạch dọc bên trái.
 * Tiêu đề nhóm nhường chỗ cho một đường kẻ, để dải biểu tượng không thành một
 * cột dài không đầu không cuối.
 *
 * Danh sách mục cuộn được riêng, còn logo và tài khoản đứng yên: 11 mục cộng
 * card streak vượt chiều cao màn hình laptop 13 inch, mà cuộn cả thẻ thì logo
 * trôi mất.
 */
const RAIL_WIDTH = 68;

export function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  // Bung khi chuột vào trong 92px tính từ mép trái, thu lại khi ra quá 260px.
  const hovered = useLeftEdgeHover(RAIL_WIDTH + 24, layout.sidebarWidth + 28);
  // Trên native không có chuột: mở sẵn, và cột nằm trong khung riêng của nó.
  const expanded = hovered || Platform.OS !== 'web';

  return (
    <View className="h-full py-3 pl-3" style={{ width: RAIL_WIDTH + 12, zIndex: 40 }}>
      <View
        className="flex-1 overflow-hidden rounded-card border border-border bg-surface px-3 pb-3 pt-4"
        style={[
          Platform.OS === 'web' ? webShadow : shadow.card,
          { width: expanded ? layout.sidebarWidth : RAIL_WIDTH },
          Platform.OS === 'web'
            ? ({
                transitionProperty: 'width',
                transitionDuration: '180ms',
                transitionTimingFunction: 'ease-out',
              } as object)
            : null,
        ]}
      >
        <View className="px-1">
          <Logo compact markOnly={!expanded} />
        </View>

        <ScrollView
          className="mt-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {groups.map((group, groupIndex) => (
            <View key={group.key} className={groupIndex === 0 ? '' : 'mt-3'}>
              {group.title ? (
                expanded ? (
                  <Text className="mb-1.5 mt-1 px-3 font-strong text-label uppercase tracking-wide text-subtle">
                    {group.title}
                  </Text>
                ) : (
                  <View className="mx-2 mb-2 mt-2 h-px bg-border" />
                )
              ) : null}

              <View className="gap-0.5">
                {group.items.map((item) => {
                  const active = activeKey === item.key;
                  return (
                    <Link key={item.key} href={item.href as never} asChild>
                      <View
                        accessibilityRole="link"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={item.label}
                        className={[
                          'flex-row items-center gap-3 rounded-panel py-2.5',
                          expanded ? 'px-3' : 'px-2',
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
                        {expanded ? (
                          <Text
                            numberOfLines={1}
                            className={[
                              'flex-1 text-body',
                              active ? 'font-semi text-primary-700' : 'font-mid text-body',
                            ].join(' ')}
                          >
                            {item.label}
                          </Text>
                        ) : null}
                      </View>
                    </Link>
                  );
                })}
              </View>
            </View>
          ))}

          {expanded ? <StreakCard /> : null}
        </ScrollView>

        <AccountRow expanded={expanded} />
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
function AccountRow({ expanded }: { expanded: boolean }) {
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const available = useAuthStore((s) => s.available);
  const name = useDisplayName();
  const plan = usePlan();

  if (!signedIn) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng nhập"
        onPress={() => router.push('/auth/sign-in' as never)}
        className={[
          'mt-3 rounded-panel border border-dashed border-borderStrong py-2.5',
          expanded ? 'px-3' : 'px-2',
        ].join(' ')}
      >
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-surfaceAlt">
            <Icon name="plus" size={17} color={color.muted} />
          </View>
          <View className={expanded ? 'flex-1' : 'hidden'}>
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
      accessibilityLabel="Tài khoản"
      onPress={() => router.push('/settings' as never)}
      className="mt-3 flex-row items-center gap-2.5 rounded-panel border border-border px-2.5 py-2"
    >
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100">
        <Text className="font-strong text-body text-accent-700">
          {name.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      {expanded ? (
        <>
          <View className="flex-1">
            <Text className="font-semi text-body text-ink" numberOfLines={1}>
              {name}
            </Text>
            <View className="mt-0.5 flex-row">
              <PlanBadge plan={plan} compact />
            </View>
          </View>
          <Icon name="chevron-right" size={16} color={color.subtle} />
        </>
      ) : null}
    </Pressable>
  );
}
