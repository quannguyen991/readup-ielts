import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { useL } from '@/i18n/useL';
import { T } from '../ui/kit';

/** Ngăn kéo trượt từ cạnh phải: nền giấy kem viền navy, tiêu đề + nút đóng; phủ mờ phần còn lại (bấm để đóng). */
export function Drawer({ title, onClose, children, header }: { title: string; onClose: () => void; children: React.ReactNode; header?: React.ReactNode }) {
  const { L } = useL();
  const win = useWindowDimensions();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 20);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [onClose]);
  const w = Math.min(400, win.width - 24);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }} pointerEvents="box-none">
      <Pressable accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: shown ? 'rgba(15,29,51,0.32)' : 'rgba(15,29,51,0)' }} />
      <View
        accessibilityViewIsModal
        style={
          {
            position: 'absolute',
            top: 8,
            bottom: 8,
            right: 8,
            width: w,
            backgroundColor: T.paper,
            borderWidth: 2,
            borderColor: T.navy,
            borderRadius: 10,
            overflow: 'hidden',
            transform: [{ translateX: shown ? 0 : w + 24 }],
            transitionProperty: 'transform',
            transitionDuration: '220ms',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          } as object
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: T.navy, gap: 10 }}>
          <Text className="font-heavy" style={{ flex: 1, fontSize: 16, color: T.goldLight, letterSpacing: 0.4 }}>
            {title}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 }}>
            <Text style={{ fontSize: 22, color: T.goldLight }}>✕</Text>
          </Pressable>
        </View>
        {header}
        {children}
      </View>
    </View>
  );
}
