import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { CUTE_FONT } from '@/components/cute-home/palette';
import { PixelBob, PixelSparkles, useFrameIndex } from '@/components/pixel-theme/pixel-fx';
import { PixelSprite, type PixelSpriteKey } from '@/components/pixel-theme/pixel-ui';
import { useL } from '@/i18n/useL';
import { ARTICLES } from '@/data/articles';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { bilingualStats } from '@/data/bilingual-repository';
import { satRwStats } from '@/data/sat-rw-repository';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { dueEntriesToday } from '@/services/vocab/topic-fsrs';
import { formatStars } from '@/services/gamification/shop';
import { todayKey } from '@/store/persist';
import { useStarBalance } from '@/store/useStarBalance';
import { useStreak, useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { isMuted, playSfx, setMuted } from './arcade-sfx';
import { ArcadeSplash, Blink } from './ArcadeSplash';

/*
  Trang chủ kiểu máy chơi điện tử. Vào bằng màn chào (ArcadeSplash), bấm START để vào máy:
  vỏ máy neon, màn hình CRT có kẻ dòng, menu chọn màn kiểu game, xem trước Chikawa,
  bảng điều khiển có cần gạt và ba nút. Bàn phím: mũi tên, Enter, Esc, M. Có chuột và chạm.
  Âm thanh 8-bit tổng hợp bằng WebAudio (arcade-sfx.ts), có nút tắt tiếng.

  Mọi con số trên màn hình đếm từ dữ liệu thật, không gõ tay.
*/

// Bảng màu: vỏ tím đen với gradient, neon hồng/cyan/vàng, màn hình gần đen để chữ sáng nổi lên.
const ROOM = '#120A24';
const NEON_PINK = '#FF4FA3';
const NEON_CYAN = '#5CF2FF';
const NEON_YELLOW = '#FFE14D';
const SCREEN_BG = '#0E0820';
const INK = '#F5EEFF';
const INK_DIM = '#B9A6D6';
const BTN_A = '#FF4D5E';
const BTN_B = '#4D8BFF';
const BTN_C = '#FFD23F';
const STAR_COLORS = ['#FFFFFF', NEON_CYAN, NEON_YELLOW, NEON_PINK] as const;

type Phase = 'splash' | 'menu';

type Stage = {
  key: string;
  title: string;
  sub: string;
  sprite: PixelSpriteKey;
  href: string;
};

/** Nút tròn trên bảng điều khiển: nhấn xuống khi bấm, có chữ cái và nhãn bên dưới. */
function ArcadeButton({
  letter,
  caption,
  color,
  onPress,
  disabled = false,
}: {
  letter: string;
  caption: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={caption}
      style={({ hovered }) => [styles.btnWrap, disabled && { opacity: 0.4 }, hovered && !disabled && styles.btnHover]}
    >
      {({ pressed }) => (
        <>
          <LinearGradient
            colors={[color, shade(color)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnLetter}>{letter}</Text>
          </LinearGradient>
          <Text style={styles.btnCaption}>{caption}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Làm tối một màu hex để tạo đáy nút, giữ nguyên tông. */
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.55);
  const g = Math.round(((n >> 8) & 255) * 0.55);
  const b = Math.round((n & 255) * 0.55);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** Lớp kẻ dòng quét CRT đè lên màn hình. */
function Scanlines() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" width="100%" height="100%">
      <Defs>
        <Pattern id="arcade-scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="4" height="2" fill="#000000" fillOpacity={0.22} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="2000" height="2000" fill="url(#arcade-scanlines)" />
    </Svg>
  );
}

export function ArcadeHome({ onEnter }: { onEnter: (href: string) => void }) {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const cabW = Math.min(width - 32, 840);
  const today = todayKey();
  const minutes = useStudyStore((s) => s.daily[today]?.minutes ?? 0);
  const vocabEntries = useVocabStore((s) => s.entries);
  const vocabCards = useVocabStore((s) => s.cards);
  const due = useMemo(() => dueEntriesToday({ entries: vocabEntries, cards: vocabCards }, new Date()).length, [vocabEntries, vocabCards, today]);
  const stars = useStarBalance();
  const frame = useFrameIndex(2, 650);
  const streak = useStreak().current;

  const num = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');
  const satTotal = CURRICULUM_TOTALS.questions + satRwStats().questions;
  const sentenceCount = DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length;
  const readableCount = ARTICLES.filter((a) => a.licenseType !== 'headline_only').length;

  const stages: Stage[] = [
    { key: 'today', title: L('Hôm nay', 'Today'), sub: L(`${minutes} phút học hôm nay`, `${minutes} min studied today`), sprite: 'cheer', href: '/dashboard' },
    { key: 'vocab', title: L('Từ vựng', 'Vocabulary'), sub: L(`${VOCAB_TOPICS.length} chủ đề`, `${VOCAB_TOPICS.length} topics`), sprite: 'vocabulary', href: '/vocabulary/topics' },
    { key: 'write', title: 'Writing', sub: L(`${WRITING_PROMPTS.length} đề`, `${WRITING_PROMPTS.length} prompts`), sprite: 'writing', href: '/write' },
    { key: 'sat', title: 'SAT', sub: L(`${num(satTotal)} câu`, `${num(satTotal)} questions`), sprite: 'sat', href: '/sat' },
    { key: 'sentence', title: L('Luyện câu', 'Sentences'), sub: L(`${sentenceCount} câu`, `${sentenceCount} sentences`), sprite: 'listening', href: '/sentence' },
    { key: 'notebook', title: L('Sổ từ vựng', 'Word notebook'), sub: due > 0 ? L(`${due} từ đến hạn`, `${due} due today`) : L('Ôn theo FSRS', 'Review with FSRS'), sprite: 'vocabulary', href: '/vocabulary' },
    { key: 'roadmap', title: L('Lộ trình', 'Roadmap'), sub: L('Miễn phí', 'Free'), sprite: 'roadmap', href: '/math' },
    { key: 'reading', title: L('Đọc báo song ngữ', 'Bilingual news'), sub: L(`${bilingualStats().articles} bài`, `${bilingualStats().articles} articles`), sprite: 'reading', href: '/bilingual' },
    { key: 'diagnostic', title: L('Bài chẩn đoán', 'Diagnostic'), sub: L('19 câu · khoảng 30 phút', '19 questions · about 30 min'), sprite: 'wave', href: '/math/diagnostic' },
    { key: 'invite', title: L('Mời bạn', 'Invite friends'), sub: L('Rủ bạn, mở khoá app', 'Invite friends, unlock the app'), sprite: 'cheer', href: '/invite' },
  ];

  const [phase, setPhase] = useState<Phase>('splash');
  const [sel, setSel] = useState(0);
  const [mutedUi, setMutedUi] = useState(isMuted());
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  // Chữ START! bật lên khi chọn màn, và màn chớp trắng trước khi vào máy.
  const burst = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  const moveTo = (n: number) => {
    const next = Math.max(0, Math.min(stages.length - 1, n));
    if (next === sel) return;
    setSel(next);
    playSfx('move');
  };

  const nudge = (x: number, y: number) => {
    setStick({ x, y });
    setTimeout(() => setStick({ x: 0, y: 0 }), 120);
  };

  const shakeOnce = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 35, useNativeDriver: false }),
      Animated.timing(shake, { toValue: -8, duration: 35, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 5, duration: 35, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 0, duration: 35, useNativeDriver: false }),
    ]).start();
  };

  const start = () => {
    if (phase !== 'splash') return;
    playSfx('start');
    setPhase('menu');
  };

  const back = () => {
    if (phase !== 'menu') return;
    playSfx('back');
    setPhase('splash');
  };

  const choose = (i: number) => {
    if (busy) return;
    const item = stages[i];
    if (!item) return;
    setBusy(true);
    playSfx('select');
    shakeOnce();
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 420, useNativeDriver: false }).start();
    Animated.timing(flash, { toValue: 1, duration: 260, delay: 140, useNativeDriver: false }).start();
    setTimeout(() => onEnter(item.href), 380);
  };

  const toggleMute = () => {
    const next = !mutedUi;
    setMuted(next);
    setMutedUi(next);
    if (!next) playSfx('coin');
  };

  const act = () => (phase === 'splash' ? start() : choose(sel));

  // Bàn phím: M bật/tắt âm ở mọi màn; Enter/Space vào máy hoặc chọn; mũi tên lên xuống; Esc quay lại màn chào.
  // Bỏ qua khi đang gõ chữ trong ô nhập.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key;
      if (k === 'm' || k === 'M') {
        e.preventDefault();
        toggleMute();
        return;
      }
      if (phase === 'splash') {
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          start();
        }
        return;
      }
      if (k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault();
        nudge(0, -1);
        moveTo(sel - 1);
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault();
        nudge(0, 1);
        moveTo(sel + 1);
      } else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        choose(sel);
      } else if (k === 'Escape' || k === 'Backspace' || k === 'b' || k === 'B') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (phase === 'splash') {
    return (
      <ArcadeSplash
        onStart={start}
        stars={formatStars(stars)}
        streak={streak}
        stats={[
          L(`${num(readableCount)} bài đọc`, `${num(readableCount)} readings`),
          L(`${VOCAB_TOPICS.length} chủ đề từ`, `${VOCAB_TOPICS.length} vocab topics`),
          L(`${WRITING_PROMPTS.length} đề Writing`, `${WRITING_PROMPTS.length} Writing prompts`),
        ]}
        frameIndex={frame}
        L={L}
      />
    );
  }

  const current = stages[Math.min(sel, stages.length - 1)] as Stage;

  return (
    <View style={styles.room}>
      <PixelSparkles count={22} colors={STAR_COLORS} seed={31} cell={3} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.roomContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.cabinet, { width: cabW, transform: [{ translateX: shake }] }]}>
          {/* Lớp sáng phía trên vỏ máy: tạo khối và độ bóng */}
          <LinearGradient
            colors={['#7E3AA8', '#3A1450', '#1C0B28']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.gloss} />

          {/* Biển đèn trên đỉnh máy: gradient hồng, chữ phát sáng */}
          <LinearGradient colors={['#FF9ED6', NEON_PINK, '#C4187A']} locations={[0, 0.5, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.marquee}>
            <View style={styles.lights}>
              {[NEON_PINK, NEON_YELLOW, NEON_CYAN, '#FFFFFF', NEON_YELLOW].map((c, i) => (
                <Blink key={i}>
                  <View style={[styles.light, { backgroundColor: c }]} />
                </Blink>
              ))}
            </View>
            <Text style={styles.marqueeText}>BAND 9</Text>
            <Text style={styles.marqueeSub}>{L('ĐẤU TRƯỜNG IELTS · SAT', 'IELTS · SAT ARCADE')}</Text>
          </LinearGradient>

          {/* Màn hình CRT: viền dày, lớp bóng bên trong */}
          <View style={styles.screenFrame}>
            <View style={styles.screen}>
              <PixelSparkles count={14} colors={STAR_COLORS} seed={9} cell={2} />
              <View style={styles.menuWrap}>
                <View style={styles.menuHead}>
                  <Text style={styles.menuHeadText}>{L('CHỌN MÀN', 'STAGE SELECT')}</Text>
                  <Text style={styles.menuHeadText}>1P · {minutes} {L('PHÚT', 'MIN')}</Text>
                </View>
                <View style={styles.menuBody}>
                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {stages.map((s, i) => {
                      const on = i === sel;
                      return (
                        <Pressable
                          key={s.key}
                          onPress={() => {
                            setSel(i);
                            choose(i);
                          }}
                          onHoverIn={() => moveTo(i)}
                          accessibilityRole="button"
                          accessibilityLabel={s.title}
                          style={[styles.row, on && styles.rowOn]}
                        >
                          <Text style={[styles.cursor, !on && styles.cursorHidden]}>▶</Text>
                          <Text style={[styles.rowNum, on && styles.rowTextOn]}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={[styles.rowTitle, on && styles.rowTextOn]} numberOfLines={1}>
                            {s.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Khung xem trước: nhân vật và mô tả của màn đang chọn */}
                  {cabW >= 600 ? (
                    <View style={styles.preview}>
                      <PixelBob amplitude={6} period={1400}>
                        <PixelSprite name={current.sprite} />
                      </PixelBob>
                      <Text style={styles.previewTitle}>{current.title}</Text>
                      <Text style={styles.previewSub}>{current.sub}</Text>
                      <Animated.Text
                        style={[
                          styles.burst,
                          {
                            opacity: burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
                            transform: [{ translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) }],
                          },
                        ]}
                      >
                        START!
                      </Animated.Text>
                      <Blink>
                        <Text style={styles.press}>{L('NHẤN A ĐỂ CHƠI', 'PRESS A TO PLAY')}</Text>
                      </Blink>
                    </View>
                  ) : null}
                </View>
              </View>

              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                locations={[0, 0.2, 0.8, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />
              <Scanlines />
            </View>
          </View>

          {/* Bảng điều khiển: cần gạt, nút A/B/C */}
          <LinearGradient colors={['#2A1238', '#14081D']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.panel}>
            <View style={styles.stick}>
              <Svg width={92} height={92} viewBox="0 0 92 92">
                <Circle cx={46} cy={46} r={40} fill="#140A22" stroke={NEON_CYAN} strokeWidth={3} />
                <Circle cx={46 + stick.x * 14} cy={46 + stick.y * 14} r={18} fill={NEON_PINK} stroke="#FFFFFF" strokeWidth={2} />
              </Svg>
            </View>
            <View style={styles.btnRow}>
              <ArcadeButton letter="A" caption={L('CHỌN', 'SELECT')} color={BTN_A} onPress={act} />
              <ArcadeButton letter="B" caption={L('QUAY LẠI', 'BACK')} color={BTN_B} onPress={back} />
              <ArcadeButton letter="C" caption={mutedUi ? L('BẬT ÂM', 'SOUND ON') : L('TẮT ÂM', 'MUTE')} color={BTN_C} onPress={toggleMute} />
            </View>
          </LinearGradient>
        </Animated.View>

        {width >= 700 ? (
          <Text style={styles.hint}>
            {L('↑ ↓ chọn màn · Enter chơi · Esc quay lại · M bật/tắt âm', '↑ ↓ choose · Enter play · Esc back · M sound')}
          </Text>
        ) : null}
      </ScrollView>
      {/* Màn chớp trắng khi vào máy */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flash }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: ROOM },
  scroll: { flex: 1 },
  roomContent: { alignItems: 'center', paddingVertical: 28, gap: 16 },

  cabinet: {
    borderRadius: 26,
    borderWidth: 4,
    borderColor: NEON_PINK,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 34px rgba(255,79,163,0.5), 0 22px 46px rgba(0,0,0,0.55)' } as object) : {}),
  },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: 36, backgroundColor: 'rgba(255,255,255,0.10)' },

  marquee: {
    height: 92,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: NEON_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 22px rgba(255,225,77,0.55), inset 0 2px 0 rgba(255,255,255,0.5)' } as object) : {}),
  },
  lights: { position: 'absolute', top: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24 },
  light: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#2B1433' },
  marqueeText: {
    fontFamily: CUTE_FONT.black,
    fontSize: 42,
    letterSpacing: 6,
    color: '#FFFFFF',
    textShadowColor: '#2B1433',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  marqueeSub: { fontFamily: CUTE_FONT.heavy, fontSize: 11, letterSpacing: 3, color: '#2B1433', marginTop: 2 },

  screenFrame: {
    padding: 12,
    backgroundColor: '#07030F',
    borderRadius: 18,
    borderWidth: 4,
    borderColor: NEON_CYAN,
    ...(Platform.OS === 'web' ? ({ boxShadow: 'inset 0 0 26px rgba(92,242,255,0.35), 0 0 16px rgba(92,242,255,0.35)' } as object) : {}),
  },
  screen: { height: 520, backgroundColor: SCREEN_BG, borderRadius: 12, overflow: 'hidden', position: 'relative' },

  menuWrap: { flex: 1, padding: 18, gap: 14 },
  menuHead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: NEON_CYAN, paddingBottom: 8 },
  menuHeadText: { fontFamily: CUTE_FONT.black, fontSize: 14, letterSpacing: 2, color: NEON_CYAN },
  menuBody: { flex: 1, flexDirection: 'row', gap: 18 },
  list: { flex: 1, maxHeight: 420 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  rowOn: { backgroundColor: 'rgba(255,79,163,0.2)', borderColor: NEON_YELLOW },
  cursor: { fontFamily: CUTE_FONT.black, fontSize: 14, color: NEON_YELLOW, width: 16 },
  cursorHidden: { opacity: 0 },
  rowNum: { fontFamily: CUTE_FONT.heavy, fontSize: 15, color: INK_DIM, width: 26 },
  rowTitle: { flex: 1, fontFamily: CUTE_FONT.heavy, fontSize: 18, color: INK },
  rowTextOn: { color: NEON_YELLOW },

  preview: {
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: NEON_CYAN,
    backgroundColor: '#140A22',
  },
  previewTitle: { fontFamily: CUTE_FONT.black, fontSize: 22, color: NEON_PINK, textAlign: 'center' },
  previewSub: { fontFamily: CUTE_FONT.semi, fontSize: 14, color: INK, textAlign: 'center' },
  press: { fontFamily: CUTE_FONT.black, fontSize: 16, letterSpacing: 2, color: NEON_YELLOW },
  burst: { position: 'absolute', top: 6, fontFamily: CUTE_FONT.black, fontSize: 28, letterSpacing: 2, color: NEON_YELLOW },

  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: NEON_PINK,
  },
  stick: { alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', gap: 14 },
  btnWrap: { alignItems: 'center', gap: 6 },
  btnHover: { transform: [{ translateY: -2 }] },
  btn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 5px 0 #0E0820' } as object) : {}),
  },
  btnPressed: { transform: [{ translateY: 4 }] },
  btnLetter: { fontFamily: CUTE_FONT.black, fontSize: 24, color: '#FFFFFF' },
  btnCaption: { fontFamily: CUTE_FONT.heavy, fontSize: 11, letterSpacing: 1, color: INK },

  hint: { fontFamily: CUTE_FONT.semi, fontSize: 13, color: INK_DIM },
});
