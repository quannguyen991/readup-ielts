import React, { useMemo, useState } from 'react';
import { PanResponder, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { useHydrated } from '@/components/layout/useHydrated';
import { useL } from '@/i18n/useL';
import { haptic, hapticsEnabled, hapticsSupported, setHapticsEnabled } from '@/services/haptics';
import { playSfx } from '@/services/audio/sfx-ui';
import { useAudioPrefs } from '@/store/useAudioPrefs';
import { useGameStore } from '@/store/useGameStore';
import { color } from '@/theme/tokens';

function Row({ title, on, onToggle }: { title: string; on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      className="flex-row items-center justify-between gap-3 py-2"
      style={{ minHeight: 44 }}
    >
      <Text className="min-w-0 flex-1 font-semi text-body text-ink">{title}</Text>
      <View className="h-6 w-11 justify-center rounded-pill px-0.5" style={{ backgroundColor: on ? color.primary : '#CBD5E1' }}>
        <View className="h-5 w-5 rounded-pill bg-white" style={{ alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}

/** Thanh trượt âm lượng 0–100%: chạm hoặc kéo; thả tay thì kêu thử một tiếng. */
function VolumeSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [width, setWidth] = useState(1);
  const [dragging, setDragging] = useState(false);
  const pan = useMemo(() => {
    const at = (x: number) => onChange(Math.round(Math.max(0, Math.min(1, x / width)) * 20) / 20);
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setDragging(true);
        at(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => at(e.nativeEvent.locationX),
      onPanResponderRelease: () => {
        setDragging(false);
        playSfx('select');
      },
      onPanResponderTerminate: () => setDragging(false),
    });
  }, [onChange, width]);
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      onLayout={(e: LayoutChangeEvent) => {
        setWidth(Math.max(1, e.nativeEvent.layout.width));
      }}
      {...pan.panHandlers}
      className="justify-center"
      style={{ height: 32 }}
    >
      <View className="h-2 rounded-pill" style={{ backgroundColor: '#E8E2D6' }}>
        <View className="h-2 rounded-pill" style={{ width: `${value * 100}%`, backgroundColor: color.primary }} />
      </View>
      <View
        pointerEvents="none"
        className="absolute h-5 w-5 rounded-pill bg-white"
        style={{ left: `${value * 100}%`, marginLeft: -10, borderWidth: 3, borderColor: color.primary, transform: [{ scale: dragging ? 1.15 : 1 }] }}
      />
    </View>
  );
}

/** Cài đặt âm thanh: bật / tắt hiệu ứng, âm lượng, huấn luyện viên giọng nói. */
export function SoundCard() {
  const { L } = useL();
  const sound = useGameStore((s) => s.sound);
  const setSound = useGameStore((s) => s.setSound);
  const volume = useAudioPrefs((s) => s.volume);
  const setVolume = useAudioPrefs((s) => s.setVolume);
  const coach = useAudioPrefs((s) => s.coach);
  const setCoach = useAudioPrefs((s) => s.setCoach);
  const hydrated = useHydrated();
  const [haptics, setHapticsState] = useState(hapticsEnabled);
  return (
    <View className="mt-4 rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: '#F0EBE2' }}>
      <Text className="font-heavy text-cardTitle text-ink">{L('Âm thanh', 'Sound')}</Text>
      <Row title={L('Hiệu ứng âm thanh', 'Sound effects')} on={sound} onToggle={() => setSound(!sound)} />
      <View style={{ opacity: sound ? 1 : 0.4 }} pointerEvents={sound ? 'auto' : 'none'}>
        <Text className="mt-1 font-semi text-label text-muted">
          {L('Âm lượng', 'Volume')} · {Math.round(volume * 100)}%
        </Text>
        <VolumeSlider value={volume} onChange={setVolume} label={L('Âm lượng', 'Volume')} />
      </View>
      <Row title={L('Huấn luyện viên giọng nói', 'Voice coach')} on={coach} onToggle={() => setCoach(!coach)} />
      {/* Chỉ hiện trên máy có rung (Android Chrome); iPhone không có `navigator.vibrate`. */}
      {hydrated && hapticsSupported() ? (
        <Row
          title={L('Rung nhẹ khi chọn đáp án', 'Light haptics when answering')}
          on={haptics}
          onToggle={() => {
            setHapticsEnabled(!haptics);
            setHapticsState(!haptics);
            if (!haptics) haptic(12);
          }}
        />
      ) : null}
    </View>
  );
}
