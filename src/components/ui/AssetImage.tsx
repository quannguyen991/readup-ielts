import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useAssetUrl } from '@/services/assets/useAssets';

type AssetImageProps = {
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
  width = '100%',
  height,
  aspectRatio,
  contentFit = 'cover',
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
