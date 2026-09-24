import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router, usePathname } from "expo-router";

import { Logo } from "./Logo";
import { Icon } from "@/components/ui/Icon";
import {
  ADMIN_GROUP,
  NAV_GROUPS,
  activeNavKey,
  parentNavKey,
  type NavItem,
} from "@/navigation/nav-items";
import { usePlan } from "@/store/useBillingStore";
import { useAuthStore, useDisplayName } from "@/store/useAuthStore";
import { useRewardStore } from "@/store/useRewardStore";
import { SIDEBAR_WIDTH, useSidebarStore } from "@/store/useSidebarStore";
import { findItem } from "@/services/gamification/shop";
import { color } from "@/theme/tokens";

/**
 * Thanh bên trái — HIỆN ĐẦY ĐỦ TÊN, thu gọn được về dải biểu tượng.
 *
 * Bản trước chỉ có biểu tượng, tên hiện khi rê chuột: gọn, nhưng người học phải
 * rê qua từng biểu tượng mới biết cái nào là SAT Verbal, cái nào là Từ vựng.
 * Làm được như vậy vì điều hướng đã gộp từ 27 mục phẳng còn 13 mục chính (xem
 * `nav-items.ts`), đủ ngắn để cả cột tên nằm vừa màn laptop.
 *
 * Trang con (Thi thử Reading, Kho bài đọc…) chỉ mở ra dưới mục cha khi đang
 * ở trong mục đó, thụt vào và nhỏ hơn một bậc.
 *
 * Nền trắng liền mép trái, không phải thẻ nổi: thẻ nổi bo góc ăn thêm 12px
 * mỗi bên và đọc như một khối nội dung, trong khi đây là khung của app.
 *
 * `compact`: màn làm bài (phòng thi Reading, đề SAT…) luôn dùng dải biểu tượng —
 * mỗi 170px nhường lại là thêm một cột chữ cho bài đọc. Nút thu gọn ẩn đi vì
 * ở đây không có gì để mở rộng.
 */
export function Sidebar({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const activeParent = parentNavKey(activeKey);
  const stored = useSidebarStore((s) => s.collapsed);
  const collapsed = compact || stored;
  const toggle = useSidebarStore((s) => s.toggle);

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === "admin");
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;
  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;

  return (
    <View
      className="h-full border-r border-border bg-surface"
      style={[{ width, zIndex: 40 }, Platform.OS === "web" ? webShadow : null]}
    >
      <View className={collapsed ? "items-center pb-2 pt-5" : "px-5 pb-2 pt-5"}>
        <Logo compact markOnly={collapsed} />
      </View>

      <ScrollView
        className="mt-2 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: collapsed ? 12 : 14,
          paddingBottom: 12,
        }}
      >
        {groups.map((group, groupIndex) => (
          <View key={group.key} className={groupIndex === 0 ? "" : "mt-4"}>
            {group.title ? (
              collapsed ? (
                <View className="mx-2 mb-2 h-px bg-border" />
              ) : (
                <Text className="mb-1.5 px-3 font-strong text-[12px] uppercase tracking-[1.2px] text-muted">
                  {group.title}
                </Text>
              )
            ) : null}

            <View className="gap-1">
              {group.items.map((item) => {
                const open = activeParent === item.key;
                return (
                  <View key={item.key}>
                    <NavRow
                      item={item}
                      active={activeKey === item.key}
                      parentOfActive={open}
                      collapsed={collapsed}
                    />
                    {open && item.children?.length ? (
                      <View
                        className={
                          collapsed
                            ? "mt-1 gap-1"
                            : "mb-1 ml-6 mt-1 gap-0.5 border-l border-border pl-3"
                        }
                      >
                        {item.children.map((child) => (
                          <NavRow
                            key={child.key}
                            item={child}
                            active={activeKey === child.key}
                            collapsed={collapsed}
                            child
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        className={
          collapsed
            ? "items-center gap-3 px-3 pb-4 pt-2"
            : "gap-3 px-4 pb-4 pt-2"
        }
      >
        {compact ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
            }
            onPress={toggle}
            className="flex-row items-center gap-2 rounded-panel px-2 py-1.5"
          >
            <View
              style={
                collapsed ? { transform: [{ rotate: "180deg" }] } : undefined
              }
            >
              <Icon name="chevron-left" size={18} color={color.muted} />
            </View>
            {collapsed ? null : (
              <Text className="font-semi text-body text-muted">Thu gọn</Text>
            )}
          </Pressable>
        )}
        <AccountRow collapsed={collapsed} />
      </View>
    </View>
  );
}

const webShadow = { boxShadow: "4px 0 24px rgba(15, 23, 42, 0.04)" } as const;

/**
 * Một dòng điều hướng.
 *
 * Mục cha của trang đang mở cũng được tô (nhạt hơn), để người đang ở "Thi thử
 * SAT đầy đủ" vẫn thấy mình đang trong khu SAT Math.
 */
function NavRow({
  item,
  active,
  parentOfActive = false,
  collapsed,
  child = false,
}: {
  item: NavItem;
  active: boolean;
  parentOfActive?: boolean;
  collapsed: boolean;
  child?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const lit = active || (parentOfActive && !child);
  const tint = active ? color.primary : lit ? color.primary : color.muted;
  const bg = active
    ? "bg-primary-50"
    : hovered
      ? "bg-surfaceAlt"
      : "bg-transparent";

  return (
    <View style={{ position: "relative" }}>
      <Link href={item.href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={item.label}
          aria-selected={active}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          className={[
            "flex-row items-center rounded-panel",
            collapsed
              ? `justify-center ${child ? "h-10" : "h-12"}`
              : child
                ? "gap-2.5 px-3 py-2"
                : "gap-3 px-3 py-2.5",
            bg,
          ].join(" ")}
        >
          <Icon
            name={item.icon}
            size={child ? 17 : 21}
            color={tint}
            strokeWidth={lit ? 2.1 : 1.8}
          />
          {collapsed ? null : (
            <Text
              numberOfLines={1}
              className={`flex-1 ${child ? "text-[15px]" : "text-[16px]"} ${lit ? "font-strong" : "font-semi"}`}
              style={{ color: lit ? color.primary : color.ink }}
            >
              {item.label}
            </Text>
          )}
        </Pressable>
      </Link>
      {collapsed && hovered ? <TooltipCard label={item.label} /> : null}
    </View>
  );
}

/**
 * Thẻ tên khi thanh bên thu gọn. `pointerEvents="none"`: nếu nó ăn chuột thì
 * con trỏ vừa chạm vào tên là mục bên dưới mất trạng thái rê, thẻ chớp tắt.
 */
function TooltipCard({ label }: { label: string }) {
  return (
    <View
      pointerEvents="none"
      className="absolute left-full top-1/2 z-50 rounded-panel px-3 py-1.5"
      style={{
        marginLeft: 12,
        transform: [{ translateY: -16 }],
        backgroundColor: "#111827",
        ...(Platform.OS === "web"
          ? ({ boxShadow: "0 8px 20px rgba(15,23,42,0.28)" } as object)
          : null),
      }}
    >
      <Text
        numberOfLines={1}
        className="font-semi text-label"
        style={{ color: "#FFFFFF" }}
      >
        {label}
      </Text>
    </View>
  );
}

function planLabel(plan: string): string {
  return plan === "free"
    ? "Gói Free"
    : `Gói ${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
}

/**
 * Chân thanh bên: chưa đăng nhập thì một nút Đăng nhập rõ ràng; đã đăng nhập
 * thì avatar + tên, dẫn sang Cài đặt.
 */
function AccountRow({ collapsed }: { collapsed: boolean }) {
  const signedIn = useAuthStore((s) => s.status === "signed_in");
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
        onPress={() => router.push("/auth/sign-in" as never)}
        className={`flex-row items-center justify-center gap-2 rounded-panel bg-primary-600 ${collapsed ? "h-11 w-11" : "py-3"}`}
      >
        <Icon name="arrow-right" size={17} color="#FFFFFF" strokeWidth={2.2} />
        {collapsed ? null : (
          <Text className="font-strong text-[15px] text-white">Đăng nhập</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tài khoản"
      onPress={() => router.push("/settings" as never)}
      className={`flex-row items-center gap-3 rounded-panel border border-border ${collapsed ? "p-1.5" : "px-3 py-2"}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100">
        <Text
          className="font-strong text-body text-accent-700"
          style={glyph ? { fontSize: 18 } : undefined}
        >
          {glyph ?? name.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      {collapsed ? null : (
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-strong text-[15px] text-ink">
            {name}
          </Text>
          <Text numberOfLines={1} className="font-sans text-label text-muted">
            {planLabel(plan)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
