import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';

import { OliveGrid } from '@/components/layout/OliveGrid';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { HoverGlossText, type InlineGloss, type WordPick } from '@/components/reader/HoverGloss';
import { WordPopover } from '@/components/reader/WordPopover';
import { Button, Icon } from '@/components/ui';
import {
  getBilingualArticleById,
  type BilingualArticle,
  type BilingualParagraph,
  type BilingualQuestion,
  type BilingualVocab,
} from '@/data/bilingual-repository';
import { parseInline } from '@/lib/inlineMarkup';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { lemmatize } from '@/services/dictionary/lookup';
import { useArticleDictionary } from '@/services/dictionary/rich-dictionary';
import { useVocabStore } from '@/store/useVocabStore';
import { HoverPressable } from '@/components/ui/HoverPressable';

/**
 * Màn đọc báo song ngữ.
 *
 * BỐ CỤC TỜ BÁO, KHÔNG PHẢI PHÒNG THI. Hai tấm giấy kem đặt thẳng trên nền lưới
 * xanh rêu, không viền, không khung công cụ đóng hộp — các nút chỉnh chữ là
 * những viên nhỏ nằm trên nền, lùi hẳn ra sau. Thứ duy nhất nổi lên là chữ.
 * (Bố cục kiểu phòng thi — thanh số câu, nút Kiểm tra — thuộc về màn luyện
 * Reading, nơi người học đang làm đề chứ không đang đọc báo.)
 *
 * HAI TẤM RIÊNG, MỖI TẤM CUỘN RIÊNG: tiếng Anh bên trái, bên phải là bản dịch
 * (hoặc câu hỏi / từ vựng khi chọn). Rê vào một đoạn thì đoạn tương ứng bên
 * kia sáng lên, bấm vào khoảng trống của đoạn thì tấm kia cuộn tới — hai tấm
 * không lạc nhau dù bản dịch dài hơn bản gốc.
 *
 * MÀN HẸP chỉ đủ một tấm, nên các viên chọn tấm có thêm "English".
 */

type Theme = { bg: string; ink: string; body: string; muted: string; rule: string; tint: string; accent: string };

const LIGHT: Theme = {
  bg: '#FBF8EF',
  ink: '#1B2310',
  body: '#2E3524',
  muted: '#8A8E78',
  rule: '#ECE7D6',
  tint: '#F1ECDA',
  accent: '#3F4C9C',
};
const DARK: Theme = {
  bg: '#20251A',
  ink: '#F1EEDF',
  body: '#D8D5C4',
  muted: '#8F937F',
  rule: '#30372A',
  tint: '#2A3122',
  accent: '#B9CB83',
};

const FONTS = [
  { key: 'fraunces', label: 'Fraunces', family: readingFont.fraunces },
  { key: 'lora', label: 'Lora', family: readingFont.body },
  { key: 'playfair', label: 'Playfair', family: readingFont.display },
  { key: 'sans', label: 'Jakarta', family: readingFont.sans },
] as const;
type FontKey = (typeof FONTS)[number]['key'];

const MIN_SIZE = 14;
const MAX_SIZE = 24;
const MAX_WIDTH = 1280;

type View2 = 'vi' | 'questions' | 'vocab';
type NarrowView = 'en' | View2;

export default function BilingualReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = typeof id === 'string' ? getBilingualArticleById(id) : undefined;
  useReadingFonts();

  if (!article) {
    return (
      <Backdrop>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="max-w-[460px] rounded-card p-6" style={{ backgroundColor: LIGHT.bg }}>
            <Text className="font-heavy text-sectionTitle text-ink">Không tìm thấy bài này</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              Bài bạn vừa mở không có trong kho. Quay lại danh sách để chọn bài khác.
            </Text>
            <Button
              className="mt-4"
              variant="brand"
              label="Về kho đọc báo song ngữ"
              onPress={() => router.replace('/bilingual' as never)}
            />
          </View>
        </SafeAreaView>
      </Backdrop>
    );
  }

  return <Reader article={article} />;
}

function Backdrop({ children }: { children: React.ReactNode }) {
  // Chàm đậm: cùng họ màu với thẻ tra từ, để giấy kem nổi lên mà không chói.
  return <OliveGrid color="#2B3668">{children}</OliveGrid>;
}

function Reader({ article }: { article: BilingualArticle }) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 1024;

  const [fontKey, setFontKey] = useState<FontKey>('fraunces');
  const [fontSize, setFontSize] = useState(17);
  const [dark, setDark] = useState(false);
  const [right, setRight] = useState<View2>('vi');
  const [narrow, setNarrow] = useState<NarrowView>('en');
  const [hoverPara, setHoverPara] = useState<number | null>(null);
  const [pick, setPick] = useState<(WordPick & { paragraph: number | null }) | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [toolbarH, setToolbarH] = useState(64);

  const theme = dark ? DARK : LIGHT;
  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family ?? readingFont.fraunces;
  const dict = useArticleDictionary(article.id);

  const entries = useVocabStore((s) => s.entries);
  const savedCount = useMemo(
    () => Object.values(entries).filter((e) => e.articleId === article.id).length,
    [entries, article.id],
  );

  const enScroll = useRef<ScrollView>(null);
  const viScroll = useRef<ScrollView>(null);
  const enY = useRef<Record<number, number>>({});
  const viY = useRef<Record<number, number>>({});

  const jumpTo = useCallback((side: 'en' | 'vi', index: number) => {
    const y = side === 'en' ? enY.current[index] : viY.current[index];
    const ref = side === 'en' ? enScroll : viScroll;
    if (y !== undefined) ref.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  }, []);

  const onWord = useCallback(
    (paragraph: number | null) => (p: WordPick) => setPick({ ...p, paragraph }),
    [],
  );

  const paneHeight = Math.max(380, height - toolbarH - (wide ? 40 : 28));

  const enPane = (
    <EnglishPane
      article={article}
      theme={theme}
      fontFamily={fontFamily}
      fontSize={fontSize}
      scrollRef={enScroll}
      onMeasure={(i, y) => {
        enY.current[i] = y;
      }}
      hoverPara={hoverPara}
      onHoverPara={setHoverPara}
      onJump={(i) => {
        if (wide && right === 'vi') jumpTo('vi', i);
      }}
      onWord={onWord}
    />
  );

  const viPane = (
    <VietnamesePane
      article={article}
      theme={theme}
      // Playfair không hợp chữ thân dài; bản Việt dùng Fraunces khi người đọc chọn Playfair.
      fontFamily={fontKey === 'playfair' ? readingFont.fraunces : fontFamily}
      fontSize={fontSize}
      scrollRef={viScroll}
      onMeasure={(i, y) => {
        viY.current[i] = y;
      }}
      hoverPara={hoverPara}
      onHoverPara={setHoverPara}
      onJump={(i) => jumpTo('en', i)}
    />
  );

  const questionsPane = (
    <QuestionsPane
      questions={article.questions}
      theme={theme}
      answers={answers}
      checked={checked}
      onAnswer={(q, o) => {
        if (!checked) setAnswers((prev) => ({ ...prev, [q]: o }));
      }}
      onCheck={() => {
        if (checked) {
          setChecked(false);
          setAnswers({});
        } else {
          setChecked(true);
        }
      }}
    />
  );

  const vocabPane = <VocabPane vocab={article.vocab} theme={theme} article={article} />;

  const current = wide ? right : narrow;
  const rightPane = right === 'vi' ? viPane : right === 'questions' ? questionsPane : vocabPane;
  const narrowPane = narrow === 'en' ? enPane : narrow === 'vi' ? viPane : narrow === 'questions' ? questionsPane : vocabPane;

  return (
    <Backdrop>
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="w-full flex-1 self-center px-4 pt-3 lg:px-8" style={{ maxWidth: MAX_WIDTH + 64 }}>
          <View onLayout={(e) => setToolbarH(e.nativeEvent.layout.height)}>
            <Toolbar
              wide={wide}
              view={current}
              onView={(v) => (wide ? setRight(v as View2) : setNarrow(v as NarrowView))}
              questionCount={article.questions.length}
              answered={Object.keys(answers).length}
              fontKey={fontKey}
              onFont={setFontKey}
              fontSize={fontSize}
              onSize={(d) => setFontSize((s) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, s + d)))}
              dark={dark}
              onDark={() => setDark((d) => !d)}
              savedCount={savedCount}
            />
          </View>

          {wide ? (
            <View className="mt-4 flex-row gap-8" style={{ height: paneHeight }}>
              <View style={{ flex: 1, flexBasis: 0 }}>{enPane}</View>
              <View style={{ flex: 1, flexBasis: 0 }}>
                <CrossFade swapKey={`right-${right}`} style={{ flex: 1 }}>
                  {rightPane}
                </CrossFade>
              </View>
            </View>
          ) : (
            <View className="mt-3" style={{ height: paneHeight }}>
              <CrossFade swapKey={`narrow-${narrow}`} style={{ flex: 1 }}>
                {narrowPane}
              </CrossFade>
            </View>
          )}
        </View>
      </SafeAreaView>

      <WordPopover
        pick={pick}
        table={dict}
        articleId={article.id}
        articleTitle={article.titleEn}
        paragraphIndex={pick?.paragraph ?? null}
        onClose={() => setPick(null)}
      />
    </Backdrop>
  );
}

/* ====================================================================== */
/*                                 THANH TRÊN                              */
/* ====================================================================== */

const CREAM = '#F4F1E4';
const PILL_BG = 'rgba(30,40,14,0.38)';
const PILL_BORDER = 'rgba(255,255,255,0.14)';

function Toolbar(props: {
  wide: boolean;
  view: string;
  onView: (v: string) => void;
  questionCount: number;
  answered: number;
  fontKey: FontKey;
  onFont: (k: FontKey) => void;
  fontSize: number;
  onSize: (delta: number) => void;
  dark: boolean;
  onDark: () => void;
  savedCount: number;
}) {
  const { wide } = props;
  // Đủ chỗ cho nhãn chữ đầy đủ trên một hàng; hẹp hơn thì các viên chỉ còn biểu tượng.
  const roomy = useWindowDimensions().width >= 1500;
  const [fontOpen, setFontOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const views = [
    ...(wide ? [] : [{ key: 'en', label: 'English' }]),
    { key: 'vi', label: wide ? 'Bản dịch' : 'Tiếng Việt' },
    { key: 'questions', label: `Câu hỏi ${props.answered}/${props.questionCount}` },
    { key: 'vocab', label: 'Từ vựng' },
  ];

  const toggleFullscreen = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFullscreen(false);
    } else {
      void document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    }
  };

  return (
    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2.5 py-1.5" style={{ zIndex: 30 }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Về kho đọc báo song ngữ"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/bilingual' as never))}
        className="h-9 w-9 items-center justify-center"
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <Icon name="arrow-right" size={22} color={CREAM} strokeWidth={2} />
        </View>
      </Pressable>

      <View className="flex-row items-baseline gap-2.5">
        <Text style={{ fontFamily: readingFont.display, fontStyle: 'italic', fontWeight: '700', fontSize: 30, color: CREAM }}>
          đọc song ngữ
        </Text>
        {roomy ? (
          <Text style={{ fontFamily: readingFont.mono, fontSize: 11, letterSpacing: 2, color: 'rgba(244,241,228,0.8)' }}>
            •  THE READUP PRESS
          </Text>
        ) : null}
      </View>

      <View className="flex-1" />

      {/* chọn tấm bên phải (màn hẹp: chọn tấm duy nhất) */}
      <View className="flex-row items-center rounded-pill p-1" style={{ backgroundColor: PILL_BG, borderWidth: 1, borderColor: PILL_BORDER }}>
        {views.map((v) => {
          const on = props.view === v.key;
          return (
            <Pressable
              key={v.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => props.onView(v.key)}
              className="rounded-pill px-3 py-1.5"
              style={[{ backgroundColor: on ? CREAM : 'transparent' }, webTransition]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#26301A' : CREAM }}>{v.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* mặt chữ */}
      <View style={{ position: 'relative' }}>
        <Pill onPress={() => setFontOpen((o) => !o)} label="Đổi mặt chữ" minWidth={roomy ? 150 : undefined}>
          <PillCaption>FONT</PillCaption>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: CREAM, fontFamily: FONTS.find((f) => f.key === props.fontKey)?.family }}>
            {FONTS.find((f) => f.key === props.fontKey)?.label}
          </Text>
          <View className="flex-1" />
          <Icon name="chevron-down" size={14} color={CREAM} strokeWidth={2.2} />
        </Pill>
        {fontOpen ? (
          <Appear duration={160}>
            <View
              className="absolute right-0 top-11 overflow-hidden rounded-panel py-1"
              style={{ minWidth: 180, backgroundColor: '#26301A', borderWidth: 1, borderColor: PILL_BORDER, zIndex: 40 }}
            >
              {FONTS.map((f) => (
                <HoverPressable
                  key={f.key}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    props.onFont(f.key);
                    setFontOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-2.5"
                  style={({ hovered }) => [{ backgroundColor: hovered ? 'rgba(255,255,255,0.08)' : 'transparent' }, webTransition]}
                >
                  <Text style={{ fontFamily: f.family, fontSize: 15, color: CREAM }}>{f.label}</Text>
                  {props.fontKey === f.key ? <Icon name="check" size={14} color="#C9DA92" strokeWidth={2.4} /> : null}
                </HoverPressable>
              ))}
            </View>
          </Appear>
        ) : null}
      </View>

      {/* cỡ chữ */}
      <Pill label="Cỡ chữ">
        <PillCaption>CỠ CHỮ</PillCaption>
        <RoundButton label="−" a11y="Giảm cỡ chữ" onPress={() => props.onSize(-1)} />
        <Text style={{ fontSize: 13, fontWeight: '800', color: CREAM, minWidth: 20, textAlign: 'center' }}>{props.fontSize}</Text>
        <RoundButton label="+" a11y="Tăng cỡ chữ" onPress={() => props.onSize(1)} />
      </Pill>

      <Pill label="Số từ đã lưu">
        <Icon name="bookmark" size={13} color={CREAM} strokeWidth={2} />
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: CREAM }}>{props.savedCount} từ</Text>
      </Pill>

      <Pill onPress={props.onDark} label={props.dark ? 'Chuyển nền sáng' : 'Chuyển nền tối'}>
        <Text style={{ fontSize: 13, color: '#F2C94C' }}>{props.dark ? '☀' : '☾'}</Text>
        <Text style={{ fontSize: 12.5, fontWeight: '700', color: CREAM }}>{props.dark ? 'Sáng' : 'Tối'}</Text>
      </Pill>

      {Platform.OS === 'web' ? (
        <Pill onPress={toggleFullscreen} label="Toàn màn hình">
          <Text style={{ fontSize: 13, color: CREAM }}>{fullscreen ? '⤡' : '⛶'}</Text>

        </Pill>
      ) : null}
    </View>
  );
}

function Pill({
  children,
  onPress,
  label,
  minWidth,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
  minWidth?: number;
}) {
  const inner = (
    <View
      className="h-9 flex-row items-center gap-2 rounded-pill px-3.5"
      style={{ backgroundColor: PILL_BG, borderWidth: 1, borderColor: PILL_BORDER, minWidth }}
    >
      {children}
    </View>
  );
  if (!onPress) return <View accessibilityLabel={label}>{inner}</View>;
  return (
    <HoverPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }) => [{ opacity: hovered ? 0.88 : 1 }, webTransition]}
    >
      {inner}
    </HoverPressable>
  );
}

function PillCaption({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(244,241,228,0.62)' }}>{children}</Text>
  );
}

function RoundButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      className="h-6 w-6 items-center justify-center rounded-pill"
      style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: CREAM, lineHeight: 15 }}>{label}</Text>
    </Pressable>
  );
}

/* ====================================================================== */
/*                                   TẤM GIẤY                              */
/* ====================================================================== */

function Sheet({
  theme,
  scrollRef,
  badge,
  children,
}: {
  theme: Theme;
  scrollRef?: React.RefObject<ScrollView | null>;
  badge?: 'EN' | 'VI';
  children: React.ReactNode;
}) {
  const pad = useWindowDimensions().width >= 768 ? 40 : 22;
  return (
    <View
      className="flex-1 overflow-hidden"
      style={[
        {
          backgroundColor: theme.bg,
          borderRadius: 24,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 24px 60px rgba(20,30,8,0.28), 0 2px 6px rgba(20,30,8,0.12)' } as object)
            : { elevation: 8 }),
        },
        webTransition,
      ]}
    >
      {badge ? (
        <View
          pointerEvents="none"
          className="absolute right-7 top-6 z-10 rounded-pill px-2.5 py-0.5"
          style={{ backgroundColor: badge === 'EN' ? 'rgba(79,70,229,0.12)' : 'rgba(220,38,38,0.10)' }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: badge === 'EN' ? '#4F46E5' : '#DC2626' }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: pad, paddingTop: pad, paddingBottom: 72 }}>
        {children}
      </ScrollView>
    </View>
  );
}

function Kicker({ theme, label, hint }: { theme: Theme; label: string; hint?: string }) {
  return (
    <Text>
      <Text style={{ fontFamily: readingFont.sans, fontWeight: '700', fontSize: 11.5, letterSpacing: 1.8, color: theme.accent }}>
        {label}
      </Text>
      {hint ? (
        <Text style={{ fontFamily: readingFont.sans, fontSize: 12, color: theme.muted }}>{`  ·  ${hint}`}</Text>
      ) : null}
    </Text>
  );
}

function EnglishPane({
  article,
  theme,
  fontFamily,
  fontSize,
  scrollRef,
  onMeasure,
  hoverPara,
  onHoverPara,
  onJump,
  onWord,
}: {
  article: BilingualArticle;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  onMeasure: (i: number, y: number) => void;
  hoverPara: number | null;
  onHoverPara: (i: number | null) => void;
  onJump: (i: number) => void;
  onWord: (paragraph: number | null) => (p: WordPick) => void;
}) {
  const source = article.source;
  const titleFont = fontFamily === readingFont.sans ? readingFont.fraunces : fontFamily;
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="EN">
      <Kicker theme={theme} label="ENGLISH" hint="rê chuột vào từ để xem nghĩa, bấm vào từ để xem chi tiết" />

      <Text
        style={{
          marginTop: 16,
          fontFamily: titleFont,
          fontWeight: '800',
          fontSize: fontSize + 15,
          lineHeight: (fontSize + 15) * 1.2,
          color: theme.ink,
          paddingRight: 36,
        }}
      >
        {article.titleEn}
      </Text>

      {source ? (
        <HoverPressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(source.url)}
          className="mt-3 flex-row items-center gap-1.5 self-start rounded-pill px-3 py-1"
          style={({ hovered }) => [
            { borderWidth: 1.2, borderColor: '#9DB0F3', backgroundColor: hovered ? 'rgba(157,176,243,0.22)' : 'rgba(157,176,243,0.10)' },
            webTransition,
          ]}
        >
          <Text style={{ fontFamily: readingFont.fraunces, fontWeight: '700', fontSize: 10.5, letterSpacing: 0.8, color: '#3F55B8' }}>
            LINK BÀI VIẾT GỐC | {source.outlet.toUpperCase()}
          </Text>
          <Icon name="external" size={10} color="#3F55B8" strokeWidth={2.2} />
        </HoverPressable>
      ) : null}

      <Text
        style={{
          marginTop: 26,
          fontFamily: titleFont,
          fontWeight: '700',
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.65,
          color: theme.ink,
        }}
      >
        {article.standfirstEn}
      </Text>

      <Text style={{ marginTop: 10, fontFamily: readingFont.sans, fontSize: 11.5, letterSpacing: 0.4, color: theme.muted }}>
        {article.level} · {article.topic} · {article.wordCount} từ · {article.estMinutes} phút
        {source?.author ? ` · ${source.author}` : ''}
      </Text>

      {article.paragraphs.map((p, i) => (
        <ParagraphBlock
          key={i}
          index={i}
          theme={theme}
          hovered={hoverPara === i}
          onHover={onHoverPara}
          onJump={onJump}
          onMeasure={onMeasure}
        >
          <EnglishParagraph paragraph={p} theme={theme} fontFamily={fontFamily} fontSize={fontSize} onWord={onWord(i)} />
        </ParagraphBlock>
      ))}

      {source ? <SourceNote theme={theme} article={article} /> : null}
    </Sheet>
  );
}

function EnglishParagraph({
  paragraph,
  theme,
  fontFamily,
  fontSize,
  onWord,
}: {
  paragraph: BilingualParagraph;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  onWord: (p: WordPick) => void;
}) {
  // Nghĩa soạn riêng cho đoạn — sát ngữ cảnh nhất, được ưu tiên khi rê chuột.
  const bundled = useMemo(() => {
    const map: Record<string, InlineGloss> = {};
    for (const g of paragraph.gloss ?? []) {
      map[g.word.toLowerCase().replace(/[^a-z0-9'-]/g, '')] = { word: g.word, meaningVi: g.meaningVi, pos: g.pos };
    }
    return map;
  }, [paragraph.gloss]);

  return (
    <HoverGlossText
      text={paragraph.en}
      bundled={bundled}
      fontFamily={fontFamily}
      fontSize={fontSize}
      lineHeight={fontSize * 1.72}
      color={theme.body}
      onWordPress={onWord}
    />
  );
}

function VietnamesePane({
  article,
  theme,
  fontFamily,
  fontSize,
  scrollRef,
  onMeasure,
  hoverPara,
  onHoverPara,
  onJump,
}: {
  article: BilingualArticle;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  onMeasure: (i: number, y: number) => void;
  hoverPara: number | null;
  onHoverPara: (i: number | null) => void;
  onJump: (i: number) => void;
}) {
  const titleFont = fontFamily === readingFont.sans ? readingFont.fraunces : fontFamily;
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="VI">
      <Kicker theme={theme} label="TIẾNG VIỆT" />

      <Text
        style={{
          marginTop: 16,
          fontFamily: titleFont,
          fontStyle: 'italic',
          fontWeight: '700',
          fontSize: fontSize + 15,
          lineHeight: (fontSize + 15) * 1.24,
          color: theme.ink,
          paddingRight: 36,
        }}
      >
        {article.titleVi}
      </Text>

      <Text
        style={{
          marginTop: 26,
          fontFamily: titleFont,
          fontWeight: '700',
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.65,
          color: theme.ink,
        }}
      >
        {article.standfirstVi}
      </Text>

      {article.paragraphs.map((p, i) => (
        <ParagraphBlock
          key={i}
          index={i}
          theme={theme}
          hovered={hoverPara === i}
          onHover={onHoverPara}
          onJump={onJump}
          onMeasure={onMeasure}
        >
          <Rich text={p.vi} style={{ fontFamily, fontSize, lineHeight: fontSize * 1.72, color: theme.body }} />
        </ParagraphBlock>
      ))}
    </Sheet>
  );
}

/**
 * Một đoạn. Không in số đoạn — tờ báo không đánh số — nhưng vẫn giữ hai việc
 * đối chiếu: rê vào thì đoạn tương ứng bên kia sáng lên, bấm vào lề trái của
 * đoạn thì tấm kia cuộn tới.
 */
function ParagraphBlock({
  index,
  theme,
  hovered,
  onHover,
  onJump,
  onMeasure,
  children,
}: {
  index: number;
  theme: Theme;
  hovered: boolean;
  onHover: (i: number | null) => void;
  onJump: (i: number) => void;
  onMeasure: (i: number, y: number) => void;
  children: React.ReactNode;
}) {
  return (
    <View
      onLayout={(e) => onMeasure(index, e.nativeEvent.layout.y)}
      // @ts-expect-error — onMouseEnter/Leave chỉ có trên react-native-web.
      onMouseEnter={Platform.OS === 'web' ? () => onHover(index) : undefined}
      onMouseLeave={Platform.OS === 'web' ? () => onHover(null) : undefined}
      style={[
        {
          marginTop: 18,
          marginHorizontal: -14,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: hovered ? theme.tint : 'transparent',
        },
        webTransition,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Đối chiếu đoạn ${index + 1}`}
        onPress={() => onJump(index)}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12 }}
      >
        <View style={[{ flex: 1, marginVertical: 8, borderRadius: 2, width: 3, backgroundColor: hovered ? theme.accent : 'transparent' }, webTransition]} />
      </Pressable>
      {children}
    </View>
  );
}

function Rich({ text, style }: { text: string; style: object }) {
  const runs = useMemo(() => parseInline(text), [text]);
  return (
    <Text style={style}>
      {runs.map((r, i) => (
        <Text key={i} style={{ fontStyle: r.italic ? 'italic' : 'normal', fontWeight: r.bold ? '700' : undefined }}>
          {r.text}
        </Text>
      ))}
    </Text>
  );
}

function SourceNote({ theme, article }: { theme: Theme; article: BilingualArticle }) {
  const s = article.source!;
  return (
    <View className="mt-10 border-t pt-4" style={{ borderColor: theme.rule }}>
      <Text style={{ fontFamily: readingFont.fraunces, fontStyle: 'italic', fontSize: 13, lineHeight: 20, color: theme.muted }}>
        Nguồn: {s.outlet}
        {s.author ? `, ${s.author}` : ''} — đăng ngày {s.publishedAt}. Giấy phép: {s.license}. Bản tiếng Việt, chú giải và câu hỏi do
        ReadUp biên soạn.
      </Text>
    </View>
  );
}

/* ====================================================================== */
/*                                   CÂU HỎI                               */
/* ====================================================================== */

function QuestionsPane({
  questions,
  theme,
  answers,
  checked,
  onAnswer,
  onCheck,
}: {
  questions: BilingualQuestion[];
  theme: Theme;
  answers: Record<number, number>;
  checked: boolean;
  onAnswer: (q: number, o: number) => void;
  onCheck: () => void;
}) {
  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  return (
    <Sheet theme={theme}>
      <Kicker theme={theme} label="HIỂU BÀI" hint={`${questions.length} câu`} />
      <Text style={{ marginTop: 14, fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '700', fontSize: 30, color: theme.ink }}>
        Bạn đã hiểu bài chưa?
      </Text>

      <View className="mt-6 gap-7">
        {questions.map((q, qi) => (
          <View key={qi}>
            <Text style={{ fontFamily: readingFont.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.accent }}>
              CÂU {qi + 1} · {q.type.toUpperCase()}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: readingFont.fraunces, fontSize: 17.5, lineHeight: 26, fontWeight: '600', color: theme.ink }}>
              {q.q}
            </Text>
            <View className="mt-2.5 gap-1.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                const right = checked && oi === q.answerIndex;
                const wrong = checked && chosen && oi !== q.answerIndex;
                return (
                  <HoverPressable
                    key={oi}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: chosen }}
                    onPress={() => onAnswer(qi, oi)}
                    className="flex-row items-start gap-3 rounded-panel px-3.5 py-2.5"
                    style={({ hovered }) => [
                      {
                        borderWidth: 1,
                        borderColor: right ? '#16A34A' : wrong ? '#DC2626' : chosen ? theme.accent : theme.rule,
                        backgroundColor: right
                          ? 'rgba(22,163,74,0.10)'
                          : wrong
                            ? 'rgba(220,38,38,0.08)'
                            : chosen || hovered
                              ? theme.tint
                              : 'transparent',
                      },
                      webTransition,
                    ]}
                  >
                    <Text style={{ fontFamily: readingFont.fraunces, fontWeight: '700', fontSize: 15, color: theme.muted }}>
                      {'ABCD'[oi]}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: readingFont.fraunces, fontSize: 15.5, lineHeight: 23, color: theme.body }}>
                      {opt}
                    </Text>
                  </HoverPressable>
                );
              })}
            </View>
            {checked ? (
              <Appear>
                <Text style={{ marginTop: 8, fontFamily: readingFont.sans, fontSize: 13.5, lineHeight: 21, color: theme.body }}>
                  <Text style={{ fontWeight: '700' }}>
                    {answers[qi] === q.answerIndex ? 'Đúng. ' : answers[qi] === undefined ? 'Chưa chọn. ' : 'Chưa đúng. '}
                  </Text>
                  <Text style={{ fontStyle: 'italic' }}>{q.whyVi}</Text>
                </Text>
              </Appear>
            ) : null}
          </View>
        ))}
      </View>

      <HoverPressable
        accessibilityRole="button"
        onPress={onCheck}
        className="mt-8 items-center self-start rounded-pill px-6 py-3"
        style={({ hovered }) => [{ backgroundColor: checked ? theme.tint : hovered ? '#323E82' : theme.accent }, webTransition]}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: checked ? theme.ink : '#FFFFFF' }}>
          {checked ? `Đúng ${score}/${questions.length} · Làm lại` : 'Xem kết quả'}
        </Text>
      </HoverPressable>
    </Sheet>
  );
}

/* ====================================================================== */
/*                                   TỪ VỰNG                               */
/* ====================================================================== */

function VocabPane({ vocab, theme, article }: { vocab: BilingualVocab[]; theme: Theme; article: BilingualArticle }) {
  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);

  return (
    <Sheet theme={theme}>
      <Kicker theme={theme} label="TỪ VỰNG" hint={`${vocab.length} từ đáng giữ lại`} />
      <Text style={{ marginTop: 14, fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '700', fontSize: 30, color: theme.ink }}>
        Từ của bài này
      </Text>

      <View className="mt-5">
        {vocab.map((v, i) => {
          const lemma = lemmatize(v.word);
          const saved = Object.values(entries).some((e) => e.lemma === lemma && e.articleId === article.id);
          return (
            <View key={i} className="border-b py-4" style={{ borderColor: theme.rule }}>
              <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Text style={{ fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '700', fontSize: 21, color: theme.ink }}>
                  {v.word}
                </Text>
                <Text style={{ fontFamily: readingFont.mono, fontSize: 12, color: theme.muted }}>{v.ipa}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>{v.pos}</Text>
                <View className="flex-1" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nghe từ ${v.word}`}
                  onPress={() => {
                    Speech.stop();
                    Speech.speak(v.word, { language: 'en-GB', rate: 0.9, voice: englishVoice() });
                  }}
                  className="px-1"
                >
                  <Icon name="volume" size={15} color={theme.muted} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={saved}
                  onPress={() =>
                    saveWord({
                      word: v.word,
                      lemma,
                      phonetic: v.ipa,
                      partOfSpeech: v.pos,
                      definitionContext: null,
                      definitionGeneral: null,
                      definitionVi: v.meaningVi,
                      exampleSentence: v.example ?? null,
                      sourceSentence: v.example ?? v.word,
                      articleId: article.id,
                      articleTitle: article.titleEn,
                      paragraphIndex: null,
                      isCollocation: v.word.includes(' '),
                    })
                  }
                  className="rounded-pill px-3 py-1"
                  style={{ backgroundColor: saved ? theme.tint : theme.accent }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: saved ? theme.muted : '#FFFFFF' }}>
                    {saved ? '✓ Đã lưu' : '+ Lưu'}
                  </Text>
                </Pressable>
              </View>
              <Text style={{ marginTop: 4, fontFamily: readingFont.sans, fontSize: 15, fontWeight: '600', color: theme.body }}>
                {v.meaningVi}
              </Text>
              {v.collocation ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: theme.muted }}>
                  Đi với: <Text style={{ fontStyle: 'italic', fontFamily: readingFont.fraunces }}>{v.collocation}</Text>
                </Text>
              ) : null}
              {v.example ? (
                <Text style={{ marginTop: 4, fontFamily: readingFont.fraunces, fontStyle: 'italic', fontSize: 14.5, lineHeight: 22, color: theme.body }}>
                  “{v.example}”
                </Text>
              ) : null}
              {v.derivatives && v.derivatives !== '—' ? (
                <Rich text={`Họ từ: ${v.derivatives}`} style={{ marginTop: 4, fontSize: 13, color: theme.muted }} />
              ) : null}
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

/*
  react-native-web chuyển thẳng các khoá này xuống CSS; kiểu của RN không khai
  báo chúng nên phải ép kiểu. Trên native chúng bị bỏ qua.
*/
const webTransition = (
  Platform.OS === 'web'
    ? {
        transitionProperty: 'background-color, color, border-color, opacity',
        transitionDuration: '220ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    : {}
) as object;
