import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GridBackdrop, LIGHT_LINE, LIGHT_STOPS } from './GridBackdrop';
import { Badge } from '@/components/ui/Badge';
import { Hero3D, useHeroStar, type SceneKind } from '@/components/three/Hero3D';

/**
 * Hero nền lưới sáng — kiểu đang dùng ở trang chủ, nay dùng chung.
 *
 * Trước đây trang Tổng quan có hero riêng: một khối gradient xanh đặc, chữ
 * trắng, kèm hình minh hoạ 3D. Đặt cạnh trang chủ thì thành hai thế giới khác
 * nhau trong cùng một app — người dùng bấm "Bắt đầu học" ở trang chủ là rơi
 * thẳng vào một trang trông như của app khác.
 *
 * DÒNG THỨ HAI NẰM TRÊN KHỐI CHÀM. Đây là chỗ duy nhất còn chữ trắng: mắt bắt
 * được câu chốt trước cả khi đọc hết dòng một. Khối lùi trái đúng bằng đệm
 * ngang để hai dòng vẫn thẳng mép chữ.
 */
export function LightHero({
  badge,
  line1,
  line2,
  subtitle,
  children,
  footer,
  scene,
}: {
  badge: string;
  line1: string;
  /** Dòng chốt, in trắng trên khối chàm. Bỏ trống thì hero chỉ có một dòng. */
  line2?: string;
  subtitle: string;
  /** Hàng nút. */
  children?: React.ReactNode;
  /** Hàng viên số liệu dưới cùng. */
  footer?: React.ReactNode;
  /** Cảnh 3D trang trí bên phải (web). Bỏ trống thì hero chỉ có chữ. */
  scene?: SceneKind;
}) {
  const wide = useWindowDimensions().width >= 768;
  const size = wide ? 44 : 28;
  const line = wide ? 52 : 36;
  // Ngôi sao to chỉ có trên máy tính; điện thoại và máy tính bảng bỏ hẳn cho nhẹ máy.
  const laptop = useHeroStar();
  const star = Boolean(scene) && laptop;

  /*
    Bọc thêm một HÀNG NGANG quanh nền: `GridBackdrop` lấy cả khung bằng
    `flex-1`, mà `flex-1` trong một cột cao-theo-nội-dung thì co về 0. Trong
    hàng ngang, flex-1 ăn theo bề ngang còn chiều cao do nội dung quyết định.
  */
  return (
    <View style={HERO_FRAME}>
      {/* Hero dạng LightHero dùng nền loang sạch; lưới caro chỉ giữ ở các màn
          đọc/thi/tác vụ có chủ đích dùng GridBackdrop riêng. */}
      <GridBackdrop colors={LIGHT_STOPS} line={LIGHT_LINE} showGrid={false}>
        {scene && star ? (
          <Hero3D scene={scene} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '42%' }} />
        ) : null}
        <View
          style={{
            paddingHorizontal: wide ? 40 : 22,
            paddingVertical: wide ? 52 : 30,
            // Chừa chỗ bên phải cho ngôi sao, để chữ không chạy đè lên nó.
            paddingRight: star ? '40%' : wide ? 40 : 22,
          }}
        >
          <Badge label={badge} tone="neutral" shape="tag" />

          <Text className="mt-4 font-heavy text-paper-ink" style={{ fontSize: size, lineHeight: line }}>
            {line1}
          </Text>

          {line2 ? (
            <View className="mt-1.5 self-start rounded-md bg-brand-mid px-3 py-1" style={{ marginLeft: -10 }}>
              <Text className="font-heavy text-white" style={{ fontSize: size, lineHeight: line }}>
                {line2}
              </Text>
            </View>
          ) : null}

          <Text className="mt-4 font-sans text-bodyLg text-paper-body" style={{ maxWidth: 620 }}>
            {subtitle}
          </Text>

          {children ? <View className="mt-6 flex-row flex-wrap gap-2">{children}</View> : null}
          {footer ? <View className="mt-7 flex-row flex-wrap gap-2">{footer}</View> : null}
        </View>
      </GridBackdrop>
      <LightSweep />
    </View>
  );
}

/**
 * Khung hero: viền trắng mảnh + bóng mềm, để khung luôn tách khỏi nền trang dù
 * nền là xanh kẻ ô, loang hay trắng. Xuất ra để hero riêng của trang chủ dùng
 * đúng khung này.
 */
export const HERO_FRAME = {
  flexDirection: 'row',
  borderRadius: 24,
  overflow: 'hidden',
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.9)',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 16px 40px rgba(30,41,99,0.14)' } as object)
    : { elevation: 3 }),
} as const;

/** Bề ngang dải sáng. */
const BAND = 260;

/**
 * Dải sáng chéo lướt ngang qua khung hero, rồi nghỉ vài giây, lặp lại.
 *
 * Nằm TRÊN nội dung nhưng `pointerEvents="none"` và mờ ở hai mép, nên chỉ như
 * một vệt phản quang lướt qua mặt kính, không che chữ lâu hơn một khoảnh khắc.
 * Chạy bằng shared value của Reanimated chứ không dùng `entering=` (làm trắng
 * trang trên web). Người đặt "giảm chuyển động" thì không chạy.
 */
export function LightSweep({
  band = BAND,
  pause = 2600,
  duration = 1500,
  offset = 0,
  strength = 0.9,
  tint = '255,255,255',
}: {
  /** Bề ngang dải sáng. */
  band?: number;
  /** Nghỉ giữa hai lần lướt, ms. */
  pause?: number;
  duration?: number;
  /** Trễ lần đầu, ms — để nhiều thẻ cạnh nhau lướt lệch nhịp thành một làn sóng. */
  offset?: number;
  /** Độ sáng lõi dải, 0–1. */
  strength?: number;
  /** Màu dải dạng "r,g,b". Trên nền trắng, dải trắng không thấy được — dùng ánh xanh nhạt. */
  tint?: string;
} = {}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced || width === 0) return;
    progress.value = 0;
    progress.value = withDelay(
      offset,
      withRepeat(
        withSequence(
          withDelay(pause, withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) })),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [reduced, width, progress, offset, pause, duration]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -band * 1.5 + progress.value * (width + band * 3) }, { skewX: '-22deg' }],
  }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {reduced ? null : (
        <Animated.View
          style={[{ position: 'absolute', top: -60, bottom: -60, left: 0, width: band, flexDirection: 'row' }, bandStyle]}
        >
          {/* Dải chính: lõi gần trắng đặc, hai mép tan dần — nền hero vốn đã
              sáng, dải trắng mờ đều sẽ không nhìn thấy được. */}
          <LinearGradient
            colors={[
              `rgba(${tint},0)`,
              `rgba(${tint},${strength * 0.4})`,
              `rgba(${tint},${strength})`,
              `rgba(${tint},${strength * 0.4})`,
              `rgba(${tint},0)`,
            ]}
            locations={[0, 0.3, 0.5, 0.7, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
          {/* Vệt mảnh đi sau, như ánh thứ hai phản chiếu trên mặt kính. */}
          <View style={{ width: band * 0.13 }} />
          <LinearGradient
            colors={[`rgba(${tint},0)`, `rgba(${tint},${strength * 0.75})`, `rgba(${tint},0)`]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: band * 0.1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Viên số liệu dưới hero: con số đậm, nhãn nhạt. */
export function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill border border-brand-soft bg-white px-3 py-1.5">
      <Text className="font-heavy text-body text-brand">{value}</Text>
      <Text className="font-sans text-label text-paper-muted">{label}</Text>
    </View>
  );
}
