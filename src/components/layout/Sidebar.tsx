import React, { useState } from "react";
import { useL, useLocale } from "@/i18n/useL";
import { LanguageSwitch } from "./LanguageSwitch";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router, usePathname } from "expo-router";

import { Logo } from "./Logo";
import { SidebarSearchTrigger } from "@/components/search/SearchTrigger";
import { Icon } from "@/components/ui/Icon";
import {
  ADMIN_GROUP,
  NAV_GROUPS,
  visibleGroups,
  activeNavKey,
  parentNavKey,
  type NavItem,
  navLabel,
} from "@/navigation/nav-items";
import { useCityAvailable } from "@/services/city/availability";
import { usePlan } from "@/store/useBillingStore";
import { useAuthStore, useDisplayName } from "@/store/useAuthStore";
import { skinOf, useRewardStore } from "@/store/useRewardStore";
import { useStarBalance } from "@/store/useStarBalance";
import { AvatarBadge } from "@/components/profile/AnimatedAvatar";
import { SIDEBAR_WIDTH, useSidebarStore } from "@/store/useSidebarStore";
import { formatStars } from "@/services/gamification/shop";
import {
  GLASS_SIDEBAR_THEME,
  SidebarAtmosphereOverlay,
  useSidebarTheme,
  type SidebarThemeConfig,
} from "./SidebarAtmosphere";

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
export function Sidebar({ compact = false, glass = false }: { compact?: boolean; /** Trong suốt, chỉ biểu tượng (màn học có nền toa tàu). */ glass?: boolean }) {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const activeParent = parentNavKey(activeKey);
  const stored = useSidebarStore((s) => s.collapsed);
  const collapsed = compact || stored;
  const toggle = useSidebarStore((s) => s.toggle);
  const { L, locale } = useL();

  const theme = useSidebarTheme();
  const themeConfig = glass ? GLASS_SIDEBAR_THEME : theme.themeConfig;
  const activeEffect = glass ? null : theme.activeEffect;

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === "admin");
  const desktop = useCityAvailable();
  const groups = visibleGroups(isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, desktop);
  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;

  return (
    <View
      className="h-full relative overflow-hidden"
      style={[
        {
          width,
          zIndex: 40,
          borderRightWidth: 1,
          borderRightColor: themeConfig.borderRightColor,
        },
        themeConfig.bgStyle,
        Platform.OS === "web" && !glass ? webShadow : null,
      ]}
    >
      {/* Lớp hiệu ứng hạt khí quyển (Hoa anh đào, Bầu trời sao & mưa sao băng, Tuyết, Lá phong, Ma trận...) */}
      <SidebarAtmosphereOverlay effect={activeEffect} isDark={themeConfig.isDark} />

      <View className={collapsed ? "items-center pb-2 pt-5" : "px-5 pb-2 pt-5"}>
        <Logo compact markOnly={collapsed} />
      </View>

      {/* Ô tìm bài (mở bảng tìm kiếm có AI) — ngay trên danh sách mục. */}
      <View className={collapsed ? "mt-2 items-center" : "mt-2 px-[14px]"}>
        <SidebarSearchTrigger
          collapsed={collapsed}
          tone={{
            text: themeConfig.textPrimary,
            muted: themeConfig.textMuted,
            hover: themeConfig.hoverBg,
            border: themeConfig.isDark ? "rgba(255,255,255,0.16)" : "rgba(184,149,90,0.38)",
            isDark: themeConfig.isDark,
          }}
        />
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
                <View
                  className="mx-2 mb-2 h-px"
                  style={{
                    backgroundColor: themeConfig.isDark
                      ? "rgba(255,255,255,0.12)"
                      : "#F6F3EE",
                  }}
                />
              ) : (
                <Text
                  className="mb-1.5 px-3 font-strong text-[12px] uppercase tracking-[1.2px]"
                  style={{ color: themeConfig.textMuted }}
                >
                  {group.title === "Quản trị" ? L("Quản trị", "Admin") : group.title}
                </Text>
              )
            ) : null}

            <View className="gap-1">
              {group.items.map((item) => {
                const open = activeParent === item.key;
                const activeChild = item.children?.find((c) => c.key === activeKey);
                return (
                  <View key={item.key}>
                    <NavRow
                      item={item}
                      active={activeKey === item.key}
                      parentOfActive={open}
                      collapsed={collapsed}
                      subtitle={open && activeChild ? navLabel(activeChild, locale) : undefined}
                      themeConfig={themeConfig}
                    />
                    {/* Thu gọn thì chỉ còn sáu biểu tượng lớn — không bày trang con. */}
                    {open && !collapsed && item.children?.length ? (
                      <View className="mb-2 ml-4 mt-1.5 gap-0.5">
                        {item.children.map((child) => (
                          <NavRow
                            key={child.key}
                            item={child}
                            active={activeKey === child.key}
                            collapsed={collapsed}
                            child
                            themeConfig={themeConfig}
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
            ? "items-center gap-2 px-3 pb-4 pt-2"
            : "gap-2 px-4 pb-4 pt-2"
        }
      >
        {compact ? null : <LanguageSwitch tone={themeConfig.isDark ? "dark" : "light"} compact={collapsed} />}
        {compact ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              collapsed ? L("Mở rộng thanh bên", "Expand sidebar") : L("Thu gọn thanh bên", "Collapse sidebar")
            }
            onPress={toggle}
            className="flex-row items-center gap-2 rounded-panel px-2 py-1.5"
            style={{ backgroundColor: themeConfig.hoverBg }}
          >
            <View
              style={
                collapsed ? { transform: [{ rotate: "180deg" }] } : undefined
              }
            >
              <Icon name="chevron-left" size={18} color={themeConfig.textMuted} />
            </View>
            {collapsed ? null : (
              <Text
                className="font-semi text-body"
                style={{ color: themeConfig.textMuted }}
              >
                {L("Thu gọn", "Collapse")}
              </Text>
            )}
          </Pressable>
        )}
        <AccountRow collapsed={collapsed} themeConfig={themeConfig} />
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
  subtitle,
  themeConfig,
}: {
  item: NavItem;
  active: boolean;
  parentOfActive?: boolean;
  collapsed: boolean;
  child?: boolean;
  /** Tên trang con đang mở, in nhỏ dưới tên mục lớn. */
  subtitle?: string;
  themeConfig: SidebarThemeConfig;
}) {
  const [hovered, setHovered] = useState(false);
  // Mục lớn: tô khối khi chính nó hoặc một trang con của nó đang mở.
  const locale = useLocale();
  const label = navLabel(item, locale);
  const filled = !child && (active || parentOfActive);
  const lit = filled || active;
  const tint = filled ? themeConfig.activeTextColor : active ? themeConfig.textPrimary : themeConfig.textMuted;

  return (
    <View style={{ position: "relative" }}>
      <Link href={item.href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={label}
          aria-selected={active}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          className={[
            "flex-row items-center rounded-2xl",
            collapsed
              ? `justify-center ${child ? "h-10" : "h-12"}`
              : child
                ? "gap-2.5 px-3 py-2"
                : "gap-3 px-3 py-3",
          ].join(" ")}
          style={
            filled
              ? ({
                  backgroundColor: themeConfig.activeFill,
                  ...(Platform.OS === "web"
                    ? { backgroundImage: themeConfig.activeGradient, boxShadow: themeConfig.activeGlow }
                    : null),
                } as object)
              : hovered || active
                ? { backgroundColor: themeConfig.hoverBg }
                : undefined
          }
        >
          <Icon
            name={item.icon}
            size={child ? 17 : 21}
            color={tint}
            strokeWidth={lit ? 2.1 : 1.8}
          />
          {collapsed ? null : (
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className={`${child ? "text-[15px]" : "text-[16px]"} ${lit ? "font-strong" : "font-semi"}`}
                style={{ color: filled ? themeConfig.activeTextColor : child && !active ? themeConfig.textMuted : themeConfig.textPrimary }}
              >
                {label}
              </Text>
              {subtitle ? (
                <Text numberOfLines={1} className="font-semi text-[12px]" style={{ color: themeConfig.activeTextColor, opacity: 0.85 }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
        </Pressable>
      </Link>
      {collapsed && hovered ? <TooltipCard label={label} /> : null}
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

function planLabel(plan: string, en: boolean): string {
  const name = plan.charAt(0).toUpperCase() + plan.slice(1);
  return en ? `${name} plan` : `Gói ${name}`;
}

/**
 * Chân thanh bên: chưa đăng nhập thì một nút Đăng nhập rõ ràng; đã đăng nhập
 * thì avatar + tên + số sao, dẫn sang trang Hồ sơ.
 */
function AccountRow({ collapsed, themeConfig }: { collapsed: boolean; themeConfig: SidebarThemeConfig }) {
  const signedIn = useAuthStore((s) => s.status === "signed_in");
  const name = useDisplayName();
  const plan = usePlan();
  const { L, en } = useL();
  // Avatar đổi bằng sao hiện luôn ở đây (kể cả avatar động), để thứ đã đổi có chỗ để thấy.
  const avatarId = useRewardStore((s) => s.avatar);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const stars = useStarBalance();

  if (!signedIn) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L("Đăng nhập", "Sign in")}
        onPress={() => router.push("/auth/sign-in" as never)}
        className={`flex-row items-center justify-center gap-2 rounded-panel ${collapsed ? "h-11 w-11" : "py-3"}`}
        style={
          {
            backgroundColor: themeConfig.activeFill,
            ...(Platform.OS === "web" ? { backgroundImage: themeConfig.activeGradient } : null),
          } as object
        }
      >
        <Icon name="arrow-right" size={17} color={themeConfig.activeTextColor} strokeWidth={2.2} />
        {collapsed ? null : (
          <Text className="font-strong text-[15px]" style={{ color: themeConfig.activeTextColor }}>
            {L("Đăng nhập", "Sign in")}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Hồ sơ của ${name}`, `${name}'s profile`)}
      onPress={() => router.push("/profile" as never)}
      className={`flex-row items-center gap-3 rounded-panel ${collapsed ? "p-1.5" : "px-3 py-2"}`}
      style={{
        borderWidth: 1,
        borderColor: themeConfig.isDark ? "rgba(255,255,255,0.14)" : "#F6F3EE",
        backgroundColor: themeConfig.hoverBg,
      }}
    >
      <AvatarBadge avatarId={avatarId} name={name} size={36} skin={skin} />
      {collapsed ? null : (
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-strong text-[15px]" style={{ color: themeConfig.textPrimary }}>
            {name}
          </Text>
          <Text numberOfLines={1} className="font-sans text-label" style={{ color: themeConfig.textMuted }}>
            {planLabel(plan, en)} · ⭐ {formatStars(stars)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
