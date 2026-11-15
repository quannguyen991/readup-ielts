import React, { useState } from "react";
import { useL, useLocale } from "@/i18n/useL";
import { LanguageSwitch } from "./LanguageSwitch";
import { Image, Platform, Pressable, ScrollView, Text, View, type ViewStyle } from "react-native";
import { Link, router, usePathname } from "expo-router";

import { Logo } from "./Logo";
import { SidebarMosaic } from "./SidebarMosaic";
import { ensureTaskMotionCss } from "@/components/motion/task-motion";

ensureTaskMotionCss();
import { Icon } from "@/components/ui/Icon";
import { ADMIN_GROUP, NAV_ITEMS, NAV_LABEL_EN, activeNavKey, parentNavKey, navLabel } from "@/navigation/nav-items";
import { SIDEBAR_GROUPS, activeSidebarKey, type SidebarGroup, type SidebarItem } from "@/navigation/sidebar-items";
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
import {
  SidebarStickerWindow,
} from "./SidebarCuteStickers";
import { pixelPageBg, type PixelTheme } from "@/components/pixel-theme/pixel-art";
import { PT } from "@/components/pixel-theme/pixel-ui";
import { PIXEL_NAV_ICON } from "@/components/pixel-theme/pixel-nav-icons";
import { PixelBob } from "@/components/pixel-theme/pixel-fx";
import { EaSidebarArt, useEaSidebar } from "@/components/vocab/eastasia/useEaSidebar";

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
export function Sidebar({ compact = false, expanded = false, glass = false }: { compact?: boolean; /** Luôn mở rộng, không có nút thu gọn (khu Speaking). */ expanded?: boolean; /** Trong suốt, chỉ biểu tượng (màn học có nền cảnh bay). */ glass?: boolean }) {
  const pathname = usePathname();
  // Thanh bên pixel chỉ dùng cho theme máy chơi điện tử (mua trong Đổi quà); màn làm bài (compact) và nền cảnh (glass) giữ thanh bên cũ.
  const arcadeTheme = useRewardStore((s) => s.theme === "theme-arcade");
  const pixel = compact || glass || !arcadeTheme ? null : PT;
  const activeKey = activeSidebarKey(pathname);
  // Trang con đang mở (nếu có) — in nhỏ dưới tên mục lớn.
  const navActiveKey = activeNavKey(pathname);
  const navActiveItem = NAV_ITEMS.find((n) => n.key === navActiveKey);
  const stored = useSidebarStore((s) => s.collapsed);
  const collapsed = compact || (!expanded && stored);
  const toggle = useSidebarStore((s) => s.toggle);
  const { L, locale } = useL();

  const theme = useSidebarTheme();
  const chiikawaTheme = useRewardStore((s) => s.theme === "theme-chiikawa");
  // Khu Tiếng Trung / Tiếng Nhật: thanh bên đổi theo skin người học chọn (màn làm bài và nền cảnh giữ nguyên).
  const ea = useEaSidebar();
  const eaOn = !!ea && !compact && !glass && !pixel;
  const themeConfig = glass ? GLASS_SIDEBAR_THEME : eaOn ? ea!.config : theme.themeConfig;
  const activeEffect = glass || pixel ? null : theme.activeEffect;

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === "admin");
  const groups: (SidebarGroup & { title?: string })[] = isAdmin
    ? [
        ...SIDEBAR_GROUPS,
        {
          key: "admin",
          title: "Quản trị",
          items: ADMIN_GROUP.items.map((i) => ({ key: i.key, label: i.label, labelEn: NAV_LABEL_EN[i.key] ?? i.label, href: i.href, icon: i.icon, tint: "#E4E4EA" })),
        },
      ]
    : SIDEBAR_GROUPS;
  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  // Thanh bên nổi: bo góc, cách mép trái/trên/dưới FLOAT_GAP. Bề rộng trừ đi FLOAT_GAP nên cả khối
  // vẫn chiếm đúng `width`, vùng nội dung (lg:pl-[248px]) không phải đổi.
  const floating = !compact && !glass && !pixel;
  // Lớp khối pastel theo hero chỉ cho theme mặc định; theme khác giữ nguyên.
  const mosaic = !glass && !pixel && !chiikawaTheme && themeConfig.id === "default";

  return (
    <View
      className={floating ? "relative overflow-hidden" : "h-full relative overflow-hidden"}
      style={[
        {
          width: floating ? width - FLOAT_GAP : width,
          zIndex: 40,
          borderRightWidth: pixel ? pixel.bw : 1,
          borderRightColor: pixel ? pixel.line : themeConfig.borderRightColor,
        },
        floating ? floatingFrame(themeConfig) : null,
        pixel ? pixelPageBg(pixel) : themeConfig.bgStyle,
        Platform.OS === "web" && !glass && !pixel ? (floating ? floatingShadow(themeConfig.isDark) : webShadow) : null,
        Platform.OS === "web" ? webWidthTransition : null,
      ]}
    >
      {/* Lớp hiệu ứng hạt khí quyển (Hoa anh đào, Bầu trời sao & mưa sao băng, Tuyết, Lá phong, Ma trận...) */}
      <SidebarAtmosphereOverlay effect={activeEffect} isDark={themeConfig.isDark} />
      {eaOn ? <EaSidebarArt skin={ea!.skin} /> : null}
      {mosaic ? <SidebarMosaic /> : null}

      <View className={collapsed ? "items-center pb-2 pt-5" : "px-5 pb-2 pt-5"}>
        <Logo compact markOnly={collapsed} color={eaOn ? themeConfig.textPrimary : undefined} />
      </View>

      {/* Cửa sổ sticker kiểu desktop; ẩn khi thu gọn để giữ chỗ cho điều hướng. */}
      {chiikawaTheme && !collapsed && !glass && !pixel ? (
        <View className="mt-2 px-[14px]">
          <SidebarStickerWindow />
        </View>
      ) : null}

      <ScrollView
        className="mt-2 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: collapsed ? 12 : 10,
          // Chừa chút chỗ để ngôi sao trên mục đầu tiên đang chọn không bị cắt bởi vùng cuộn.
          paddingTop: collapsed ? 0 : 12,
          paddingBottom: 12,
        }}
      >
        {groups.map((group, groupIndex) => (
          <View key={group.key} className={groupIndex === 0 ? "" : "mt-4"}>
            {group.key === "more" || group.key === "admin" ? <SectionDivider collapsed={collapsed} dark={themeConfig.isDark} /> : null}
            {group.key === "admin" && group.title ? (
              collapsed ? (
                <View
                  className="mx-2 mb-2 h-px"
                  style={{
                    backgroundColor: themeConfig.isDark
                      ? "rgba(255,255,255,0.12)"
                      : "#F3F0FB",
                  }}
                />
              ) : (
                <View className="mb-1.5 flex-row items-center gap-1.5 px-3">
                  <Text
                    className="font-strong text-[12px] uppercase tracking-[1.2px]"
                    style={{ color: themeConfig.textMuted }}
                  >
                    {group.title === "Quản trị" ? L("Quản trị", "Admin") : group.title}
                  </Text>
                  {chiikawaTheme ? <Text className="ml-auto text-[10px]" style={{ color: "#E4A0B4" }}>✦</Text> : null}
                </View>
              )
            ) : null}

            {/*
              Danh sách PHẲNG như bản tham chiếu (AIO English): mỗi mục lớn một dòng, không xổ
              trang con dưới mục. Trang con vẫn mở được từ nút "Khám phá" trên TopBar và từ trang
              của mục; mục đang mở chỉ ghi nhỏ tên trang con ngay dưới tên mục.
            */}
            <View className="gap-0.5">
              {group.items.map((item) => {
                const active = activeKey === item.key;
                // Tên trang con đang mở (vd. "Thi thử Reading" dưới IELTS); bỏ khi trang con chính là trang của mục.
                const sub =
                  active && item.navKey && navActiveItem && navActiveItem.href !== item.href && parentNavKey(navActiveKey) === item.navKey
                    ? navLabel(navActiveItem, locale)
                    : undefined;
                return (
                  <NavRow
                    key={item.key}
                    item={item}
                    active={active}
                    collapsed={collapsed}
                    subtitle={sub}
                    themeConfig={themeConfig}
                    chiikawaTheme={chiikawaTheme}
                    pixel={pixel}
                  />
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
        {compact || expanded ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              collapsed ? L("Mở rộng thanh bên", "Expand sidebar") : L("Thu gọn thanh bên", "Collapse sidebar")
            }
            onPress={toggle}
            className={collapsed ? "h-11 w-11 items-center justify-center rounded-panel" : "flex-row items-center gap-2 rounded-panel px-2 py-1.5"}
            style={pixel ? { backgroundColor: pixel.paper, borderWidth: 2, borderColor: pixel.line, borderRadius: pixel.radius } : { backgroundColor: themeConfig.hoverBg }}
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
        <AccountRow collapsed={collapsed} themeConfig={themeConfig} pixel={pixel} />
      </View>
    </View>
  );
}

/** Khoá icon pixel của thanh bên cũ cho các mục đổi tên. */
const PIXEL_KEY: Record<string, string> = { today: "dashboard", vocab: "vocabulary", friends: "me" };

/** Đường kẻ ngăn nhóm học với nhóm phụ (thu gọn thì ngắn lại). */
function SectionDivider({ collapsed, dark }: { collapsed: boolean; dark: boolean }) {
  return <View className={collapsed ? "mx-2 mb-2 h-px" : "mx-3 mb-2 h-px"} style={{ backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(120,96,60,0.16)" }} />;
}

const webShadow = { boxShadow: "4px 0 24px rgba(15, 23, 42, 0.04)" } as const;

/** Chuyển bề rộng mượt khi thu gọn / mở rộng (chỉ web; native đổi tức thì). */
const webWidthTransition = { transition: "width 240ms cubic-bezier(0.2, 0.8, 0.2, 1)" } as unknown as ViewStyle;

/** Khoảng cách từ thanh bên nổi tới mép trái, trên và dưới màn hình. */
const FLOAT_GAP = 12;

/** Khung thanh bên nổi: bo góc, viền đều; chiều cao lấp phần còn lại của lớp bọc. */
function floatingFrame(t: SidebarThemeConfig) {
  return {
    flex: 1,
    marginLeft: FLOAT_GAP,
    marginTop: FLOAT_GAP,
    marginBottom: FLOAT_GAP,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: t.borderRightColor,
  };
}

/** Bóng đổ nhẹ, để thanh bên lơ lửng trên nền trang. */
function floatingShadow(isDark: boolean) {
  return {
    boxShadow: isDark
      ? "0 22px 44px -18px rgba(0, 0, 0, 0.6)"
      : "0 18px 40px -16px rgba(92, 64, 22, 0.32), 0 2px 8px rgba(92, 64, 22, 0.07)",
  } as const;
}

/** Dòng điều hướng kiểu pixel: khung đậm, mục đang mở tô lilac kèm bóng lệch đặc. */
function pixelRowStyle(t: PixelTheme, filled: boolean, active: boolean, hovered: boolean) {
  const base = { backgroundImage: "none", backgroundColor: "transparent", borderRadius: t.radius, borderWidth: 2, borderColor: "transparent", boxShadow: "none" };
  if (filled) return { ...base, backgroundColor: t.fillTop, borderColor: t.line, boxShadow: t.elevBtn };
  if (active || hovered) return { ...base, backgroundColor: t.paper, borderColor: t.line };
  return base;
}

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
  chiikawaTheme,
  pixel,
}: {
  item: SidebarItem;
  active: boolean;
  parentOfActive?: boolean;
  collapsed: boolean;
  child?: boolean;
  /** Tên trang con đang mở, in nhỏ dưới tên mục lớn. */
  subtitle?: string;
  themeConfig: SidebarThemeConfig;
  chiikawaTheme: boolean;
  pixel?: PixelTheme | null;
}) {
  const [hovered, setHovered] = useState(false);
  // Mục lớn: tô khối khi chính nó hoặc một trang con của nó đang mở.
  const locale = useLocale();
  const label = locale === "en" ? item.labelEn : item.label;
  const filled = !child && (active || parentOfActive);
  const lit = filled || active;
  const tint = filled ? themeConfig.activeTextColor : active ? themeConfig.textPrimary : themeConfig.textMuted;
  // Chỉ mục cha có icon pixel; trang con giữ icon nét mảnh cho gọn.
  const pixelIcon = pixel && !child ? PIXEL_NAV_ICON[PIXEL_KEY[item.key] ?? item.key] : undefined;
  // Ô pastel sau biểu tượng mục lớn (bỏ khi theme tối / pixel).
  const tile = !child && !pixel && !themeConfig.isDark ? item.tint : undefined;

  return (
    <View style={{ position: "relative" }}>
      <Link href={item.href as never} prefetch asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={label}
          aria-selected={active}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          className={[
            "flex-row items-center rounded-2xl rm-nav",
            // Mục đang chọn (tô vàng) thở nhẹ quầng sáng; trên web, không kể chủ đề pixel.
            filled && Platform.OS === "web" && !pixel ? "rm-glow" : "",
            collapsed
              ? `justify-center ${child ? "h-10" : "h-12"}`
              : child
                ? "gap-2.5 px-3 py-2"
                : "gap-2.5 px-2 py-1.5",
          ].join(" ")}
          // Một object phẳng, KHÔNG phải hàm hay mảng: Link asChild gộp style của con bằng Slot,
          // và cách gộp đó làm mất nền của mục đang mở (thanh bên mất dấu "đang ở đâu").
          style={
            {
              ...(filled
                ? {
                    backgroundColor: themeConfig.activeFill,
                    ...(Platform.OS === "web"
                      ? { backgroundImage: themeConfig.activeGradient, boxShadow: themeConfig.activeGlow }
                      : null),
                  }
                : hovered || active
                  ? { backgroundColor: themeConfig.hoverBg }
                  : null),
              // Nổi nhẹ khi rê chuột; trên web chuyển động có transition để mượt.
              transform: [{ scale: hovered && !filled ? 1.02 : 1 }],
              ...(Platform.OS === "web" ? { transition: "transform 180ms ease, background-color 180ms ease" } : null),
              ...(pixel ? pixelRowStyle(pixel, filled, active, hovered) : null),
            } as object
          }
        >
          <View
            className="relative items-center justify-center rm-ico"
            style={
              pixelIcon
                ? { width: pixelIcon.w, height: pixelIcon.h }
                : tile && !collapsed
                  ? { width: 32, height: 32, borderRadius: 10, backgroundColor: tile }
                  : { width: 28, height: 28 }
            }
          >
            {pixelIcon ? (
              active ? (
                <PixelBob amplitude={3} period={1200}>
                  <Image source={pixelIcon.src} style={{ width: pixelIcon.w, height: pixelIcon.h }} />
                </PixelBob>
              ) : (
                <Image source={pixelIcon.src} style={{ width: pixelIcon.w, height: pixelIcon.h }} />
              )
            ) : (
              <Icon
                name={item.icon}
                size={child ? 17 : 21}
                color={tint}
                strokeWidth={lit ? 2.1 : 1.8}
              />
            )}
          </View>
          {collapsed ? null : (
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className={`text-[14px] ${lit ? "font-strong" : "font-semi"}`}
                style={{ color: pixel ? pixel.text : filled ? themeConfig.activeTextColor : child && !active ? themeConfig.textMuted : themeConfig.textPrimary }}
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
      {chiikawaTheme && !collapsed && !child && !pixel && (active || parentOfActive) ? (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", right: 0, top: 0, width: 106, height: 60, zIndex: 5 }}>
          <Image
            source={require('../../../assets/illustrations/cute-home/task-stickers/chiikawa-taskbar-single.png')}
            resizeMode="contain"
            style={{ width: 106, height: 60 }}
          />
        </View>
      ) : null}
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
function AccountRow({ collapsed, themeConfig, pixel }: { collapsed: boolean; themeConfig: SidebarThemeConfig; pixel?: PixelTheme | null }) {
  const signedIn = useAuthStore((s) => s.status === "signed_in");
  const name = useDisplayName();
  const plan = usePlan();
  const { L, en } = useL();
  // Avatar đổi bằng sao hiện luôn ở đây (kể cả avatar động), để thứ đã đổi có chỗ để thấy.
  const avatarId = useRewardStore((s) => s.avatar);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const stars = useStarBalance();
  // Khai báo ngay trong hàm: nhánh đã đăng nhập dùng nó (viền thẻ tài khoản). Thiếu dòng này là ReferenceError làm trắng cả trang.
  const chiikawaTheme = useRewardStore((s) => s.theme === "theme-chiikawa");

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
            ...(pixel ? { backgroundImage: "none", backgroundColor: pixel.fillTop, borderWidth: pixel.bw, borderColor: pixel.line, borderRadius: pixel.radius, boxShadow: pixel.elevBtn } : null),
          } as object
        }
      >
        <Icon name="arrow-right" size={17} color={pixel ? pixel.line : themeConfig.activeTextColor} strokeWidth={2.2} />
        {collapsed ? null : (
          <Text className="font-strong text-[15px]" style={{ color: pixel ? pixel.line : themeConfig.activeTextColor }}>
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
        borderColor: themeConfig.isDark ? "rgba(255,255,255,0.14)" : chiikawaTheme ? "#F0B6C9" : "#F3F0FB",
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
