import React, { createContext, useState } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { radius } from '@/theme/tokens';
import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RINK } from '@/components/profile-retro/retro-art';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
  /** Bóng lệch dày hơn — cho lưới "App có gì" ở trang giới thiệu. */
  bold?: boolean;
  /** Vật trang trí ở góc trên phải (vd. `GlowStars`), nằm trên mặt thẻ, không chặn cú bấm. */
  ornament?: React.ReactNode;
};

/** Màu mực dùng cho bóng chữ và các chi tiết nhỏ trên thẻ. */
export const INK = '#0F172A';

/** Bóng chữ trắng trên mặt thẻ: tiêu đề in nổi bằng mực, dòng phụ có quầng mờ. */
export const STICKER_TITLE_SHADOW = { textShadowColor: 'rgba(15,23,42,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 };
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
 * Thẻ màu: mặt gradient, bóng mềm cùng tông màu thẻ. Người dùng đã bảo bỏ cả
 * viền đen lẫn bóng lệch đen — đừng thêm lại.
 *
 * Rê chuột thì thẻ nhấc lên và bóng loang rộng hơn, nhấn thì hạ xuống.
 *
 * CHỈ DÙNG Ở NHỮNG CHỖ CHỌN LỰA CHỌN (chủ đề từ vựng, chế độ luyện tập, lưới
 * "App có gì", kệ tính năng) — KHÔNG thay `Card` mặc định của cả app.
 */
export function StickerCard({ colors, children, className, style, bold, ornament, ...rest }: StickerCardProps) {
  const reduced = useReducedMotion();
  const retro = useRetroStyle();
  const [pose, setPose] = useState<Pose>('rest');
  const ty = useSharedValue(0);

  const tone = colors[1];
  // Mặt thẻ: đầu sáng kéo nhẹ về phía màu đậm để chữ trắng không chìm ở góc trên trái.
  const face: readonly [string, string] = [mix(colors[0], colors[1], 0.18), colors[1]];

  const moveTo = (p: Pose) => {
    setPose(p);
    glideTo(ty, p === 'hover' ? -3 : p === 'press' ? 1 : 0);
  };

  const lifted = pose === 'hover';
  const shadow =
    Platform.OS === 'web'
      ? ({
          boxShadow: `0 1px 2px rgba(15,23,42,0.06), 0 ${lifted ? 16 : bold ? 10 : 8}px ${lifted ? 32 : 24}px ${tone}${lifted ? '59' : '40'}`,
          transitionProperty: 'box-shadow',
          transitionDuration: '140ms',
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        } as never)
      : { shadowColor: tone, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 };

  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

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
      <Animated.View className={['rounded-card', className ?? ''].filter(Boolean).join(' ')} style={[{ borderRadius: radius.card }, shadow, motion, retro ? { borderWidth: 3, borderColor: RINK, ...(Platform.OS === 'web' ? { boxShadow: '4px 4px 0 #1F1A1D' } : {}) } : null, style]} {...(handlers as object)} {...rest}>
        <View className="flex-1 overflow-hidden rounded-card">
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
