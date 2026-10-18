import React, { type ReactNode } from 'react';
import { Platform, ScrollView, View, useWindowDimensions } from 'react-native';

import { EXAM_INK } from './ExamToolbar';

/**
 * KHUNG PHÒNG THI READING DÙNG CHUNG: nền navy, hai tấm bo tròn viền mực đặt cạnh
 * nhau (bài đọc bên trái, câu hỏi bên phải). Thanh công cụ do nơi gọi truyền vào
 * (thường là ExamToolbar) và nằm trên cùng.
 *
 * Rộng: hai tấm cạnh nhau, mỗi tấm tự cuộn. Hẹp (dưới 760px): hai tấm xếp dọc trong
 * một khung cuộn, mỗi tấm có chiều cao cố định để bên trong vẫn cuộn được.
 */

export const READING_NAVY = '#0F1D33';
const NARROW_BELOW = 760;

export function ReadingFrame({
  children,
  bg,
  flex,
  height,
}: {
  children: ReactNode;
  bg: string;
  flex?: number;
  height?: number;
}) {
  return (
    <View
      style={[
        {
          flex,
          height,
          minHeight: 0,
          minWidth: 0,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: EXAM_INK,
          backgroundColor: bg,
          overflow: 'hidden',
        },
        Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 rgba(0,0,0,0.35)' } as object) : null,
      ]}
    >
      {children}
    </View>
  );
}

export function ReadingShell({
  toolbar,
  left,
  right,
  shellBg = READING_NAVY,
  leftBg,
  rightBg,
  leftFlex = 1.1,
  rightFlex = 0.9,
  narrowLeftHeight = 460,
  narrowRightHeight = 560,
}: {
  toolbar: ReactNode;
  left: ReactNode;
  right: ReactNode;
  shellBg?: string;
  leftBg: string;
  rightBg: string;
  leftFlex?: number;
  rightFlex?: number;
  /** Chiều cao tấm bài đọc khi xếp dọc (màn hẹp). */
  narrowLeftHeight?: number;
  narrowRightHeight?: number;
}) {
  const { width: winW } = useWindowDimensions();
  const wide = winW >= NARROW_BELOW;
  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: shellBg, padding: wide ? 12 : 10, gap: 10 }}>
      {toolbar}
      {wide ? (
        <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: 12 }}>
          <ReadingFrame bg={leftBg} flex={leftFlex}>
            {left}
          </ReadingFrame>
          <ReadingFrame bg={rightBg} flex={rightFlex}>
            {right}
          </ReadingFrame>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
          <ReadingFrame bg={leftBg} height={narrowLeftHeight}>
            {left}
          </ReadingFrame>
          <ReadingFrame bg={rightBg} height={narrowRightHeight}>
            {right}
          </ReadingFrame>
        </ScrollView>
      )}
    </View>
  );
}
