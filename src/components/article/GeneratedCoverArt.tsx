import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import type { GeneratedCover } from '@/services/articles/cover';

/**
 * Vẽ bìa cho bài không có ảnh riêng: dải màu + hoạ tiết + icon chủ đề.
 *
 * Mọi thông số (màu, hoạ tiết, hướng, vị trí) đã chốt ở `services/articles/cover`
 * theo mã bài. Component này chỉ vẽ, không quyết gì — nên hai chỗ dùng (thẻ ngang
 * và ô vuông nhỏ) luôn ra cùng một bìa cho cùng một bài.
 *
 * MÃ GRADIENT PHẢI RIÊNG TỪNG THẺ. Trên web, react-native-svg dựng ra thẻ <svg>
 * thật trong cùng một trang, và `id` của gradient là TOÀN CỤC. Hai mươi thẻ cùng
 * dùng `id="g"` thì trình duyệt lấy gradient của thẻ đầu tiên cho cả hai mươi —
 * tức là mọi bìa lại cùng một màu, đúng cái lỗi đang sửa. Nên id lấy từ
 * `useId()`, bỏ dấu hai chấm vì `url(#:r1:)` không phải tham chiếu hợp lệ.
 *
 * TRANG TRÍ, KHÔNG PHẢI NỘI DUNG: trình đọc màn hình bỏ qua cả khối — tên bài
 * đã nằm ngay dưới, đọc thêm "hình tròn, hình tròn" không giúp ai.
 */

const TOPIC_ICON: Record<string, IconName> = {
  environment: 'leaf',
  science: 'flask',
  technology: 'gauge',
  literature: 'book',
  education: 'pencil',
  psychology: 'target',
  culture: 'languages',
  health: 'heart',
  society: 'chat',
  business: 'briefcase',
  history: 'compass',
};

export function GeneratedCoverArt({
  cover,
  aspect,
  size,
  radius = 0,
}: {
  cover: GeneratedCover;
  /** `wide` = thẻ ngang 16:10, `square` = ô vuông nhỏ trong danh sách. */
  aspect: 'wide' | 'square';
  /** Chỉ dùng cho ô vuông: cạnh tính bằng điểm ảnh. */
  size?: number;
  radius?: number;
}) {
  const rawId = React.useId();
  const gid = `cov${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const W = aspect === 'wide' ? 160 : 100;
  const H = 100;
  const [x1, y1, x2, y2] = gradientVector(cover.angle);
  const icon = TOPIC_ICON[cover.topic] ?? 'note';
  const iconSize = aspect === 'wide' ? 34 : Math.max(18, Math.round((size ?? 64) * 0.36));

  const box =
    aspect === 'wide'
      ? { width: '100%' as const, aspectRatio: 16 / 10 }
      : { width: size ?? 64, height: size ?? 64 };

  return (
    <View
      style={[box, { borderRadius: radius, overflow: 'hidden', backgroundColor: cover.to }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id={gid} x1={x1} y1={y1} x2={x2} y2={y2}>
            <Stop offset="0" stopColor={cover.from} />
            <Stop offset="1" stopColor={cover.to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill={`url(#${gid})`} />
        <Pattern kind={cover.pattern} offset={cover.offset} W={W} H={H} />
      </Svg>

      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            padding: aspect === 'wide' ? 14 : 8,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.16)',
          }}
        >
          <Icon name={icon} size={iconSize} color="#FFFFFF" strokeWidth={1.8} />
        </View>
      </View>
    </View>
  );
}

/** Hướng dải màu theo góc: 0 ngang · 45 chéo xuống · 90 dọc · 135 chéo ngược. */
function gradientVector(angle: number): [string, string, string, string] {
  switch (angle) {
    case 45:
      return ['0', '0', '1', '1'];
    case 90:
      return ['0', '0', '0', '1'];
    case 135:
      return ['1', '0', '0', '1'];
    default:
      return ['0', '0', '1', '0'];
  }
}

/**
 * Bốn hoạ tiết, đều trắng mờ để dải màu vẫn là thứ nổi nhất.
 *
 * `offset` dời hoạ tiết đi — cùng một kiểu chấm mà lệch chỗ thì hai thẻ đặt
 * cạnh nhau vẫn không trùng khít.
 */
function Pattern({
  kind,
  offset,
  W,
  H,
}: {
  kind: GeneratedCover['pattern'];
  offset: number;
  W: number;
  H: number;
}) {
  switch (kind) {
    case 'dots': {
      const step = 13;
      const shift = offset * step;
      const dots: React.ReactNode[] = [];
      for (let x = -step + shift; x < W + step; x += step) {
        for (let y = -step + shift * 0.6; y < H + step; y += step) {
          dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#FFFFFF" fillOpacity={0.22} />);
        }
      }
      return <>{dots}</>;
    }

    case 'rings': {
      const cx = W * (0.55 + 0.45 * offset);
      const cy = H * (0.15 + 0.3 * offset);
      return (
        <>
          {[16, 30, 44, 58, 72].map((r) => (
            <Circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.2}
              strokeWidth={1.4}
            />
          ))}
        </>
      );
    }

    case 'stripes': {
      const step = 11;
      const shift = offset * step;
      const lines: string[] = [];
      for (let k = -H; k < W + H; k += step) {
        lines.push(`M${k + shift},0 L${k + shift - H},${H}`);
      }
      return (
        <Path d={lines.join(' ')} stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={2.2} />
      );
    }

    case 'blobs':
    default:
      return (
        <>
          <Circle cx={W * (0.15 + 0.2 * offset)} cy={H * 0.95} r={H * 0.55} fill="#FFFFFF" fillOpacity={0.12} />
          <Circle cx={W * (0.8 - 0.2 * offset)} cy={H * 0.1} r={H * 0.42} fill="#FFFFFF" fillOpacity={0.1} />
          <Circle cx={W * (0.5 + 0.1 * offset)} cy={H * 0.55} r={H * 0.18} fill="#FFFFFF" fillOpacity={0.08} />
        </>
      );
  }
}
