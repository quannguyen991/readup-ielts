import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PixelSparkles } from '@/components/pixel-theme/pixel-fx';
import { Icon, type IconName } from '@/components/ui';
import { bi, useL, type Bi } from '@/i18n/useL';

/*
  Bảng tin trên trang chủ máy tính: khung tối ở đầu với nhãn LIVE, một mục nổi bật bên trái
  (chữ hiện dần, thanh tiến trình chạy theo thời gian), danh sách mục bên phải.
  Tự chuyển mục sau mỗi DURATION ms; rê chuột vào thì đứng lại, bấm mục nào thì nhảy tới mục đó.
*/

const GOLD = '#B8955A';
const GOLD_DEEP = '#8A6A2E';
const GOLD_LIGHT = '#F2C65E';
const INK = '#2B2110';
const INK_SOFT = '#7A6A4A';
const CREAM = '#FFF6DE';
const LINE = '#F2E6CC';
const TIP = '#4F8A6B';
const SPARKS = ['#F2C65E', '#FFFFFF', '#E9B949'] as const;
const DURATION = 5000;
const TICK = 40;

export type News = { icon: IconName; tag: Bi; title: Bi; body: Bi; href: string };

/** Nhấp nháy nhẹ cho chấm LIVE. */
function Pulse({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(v, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v]);
  return <Animated.View style={{ opacity: v, alignSelf: 'flex-start' }}>{children}</Animated.View>;
}

/** Nhãn MẸO màu xanh lá, còn lại (MỚI) màu vàng đồng. */
const toneOf = (t: Bi) => (t.vi === 'MẸO' ? TIP : GOLD_DEEP);

export function NewsBoard({ items, onOpen }: { items: News[]; onOpen: (href: string) => void }) {
  const { locale, en } = useL();
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  const [hover, setHover] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const n = items.length;
  const cur = items[i] ?? items[0];

  // Thanh tiến trình chạy đều; đủ DURATION thì sang mục kế tiếp.
  useEffect(() => {
    if (n < 2 || hover) return;
    const t = setInterval(() => setP((v) => v + TICK / DURATION), TICK);
    return () => clearInterval(t);
  }, [n, hover]);

  useEffect(() => {
    if (p < 1) return;
    setI((k) => (k + 1) % n);
    setP(0);
  }, [p, n]);

  // Chữ của mục nổi bật hiện dần mỗi lần đổi mục.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [i, fade]);

  const pick = (k: number) => {
    setI(k);
    setP(0);
  };

  if (!cur) return null;

  // Rê chuột vào khung thì đứng lại để đọc kịp.
  const hoverProps = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } as object;

  return (
    <View style={styles.board} {...hoverProps}>
      <View style={styles.head}>
        <View style={styles.live}>
          <Pulse>
            <View style={styles.liveDot} />
          </Pulse>
          <Text style={styles.headTitle}>{en ? 'NEWS BOARD' : 'BẢNG TIN'}</Text>
        </View>
        <Text style={styles.headHint} numberOfLines={1}>
          {en ? 'Latest features' : 'Cập nhật tính năng mới'}
        </Text>
        <Text style={styles.counter}>{`${i + 1} / ${n}`}</Text>
      </View>

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.featured,
            { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
          ]}
        >
          <LinearGradient colors={[CREAM, '#FFE7A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <PixelSparkles count={10} colors={SPARKS} seed={21} cell={2} />
          </View>
          <View pointerEvents="none" style={styles.bigIcon}>
            <Icon name={cur.icon} size={160} color={GOLD} strokeWidth={1.4} />
          </View>

          <View style={[styles.tag, { backgroundColor: toneOf(cur.tag) }]}>
            <Text style={styles.tagText}>{bi(cur.tag, locale)}</Text>
          </View>
          <Text style={styles.fTitle}>{bi(cur.title, locale)}</Text>
          <Text style={styles.fBody}>{bi(cur.body, locale)}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(cur.href)}
            style={({ hovered }) => [styles.cta, hovered && styles.ctaHover]}
          >
            <Text style={styles.ctaText}>{en ? 'Open now' : 'Mở ngay'}</Text>
            <Icon name="arrow-right" size={16} color={CREAM} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(p, 1) * 100}%` }]} />
          </View>
        </Animated.View>

        <View style={styles.list}>
          {items.map((it, k) => {
            const on = k === i;
            return (
              <Pressable
                key={`${it.href}-${k}`}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => pick(k)}
                style={({ hovered }) => [styles.row, on && styles.rowOn, !on && hovered && styles.rowHover]}
              >
                <View style={[styles.rowIcon, on && styles.rowIconOn]}>
                  <Icon name={it.icon} size={16} color={on ? '#FFFFFF' : GOLD_DEEP} strokeWidth={2} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTag, { color: toneOf(it.tag) }]}>{bi(it.tag, locale)}</Text>
                  <Text style={[styles.rowTitle, on && styles.rowTitleOn]} numberOfLines={1}>
                    {bi(it.title, locale)}
                  </Text>
                </View>
                {on ? <View style={styles.rowBar} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 12px 32px rgba(138,106,46,0.16)' } as object) : {}),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: INK,
  },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5C7A' },
  headTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2, color: GOLD_LIGHT },
  headHint: { flex: 1, minWidth: 160, fontSize: 13, color: '#E9DCC0' },
  counter: { fontSize: 13, fontWeight: '800', color: GOLD_LIGHT, fontVariant: ['tabular-nums'] },

  body: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 14 },
  featured: {
    flexGrow: 3,
    flexBasis: 360,
    minHeight: 250,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 32,
    gap: 12,
    justifyContent: 'center',
  },
  bigIcon: { position: 'absolute', right: -18, bottom: -16, opacity: 0.2 },
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#FFFFFF' },
  fTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: INK },
  fBody: { fontSize: 15, lineHeight: 22, color: '#5B4A2A', maxWidth: 520 },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: INK,
    ...(Platform.OS === 'web' ? ({ transition: 'transform 180ms ease, box-shadow 180ms ease' } as object) : {}),
  },
  ctaHover: {
    transform: [{ translateY: -2 }],
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 18px rgba(43,33,16,0.25)' } as object) : {}),
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: CREAM },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(138,106,46,0.18)' },
  fill: { height: 4, backgroundColor: GOLD_DEEP },

  list: { flexGrow: 2, flexBasis: 260, gap: 6, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowOn: { backgroundColor: CREAM, borderColor: LINE },
  rowHover: { backgroundColor: '#FFFBF0' },
  rowIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CREAM },
  rowIconOn: { backgroundColor: GOLD },
  rowText: { flex: 1, gap: 2 },
  rowTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: INK_SOFT },
  rowTitleOn: { color: INK },
  rowBar: { position: 'absolute', left: -1, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: GOLD_DEEP },
});
