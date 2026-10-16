import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { glowFor } from './theme';

export type OrbMood = 'idle' | 'speaking' | 'listening' | 'thinking';

const MOUTH: Record<OrbMood, number> = { idle: 0.35, speaking: 0.9, listening: 0.2, thinking: 0.12 };

/**
 * Khối cầu AI của phòng hội thoại: thở nhịp nhàng, mắt chớp tự nhiên, miệng mở theo
 * trạng thái (đang nói / đang nghe / đang nghĩ). Chỉ là hình minh hoạ, không có âm thanh.
 */
export function AiOrb({ mood = 'idle', size = 180 }: { mood?: OrbMood; size?: number }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(MOUTH.idle)).current;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    Animated.timing(mouth, { toValue: MOUTH[mood], duration: 220, useNativeDriver: false }).start();
  }, [mood, mouth]);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 140);
        schedule();
      }, 2400 + Math.random() * 2600);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] });
  const eyeH = blink ? 3 : size * 0.09;
  const mouthW = size * 0.22;
  const mouthH = mouth.interpolate({ inputRange: [0, 1], outputRange: [4, size * 0.14] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
      <LinearGradient
        colors={glowFor(mood)}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ position: 'absolute', top: size * 0.12, left: size * 0.18, width: size * 0.3, height: size * 0.18, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.35)' }} />
        <View style={{ flexDirection: 'row', gap: size * 0.22, marginTop: -size * 0.06 }}>
          <View style={{ width: size * 0.1, height: eyeH, borderRadius: size, backgroundColor: '#3B2A10' }} />
          <View style={{ width: size * 0.1, height: eyeH, borderRadius: size, backgroundColor: '#3B2A10' }} />
        </View>
        <Animated.View style={{ marginTop: size * 0.1, width: mouthW, height: mouthH, borderRadius: size, backgroundColor: '#3B2A10' }} />
      </LinearGradient>
    </Animated.View>
  );
}
