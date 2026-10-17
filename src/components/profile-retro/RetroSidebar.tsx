/**
 * Cột điều hướng kiểu retro cho máy tính (màn từ lg), dùng trên bản mẫu hồ sơ.
 *
 * Giữ đúng hành vi của Sidebar.tsx: cùng danh sách mục (visibleGroups), chỉ mở trang con
 * của mục đang ở, thu gọn/mở rộng dùng chung useSidebarStore (AppShell đọc cùng khoá để
 * chừa chỗ cho nội dung), có chuyển ngôn ngữ, ô tìm bài và tài khoản. Chỉ đổi hình thức.
 */
import React from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Link, router, usePathname } from 'expo-router';

import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { shortcutLabel } from '@/components/search/keys';
import { useL, type L } from '@/i18n/useL';
import { useLocaleStore } from '@/i18n/useT';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey, navLabel, parentNavKey, visibleGroups, type NavItem } from '@/navigation/nav-items';
import { useIeltsFocusStore } from '@/store/useIeltsFocusStore';
import { useCityAvailable } from '@/services/city/availability';
import { formatStars } from '@/services/gamification/shop';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { usePlan } from '@/store/useBillingStore';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { useSearchStore } from '@/store/useSearchStore';
import { SIDEBAR_WIDTH, useSidebarStore } from '@/store/useSidebarStore';
import { useStarBalance } from '@/store/useStarBalance';

import { ECHO_GOLD, RCREAM, RFONT, RGOLD, RINK, RLAV, RLEAF, RORANGE, RPAPER, RPEACH, RPINK, RSKY, Rainbow, Sparkle } from './retro-art';
import { BackIcon, BookIcon, GaugeIcon, GridIcon, HomeIcon, LockIcon, RetroGlyph, SearchIcon, StarIcon } from './retro-icons';
import { RetroFx } from './retro-motion';
import { Boxed } from './retro-parts';
import { EchoWord } from './retro-type';
import { navPathFor } from './RetroNav';
import { setRetroOn } from './retro-mode-store';

type Locale = 'vi' | 'en';
type Pad = { paddingLeft: number; paddingRight: number };

/** Màu của từng mục: mỗi mục một màu, như các ô màu trong trang. */
const TINT: Record<string, string> = {
  home: RGOLD,
  dashboard: RSKY,
  ielts: RPINK,
  sat: RLEAF,
  vocabulary: RORANGE,
  quest: RLAV,
  me: RPEACH,
  admin: RPINK,
};

/** Đường uốn của dải cầu vồng mép phải: chạy dọc cả cột, lượn qua lại như dải S của hero. */
const RIBBON_PATH = 'M 100 -40 C 130 150, 70 330, 100 520 S 130 880, 100 1040';

/** Chấm halftone kiểu in báo, chỉ vẽ trên web. */
const DOT_TEXTURE =
  Platform.OS === 'web'
    ? { backgroundImage: 'radial-gradient(rgba(31,26,29,0.09) 1.1px, transparent 1.4px)', backgroundSize: '12px 12px' }
    : {};

/** Khối bọc hiệu ứng, chiếm hết bề ngang cột. */
const FULL = { display: 'block', width: '100%' } as const;

const LOCALES = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English' },
] as const;

function planLabel(plan: string, en: boolean): string {
  const name = plan.charAt(0).toUpperCase() + plan.slice(1);
  return en ? `${name} plan` : `Gói ${name}`;
}

/** Cột điều hướng. Thu gọn còn 76px, mở rộng 248px, đúng hai cỡ mà AppShell chừa chỗ. */
export function RetroSidebar() {
  const { L, locale } = useL();
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const desktop = useCityAvailable();

  const ieltsFeatures = useIeltsFocusStore((s) => s.features);

  const groups = visibleGroups(isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, desktop, ieltsFeatures);
  const activeKey = activeNavKey(navPathFor(pathname));
  const activeParent = parentNavKey(activeKey);

  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  // Mép phải có dải cầu vồng: lề phải chừa đủ bề rộng dải để chữ không chạm vào dải.
  const pad: Pad = collapsed ? { paddingLeft: 10, paddingRight: 18 } : { paddingLeft: 16, paddingRight: 32 };
  const ribbon = collapsed ? 14 : 24;
  // Cột được ghim từ đỉnh tới đáy cửa sổ, nên chiều cao của nó chính là chiều cao cửa sổ.
  const { height } = useWindowDimensions();

  return (
    <View style={[{ width, height: '100%', backgroundColor: RCREAM, borderRightWidth: 3, borderRightColor: RINK, overflow: 'hidden' }, DOT_TEXTURE] as never}>
      <EdgeRibbon width={ribbon} height={height} />

      <Brand collapsed={collapsed} pad={pad} L={L} />
      <SearchBar collapsed={collapsed} pad={pad} L={L} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ ...pad, paddingBottom: 12, gap: 8 }} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.key} style={{ gap: 6 }}>
            {group.title ? (
              collapsed ? (
                <View style={{ alignSelf: 'center', width: 26, height: 3, borderRadius: 2, marginVertical: 6, backgroundColor: RINK }} />
              ) : (
                <GroupChip label={group.key === ADMIN_GROUP.key ? L('Quản trị', 'Admin') : group.title} />
              )
            ) : null}
            {group.items.map((item, i) => (
              <NavSection
                key={item.key}
                item={item}
                tint={TINT[item.key] ?? RPAPER}
                on={activeParent === item.key}
                collapsed={collapsed}
                activeKey={activeKey}
                locale={locale}
                delay={0.03 * i}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <Footer collapsed={collapsed} pad={pad} L={L} locale={locale} onToggle={toggle} />
    </View>
  );
}

/**
 * Dải cầu vồng chạy hết chiều cao cột, cùng 8 màu và viền mực với dải S của hero,
 * để hai nơi nối thành một motif.
 */
function EdgeRibbon({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" aria-hidden style={{ position: 'absolute', top: 0, right: 0, width, height }}>
      <Rainbow d={RIBBON_PATH} viewBox="0 0 200 1000" width={width} height={height} scale={0.5} preserve="none" />
    </View>
  );
}

/** Đầu cột: logo chữ sọc. Mở rộng thì có dòng phụ ngắn và một chớp trang trí. */
function Brand({ collapsed, pad, L }: { collapsed: boolean; pad: Pad; L: L }) {
  return (
    <View style={{ ...pad, paddingTop: 18, paddingBottom: 12, alignItems: collapsed ? 'center' : 'flex-start' }}>
      <RetroFx kind="wiggle">
        <EchoWord
          text={collapsed ? 'B9' : 'Band 9'}
          size={collapsed ? 24 : 30}
          color={RGOLD}
          stripes={ECHO_GOLD}
          align={collapsed ? 'center' : 'flex-start'}
        />
      </RetroFx>
      {collapsed ? null : (
        <>
          <Text style={{ marginTop: 10, fontFamily: RFONT.semi, fontSize: 13, lineHeight: 18, color: RINK }}>
            {L('Luyện thi IELTS và SAT', 'IELTS and SAT practice')}
          </Text>
          <View pointerEvents="none" aria-hidden style={{ position: 'absolute', top: 22, right: 22 }}>
            <Sparkle size={20} color={RGOLD} />
          </View>
        </>
      )}
    </View>
  );
}

/** Ô tìm bài: viên kem có viền mực, kèm phím tắt. Thu gọn thì chỉ còn nút kính lúp. */
function SearchBar({ collapsed, pad, L }: { collapsed: boolean; pad: Pad; L: L }) {
  const show = useSearchStore((s) => s.show);
  return (
    <View style={{ ...pad, paddingBottom: 14, alignItems: collapsed ? 'center' : 'stretch' }}>
      {collapsed ? (
        <RoundBtn label={L('Tìm bài học', 'Find a lesson')} onPress={show}>
          <SearchIcon size={20} />
        </RoundBtn>
      ) : (
        <RetroFx kind="lift" style={FULL}>
          <Pressable accessibilityRole="button" accessibilityLabel={L('Tìm bài học', 'Find a lesson')} onPress={show} style={{ width: '100%' }}>
            <Boxed fill={RPAPER} radius={999} shadowSize={4}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 }}>
                <SearchIcon size={18} />
                <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: RFONT.semi, fontSize: 14, color: RINK }}>
                  {L('Tìm bài học…', 'Find a lesson…')}
                </Text>
                <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 2, borderColor: RINK, backgroundColor: RCREAM }}>
                  <Text style={{ fontFamily: RFONT.heavy, fontSize: 11, color: RINK }}>{shortcutLabel()}</Text>
                </View>
              </View>
            </Boxed>
          </Pressable>
        </RetroFx>
      )}
    </View>
  );
}

/** Nhãn nhóm (ví dụ Quản trị): viên hồng có viền mực. */
function GroupChip({ label }: { label: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 2.5, borderColor: RINK, backgroundColor: RPINK }}>
      <Text style={{ fontFamily: RFONT.heavy, fontSize: 12, color: RINK }}>{label}</Text>
    </View>
  );
}

/** Biểu tượng của mục chính: bộ icon retro. Mục chưa có hình riêng dùng icon đường nét của app. */
function SectionGlyph({ id, icon }: { id: string; icon: NavItem['icon'] }) {
  switch (id) {
    case 'home':
      return <HomeIcon size={22} />;
    case 'dashboard':
      return <GaugeIcon size={22} />;
    case 'ielts':
      return <BookIcon size={22} />;
    case 'sat':
      return <GridIcon size={22} />;
    case 'vocabulary':
      return <Text style={{ fontFamily: RFONT.display, fontSize: 16, color: RINK }}>Aa</Text>;
    case 'quest':
      return <Sparkle size={22} color={RPAPER} />;
    case 'me':
      return <StarIcon size={22} />;
    case 'admin':
      return <LockIcon size={20} />;
    default:
      return <RetroGlyph icon={icon} size={20} />;
  }
}

/** Ô màu tròn có viền mực, đựng biểu tượng của mục. */
function Tile({ tint, size, children }: { tint: string; size: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: RINK,
        backgroundColor: tint,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Một mục chính. Mục đang ở là một thẻ kem có viền và bóng lệch; các mục khác trong suốt.
 * Trang con chỉ mở dưới mục đang ở, nối bằng một sợi ống mực, như Sidebar.tsx.
 */
function NavSection({
  item,
  tint,
  on,
  collapsed,
  activeKey,
  locale,
  delay,
}: {
  item: NavItem;
  tint: string;
  on: boolean;
  collapsed: boolean;
  activeKey: string | null;
  locale: Locale;
  delay: number;
}) {
  const label = navLabel(item, locale);
  const kids = item.children ?? [];
  return (
    <RetroFx kind="pop" delay={delay} style={FULL}>
      <View>
        <RetroFx kind="lift" style={FULL}>
          <Link href={item.href as never} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={label} aria-selected={on} style={{ position: 'relative' }}>
              {on ? (
                <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 18, backgroundColor: RINK }} />
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  paddingVertical: 6,
                  paddingHorizontal: collapsed ? 0 : 8,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: on ? RINK : 'transparent',
                  backgroundColor: on ? RPAPER : 'transparent',
                }}
              >
                <Tile tint={tint} size={collapsed ? 42 : 38}>
                  <SectionGlyph id={item.key} icon={item.icon} />
                </Tile>
                {collapsed ? null : (
                  <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: on ? RFONT.heavy : RFONT.bold, fontSize: 15, color: RINK }}>
                    {label}
                  </Text>
                )}
              </View>
            </Pressable>
          </Link>
        </RetroFx>

        {on && !collapsed && kids.length > 0 ? (
          <View style={{ marginTop: 6, marginLeft: 25, paddingLeft: 12, gap: 4 }}>
            <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 14, width: 3, borderRadius: 2, backgroundColor: RINK }} />
            {kids.map((child) => (
              <ChildRow key={child.key} child={child} tint={tint} on={activeKey === child.key} locale={locale} />
            ))}
          </View>
        ) : null}
      </View>
    </RetroFx>
  );
}

/** Trang con: chấm màu của mục cha, tên đậm và nền vàng khi đang ở đó. */
function ChildRow({ child, tint, on, locale }: { child: NavItem; tint: string; on: boolean; locale: Locale }) {
  const label = navLabel(child, locale);
  return (
    <RetroFx kind="lift" style={FULL}>
      <Link href={child.href as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={label}
          aria-selected={on}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 7,
            paddingHorizontal: 10,
            borderRadius: 12,
            borderWidth: 2.5,
            borderColor: on ? RINK : 'transparent',
            backgroundColor: on ? RGOLD : 'transparent',
          }}
        >
          <Tile tint={tint} size={26}>
            <RetroGlyph icon={child.icon} size={15} />
          </Tile>
          <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: on ? RFONT.heavy : RFONT.semi, fontSize: 14, color: RINK }}>
            {label}
          </Text>
        </Pressable>
      </Link>
    </RetroFx>
  );
}

/** Nút tròn có viền mực, nổi lên khi di chuột. */
function RoundBtn({
  label,
  onPress,
  fill = RPAPER,
  expanded,
  children,
}: {
  label: string;
  onPress: () => void;
  fill?: string;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <RetroFx kind="lift" style={{ display: 'block' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-expanded={expanded}
        onPress={onPress}
        style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: RINK, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Pressable>
    </RetroFx>
  );
}

/** Chuyển ngôn ngữ: hai ô VI và EN trong viên kem, ô đang chọn là đĩa vàng. */
function LangSwitch() {
  const { locale } = useL();
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Ngôn ngữ / Language"
      style={{ flex: 1, flexDirection: 'row', gap: 3, padding: 3, borderRadius: 999, borderWidth: 2.5, borderColor: RINK, backgroundColor: RPAPER }}
    >
      {LOCALES.map((o) => {
        const on = locale === o.code;
        return (
          <Pressable
            key={o.code}
            accessibilityRole="radio"
            aria-checked={on}
            accessibilityLabel={o.label}
            onPress={() => setLocale(o.code)}
            style={{
              flex: 1,
              minHeight: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderWidth: 2,
              borderColor: on ? RINK : 'transparent',
              backgroundColor: on ? RGOLD : 'transparent',
            }}
          >
            <Text style={{ fontFamily: RFONT.heavy, fontSize: 12, letterSpacing: 0.6, color: RINK }}>{o.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Nút thu gọn/mở rộng. Mũi tên chỉ trái khi đang mở rộng, lật ngược khi đang thu gọn. */
function CollapseBtn({ collapsed, L, onToggle }: { collapsed: boolean; L: L; onToggle: () => void }) {
  return (
    <RoundBtn
      label={collapsed ? L('Mở rộng thanh bên', 'Expand sidebar') : L('Thu gọn thanh bên', 'Collapse sidebar')}
      onPress={onToggle}
      expanded={!collapsed}
    >
      <View style={{ transform: [{ rotate: collapsed ? '180deg' : '0deg' }] }}>
        <BackIcon size={18} />
      </View>
    </RoundBtn>
  );
}

/** Chân cột: đường kẻ mực, chuyển ngôn ngữ, thu gọn và thẻ tài khoản. */
function Footer({ collapsed, pad, L, locale, onToggle }: { collapsed: boolean; pad: Pad; L: L; locale: Locale; onToggle: () => void }) {
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <View style={{ ...pad, paddingTop: 12, paddingBottom: 16, gap: 12 }}>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: RINK }} />
      {collapsed ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <RoundBtn label={L('Đổi ngôn ngữ', 'Switch language')} onPress={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>
            <Text style={{ fontFamily: RFONT.heavy, fontSize: 12, color: RINK }}>{locale === 'vi' ? 'VI' : 'EN'}</Text>
          </RoundBtn>
          <CollapseBtn collapsed={collapsed} L={L} onToggle={onToggle} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LangSwitch />
          <CollapseBtn collapsed={collapsed} L={L} onToggle={onToggle} />
        </View>
      )}
      <AccountCard collapsed={collapsed} L={L} locale={locale} />
      {collapsed ? null : <RetroOffSwitch />}
    </View>
  );
}

/** Tắt giao diện retro, trả về khung gốc của app. Bật lại ở trang Cá nhân. */
function RetroOffSwitch() {
  const { L } = useL();
  const toggle = () => setRetroOn(false);
  return (
    <Pressable accessibilityRole="button" onPress={toggle} style={{ alignSelf: 'center', paddingVertical: 4 }}>
      <Text style={{ fontFamily: RFONT.semi, fontSize: 12, color: RINK, textDecorationLine: 'underline' }}>
        {L('Tắt giao diện retro', 'Turn off the retro look')}
      </Text>
    </Pressable>
  );
}

/** Tài khoản: chưa đăng nhập thì là nút vàng; đã đăng nhập thì là thẻ có avatar, gói và số sao. */
function AccountCard({ collapsed, L, locale }: { collapsed: boolean; L: L; locale: Locale }) {
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const name = useDisplayName();
  const plan = usePlan();
  const avatarId = useRewardStore((s) => s.avatar);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const stars = useStarBalance();

  if (!signedIn) {
    const signIn = () => router.push('/auth/sign-in' as never);
    if (collapsed) {
      return (
        <RoundBtn label={L('Đăng nhập', 'Sign in')} onPress={signIn} fill={RGOLD}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <BackIcon size={18} />
          </View>
        </RoundBtn>
      );
    }
    return (
      <RetroFx kind="lift" style={FULL}>
        <Pressable accessibilityRole="button" accessibilityLabel={L('Đăng nhập', 'Sign in')} onPress={signIn} style={{ width: '100%' }}>
          <View style={{ position: 'relative' }}>
            <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 999, backgroundColor: RINK }} />
            <View style={{ minHeight: 46, borderRadius: 999, borderWidth: 3, borderColor: RINK, backgroundColor: RGOLD, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: RFONT.heavy, fontSize: 16, color: RINK }}>{L('Đăng nhập', 'Sign in')}</Text>
            </View>
          </View>
        </Pressable>
      </RetroFx>
    );
  }

  return (
    <RetroFx kind="lift" style={FULL}>
      <Link href={'/profile' as never} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={L(`Hồ sơ của ${name}`, `${name}'s profile`)}>
          <Boxed fill={RPAPER} radius={18} shadowSize={4}>
            <View style={{ flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: 10, padding: collapsed ? 6 : 10 }}>
              <AvatarBadge avatarId={avatarId} name={name} size={collapsed ? 38 : 40} skin={skin} />
              {collapsed ? null : (
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: RFONT.heavy, fontSize: 15, color: RINK }}>
                    {name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <StarIcon size={13} />
                    <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: RFONT.semi, fontSize: 12, color: RINK }}>
                      {`${planLabel(plan, locale === 'en')} · ${formatStars(stars)}`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Boxed>
        </Pressable>
      </Link>
    </RetroFx>
  );
}
