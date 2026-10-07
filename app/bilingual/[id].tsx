import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
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
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteBulb, CuteMagnifier, CuteNotebook, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { lemmatize } from '@/services/dictionary/lookup';
import { useArticleDictionary } from '@/services/dictionary/rich-dictionary';
import { useVocabStore } from '@/store/useVocabStore';
import { HoverPressable } from '@/components/ui/HoverPressable';
import { ArtBackdrop, ArtCaption, ArtGallery, useActiveBackdrop } from '@/components/art/ArtBackdrop';
import { withAlpha, type Backdrop } from '@/data/backdrops';
import { useBackdropStore } from '@/store/useBackdropStore';
import { useL } from '@/i18n/useL';
import { bilingualQuestionType, bilingualTopic } from '@/components/bilingual/labels-en';

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
  bg: '#FFFFFF',
  ink: '#1A1A17',
  body: '#34332E',
  muted: '#85837A',
  rule: '#E8E5DC',
  tint: '#F5F3EC',
  accent: '#957846',
};
const DARK: Theme = {
  bg: '#1D1C19',
  ink: '#F4F2EA',
  body: '#D6D3C8',
  muted: '#8E8B80',
  rule: '#2E2D28',
  tint: '#272622',
  accent: '#D6B66E',
};
/** Nền trang phẳng, không hoa văn. */
const PAGE = { light: '#F4F2EB', dark: '#121211' };

const FONTS = [
  { key: 'literata', label: 'Literata', family: readingFont.literata },
  { key: 'lora', label: 'Lora', family: readingFont.body },
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
  const { L } = useL();

  if (!article) {
    return (
      <PageBackdrop>
        <SafeAreaView className="flex-1 items-center justify-center p-6">
          <View className="max-w-[460px] rounded-card p-6" style={{ backgroundColor: LIGHT.bg }}>
            <View aria-hidden className="mb-3">
              <Motion kind="wobble">
                <Sticker tilt={-6}>
                  <CuteMagnifier size={60} />
                </Sticker>
              </Motion>
            </View>
            <Text className="font-heavy text-sectionTitle text-ink">{L('Không tìm thấy bài này', "We couldn't find this article")}</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              {L('Bài bạn vừa mở không có trong kho. Quay lại danh sách để chọn bài khác.', "This article isn't in the library. Go back to the list and pick another one.")}
            </Text>
            <Button
              className="mt-4"
              variant="brand"
              label={L('Về kho đọc báo song ngữ', 'Back to bilingual news')}
              onPress={() => router.replace('/bilingual' as never)}
            />
          </View>
        </SafeAreaView>
      </PageBackdrop>
    );
  }

  return <Reader article={article} />;
}

function PageBackdrop({ children, dark = false, art }: { children: React.ReactNode; dark?: boolean; art?: Backdrop | null }) {
  const { width } = useWindowDimensions();
  return (
    // zIndex 0 mở một ngăn xếp riêng để lớp tranh (zIndex -1) nằm sau nội dung nhưng trên màu nền.
    <View className="flex-1" style={{ backgroundColor: dark ? PAGE.dark : PAGE.light, zIndex: 0 }}>
      {art ? <ArtBackdrop backdrop={art} /> : null}
      {children}
      {art ? <ArtCaption backdrop={art} phone={width < 640} /> : null}
    </View>
  );
}

function Reader({ article }: { article: BilingualArticle }) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 1024;

  const [fontKey, setFontKey] = useState<FontKey>('literata');
  const [fontSize, setFontSize] = useState(17);
  const [dark, setDark] = useState(false);
  const [right, setRight] = useState<View2>('vi');
  const [narrow, setNarrow] = useState<NarrowView>('en');
  const [hoverPara, setHoverPara] = useState<number | null>(null);
  const [pick, setPick] = useState<(WordPick & { paragraph: number | null }) | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [toolbarH, setToolbarH] = useState(56);

  const { backdrop } = useActiveBackdrop();
  const baseTheme = dark ? DARK : LIGHT;
  // Có tranh: tấm giấy trong ~93% để tranh lấp ló quanh mép; chữ vẫn dùng đúng màu của giấy sáng/tối.
  const theme = useMemo<Theme>(
    () => (backdrop ? { ...baseTheme, bg: withAlpha(baseTheme.bg, wide ? 0.92 : 0.94) } : baseTheme),
    [backdrop, baseTheme, wide],
  );
  // Chữ nằm TRỰC TIẾP trên tranh (thanh trên) theo tông tranh, không theo giấy.
  const chromeInk = backdrop ? (backdrop.tone === 'dark' ? '#F4F2EA' : '#1A1A17') : dark ? '#F4F2EA' : '#1A1A17';
  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family ?? readingFont.literata;
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

  const checkAll = () => {
    if (checked) {
      setChecked(false);
      setAnswers({});
    } else {
      setChecked(true);
    }
  };
  const onAnswerQ = (q: number, o: number) => {
    if (!checked) setAnswers((prev) => ({ ...prev, [q]: o }));
  };
  const questionsBody = (
    <QuestionsBody questions={article.questions} theme={theme} answers={answers} checked={checked} onAnswer={onAnswerQ} onCheck={checkAll} />
  );

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
      below={questionsBody}
    />
  );

  const viPane = (
    <VietnamesePane
      article={article}
      theme={theme}
      fontFamily={readingFont.sans}
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
    <PageBackdrop dark={dark} art={backdrop}>
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
              ink={chromeInk}
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
    </PageBackdrop>
  );
}

/* ====================================================================== */
/*                                 THANH TRÊN                              */
/* ====================================================================== */


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
  ink: string;
}) {
  const ink = props.ink;
  const [open, setOpen] = useState(false);
  const { L } = useL();

  /*
    MỌI NÚT CHỈNH GOM VÀO MỘT BẢNG CÀI ĐẶT. Bản trước là một hàng sáu viên
    (chọn tấm, mặt chữ, cỡ chữ, số từ đã lưu, nền tối, toàn màn hình) — màn
    laptop nhỏ thì hàng ấy gãy làm hai và ăn chỗ của bài đọc. Người dùng muốn
    thanh trên chỉ còn đường về, tên trang và một nút Cài đặt (24/09/2026).
  */
  return (
    <View className="flex-row items-center gap-x-3 py-1.5" style={{ zIndex: 30 }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={L('Về kho đọc báo song ngữ', 'Back to bilingual news')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/bilingual' as never))}
        className="h-9 w-9 items-center justify-center"
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <Icon name="arrow-right" size={22} color={ink} strokeWidth={2} />
        </View>
      </Pressable>

      <Text
        numberOfLines={1}
        style={{ flexShrink: 1, minWidth: 0, fontFamily: readingFont.sansHeavy, fontSize: 20, letterSpacing: -0.4, color: ink }}
      >
        {L('Đọc song ngữ', 'Bilingual reading')}
      </Text>

      <View className="flex-1" />

      <HoverPressable
        accessibilityRole="button"
        accessibilityLabel={L('Cài đặt đọc', 'Reading settings')}
        aria-expanded={open}
        onPress={() => setOpen(true)}
        style={({ hovered }) => [{ opacity: hovered ? 0.88 : 1 }, webTransition]}
      >
        <View className="h-10 flex-row items-center gap-2 rounded-pill px-4" style={{ backgroundColor: props.dark ? '#1D1C19' : '#FFFFFF', borderWidth: 1, borderColor: props.dark ? '#2E2D28' : '#E3E0D6' }}>
          <Icon name="settings" size={16} color={props.dark ? '#F4F2EA' : '#1A1A17'} strokeWidth={2} />
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 13, color: props.dark ? '#F4F2EA' : '#1A1A17' }}>{L('Cài đặt', 'Settings')}</Text>
        </View>
      </HoverPressable>

      <ReaderSettings {...props} open={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const PAPER = { bg: '#FFFFFF', ink: '#1A1A17', muted: '#85837A', rule: '#E8E5DC', chip: '#F3F1EA', accent: '#957846' };

/** Bảng cài đặt của màn đọc song ngữ: tấm hiển thị, mặt chữ, cỡ chữ, nền, toàn màn hình, từ đã lưu. */
function ReaderSettings(
  props: {
    open: boolean;
    onClose: () => void;
  } & Omit<React.ComponentProps<typeof Toolbar>, never>,
) {
  const { width, height } = useWindowDimensions();
  const [fullscreen, setFullscreen] = useState(false);
  const { L } = useL();
  const views = [
    ...(props.wide ? [] : [{ key: 'en', label: 'English' }]),
    { key: 'vi', label: props.wide ? L('Bản dịch', 'Translation') : L('Tiếng Việt', 'Vietnamese') },
    { key: 'questions', label: L(`Câu hỏi ${props.answered}/${props.questionCount}`, `Questions ${props.answered}/${props.questionCount}`) },
    { key: 'vocab', label: L('Từ vựng', 'Vocabulary') },
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
    <Modal visible={props.open} transparent animationType="fade" onRequestClose={props.onClose}>
      <Pressable onPress={props.onClose} style={{ flex: 1, backgroundColor: 'rgba(12,16,40,0.28)' }}>
        <Pressable
          onPress={() => {}}
          style={{
            position: 'absolute',
            top: 64,
            right: Math.max(12, (width - MAX_WIDTH - 64) / 2 + 16),
            width: Math.min(360, width - 24),
            borderRadius: 20,
            backgroundColor: PAPER.bg,
            borderWidth: 1,
            borderColor: PAPER.rule,
            padding: 18,
            maxHeight: height - 80,
            cursor: 'auto',
            ...(Platform.OS === 'web' ? ({ boxShadow: '0 12px 32px rgba(20,20,10,0.16)' } as object) : { elevation: 10 }),
          } as object}
        >
         <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: readingFont.sansHeavy, fontSize: 20, letterSpacing: -0.3, color: PAPER.ink }}>{L('Cài đặt đọc', 'Reading settings')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={props.onClose} className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: PAPER.chip }}>
              <Icon name="close" size={16} color={PAPER.ink} />
            </Pressable>
          </View>

          <SettingLabel>{props.wide ? L('Tấm bên phải', 'Right pane') : L('Tấm đang xem', 'Current pane')}</SettingLabel>
          <View className="flex-row flex-wrap gap-2">
            {views.map((v) => (
              <Choice
                key={v.key}
                on={props.view === v.key}
                onPress={() => {
                  props.onView(v.key);
                  props.onClose();
                }}
              >
                {v.label}
              </Choice>
            ))}
          </View>

          <SettingLabel>{L('Mặt chữ', 'Typeface')}</SettingLabel>
          <View className="flex-row flex-wrap gap-2">
            {FONTS.map((f) => (
              <Choice key={f.key} on={props.fontKey === f.key} onPress={() => props.onFont(f.key)} fontFamily={f.family}>
                {f.label}
              </Choice>
            ))}
          </View>

          <SettingLabel>{L('Cỡ chữ', 'Text size')}</SettingLabel>
          <View className="flex-row items-center gap-3">
            <SizeButton label="−" a11y={L('Giảm cỡ chữ', 'Smaller text')} disabled={props.fontSize <= MIN_SIZE} onPress={() => props.onSize(-1)} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: PAPER.ink, minWidth: 28, textAlign: 'center' }}>{props.fontSize}</Text>
            <SizeButton label="+" a11y={L('Tăng cỡ chữ', 'Larger text')} disabled={props.fontSize >= MAX_SIZE} onPress={() => props.onSize(1)} />
          </View>

          <SettingLabel>{L('Nền giấy', 'Paper')}</SettingLabel>
          <View className="flex-row flex-wrap gap-2">
            <Choice on={!props.dark} onPress={() => props.dark && props.onDark()}>
              {L('☀ Sáng', '☀ Light')}
            </Choice>
            <Choice on={props.dark} onPress={() => !props.dark && props.onDark()}>
              {L('☾ Tối', '☾ Dark')}
            </Choice>
          </View>

          {Platform.OS === 'web' ? <BackdropSetting /> : null}

          {Platform.OS === 'web' ? (
            <>
              <SettingLabel>{L('Màn hình', 'Screen')}</SettingLabel>
              <Choice on={fullscreen} onPress={toggleFullscreen}>
                {fullscreen ? L('⤡ Thoát toàn màn hình', '⤡ Exit full screen') : L('⛶ Toàn màn hình', '⛶ Full screen')}
              </Choice>
            </>
          ) : null}

          <View className="mt-4 flex-row items-center gap-2 border-t pt-3" style={{ borderColor: PAPER.rule }}>
            <Icon name="bookmark" size={14} color={PAPER.accent} strokeWidth={2} />
            <Text style={{ flex: 1, fontSize: 13, color: PAPER.ink }}>
              {L('Đã lưu ', 'Saved ')}
              <Text style={{ fontWeight: '800' }}>{L(`${props.savedCount} từ`, `${props.savedCount} words`)}</Text>
              {L(' từ bài này', ' from this article')}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                props.onClose();
                router.push('/vocabulary' as never);
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: PAPER.accent }}>{L('Mở sổ từ →', 'Open word notebook →')}</Text>
            </Pressable>
          </View>
         </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** "Nền tranh nổi tiếng": TẮT mặc định; bật thì hiện bộ chọn tranh dùng chung (cũng dùng ở màn học từ vựng). */
function BackdropSetting() {
  const { L } = useL();
  const on = useBackdropStore((s) => s.on);
  const choice = useBackdropStore((s) => s.choice);
  const setOn = useBackdropStore((s) => s.setOn);
  const setChoice = useBackdropStore((s) => s.setChoice);
  return (
    <>
      <SettingLabel>{L('Nền tranh nổi tiếng', 'Famous-painting backdrop')}</SettingLabel>
      <View className="flex-row flex-wrap gap-2">
        <Choice on={!on} onPress={() => setOn(false)}>
          {L('Tắt', 'Off')}
        </Choice>
        <Choice on={on} onPress={() => setOn(true)}>
          {L('Bật', 'On')}
        </Choice>
      </View>
      {on ? (
        <View style={{ marginTop: 12 }}>
          <ArtGallery active choice={choice} onPick={setChoice} onOff={() => setOn(false)} colors={{ ink: PAPER.ink, muted: PAPER.muted, chip: PAPER.chip, accent: PAPER.accent, onAccent: '#FFFFFF' }} />
        </View>
      ) : null}
    </>
  );
}

function SettingLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ marginTop: 16, marginBottom: 8, fontFamily: readingFont.sansBold, fontSize: 12.5, color: PAPER.muted }}>
      {String(children)}
    </Text>
  );
}

function Choice({ on, onPress, fontFamily, children }: { on: boolean; onPress: () => void; fontFamily?: string; children: React.ReactNode }) {
  return (
    <HoverPressable
      accessibilityRole="button"
      aria-pressed={on}
      onPress={onPress}
      className="rounded-pill px-3.5 py-2"
      style={({ hovered }) => [
        { backgroundColor: on ? PAPER.accent : hovered ? '#E7E4DA' : PAPER.chip },
        webTransition,
      ]}
    >
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: on ? '#FFFFFF' : PAPER.ink, fontFamily }}>{children}</Text>
    </HoverPressable>
  );
}

function SizeButton({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-pill"
      style={{ backgroundColor: PAPER.chip, opacity: disabled ? 0.45 : 1 }}
    >
      <Text style={{ fontSize: 18, fontWeight: '800', color: PAPER.ink, lineHeight: 20 }}>{label}</Text>
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
  const pad = useWindowDimensions().width >= 768 ? 36 : 20;
  return (
    <View
      className="flex-1 overflow-hidden"
      style={[
        {
          backgroundColor: theme.bg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.rule,
        },
        webTransition,
      ]}
    >
      {badge ? (
        <View
          pointerEvents="none"
          className="absolute right-7 top-6 z-10 rounded-pill px-2.5 py-0.5"
          style={{ backgroundColor: theme.tint, borderWidth: 1, borderColor: theme.rule }}
        >
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12, color: theme.muted }}>
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
  // Chừa chỗ cho nhãn EN/VI ở góc thẻ.
  return (
    <Text style={{ paddingRight: 44, fontFamily: readingFont.sansSemi, fontSize: 13, color: theme.muted }}>
      {label}
      {hint ? `  ·  ${hint}` : ''}
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
  below,
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
  below?: React.ReactNode;
}) {
  const source = article.source;
  const { L, en } = useL();
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="EN">
      <Kicker
        theme={theme}
        label="English"
        hint={L('rê chuột vào từ để xem nghĩa, bấm vào từ để xem chi tiết', 'hover a word to see its meaning, tap it for details')}
      />

      <Text
        style={{
          marginTop: 16,
          fontFamily: readingFont.sansHeavy,
          letterSpacing: -0.6,
          fontSize: fontSize + 11,
          lineHeight: (fontSize + 11) * 1.22,
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
            { borderWidth: 1, borderColor: theme.rule, backgroundColor: hovered ? theme.tint : 'transparent' },
            webTransition,
          ]}
        >
          <Text style={{ fontFamily: readingFont.sansSemi, fontSize: 12.5, color: theme.accent }}>
            {L('Bài gốc', 'Original')} · {source.outlet}
          </Text>
          <Icon name="external" size={11} color={theme.accent} strokeWidth={2.2} />
        </HoverPressable>
      ) : null}

      <Text
        style={{
          marginTop: 26,
          fontFamily: fontFamily,
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.6,
          color: theme.muted,
        }}
      >
        {article.standfirstEn}
      </Text>

      <Text style={{ marginTop: 10, fontFamily: readingFont.sans, fontSize: 12.5, color: theme.muted }}>
        {article.level} · {bilingualTopic(article.topic, en)} · {L(`${article.wordCount} từ`, `${article.wordCount} words`)} ·{' '}
        {L(`${article.estMinutes} phút`, `${article.estMinutes} min`)}
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

      {below ? (
        <View style={{ marginTop: 44, paddingTop: 28, borderTopWidth: 1, borderTopColor: theme.rule }}>{below}</View>
      ) : null}

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
      lineHeight={fontSize * 1.75}
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
  const { L } = useL();
  return (
    <Sheet theme={theme} scrollRef={scrollRef} badge="VI">
      <Kicker theme={theme} label={L('Tiếng Việt', 'Vietnamese')} />

      <Text
        style={{
          marginTop: 16,
          fontFamily: readingFont.sansHeavy,
          letterSpacing: -0.6,
          fontSize: fontSize + 11,
          lineHeight: (fontSize + 11) * 1.26,
          color: theme.ink,
          paddingRight: 36,
        }}
      >
        {article.titleVi}
      </Text>

      <Text
        style={{
          marginTop: 26,
          fontFamily: readingFont.sansMedium,
          fontSize: fontSize + 1,
          lineHeight: (fontSize + 1) * 1.7,
          color: theme.muted,
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
          <Rich text={p.vi} style={{ fontFamily, fontSize, lineHeight: fontSize * 1.75, color: theme.body }} />
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
  const { L } = useL();
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
        accessibilityLabel={L(`Đối chiếu đoạn ${index + 1}`, `Match paragraph ${index + 1}`)}
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
  const { L } = useL();
  return (
    <View className="mt-10 border-t pt-4" style={{ borderColor: theme.rule }}>
      <Text style={{ fontFamily: readingFont.sans, fontSize: 12.5, lineHeight: 20, color: theme.muted }}>
        {L(
          `Nguồn: ${s.outlet}${s.author ? `, ${s.author}` : ''} — đăng ngày ${s.publishedAt}. Giấy phép: ${s.license}. Bản tiếng Việt, chú giải và câu hỏi do Band 9 biên soạn.`,
          `Source: ${s.outlet}${s.author ? `, ${s.author}` : ''} — published ${s.publishedAt}. Licence: ${s.license}. Vietnamese translation, glosses and questions by Band 9.`,
        )}
      </Text>
    </View>
  );
}

/* ====================================================================== */
/*                                   CÂU HỎI                               */
/* ====================================================================== */

type QuestionsProps = {
  questions: BilingualQuestion[];
  theme: Theme;
  answers: Record<number, number>;
  checked: boolean;
  onAnswer: (q: number, o: number) => void;
  onCheck: () => void;
};

function QuestionsPane(props: QuestionsProps) {
  return (
    <Sheet theme={props.theme}>
      <QuestionsBody {...props} />
    </Sheet>
  );
}

/** Phần câu hỏi trần (không có tấm giấy bao) — dùng cho cả tab "Câu hỏi" lẫn khối câu hỏi nằm dưới bài đọc. */
function QuestionsBody({ questions, theme, answers, checked, onAnswer, onCheck }: QuestionsProps) {
  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const { L, en } = useL();
  return (
    <>
      <Kicker theme={theme} label={L('Hiểu bài', 'Comprehension')} hint={L(`${questions.length} câu`, `${questions.length} questions`)} />
      <View className="flex-row items-center gap-3" style={{ marginTop: 14 }}>
        <Text style={{ flex: 1, minWidth: 0, fontFamily: readingFont.sansHeavy, letterSpacing: -0.5, fontSize: 26, lineHeight: 32, color: theme.ink }}>
          {L('Bạn đã hiểu bài chưa?', 'Did you get it?')}
        </Text>
        <View aria-hidden>
          <Motion kind="float">
            <Sticker tilt={8}>
              <CuteBulb size={46} />
            </Sticker>
          </Motion>
        </View>
      </View>

      <View className="mt-6 gap-7">
        {questions.map((q, qi) => (
          <View key={qi}>
            <Text style={{ fontFamily: readingFont.sansBold, fontSize: 12.5, color: theme.accent }}>
              {L('Câu', 'Question')} {qi + 1} · {bilingualQuestionType(q.type, en)}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: readingFont.sansBold, fontSize: 16.5, lineHeight: 25, color: theme.ink }}>
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
                    aria-checked={chosen}
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
                    <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: theme.muted }}>
                      {'ABCD'[oi]}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: readingFont.sans, fontSize: 15, lineHeight: 23, color: theme.body }}>
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
                    {answers[qi] === q.answerIndex
                      ? L('Đúng. ', 'Correct. ')
                      : answers[qi] === undefined
                        ? L('Chưa chọn. ', 'Not answered. ')
                        : L('Chưa đúng. ', 'Not quite. ')}
                  </Text>
                  <Text>{q.whyVi}</Text>
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
        style={({ hovered }) => [{ backgroundColor: checked ? theme.tint : hovered ? '#7C6338' : theme.accent }, webTransition]}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: checked ? theme.ink : '#FFFFFF' }}>
          {checked ? L(`Đúng ${score}/${questions.length} · Làm lại`, `${score}/${questions.length} correct · Try again`) : L('Xem kết quả', 'Check answers')}
        </Text>
      </HoverPressable>
      {checked ? (
        <View aria-hidden className="mt-4 flex-row items-center gap-3">
          <Motion kind="wobble">
            <Sticker tilt={-8}>
              <CuteTrophy size={44} />
            </Sticker>
          </Motion>
          <Label
            text={
              score === questions.length
                ? L('Hiểu trọn bài 🏆', 'Fully understood 🏆')
                : score * 2 >= questions.length
                  ? L('Khá lắm ⭐', 'Nice work ⭐')
                  : L('Đọc lại nhé 💪', 'Give it another read 💪')
            }
            color={score === questions.length ? '#22A06B' : score * 2 >= questions.length ? '#A8843F' : '#F0703F'}
            ink="#FFFFFF"
            tilt={-4}
            size={12}
          />
        </View>
      ) : null}
    </>
  );
}

/* ====================================================================== */
/*                                   TỪ VỰNG                               */
/* ====================================================================== */

function VocabPane({ vocab, theme, article }: { vocab: BilingualVocab[]; theme: Theme; article: BilingualArticle }) {
  const saveWord = useVocabStore((s) => s.saveWord);
  const entries = useVocabStore((s) => s.entries);
  const { L } = useL();

  return (
    <Sheet theme={theme}>
      <Kicker theme={theme} label={L('Từ vựng', 'Vocabulary')} hint={L(`${vocab.length} từ đáng giữ lại`, `${vocab.length} words worth keeping`)} />
      <View className="flex-row items-center gap-3" style={{ marginTop: 14 }}>
        <Text style={{ flex: 1, minWidth: 0, fontFamily: readingFont.sansHeavy, letterSpacing: -0.5, fontSize: 26, lineHeight: 32, color: theme.ink }}>
          {L('Từ của bài này', 'Words from this article')}
        </Text>
        <View aria-hidden>
          <Motion kind="float">
            <Sticker tilt={-8}>
              <CuteNotebook size={46} />
            </Sticker>
          </Motion>
        </View>
      </View>

      <View className="mt-5">
        {vocab.map((v, i) => {
          const lemma = lemmatize(v.word);
          const saved = Object.values(entries).some((e) => e.lemma === lemma && e.articleId === article.id);
          return (
            <View key={i} className="border-b py-4" style={{ borderColor: theme.rule }}>
              <View className="flex-row flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Text style={{ fontFamily: readingFont.sansHeavy, letterSpacing: -0.3, fontSize: 19, color: theme.ink }}>
                  {v.word}
                </Text>
                <Text style={{ fontFamily: readingFont.mono, fontSize: 12, color: theme.muted }}>{v.ipa}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>{v.pos}</Text>
                <View className="flex-1" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={L(`Nghe từ ${v.word}`, `Hear “${v.word}”`)}
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
                    {saved ? L('✓ Đã lưu', '✓ Saved') : L('+ Lưu', '+ Save')}
                  </Text>
                </Pressable>
              </View>
              <Text style={{ marginTop: 4, fontFamily: readingFont.sans, fontSize: 15, fontWeight: '600', color: theme.body }}>
                {v.meaningVi}
              </Text>
              {v.collocation ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: theme.muted }}>
                  {L('Đi với: ', 'Goes with: ')}<Text style={{ fontFamily: readingFont.sansSemi }}>{v.collocation}</Text>
                </Text>
              ) : null}
              {v.example ? (
                <Text style={{ marginTop: 4, fontFamily: readingFont.literata, fontSize: 14.5, lineHeight: 22, color: theme.body }}>
                  “{v.example}”
                </Text>
              ) : null}
              {v.derivatives && v.derivatives !== '—' ? (
                <Rich text={L(`Họ từ: ${v.derivatives}`, `Word family: ${v.derivatives}`)} style={{ marginTop: 4, fontSize: 13, color: theme.muted }} />
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
