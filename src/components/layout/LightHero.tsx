import React, { useEffect, useState } from 'react';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
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

import { GridBackdrop } from './GridBackdrop';
import { CUTE_PALETTES } from './cute-palettes';
import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';
import { Badge } from '@/components/ui/Badge';
import { type SceneKind } from '@/components/three/Hero3D';
import { HeroArt, type ArtScene } from '@/components/illust/HeroArt';
import { GoldHighlight } from './GoldHighlight';
import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { usePixelTheme } from '@/components/pixel-theme/pixel-art';
import { RCREAM, RINK } from '@/components/profile-retro/retro-art';
import { CatPose, CatSticker } from '@/components/mascot/CatSticker';

/** Màu khung và nền của hero theo phong cách trang chủ (viền gradient, nền đêm có hoạ tiết). */
const INK = '#0B0520';
const HERO_RING = ['#FF5FA2', '#FFD84A', '#3A8CFF', '#8A3FE0'] as unknown as [string, string, ...string[]];
const MODERN_SUB = 'rgba(27,17,64,0.85)';

/**
 * Hero dùng chung cho mọi trang. Giao diện mặc định dùng đúng phong cách của trang chủ: nền hoạ tiết
 * (HeroBackdrop), viền gradient, chữ trắng. Giao diện retro và pixel giữ khung riêng của họ.
 *
 * DÒNG THỨ HAI NẰM TRÊN NỀN HERO. Khối lùi trái đúng bằng đệm ngang để hai dòng vẫn thẳng mép chữ.
 */
export function LightHero({
  badge,
  line1,
  line2,
  subtitle,
  children,
  footer,
  scene,
  art: artScene,
  cat,
  chip,
  accent = 'vivid',
  noCat = false,
  noArt = false,
}: {
  badge: string;
  line1: string;
  /** Dòng chốt, in trên nền hero. Bỏ trống thì hero chỉ có một dòng. */
  line2?: string;
  /** Màu dải nhấn dòng chốt: gradient tím–san hô–cam (mặc định, cùng bảng màu toàn web) hoặc vàng kim cũ. */
  accent?: 'gold' | 'vivid';
  /** Không đặt mèo bám trên hero (trang IELTS bỏ sư tử trang trí). */
  noCat?: boolean;
  /** Không vẽ hình minh hoạ bên phải (trang luyện tập). */
  noArt?: boolean;
  /** Đoạn mô tả dưới tiêu đề. Bỏ trống thì không hiện. */
  subtitle?: string;
  /** Hàng nút. */
  children?: React.ReactNode;
  /** Hàng viên số liệu dưới cùng. */
  footer?: React.ReactNode;
  /** Cảnh 3D trang trí bên phải (web). Bỏ trống thì hero chỉ có chữ. */
  scene?: SceneKind;
  /** Cụm sticker khác với `scene` (vd. 'quest', 'shop'); mặc định theo `scene`. */
  art?: ArtScene;
  /** Mèo sticker ngồi ở góc trên phải; chỉ hiện trên điện thoại, máy tính giữ nguyên minh hoạ. */
  cat?: CatPose;
  /** Từ đầu tiêu đề đặt trong khối cầu vồng (kiểu tiêu đề AI Arena); line1 là phần còn lại. */
  chip?: string;
}) {
  const width = useWindowDimensions().width;
  const chiikawaTheme = useRewardStore((state) => state.theme === 'theme-chiikawa');
  const selectedPalette = CUTE_PALETTES[useCuteAppearanceStore((state) => state.palette)];
  const px = usePixelTheme();
  const palette = chiikawaTheme ? CUTE_PALETTES.strawberry : px ? px.palette : selectedPalette;
  const wide = width >= 768;
  // Trong khung duyệt của giao diện retro: khối hero là thẻ kem có viền mực, không gradient.
  const retro = useRetroStyle();
  // Giao diện pixel: khối hero là thẻ lilac có viền mực và bóng lệch đặc.
  const pixel = px !== null;
  // Giao diện mặc định (và Chiikawa không dùng): hero theo phong cách trang chủ.
  const modern = !retro && !pixel && !chiikawaTheme;
  // Điện thoại: khối hero gọn như đầu một màn của app, không phải một trang quảng cáo.
  const phone = width < 640;
  const size = wide ? 44 : phone ? 24 : 28;
  const line = wide ? 52 : phone ? 30 : 36;
  // Cụm minh hoạ chỉ hiện khi màn đủ rộng; máy tính bảng dựng đứng / điện
  // thoại bỏ hẳn để tiêu đề không bị ép xuống dòng (người dùng 01/10/2026).
  // Trang luyện tập không cần hình minh hoạ: noArt tắt hẳn hình bên phải để chữ có chỗ.
  const art = !noArt && width >= HEADER_ART_MIN;
  // Không còn mèo mặc định trên hero: chỉ hiện mèo khi trang truyền `cat` rõ ràng.
  const petCat: CatPose | undefined = noCat ? undefined : cat;

  // Nội dung hero, dùng chung cho cả hai giao diện nền.
  const content = (
    <>
      {phone && petCat ? <CatSticker pose={petCat} size={84} style={{ position: 'absolute', top: 14, right: 14 }} /> : null}
      {art ? (
        <View style={{ position: 'absolute', top: 0, bottom: 0, right: 36, justifyContent: 'center' }}>
          {/* Trang có mèo sticker thì đặt mèo vào chỗ minh hoạ, giống bản điện thoại. */}
          {cat ? <CatSticker pose={cat} size={150} /> : <HeroArt scene={artScene ?? scene} size={150} />}
        </View>
      ) : null}
      <View
        style={{
          paddingHorizontal: wide ? 40 : phone ? 18 : 22,
          paddingVertical: wide ? 52 : phone ? 18 : 30,
          // Chừa chỗ bên phải cho ngôi sao, để chữ không chạy đè lên nó.
          paddingRight: art ? 440 : wide ? 40 : phone ? (petCat ? 104 : 18) : 22,
        }}
      >
        <Badge label={badge} tone="neutral" shape="tag" />

        {chip ? (
          <View className="mt-4 flex-row flex-wrap items-center" style={{ gap: size * 0.3 }}>
            <LinearGradient
              colors={CHIP_RAINBOW}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: line * 0.3, paddingHorizontal: size * 0.4, paddingVertical: size * 0.08, transform: [{ skewX: '-8deg' }] }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: size, lineHeight: line, color: '#FFFFFF' }}>{chip}</Text>
            </LinearGradient>
            <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: size, lineHeight: line, color: retro ? RINK : modern ? '#1B1140' : '#2B2350' }}>{line1}</Text>
          </View>
        ) : (
          <Text className="mt-4 font-heavy text-paper-ink" style={{ fontSize: size, lineHeight: line, color: retro ? RINK : modern ? '#1B1140' : undefined }}>
            {line1}
          </Text>
        )}

        {line2 ? (
          <GoldHighlight fontSize={size} lineHeight={line} tone={accent}>
            {line2}
          </GoldHighlight>
        ) : null}

        {subtitle ? (
          <Text
            className={phone ? 'mt-2 font-sans text-paper-body' : 'mt-4 font-sans text-bodyLg text-paper-body'}
            style={phone ? { fontSize: 14, lineHeight: 20, maxWidth: 620, color: modern ? MODERN_SUB : undefined } : { maxWidth: 620, color: modern ? MODERN_SUB : undefined }}
          >
            {subtitle}
          </Text>
        ) : null}

        {children ? <View className={phone ? 'mt-4 flex-row flex-wrap gap-2' : 'mt-6 flex-row flex-wrap gap-2'}>{children}</View> : null}
        {footer ? <View className={phone ? 'mt-4 flex-row flex-wrap gap-1.5' : 'mt-7 flex-row flex-wrap gap-2'}>{footer}</View> : null}
      </View>
    </>
  );

  /*
    Bọc thêm một HÀNG NGANG quanh nền: `GridBackdrop` lấy cả khung bằng
    `flex-1`, mà `flex-1` trong một cột cao-theo-nội-dung thì co về 0. Trong
    hàng ngang, flex-1 ăn theo bề ngang còn chiều cao do nội dung quyết định.
  */
  const body = modern ? (
    <View>
      <HeroBackdrop />
      {content}
    </View>
  ) : (
    <GridBackdrop
      colors={retro ? ([RCREAM, RCREAM] as never) : pixel ? ([px?.paper, px?.paper] as never) : palette.study}
      line={retro ? RINK : px ? px.line : palette.studyLine}
      blobs={retro ? ([RCREAM, RCREAM] as never) : pixel ? ([px?.paper, px?.paper] as never) : [palette.study[0], palette.study[2]]}
      showGrid={false}
    >
      {content}
    </GridBackdrop>
  );

  const shell = modern ? (
    <LinearGradient colors={HERO_RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 2 }}>
      <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: INK }}>
        {body}
        <LightSweep />
      </View>
    </LinearGradient>
  ) : (
    <View
      style={
        retro
          ? ([
              HERO_FRAME,
              {
                borderRadius: 24,
                borderWidth: 3,
                borderColor: RINK,
                overflow: 'hidden',
                ...(Platform.OS === 'web' ? { boxShadow: '6px 6px 0 #1F1A1D' } : {}),
              },
            ] as never)
          : pixel
            ? ([
                HERO_FRAME,
                {
                  borderRadius: px?.radius,
                  borderWidth: px?.bw,
                  borderColor: px?.line,
                  overflow: 'hidden',
                  ...(Platform.OS === 'web' ? { boxShadow: px?.elevLg } : {}),
                },
              ] as never)
            : HERO_FRAME
      }
    >
      {body}
      <LightSweep />
    </View>
  );

  return (
    <View style={{ position: 'relative' }}>
      {shell}
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
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 16px 40px rgba(94, 72, 35,0.14)' } as object)
    : { elevation: 3 }),
} as const;

/** Gradient của nút chính: dải cầu vồng, cùng dải với khối "Luyện thi". */
export const CTA_GRADIENT = ['#E0413A', '#F28C28', '#F5C518', '#3DBE6B', '#3F8AE0'] as unknown as [string, string, ...string[]];

/** Dải cầu vồng của khối tiêu đề (kiểu AI Arena). */
const CHIP_RAINBOW = ['#E0413A', '#F28C28', '#F5C518', '#3DBE6B', '#3F8AE0'] as unknown as [string, string, ...string[]];

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
