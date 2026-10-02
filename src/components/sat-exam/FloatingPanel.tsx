import React, { useEffect, useState } from 'react';
import { PanResponder, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { EXAM } from './exam-theme';
import { toBody } from './to-body';

/**
 * Bảng nổi kéo được (nắm thanh tiêu đề) và co giãn được (góc dưới phải) — dùng
 * cho máy tính và bảng công thức. Màn hẹp thì thành tấm trượt ở đáy, không kéo.
 */
export function FloatingPanel({
  title,
  onClose,
  initial,
  minW = 280,
  minH = 260,
  children,
}: {
  title: string;
  onClose: () => void;
  initial: { x: number; y: number; w: number; h: number };
  minW?: number;
  minH?: number;
  children: React.ReactNode;
}) {
  const { L } = useL();
  const { width: winW, height: winH } = useWindowDimensions();
  const narrow = winW < 640;
  const [box, setBox] = useState(initial);
  // Bộ kéo tạo một lần; vị trí đang có giữ trong biến đóng (không dùng ref trong lúc vẽ).
  const [pan] = useState(() => {
    let cur = initial;
    let start = initial;
    let bounds = { w: 1e5, h: 1e5 };
    const set = (next: typeof initial) => {
      cur = next;
      setBox(next);
    };
    return {
      setBounds: (w: number, h: number) => {
        bounds = { w, h };
      },
      drag: PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start = cur;
        },
        onPanResponderMove: (_, g) =>
          set({
            ...start,
            x: Math.max(0, Math.min(bounds.w - 80, start.x + g.dx)),
            y: Math.max(0, Math.min(bounds.h - 48, start.y + g.dy)),
          }),
      }),
      resize: PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start = cur;
        },
        onPanResponderMove: (_, g) => set({ ...start, w: Math.max(minW, start.w + g.dx), h: Math.max(minH, start.h + g.dy) }),
      }),
    };
  });
  useEffect(() => pan.setBounds(winW, winH), [pan, winW, winH]);

  const frame = narrow
    ? { left: 0, right: 0, bottom: 0, height: Math.min(winH * 0.78, 600) }
    : {
        left: Math.min(box.x, Math.max(0, winW - box.w - 8)),
        top: Math.min(box.y, Math.max(0, winH - 120)),
        width: Math.min(box.w, winW - 16),
        height: Math.min(box.h, winH - 16),
      };

  return toBody(
    <View
      accessibilityRole="none"
      aria-label={title}
      style={{
        position: 'fixed',
        zIndex: 70,
        ...frame,
        backgroundColor: '#FFFFFF',
        borderRadius: narrow ? 0 : 12,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderWidth: 1,
        borderColor: EXAM.barLine,
        boxShadow: '0 18px 48px rgba(15,29,51,0.25)',
        overflow: 'hidden',
      }}
    >
      <View
        {...(narrow ? {} : pan.drag.panHandlers)}
        className="flex-row items-center gap-2 px-3 py-2"
        style={{ backgroundColor: EXAM.navy, cursor: narrow ? undefined : 'move', userSelect: 'none' } as object}
      >
        {!narrow ? (
          <Text className="font-strong" style={{ color: EXAM.goldSoft, fontSize: 14, letterSpacing: 1 }}>
            ⠿
          </Text>
        ) : null}
        <Text className="min-w-0 flex-1 font-strong text-label" style={{ color: '#FFFFFF' }} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Đóng', 'Close')}
          onPress={onClose}
          className="items-center justify-center rounded-md"
          style={{ width: 44, height: 44, margin: -8 }}
        >
          <Icon name="close" size={16} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
      <View className="min-h-0 flex-1">{children}</View>
      {!narrow ? (
        <View
          {...pan.resize.panHandlers}
          accessibilityLabel={L('Kéo để đổi cỡ', 'Drag to resize')}
          style={{ position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, cursor: 'nwse-resize' } as object}
        >
          <View style={{ position: 'absolute', right: 4, bottom: 4, width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2, borderColor: EXAM.optionLine }} />
        </View>
      ) : null}
    </View>,
  );
}
