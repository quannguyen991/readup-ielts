import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CUTE_FONT } from '@/components/cute-home/palette';
import { PIXEL_HEART, PixelBob, PixelGlyph, PixelSparkles } from '@/components/pixel-theme/pixel-fx';
import { PixelSprite } from '@/components/pixel-theme/pixel-ui';

/*
  Màn chào của trang chủ, theo phong cách poster trò chơi pixel:
  trời đêm có sao và sao băng, mây pixel trôi song song, thành phố pixel hai lớp,
  trăng cam, tiêu đề BAND 9 nhiều lớp, HUD kiểu game (người chơi, mạng = chuỗi ngày học,
  số dư sao), đồng xu quay, nhân vật Chikawa nhún và nút START nhấp nháy.
  Bấm bất kỳ đâu, hoặc Enter, để vào máy chơi.
*/

const SKY_TOP = '#2A0F4A';
const SKY_MID = '#4A1A6B';
const SKY_BOT = '#120A33';
const PINK = '#FF5FB0';
const PINK_DEEP = '#B3207A';
const PLUM = '#2A0B40';
const CLOUD = '#C9B8FF';
const CLOUD_HI = '#E8DEFF';
const MOON = '#FFB347';
const MOON_DEEP = '#E0802E';
const YELLOW = '#FFE14D';
const CITY_FAR = '#3A1257';
const CITY_NEAR = '#1E0836';
const WINDOW = '#FFE14D';
const STAR_COLORS = ['#FFFFFF', YELLOW, PINK, '#B9F6FF'] as const;

/** Mây pixel: mỗi `#` là một ô vuông. */
const CLOUD_SHAPE = [
  '.....#####.....',
  '...#########...',
  '.###########...',
  '##############.',
  '###############',
  '###############',
];

/** Sao băng pixel: đường chéo ngắn. */
const SHOOTER = ['......##', '.....##.', '....##..', '...##...'];

/** Đồng xu pixel 6×6. */
const COIN = ['..####..', '.######.', '########', '########', '.######.', '..####..'];

/** Thành phố pixel: các toà nhà có chiều cao ngẫu nhiên theo hạt giống. */
function skyline(seed: number, cols: number, rows: number): string[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const heights = Array.from({ length: cols }, () => 2 + Math.floor(rnd() * (rows - 3)));
  return Array.from({ length: rows }, (_, y) => {
    const level = rows - 1 - y;
    return heights.map((h) => (h > level ? '#' : '.')).join('');
  });
}

/** Nhấp nháy đều, dùng cho nút START và các nhãn chỉ dẫn. */
export function Blink({ children, style }: { children: React.ReactNode; style?: object }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.15, duration: 450, useNativeDriver: false }),
        Animated.timing(v, { toValue: 1, duration: 450, useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v]);
  return <Animated.View style={[{ opacity: v }, style]}>{children}</Animated.View>;
}

/** Một ngôi sao băng bay chéo rồi biến mất, lặp lại chậm. */
function ShootingStar({ top, left, delay }: { top: string; left: string; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(3600),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: top as never,
        left: left as never,
        opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 130] }) },
        ],
      }}
    >
      <PixelGlyph pattern={SHOOTER} cell={3} color="#FFFFFF" />
    </Animated.View>
  );
}

/** Một đám mây trôi ngang vô tận: đi từ trái sang phải rồi quay lại. Tốc độ khác nhau tạo chiều sâu. */
function DriftCloud({ top, cell, color, duration, delay }: { top: number; cell: number; color: string; duration: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: false }));
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-140, 1400] }) }],
      }}
    >
      <PixelGlyph pattern={CLOUD_SHAPE} cell={cell} color={color} />
    </Animated.View>
  );
}

/** Đồng xu quay: co giãn ngang qua lại như đồng xu đang lật. */
function Coin() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: false }));
    anim.start();
    return () => anim.stop();
  }, [v]);
  return (
    <Animated.View style={{ transform: [{ scaleX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.15, 1] }) }] }}>
      <PixelGlyph pattern={COIN} cell={4} color={YELLOW} />
    </Animated.View>
  );
}

/** Tiêu đề BAND 9 nhiều lớp: bóng tối lệch dưới, lớp hồng, viền sáng trên cùng, tạo cảm giác nổi khối. */
function Title({ size }: { size: number }) {
  const layer = { position: 'absolute' as const, left: 0, top: 0, fontFamily: CUTE_FONT.black, fontSize: size, letterSpacing: size * 0.04 };
  return (
    <View style={{ height: size * 1.12, width: size * 4.2 }}>
      <Text style={[layer, { color: PLUM, left: size * 0.09, top: size * 0.09 }]}>BAND 9</Text>
      <Text style={[layer, { color: PINK_DEEP, left: size * 0.05, top: size * 0.05 }]}>BAND 9</Text>
      <Text style={[layer, { color: '#FFFFFF', left: -size * 0.02, top: -size * 0.02 }]}>BAND 9</Text>
      <Text style={[layer, { color: PINK }]}>BAND 9</Text>
    </View>
  );
}

/** Bốn góc khung kiểu màn hình game. */
function Corners() {
  const base = { position: 'absolute' as const, width: 28, height: 28, borderColor: YELLOW };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[base, { top: 14, left: 14, borderTopWidth: 5, borderLeftWidth: 5 }]} />
      <View style={[base, { top: 14, right: 14, borderTopWidth: 5, borderRightWidth: 5 }]} />
      <View style={[base, { bottom: 14, left: 14, borderBottomWidth: 5, borderLeftWidth: 5 }]} />
      <View style={[base, { bottom: 14, right: 14, borderBottomWidth: 5, borderRightWidth: 5 }]} />
    </View>
  );
}

export function ArcadeSplash({
  onStart,
  stars,
  streak,
  stats,
  frameIndex,
  L,
}: {
  onStart: () => void;
  stars: string;
  /** Chuỗi ngày học liên tiếp: hiện thành trái tim trên HUD. */
  streak: number;
  stats: string[];
  frameIndex: number;
  L: (vi: string, en: string) => string;
}) {
  const { width, height } = useWindowDimensions();
  const titleSize = Math.max(60, Math.min(width * 0.12, 118));
  const sky = Math.max(height, 640);
  const cols = 56;
  const cell = Math.max(6, Math.floor(width / cols));
  const far = useMemo(() => skyline(7, cols, 16), []);
  const near = useMemo(() => skyline(19, cols, 11), []);
  const hearts = Math.min(5, streak);

  return (
    <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel={L('Bắt đầu', 'Start')} style={styles.root}>
      <LinearGradient colors={[SKY_TOP, SKY_MID, SKY_BOT]} locations={[0, 0.55, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Lớp sao và sao băng */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <PixelSparkles count={54} colors={STAR_COLORS} seed={77} cell={2} />
        <ShootingStar top="10%" left="8%" delay={0} />
        <ShootingStar top="18%" left="62%" delay={1800} />
      </View>

      {/* Trăng và ba lớp mây trôi với tốc độ khác nhau */}
      <View pointerEvents="none" style={[styles.moon, { top: sky * 0.12, right: width * 0.1 }]}>
        <View style={[styles.crater, { top: 22, left: 26, width: 18, height: 18 }]} />
        <View style={[styles.crater, { top: 60, left: 60, width: 12, height: 12 }]} />
        <View style={[styles.crater, { top: 44, left: 12, width: 10, height: 10 }]} />
      </View>
      <DriftCloud top={sky * 0.2} cell={6} color={CLOUD} duration={26000} delay={0} />
      <DriftCloud top={sky * 0.33} cell={5} color={CLOUD_HI} duration={36000} delay={7000} />
      <DriftCloud top={sky * 0.46} cell={7} color={CLOUD} duration={44000} delay={14000} />

      {/* Thành phố pixel hai lớp ở đáy */}
      <View pointerEvents="none" style={[styles.city, { height: cell * 16 }]}>
        <PixelGlyph pattern={far} cell={cell} color={CITY_FAR} />
      </View>
      <View pointerEvents="none" style={[styles.city, { height: cell * 11 }]}>
        <PixelGlyph pattern={near} cell={cell} color={CITY_NEAR} />
      </View>

      {/* HUD: người chơi, mạng (chuỗi ngày học), số dư sao */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.hudText}>1P</Text>
        <View style={styles.hearts}>
          {[0, 1, 2, 3, 4].map((i) => (
            <PixelGlyph key={i} pattern={PIXEL_HEART} cell={3} color={i < hearts ? PINK : '#4A2A66'} />
          ))}
        </View>
        <Text style={styles.hudText}>★ {stars}</Text>
      </View>

      <Corners />

      <View style={styles.content}>
        <View style={styles.topTag}>
          <Text style={styles.topTagText}>BAND 9 · ARCADE</Text>
        </View>

        <View style={styles.titleBlock}>
          <Title size={titleSize} />
          <View style={styles.subTag}>
            <Text style={styles.subTagText}>{L('ĐẤU TRƯỜNG IELTS · SAT', 'IELTS · SAT ARCADE')}</Text>
          </View>
        </View>

        <PixelBob amplitude={10} period={1500}>
          <PixelSprite name={frameIndex === 0 ? 'cheer' : 'wave'} />
        </PixelBob>

        <View style={styles.coinRow}>
          <Coin />
          <Blink>
            <Text style={styles.insert}>{L('NHÉT XU VÀO MÁY', 'INSERT COIN')}</Text>
          </Blink>
        </View>

        <Blink>
          <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel={L('Nhấn START', 'Press start')} style={styles.startWrap}>
            <LinearGradient colors={[YELLOW, '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.startBtn}>
              <Text style={styles.startText}>{L('NHẤN START', 'PRESS START')}</Text>
            </LinearGradient>
          </Pressable>
        </Blink>

        <View style={styles.infoRow}>
          {stats.map((s) => (
            <View key={s} style={styles.statChip}>
              <Text style={styles.statText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Viền sáng quanh màn để tách khung chào khỏi nền */}
      <View pointerEvents="none" style={styles.frame} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: SKY_BOT },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 20 },

  moon: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: MOON,
    borderWidth: 4,
    borderColor: MOON_DEEP,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 40px rgba(255,179,71,0.55)' } as object) : {}),
  },
  crater: { position: 'absolute', borderRadius: 10, backgroundColor: MOON_DEEP },

  city: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden' },

  hud: {
    position: 'absolute',
    top: 22,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudText: { fontFamily: CUTE_FONT.black, fontSize: 15, letterSpacing: 2, color: YELLOW },
  hearts: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  topTag: { backgroundColor: 'rgba(18,10,51,0.7)', borderRadius: 999, borderWidth: 2, borderColor: YELLOW, paddingHorizontal: 16, paddingVertical: 6 },
  topTagText: { fontFamily: CUTE_FONT.black, fontSize: 13, letterSpacing: 3, color: YELLOW },

  titleBlock: { alignItems: 'center', gap: 14 },
  subTag: { backgroundColor: PINK, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  subTagText: { fontFamily: CUTE_FONT.black, fontSize: 14, letterSpacing: 3, color: '#FFFFFF' },

  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insert: { fontFamily: CUTE_FONT.black, fontSize: 14, letterSpacing: 2, color: '#B9F6FF' },

  startWrap: { alignItems: 'center' },
  startBtn: {
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 6px 0 #7A3E00, 0 0 24px rgba(255,225,77,0.6)' } as object) : {}),
  },
  startText: { fontFamily: CUTE_FONT.black, fontSize: 22, letterSpacing: 3, color: PLUM },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 720 },
  statChip: { backgroundColor: 'rgba(18,10,51,0.7)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2, borderColor: '#B9F6FF' },
  statText: { fontFamily: CUTE_FONT.heavy, fontSize: 13, color: '#E6FBFF' },

  frame: { ...StyleSheet.absoluteFill, borderWidth: 6, borderColor: PINK, opacity: 0.85 },
});
