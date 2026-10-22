import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { AreaArt } from '@/components/home/AreaArt';
import { GlassSphere } from '@/components/ui/GlassSphere';

/**
 * Hoạ tiết cho các thẻ nhỏ (thẻ luyện thi, từ vựng, bìa nghe): dùng chung bộ bố cục hình học với các ô mảng
 * học ở trang chủ, thêm một lớp sáng chéo, sao bốn cánh, viền chấm và một quả cầu kính phụ để thẻ có chiều sâu.
 * `seed` chọn bố cục và vị trí chi tiết, `tone` chọn bảng màu; cùng một seed luôn ra cùng một hình khi tải lại.
 */

const STAR4 = 'M0 -20 C2 -6 6 -2 20 0 C6 2 2 6 0 20 C-2 6 -6 2 -20 0 C-6 -2 -2 -6 0 -20 Z';

/** Băm chuỗi thành số nguyên 32 bit (FNV-1a), để seed chọn ra một bố cục. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Sao bốn cánh trắng đặt theo phần trăm khung, để chi tiết không đè lên nhau khi seed đổi. */
function Sparkle({ left, top, size }: { left: string; top: string; size: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: left as never, top: top as never, width: size, height: size }}>
      <Svg width="100%" height="100%" viewBox="-20 -20 40 40">
        <Path d={STAR4} fill="#FFFFFF" opacity={0.92} />
      </Svg>
    </View>
  );
}

/**
 * Phần hoạ tiết thật sự. Chỉ nhận các giá trị nguyên thuỷ nên `React.memo` bỏ qua việc vẽ lại khi trang cha
 * render lại (gõ tìm kiếm, đổi tab...). Vẽ SVG ở mỗi lần render là thứ làm danh sách giật trên điện thoại.
 */
const TileBody = React.memo(function TileBody({ light, deep, h }: { light: string; deep: string; h: number }) {
  return (
    <>
      <AreaArt tone={[light, deep]} variant={h % 8} />

      <LinearGradient
        colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.8 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          bottom: 6,
          borderRadius: 10,
          borderWidth: 1,
          borderStyle: 'dotted',
          borderColor: 'rgba(255,255,255,0.55)',
        }}
      />

      <Sparkle left={`${8 + (h % 46)}%`} top={`${10 + ((h >>> 9) % 40)}%`} size={18} />
      <Sparkle left={`${58 + ((h >>> 13) % 30)}%`} top={`${52 + ((h >>> 17) % 26)}%`} size={11} />

      <View pointerEvents="none" style={{ position: 'absolute', left: `${10 + ((h >>> 21) % 40)}%` as never, top: `${56 + ((h >>> 25) % 22)}%` as never }}>
        <GlassSphere color={light} size={22} />
      </View>
    </>
  );
});

/**
 * Băng hoạ tiết cho một thẻ. `tone` là cặp màu sáng → đậm của thẻ; `seed` quyết định bố cục.
 * Chiều cao do `height` quy định; hoạ tiết kéo giãn theo khung (slice).
 */
export function TileArt({ seed, tone, height = 96, style }: { seed: string; tone: readonly string[]; height?: number; style?: ViewStyle }) {
  const h = hash(seed);
  const light = tone[0] ?? '#8B6CF0';
  const deep = tone[1] ?? '#6A4BD9';

  return (
    <View pointerEvents="none" style={{ height, borderRadius: 14, overflow: 'hidden', ...style }}>
      <TileBody light={light} deep={deep} h={h} />
    </View>
  );
}
