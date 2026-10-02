import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from './Icon';
import { useL } from '@/i18n/useL';
import { haptic } from '@/services/haptics';
import { paper } from '@/theme/tokens';

const IS_WEB = Platform.OS === 'web';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
/** Kéo tay cầm xuống quá bấy nhiêu px (hoặc vuốt đủ nhanh) thì đóng. */
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 0.9;
const ENTER_MS = 220;
const EXIT_MS = 170;
/** Quãng bảng nằm dưới màn lúc chưa hiện. Lớn hơn mọi bảng thực tế (cao ≤ màn hình). */
const OFFSCREEN = 900;

function prefersReducedMotion(): boolean {
  if (!IS_WEB || typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Tiêu đề trên đầu bảng (có nút đóng ≥44px bên phải). Bỏ trống thì chỉ có tay cầm. */
  title?: string;
  /** Nội dung cuộn được. Có `overscroll-behavior: contain` nên cuộn tới đáy không kéo trang phía sau. */
  children: React.ReactNode;
  /** Phần dính đáy (nút hành động chính), nằm ngoài vùng cuộn và trên vùng an toàn. */
  footer?: React.ReactNode;
  /** Trần bề rộng ở màn rộng (máy tính bảng). Mặc định 640. */
  maxWidth?: number;
  accessibilityLabel?: string;
};

/**
 * Bảng trượt từ đáy — dạng hộp thoại mặc định trên điện thoại.
 *
 * - Tay cầm kéo-để-đóng, chạm nền mờ đóng, Esc / nút Back (qua `Modal.onRequestClose`) đóng.
 * - Chừa vùng an toàn đáy (`env(safe-area-inset-bottom)`), cao tối đa `100dvh − 48px`
 *   nên bàn phím ảo mở ra cũng không đẩy bảng ra khỏi màn.
 * - Chuyển động chỉ dùng transform + opacity, ≤ 220ms; "giảm chuyển động" thì hiện ngay.
 * - Mọi đường đóng (nền, nút, tay cầm, Esc, Back) đều chạy hoạt ảnh trượt xuống rồi
 *   mới gọi `onClose`, nên bảng không biến mất cái cụt.
 */
export function Sheet({ visible, onClose, ...rest }: SheetProps) {
  if (!visible) return null;
  return <SheetBody onClose={onClose} {...rest} />;
}

function SheetBody({ onClose, title, children, footer, maxWidth = 640, accessibilityLabel }: Omit<SheetProps, 'visible'>) {
  const { L } = useL();
  const [reduced] = useState(prefersReducedMotion);
  // 1 = nằm dưới màn, 0 = đã lên đủ. Dùng Animated của RN (JS thread) — chỉ transform + opacity.
  const [enter] = useState(() => new Animated.Value(reduced ? 0 : 1));
  const [drag] = useState(() => new Animated.Value(0));
  const closing = useRef(false);
  // PanResponder được tạo một lần; trỏ tới bản `requestClose` mới nhất qua ref này.
  const closeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (reduced) return;
    Animated.timing(enter, { toValue: 0, duration: ENTER_MS, easing: Easing.out(Easing.cubic), useNativeDriver: !IS_WEB }).start();
  }, [enter, reduced]);

  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    haptic(6);
    if (reduced) {
      onClose();
      return;
    }
    // Chốt một lần: hoạt ảnh xong HOẶC quá hạn (tab chạy nền bị trình duyệt dừng requestAnimationFrame — bảng không được kẹt lại).
    let called = false;
    const finish = () => {
      if (called) return;
      called = true;
      onClose();
    };
    Animated.timing(enter, { toValue: 1, duration: EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: !IS_WEB }).start(finish);
    setTimeout(finish, EXIT_MS + 150);
  };

  // Các callback bên dưới chỉ chạy khi có cử chỉ (không phải lúc render), nên đọc ref ở đó là đúng.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeRef.current();
        } else {
          Animated.timing(drag, { toValue: 0, duration: 160, useNativeDriver: !IS_WEB }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(drag, { toValue: 0, duration: 160, useNativeDriver: !IS_WEB }).start();
      },
    }),
  );
  useEffect(() => {
    closeRef.current = requestClose;
  });

  const translateY = Animated.add(drag, enter.interpolate({ inputRange: [0, 1], outputRange: [0, OFFSCREEN] }));
  const scrimOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,29,51,0.5)', opacity: scrimOpacity }}
        >
          <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={requestClose} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
          // role=dialog để đọc màn hình hiểu đây là hộp thoại (RNW → role="dialog").
          {...({ role: 'dialog', 'aria-modal': true } as object)}
          style={[
            {
              width: '100%',
              maxWidth,
              alignSelf: 'center',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
              maxHeight: IS_WEB ? ('calc(100dvh - 48px)' as unknown as number) : '92%',
              ...(IS_WEB ? ({ boxShadow: '0 -10px 40px rgba(15,29,51,0.18)' } as object) : null),
            },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Tay cầm: vùng kéo cao 28px để ngón cái bắt được, nét vẽ chỉ 4px. */}
          <View
            {...pan.panHandlers}
            style={{ height: 28, alignItems: 'center', justifyContent: 'center', ...(IS_WEB ? ({ touchAction: 'none', cursor: 'grab' } as object) : null) }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9CFB8' }} />
          </View>

          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 20,
                paddingRight: 8,
                borderBottomWidth: 1,
                borderBottomColor: paper.brandSoft,
              }}
            >
              <Text className="min-w-0 flex-1 font-heavy text-sectionTitle text-paper-ink" numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Đóng', 'Close')}
                onPress={requestClose}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="close" size={18} color={paper.body} strokeWidth={2} />
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...({ dataSet: { sheet: '1' } } as object)}
          >
            {children}
          </ScrollView>

          {footer ? (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: paper.brandSoft,
                backgroundColor: '#FFFFFF',
                paddingBottom: IS_WEB ? (`calc(10px + ${SAFE_BOTTOM})` as unknown as number) : 10,
              }}
            >
              {footer}
            </View>
          ) : (
            <View style={{ height: IS_WEB ? (SAFE_BOTTOM as unknown as number) : 8 }} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
