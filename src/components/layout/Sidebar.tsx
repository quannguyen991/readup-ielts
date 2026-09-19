import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';

import { Logo } from './Logo';
import { Icon } from '@/components/ui/Icon';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey, type NavItem } from '@/navigation/nav-items';
import { usePlan } from '@/store/useBillingStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useRewardStore } from '@/store/useRewardStore';
import { findItem } from '@/services/gamification/shop';
import { color, shadow } from '@/theme/tokens';

/**
 * Sidebar trái — THANH BIỂU TƯỢNG, tên mục hiện khi rê chuột.
 *
 * Rộng đúng 68px và không bao giờ đổi bề ngang: rê vào một biểu tượng thì tên
 * mục hiện ra trong một thẻ nhỏ bên phải nó, chứ cả cột không bung. Bản trước
 * bung cả cột ra 232px, và mỗi lần chuột đi ngang mép trái là một lần mảng đen
 * lớn trồi lên che mất chỗ đang đọc.
 *
 * Mục đang mở nhận ra bằng nền xanh nhạt cộng vạch dọc bên trái. Tiêu đề nhóm
 * nhường chỗ cho một đường kẻ, để dải biểu tượng không thành một cột dài không
 * đầu không cuối.
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

  return (
    <View className="h-full py-3 pl-3" style={{ width: RAIL_WIDTH + 12, zIndex: 40 }}>
      <View
        className="flex-1 items-center rounded-card border border-border bg-surface px-2 pb-3 pt-4"
        style={[Platform.OS === 'web' ? webShadow : shadow.card, { width: RAIL_WIDTH }]}
      >
        <Logo compact markOnly />

        <ScrollView
          className="mt-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {groups.map((group, groupIndex) => (
            <View key={group.key} className={groupIndex === 0 ? '' : 'mt-3'}>
              {group.title ? <View className="mx-2 mb-2 mt-2 h-px bg-border" /> : null}

              <View className="gap-0.5">
                {group.items.map((item) => (
                  <RailItem key={item.key} item={item} active={activeKey === item.key} />
                ))}
              </View>
            </View>
          ))}
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
 * Một biểu tượng trên thanh, kèm thẻ tên hiện khi rê chuột.
 *
 * Thẻ tên đặt tuyệt đối BÊN PHẢI biểu tượng và `pointerEvents="none"`: nó nằm
 * đè lên nội dung, nên nếu ăn được chuột thì con trỏ vừa chạm vào tên là mục
 * bên dưới mất trạng thái rê, thẻ chớp tắt liên tục.
 *
 * Dùng `Pressable` chứ không `View` vì react-native-web chỉ chuyển tiếp
 * `onHoverIn`/`onHoverOut` cho Pressable.
 */
function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <View style={{ position: 'relative' }}>
      <Link href={item.href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: active }}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          className={[
            'h-11 w-11 items-center justify-center rounded-panel',
            active ? 'bg-primary-50' : 'bg-transparent',
          ].join(' ')}
        >
          {active ? (
            <View
              className="absolute left-0 h-5 w-1 rounded-pill bg-primary-600"
              style={{ marginLeft: -6 }}
            />
          ) : null}
          <Icon
            name={item.icon}
            size={20}
            color={active ? color.primary : color.muted}
            strokeWidth={active ? 2.1 : 1.8}
          />
        </Pressable>
      </Link>
      {hovered ? <TooltipCard label={item.label} /> : null}
    </View>
  );
}

/** Bọc một thứ bất kỳ để nó có thẻ tên khi rê chuột. */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <View style={{ position: 'relative' }}>
      <Pressable onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
        {children}
      </Pressable>
      {hovered ? <TooltipCard label={label} /> : null}
    </View>
  );
}

function TooltipCard({ label }: { label: string }) {
  return (
    <View
      pointerEvents="none"
      className="absolute left-full top-1/2 z-50 rounded-panel px-3 py-1.5"
      style={{
        marginLeft: 12,
        transform: [{ translateY: -16 }],
        backgroundColor: '#111827',
        ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 20px rgba(15,23,42,0.28)' } as object) : null),
      }}
    >
      <Text numberOfLines={1} className="font-semi text-label" style={{ color: '#FFFFFF' }}>
        {label}
      </Text>
    </View>
  );
}

function planLabel(plan: string): string {
  return plan === 'free' ? 'Gói Free' : `Gói ${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
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
  // Avatar mua ở Cửa hàng hiện luôn ở đây, để thứ đã đổi điểm có chỗ để thấy.
  const avatarId = useRewardStore((s) => s.avatar);
  const glyph = avatarId ? findItem(avatarId)?.glyph : undefined;

  if (!signedIn) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng nhập"
        onPress={() => router.push('/auth/sign-in' as never)}
        className="mt-3 items-center rounded-panel border border-dashed border-borderStrong p-2"
      >
        <Tooltip label={available ? 'Đăng nhập để giữ tiến độ' : 'Đăng nhập (chưa nối máy chủ)'}>
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-surfaceAlt">
            <Icon name="plus" size={17} color={color.muted} />
          </View>
        </Tooltip>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tài khoản"
      onPress={() => router.push('/settings' as never)}
      className="mt-3 items-center rounded-panel border border-border p-2"
    >
      <Tooltip label={`${name} · ${planLabel(plan)}`}>
        <View className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100">
          <Text className="font-strong text-body text-accent-700" style={glyph ? { fontSize: 18 } : undefined}>
            {glyph ?? name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </Tooltip>
    </Pressable>
  );
}
