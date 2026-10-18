import React, { useState } from "react";
import { useL, useLocale } from "@/i18n/useL";
import { LanguageSwitch } from "./LanguageSwitch";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router, usePathname } from "expo-router";

import { Logo } from "./Logo";
import { LionMascot } from "@/components/mascot/LionMascot";
import { ensureTaskMotionCss } from "@/components/motion/task-motion";

ensureTaskMotionCss();
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
import { useIeltsFocusStore } from "@/store/useIeltsFocusStore";
import { useSatFocusStore } from "@/store/useSatFocusStore";
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
import {
  SidebarStickerWindow,
} from "./SidebarCuteStickers";
import { pixelPageBg, type PixelTheme } from "@/components/pixel-theme/pixel-art";
import { PT } from "@/components/pixel-theme/pixel-ui";
import { PIXEL_NAV_ICON } from "@/components/pixel-theme/pixel-nav-icons";
import { PixelBob } from "@/components/pixel-theme/pixel-fx";

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
  const activeKey = activeNavKey(pathname);
  const activeParent = parentNavKey(activeKey);
  const stored = useSidebarStore((s) => s.collapsed);
  const collapsed = compact || (!expanded && stored);
  const toggle = useSidebarStore((s) => s.toggle);
  const { L, locale } = useL();

  const theme = useSidebarTheme();
  const chiikawaTheme = useRewardStore((s) => s.theme === "theme-chiikawa");
  const themeConfig = glass ? GLASS_SIDEBAR_THEME : theme.themeConfig;
  const activeEffect = glass || pixel ? null : theme.activeEffect;

  // Nhóm Quản trị chỉ nối vào khi hồ sơ trên MÁY CHỦ nói vai trò là admin.
  // Đây chỉ là ẩn/hiện nút; quyền thật nằm ở `src/services/admin/guard.ts`.
  const isAdmin = useAuthStore((s) => s.profile?.role === "admin");
  const desktop = useCityAvailable();
  const ieltsFeatures = useIeltsFocusStore((s) => s.features);
  const satFeatures = useSatFocusStore((s) => s.features);
  const groups = visibleGroups(isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, desktop, ieltsFeatures, satFeatures);
  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  // Thanh bên nổi: bo góc, cách mép trái/trên/dưới FLOAT_GAP. Bề rộng trừ đi FLOAT_GAP nên cả khối
  // vẫn chiếm đúng `width`, vùng nội dung (lg:pl-[248px]) không phải đổi.
  const floating = !compact && !glass && !pixel;

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
            border: themeConfig.isDark ? "rgba(255,255,255,0.16)" : chiikawaTheme ? "#F0B6C9" : "rgba(184,149,90,0.38)",
            isDark: themeConfig.isDark,
          }}
        />
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
          paddingHorizontal: collapsed ? 12 : 14,
          // Chừa chút chỗ để ngôi sao trên mục đầu tiên đang chọn không bị cắt bởi vùng cuộn.
          paddingTop: collapsed ? 0 : 12,
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
                      chiikawaTheme={chiikawaTheme}
                      pixel={pixel}
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
                            chiikawaTheme={chiikawaTheme}
                            pixel={pixel}
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
        {compact || expanded ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              collapsed ? L("Mở rộng thanh bên", "Expand sidebar") : L("Thu gọn thanh bên", "Collapse sidebar")
            }
            onPress={toggle}
            className="flex-row items-center gap-2 rounded-panel px-2 py-1.5"
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

const webShadow = { boxShadow: "4px 0 24px rgba(15, 23, 42, 0.04)" } as const;

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
  item: NavItem;
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
  const label = navLabel(item, locale);
  const filled = !child && (active || parentOfActive);
  const lit = filled || active;
  const tint = filled ? themeConfig.activeTextColor : active ? themeConfig.textPrimary : themeConfig.textMuted;
  // Chỉ mục cha có icon pixel; trang con giữ icon nét mảnh cho gọn.
  const pixelIcon = pixel && !child ? PIXEL_NAV_ICON[item.key] : undefined;
  // Sư tử và ngôi sao chỉ cho mục lớn đang được tô (không áp dụng Chiikawa hay thanh bên pixel).
  const decorated = filled && !collapsed && !child && !chiikawaTheme && !pixel;

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
                : "gap-3 px-3 py-3",
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
          <View className="relative h-7 w-7 items-center justify-center rm-ico" style={pixelIcon ? { width: pixelIcon.w, height: pixelIcon.h } : undefined}>
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
            <View className="min-w-0 flex-1" style={decorated ? { paddingRight: 36 } : undefined}>
              <Text
                numberOfLines={1}
                className={`${child ? "text-[15px]" : "text-[16px]"} ${lit ? "font-strong" : "font-semi"}`}
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
      {/* Sư tử ngủ nằm GỌN TRONG nút đang được tô vàng, giữa chiều cao nút. */}
      {decorated ? (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, bottom: 0, right: 8, justifyContent: "center", zIndex: 6 }}>
          <LionMascot pose="sleep" size={40} />
        </View>
      ) : null}
      {/* Ngôi sao nhỏ lấp lánh quanh nút đang chọn (chỉ web). */}
      {decorated && Platform.OS === "web" ? <ActiveSparkles /> : null}
      {collapsed && hovered ? <TooltipCard label={label} /> : null}
    </View>
  );
}

/** Vị trí và cỡ các ngôi sao quanh nút đang chọn (px; số âm là lấn ra ngoài mép nút). */
const SPARKS: { top?: number; bottom?: number; left?: number; right?: number; size: number; delay: number }[] = [
  { top: -8, left: -6, size: 14, delay: 0 },
  { top: -6, right: 58, size: 9, delay: 0.9 },
  { bottom: 6, left: -9, size: 9, delay: 1.5 },
  { bottom: -8, right: 4, size: 12, delay: 0.5 },
];

/**
 * Các ngôi sao lấp lánh quanh mục đang chọn. Dùng thẻ `div` như SidebarAtmosphere (chỉ chạy trên web,
 * nơi có CSS keyframes). `pointerEvents: none` để sao không chặn chuột vào nút.
 */
function ActiveSparkles() {
  return (
    <>
      {SPARKS.map((s, i) => (
        <div
          key={i}
          className="rm-spark"
          aria-hidden
          style={{
            position: "absolute",
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            fontSize: s.size,
            lineHeight: 1,
            color: "#FFF6D6",
            textShadow: "0 0 6px #F6C453, 0 0 12px rgba(246,196,83,0.75)",
            pointerEvents: "none",
            zIndex: 7,
            animationDelay: `${s.delay}s`,
          }}
        >
          ✦
        </div>
      ))}
    </>
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
        borderColor: themeConfig.isDark ? "rgba(255,255,255,0.14)" : chiikawaTheme ? "#F0B6C9" : "#F6F3EE",
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
