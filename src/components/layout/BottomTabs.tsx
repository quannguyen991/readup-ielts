import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { BOTTOM_BAR_HEIGHT, BOTTOM_BAR_VAR, useChromeStore } from './chrome-store';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { INITIAL_SCROLL_BAR_STATE, nextScrollBarState, type ScrollBarState } from '@/lib/mobile/scroll-direction';
import { BOTTOM_TAB_ITEMS, activeNavKey, parentNavKey } from '@/navigation/nav-items';
import { haptic } from '@/services/haptics';
import { color } from '@/theme/tokens';

const IS_WEB = Platform.OS === 'web';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
/** Trang có ít chỗ cuộn hơn bấy nhiêu thì khỏi ẩn thanh: chẳng có gì để cuộn. */
const MIN_SCROLLABLE = 140;

/** Nhãn ngắn cho tab — "Từ vựng" thay vì cả nhãn mục. */
const SHORT: Record<string, [string, string]> = {
  dashboard: ['Hôm nay', 'Today'],
  ielts: ['IELTS', 'IELTS'],
  sat: ['SAT', 'SAT'],
  vocabulary: ['Từ vựng', 'Words'],
  quest: ['Quest', 'Quest'],
};

/**
 * Chiều cao đáy mà thanh tab đang chiếm, theo CSS. Đưa ra biến để nút nổi (trợ
 * lý AI), thanh nút dính đáy… đứng cao lên đúng bằng thế mà không cần biết gì
 * về thanh tab.
 */
function bottomBarSpace(visible: boolean): string {
  return visible ? `calc(${BOTTOM_BAR_HEIGHT}px + ${SAFE_BOTTOM})` : '0px';
}

/**
 * Thanh tab dưới — chỉ ở màn hẹp (< lg) và chỉ ở màn DUYỆT (AppShell không vẽ nó
 * ở màn làm bài / toàn khung).
 *
 * - Năm đích chính; phần còn lại nằm sau nút "Khám phá" ở thanh trên.
 * - Cuộn xuống thì trượt ẩn, cuộn lên thì hiện (logic ở `lib/mobile/scroll-direction`).
 *   Nghe sự kiện `scroll` ở cấp tài liệu, kiểu capture + passive, đúng một chỗ —
 *   không màn nào phải nối dây, và không có lần render nào theo từng pixel cuộn:
 *   state chỉ đổi khi thanh đổi chiều.
 * - Bàn phím ảo mở (ô nhập đang focus) thì ẩn, đỡ ăn mất một phần ba màn hình.
 * - Vùng an toàn bằng `env(safe-area-inset-bottom)` (cần `viewport-fit=cover`, xem `app/+html.tsx`).
 */
export function BottomTabs() {
  const pathname = usePathname();
  const { L } = useL();
  const barHidden = useChromeStore((s) => s.barHidden);
  const keyboardOpen = useChromeStore((s) => s.keyboardOpen);
  const visible = !barHidden && !keyboardOpen;

  const active = parentNavKey(activeNavKey(pathname));

  // Đổi trang thì thanh hiện lại.
  useEffect(() => {
    useChromeStore.getState().setBarHidden(false);
  }, [pathname]);

  // Ẩn / hiện theo chiều cuộn + theo bàn phím ảo.
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    const states = new WeakMap<Element, ScrollBarState>();
    let raf = 0;
    let pending: Element | null = null;

    const process = (el: Element) => {
      const h = el as HTMLElement;
      // Bỏ qua hàng cuộn ngang, hộp cuộn nhỏ lồng bên trong, trang quá ngắn.
      if (h.scrollHeight - h.clientHeight < MIN_SCROLLABLE || h.clientHeight < window.innerHeight * 0.45) return;
      const prev = states.get(h) ?? { ...INITIAL_SCROLL_BAR_STATE, anchor: h.scrollTop };
      const next = nextScrollBarState(prev, h.scrollTop);
      states.set(h, next);
      useChromeStore.getState().setBarHidden(next.hidden);
    };
    const onScroll = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      pending = e.target;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (pending) process(pending);
      });
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });

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
      // Chuyển focus từ ô này sang ô khác không được làm thanh nhấp nháy.
      blurTimer = setTimeout(() => useChromeStore.getState().setKeyboardOpen(false), 120);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      cancelAnimationFrame(raf);
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

  return (
    <View
      accessibilityRole="tablist"
      // Ẩn ở khổ desktop bằng breakpoint (không đo bằng JS — máy chủ không biết bề rộng).
      className="lg:hidden"
      style={
        {
          position: IS_WEB ? 'fixed' : 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 45,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopWidth: 1,
          borderTopColor: '#EFE3C8',
          paddingBottom: IS_WEB ? SAFE_BOTTOM : 0,
          transform: [{ translateY: visible ? 0 : '110%' }],
          // Trượt bằng transform (GPU), không đụng layout.
          ...(IS_WEB ? { transition: 'transform 200ms ease', willChange: 'transform' } : null),
        } as never
      }
    >
      <View style={{ flexDirection: 'row', height: BOTTOM_BAR_HEIGHT }}>
        {BOTTOM_TAB_ITEMS.map((item) => {
          const on = active === item.key;
          const [vi, en] = SHORT[item.key] ?? [item.label, item.label];
          const label = L(vi, en);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              onPress={() => {
                haptic();
                if (!on) router.navigate(item.href as never);
              }}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              <View
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? '#F3E7CC' : 'transparent',
                }}
              >
                <Icon name={item.icon} size={21} color={on ? color.primaryDark : color.muted} strokeWidth={on ? 2.1 : 1.7} />
              </View>
              <Text
                numberOfLines={1}
                className={on ? 'font-strong' : 'font-mid'}
                style={{ fontSize: 12, lineHeight: 14, color: on ? color.primaryDark : color.muted }}
              >
                {label}
              </Text>
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
  const visible = useChromeStore((st) => !st.barHidden && !st.keyboardOpen);
  if (!IS_WEB) return null;
  // Tính bằng CSS ngay từ bản máy chủ (không chờ hydrate) nên không có cú giật bố cục lúc tải.
  return <View className="lg:hidden" style={{ height: bottomBarSpace(visible) as unknown as number }} />;
}
