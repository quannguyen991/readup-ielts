import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LionMascot, type LionPose } from '@/components/mascot/LionMascot';

/** Trạng thái của giám khảo: quyết định màu vòng sáng, tốc độ đập và tư thế của Leo. */
export type AvatarState = 'idle' | 'ai' | 'listening' | 'thinking';

const RING: Record<AvatarState, string> = {
  idle: '#E0C890',
  ai: '#E0A93B',
  listening: '#3F7FD6',
  thinking: '#8E6BD1',
};

const POSE: Record<AvatarState, LionPose> = {
  idle: 'wave',
  ai: 'cheer',
  listening: 'point',
  thinking: 'think',
};

/** Nhịp đập (ms một chu kỳ). Giám khảo đang nói thì đập nhanh, đang nghe thì đập chậm và đều. */
const BEAT: Record<AvatarState, number> = {
  idle: 2600,
  ai: 800,
  listening: 1500,
  thinking: 650,
};

/**
 * Nhân vật giám khảo Leo: vòng sáng đập quanh, thân nhấp nhô nhẹ. Màu vòng và tốc độ đập
 * đổi theo trạng thái, nên không nhìn chữ cũng biết giám khảo đang làm gì.
 *
 * Người bật "giảm chuyển động" trong hệ điều hành thì vòng sáng đứng yên ở mức vừa phải:
 * vẫn thấy được trạng thái, không còn chuyển động.
 */
export function LiveAvatar({ state, size = 230 }: { state: AvatarState; size?: number }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(pulse);
      cancelAnimation(bob);
      pulse.value = 0.5;
      bob.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: BEAT[state], easing: Easing.inOut(Easing.quad) }), -1, true);
    bob.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(bob);
    };
  }, [state, reduced, pulse, bob]);

  const innerRing = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.14 }],
    opacity: 0.85 - pulse.value * 0.45,
  }));
  const outerRing = useAnimatedStyle(() => ({
    transform: [{ scale: 1.1 + pulse.value * 0.3 }],
    opacity: 0.45 - pulse.value * 0.35,
  }));
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: -5 * bob.value }] }));

  const color = RING[state];
  const core = size * 0.74;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color },
          outerRing,
        ]}
      />
      <Animated.View
        style={[
          { position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2, borderWidth: 3, borderColor: color },
          innerRing,
        ]}
      />
      <Animated.View
        style={[
          {
            width: core,
            height: core,
            borderRadius: core / 2,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 16px 36px ${color}55`,
          },
          body,
        ]}
      >
        <LionMascot pose={POSE[state]} size={core * 0.86} />
      </Animated.View>
    </View>
  );
}
