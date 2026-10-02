import React from 'react';
import { View } from 'react-native';

import { themeOf } from './study-theme';

/** Bản iOS/Android: chỉ nền phẳng theo chủ đề (hoạt hình CSS chỉ có ở bản web — `StudyBackdrop.web.tsx`). */
export function StudyBackdrop({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <View className="flex-1" style={{ backgroundColor: themeOf(id).skyBase }}>
      {children}
    </View>
  );
}
