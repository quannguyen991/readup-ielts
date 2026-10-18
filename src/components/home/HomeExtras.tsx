import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PixelSparkles } from '@/components/pixel-theme/pixel-fx';
import { Icon, type IconName } from '@/components/ui';
import { bi, useL, type Bi } from '@/i18n/useL';

/*
  Hai khối mới trên trang chủ mặc định:
  - Dải "Tính năng nổi bật": bốn thẻ có biểu tượng vàng, nổi lên khi rê chuột, nền có sao lấp lánh.
  - Bảng tin: các mục cập nhật chạy tự động từng trang, dừng khi người dùng vuốt, có chấm chỉ vị trí.
*/

const GOLD = '#B8955A';
const GOLD_DEEP = '#8A6A2E';
const INK = '#2B2110';
const INK_SOFT = '#7A6A4A';
const SPARKLES = ['#F2C65E', '#FFFFFF', '#E9B949'] as const;

export type Feature = { icon: IconName; title: Bi; body: Bi; href: string };
export type News = { tag: Bi; title: Bi; body: Bi; href: string };

/** Nhấp nháy nhẹ cho nhãn "MỚI". */
function Pulse({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.45, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v]);
  return <Animated.View style={{ opacity: v, alignSelf: 'flex-start' }}>{children}</Animated.View>;
}

export function FeatureStrip({ items, onOpen }: { items: Feature[]; onOpen: (href: string) => void }) {
  const { locale } = useL();
  return (
    <View style={styles.strip}>
      <PixelSparkles count={12} colors={SPARKLES} seed={13} cell={2} />
      {items.map((f) => (
        <Pressable
          key={f.href + f.icon}
          onPress={() => onOpen(f.href)}
          accessibilityRole="button"
          accessibilityLabel={bi(f.title, locale)}
          style={({ hovered }) => [styles.feature, hovered && styles.lift]}
        >
          <View style={styles.featureIcon}>
            <Icon name={f.icon} size={20} color={GOLD_DEEP} strokeWidth={2} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{bi(f.title, locale)}</Text>
            <Text style={styles.featureBody}>{bi(f.body, locale)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function NewsBoard({ items, onOpen }: { items: News[]; onOpen: (href: string) => void }) {
  const { locale, en } = useL();
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const idx = useRef(0);
  const paused = useRef(false);

  // Tự lướt sang mục kế tiếp; khi người dùng đang vuốt thì tạm dừng.
  useEffect(() => {
    if (!w || items.length < 2) return;
    const t = setInterval(() => {
      if (paused.current) return;
      const n = (idx.current + 1) % items.length;
      idx.current = n;
      setI(n);
      ref.current?.scrollTo({ x: n * w, animated: true });
    }, 4500);
    return () => clearInterval(t);
  }, [w, items.length]);

  const go = (n: number) => {
    idx.current = n;
    setI(n);
    ref.current?.scrollTo({ x: n * w, animated: true });
  };

  return (
    <View style={styles.board}>
      <View style={styles.boardHead}>
        <Text style={styles.boardTitle}>{en ? 'News board' : 'Bảng tin'}</Text>
        <Text style={styles.boardHint}>{en ? 'Latest features' : 'Cập nhật tính năng mới'}</Text>
      </View>
      <View style={styles.boardClip} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            paused.current = true;
          }}
          onScrollEndDrag={() => {
            paused.current = false;
          }}
          onMomentumScrollEnd={(e) => {
            const n = w ? Math.round(e.nativeEvent.contentOffset.x / w) : 0;
            idx.current = n;
            setI(n);
            paused.current = false;
          }}
        >
          {items.map((n) => (
            <View key={n.href + n.title.vi} style={{ width: w || 320 }}>
              <Pressable onPress={() => onOpen(n.href)} accessibilityRole="button" style={styles.news}>
                <Pulse>
                  <Text style={styles.newsTag}>{bi(n.tag, locale)}</Text>
                </Pulse>
                <Text style={styles.newsTitle}>{bi(n.title, locale)}</Text>
                <Text style={styles.newsBody}>{bi(n.body, locale)}</Text>
                <Text style={styles.newsGo}>{en ? 'Open →' : 'Mở →'}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.dots}>
        {items.map((n, k) => (
          <Pressable
            key={`dot-${n.href}-${k}`}
            onPress={() => go(k)}
            accessibilityRole="button"
            accessibilityLabel={`${k + 1}`}
            style={[styles.dot, k === i && styles.dotOn]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, position: 'relative' },
  feature: {
    flexGrow: 1,
    flexBasis: 220,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2E6CC',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 6px 18px rgba(184,149,90,0.14)', transition: 'transform 180ms ease, box-shadow 180ms ease' } as object) : {}),
  },
  lift: {
    transform: [{ translateY: -4 }],
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 14px 30px rgba(184,149,90,0.28)' } as object) : {}),
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6DE',
  },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: INK },
  featureBody: { fontSize: 13, lineHeight: 19, color: INK_SOFT },

  board: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2E6CC',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(184,149,90,0.14)' } as object) : {}),
  },
  boardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  boardTitle: { fontSize: 18, fontWeight: '800', color: INK },
  boardHint: { fontSize: 13, color: INK_SOFT },
  boardClip: { overflow: 'hidden', borderRadius: 18 },
  news: { padding: 20, gap: 8, borderRadius: 18, backgroundColor: '#FFFBF0', minHeight: 130 },
  newsTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFFFFF',
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  newsTitle: { fontSize: 18, fontWeight: '800', color: INK },
  newsBody: { fontSize: 14, lineHeight: 21, color: INK_SOFT },
  newsGo: { marginTop: 4, fontSize: 13, fontWeight: '700', color: GOLD_DEEP },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E9DCC0' },
  dotOn: { width: 22, backgroundColor: GOLD },
});
