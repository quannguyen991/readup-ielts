import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { HUB_UI } from '@/components/hub/HubUi';
import { useMicLevel } from '@/components/hub/useMicLevel';
import { Icon } from '@/components/ui/Icon';
import { playSfx } from '@/services/hub/sfx';

const RED = '#E5484D';
const BARS = 28;

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Một vòng sóng lan ra quanh nút micro; ba vòng lệch pha nhau tạo cảm giác đang thu. */
function Ring({ active, delay, reduced }: { active: boolean; delay: number; reduced: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (active && !reduced) {
      t.value = 0;
      t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
    } else {
      cancelAnimation(t);
      t.value = 0;
    }
    return () => cancelAnimation(t);
  }, [active, delay, reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: active ? 0.55 * (1 - t.value) : 0, transform: [{ scale: 1 + t.value * 0.95 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: RED }, style]} />;
}

/** Chấm đỏ nhấp nháy của nhãn REC. */
function RecDot({ active, reduced }: { active: boolean; reduced: boolean }) {
  const t = useSharedValue(1);
  useEffect(() => {
    if (active && !reduced) t.value = withRepeat(withSequence(withTiming(0.2, { duration: 520 }), withTiming(1, { duration: 520 })), -1, false);
    else {
      cancelAnimation(t);
      t.value = 1;
    }
    return () => cancelAnimation(t);
  }, [active, reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: RED }, style]} />;
}

/**
 * Khu ghi âm: nút micro có vòng sóng lan, nhãn REC nhấp nháy, sóng âm chạy theo đúng giọng người nói
 * và âm hiệu khi mở/đóng micro. Mọi thứ đều dừng ngay khi hết ghi; "giảm chuyển động" thì chỉ còn thanh âm lượng.
 */
export function RecordStage({
  listening,
  supported,
  elapsedMs,
  hasReport,
  part2,
  onStart,
  onStop,
}: {
  listening: boolean;
  supported: boolean;
  elapsedMs: number;
  hasReport: boolean;
  part2: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const reduced = !!useReducedMotion();
  const levels = useMicLevel(listening, BARS);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const press = () => {
    pop.value = withSequence(withTiming(0.88, { duration: 80 }), withSpring(1, { damping: 7, stiffness: 220 }));
    if (listening) {
      playSfx('rec-stop');
      onStop();
    } else {
      playSfx('rec-start');
      onStart();
    }
  };

  const hint = !supported
    ? 'Ghi âm cần Chrome trên máy tính hoặc Android.'
    : listening
      ? 'Đang nghe. Bấm lần nữa để dừng.'
      : hasReport
        ? 'Muốn nói lại thì bấm micro.'
        : part2
          ? 'Bấm micro rồi nói, tối đa hai phút.'
          : 'Bấm micro rồi trả lời tự nhiên.';

  return (
    <View style={{ padding: 22, alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1.5, borderColor: listening ? '#F3C9CB' : HUB_UI.line, backgroundColor: listening ? '#FFF7F7' : '#FFFFFF' }}>
      <View style={{ height: 30, alignItems: 'center', justifyContent: 'center' }}>
        {listening ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FFE9EA' }}>
            <RecDot active reduced={reduced} />
            <Text style={{ color: RED, fontWeight: '900', fontSize: 13, letterSpacing: 1.2 }}>REC</Text>
          </View>
        ) : null}
      </View>

      <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
        <Ring active={listening} delay={0} reduced={reduced} />
        <Ring active={listening} delay={600} reduced={reduced} />
        <Ring active={listening} delay={1200} reduced={reduced} />
        <Animated.View style={popStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Dừng ghi' : 'Ghi âm trả lời'}
            disabled={!supported}
            onPress={press}
            style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: listening ? RED : HUB_UI.purple, opacity: supported ? 1 : 0.5, boxShadow: listening ? '0 10px 28px rgba(229,72,77,0.45)' : '0 10px 24px rgba(106,75,217,0.35)' } as never}
          >
            {listening ? <View style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: '#FFFFFF' }} /> : <Icon name="mic" size={38} color="#FFFFFF" strokeWidth={2.2} />}
          </Pressable>
        </Animated.View>
      </View>

      <Text style={{ color: listening ? RED : HUB_UI.navy, fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'] as never }}>{clock(elapsedMs)}</Text>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {levels.map((lv, i) => {
          // Khi chưa ghi: các vạch thấp, đều; khi ghi: cao theo âm lượng thật, vạch ở giữa cao hơn một chút cho đẹp.
          const centre = 1 - Math.abs(i - BARS / 2) / (BARS / 2);
          const h = listening ? 6 + lv * 46 * (0.55 + 0.45 * centre) : 6 + centre * 4;
          return <View key={i} style={{ width: 5, height: h, borderRadius: 3, backgroundColor: listening ? (lv > 0.5 ? RED : '#F08A8E') : '#E6E1F3' }} />;
        })}
      </View>

      <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '600', textAlign: 'center' }}>{hint}</Text>
    </View>
  );
}
