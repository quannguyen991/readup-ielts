import { themedHex } from '@/theme/palette-state';
import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { BOTTOM_BAR_HEIGHT, BOTTOM_BAR_VAR, useChromeStore } from './chrome-store';
import { CoinIcon, type CoinName } from '@/components/ui/CoinIcon';
import { useL } from '@/i18n/useL';
import { useDisplayName } from '@/store/useAuthStore';
import { haptic } from '@/services/haptics';
import { RetroTabBar } from '@/components/profile-retro/RetroNav';
import { useRetroOn } from '@/components/profile-retro/retro-mode-store';
import { PerchCat } from '@/components/mascot/PerchCat';
import { useRewardStore } from '@/store/useRewardStore';

const IS_WEB = Platform.OS === 'web';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
/** Khoảng cách từ thanh nổi tới mép màn hình. */
const FLOAT_MARGIN = 14;

/**
 * Bốn tab của thiết kế vàng kem. Chỉ hiện icon; tên tab (`vi`/`en`) nằm trong nhãn
 * trợ năng. Mục còn lại (SAT, Từ vựng…) nằm trong bảng Khám phá ở thanh trên.
 */
const TABS: { key: 'home' | 'learn' | 'plan' | 'you'; href: string; coin: CoinName | null; vi: string; en: string }[] = [
  { key: 'home', href: '/intro', coin: 'home', vi: 'Trang chủ', en: 'Home' },
  { key: 'learn', href: '/vocabulary/quiz', coin: 'vocab', vi: 'Từ vựng', en: 'Vocabulary' },
  { key: 'plan', href: '/plan', coin: 'path', vi: 'Lộ trình', en: 'Plan' },
  { key: 'you', href: '/profile', coin: null, vi: 'Bạn', en: 'You' },
];

function activeTab(pathname: string): (typeof TABS)[number]['key'] {
  if (pathname === '/' || pathname === '/dashboard' || pathname === '/intro') return 'home';
  if (pathname.startsWith('/plan')) return 'plan';
  if (pathname.startsWith('/profile') || pathname.startsWith('/progress')) return 'you';
  return 'learn';
}

/**
 * Chiều cao đáy mà thanh tab đang chiếm, theo CSS. Đưa ra biến để nút nổi (trợ
 * lý AI), thanh nút dính đáy… đứng cao lên đúng bằng thế mà không cần biết gì
 * về thanh tab.
 */
function bottomBarSpace(visible: boolean): string {
  return visible ? `calc(${BOTTOM_BAR_HEIGHT + FLOAT_MARGIN}px + ${SAFE_BOTTOM})` : '0px';
}

/**
 * Thanh tab dưới — chỉ ở màn hẹp (< lg) và chỉ ở màn DUYỆT (AppShell không vẽ nó
 * ở màn làm bài / toàn khung).
 *
 * - Cố định ở đáy và luôn hiện: không ẩn khi cuộn, không trượt theo trang.
 * - Chỉ có icon. Bàn phím ảo mở (ô nhập đang focus) thì tạm ẩn, đỡ che ô đang gõ.
 * - Vùng an toàn bằng `env(safe-area-inset-bottom)` (cần `viewport-fit=cover`, xem `app/+html.tsx`).
 */
export function BottomTabs() {
  const pathname = usePathname();
  const { L } = useL();
  const initial = (useDisplayName().trim()[0] ?? 'B').toUpperCase();
  const keyboardOpen = useChromeStore((s) => s.keyboardOpen);
  const retro = useRetroOn();
  const visible = !keyboardOpen;
  const chiikawaTheme = useRewardStore((s) => s.theme === 'theme-chiikawa');

  const active = activeTab(pathname);

  // Bàn phím ảo: theo focus vào ô nhập. Chuyển focus từ ô này sang ô khác không làm thanh nhấp nháy.
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    const onFocusIn = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      clearTimeout(blurTimer);
      useChromeStore.getState().setKeyboardOpen(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      blurTimer = setTimeout(() => useChromeStore.getState().setKeyboardOpen(false), 120);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      clearTimeout(blurTimer);
      useChromeStore.getState().setKeyboardOpen(false);
    };
  }, []);

  // Báo phần đáy bị chiếm cho phần còn lại của trang (nút nổi, thanh dính đáy).
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    document.documentElement.style.setProperty(BOTTOM_BAR_VAR, bottomBarSpace(visible));
  }, [visible]);
  useEffect(
    () => () => {
      if (IS_WEB && typeof document !== 'undefined') document.documentElement.style.setProperty(BOTTOM_BAR_VAR, '0px');
    },
    [],
  );

  // Bản mẫu hồ sơ kiểu retro: đổi sang thanh tab cùng phong cách (xem profile-retro/RetroNav.tsx).
  if (retro) return <RetroTabBar active={active} />;

  return (
    <View
      accessibilityRole="tablist"
      // Ẩn ở khổ desktop bằng breakpoint (không đo bằng JS — máy chủ không biết bề rộng).
      className="lg:hidden"
      style={
        {
          // Khối bo tròn nổi trên nội dung: kính ngà nhẹ, bóng mỏng, không dải vàng phía sau.
          position: IS_WEB ? 'fixed' : 'absolute',
          left: FLOAT_MARGIN,
          right: FLOAT_MARGIN,
          bottom: IS_WEB ? `calc(${FLOAT_MARGIN}px + ${SAFE_BOTTOM})` : FLOAT_MARGIN,
          zIndex: 45,
          borderRadius: 28,
          // Không blur: lớp mờ nằm trên nội dung đang cuộn làm điện thoại giật; nền đặc hơn thay thế.
          backgroundColor: chiikawaTheme ? 'rgba(255,247,250,0.97)' : 'rgba(255,252,242,0.95)',
          borderWidth: 1,
          borderColor: chiikawaTheme ? '#F3C7D5' : 'rgba(255,255,255,0.85)',
          boxShadow: chiikawaTheme ? '0 10px 24px rgba(185,74,112,0.14), inset 0 1px 0 rgba(255,255,255,0.9)' : '0 10px 24px rgba(150,110,40,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          // Chỉ trượt xuống khi bàn phím mở.
          transform: [{ translateY: visible ? 0 : '110%' }],
          ...(IS_WEB ? { transition: 'transform 200ms ease', willChange: 'transform' } : null),
        } as never
      }
    >
      {/* Sáu con mèo bám lên mép trên thanh tab, chỉ trên đoạn thẳng của mép (không vào góc bo). Bàn chân hoặc mông chạm đúng mép: lift theo từng tư thế. Chỉ là trang trí, không nhận chạm. */}
      {/* Chủ đề Chiikawa: không có mèo bám trên thanh tab. */}
      {chiikawaTheme ? null : (
      <>
      <PerchCat pose="clingHang" size={42} side="left" inset="8.6%" lift={0.4} />
      <PerchCat pose="clingWave" size={42} side="left" inset="22.8%" lift={0.52} />
      <PerchCat pose="clingSit" size={42} side="left" inset="37%" lift={0.78} />
      <PerchCat pose="clingLie" size={42} side="left" inset="51.2%" lift={0.62} />
      <PerchCat pose="clingPeek" size={42} side="left" inset="65.4%" lift={0.52} />
      <PerchCat pose="clingClimb" size={42} side="left" inset="79.6%" lift={0.42} />
      </>
      )}
      <View style={{ flexDirection: 'row', height: BOTTOM_BAR_HEIGHT, alignItems: 'center' }}>
        {TABS.map((item) => {
          const on = active === item.key;
          const label = L(item.vi, item.en);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              // Tải sẵn trang khi ngón tay chạm xuống, để lúc thả ra chuyển trang gần như tức thì.
              onPressIn={() => {
                if (!on) router.prefetch(item.href as never);
              }}
              onPress={() => {
                haptic();
                if (!on) router.navigate(item.href as never);
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: BOTTOM_BAR_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              <View
                style={[
                  { width: 60, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
                  on ? { backgroundColor: chiikawaTheme ? 'rgba(214,94,134,0.14)' : 'rgba(217,164,65,0.18)' } : null,
                ] as never}
              >
                {item.coin ? (
                  // Tab đang mở to và rõ; tab khác nhỏ và mờ đi, giữ đúng màu đồng xu.
                  <View style={{ opacity: on ? 1 : 0.55 }}>
                    <CoinIcon name={item.coin} size={on ? 40 : 34} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? 'rgba(255,255,255,0.8)' : themedHex('#F4E2B0'),
                    }}
                  >
                    <Text style={{ fontSize: 13, lineHeight: 16, fontWeight: '700', color: themedHex('#8C6A1F') }}>{initial}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Khoảng đệm cuối khung để nội dung không bị thanh tab che. Chiều cao đi theo
 * biến CSS nên thu về 0 cùng lúc thanh ẩn — vùng cuộn dài ra thêm, mà nội dung
 * đang xem không nhúc nhích.
 */
export function BottomTabsSpacer() {
  const visible = useChromeStore((st) => !st.keyboardOpen);
  if (!IS_WEB) return null;
  // Tính bằng CSS ngay từ bản máy chủ (không chờ hydrate) nên không có cú giật bố cục lúc tải.
  return <View className="lg:hidden" style={{ height: bottomBarSpace(visible) as unknown as number }} />;
}
