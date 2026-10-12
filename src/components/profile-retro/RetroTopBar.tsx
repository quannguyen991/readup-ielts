/**
 * Thanh trên kiểu retro cho bản mẫu hồ sơ.
 *
 * - `RetroTopBar`: viên kem có viền mực (điện thoại), cùng ngôn ngữ với thanh tab dưới.
 * - `RetroPromoBanner`: dải khuyến mãi Zalo (máy tính), nền than như hero, chữ chạy kiểu băng quảng cáo.
 * - `RetroNavSheet`: bảng "Khám phá" vẽ lại theo kiểu retro, vẫn dùng `Sheet` để giữ thao tác kéo và đóng.
 *
 * Hành động và dữ liệu giữ nguyên TopBar.tsx, ZaloPromoBanner.tsx và nav-items.ts.
 * Chỉ đổi hình thức và chuyển động.
 */
import React, { useState } from 'react';
import { Linking, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { STORAGE_KEY, ZALO_LINK, ZALO_PHONE, ZALO_PHONE_RAW, readHidden } from '@/components/layout/ZaloPromoBanner';
import { useCityAvailable } from '@/services/city/availability';
import { useL } from '@/i18n/useL';
import { haptic } from '@/services/haptics';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey, flattenItems, hiddenOnPhone, navLabel, parentNavKey, visibleGroups } from '@/navigation/nav-items';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';

import { ECHO_GOLD, RAINBOW, RCHAR, RCREAM, RFONT, RGOLD, RINK, RLEAF, RORANGE, RPAPER, RPINK, RSKY, Sparkle } from './retro-art';
import { BackIcon, ChatIcon, CheckIcon, CloseIcon, CopyIcon, GiftIcon, GridIcon, LockIcon, RetroGlyph, SearchIcon } from './retro-icons';
import { navPathFor } from './RetroNav';
import { setRetroOn } from './retro-mode-store';
import { RetroFx } from './retro-motion';
import { EchoWord } from './retro-type';

type L = ReturnType<typeof useL>['L'];

/** Trang đầu mục: không có "ngoài" nào để lùi ra (cùng quy tắc với TopBar.tsx). */
function isTopLevelPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/intro') return true;
  return [...NAV_GROUPS, ADMIN_GROUP].some((g) => flattenItems(g.items).some((i) => i.href === pathname));
}

/* ---------- Thanh trên (điện thoại) ---------- */

export function RetroTopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { L, locale } = useL();
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const showSearch = useSearchStore((s) => s.show);

  // Tên mục chính đang mở hiện thành nhãn dán, như TopBar điện thoại thay logo bằng tên mục.
  // Bản mẫu thuộc mục Cá nhân nên tra theo `/profile`.
  const activeParent = parentNavKey(activeNavKey(navPathFor(pathname)));
  const parentItem = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === activeParent);
  const sectionTitle = parentItem ? navLabel(parentItem, locale) : null;
  const showBack = router.canGoBack() && !isTopLevelPath(navPathFor(pathname));

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}>
      <RetroFx kind="drop" style={{ display: 'block', width: '100%' }}>
        <View style={{ position: 'relative' }}>
          {/* Bóng lệch mực, cùng kiểu với thanh tab dưới */}
          <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: 5, left: 5, right: -5, bottom: -5, borderRadius: 999, backgroundColor: RINK }} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 8,
              paddingRight: 8,
              paddingVertical: 8,
              minHeight: 66,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: RINK,
              backgroundColor: RPAPER,
            }}
          >
            {showBack ? (
              <RoundButton label={L('Quay lại trang trước', 'Go back')} onPress={() => router.back()} bg={RCREAM}>
                <BackIcon size={18} />
              </RoundButton>
            ) : null}

            <Pressable accessibilityRole="link" accessibilityLabel={L('Về trang giới thiệu', 'Go to the intro page')} onPress={() => router.push('/intro' as never)} style={{ flexShrink: 0 }}>
              <RetroFx kind="wiggle">
                <EchoWord text="Band 9" size={24} color={RGOLD} stripes={ECHO_GOLD} />
              </RetroFx>
            </Pressable>

            {sectionTitle ? (
              <RetroFx kind="pop" delay={0.2} style={{ minWidth: 0, flexShrink: 1 }}>
                <View
                  style={{
                    transform: [{ rotate: '-3deg' }],
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 3,
                    borderColor: RINK,
                    backgroundColor: RSKY,
                    minWidth: 0,
                    flexShrink: 1,
                  }}
                >
                  <Text numberOfLines={1} style={{ fontFamily: RFONT.heavy, fontSize: 14, color: RINK }}>
                    {sectionTitle}
                  </Text>
                </View>
              </RetroFx>
            ) : null}

            <View style={{ flex: 1 }} />

            <RoundButton label={L('Tìm bài học', 'Find a lesson')} onPress={showSearch} bg={RSKY} wiggle>
              <SearchIcon size={20} />
            </RoundButton>
            <RoundButton
              label={L('Mở danh sách mục', 'Open the menu')}
              onPress={() => {
                haptic();
                setMenuOpen(true);
              }}
              bg={RPINK}
              wiggle
            >
              <GridIcon size={20} />
            </RoundButton>
            {isAdmin ? (
              <RoundButton label={L('Trang quản trị', 'Admin page')} onPress={() => router.push('/admin' as never)} bg={RGOLD}>
                <LockIcon size={18} />
              </RoundButton>
            ) : null}
          </View>
        </View>
      </RetroFx>

      <RetroNavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

/** Nút tròn có viền mực và bóng lệch; nổi lên khi di chuột, ép xuống khi bấm. */
function RoundButton({
  label,
  onPress,
  bg,
  wiggle,
  children,
}: {
  label: string;
  onPress: () => void;
  bg: string;
  wiggle?: boolean;
  children: React.ReactNode;
}) {
  const size = 44;
  return (
    <RetroFx kind="lift">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({ width: size, height: size, transform: [{ scale: pressed ? 0.92 : 1 }] })}
      >
        <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: 3, left: 3, width: size, height: size, borderRadius: size / 2, backgroundColor: RINK }} />
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: RINK, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          {wiggle ? <RetroFx kind="wiggle">{children}</RetroFx> : children}
        </View>
      </Pressable>
    </RetroFx>
  );
}

/* ---------- Dải khuyến mãi Zalo (máy tính) ---------- */

export function RetroPromoBanner() {
  const { L } = useL();
  const [visible, setVisible] = useState(() => !readHidden());
  const [copied, setCopied] = useState(false);
  const compact = useWindowDimensions().width < 640;

  // Đóng là ẩn cho mọi trang (cùng khoá localStorage với ZaloPromoBanner).
  const dismiss = () => {
    setVisible(false);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // localStorage bị chặn: chỉ ẩn trong lần xem này.
    }
  };

  const openZalo = () => {
    Linking.openURL(ZALO_LINK).catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(ZALO_LINK, '_blank');
    });
  };

  const copyPhone = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(ZALO_PHONE_RAW);
      else await Clipboard.setStringAsync(ZALO_PHONE_RAW);
    } catch {
      // Vẫn báo đã chép như bản cũ.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!visible) return null;

  return (
    <RetroFx kind="drop" style={{ display: 'block', width: '100%', overflow: 'hidden' }}>
      <View
        style={{
          height: compact ? 56 : 58,
          backgroundColor: RCHAR,
          borderBottomWidth: 3,
          borderBottomColor: RINK,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 12,
          paddingRight: 10,
          overflow: 'hidden',
        }}
      >
        {/* Dải cầu vồng ở mép dưới, cùng bảng màu với đường cầu vồng trong hero */}
        <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, flexDirection: 'row' }}>
          {RAINBOW.map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: s.c }} />
          ))}
        </View>

        {/* Nhãn ưu đãi: nhãn vàng dán nghiêng */}
        <RetroFx kind="pop" delay={0.25} style={{ flexShrink: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: RINK,
              backgroundColor: RGOLD,
              transform: [{ rotate: '-3deg' }],
            }}
          >
            <GiftIcon size={compact ? 16 : 18} />
            {compact ? null : (
              <Text numberOfLines={1} style={{ fontFamily: RFONT.heavy, fontSize: 13, color: RINK }}>
                {L('Ưu đãi độc quyền', 'Exclusive offer')}
              </Text>
            )}
          </View>
        </RetroFx>

        {/* Chữ chạy ngang, lặp vô hạn */}
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
          <RetroFx kind="marquee" style={{ flexShrink: 0 }}>
            <View style={{ flexDirection: 'row' }}>
              <TickerCopy L={L} />
              <TickerCopy L={L} />
            </View>
          </RetroFx>
        </View>

        {/* Nút hành động */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <RetroFx kind="lift">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Sao chép số Zalo 0921247247', 'Copy Zalo number 0921247247')}
              onPress={copyPhone}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: 38,
                paddingHorizontal: compact ? 9 : 12,
                borderRadius: 999,
                borderWidth: 3,
                borderColor: RCREAM,
                backgroundColor: copied ? RLEAF : 'transparent',
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              {compact ? null : (
                <Text style={{ fontFamily: RFONT.heavy, fontSize: 13, color: RCREAM }}>{copied ? L('Đã chép!', 'Copied!') : L('Chép SĐT', 'Copy number')}</Text>
              )}
            </Pressable>
          </RetroFx>

          <RetroFx kind="lift">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Nhắn Zalo ngay để nhận gói Max 2 tháng', 'Message on Zalo now to get 2 months of Max')}
              onPress={openZalo}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: 38,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 3,
                borderColor: RINK,
                backgroundColor: RPINK,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              <ChatIcon size={16} />
              {compact ? null : <Text style={{ fontFamily: RFONT.heavy, fontSize: 13, color: RINK }}>{L('Nhắn Zalo ngay', 'Message on Zalo')}</Text>}
            </Pressable>
          </RetroFx>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Đóng thông báo ưu đãi', 'Dismiss offer')}
            onPress={dismiss}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2.5,
              borderColor: RINK,
              backgroundColor: RCREAM,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.86 : 1 }],
            })}
          >
            <CloseIcon size={14} />
          </Pressable>
        </View>
      </View>
    </RetroFx>
  );
}

/** Một đoạn chữ của băng quảng cáo: câu đầy đủ, số Zalo tô vàng, dấu sao phân cách. */
function TickerCopy({ L }: { L: L }) {
  const piece = { flexShrink: 0 } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 24 }}>
      <Text style={{ ...piece, fontFamily: RFONT.bold, fontSize: 15, color: RCREAM }}>{L('Nhắn tin Zalo', 'Message us on Zalo at')}</Text>
      <Text style={{ ...piece, fontFamily: RFONT.heavy, fontSize: 15, color: RGOLD }}>{ZALO_PHONE}</Text>
      <Text style={{ ...piece, fontFamily: RFONT.bold, fontSize: 15, color: RCREAM }}>{L('để nhận mã mời kích hoạt', 'to get an invite code for')}</Text>
      <Text style={{ ...piece, fontFamily: RFONT.heavy, fontSize: 15, color: RPINK }}>{L('Gói MAX 2 tháng miễn phí!', '2 months of MAX free!')}</Text>
      <Sparkle size={16} color={RGOLD} />
    </View>
  );
}

/* ---------- Bảng "Khám phá" kiểu retro ---------- */

const BUBBLE_TINTS = [RPINK, RSKY, RGOLD, RLEAF, RORANGE];

function RetroNavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const activeParent = parentNavKey(activeKey);
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const desktop = useCityAvailable();
  const groups = visibleGroups(isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, desktop);
  const { L, locale, en } = useL();
  const { width } = useWindowDimensions();

  // Khối nào người dùng đã tự bấm mở/đóng thì giữ theo lựa chọn đó; khối đang học mở sẵn.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (key: string) => toggled[key] ?? key === activeParent;
  const toggle = (key: string) => setToggled((s) => ({ ...s, [key]: !isOpen(key) }));
  const pick = () => {
    haptic();
    onClose();
  };

  const sections = groups.flatMap((g) => g.items).filter((i) => !hiddenOnPhone(i, width));
  const adminKey = ADMIN_GROUP.key;

  return (
    <Sheet visible={open} onClose={onClose} title={L('Khám phá', 'Explore')} maxWidth={720}>
      <View style={{ gap: 10 }}>
        {sections.map((item, idx) => {
          const tint = BUBBLE_TINTS[idx % BUBBLE_TINTS.length]!;
          const kids = item.children ?? [];
          const groupTitle = item.key === adminKey ? (en ? 'Admin' : 'Quản trị') : null;

          if (kids.length === 0) {
            const active = activeKey === item.key;
            return (
              <Link key={item.key} href={item.href as never} asChild>
                <Pressable
                  accessibilityRole="link"
                  aria-selected={active}
                  onPress={pick}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 54,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    borderWidth: 3,
                    borderColor: RINK,
                    backgroundColor: active ? RGOLD : RPAPER,
                  }}
                >
                  <Bubble tint={tint}>
                    <RetroGlyph icon={item.icon} size={20} />
                  </Bubble>
                  <Text style={{ flex: 1, fontFamily: active ? RFONT.heavy : RFONT.bold, fontSize: 16, color: RINK }}>{navLabel(item, locale)}</Text>
                </Pressable>
              </Link>
            );
          }

          const expanded = isOpen(item.key);
          const parentActive = activeParent === item.key;
          return (
            <View
              key={item.key}
              style={{ borderRadius: 18, borderWidth: 3, borderColor: RINK, backgroundColor: parentActive ? RGOLD : RPAPER, overflow: 'hidden' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Link href={item.href as never} asChild>
                  <Pressable accessibilityRole="link" onPress={pick} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 12 }}>
                    <Bubble tint={tint}>
                      <RetroGlyph icon={item.icon} size={20} />
                    </Bubble>
                    <Text style={{ flex: 1, fontFamily: RFONT.heavy, fontSize: 16, color: RINK }}>{groupTitle ?? navLabel(item, locale)}</Text>
                    <Text style={{ fontFamily: RFONT.heavy, fontSize: 13, color: RINK }}>{kids.length}</Text>
                  </Pressable>
                </Link>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? L('Thu gọn', 'Collapse') : L('Mở rộng', 'Expand')}
                  aria-expanded={expanded}
                  onPress={() => toggle(item.key)}
                  style={{ minHeight: 54, minWidth: 52, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={RINK} />
                </Pressable>
              </View>

              {expanded ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 10, paddingBottom: 10 }}>
                  {kids.map((child) => {
                    const active = activeKey === child.key;
                    return (
                      <Link key={child.key} href={child.href as never} asChild>
                        <Pressable
                          accessibilityRole="link"
                          aria-selected={active}
                          onPress={pick}
                          style={{
                            width: '48.5%',
                            minHeight: 44,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 10,
                            borderRadius: 14,
                            borderWidth: 2.5,
                            borderColor: RINK,
                            backgroundColor: active ? RGOLD : RCREAM,
                          }}
                        >
                          <RetroGlyph icon={child.icon} size={16} />
                          <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: active ? RFONT.heavy : RFONT.bold, fontSize: 14, color: RINK }}>
                            {navLabel(child, locale)}
                          </Text>
                        </Pressable>
                      </Link>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <RetroOffRow />
    </Sheet>
  );
}

/** Tắt giao diện retro ngay trên bảng Khám phá. */
function RetroOffRow() {
  const { L } = useL();
  const toggle = () => setRetroOn(false);
  return (
    <Pressable accessibilityRole="button" onPress={toggle} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 12 }}>
      <Text style={{ fontFamily: RFONT.semi, fontSize: 14, color: RINK, textDecorationLine: 'underline' }}>
        {L('Tắt giao diện retro', 'Turn off the retro look')}
      </Text>
    </Pressable>
  );
}

function Bubble({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, borderColor: RINK, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
