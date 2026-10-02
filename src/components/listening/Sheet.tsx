import React from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';

/**
 * Hộp thoại của phòng thi Listening: điện thoại (< 600px) hiện thành "bottom
 * sheet" dính đáy, vừa tầm ngón cái, chừa vùng an toàn; màn rộng giữ hộp giữa màn hình.
 */
export function Sheet({
  visible,
  onClose,
  maxWidth = 380,
  gap = 14,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  maxWidth?: number;
  gap?: number;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const phone = width < 600;
  const safeBottom = Platform.OS === 'web' ? ({ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' } as object) : null;
  return (
    <Modal transparent animationType={phone ? 'slide' : 'fade'} visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: phone ? 'flex-end' : 'center', padding: phone ? 0 : 20 }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => undefined}
          style={[
            {
              width: '100%',
              maxWidth: phone ? undefined : maxWidth,
              maxHeight: '88%',
              backgroundColor: '#FFFFFF',
              padding: 18,
              gap,
            },
            phone ? { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10 } : { borderRadius: 18 },
            safeBottom,
          ]}
        >
          {phone ? <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5DFD2' }} /> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
