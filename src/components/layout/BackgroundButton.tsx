import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { ThemePicker } from '@/components/vocab/study/LearnSettingsSheet';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Nút "Nền" ở đầu màn làm bài (chép chính tả, dịch câu, nghe chép, chép theo video): mở bảng chọn nền cá nhân hoá —
 * CÙNG cài đặt "Nền & hiệu ứng" của màn học từ vựng (cảnh bay, cảnh thành phố pixel, tranh nổi tiếng, vũ trụ…), nên đổi ở
 * đâu cũng áp cho cả hai. Áp ngay, không cần bấm Lưu.
 */
export function BackgroundButton({ ink = '#1B1A17', pill = 'rgba(255,255,255,0.75)' }: { ink?: string; pill?: string }) {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L('Đổi nền', 'Change background')}
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5"
        style={{ backgroundColor: pill }}
      >
        <Icon name="sparkle" size={14} color={ink} strokeWidth={2.2} />
        <Text className="font-semi text-label" style={{ color: ink }}>
          {L('Nền', 'Background')}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 items-center justify-center px-4 py-6" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
          <Pressable onPress={() => {}} className="w-full rounded-[26px] bg-white" style={{ maxWidth: 560, maxHeight: '90%', cursor: 'auto' } as object}>
            <View className="flex-row items-center justify-between px-5 pb-2 pt-5 sm:px-6">
              <Text className="font-heavy text-sectionTitle text-ink">{L('Nền khi làm bài', 'Background while practising')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={() => setOpen(false)} className="h-10 w-10 items-center justify-center rounded-pill">
                <Icon name="close" size={18} color={color.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <ThemePicker />
              <Text className="mt-3 font-sans text-label text-muted">
                {L('Dùng chung với màn học từ vựng. Bật nền thì nội dung bài nằm trên một tấm giấy sáng để dễ đọc.', 'Shared with the vocabulary study screens. With a background on, the exercise sits on a light sheet so it stays easy to read.')}
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
