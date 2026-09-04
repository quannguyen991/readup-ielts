import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useAssetUrl } from '@/services/assets/useAssets';

/**
 * Bộ cỡ đặt tên cho nhãn dán 3D.
 *
 * Trước đây mỗi chỗ tự chọn số: 280x180, 220x150, 200x140, 160x110, 96x96,
 * 64x64. Sáu cỡ cho năm chỗ dùng, không cỡ nào có lý do, và đổi một chỗ thì
 * lệch với chỗ còn lại. Gom về bốn cỡ theo VAI TRÒ, nên chỗ dùng chỉ phải trả
 * lời "ảnh này đứng ở đâu" chứ không phải "ảnh này bao nhiêu pixel".
 *
 * Tỉ lệ 3:2 cho hai cỡ banner vì ảnh sinh ra là vuông và `contain` sẽ chừa lề
 * hai bên — chừa lề ngang thì banner cân, chừa lề dọc thì banner bị đội cao.
 */
export const ASSET_PRESETS = {
  /** Banner trang, khi banner có cả cột chữ rộng bên cạnh. */
  hero: { width: 270, height: 180 },
  /** Banner đã có nút và số liệu chen chỗ, nên ảnh nhường bớt. */
  heroCompact: { width: 200, height: 134 },
  /** Nằm trong thẻ, cạnh một khối chữ. */
  card: { width: 96, height: 96 },
  /** Nằm cạnh tiêu đề, thay vai một icon lớn. */
  badge: { width: 60, height: 60 },
} as const;

export type AssetPreset = keyof typeof ASSET_PRESETS;

type AssetImageProps = {
  /** Cỡ theo vai trò. Đặt `preset` rồi thì không cần `width`/`height`. */
  preset?: AssetPreset;
  /** Cache key trong bảng generated_assets, ví dụ 'illustration/dashboard-hero'. */
  assetKey: string;
  width?: number | `${number}%`;
  height?: number;
  aspectRatio?: number;
  contentFit?: 'cover' | 'contain';
  radius?: number;
  /** Hiện khi tài nguyên chưa được sinh hoặc chưa cấu hình Supabase. */
  fallback?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
};

/**
 * Ảnh lấy từ Supabase Storage theo cache key. Ảnh chưa có thì hiện fallback,
 * nên giao diện vẫn dùng được trước khi chạy script sinh tài nguyên.
 */
export function AssetImage({
  assetKey,
  preset,
  width = preset ? ASSET_PRESETS[preset].width : '100%',
  height = preset ? ASSET_PRESETS[preset].height : undefined,
  aspectRatio,
  contentFit = preset ? 'contain' : 'cover',
  radius = 12,
  fallback = null,
  className,
  style,
}: AssetImageProps) {
  const url = useAssetUrl(assetKey);

  const box: ViewStyle = {
    width,
    ...(height !== undefined ? { height } : {}),
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
    borderRadius: radius,
    overflow: 'hidden',
  };

  if (!url) {
    return (
      <View className={className} style={[box, style]}>
        {fallback}
      </View>
    );
  }

  return (
    <View className={className} style={[box, style]}>
      <Image
        source={{ uri: url }}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFit}
        transition={200}
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
