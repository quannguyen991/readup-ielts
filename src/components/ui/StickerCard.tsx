import React, { createContext, useState } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
  /** Bóng lệch dày hơn — cho lưới "App có gì" ở trang giới thiệu. */
  bold?: boolean;
  /** Vật trang trí ở góc trên phải (vd. `GlowStars`), nằm trên mặt thẻ, không chặn cú bấm. */
  ornament?: React.ReactNode;
};

/** Màu viền và bóng lệch: gần đen, đúng như bản thẻ người dùng chọn lại (commit fadf32e). */
export const INK = '#0F172A';

/** Bóng chữ trắng trên mặt thẻ: tiêu đề in nổi bằng mực, dòng phụ có quầng mờ. */
export const STICKER_TITLE_SHADOW = { textShadowColor: INK, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 };
export const STICKER_TEXT_SHADOW = { textShadowColor: 'rgba(15,23,42,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };

/** Thẻ đang được rê chuột hay nhấn — vật trang trí bên trong đọc để sáng hơn, nhanh hơn. */
export const CardHoverContext = createContext(false);

/** Trộn một màu hex về phía đen (amount < 0) hoặc trắng (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const m = (c: number) => Math.round(c + (target - c) * t);
  return toHex(m((n >> 16) & 255), m((n >> 8) & 255), m(n & 255));
}

/** Trộn hai màu hex: t = 0 là `a`, t = 1 là `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = parseInt(a.replace('#', ''), 16);
  const y = parseInt(b.replace('#', ''), 16);
  const m = (s: number) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t);
  return toHex(m(16), m(8), m(0));
}

function toHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Shared value của Reanimated vốn là đích gán — gom việc gán vào một chỗ. */
function glideTo(v: SharedValue<number>, to: number): void {
  v.value = withTiming(to, { duration: 140, easing: EASE });
}

type Pose = 'rest' | 'hover' | 'press';

/**
 * Thẻ KHỐI: mặt gradient, viền gần đen 2,5px, bóng lệch cứng xuống phải —
 * đúng kiểu bản cũ người dùng gửi ảnh chọn lại ("phần đổ bóng đen làm giống ảnh 2").
 *
 * Có vật lý của một phím bấm: rê chuột thì mặt thẻ nhô lên phía trên trái và bóng
 * dài ra, nhấn thì lún xuống sát bóng — ĐÁY BÓNG ĐỨNG YÊN, nên nhìn ra là khối
 * nổi lên chứ không phải cả thẻ trượt.
 *
 * CHỈ DÙNG Ở NHỮNG CHỖ CHỌN LỰA CHỌN (chủ đề từ vựng, chế độ luyện tập, lưới
 * "App có gì", kệ tính năng) — KHÔNG thay `Card` mặc định của cả app.
 */
export function StickerCard({ colors, children, className, style, bold, ornament, ...rest }: StickerCardProps) {
  const reduced = useReducedMotion();
  const [pose, setPose] = useState<Pose>('rest');
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const offset = bold ? 5 : 4;
  // Mặt thẻ: đầu sáng kéo nhẹ về phía màu đậm để chữ trắng không chìm ở góc trên trái.
  const face: readonly [string, string] = [mix(colors[0], colors[1], 0.18), colors[1]];

  const moveTo = (p: Pose) => {
    setPose(p);
    const d = p === 'hover' ? -2 : p === 'press' ? offset - 1 : 0;
    glideTo(tx, d);
    glideTo(ty, d);
  };

  const shown = pose === 'hover' ? offset + 2 : pose === 'press' ? 1 : offset;
  const shadow =
    Platform.OS === 'web'
      ? ({
          boxShadow: `${shown}px ${shown}px 0 ${INK}`,
          transitionProperty: 'box-shadow',
          transitionDuration: '140ms',
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        } as never)
      : { shadowColor: INK, shadowOffset: { width: offset, height: offset }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 };

  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }));

  // Chỉ web có chuột; RN web chuyển tiếp sự kiện chuột/chạm xuống thẻ div.
  const handlers =
    Platform.OS === 'web' && !reduced
      ? {
          onMouseEnter: () => moveTo('hover'),
          onMouseLeave: () => moveTo('rest'),
          onMouseDown: () => moveTo('press'),
          onMouseUp: () => moveTo('hover'),
          onTouchStart: () => moveTo('press'),
          onTouchEnd: () => moveTo('rest'),
          onTouchCancel: () => moveTo('rest'),
        }
      : {};

  return (
    <CardHoverContext.Provider value={pose !== 'rest'}>
      <Animated.View className={['rounded-card', className ?? ''].filter(Boolean).join(' ')} style={[shadow, motion, style]} {...(handlers as object)} {...rest}>
        <View className="flex-1 overflow-hidden rounded-card" style={{ borderWidth: 2.5, borderColor: INK }}>
          <LinearGradient colors={face} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flex: 1 }}>
            {children}
          </LinearGradient>
          {/* Vệt bóng loáng ở nửa trên — mặt khối bắt sáng, không phải một tờ giấy phẳng. */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.38, y: 0.58 }}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          />
        </View>
        {ornament ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 4, right: 6, zIndex: 3 }}>
            {ornament}
          </View>
        ) : null}
      </Animated.View>
    </CardHoverContext.Provider>
  );
}
