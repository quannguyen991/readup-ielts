import React from 'react';
import { View } from 'react-native';

import { themeOf } from './study-theme';

/** Bản iOS/Android: chỉ nền phẳng theo chủ đề (hoạt hình CSS chỉ có ở bản web — `StudyBackdrop.web.tsx`). */
/** Bản app gốc không có tranh: không có chú thích. */
export function StudyBackdropCaption(_: { id: string }) {
  return null;
}

export function StudyBackdrop({ id, children }: { id: string; children: React.ReactNode; caption?: boolean }) {
  return (
    <View className="flex-1" style={{ backgroundColor: themeOf(id).skyBase }}>
      {children}
    </View>
  );
}
