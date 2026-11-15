import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';

import { NEON_ICONS, NEON_TITLES, NEON_TITLES_EN, type NeonIconId, type NeonTitleId } from '@/components/neon/neon-art';
import { NeonBob, NeonTwinkle, softBlob } from '@/components/neon/NeonMotion';
import { useSharedFont } from '@/components/neon/useSharedFont';
import { useL } from '@/i18n/useL';

const uriCache = new Map<string, string>();

export function NeonIcon({ name, height, style }: { name: NeonIconId; height: number; style?: object }) {
  const a = NEON_ICONS[name];
  const width = (height * a.w) / a.h;
  if (Platform.OS === 'web') {
    // Web: thẻ <img> thuần (một nút DOM) thay cho `Image` của react-native-web (ba nút), vì mỗi trang có hàng chục icon.
    let uri = uriCache.get(name);
    if (!uri) {
      uri = Asset.fromModule(a.src as number).uri;
      uriCache.set(name, uri);
    }
    return React.createElement('img', { src: uri, alt: '', draggable: false, decoding: 'async', style: { height, width, objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none', ...(StyleSheet.flatten(style) as object) } });
  }
  return <Image source={a.src} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ height, width }, style]} resizeMode="contain" />;
}

/** Chữ tiêu đề lớn (ảnh), nhấp nhô nhẹ. `label` là chữ đọc cho trình đọc màn hình. */
export function NeonTitle({ id, label, maxWidth = 560, bob = true }: { id: NeonTitleId; label: string; maxWidth?: number; bob?: boolean }) {
  const { en } = useL();
  const a = (en ? NEON_TITLES_EN : NEON_TITLES)[id];
  return (
    <NeonBob amp={7} tilt={0.6} ms={2400} style={bob ? { width: '100%', maxWidth, alignSelf: 'center' } : { width: '100%', maxWidth, alignSelf: 'center' }}>
      <View accessibilityRole="header" accessibilityLabel={label} style={{ width: '100%', aspectRatio: a.w / a.h }}>
        <Image source={a.src} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </View>
    </NeonBob>
  );
}

function Twinkle({ icon, size, left, top, delay }: { icon: NeonIconId; size: number; left: `${number}%`; top: `${number}%`; delay: number }) {
  return (
    <NeonTwinkle ms={1500 + (delay % 5) * 300} delay={delay} style={{ position: 'absolute', left, top, pointerEvents: 'none' }}>
      <NeonIcon name={icon} height={size} />
    </NeonTwinkle>
  );
}

/** Họa tiết trôi nhẹ lên xuống, mỗi cái một nhịp riêng. */
function Floaty({ icon, size, left, top, delay, amp, tilt }: { icon: NeonIconId; size: number; left: `${number}%`; top: `${number}%`; delay: number; amp: number; tilt: number }) {
  return (
    <NeonBob amp={amp} tilt={Math.min(3, Math.abs(tilt) / 2)} ms={2600 + (delay % 7) * 350} delay={delay} style={{ position: 'absolute', left, top, pointerEvents: 'none' }}>
      <NeonIcon name={icon} height={size} />
    </NeonBob>
  );
}

type Decor = [NeonIconId, number, number, number, number, number, number]; // icon, size, left%, top%, delay, amp, tilt

/** Bố cục họa tiết cho từng khung: chỉ đặt ở mép trái, phải để không đè chữ và thẻ bài. */
const SCENES: Record<NeonScene, { wide: Decor[]; phone: Decor[] }> = {
  sat: {
    wide: [['gem', 58, 3, 26, 0, 8, -8], ['bolt', 56, 89, 22, 500, 8, 8], ['coin', 48, 5, 64, 900, 7, -6], ['trophy', 52, 90, 58, 1300, 7, 8], ['crown', 40, 66, 4, 300, 6, -8], ['planet', 46, 80, 8, 1100, 6, 6], ['rocket', 52, 92, 84, 700, 7, 8], ['star5', 34, 2, 86, 1500, 6, -6]],
    phone: [['gem', 42, 1, 3, 0, 5, -8], ['bolt', 40, 86, 3, 500, 5, 8]],
  },
  progress: {
    wide: [['rocket', 64, 3, 24, 0, 8, -8], ['gem', 52, 89, 22, 500, 8, 8], ['coin', 46, 5, 62, 900, 7, -6], ['medal', 52, 90, 58, 1300, 7, 8], ['bolt', 40, 66, 4, 300, 6, -8], ['moon', 44, 80, 8, 1100, 6, 6], ['planet', 50, 92, 84, 700, 7, 8], ['heart', 34, 2, 86, 1500, 6, -6]],
    phone: [['rocket', 42, 1, 3, 0, 5, -8], ['gem', 40, 86, 3, 500, 5, 8]],
  },
  today: {
    wide: [['moon', 58, 3, 26, 0, 8, -8], ['rocket', 66, 88, 22, 500, 10, 8], ['cloud', 60, 5, 62, 900, 6, 0], ['planet', 56, 90, 58, 1300, 7, 6], ['gem', 38, 66, 4, 300, 6, -6], ['coin', 36, 78, 8, 1100, 6, 8], ['bolt', 40, 93, 82, 700, 6, 10], ['note', 34, 2, 86, 1500, 6, -8]],
    phone: [['moon', 40, 2, 6, 0, 5, -8], ['rocket', 46, 85, 5, 500, 6, 8], ['cloud', 44, 1, 88, 900, 4, 0], ['planet', 42, 86, 87, 1300, 5, 6]],
  },
  rank: {
    wide: [['crown', 58, 3, 24, 0, 8, -8], ['medal', 56, 89, 22, 500, 8, 8], ['gem', 48, 5, 60, 900, 7, -6], ['coin', 46, 90, 58, 1300, 7, 8], ['bolt', 40, 66, 4, 300, 6, -8], ['gift', 44, 80, 8, 1100, 6, 6], ['rocket', 50, 92, 84, 700, 7, 8], ['heart', 34, 2, 86, 1500, 6, -6]],
    phone: [['crown', 40, 1, 6, 0, 5, -8], ['medal', 40, 86, 6, 500, 5, 8], ['gem', 40, 1, 87, 900, 5, -6], ['coin', 40, 87, 87, 1300, 5, 8]],
  },
  path: {
    wide: [['planet', 62, 3, 24, 0, 8, -8], ['rocket', 66, 88, 22, 500, 10, 8], ['book', 50, 5, 62, 900, 6, -4], ['moon', 54, 90, 58, 1300, 7, 6], ['note', 36, 66, 4, 300, 6, -6], ['gamepad', 46, 78, 8, 1100, 6, 8], ['cloud', 56, 92, 84, 700, 6, 0], ['bolt', 38, 2, 86, 1500, 6, -8]],
    phone: [['planet', 42, 2, 6, 0, 5, -8], ['rocket', 46, 85, 5, 500, 6, 8], ['book', 40, 1, 88, 900, 4, -4], ['moon', 42, 87, 87, 1300, 5, 6]],
  },
};

const DOTS: [number, number, number][] = [
  [4, 36, 5], [12, 74, 4], [21, 12, 5], [30, 88, 4], [38, 6, 4], [46, 93, 5], [55, 20, 4], [63, 80, 5], [71, 9, 5], [80, 62, 4], [88, 30, 5], [93, 90, 4], [9, 55, 4], [76, 44, 4], [17, 28, 4], [34, 47, 4], [67, 33, 5], [58, 58, 4], [85, 74, 5], [24, 66, 4],
];

export type NeonScene = 'today' | 'rank' | 'path' | 'progress' | 'sat';

/**
 * Nền "hệ điều hành retro" theo ảnh mẫu: xanh tím đậm, vầng sáng xanh ngọc phía trên và tím hồng phía dưới, lưới ô mờ,
 * chấm trắng, sao pixel nhấp nháy và họa tiết pixel trôi nhẹ theo từng khung (`scene`). Không có chữ chính; chỉ một dòng
 * nhỏ kiểu máy cũ ở góc dưới. Đặt làm lớp đầu tiên trong một khung `overflow: hidden`.
 */
export function NeonBackdrop({ dense = true, scene }: { dense?: boolean; scene?: NeonScene }) {
  const phone = useWindowDimensions().width < 640;
  const grid =
    Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(rgba(150,160,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(150,160,255,0.13) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          backgroundPosition: 'center',
        } as object)
      : null;
  const decor = scene ? SCENES[scene][phone ? 'phone' : 'wide'] : [];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#1A1566', '#2A22B5', '#4A30D8']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', left: '14%', top: -190, width: '72%', height: 380, ...softBlob('rgba(30,215,190,0.5)') }} />
      <View style={{ position: 'absolute', right: -170, bottom: -190, width: 560, height: 420, ...softBlob('rgba(214,92,255,0.62)') }} />
      <View style={{ position: 'absolute', left: -190, bottom: -170, width: 460, height: 380, ...softBlob('rgba(70,110,255,0.55)') }} />
      {grid ? <View style={[StyleSheet.absoluteFill, grid]} /> : null}
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundImage: DOTS.slice(0, dense ? DOTS.length : 8).map(([t, l]) => `radial-gradient(circle at ${l}% ${t}%, rgba(255,255,255,0.85) 2px, transparent 2.6px)`).join(', ') } as object]} />
      ) : (
        DOTS.slice(0, dense ? DOTS.length : 8).map(([t, l, sz], i) => <View key={i} style={{ position: 'absolute', top: `${t}%`, left: `${l}%`, width: sz, height: sz, backgroundColor: 'rgba(255,255,255,0.85)' }} />)
      )}
      <Twinkle icon="star4" size={30} left="6%" top="14%" delay={0} />
      <Twinkle icon="sparkle" size={40} left="88%" top="66%" delay={500} />
      <Twinkle icon="star4" size={22} left="80%" top="10%" delay={900} />
      {dense ? <Twinkle icon="sparkle" size={30} left="10%" top="70%" delay={1300} /> : null}
      {decor.map(([icon, size, left, top, delay, amp, tilt]) => (
        <Floaty key={`${icon}-${left}-${top}`} icon={icon} size={size} left={`${left}%`} top={`${top}%`} delay={delay} amp={amp} tilt={tilt} />
      ))}
      {scene && !phone ? (
        <View style={{ position: 'absolute', right: 14, bottom: 8 }}>
          <PixelText size={15} color="rgba(255,255,255,0.45)">{'BAND 9 OS v1.0'}</PixelText>
        </View>
      ) : null}
    </View>
  );
}

/** Viên nhỏ kính tối có icon pixel: số liệu một dòng ngắn. */
export function NeonPill({ icon, label, onPress, tone = 'dark' }: { icon?: NeonIconId; label: string; onPress?: () => void; tone?: 'dark' | 'gold' }) {
  const Body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, minHeight: 38, borderRadius: 19, backgroundColor: tone === 'gold' ? '#FFD84A' : 'rgba(10,8,70,0.55)', borderWidth: 2, borderColor: tone === 'gold' ? '#FFF1A8' : 'rgba(255,255,255,0.2)' }}>
      {icon ? <NeonIcon name={icon} height={22} /> : null}
      <NeonText style={{ fontSize: 13, color: tone === 'gold' ? '#2B1D00' : '#FFFFFF' }}>{label}</NeonText>
    </View>
  );
  return onPress ? (
    <PressableBare label={label} onPress={onPress}>
      {Body}
    </PressableBare>
  ) : (
    Body
  );
}

export function NeonText({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text className="font-nun-heavy" style={style}>
      {children}
    </Text>
  );
}

function PressableBare({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ hovered }: { hovered?: boolean }) => ({ opacity: hovered ? 0.85 : 1, minHeight: 44, justifyContent: 'center' })}>
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------- cửa sổ neon và tiêu đề mục

const PIXEL_FONT = { VT323_400Regular: require('../../../assets/fonts/VT323_400Regular.ttf') };

/** Nạp phông pixel VT323 (OFL, có đủ dấu tiếng Việt). Gọi ở mọi nơi dùng `PixelText`, nạp một lần. */
export function usePixelFont(): boolean {
  return useSharedFont('VT323_400Regular', PIXEL_FONT);
}

/** Chữ pixel kiểu máy tính cũ cho nhãn và tiêu đề mục; trong lúc phông chưa nạp dùng phông thường để không nhảy chữ. */
export function PixelText({ children, size = 22, color = '#FFFFFF', glow, style }: { children: React.ReactNode; size?: number; color?: string; glow?: string; style?: object }) {
  const ok = usePixelFont();
  return (
    <Text
      style={[
        { fontFamily: ok ? 'VT323_400Regular' : undefined, fontWeight: ok ? undefined : '800', fontSize: size, lineHeight: Math.round(size * 1.05), color, letterSpacing: 0.5 },
        glow && Platform.OS === 'web' ? ({ textShadow: `0 0 8px ${glow}, 0 0 16px ${glow}` } as object) : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const NEON_COLORS = { ink: '#1A1566', indigo: '#2A22B5', violet: '#6A3FE0', soft: '#F3F0FF', softer: '#F9F7FF', cyan: '#19D3C5', pink: '#FF5DB1', gold: '#FFD84A' };

/**
 * Cửa sổ kiểu hệ điều hành retro: thanh tiêu đề xanh tím có ba chấm, tên cửa sổ bằng chữ pixel, icon neon bên phải.
 * Thân sáng để giữ nguyên các thẻ và bảng số liệu bên trong; viền và bóng đặc cho đồng bộ với khung hero.
 */
export function NeonWindow({
  title,
  icon,
  badge,
  children,
  padded = true,
  tone = 'light',
  style,
}: {
  title: string;
  icon?: NeonIconId;
  badge?: string;
  children: React.ReactNode;
  padded?: boolean;
  tone?: 'light' | 'dark';
  style?: object;
}) {
  const dark = tone === 'dark';
  const narrow = useWindowDimensions().width < 520;
  return (
    <View style={[{ borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: NEON_COLORS.indigo, backgroundColor: dark ? 'rgba(14,10,80,0.92)' : '#FFFFFF' }, Platform.OS === 'web' ? ({ boxShadow: `0 6px 0 rgba(42,34,181,0.38)` } as object) : null, style]}>
      <LinearGradient colors={[NEON_COLORS.indigo, NEON_COLORS.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, minHeight: 44 }}>
        <View style={{ flexDirection: 'row', gap: 5 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[NEON_COLORS.pink, NEON_COLORS.gold, NEON_COLORS.cyan].map((c) => (
            <View key={c} style={{ width: 11, height: 11, backgroundColor: c, borderWidth: 1.5, borderColor: 'rgba(10,8,60,0.55)' }} />
          ))}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <PixelText size={narrow ? 20 : 24} glow="rgba(140,200,255,0.8)">
            {title}
          </PixelText>
        </View>
        {badge ? (
          <View style={{ paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <PixelText size={narrow ? 16 : 18}>{badge}</PixelText>
          </View>
        ) : null}
        {icon ? <NeonIcon name={icon} height={30} /> : null}
      </LinearGradient>
      <View style={padded ? { padding: 16 } : null}>{children}</View>
    </View>
  );
}

/** Tiêu đề mục đứng riêng (không có khung): chữ pixel xanh tím, icon neon, gạch chấm kéo dài. */
export function NeonHeading({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: NeonIconId }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon ? <NeonIcon name={icon} height={34} /> : null}
        <PixelText size={30} color={NEON_COLORS.indigo}>
          {title}
        </PixelText>
        <View style={{ flex: 1, height: 0, borderTopWidth: 3, borderStyle: 'dotted', borderColor: 'rgba(42,34,181,0.35)', marginTop: 4 }} />
      </View>
      {subtitle ? (
        <Text className="font-nun-strong" style={{ fontSize: 14, color: '#6B6890' }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Thanh tiêu đề mục kiểu băng game: nền gradient chàm → tím, icon neon, tên chữ pixel, số lượng và hạt sáng ở đuôi. */
export function NeonSectionBar({ title, count, icon }: { title: string; count?: number; icon: NeonIconId }) {
  return (
    <LinearGradient
      colors={[NEON_COLORS.indigo, NEON_COLORS.violet, '#C23FC9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)', overflow: 'hidden' }, Platform.OS === 'web' ? ({ boxShadow: '0 5px 0 rgba(42,34,181,0.4)' } as object) : null]}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}>
        <NeonIcon name={icon} height={30} />
      </View>
      <PixelText size={30} glow="rgba(160,210,255,0.85)" style={{ flex: 1 }}>
        {title}
      </PixelText>
      {typeof count === 'number' ? (
        <View style={{ minWidth: 34, height: 34, paddingHorizontal: 8, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD84A' }}>
          <PixelText size={24} color="#2B1D00">
            {count}
          </PixelText>
        </View>
      ) : null}
      <View pointerEvents="none" style={{ position: 'absolute', right: 56, top: 6 }}>
        <NeonIcon name="star4" height={20} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', right: 96, bottom: 6 }}>
        <NeonIcon name="sparkle" height={18} />
      </View>
    </LinearGradient>
  );
}
