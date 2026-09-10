import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from './Logo';
import { Icon } from '@/components/ui/Icon';
import { ADMIN_GROUP, NAV_GROUPS, activeNavKey } from '@/navigation/nav-items';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { usePlan } from '@/store/useBillingStore';
import { color, paper, shadow } from '@/theme/tokens';

const webBarShadow = { boxShadow: '0 6px 22px rgba(26, 26, 51, 0.10)' } as const;

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
    for (const item of group.items) if (item.href === pathname) return true;
  }
  return false;
}

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const name = useDisplayName();
  const plan = usePlan();
  const pathname = usePathname();

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
      <View className="px-3 pb-1 pt-3">
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
              accessibilityLabel="Quay lại trang trước"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-pill border border-brand-soft bg-paper"
              style={Platform.OS === 'web' ? webBarShadow : shadow.card}
            >
              <Icon name="chevron-left" size={18} color={paper.body} strokeWidth={2.2} />
            </Pressable>
          ) : null}

          <View
            className="min-w-0 flex-1 flex-row items-center gap-3 rounded-pill border border-brand-soft bg-paper px-3 py-2"
            style={Platform.OS === 'web' ? webBarShadow : shadow.card}
          >
          {/*
            Logo về TRANG GIỚI THIỆU, không về Tổng quan.

            Tổng quan là một màn bên trong app; trang giới thiệu mới là cửa vào —
            chỗ có đủ sáu mảng, ba bước mở đầu và bảng giá. Bấm logo là thao tác
            "cho tôi về đầu", và đầu ở đây là cửa vào chứ không phải một màn giữa
            chừng. Người đang học vẫn có nút "Tiếp tục học" ngay đầu trang ấy.
          */}
          <Link href={'/intro' as never} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Về trang giới thiệu">
              <Logo compact />
            </Pressable>
          </Link>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở danh sách mục"
            onPress={() => setMenuOpen(true)}
            className="flex-row items-center gap-1.5 rounded-pill border border-brand-soft bg-brand-tint px-3 py-1.5"
          >
            <Icon name="grid" size={15} color={paper.body} strokeWidth={1.9} />
            <Text className="hidden font-semi text-label text-paper-body sm:flex">Khám phá</Text>
          </Pressable>

          <View className="flex-1" />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thông báo"
            onPress={() => router.push('/progress' as never)}
            className="p-1.5"
          >
            <View>
              <Icon name="bell" size={19} color={paper.muted} />
              <View className="absolute right-0 top-0 h-2 w-2 rounded-pill bg-danger" />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={signedIn ? 'Tài khoản' : 'Đăng nhập'}
            onPress={() => router.push((signedIn ? '/settings' : '/auth/sign-in') as never)}
            className="flex-row items-center gap-2 rounded-pill border border-brand-soft bg-white py-1 pl-1 pr-3"
          >
            <View className="h-7 w-7 items-center justify-center rounded-pill bg-brand">
              <Text className="font-strong text-label text-white">
                {signedIn ? name.slice(0, 1).toUpperCase() : '?'}
              </Text>
            </View>
            <View className="hidden md:flex">
              <Text className="font-semi text-label text-paper-ink" numberOfLines={1}>
                {signedIn ? name : 'Khách'}
              </Text>
              <View className="flex-row items-center gap-1">
                <View
                  className="h-1.5 w-1.5 rounded-pill"
                  style={{ backgroundColor: signedIn ? color.success : color.subtle }}
                />
                <Text className="font-sans uppercase text-paper-muted" style={{ fontSize: 9 }}>
                  {signedIn ? 'online' : 'cục bộ'}
                </Text>
              </View>
            </View>
          </Pressable>

          <View className="hidden h-6 w-px bg-brand-soft lg:flex" />

          <QuickLink href="/vocabulary" icon="letters" label="Sổ từ" />
          <QuickLink href="/progress" icon="clock" label="Tiến độ" />

          {plan === 'free' ? (
            <Link href={'/upgrade' as never} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Nâng cấp Premium">
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
                    paddingVertical: 7,
                  }}
                >
                  <Icon name="sparkle" size={14} color={paper.ink} strokeWidth={2} />
                  <Text className="font-heavy uppercase tracking-wide text-paper-ink" style={{ fontSize: 11 }}>
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
 * Dùng `Modal` của React Native chứ không phải một `View` phủ tuyệt đối: Modal
 * bắt được phím Esc và nút Back của Android, còn View phủ thì không, và một
 * bảng che kín màn không có đường thoát bằng bàn phím là chỗ dễ mắc kẹt nhất.
 */
function NavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng bảng điều hướng"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(31,42,18,0.45)' }}
      >
        <Pressable
          // Chặn sự kiện chạm lọt xuống lớp nền, nếu không thì bấm vào chính
          // bảng cũng đóng bảng.
          onPress={(event) => event.stopPropagation()}
          className="w-full self-center px-3 pt-3"
          style={{ maxWidth: 960 }}
        >
          <View className="max-h-[86vh] overflow-hidden rounded-card border border-brand-soft bg-paper">
            <View className="flex-row items-center justify-between border-b border-brand-soft px-5 py-3.5">
              <Text className="font-heavy text-sectionTitle text-paper-ink">Khám phá</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={onClose}
                className="h-8 w-8 items-center justify-center rounded-pill bg-brand-tint"
              >
                <Icon name="close" size={16} color={paper.body} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
              {groups.map((group) => (
                <View key={group.key}>
                  {group.title ? (
                    <Text className="mb-2 font-strong text-label uppercase tracking-wide text-paper-muted">
                      {group.title}
                    </Text>
                  ) : null}
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map((item) => {
                      const active = activeKey === item.key;
                      return (
                        <Link key={item.key} href={item.href as never} asChild>
                          <Pressable
                            accessibilityRole="link"
                            accessibilityState={{ selected: active }}
                            onPress={onClose}
                            className={[
                              'flex-row items-center gap-2.5 rounded-panel border px-3.5 py-3',
                              active
                                ? 'border-brand bg-brand-soft'
                                : 'border-brand-soft bg-white',
                            ].join(' ')}
                            style={{ minWidth: 168 }}
                          >
                            <Icon
                              name={item.icon}
                              size={18}
                              color={active ? paper.brandMid : paper.body}
                              strokeWidth={active ? 2 : 1.7}
                            />
                            <Text
                              className={[
                                'text-body',
                                active ? 'font-strong text-paper-ink' : 'font-mid text-paper-body',
                              ].join(' ')}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        </Link>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
