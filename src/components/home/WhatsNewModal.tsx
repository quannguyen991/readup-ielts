import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';

/*
  Thông báo "có gì mới" phủ lên trang chủ. Hiện một lần cho mỗi phiên bản (WHATS_NEW_VERSION):
  đổi số phiên bản là mọi người thấy lại. Đóng bằng nút X, bấm nền, phím Esc, hoặc bấm nút của
  một slide (khi đó chuyển thẳng tới tính năng).
*/

export const WHATS_NEW_VERSION = '2026-10-18';
const STORAGE_KEY = 'readup:whats-new';

const GOLD = '#B8955A';
const GOLD_DEEP = '#8A6A2E';
const GOLD_LIGHT = '#F2C65E';
const INK = '#2B2110';
const CREAM = '#FFF6DE';
const LINE = '#F2E6CC';

// Chữ tiêu đề và nút: dải vàng ánh kim chạy chậm trên web. Tắt khi máy bật "giảm chuyển động".
const TITLE_GRADIENT = 'linear-gradient(100deg, #7A5418 0%, #C9963A 30%, #F5D27A 50%, #C9963A 70%, #7A5418 100%)';
const CTA_GRADIENT = 'linear-gradient(100deg, #B8955A 0%, #F2C65E 40%, #FFEFB8 50%, #F2C65E 60%, #B8955A 100%)';
const CSS_ID = 'readup-whats-new';
const CSS = `
@keyframes wn-shine{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@media (prefers-reduced-motion:reduce){[data-wn-shine]{animation:none!important}}
`;
/** Đánh dấu phần chạy ánh kim để CSS ở trên tắt được khi người dùng cần yên. */
const SHINE = { dataSet: { wnShine: '1' } } as object;

type Pair = { vi: string; en: string };
type Slide = {
  title: Pair;
  body: Pair;
  bullets: Pair[];
  cta: Pair;
  href: string;
  /** Ảnh chụp giao diện (đường dẫn trong public/) hoặc ba bìa sách xếp chồng. */
  shot?: { uri: string; fit: 'cover' | 'contain' };
  covers?: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    title: { vi: 'Cambridge IELTS 12–20', en: 'Cambridge IELTS 12–20' },
    body: {
      vi: 'Đề thật từ Cambridge, đủ bốn kỹ năng. Mỗi đề có đáp án, giải thích tiếng Việt và chỉ rõ đoạn văn chứa đáp án.',
      en: 'Real Cambridge tests across all four skills. Each test has answers, Vietnamese explanations and the passage line that holds each answer.',
    },
    bullets: [
      { vi: 'Reading: 3 bài, 40 câu, đủ các dạng TFNG, nối tiêu đề, điền chỗ trống', en: 'Reading: 3 passages, 40 questions, every type from TFNG to matching headings' },
      { vi: 'Listening: 4 phần, có transcript đánh dấu chỗ đáp án', en: 'Listening: 4 parts, transcript marks where each answer is' },
      { vi: 'Writing: Task 1 và Task 2, kèm bài mẫu Band 8.5–9', en: 'Writing: Task 1 and Task 2, with Band 8.5–9 sample answers' },
    ],
    cta: { vi: 'Mở bộ đề Cambridge', en: 'Open Cambridge tests' },
    href: '/ielts-source-practice',
    covers: ['/books/covers-2d/cam-19.png', '/books/covers-2d/cam-20.png', '/books/covers-2d/cam-18.png'],
  },
  {
    title: { vi: 'Actual Tests, Vol 1–10', en: 'Actual Tests, Vol 1–10' },
    body: {
      vi: 'Bộ đề Actual Tests xếp theo volume. Chọn đúng volume và kỹ năng cần luyện, làm xong là có đáp án ngay.',
      en: 'Actual Tests sorted by volume. Pick the volume and skill you need, and the answers are there as soon as you finish.',
    },
    bullets: [
      { vi: 'Lọc theo volume, theo Reading, Listening, Writing hoặc Speaking', en: 'Filter by volume, then by Reading, Listening, Writing or Speaking' },
      { vi: 'Tìm nhanh theo tên đề', en: 'Quick search by test name' },
      { vi: 'Có đáp án và giải thích như bộ Cambridge', en: 'Answers and explanations, same as the Cambridge set' },
    ],
    cta: { vi: 'Mở Actual Tests', en: 'Open Actual Tests' },
    href: '/ielts-source-practice',
    covers: ['/books/covers-2d/vol-9.png', '/books/covers-2d/vol-10.png', '/books/covers-2d/vol-8.png'],
  },
  {
    title: { vi: 'Đề SAT: thi thử đầy đủ', en: 'SAT: full mock tests' },
    body: {
      vi: 'Thi thử SAT đầy đủ phần Math và Verbal, chấm bằng code. Đáp án toán tính sẵn, không để AI đoán.',
      en: 'Full SAT Math and Verbal mock tests, scored by code. Math answers are computed in advance, never guessed by AI.',
    },
    bullets: [
      { vi: 'Thi thử đầy đủ, làm liền một mạch như đi thi', en: 'Full mock, taken in one sitting like the real exam' },
      { vi: 'Bộ SAT Math đề thật, có đáp án đã tính sẵn', en: 'Real-format SAT Math sets with precomputed answers' },
      { vi: 'Lộ trình SAT Math theo từng chương', en: 'SAT Math roadmap, chapter by chapter' },
    ],
    cta: { vi: 'Vào thi thử SAT', en: 'Go to SAT mock' },
    href: '/sat/full-test',
    shot: { uri: '/whatsnew/sat.jpg', fit: 'cover' },
  },
  {
    title: { vi: 'Oxford 3000 & 5000', en: 'Oxford 3000 & 5000' },
    body: {
      vi: '18 chủ đề từ vựng, mỗi chủ đề chia theo cấp độ A1–C1. Bấm chủ đề để chọn cấp độ và bắt đầu học.',
      en: '18 vocabulary topics, each split by level A1–C1. Tap a topic to pick a level and start.',
    },
    bullets: [
      { vi: 'Lọc theo Cơ bản, Trung cấp, Nâng cao', en: 'Filter by basic, intermediate or advanced' },
      { vi: 'Theo dõi tiến độ từng chủ đề', en: 'Track progress for each topic' },
      { vi: 'Lưu từ vào sổ, ôn theo lịch FSRS', en: 'Save words to your notebook and review on the FSRS schedule' },
    ],
    cta: { vi: 'Học Oxford', en: 'Study Oxford' },
    href: '/oxford',
    shot: { uri: '/whatsnew/oxford.jpg', fit: 'cover' },
  },
  {
    title: { vi: 'Luyện nói theo tình huống', en: 'Speaking by scenario' },
    body: {
      vi: 'Đóng vai các tình huống thật, có AI hỗ trợ. Có phân tích giọng để biết mình phát âm chỗ nào chưa rõ.',
      en: 'Role-play real situations with AI support, and get a voice analysis showing where your pronunciation slips.',
    },
    bullets: [
      { vi: 'Tình huống nói theo chủ đề', en: 'Speaking scenarios by topic' },
      { vi: 'AI trả lời và góp ý ngay trong lượt nói', en: 'AI replies and gives feedback during the turn' },
      { vi: 'Phân tích giọng nói sau mỗi lượt', en: 'Voice analysis after each turn' },
    ],
    cta: { vi: 'Vào luyện nói', en: 'Go to speaking' },
    href: '/speaking',
    shot: { uri: '/whatsnew/speaking.jpg', fit: 'contain' },
  },
  {
    title: { vi: 'Clip tiếng Anh, giọng Aoede', en: 'English clips, Aoede voice' },
    body: {
      vi: '14 clip có sẵn. Xem, học 2 từ rồi trả lời 1 câu hỏi nhỏ. Phát âm trong app dùng chung giọng Aoede.',
      en: '14 ready-made clips. Watch, learn 2 words, then answer one short question. Pronunciation across the app uses the Aoede voice.',
    },
    bullets: [
      { vi: '14 clip TED và bài nói thật, xếp theo chủ đề', en: '14 TED and real talks, sorted by topic' },
      { vi: 'Học từ và câu hỏi ngay trong lúc xem', en: 'Words and a question right inside the video' },
      { vi: 'Giọng Aoede đọc phát âm và Listening', en: 'Aoede voice for pronunciation and Listening' },
    ],
    cta: { vi: 'Xem clip', en: 'Watch clips' },
    href: '/clip',
    shot: { uri: '/whatsnew/clip.jpg', fit: 'cover' },
  },
];

function ensureCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Chữ vàng ánh kim trên web; máy khác chỉ còn màu vàng đồng. */
const goldText = (Platform.OS === 'web'
  ? {
      backgroundImage: TITLE_GRADIENT,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      animation: 'wn-shine 4s linear infinite',
    }
  : { color: GOLD_DEEP }) as never;

function seenAlready(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION;
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
  } catch {
    // Máy không lưu được thì lần sau hiện lại: chấp nhận được.
  }
}

/** Ba bìa sách xếp chồng nhau, bìa giữa đứng trước. */
function CoverFan({ covers }: { covers: [string, string, string] }) {
  return (
    <LinearGradient colors={[CREAM, '#FFE7A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.frame}>
      <Image source={{ uri: covers[0] }} resizeMode="contain" style={[styles.cover, styles.coverLeft]} accessibilityIgnoresInvertColors />
      <Image source={{ uri: covers[2] }} resizeMode="contain" style={[styles.cover, styles.coverRight]} accessibilityIgnoresInvertColors />
      <Image source={{ uri: covers[1] }} resizeMode="contain" style={[styles.cover, styles.coverFront]} accessibilityIgnoresInvertColors />
    </LinearGradient>
  );
}

export function WhatsNewModal({ onOpen }: { onOpen: (href: string) => void }) {
  const { L, locale } = useL();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const n = SLIDES.length;
  const slide = SLIDES[i] ?? SLIDES[0]!;
  const wide = width >= 720;

  useEffect(ensureCss, []);

  // Hiện sau một nhịp ngắn để trang chủ kịp vẽ xong.
  useEffect(() => {
    if (seenAlready()) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  // Chữ và ảnh của slide hiện dần mỗi lần đổi slide.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [i, fade]);

  const close = () => {
    markSeen();
    setOpen(false);
  };

  const go = () => {
    markSeen();
    setOpen(false);
    onOpen(slide.href);
  };

  const step = (d: number) => setI((k) => (k + d + n) % n);

  // Trên web: Esc đóng, mũi tên trái/phải chuyển slide.
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, n]);

  const shotLabel = L(slide.title.vi, slide.title.en);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={L('Đóng', 'Close')} />
        <View style={styles.card} accessibilityRole="none">
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} style={styles.closeBtn}>
            <Icon name="close" size={18} color={INK} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.head}>
            <View style={styles.pill}>
              <Icon name="sparkle" size={11} color={GOLD_LIGHT} strokeWidth={2.2} />
              <Text style={styles.pillText}>{L('CÓ GÌ MỚI · 18/10', "WHAT'S NEW · 18 OCT")}</Text>
            </View>
            <Text style={styles.count}>{`${i + 1} / ${n}`}</Text>
          </View>

          <View style={[styles.stage, wide ? styles.stageWide : null]}>
            <Animated.View style={[styles.visual, wide ? styles.visualWide : null, { opacity: fade }]}>
              {slide.covers ? (
                <CoverFan covers={slide.covers} />
              ) : slide.shot ? (
                <View style={styles.frame}>
                  <Image
                    source={{ uri: slide.shot.uri }}
                    resizeMode={slide.shot.fit}
                    style={styles.shotImg}
                    accessibilityLabel={shotLabel}
                  />
                </View>
              ) : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.text,
                wide ? styles.textWide : null,
                { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
              ]}
            >
              <Text style={[styles.title, goldText]} {...SHINE}>{L(slide.title.vi, slide.title.en)}</Text>
              <Text style={styles.body}>{L(slide.body.vi, slide.body.en)}</Text>
              <View style={styles.bullets}>
                {slide.bullets.map((b) => (
                  <View key={b.vi} style={styles.bulletRow}>
                    <View style={styles.bulletIcon}>
                      <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <Text style={styles.bulletText}>{L(b.vi, b.en)}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={go}
                accessibilityRole="button"
                style={({ hovered }) => [styles.cta, hovered && styles.ctaHover]}
                {...SHINE}
              >
                <Text style={styles.ctaText}>{L(slide.cta.vi, slide.cta.en)}</Text>
                <Icon name="arrow-right" size={16} color={CREAM} strokeWidth={2.2} />
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => step(-1)}
              accessibilityRole="button"
              accessibilityLabel={L('Tính năng trước', 'Previous feature')}
              style={styles.navBtn}
            >
              <Icon name="chevron-left" size={18} color={INK} strokeWidth={2.2} />
            </Pressable>
            <View style={styles.dots}>
              {SLIDES.map((s, k) => (
                <Pressable
                  key={s.href + k}
                  onPress={() => setI(k)}
                  accessibilityRole="button"
                  accessibilityLabel={`${k + 1}`}
                  style={[styles.dot, k === i && styles.dotOn]}
                />
              ))}
            </View>
            <Pressable
              onPress={() => step(1)}
              accessibilityRole="button"
              accessibilityLabel={L('Tính năng tiếp', 'Next feature')}
              style={styles.navBtn}
            >
              <Icon name="chevron-right" size={18} color={INK} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(26,18,6,0.55)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)' } as object) : {}),
  },
  card: {
    width: '100%',
    maxWidth: 940,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFBF0',
    padding: 22,
    gap: 16,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 88% 0%, rgba(242,198,94,0.38), transparent 46%), linear-gradient(180deg, #FFFBF0 0%, #FFF1CC 100%)',
          boxShadow: '0 30px 80px rgba(20,14,4,0.35), 0 0 0 1px rgba(242,198,94,0.55), 0 0 56px rgba(242,198,94,0.35)',
        } as object)
      : {}),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 44 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: INK, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.6, color: GOLD_LIGHT },
  count: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: GOLD_DEEP, fontVariant: ['tabular-nums'] },

  stage: { gap: 18 },
  stageWide: { flexDirection: 'row', alignItems: 'center' },
  visual: { width: '100%' },
  visualWide: { flex: 1.25, minWidth: 0 },
  frame: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 26px rgba(138,106,46,0.18)' } as object) : {}),
  },
  shotImg: { width: '100%', height: '100%' },
  cover: { position: 'absolute', width: '34%', height: '78%', top: '12%' },
  coverLeft: { left: '12%', transform: [{ rotate: '-9deg' }] },
  coverRight: { right: '12%', transform: [{ rotate: '9deg' }] },
  coverFront: { left: '33%', top: '8%', width: '34%', height: '84%', zIndex: 2, transform: [{ rotate: '-1deg' }] },

  text: { gap: 10 },
  textWide: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Nunito_900Black', fontSize: 31, lineHeight: 38, letterSpacing: -0.2 },
  body: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 15, lineHeight: 23, color: '#5B4A2A' },
  bullets: { gap: 8, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
  },
  bulletText: { flex: 1, fontFamily: 'BeVietnamPro_500Medium', fontSize: 14, lineHeight: 21, color: INK },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: GOLD,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: CTA_GRADIENT,
          backgroundSize: '200% auto',
          animation: 'wn-shine 3.6s linear infinite',
          boxShadow: '0 10px 24px rgba(184,149,90,0.45)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
        } as object)
      : {}),
  },
  ctaHover: {
    transform: [{ translateY: -2 }],
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 18px rgba(43,33,16,0.25)' } as object) : {}),
  },
  ctaText: { fontFamily: 'Nunito_900Black', fontSize: 15, letterSpacing: 0.2, color: INK },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E9DCC0' },
  dotOn: { width: 22, backgroundColor: GOLD },
});
