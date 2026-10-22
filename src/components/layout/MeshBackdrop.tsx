import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';

/**
 * NỀN POSTER PASTEL — nền trắng ngà với các mảng màu loang (xanh, bạc hà, vàng kem, hồng), lưới
 * caro mảnh, và vài sticker ở mép: sao bốn cánh cầu vồng, ô icon bo góc, tròn gradient có glyph.
 * Chỉ là nền: không nhận chạm, không chạy hoạt hoạ, nên không tốn khung hình nào.
 */

const GRID = 56;
const RAINBOW = ['#E85A9B', '#E0413A', '#F28C28', '#F5C518', '#3DBE6B', '#3F8AE0'];
const STAR = 'M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z';

/** Mảng màu mờ bằng gradient tròn (cùng cách với PhoneBackdrop): đầu ngoài trong suốt. */
const softFade = (color: string) => `radial-gradient(closest-side, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0)')} 100%)`;

/** Điện thoại: trắng–hồng–lilac, bớt xanh (mảng xanh chỉ giữ rất nhạt ở góc). */
const MESH_PHONE = [
  { color: 'rgba(252,206,226,0.58)', w: 600, h: 500, top: '-20%', left: '-18%' },
  { color: 'rgba(238,226,255,0.6)', w: 600, h: 500, top: '-16%', right: '-16%' },
  { color: 'rgba(255,214,232,0.5)', w: 600, h: 500, bottom: '-22%', left: '-16%' },
  { color: 'rgba(250,200,222,0.56)', w: 620, h: 500, bottom: '-18%', right: '-18%' },
  { color: 'rgba(236,228,255,0.5)', w: 520, h: 440, top: '40%', left: '-24%' },
  { color: 'rgba(255,220,236,0.46)', w: 520, h: 440, top: '46%', right: '-22%' },
] as const;

const MESH = [
  { color: 'rgba(140,184,240,0.72)', w: 640, h: 520, top: '-20%', left: '-16%' },
  { color: 'rgba(150,224,184,0.68)', w: 640, h: 520, top: '-18%', right: '-14%' },
  { color: 'rgba(250,216,130,0.66)', w: 620, h: 520, bottom: '-22%', left: '-18%' },
  { color: 'rgba(242,164,186,0.62)', w: 640, h: 520, bottom: '-20%', right: '-16%' },
  { color: 'rgba(160,190,255,0.5)', w: 560, h: 460, top: '38%', left: '-22%' },
  { color: 'rgba(250,190,215,0.5)', w: 560, h: 460, top: '44%', right: '-20%' },
] as const;

type Pos = { top?: `${number}%`; bottom?: `${number}%`; left?: `${number}%`; right?: `${number}%` };

/** Sao bốn cánh tô gradient cầu vồng. */
function Sparkle({ size, pos }: { size: number; pos: Pos }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', ...pos, width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <SvgGradient id="mesh-rainbow" x1="0" y1="0" x2="1" y2="1">
            {RAINBOW.map((c, i) => (
              <Stop key={c} offset={i / (RAINBOW.length - 1)} stopColor={c} />
            ))}
          </SvgGradient>
        </Defs>
        <Path d={STAR} fill="url(#mesh-rainbow)" />
      </Svg>
    </View>
  );
}

/** Glyph trắng vẽ trong khung 24×24. */
const GLYPH = {
  code: <Path d="M9 7 L4 12 L9 17 M15 7 L20 12 L15 17" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />,
  braces: (
    <Path
      d="M10 4 Q7 4 7 8 V10 Q7 12 4.5 12 Q7 12 7 14 V16 Q7 20 10 20 M14 4 Q17 4 17 8 V10 Q17 12 19.5 12 Q17 12 17 14 V16 Q17 20 14 20"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  ),
  chip: (
    <>
      <Rect x={8} y={8} width={8} height={8} rx={1.5} fill="none" stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M11 3 V6 M13 3 V6 M11 18 V21 M13 18 V21 M3 11 H6 M3 13 H6 M18 11 H21 M18 13 H21" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  sparkle: <Path d={STAR} fill="#FFFFFF" />,
} as const;

/** Ô (bo góc) hoặc tròn có gradient và glyph ở giữa, hơi nghiêng. */
function Badge({
  shape,
  size,
  pos,
  colors,
  glyph,
  rotate = '0deg',
}: {
  shape: 'tile' | 'circle';
  size: number;
  pos: Pos;
  colors: readonly [string, string];
  glyph: keyof typeof GLYPH;
  rotate?: string;
}) {
  const radius = shape === 'circle' ? size / 2 : size * 0.3;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        ...pos,
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        transform: [{ rotate }],
      }}
    >
      <LinearGradient colors={colors as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
          {GLYPH[glyph]}
        </Svg>
      </LinearGradient>
    </View>
  );
}

/** `stickers`: thêm sao, ô và tròn trang trí ở mép (trang giới thiệu). Các trang ứng dụng để tắt. */
export function MeshBackdrop({ stickers = false, blobs = true }: { stickers?: boolean; blobs?: boolean }) {
  // Máy hẹp không vẽ sticker: chúng sẽ đè lên chữ.
  const { width } = useWindowDimensions();
  const showStickers = stickers && width >= 640;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <LinearGradient colors={width < 640 ? ['#FFFBFD', '#FFFFFF', '#FFF5FA'] : ['#FBFCFE', '#FFFFFF', '#F3F0FB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {blobs ? (width < 640 ? MESH_PHONE : MESH).map((m, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: m.w,
            height: m.h,
            top: 'top' in m ? m.top : undefined,
            bottom: 'bottom' in m ? m.bottom : undefined,
            left: 'left' in m ? m.left : undefined,
            right: 'right' in m ? m.right : undefined,
            backgroundImage: softFade(m.color),
          } as never}
        />
      )) : null}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="mesh-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <Path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(15,29,51,0.12)" strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#mesh-grid)" />
      </Svg>
      {showStickers ? (
        <>
          <Sparkle size={92} pos={{ top: '20%', left: '3%' }} />
          <Sparkle size={30} pos={{ top: '17%', left: '17%' }} />
          <Sparkle size={36} pos={{ bottom: '4%', left: '24%' }} />
          <Badge shape="tile" size={66} pos={{ top: '34%', right: '3%' }} colors={['#8EC5FF', '#3B82E8']} glyph="code" rotate="12deg" />
          <Badge shape="circle" size={74} pos={{ bottom: '20%', left: '2%' }} colors={['#FFE58F', '#F5C518']} glyph="braces" />
          <Badge shape="circle" size={64} pos={{ bottom: '10%', right: '1%' }} colors={['#FF9C8C', '#F0644F']} glyph="chip" />
          <Badge shape="circle" size={68} pos={{ bottom: '-1%', left: '18%' }} colors={['#A8E6B8', '#3DBE6B']} glyph="sparkle" />
        </>
      ) : null}
    </View>
  );
}
