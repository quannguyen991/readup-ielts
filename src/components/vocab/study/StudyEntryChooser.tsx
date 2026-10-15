import React from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useBackdropStore } from '@/store/useBackdropStore';
import { color } from '@/theme/tokens';

/**
 * Hỏi NGAY khi vào học: giao diện mặc định (phẳng, gọn) hay Chiikawa (hồng, có hiệu ứng).
 * Chọn xong áp dụng luôn cho bảng học này; đổi sau vẫn được trong Cài đặt → Nền & hiệu ứng.
 */
export function StudyEntryChooser({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { L } = useL();
  const current = useTopicStudyStore((s) => s.studyTheme);
  const setTheme = useTopicStudyStore((s) => s.setStudyTheme);
  const setFx = useTopicStudyStore((s) => s.setStudyFx);
  const setArtOn = useBackdropStore((s) => s.setStudyOn);

  const pickPlain = () => {
    setArtOn(false);
    setFx(false);
    setTheme('plain');
    onDone();
  };
  const pickChiikawa = () => {
    setArtOn(false);
    setFx(true);
    setTheme('chiikawa');
    onDone();
  };

  const isChiikawa = current === 'chiikawa';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        accessibilityViewIsModal
      >
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 22,
            padding: 20,
            backgroundColor: '#FFFFFF',
            gap: 14,
            ...(Platform.OS === 'web' ? ({ boxShadow: '0 18px 48px rgba(15,23,42,0.22)', animation: 'ab-pop 260ms cubic-bezier(.2,.8,.2,1)' } as object) : null),
          }}
        >
          <Text className="font-heavy text-ink" style={{ fontSize: 19 }}>
            {L('Chọn giao diện học', 'Pick a study look')}
          </Text>
          <Text className="font-sans text-label text-muted">
            {L('Áp dụng cho bảng học này. Đổi sau được trong Cài đặt.', 'Applies to this session. You can change it later in Settings.')}
          </Text>

          <Choice
            title={L('Mặc định', 'Default')}
            desc={L('Nền phẳng, gọn, nhẹ máy.', 'Flat, clean, light on the device.')}
            swatch={['#F8F6F1', '#E8E2D4']}
            on={!isChiikawa}
            onPress={pickPlain}
          />
          <Choice
            title="Chiikawa"
            desc={L('Nền hồng, hoa đào rơi, Chiikawa cổ vũ.', 'Pink sky, falling petals, Chiikawa cheering you on.')}
            swatch={['#FFF6FA', '#F7A9C6']}
            on={isChiikawa}
            onPress={pickChiikawa}
          />

          <Pressable accessibilityRole="button" onPress={onDone} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 }}>
            <Text className="font-semi text-label text-muted">{L('Giữ như đang chọn', 'Keep current')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Choice({ title, desc, swatch, on, onPress }: { title: string; desc: string; swatch: [string, string]; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) =>
        ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          borderRadius: 16,
          borderWidth: on ? 2.5 : 1,
          borderColor: on ? color.primary : '#E1D9CB',
          backgroundColor: '#FFFFFF',
          transform: [{ scale: pressed ? 0.98 : 1 }],
          transition: 'transform 180ms ease',
        }) as never
      }
    >
      <View style={{ width: 56, height: 44, borderRadius: 12, overflow: 'hidden', backgroundColor: swatch[0], ...({ backgroundImage: `linear-gradient(135deg, ${swatch[0]}, ${swatch[1]})` } as object) }} />
      <View style={{ flex: 1 }}>
        <Text className="font-heavy text-ink">{on ? '✓ ' : ''}{title}</Text>
        <Text className="font-sans text-label text-muted">{desc}</Text>
      </View>
    </Pressable>
  );
}
