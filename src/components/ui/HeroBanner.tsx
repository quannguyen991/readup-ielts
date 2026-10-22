import React from 'react';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { HeroArt } from '@/components/illust/HeroArt';

const INK = '#0B0520';
const HERO_RING = ['#FF5FA2', '#FFD84A', '#3A8CFF', '#8A3FE0'] as unknown as [string, string, ...string[]];

type HeroBannerProps = {
  title: string;
  subtitle?: string;
  /** Khối nội dung bên trái dưới subtitle (nút, thống kê nhỏ). */
  children?: React.ReactNode;
  /** Khối bên phải: card Goals (ảnh 3) — ưu tiên hơn illustration nếu có cả hai. */
  right?: React.ReactNode;
  /**
   * Tên illustration 3D sinh ở bước 2, ví dụ 'dashboard-hero'.
   * Chưa sinh thì banner tự thu gọn, không để lại khoảng trống.
   */
  illustration?: string;
  className?: string;
};

/**
 * Banner hero đầu các trang Dashboard / Progress / Library, cùng phong cách với hero trang chủ:
 * nền hoạ tiết (HeroBackdrop), viền gradient, chữ trắng. Illustration 3D truyền vào qua prop `right`.
 */
export function HeroBanner({
  title,
  subtitle,
  children,
  right,
  illustration,
  className,
}: HeroBannerProps) {
  const { width } = useWindowDimensions();
  return (
    <LinearGradient colors={HERO_RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 2 }}>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: INK }}>
        <HeroBackdrop />
        <View
          className={['flex-row items-center gap-6 p-6 lg:p-8', className ?? '']
            .filter(Boolean)
            .join(' ')}
        >
          <View className="min-w-0 flex-1">
            <Text className="font-heavy text-hero" style={{ color: '#1B1140' }}>{title}</Text>
            {subtitle ? (
              <Text className="mt-2 max-w-[520px] font-sans text-bodyLg" style={{ color: 'rgba(27,17,64,0.85)' }}>
                {subtitle}
              </Text>
            ) : null}
            {children ? <View className="mt-5">{children}</View> : null}
          </View>

          {/* Cụm minh hoạ dễ thương (theo chủ đề ảnh cũ: progress / library / dashboard). */}
          {/* Chỉ màn đủ rộng: máy tính bảng dựng đứng / điện thoại bỏ để tiêu đề không xuống dòng. */}
          {width >= HEADER_ART_MIN ? (
            <View>
              <HeroArt scene={illustration?.startsWith('progress') ? 'progress' : illustration?.startsWith('library') ? 'verbal' : 'home'} size={right ? 100 : 140} />
            </View>
          ) : null}
          {right ? (
            <View className="hidden lg:flex">{right}</View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}
