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
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';
import { Badge } from '@/components/ui/Badge';
import { type SceneKind } from '@/components/three/Hero3D';
import { HeroArt, type ArtScene } from '@/components/illust/HeroArt';
import { GoldHighlight } from './GoldHighlight';
import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RCREAM, RINK } from '@/components/profile-retro/retro-art';
import { CatPose, CatSticker } from '@/components/mascot/CatSticker';
import { PerchCat } from '@/components/mascot/PerchCat';

/**
 * Hero nền lưới sáng — kiểu đang dùng ở trang chủ, nay dùng chung.
 *
 * Trước đây trang Tổng quan có hero riêng: một khối gradient xanh đặc, chữ
 * trắng, kèm hình minh hoạ 3D. Đặt cạnh trang chủ thì thành hai thế giới khác
 * nhau trong cùng một app — người dùng bấm "Bắt đầu học" ở trang chủ là rơi
 * thẳng vào một trang trông như của app khác.
 *
 * DÒNG THỨ HAI NẰM TRÊN KHỐI CHÀM. Đây là chỗ duy nhất còn chữ trắng: mắt bắt
 * được câu chốt trước cả khi đọc hết dòng một. Khối lùi trái đúng bằng đệm
 * ngang để hai dòng vẫn thẳng mép chữ.
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
}: {
  badge: string;
  line1: string;
  /** Dòng chốt, in trắng trên khối chàm. Bỏ trống thì hero chỉ có một dòng. */
  line2?: string;
  subtitle: string;
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
}) {
  const width = useWindowDimensions().width;
  const chiikawaTheme = useRewardStore((state) => state.theme === 'theme-chiikawa');
  const selectedPalette = CUTE_PALETTES[useCuteAppearanceStore((state) => state.palette)];
  const palette = chiikawaTheme ? CUTE_PALETTES.strawberry : selectedPalette;
  const wide = width >= 768;
  // Trong khung duyệt của giao diện retro: khối hero là thẻ kem có viền mực, không gradient.
  const retro = useRetroStyle();
  // Điện thoại: khối hero gọn như đầu một màn của app, không phải một trang quảng cáo.
  const phone = width < 640;
  const size = wide ? 44 : phone ? 24 : 28;
  const line = wide ? 52 : phone ? 30 : 36;
  // Cụm minh hoạ chỉ hiện khi màn đủ rộng; máy tính bảng dựng đứng / điện
  // thoại bỏ hẳn để tiêu đề không bị ép xuống dòng (người dùng 01/10/2026).
  const art = width >= HEADER_ART_MIN;
  // Mèo mặc định: mọi hero đều có mèo, trừ theme Chiikawa và giao diện retro (đã có nhân vật riêng).
  const petCat: CatPose | undefined = cat ?? (chiikawaTheme || retro ? undefined : heroCatFor(badge));
  // Máy tính, hero không truyền `cat`: mèo bám lên mép trên khung, nên cần đệm để không bị che.
  const perchTop = wide && !cat && !!petCat;

  /*
    Bọc thêm một HÀNG NGANG quanh nền: `GridBackdrop` lấy cả khung bằng
    `flex-1`, mà `flex-1` trong một cột cao-theo-nội-dung thì co về 0. Trong
    hàng ngang, flex-1 ăn theo bề ngang còn chiều cao do nội dung quyết định.
  */
  return (
    <View style={{ position: 'relative', paddingTop: perchTop ? 66 : 0 }}>
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
          : HERO_FRAME
      }
    >
      {/* Hero dạng LightHero dùng nền loang sạch; lưới caro chỉ giữ ở các màn
          đọc/thi/tác vụ có chủ đích dùng GridBackdrop riêng. */}
      <GridBackdrop
        colors={retro ? ([RCREAM, RCREAM] as never) : palette.study}
        line={retro ? RINK : palette.studyLine}
        blobs={retro ? ([RCREAM, RCREAM] as never) : [palette.study[0], palette.study[2]]}
        showGrid={false}
      >
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

          <Text className="mt-4 font-heavy text-paper-ink" style={{ fontSize: size, lineHeight: line, color: retro ? RINK : undefined }}>
            {line1}
          </Text>

          {line2 ? (
            <GoldHighlight fontSize={size} lineHeight={line}>
              {line2}
            </GoldHighlight>
          ) : null}

          <Text
            className={phone ? 'mt-2 font-sans text-paper-body' : 'mt-4 font-sans text-bodyLg text-paper-body'}
            style={phone ? { fontSize: 14, lineHeight: 20, maxWidth: 620 } : { maxWidth: 620 }}
          >
            {subtitle}
          </Text>

          {children ? <View className={phone ? 'mt-4 flex-row flex-wrap gap-2' : 'mt-6 flex-row flex-wrap gap-2'}>{children}</View> : null}
          {footer ? <View className={phone ? 'mt-4 flex-row flex-wrap gap-1.5' : 'mt-7 flex-row flex-wrap gap-2'}>{footer}</View> : null}
        </View>
      </GridBackdrop>
      <LightSweep />
    </View>
    {perchTop ? <PerchCat pose={petCat as CatPose} size={70} side="right" inset={70} offset={66} /> : null}
    </View>
  );
}

/** Mèo mặc định của hero: cùng một trang luôn có cùng một con (chọn theo nhãn khối). */
const HERO_CATS: CatPose[] = ['read', 'headphones', 'think', 'write', 'cheer', 'wave', 'sunglasses', 'peace'];

function heroCatFor(badge: string): CatPose {
  let h = 0;
  for (let i = 0; i < badge.length; i += 1) h = (h * 31 + badge.charCodeAt(i)) >>> 0;
  return HERO_CATS[h % HERO_CATS.length] ?? 'read';
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
