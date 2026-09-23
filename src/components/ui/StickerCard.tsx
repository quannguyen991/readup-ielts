import React, { createContext, useState } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

type StickerCardProps = ViewProps & {
  /** Hai màu cùng tông, sáng → đậm — nền gradient chéo của thẻ. */
  colors: readonly [string, string];
  children: React.ReactNode;
  /** Khối dày hơn, nổi hơn — cho lưới "App có gì" ở trang giới thiệu. */
  bold?: boolean;
  /**
   * Vật trang trí nổi ở góc trên phải (vd. `Gem3D`). Nằm NGOÀI mặt thẻ đã cắt
   * góc, nên được phép nhô qua mép trên — vật thể như đang bay khỏi khối.
   */
  ornament?: React.ReactNode;
};

/** Mực của thế giới thẻ khối: tím than rất đậm, không phải đen tuyền. */
export const INK = '#1B1840';

/** Bóng chữ trắng trên mặt thẻ: tiêu đề in nổi bằng mực, dòng phụ có quầng mờ. */
export const STICKER_TITLE_SHADOW = { textShadowColor: INK, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 };
export const STICKER_TEXT_SHADOW = { textShadowColor: 'rgba(27,24,64,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };

/** Thẻ đang được rê chuột hay nhấn — vật thể 3D bên trong đọc để quay nhanh hơn. */
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

/** Thành khối đổ chéo: xuống 1px thì sang phải chừng này — nghiêng như ánh sáng rọi từ trên trái. */
const SLANT = 0.6;

/**
 * Thành khối dựng bằng từng lớp bóng 1px xếp chéo, liền nhau thành một lăng trụ
 * đặc — KHÔNG phải một tấm bóng phẳng dán lệch (chỗ nhìn "giả" của kiểu bóng
 * cứng thường thấy: góc trên phải và góc dưới trái của tấm bóng tách khỏi thẻ).
 * Lớp sát mặt thẻ ánh màu của thẻ, càng xuống đáy càng đậm về mực — thành khối
 * có sáng tối như một vật thật. Cuối cùng là bóng mềm trên nền trang.
 */
function extrusion(depth: number, wall: string, float: number): string {
  const n = Math.max(1, Math.round(depth));
  const layers: string[] = [];
  for (let k = 1; k <= n; k += 1) {
    layers.push(`${(k * SLANT).toFixed(1)}px ${k}px 0 ${mix(wall, INK, Math.min(1, 0.12 + (k / n) * 0.88))}`);
  }
  const x = (n * SLANT + 4 + float).toFixed(1);
  layers.push(`${x}px ${n + 8 + float * 2}px ${18 + float * 4}px -4px rgba(27,24,64,${(0.34 - float * 0.03).toFixed(2)})`);
  return layers.join(', ');
}

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const SPRING = { damping: 18, stiffness: 180, mass: 0.6 };

/** Shared value của Reanimated vốn là đích gán — gom việc gán vào một chỗ. */
function springTo(v: SharedValue<number>, to: number): void {
  v.value = withSpring(to, SPRING);
}
function glideTo(v: SharedValue<number>, to: number): void {
  v.value = withTiming(to, { duration: 150, easing: EASE });
}

type Pose = 'rest' | 'hover' | 'press';

/**
 * Thẻ KHỐI 3D: mặt gradient viền mực, thành khối dày đổ chéo xuống phải, bóng
 * mềm dưới đáy. Ba tư thế có vật lý thật:
 *   - nghỉ: khối nằm trên nền;
 *   - rê chuột: MẶT khối nhô lên về phía trên trái, thành khối dài ra — ĐÁY khối
 *     đứng yên tại chỗ, nên nhìn ra là khối nổi lên chứ không phải cả thẻ trượt;
 *   - nhấn: mặt lún xuống sát đáy như phím bấm.
 * Trên máy tính khối còn nghiêng nhẹ theo con trỏ.
 *
 * Đổ bóng kiểu khối đậm là yêu cầu của người dùng (theo ảnh bản cũ họ thích),
 * nhưng dựng thành khối thật có sáng tối chứ không phải một tấm bóng lệch phẳng.
 *
 * CHỈ DÙNG Ở NHỮNG CHỖ CHỌN LỰA CHỌN (chủ đề từ vựng, chế độ luyện tập, lưới
 * "App có gì", kệ tính năng) — KHÔNG thay `Card` mặc định của cả app.
 */
export function StickerCard({ colors, children, className, style, bold, ornament, ...rest }: StickerCardProps) {
  const reduced = useReducedMotion();
  const [pose, setPose] = useState<Pose>('rest');
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const depth = bold ? 9 : 7;
  const wall = shade(colors[1], -0.38);
  // Mặt khối: đầu sáng kéo nhẹ về phía màu đậm để chữ trắng không chìm ở góc trên trái.
  const face: readonly [string, string] = [mix(colors[0], colors[1], 0.22), colors[1]];

  const moveTo = (p: Pose) => {
    setPose(p);
    const d = p === 'hover' ? -3 : p === 'press' ? depth - 2 : 0;
    glideTo(tx, d * SLANT);
    glideTo(ty, d);
  };

  const shownDepth = pose === 'hover' ? depth + 3 : pose === 'press' ? 2 : depth;
  const shadow =
    Platform.OS === 'web'
      ? ({
          boxShadow: extrusion(shownDepth, wall, pose === 'hover' ? 2 : pose === 'press' ? -1 : 0),
          transitionProperty: 'box-shadow',
          transitionDuration: '150ms',
          transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        } as never)
      : { shadowColor: INK, shadowOffset: { width: 3, height: 6 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 8 };

  const motion = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { translateX: tx.value },
      { translateY: ty.value },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
    ],
  }));

  // Chỉ web có chuột; RN web chuyển tiếp sự kiện chuột/chạm xuống thẻ div.
  const handlers =
    Platform.OS === 'web' && !reduced
      ? {
          onMouseMove: (e: { currentTarget: unknown; nativeEvent: { clientX: number; clientY: number } }) => {
            const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = (e.nativeEvent.clientX - box.left) / box.width - 0.5;
            const y = (e.nativeEvent.clientY - box.top) / box.height - 0.5;
            springTo(rx, -y * 6);
            springTo(ry, x * 8);
          },
          onMouseEnter: () => moveTo('hover'),
          onMouseLeave: () => {
            moveTo('rest');
            springTo(rx, 0);
            springTo(ry, 0);
          },
          onMouseDown: () => moveTo('press'),
          onMouseUp: () => moveTo('hover'),
          onTouchStart: () => moveTo('press'),
          onTouchEnd: () => moveTo('rest'),
          onTouchCancel: () => moveTo('rest'),
        }
      : {};

  const bevel =
    Platform.OS === 'web'
      ? ({ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.42), inset 0 -10px 18px -12px rgba(27,24,64,0.55)' } as never)
      : null;

  return (
    <CardHoverContext.Provider value={pose !== 'rest'}>
      <Animated.View className={['rounded-card', className ?? ''].filter(Boolean).join(' ')} style={[shadow, motion, style]} {...(handlers as object)} {...rest}>
        <View className="flex-1 overflow-hidden rounded-card" style={{ borderWidth: 2.5, borderColor: INK }}>
          <LinearGradient colors={face} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flex: 1 }}>
            {children}
          </LinearGradient>
          {/* Mặt khối bắt sáng: vệt loáng chéo ở nửa trên, mép trên sáng, mép dưới tối — mặt cong nhẹ như nhựa đúc. */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.38, y: 0.58 }}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          />
          <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 13.5 }, bevel]} />
        </View>
        {ornament ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: -30, right: -10, zIndex: 3 }}>
            {ornament}
          </View>
        ) : null}
      </Animated.View>
    </CardHoverContext.Provider>
  );
}
