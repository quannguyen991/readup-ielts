/**
 * Thẻ cài đặt "Nghỉ khi học" trong Cài đặt. Lưu theo máy (xem `useBreakStore`).
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, SectionHeader } from '@/components/ui';
import { BREAK_MINUTE_OPTIONS, STUDY_MINUTE_OPTIONS, useBreakStore } from '@/store/useBreakStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={on}
      onPress={onPress}
      className="items-center justify-center rounded-pill px-3.5 py-2"
      style={{ minHeight: 44, backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#F0EBE2' }}
    >
      <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BreakCard() {
  const enabled = useBreakStore((s) => s.enabled);
  const studyMinutes = useBreakStore((s) => s.studyMinutes);
  const breakMinutes = useBreakStore((s) => s.breakMinutes);
  const setSettings = useBreakStore((s) => s.setSettings);
  const { L } = useL();

  return (
    <Card className="mt-4">
      <SectionHeader
        title={L('Nghỉ khi học', 'Study breaks')}
        subtitle={L('Hết giờ học, mèo nằm chắn màn hình cho tới hết giờ nghỉ.', 'When study time is up, the cat lies across the screen until the break ends.')}
        icon="clock"
      />

      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {enabled ? (
          <Button label={L('Tắt nghỉ khi học', 'Turn off study breaks')} size="sm" variant="outline" onPress={() => setSettings({ enabled: false })} />
        ) : (
          <Button label={L('Bật nghỉ khi học', 'Turn on study breaks')} size="sm" onPress={() => setSettings({ enabled: true })} />
        )}
      </View>

      <Text className="mt-4 font-semi text-label text-ink">{L('Học bao lâu thì nghỉ', 'Study for')}</Text>
      <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
        {STUDY_MINUTE_OPTIONS.map((m) => (
          <Chip key={m} label={L(`${m} phút`, `${m} min`)} on={studyMinutes === m} onPress={() => setSettings({ studyMinutes: m })} />
        ))}
      </View>

      <Text className="mt-4 font-semi text-label text-ink">{L('Nghỉ bao lâu', 'Break for')}</Text>
      <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
        {BREAK_MINUTE_OPTIONS.map((m) => (
          <Chip key={m} label={L(`${m} phút`, `${m} min`)} on={breakMinutes === m} onPress={() => setSettings({ breakMinutes: m })} />
        ))}
      </View>

      <Text className="mt-3 font-sans text-label text-muted">
        {L(
          'Đồng hồ chỉ đếm khi bạn đang ở màn học và có thao tác. Không đếm lúc thi. Cài đặt theo máy này.',
          'The clock only counts on study pages while you are active, and never during a timed test. Saved on this device.',
        )}
      </Text>
    </Card>
  );
}
