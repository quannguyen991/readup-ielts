import React, { useState } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from './Logo';
import { useIsPhone } from './PhoneBackdrop';
import { SearchIconButton } from '@/components/search/SearchTrigger';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { haptic } from '@/services/haptics';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey, flattenItems, hiddenOnPhone, navLabel, parentNavKey, visibleGroups } from '@/navigation/nav-items';
import { useL } from '@/i18n/useL';
import { useCityAvailable } from '@/services/city/availability';
import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { usePlan } from '@/store/useBillingStore';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { pixelCardStyle, usePixelTheme } from '@/components/pixel-theme/pixel-art';
import { color, paper, shadow } from '@/theme/tokens';

const webBarShadow = { boxShadow: '0 6px 22px rgba(26, 26, 51, 0.10)' } as const;
/** Nền kính của thanh trên: trong, làm mờ phần nội dung chạy phía sau (chỉ web). */
// Không blur trên thanh cố định: lớp mờ phải vẽ lại mỗi lần cuộn, điện thoại dễ giật.
const glassPill = { backgroundColor: 'rgba(255,255,255,0.92)' } as const;

/**
 * Thanh điều hướng duy nhất của app — MỘT hàng ngang, dùng chung mọi khổ màn.
 *
 * Trước đây có ba thứ cùng làm việc điều hướng: sidebar 232px ở desktop, thanh
 * đầu trang + bottom tabs ở mobile. Ba bộ khung nghĩa là ba chỗ phải sửa mỗi
 * lần thêm một mục, và ở desktop thì cột trái ăn mất 244px chiều ngang của
 * chính nội dung mà người dùng vào để đọc.
 *
 * Bản này giữ đúng những gì cần thấy mọi lúc: logo (về trang chủ), lối vào các
 * mục hay dùng, tài khoản, và nút nâng cấp. Toàn bộ 20 mục còn lại nằm sau nút
 * "Khám phá" — mở ra bảng phủ toàn màn, đóng lại là xong. Danh sách dài không
 * cần chiếm chỗ thường trực, vì nó chỉ được dùng vài giây mỗi phiên.
 */
/**
 * Man dau muc — cho khong con "ngoai" nao de lui ra.
 *
 * La MOI DICH DEN trong thanh dieu huong, cong trang gioi thieu (dich cua
 * logo). Suy tu chinh `NAV_ITEMS` chu khong chep tay: them mot muc vao nav ma
 * quen them vao day thi man ay se moc ra mot nut lui khong dua di dau ca.
 */
function isTopLevel(pathname: string): boolean {
  if (pathname === '/' || pathname === '/intro') return true;
  for (const group of [...NAV_GROUPS, ADMIN_GROUP]) {
    for (const item of flattenItems(group.items)) if (item.href === pathname) return true;
  }
  return false;
}

export function TopBar({ fixed = false }: { fixed?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { L, locale } = useL();
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  /*
    Vai trò đọc từ hồ sơ trên máy chủ, lấy lại mỗi lần tải trang. Nút này chỉ là
    LỐI ĐI TẮT — quyền thật do từng route quản trị tự kiểm lại với cơ sở dữ liệu,
    nên có sửa cờ này trong DevTools cũng không vào được gì.
  */
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const name = useDisplayName();
  // Avatar đổi bằng sao (kể cả avatar động) hiện luôn ở nút tài khoản.
  const avatarId = useRewardStore((s) => s.avatar);
  const skinId = useRewardStore((s) => s.skin);
  const plan = usePlan();
  const pathname = usePathname();
  // Tên mục chính đang mở — điện thoại hiện tên này thay logo.
  const activeParent = parentNavKey(activeNavKey(pathname));
  const parentItem = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === activeParent);
  const sectionTitle = parentItem ? navLabel(parentItem, locale) : null;
  // Điện thoại: không còn khung kính, chỉ còn tên mục, nút Khám phá và kính lúp.
  const phone = useIsPhone();
  const px = usePixelTheme();

  /*
    Chi hien nut lui khi DANG O MOT MAN CHI TIET.

    `router.canGoBack()` mot minh la khong du: mo tab moi roi bam qua vai man
    thi o Tong quan van "lui duoc" — lui ve dung man vua roi khoi, tuc la di
    vong tron. Man dau muc thi khong co "ngoai" nao de thoat ra.
  */
  const showBack = router.canGoBack() && !isTopLevel(pathname);

  return (
    <>
      {/*
        Thanh nav là một ĐẢO NỔI bo tròn, không phải dải chạy hết bề ngang.

        Dải chạy hết bề ngang cắt màn hình thành hai phần rời và đẩy nội dung
        xuống thấp hẳn. Đảo nổi có khoảng thở quanh bốn phía nên nền trang chạy
        liên tục phía sau, và mắt đọc nó như một thanh công cụ chứ không phải
        một tầng riêng của trang.
      */}
      <View
        className="px-4 pb-1 pt-2 sm:px-4 sm:pt-2"
        style={
          fixed
            ? ({ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 } as const)
            : undefined
        }
      >
        {/*
          Nút lùi đứng NGOÀI thanh, không nằm trong.

          Nó không phải một mục của thanh điều hướng: logo, "Khám phá", Sổ từ,
          Tiến độ đều là những chỗ ĐỂ ĐI TỚI, còn lùi là thao tác trên lịch sử
          duyệt. Nhét chung một viên thuốc thì nó trông như mục đầu tiên của menu.

          VÀ ẨN Ở CÁC MÀN CHÍNH. Đứng ở Trang giới thiệu hay Tổng quan mà vẫn có
          nút lùi thì nó đưa người ta đi đâu? Lùi là để thoát ra khỏi một màn chi
          tiết; ở một màn đầu mục thì không có "ngoài" nào để thoát.
        */}
        <View className="w-full flex-row items-center gap-2 self-center" style={{ maxWidth: 1180 }}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Quay lại trang trước', 'Go back')}
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-pill border border-brand-soft bg-paper"
              style={Platform.OS === 'web' ? webBarShadow : shadow.card}
            >
              <Icon name="chevron-left" size={18} color={paper.body} strokeWidth={2.2} />
            </Pressable>
          ) : null}

          <View
            className="min-w-0 flex-1 flex-row items-center gap-1 py-1 sm:gap-3 sm:rounded-pill sm:border sm:border-white sm:px-3 sm:py-2"
            style={phone ? undefined : px ? (pixelCardStyle(px) as never) : (Platform.OS === 'web' ? [webBarShadow, glassPill] : shadow.card)}
          >
          {/*
            Logo về TRANG GIỚI THIỆU, không về Tổng quan.

            Tổng quan là một màn bên trong app; trang giới thiệu mới là cửa vào —
            chỗ có đủ sáu mảng, ba bước mở đầu và bảng giá. Bấm logo là thao tác
            "cho tôi về đầu", và đầu ở đây là cửa vào chứ không phải một màn giữa
            chừng. Người đang học vẫn có nút "Tiếp tục học" ngay đầu trang ấy.
          */}
          {/* Điện thoại: tên mục đang mở thay cho logo, như tiêu đề một màn của app bản địa. */}
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-heavy text-paper-ink sm:hidden"
            style={{ fontSize: 19, lineHeight: 24 }}
          >
            {sectionTitle ?? 'Band 9'}
          </Text>
          <Link href={'/intro' as never} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={L('Về trang giới thiệu', 'Go to the intro page')} className="hidden justify-center sm:flex" style={{ minHeight: 44 }}>
              <Logo compact />
            </Pressable>
          </Link>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Mở danh sách mục', 'Open the menu')}
            onPress={() => {
              haptic();
              setMenuOpen(true);
            }}
            aria-haspopup="dialog"
            className="h-11 shrink-0 flex-row items-center justify-center gap-1.5 rounded-pill border border-brand-soft bg-brand-tint px-3"
            style={{ minWidth: 44 }}
          >
            <Icon name="grid" size={15} color={paper.body} strokeWidth={1.9} />
            <Text className="hidden font-semi text-label text-paper-body sm:flex">{L('Khám phá', 'Explore')}</Text>
          </Pressable>


          {/* Điện thoại: tên mục chiếm hết chỗ trống, nên nút bên phải dạt sát mép. */}
          <View className="hidden flex-1 sm:flex" />

          {/*
            Kính lúp mở bảng tìm bài. Màn điện thoại không đủ chỗ cho cả kính lúp
            lẫn chuông (thanh tràn, nút Premium bị cắt), nên dưới khổ `sm` chuông
            nhường chỗ — nó chỉ dẫn sang Thông báo, vẫn mở được từ bảng Khám phá.
          */}
          <SearchIconButton color={paper.body} />

          {/*
            Kính lúp mở bảng tìm bài. Màn điện thoại không đủ chỗ cho cả kính lúp
            lẫn chuông (thanh tràn, nút Premium bị cắt), nên dưới khổ `sm` chuông
            nhường chỗ — nó chỉ dẫn sang Tiến độ, vẫn mở được từ bảng Khám phá.
          */}
          <SearchIconButton color={paper.body} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Thông báo', 'Notifications')}
            onPress={() => router.push('/thong-bao' as never)}
            className="hidden p-1.5 sm:flex"
          >
            <View>
              <Icon name="bell" size={19} color={paper.muted} />
              <View className="absolute right-0 top-0 h-2 w-2 rounded-pill bg-danger" />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={signedIn ? L(`Hồ sơ của ${name}`, `${name}'s profile`) : L('Đăng nhập', 'Sign in')}
            onPress={() => router.push((signedIn ? '/profile' : '/auth/sign-in') as never)}
            className="hidden h-11 shrink-0 sm:flex flex-row items-center justify-center gap-2 rounded-pill border border-brand-soft bg-white pl-1 pr-1 md:pr-3"
            style={{ minWidth: 44 }}
          >
            {signedIn ? (
              <AvatarBadge avatarId={avatarId} name={name} size={34} skin={skinOf(skinId)} />
            ) : (
              <View className="items-center justify-center rounded-pill bg-brand" style={{ width: 34, height: 34 }}>
                <Text className="font-strong text-label text-white">?</Text>
              </View>
            )}
            <View className="hidden md:flex">
              <Text className="font-semi text-label text-paper-ink" numberOfLines={1}>
                {signedIn ? name : L('Khách', 'Guest')}
              </Text>
              <View className="flex-row items-center gap-1">
                <View
                  className="h-1.5 w-1.5 rounded-pill"
                  style={{ backgroundColor: signedIn ? color.success : color.subtle }}
                />
                <Text className="font-sans uppercase text-paper-muted" style={{ fontSize: 12 }}>
                  {signedIn ? 'online' : L('cục bộ', 'local')}
                </Text>
              </View>
            </View>
          </Pressable>

          <View className="hidden h-6 w-px bg-brand-soft lg:flex" />

          <QuickLink href="/vocabulary" icon="letters" label={L('Sổ từ', 'Word book')} />
          <QuickLink href="/progress" icon="clock" label={L('Tiến độ', 'Progress')} />
          {/* Góp ý tính năng: đưa lên thanh để người học thấy ngay, không phải đi qua mục "Cá nhân". */}
          <QuickLink href="/feature-requests" icon="star" label={L('Yêu cầu tính năng', 'Feature requests')} />

          {/*
            Lối vào Quản trị nằm THẲNG trên thanh, không chôn trong bảng "Khám phá".
            Người quản trị mở nó vài chục lần mỗi ngày để đối chiếu chuyển khoản;
            mỗi lần phải mở bảng rồi cuộn xuống cuối là một lần thừa. Và khác các
            mục kia, nút này KHÔNG ẩn trên màn hẹp — đối chiếu thanh toán là việc
            hay làm trên điện thoại nhất.
          */}
          {isAdmin ? (
            <Link href={'/admin' as never} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={L('Trang quản trị', 'Admin page')}
                className="flex-row items-center gap-1.5 rounded-pill border px-3 py-1.5"
                style={{ minHeight: 44, borderColor: paper.brandSoft, backgroundColor: paper.brandTint }}
              >
                <Icon name="lock" size={14} color={paper.brandMid} strokeWidth={2} />
                <Text
                  className="font-heavy uppercase tracking-wide"
                  style={{ fontSize: 12, color: paper.brandMid }}
                >
                  {L('Quản trị', 'Admin')}
                </Text>
              </Pressable>
            </Link>
          ) : null}

          {plan === 'free' ? (
            <Link href={'/upgrade' as never} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={L('Nâng cấp Premium', 'Upgrade to Premium')} className="hidden sm:flex">
                <LinearGradient
                  colors={[paper.goldSoft, paper.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: paper.gold,
                    paddingHorizontal: 14,
                    // ≥ 44px chạm; ở màn rộng thì viên nhỏ gọn như cũ.
                    minHeight: 44,
                    minWidth: 44,
                    flexShrink: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="sparkle" size={14} color={paper.ink} strokeWidth={2} />
                  {/* Màn điện thoại chỉ giữ biểu tượng, như nút Khám phá: đủ chữ thì viên này tràn khỏi thanh và bị cắt còn "PREM". */}
                  <Text className="hidden font-heavy uppercase tracking-wide text-paper-ink sm:flex" style={{ fontSize: 12 }}>
                    Premium
                  </Text>
                </LinearGradient>
              </Pressable>
            </Link>
          ) : null}
          </View>
        </View>
      </View>

      <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="link"
        className="hidden flex-row items-center gap-1.5 px-1.5 py-1.5 lg:flex"
      >
        <Icon name={icon} size={15} color={paper.body} strokeWidth={1.8} />
        <Text className="font-semi text-label text-paper-body">{label}</Text>
      </Pressable>
    </Link>
  );
}

/**
 * Bảng "Khám phá" — toàn bộ điều hướng, mở khi cần rồi đóng.
 *
 * Là bảng trượt từ đáy (`Sheet`): ngón cái với tới được, kéo tay cầm xuống /
 * chạm nền / Esc / nút Back đều đóng. Mỗi mục cao ≥ 48px.
 */
export function NavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const activeParent = parentNavKey(activeKey);
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const desktop = useCityAvailable();
  const groups = visibleGroups(isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS, desktop);
  const { L, locale, en } = useL();

  // Khối nào người dùng đã tự bấm mở/đóng thì giữ theo lựa chọn đó; khối chưa bấm
  // thì mở đúng khối đang học, các khối khác thu gọn.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (key: string) => toggled[key] ?? key === activeParent;
  const toggle = (key: string) => setToggled((s) => ({ ...s, [key]: !isOpen(key) }));
  const pick = () => {
    haptic();
    onClose();
  };

  const { width } = useWindowDimensions();
  const sections = groups.flatMap((g) => g.items).filter((i) => !hiddenOnPhone(i, width));
  const adminKey = ADMIN_GROUP.key;

  return (
    <Sheet visible={open} onClose={onClose} title={L('Khám phá', 'Explore')} maxWidth={720}>
      <View style={{ gap: 8 }}>
        {sections.map((item) => {
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
                  className={[
                    'flex-row items-center gap-3 rounded-panel border px-3.5',
                    active ? 'border-brand bg-brand-soft' : 'border-brand-soft bg-white',
                  ].join(' ')}
                  style={{ minHeight: 52 }}
                >
                  <Icon name={item.icon} size={18} color={active ? paper.brandMid : paper.body} strokeWidth={active ? 2 : 1.7} />
                  <Text className={['flex-1 text-body', active ? 'font-strong text-paper-ink' : 'font-mid text-paper-body'].join(' ')}>
                    {navLabel(item, locale)}
                  </Text>
                </Pressable>
              </Link>
            );
          }

          const expanded = isOpen(item.key);
          const parentActive = activeParent === item.key;
          return (
            <View
              key={item.key}
              className={['overflow-hidden rounded-panel border bg-white', parentActive ? 'border-brand' : 'border-brand-soft'].join(' ')}
            >
              <View className="flex-row items-center">
                <Link href={item.href as never} asChild>
                  <Pressable
                    accessibilityRole="link"
                    onPress={pick}
                    className="flex-1 flex-row items-center gap-3 px-3.5"
                    style={{ minHeight: 52 }}
                  >
                    <Icon name={item.icon} size={18} color={parentActive ? paper.brandMid : paper.body} strokeWidth={parentActive ? 2 : 1.7} />
                    <Text className="flex-1 font-strong text-body text-paper-ink">{groupTitle ?? navLabel(item, locale)}</Text>
                    <Text className="font-sans text-label text-paper-muted">{kids.length}</Text>
                  </Pressable>
                </Link>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? L('Thu gọn', 'Collapse') : L('Mở rộng', 'Expand')}
                  aria-expanded={expanded}
                  onPress={() => toggle(item.key)}
                  className="items-center justify-center"
                  style={{ minHeight: 52, minWidth: 52 }}
                >
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={paper.muted} />
                </Pressable>
              </View>

              {expanded ? (
                <View className="flex-row flex-wrap gap-2 px-2.5 pb-2.5">
                  {kids.map((child) => {
                    const active = activeKey === child.key;
                    return (
                      <Link key={child.key} href={child.href as never} asChild>
                        <Pressable
                          accessibilityRole="link"
                          aria-selected={active}
                          onPress={pick}
                          className={[
                            'flex-row items-center gap-2 rounded-panel border px-2.5',
                            active ? 'border-brand bg-brand-soft' : 'border-brand-soft bg-brand-tint',
                          ].join(' ')}
                          style={{ width: '48.5%', minHeight: 44 }}
                        >
                          <Icon name={child.icon} size={15} color={active ? paper.brandMid : paper.muted} strokeWidth={active ? 2 : 1.7} />
                          <Text
                            className={['min-w-0 flex-1 text-label', active ? 'font-strong text-paper-ink' : 'font-mid text-paper-body'].join(' ')}
                            numberOfLines={1}
                          >
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
    </Sheet>
  );
}
