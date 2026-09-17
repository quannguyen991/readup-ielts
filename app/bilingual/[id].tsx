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

import { GridBackdrop } from '@/components/layout/GridBackdrop';
import { CrossFade } from '@/components/motion/Motion';
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

/**
 * Màn đọc song ngữ — bố cục phòng thi Reading.
 *
 * HAI TẤM GIẤY RIÊNG, MỖI TẤM CUỘN RIÊNG. Bản trước ghép hai thứ tiếng vào một
 * tấm, từng cặp đoạn một. Đọc như vậy thì mắt không bao giờ ở yên trong một thứ
 * tiếng: cứ hết một đoạn là bản dịch nằm ngay cạnh, liếc sang là thành thói quen.
 * Tách hai tấm như đề Reading thật — bài bên trái, bản dịch (hoặc câu hỏi) bên
 * phải — người đọc đọc liền mạch tiếng Anh, chỉ sang bên phải khi thật sự cần.
 *
 * Để hai tấm không lạc nhau: rê vào một đoạn thì đoạn tương ứng bên kia sáng
 * lên; bấm số đoạn thì tấm bên kia cuộn tới đúng đoạn đó.
 *
 * MÀN HẸP chỉ đủ chỗ cho một tấm, nên thanh trên có bốn thẻ: English, Tiếng
 * Việt, Câu hỏi, Từ vựng.
 */

type Theme = { key: string; label: string; bg: string; ink: string; body: string; muted: string; rule: string; tint: string };

const THEMES: Theme[] = [
  { key: 'paper', label: 'Giấy', bg: '#FFFDF7', ink: '#1C1B16', body: '#35342C', muted: '#8B8878', rule: '#ECE8DA', tint: '#F3F0E2' },
  { key: 'sepia', label: 'Ngà', bg: '#F5ECD7', ink: '#33281A', body: '#4A3C2A', muted: '#8F7B5E', rule: '#E4D6B8', tint: '#EDE0C2' },
  { key: 'mint', label: 'Rêu nhạt', bg: '#EEF3E4', ink: '#1F2A12', body: '#33402A', muted: '#76826A', rule: '#DAE3CA', tint: '#E1EAD2' },
  { key: 'night', label: 'Tối', bg: '#1C2016', ink: '#EFEDE3', body: '#D3D0C3', muted: '#8E8C80', rule: '#2E3326', tint: '#262B1F' },
];

const FONTS = [
  { key: 'serif', label: 'Lora (có chân)', family: readingFont.body },
  { key: 'sans', label: 'Jakarta', family: readingFont.sans },
] as const;

const MIN_SIZE = 14;
const MAX_SIZE = 24;
const OLIVE = '#6B7B3F';
const INK_BORDER = '#1F2A12';

type RightTab = 'vi' | 'questions' | 'vocab';
type NarrowTab = 'en' | RightTab;

export default function BilingualReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = typeof id === 'string' ? getBilingualArticleById(id) : undefined;
  useReadingFonts();

  if (!article) {
    return (
      <GridBackdrop>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="max-w-[460px] rounded-card bg-white p-6" style={sticker}>
            <Text className="font-heavy text-sectionTitle text-ink">Không tìm thấy bài này</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              Bài bạn vừa mở không có trong kho. Quay lại danh sách để chọn bài khác.
            </Text>
            <Button
              className="mt-4"
              variant="brand"
              label="Về kho đọc song ngữ"
              onPress={() => router.replace('/bilingual' as never)}
            />
          </View>
        </SafeAreaView>
      </GridBackdrop>
    );
  }

  return <Reader article={article} />;
}

function Reader({ article }: { article: BilingualArticle }) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 1024;

  const [fontKey, setFontKey] = useState<(typeof FONTS)[number]['key']>('serif');
  const [fontSize, setFontSize] = useState(17);
  const [themeKey, setThemeKey] = useState('paper');
  const [rightTab, setRightTab] = useState<RightTab>('vi');
  const [narrowTab, setNarrowTab] = useState<NarrowTab>('en');
  const [hoverPara, setHoverPara] = useState<number | null>(null);
  const [pick, setPick] = useState<(WordPick & { paragraph: number | null }) | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [toolbarH, setToolbarH] = useState(72);

  const theme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0]!;
  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family;
  const dict = useArticleDictionary(article.id);

  const entries = useVocabStore((s) => s.entries);
  const savedCount = useMemo(
    () => Object.values(entries).filter((e) => e.articleId === article.id).length,
    [entries, article.id],
  );

  // Vị trí từng đoạn trong mỗi tấm, để bấm số đoạn thì tấm kia cuộn tới.
  const enScroll = useRef<ScrollView>(null);
  const viScroll = useRef<ScrollView>(null);
  const enY = useRef<Record<number, number>>({});
  const viY = useRef<Record<number, number>>({});

  const jumpTo = useCallback((side: 'en' | 'vi', index: number) => {
    const y = side === 'en' ? enY.current[index] : viY.current[index];
    const ref = side === 'en' ? enScroll : viScroll;
    if (y !== undefined) ref.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  const onWord = useCallback(
    (paragraph: number | null) => (p: WordPick) => setPick({ ...p, paragraph }),
    [],
  );

  const paneHeight = Math.max(360, height - toolbarH - (wide ? 44 : 36));
  const answeredCount = Object.keys(answers).length;
  const score = article.questions.filter((q, i) => answers[i] === q.answerIndex).length;

  const enPane = (
    <EnglishPane
      article={article}
      theme={theme}
      fontFamily={fontFamily}
      fontSize={fontSize}
      scrollRef={enScroll}
      offsets={enY}
      hoverPara={hoverPara}
      onHoverPara={setHoverPara}
      onJump={(i) => {
        if (wide && rightTab === 'vi') jumpTo('vi', i);
      }}
      onWord={onWord}
    />
  );

  const viPane = (
    <VietnamesePane
      article={article}
      theme={theme}
      fontFamily={fontKey === 'serif' ? readingFont.body : readingFont.sans}
      fontSize={fontSize}
      scrollRef={viScroll}
      offsets={viY}
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
        if (checked) return;
        setAnswers((prev) => ({ ...prev, [q]: o }));
      }}
    />
  );

  const vocabPane = <VocabPane vocab={article.vocab} theme={theme} article={article} />;

  const rightPane = rightTab === 'vi' ? viPane : rightTab === 'questions' ? questionsPane : vocabPane;
  const activeNarrow =
    narrowTab === 'en' ? enPane : narrowTab === 'vi' ? viPane : narrowTab === 'questions' ? questionsPane : vocabPane;
  const tab: string = wide ? rightTab : narrowTab;

  return (
    <GridBackdrop colors={['#5E6E37', '#6B7B3F', '#627238']} line="rgba(255,255,255,0.10)">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-1 px-3 pt-3 lg:px-5">
          <View onLayout={(e) => setToolbarH(e.nativeEvent.layout.height)}>
            <Toolbar
              wide={wide}
              title={article.titleEn}
              tab={tab}
              onTab={(t) => (wide ? setRightTab(t as RightTab) : setNarrowTab(t as NarrowTab))}
              fontKey={fontKey}
              onFont={setFontKey}
              fontSize={fontSize}
              onSize={(d) => setFontSize((s) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, s + d)))}
              themeKey={themeKey}
              onTheme={setThemeKey}
              savedCount={savedCount}
              questionCount={article.questions.length}
              answers={answers}
              checked={checked}
              score={score}
              answeredCount={answeredCount}
              onCheck={() => {
                if (checked) {
                  setChecked(false);
                  setAnswers({});
                } else {
                  setChecked(true);
                }
                if (wide) setRightTab('questions');
                else setNarrowTab('questions');
              }}
            />
          </View>

          {wide ? (
            <View className="mt-3 flex-row gap-4" style={{ height: paneHeight }}>
              <View style={{ flex: 1, flexBasis: 0 }}>{enPane}</View>
              <View style={{ flex: 1, flexBasis: 0 }}>
                <CrossFade swapKey={`right-${rightTab}`} style={{ flex: 1 }}>
                  {rightPane}
                </CrossFade>
              </View>
            </View>
          ) : (
            <View className="mt-3" style={{ height: paneHeight }}>
              <CrossFade swapKey={`narrow-${narrowTab}`} style={{ flex: 1 }}>
                {activeNarrow}
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
    </GridBackdrop>
  );
}

/* ====================================================================== */
/*                                 THANH TRÊN                              */
/* ====================================================================== */

function Toolbar(props: {
  wide: boolean;
  title: string;
  tab: string;
  onTab: (t: string) => void;
  fontKey: string;
  onFont: (k: (typeof FONTS)[number]['key']) => void;
  fontSize: number;
  onSize: (delta: number) => void;
  themeKey: string;
  onTheme: (k: string) => void;
  savedCount: number;
  questionCount: number;
  answers: Record<number, number>;
  checked: boolean;
  score: number;
  answeredCount: number;
  onCheck: () => void;
}) {
  const { wide } = props;
  const [fullscreen, setFullscreen] = useState(false);

  const tabs: { key: string; label: string }[] = wide
    ? [
        { key: 'vi', label: 'Bản dịch' },
        { key: 'questions', label: 'Câu hỏi' },
        { key: 'vocab', label: 'Từ vựng' },
      ]
    : [
        { key: 'en', label: 'English' },
        { key: 'vi', label: 'Tiếng Việt' },
        { key: 'questions', label: 'Câu hỏi' },
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
    <View className="rounded-card bg-white px-3 py-2.5" style={sticker}>
      <View className="flex-row flex-wrap items-center gap-2">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Về kho đọc song ngữ"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/bilingual' as never))}
          className="h-9 w-9 items-center justify-center rounded-md"
          style={{ borderWidth: 2, borderColor: INK_BORDER }}
        >
          <Icon name="chevron-left" size={17} color={INK_BORDER} strokeWidth={2.4} />
        </Pressable>

        <View className="mr-1 min-w-0 flex-row items-baseline gap-2" style={{ flexShrink: 1 }}>
          <Text
            style={{ fontFamily: readingFont.display, fontStyle: 'italic', fontWeight: '800', fontSize: 21, color: INK_BORDER }}
          >
            đọc song ngữ
          </Text>
          {wide ? (
            <Text
              numberOfLines={1}
              style={{ fontFamily: readingFont.mono, fontSize: 10.5, letterSpacing: 1.2, color: '#7A8466', maxWidth: 280 }}
            >
              • {props.title.toUpperCase()}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1 rounded-md p-0.5" style={{ backgroundColor: '#F1F3E8' }}>
          {tabs.map((t) => {
            const on = props.tab === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => props.onTab(t.key)}
                className="rounded-md px-2.5 py-1.5"
                style={{ backgroundColor: on ? INK_BORDER : 'transparent', ...(Platform.OS === 'web' ? transition : null) }}
              >
                <Text className="font-strong" style={{ fontSize: 12, color: on ? '#FFFFFF' : '#4A5236' }}>
                  {t.label}
                  {t.key === 'questions' ? ` ${props.answeredCount}/${props.questionCount}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        {wide ? (
          <View className="flex-row items-center gap-1">
            {Array.from({ length: props.questionCount }).map((_, i) => {
              const done = props.answers[i] !== undefined;
              return (
                <View
                  key={i}
                  className="h-6 w-6 items-center justify-center rounded-pill"
                  style={{ borderWidth: 1.5, borderColor: INK_BORDER, backgroundColor: done ? INK_BORDER : '#FFFFFF' }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: done ? '#FFFFFF' : INK_BORDER }}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View className="flex-row items-center gap-1">
          {THEMES.map((t) => (
            <Pressable
              key={t.key}
              accessibilityRole="button"
              accessibilityLabel={`Nền ${t.label}`}
              accessibilityState={{ selected: props.themeKey === t.key }}
              onPress={() => props.onTheme(t.key)}
              className="h-6 w-6 rounded-md"
              style={{
                backgroundColor: t.bg,
                borderWidth: props.themeKey === t.key ? 2.5 : 1,
                borderColor: props.themeKey === t.key ? INK_BORDER : '#C9CDB8',
              }}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đổi mặt chữ"
          onPress={() => props.onFont(props.fontKey === 'serif' ? 'sans' : 'serif')}
          className="rounded-md px-2.5 py-1.5"
          style={{ borderWidth: 1.5, borderColor: '#C9CDB8' }}
        >
          <Text
            style={{
              fontSize: 12,
              color: INK_BORDER,
              fontFamily: props.fontKey === 'serif' ? readingFont.body : readingFont.sans,
            }}
          >
            {props.fontKey === 'serif' ? 'Lora' : 'Jakarta'} ⇄
          </Text>
        </Pressable>

        <View className="flex-row items-center rounded-md" style={{ borderWidth: 1.5, borderColor: '#C9CDB8' }}>
          <SizeButton label="−" onPress={() => props.onSize(-1)} />
          <Text className="font-strong" style={{ fontSize: 12, color: INK_BORDER, minWidth: 26, textAlign: 'center' }}>
            {props.fontSize}
          </Text>
          <SizeButton label="+" onPress={() => props.onSize(1)} />
        </View>

        <View className="flex-row items-center gap-1 rounded-md px-2.5 py-1.5" style={{ backgroundColor: '#F1F3E8' }}>
          <Icon name="bookmark" size={13} color={OLIVE} strokeWidth={2} />
          <Text className="font-strong" style={{ fontSize: 12, color: INK_BORDER }}>
            {props.savedCount} từ
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            onPress={toggleFullscreen}
            className="h-8 w-8 items-center justify-center rounded-md"
            style={{ borderWidth: 1.5, borderColor: INK_BORDER }}
          >
            <Text style={{ fontSize: 14, color: INK_BORDER }}>{fullscreen ? '⤡' : '⤢'}</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={props.onCheck}
          className="rounded-md px-3.5 py-2"
          style={{ backgroundColor: props.checked ? '#FFFFFF' : '#F2B84B', borderWidth: 2, borderColor: INK_BORDER }}
        >
          <Text className="font-heavy" style={{ fontSize: 12.5, color: INK_BORDER }}>
            {props.checked ? `Đúng ${props.score}/${props.questionCount} · Làm lại` : 'Kiểm tra'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SizeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Tăng cỡ chữ' : 'Giảm cỡ chữ'}
      onPress={onPress}
      className="px-2 py-1"
    >
      <Text className="font-heavy" style={{ fontSize: 14, color: INK_BORDER }}>
        {label}
      </Text>
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
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="flex-1 overflow-hidden rounded-card"
      style={[sticker, { backgroundColor: theme.bg }, Platform.OS === 'web' ? transition : null]}
    >
      {badge ? (
        <View
          pointerEvents="none"
          className="absolute right-4 top-3.5 z-10 rounded-pill px-2.5 py-0.5"
          style={{ backgroundColor: badge === 'EN' ? 'rgba(79,70,229,0.12)' : 'rgba(220,38,38,0.10)' }}
        >
          <Text
            style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 1, color: badge === 'EN' ? '#4F46E5' : '#DC2626' }}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 28, paddingBottom: 64 }}>
        {children}
      </ScrollView>
    </View>
  );
}

function Kicker({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: readingFont.mono, fontSize: 11, letterSpacing: 1.6, color: theme.muted }}>{children}</Text>
  );
}

function EnglishPane({
  article,
  theme,
  fontFamily,
  fontSize,
  scrollRef,
  offsets,
  hoverPara,
  onHoverPara,
  onJump,
  onWord,
}: {
  article: BilingualArticle;
  theme: Theme;
  fontFamily: string | undefined;
  fontSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  offsets: React.MutableRefObject<Record<number, number>>;
  hoverPara: number | null;
  onHoverPara: (i: number | null) => void;
  onJump: (i: number) => void;
  onWord: (paragraph: number | null) => (p: WordPick) => void;
}) {
  const source = article.source;
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="EN">
      <Kicker theme={theme}>
        ENGLISH <Text style={{ letterSpacing: 0.2 }}>· rê chuột vào từ để xem nghĩa, bấm vào từ để xem chi tiết</Text>
      </Kicker>

      <Text
        style={{
          marginTop: 14,
          fontFamily: readingFont.display,
          fontWeight: '800',
          fontSize: fontSize + 15,
          lineHeight: (fontSize + 15) * 1.18,
          color: theme.ink,
        }}
      >
        {article.titleEn}
      </Text>

      {source ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(source.url)}
          className="mt-3 flex-row items-center gap-1.5 self-start rounded-pill px-3 py-1"
          style={{ borderWidth: 1.5, borderColor: '#93A7F5', backgroundColor: 'rgba(147,167,245,0.12)' }}
        >
          <Text
            style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: 11, letterSpacing: 0.8, color: '#3B4FB8' }}
          >
            LINK BÀI VIẾT GỐC | {source.outlet.toUpperCase()}
          </Text>
          <Icon name="external" size={11} color="#3B4FB8" strokeWidth={2.2} />
        </Pressable>
      ) : null}

      <Text
        style={{
          marginTop: 12,
          fontFamily: readingFont.body,
          fontStyle: 'italic',
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.6,
          color: theme.body,
        }}
      >
        {article.standfirstEn}
      </Text>

      <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Meta theme={theme} text={article.level} />
        <Meta theme={theme} text={article.topic} />
        <Meta theme={theme} text={`${article.wordCount} từ · ${article.estMinutes} phút`} />
        {source?.author ? <Meta theme={theme} text={`by ${source.author}`} italic /> : null}
      </View>

      <View className="mt-5" style={{ height: 1, backgroundColor: theme.rule }} />

      {article.paragraphs.map((p, i) => (
        <ParagraphBlock
          key={i}
          index={i}
          theme={theme}
          hovered={hoverPara === i}
          onHover={onHoverPara}
          onJump={onJump}
          onMeasure={(i, y) => {
            offsets.current[i] = y;
          }}
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
  fontFamily: string | undefined;
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
      lineHeight={fontSize * 1.75}
      color={theme.ink}
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
  offsets,
  hoverPara,
  onHoverPara,
  onJump,
}: {
  article: BilingualArticle;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  offsets: React.MutableRefObject<Record<number, number>>;
  hoverPara: number | null;
  onHoverPara: (i: number | null) => void;
  onJump: (i: number) => void;
}) {
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="VI">
      <Kicker theme={theme}>TIẾNG VIỆT</Kicker>

      <Text
        style={{
          marginTop: 14,
          fontFamily: readingFont.display,
          fontStyle: 'italic',
          fontWeight: '700',
          fontSize: fontSize + 15,
          lineHeight: (fontSize + 15) * 1.22,
          color: theme.ink,
        }}
      >
        {article.titleVi}
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontFamily,
          fontStyle: 'italic',
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.6,
          color: theme.body,
        }}
      >
        {article.standfirstVi}
      </Text>

      <View className="mt-5" style={{ height: 1, backgroundColor: theme.rule }} />

      {article.paragraphs.map((p, i) => (
        <ParagraphBlock
          key={i}
          index={i}
          theme={theme}
          hovered={hoverPara === i}
          onHover={onHoverPara}
          onJump={onJump}
          onMeasure={(i, y) => {
            offsets.current[i] = y;
          }}
        >
          <Rich text={p.vi} style={{ fontFamily, fontSize, lineHeight: fontSize * 1.75, color: theme.body }} />
        </ParagraphBlock>
      ))}
    </Sheet>
  );
}

/** Một đoạn: số đoạn bấm được để đối chiếu, nền sáng lên khi đoạn tương ứng bên kia đang được rê. */
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
      className="mt-4 rounded-md px-2 py-1.5"
      style={[{ marginHorizontal: -8, backgroundColor: hovered ? theme.tint : 'transparent' }, Platform.OS === 'web' ? transition : null]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Đối chiếu đoạn ${index + 1}`}
        onPress={() => onJump(index)}
        className="self-start"
      >
        <Text style={{ fontFamily: readingFont.mono, fontSize: 11, color: theme.muted, marginBottom: 4 }}>
          {String(index + 1).padStart(2, '0')}
        </Text>
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

function Meta({ theme, text, italic }: { theme: Theme; text: string; italic?: boolean }) {
  return (
    <Text
      style={{
        fontSize: 11,
        letterSpacing: italic ? 0 : 1,
        color: theme.muted,
        fontFamily: italic ? readingFont.body : readingFont.mono,
        fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      {italic ? text : text.toUpperCase()}
    </Text>
  );
}

function SourceNote({ theme, article }: { theme: Theme; article: BilingualArticle }) {
  const s = article.source!;
  return (
    <View className="mt-8 rounded-md p-3.5" style={{ backgroundColor: theme.tint }}>
      <Text style={{ fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 13, lineHeight: 20, color: theme.body }}>
        Nguồn: {s.outlet}
        {s.author ? `, ${s.author}` : ''} — đăng ngày {s.publishedAt}. Giấy phép: {s.license}. Bản tiếng Việt, chú
        giải và câu hỏi do ReadUp biên soạn.
      </Text>
    </View>
  );
}

/* ====================================================================== */
/*                               CÂU HỎI (IELTS)                           */
/* ====================================================================== */

function QuestionsPane({
  questions,
  theme,
  answers,
  checked,
  onAnswer,
}: {
  questions: BilingualQuestion[];
  theme: Theme;
  answers: Record<number, number>;
  checked: boolean;
  onAnswer: (q: number, o: number) => void;
}) {
  return (
    <Sheet theme={theme}>
      <View className="rounded-card p-5" style={{ borderWidth: 2, borderColor: theme.ink }}>
        <Text style={{ fontFamily: readingFont.sans, fontWeight: '800', fontSize: 22, color: theme.ink }}>
          Questions 1–{questions.length}
        </Text>
        <Text style={{ marginTop: 6, fontFamily: readingFont.body, fontSize: 14.5, color: theme.body }}>
          Choose the correct letter, <Text style={{ fontWeight: '700' }}>A, B, C or D</Text>.
        </Text>
        <Text style={{ marginTop: 2, fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 13.5, color: theme.muted }}>
          Chọn xong bấm “Kiểm tra” trên thanh trên cùng để xem đáp án và lời giải.
        </Text>

        <View className="mt-5 gap-6">
          {questions.map((q, qi) => (
            <View key={qi}>
              <View className="flex-row items-start gap-3">
                <View
                  className="mt-0.5 h-7 items-center justify-center rounded-md px-2"
                  style={{ borderWidth: 1.5, borderColor: theme.ink }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.ink }}>{qi + 1}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text style={{ fontFamily: readingFont.body, fontSize: 16, lineHeight: 24, color: theme.ink }}>{q.q}</Text>
                  <Text style={{ fontFamily: readingFont.mono, fontSize: 10, letterSpacing: 1, color: theme.muted, marginTop: 2 }}>
                    {q.type.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View className="ml-10 mt-2.5 gap-1.5">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const right = checked && oi === q.answerIndex;
                  const wrong = checked && chosen && oi !== q.answerIndex;
                  return (
                    <Pressable
                      key={oi}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: chosen }}
                      onPress={() => onAnswer(qi, oi)}
                      className="flex-row items-start gap-2.5 rounded-md px-2.5 py-2"
                      style={[
                        {
                          backgroundColor: right
                            ? 'rgba(22,163,74,0.12)'
                            : wrong
                              ? 'rgba(220,38,38,0.10)'
                              : chosen
                                ? theme.tint
                                : 'transparent',
                        },
                        Platform.OS === 'web' ? transition : null,
                      ]}
                    >
                      <View
                        className="h-6 w-6 items-center justify-center rounded-pill"
                        style={{
                          borderWidth: 1.5,
                          borderColor: right ? '#16A34A' : wrong ? '#DC2626' : theme.ink,
                          backgroundColor: chosen ? (wrong ? '#DC2626' : right ? '#16A34A' : theme.ink) : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: chosen ? theme.bg : theme.ink }}>
                          {'ABCD'[oi]}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontFamily: readingFont.body, fontSize: 15, lineHeight: 22, color: theme.body }}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {checked ? (
                <CrossFade swapKey={`why-${qi}`}>
                  <View className="ml-10 mt-2 rounded-md p-3" style={{ backgroundColor: theme.tint }}>
                    <Text style={{ fontFamily: readingFont.sans, fontSize: 13.5, lineHeight: 21, color: theme.body }}>
                      <Text style={{ fontWeight: '700' }}>
                        {answers[qi] === q.answerIndex ? 'Đúng. ' : answers[qi] === undefined ? 'Chưa chọn. ' : 'Chưa đúng. '}
                      </Text>
                      <Text style={{ fontStyle: 'italic' }}>{q.whyVi}</Text>
                    </Text>
                  </View>
                </CrossFade>
              ) : null}
            </View>
          ))}
        </View>
      </View>
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
      <Kicker theme={theme}>TỪ VỰNG CỦA BÀI · {vocab.length} TỪ</Kicker>
      <Text
        style={{ marginTop: 10, fontFamily: readingFont.display, fontStyle: 'italic', fontWeight: '700', fontSize: 26, color: theme.ink }}
      >
        Những từ đáng giữ lại
      </Text>

      <View className="mt-5 gap-3">
        {vocab.map((v, i) => {
          const lemma = lemmatize(v.word);
          const saved = Object.values(entries).some((e) => e.lemma === lemma && e.articleId === article.id);
          return (
            <View key={i} className="rounded-md p-3.5" style={{ borderWidth: 1, borderColor: theme.rule }}>
              <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Text
                  style={{ fontFamily: readingFont.display, fontStyle: 'italic', fontWeight: '800', fontSize: 19, color: theme.ink }}
                >
                  {v.word}
                </Text>
                <Text style={{ fontFamily: readingFont.mono, fontSize: 12, color: theme.muted }}>{v.ipa}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: OLIVE }}>{v.pos}</Text>
                <View className="flex-1" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nghe từ ${v.word}`}
                  onPress={() => {
                    Speech.stop();
                    Speech.speak(v.word, { language: 'en-GB', rate: 0.9 });
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
                  className="rounded-pill px-2.5 py-1"
                  style={{ backgroundColor: saved ? theme.tint : '#A3CC66' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: saved ? theme.muted : '#1F2A12' }}>
                    {saved ? '✓ Đã lưu' : '+ Lưu'}
                  </Text>
                </Pressable>
              </View>
              <Text style={{ marginTop: 4, fontFamily: readingFont.sans, fontSize: 15, fontWeight: '600', color: theme.body }}>
                {v.meaningVi}
              </Text>
              {v.collocation ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: theme.muted }}>
                  Đi với: <Text style={{ fontStyle: 'italic', fontFamily: readingFont.body }}>{v.collocation}</Text>
                </Text>
              ) : null}
              {v.example ? (
                <Text
                  style={{ marginTop: 4, fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 14, lineHeight: 21, color: theme.body }}
                >
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

/* ====================================================================== */

/*
  react-native-web chuyển thẳng các khoá này xuống CSS; kiểu của RN không khai
  báo chúng nên phải ép kiểu. Chỉ dùng trên web.
*/
const transition = {
  transitionProperty: 'background-color, color, border-color',
  transitionDuration: '220ms',
  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as object;

/** Viền mực + bóng lệch cứng — kiểu "sticker" của bố cục phòng thi tham chiếu. */
const sticker = {
  borderWidth: 2,
  borderColor: INK_BORDER,
  ...(Platform.OS === 'web' ? ({ boxShadow: `4px 5px 0 ${INK_BORDER}` } as object) : { elevation: 4 }),
};
