import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';

import { BOTTOM_BAR_HEIGHT, BOTTOM_BAR_VAR, useChromeStore } from './chrome-store';
import { Icon, type IconName } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { useDisplayName } from '@/store/useAuthStore';
import { haptic } from '@/services/haptics';
import { RetroTabBar } from '@/components/profile-retro/RetroNav';
import { useRetroOn } from '@/components/profile-retro/retro-mode-store';
import { useRewardStore } from '@/store/useRewardStore';

const IS_WEB = Platform.OS === 'web';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
/** Khoảng cách từ thanh nổi tới mép màn hình. */
const FLOAT_MARGIN = 12;
const PURPLE = '#6A4BD9';
const INACTIVE = '#8E86B0';

type TabKey = 'home' | 'vocab' | 'speak' | 'plan' | 'you';

/**
 * Thanh tab dưới (điện thoại): năm mục, nút giữa là Nói (luyện speaking) nổi lên khỏi thanh.
 * Mỗi mục có icon và nhãn ngắn để người học biết đang ở đâu mà không đoán.
 */
const SIDE_TABS: { key: Exclude<TabKey, 'speak'>; href: string; icon: IconName; vi: string; en: string }[] = [
  { key: 'home', href: '/intro', icon: 'home', vi: 'Trang chủ', en: 'Home' },
  { key: 'vocab', href: '/vocabulary', icon: 'letters', vi: 'Từ vựng', en: 'Vocabulary' },
  { key: 'plan', href: '/lo-trinh-hoc', icon: 'calendar', vi: 'Lộ trình', en: 'Plan' },
  { key: 'you', href: '/profile', icon: 'home', vi: 'Bạn', en: 'You' },
];
const SPEAK_TAB = { href: '/speaking', vi: 'Nói', en: 'Speak' };

function activeTab(pathname: string): TabKey {
  if (pathname === '/' || pathname === '/dashboard' || pathname === '/intro') return 'home';
  if (pathname.startsWith('/speaking')) return 'speak';
  if (pathname.startsWith('/plan') || pathname.startsWith('/lo-trinh-hoc')) return 'plan';
  if (pathname.startsWith('/profile') || pathname.startsWith('/progress')) return 'you';
  return 'vocab';
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
 * - Bàn phím ảo mở (ô nhập đang focus) thì tạm ẩn, đỡ che ô đang gõ.
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
  const accent = chiikawaTheme ? '#D65E86' : PURPLE;

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
  if (retro) return <RetroTabBar active={active === 'speak' || active === 'vocab' ? 'learn' : active} />;

  const go = (href: string, on: boolean) => {
    haptic();
    if (!on) router.navigate(href as never);
  };
  const prefetch = (href: string, on: boolean) => {
    if (!on) router.prefetch(href as never);
  };

  const side = (item: (typeof SIDE_TABS)[number]) => {
    const on = active === item.key;
    const label = L(item.vi, item.en);
    const color = on ? accent : INACTIVE;
    return (
      <TabButton
        key={item.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={label}
        onPressIn={() => prefetch(item.href, on)}
        onPress={() => go(item.href, on)}
      >
        {item.key === 'you' ? (
          // Mục "Bạn": chữ cái đầu tên người học, khoanh màu khi đang mở.
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? accent : '#EEE9FF',
            }}
          >
            <Text style={{ fontSize: 12, lineHeight: 15, fontWeight: '700', color: on ? '#FFFFFF' : PURPLE }}>{initial}</Text>
          </View>
        ) : (
          <Icon name={item.icon} size={22} color={color} strokeWidth={on ? 2.2 : 1.9} />
        )}
        <Text style={{ marginTop: 3, fontSize: 10.5, lineHeight: 13, fontWeight: on ? '700' : '600', color }}>{label}</Text>
      </TabButton>
    );
  };

  const speakOn = active === 'speak';
  const speakLabel = L(SPEAK_TAB.vi, SPEAK_TAB.en);

  return (
    <View
      accessibilityRole="tablist"
      // Ẩn ở khổ desktop bằng breakpoint (không đo bằng JS — máy chủ không biết bề rộng).
      className="lg:hidden"
      style={
        {
          position: IS_WEB ? 'fixed' : 'absolute',
          left: FLOAT_MARGIN,
          right: FLOAT_MARGIN,
          bottom: IS_WEB ? `calc(${FLOAT_MARGIN}px + ${SAFE_BOTTOM})` : FLOAT_MARGIN,
          zIndex: 45,
          height: BOTTOM_BAR_HEIGHT,
          borderRadius: 30,
          // Không blur: lớp mờ nằm trên nội dung đang cuộn làm điện thoại giật; nền đặc hơn thay thế.
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderWidth: 1,
          borderColor: '#F1EEFB',
          ...(IS_WEB
            ? { boxShadow: '0 12px 28px rgba(106,75,217,0.14), inset 0 1px 0 rgba(255,255,255,0.9)' }
            : { shadowColor: PURPLE, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }),
          // Chỉ trượt xuống khi bàn phím mở.
          transform: [{ translateY: visible ? 0 : '130%' }],
          ...(IS_WEB ? { transition: 'transform 220ms cubic-bezier(.16,1,.3,1)', willChange: 'transform' } : null),
        } as never
      }
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {side(SIDE_TABS[0]!)}
        {side(SIDE_TABS[1]!)}

        {/* Nút giữa: Nói. Nổi lên trên mép thanh, bấm là vào phòng luyện speaking. */}
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: speakOn }}
          accessibilityLabel={speakLabel}
          onPressIn={() => prefetch(SPEAK_TAB.href, speakOn)}
          onPress={() => go(SPEAK_TAB.href, speakOn)}
          style={({ pressed }: { pressed: boolean }) => ({ width: 84, alignItems: 'center', justifyContent: 'flex-end', height: BOTTOM_BAR_HEIGHT, paddingBottom: 6, transform: [{ scale: pressed ? 0.94 : 1 }] })}
        >
          <View
            style={{
              marginTop: -28,
              width: 58,
              height: 58,
              borderRadius: 29,
              borderWidth: 4,
              borderColor: '#FFFFFF',
              overflow: 'hidden',
              ...(IS_WEB
                ? { boxShadow: '0 10px 22px rgba(139,108,240,0.38)' }
                : { shadowColor: '#8B6CF0', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
            }}
          >
            <LinearGradient colors={['#E0413A', '#F28C28', '#F5C518', '#3DBE6B', '#3F8AE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mic" size={24} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
          </View>
          <Text style={{ marginTop: 3, fontSize: 10.5, lineHeight: 13, fontWeight: speakOn ? '700' : '600', color: speakOn ? accent : INACTIVE }}>{speakLabel}</Text>
        </Pressable>

        {side(SIDE_TABS[2]!)}
        {side(SIDE_TABS[3]!)}
      </View>
    </View>
  );
}

/**
 * Một nút tab: rê chuột thì nhô lên nhẹ, bấm thì co lại. Trên web chuyển động có transition
 * nên mượt, không giật từ trạng thái này sang trạng thái kia.
 */
function TabButton({ children, ...rest }: PressableProps & { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...rest}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) =>
        ({
          flex: 1,
          height: BOTTOM_BAR_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.92 : hovered ? 1.05 : 1 }],
          ...(IS_WEB ? { transition: 'transform 160ms ease, opacity 160ms ease' } : null),
        }) as never
      }
    >
      {children}
    </Pressable>
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
