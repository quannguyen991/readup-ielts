import React, { useState } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
  /** Khối dày hơn, nổi hơn — cho lưới "App có gì" ở trang giới thiệu. */
  bold?: boolean;
};

/** Trộn một màu hex về phía đen (amount < 0) hoặc trắng (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const SPRING = { damping: 18, stiffness: 180, mass: 0.6 };

/** Đẩy một shared value tới đích bằng lò xo. Shared value của Reanimated vốn là đích gán. */
function springTo(v: SharedValue<number>, to: number): void {
  v.value = withSpring(to, SPRING);
}

/**
 * Thẻ màu dạng KHỐI NỔI 3D: mặt gradient cùng tông, phía dưới là "bề dày" của
 * khối (một dải màu đậm hơn cùng tông), thêm bóng loang màu của chính nó. Trên
 * máy tính, rê chuột vào thì khối nghiêng theo con trỏ và nhấc lên.
 *
 * VÌ SAO KHÔNG CÒN VIỀN ĐEN + BÓNG LỆCH ĐEN: đó là dấu nhận diện của The IELTS
 * Dictionary (lưới thẻ chủ đề kiểu tem dán, viền mực dày, bóng cứng). Người
 * dùng thấy ReadUp giống app kia. Khối nổi cùng tông giữ được độ rực và độ
 * "chắc" của thẻ nhưng là ngôn ngữ riêng: không có màu đen nào trên thẻ.
 *
 * CHỈ DÙNG Ở NHỮNG CHỖ CHỌN LỰA CHỌN (chủ đề từ vựng, chế độ luyện tập, lưới
 * "App có gì") — KHÔNG thay `Card` mặc định của cả app.
 */
export function StickerCard({ colors, children, className, style, bold, ...rest }: StickerCardProps) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const lift = useSharedValue(0);

  const depth = bold ? 7 : 5;
  const edge = shade(colors[1], -0.32);
  const glow = rgba(colors[1], hover ? 0.42 : 0.3);
  const shadow =
    Platform.OS === 'web'
      ? ({
          boxShadow: `0 ${hover ? depth + 3 : depth}px 0 ${edge}, 0 ${hover ? depth + 22 : depth + 12}px ${hover ? 34 : 24}px ${glow}`,
          transitionProperty: 'box-shadow',
          transitionDuration: '220ms',
        } as never)
      : { shadowColor: colors[1], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 };

  const tilt = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }, { translateY: lift.value }],
  }));

  // Chỉ web có chuột; RN web chuyển tiếp các sự kiện chuột xuống thẻ div.
  const mouse =
    Platform.OS === 'web' && !reduced
      ? {
          onMouseMove: (e: { currentTarget: unknown; nativeEvent: { clientX: number; clientY: number } }) => {
            const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = (e.nativeEvent.clientX - box.left) / box.width - 0.5;
            const y = (e.nativeEvent.clientY - box.top) / box.height - 0.5;
            springTo(rx, -y * 9);
            springTo(ry, x * 11);
          },
          onMouseEnter: () => {
            setHover(true);
            springTo(lift, -4);
          },
          onMouseLeave: () => {
            setHover(false);
            springTo(rx, 0);
            springTo(ry, 0);
            springTo(lift, 0);
          },
        }
      : {};

  return (
    <Animated.View
      className={['rounded-card', className ?? ''].filter(Boolean).join(' ')}
      style={[shadow, tilt, style]}
      {...(mouse as object)}
      {...rest}
    >
      <View className="flex-1 overflow-hidden rounded-card" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flex: 1 }}>
          {children}
        </LinearGradient>
        {/* Vệt bóng loáng ở nửa trên — mặt khối bắt sáng, không phải một tờ giấy phẳng. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.35, y: 0.6 }}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
        />
      </View>
    </Animated.View>
  );
}
