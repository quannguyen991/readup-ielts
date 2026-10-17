import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type OrbMood = 'idle' | 'speaking' | 'listening' | 'thinking';

const MOUTH: Record<OrbMood, number> = { idle: 0.35, speaking: 0.9, listening: 0.2, thinking: 0.12 };

export function AiOrb({ mood = 'idle', size = 180 }: { mood?: OrbMood; size?: number }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(MOUTH.idle)).current;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const loopBreathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loopBreathe.start();

    const loopPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loopPulse.start();

    return () => {
      loopBreathe.stop();
      loopPulse.stop();
    };
  }, [breathe, pulse]);

  useEffect(() => {
    Animated.timing(mouth, { toValue: MOUTH[mood], duration: 200, useNativeDriver: false }).start();
  }, [mood, mouth]);

  // Natural blinking logic
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 130);
        schedule();
      }, 2200 + Math.random() * 2400);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.1] });

  const eyeH = blink ? 3 : size * 0.09;
  const mouthW = size * 0.22;
  const mouthH = mouth.interpolate({ inputRange: [0, 1], outputRange: [4, size * 0.14] });

  // Neon gradient colors according to state
  const getGradientColors = (): [string, string, string] => {
    switch (mood) {
      case 'speaking':
        return ['#06B6D4', '#3B82F6', '#8B5CF6'];
      case 'listening':
        return ['#10B981', '#06B6D4', '#3B82F6'];
      case 'thinking':
        return ['#F59E0B', '#EC4899', '#8B5CF6'];
      default:
        return ['#0284C7', '#6366F1', '#9333EA'];
    }
  };

  const getStatusText = () => {
    switch (mood) {
      case 'speaking':
        return 'AI Đang nói...';
      case 'listening':
        return 'Đang lắng nghe bạn...';
      case 'thinking':
        return 'Đang chấm điểm & suy nghĩ...';
      default:
        return 'Sẵn sàng tương tác';
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Glow Halo / Circuit Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: mood === 'speaking' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(168, 85, 247, 0.35)',
          transform: [{ scale: haloScale }],
          opacity: haloOpacity,
        }}
      />

      {/* Main 3D Animated Sphere */}
      <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.85, y: 0.95 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            shadowColor: '#38BDF8',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          }}
        >
          {/* Glass specular highlight shine */}
          <View
            style={{
              position: 'absolute',
              top: size * 0.1,
              left: size * 0.18,
              width: size * 0.32,
              height: size * 0.16,
              borderRadius: size,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
            }}
          />

          {/* Circuit lines decorative overlay */}
          <View
            style={{
              position: 'absolute',
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: size,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderStyle: 'dashed',
            }}
          />

          {/* Facial features: Expressive eyes */}
          <View style={{ flexDirection: 'row', gap: size * 0.22, marginTop: -size * 0.04 }}>
            <View
              style={{
                width: size * 0.1,
                height: eyeH,
                borderRadius: size,
                backgroundColor: '#0F172A',
                shadowColor: '#fff',
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
            <View
              style={{
                width: size * 0.1,
                height: eyeH,
                borderRadius: size,
                backgroundColor: '#0F172A',
                shadowColor: '#fff',
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
          </View>

          {/* Expressive mouth */}
          <Animated.View
            style={{
              marginTop: size * 0.1,
              width: mouthW,
              height: mouthH,
              borderRadius: size,
              backgroundColor: '#0F172A',
            }}
          />
        </LinearGradient>
      </Animated.View>

      {/* Mood status badge */}
      <View
        style={{
          marginTop: 10,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <Text style={{ color: '#E2E8F0', fontSize: 11, fontWeight: '700' }}>{getStatusText()}</Text>
      </View>
    </View>
  );
}
