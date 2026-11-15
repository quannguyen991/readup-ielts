import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import type { StudyWord } from '@/services/vocab/topic-study';
import type { BookVocabBook, BookVocabLesson, BookVocabTheme } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { ZhLevelCorners } from '../chinese/ZhNineFrame';
import { ZH_V4 } from '../chinese/v4';
import { JA, JA_SET_ART, JA_STICKER, JA_THUMB, isDialogueLesson, isVocabLesson, sceneOf } from './ja-art';

/**
 * Đầu trang Nhật: banner tuỳ chọn, lớp phủ xanh rừng, viền vàng, bốn góc hoa anh đào.
 * Bên phải: đèn lồng (mặc định) hoặc tranh `side` của chủ đề, chỉ hiện khi màn hình đủ rộng.
 */
export function JaIntroHero({
  banner,
  side,
  decor,
  eyebrow,
  title,
  chips,
  blurb,
  footer,
}: {
  banner?: number;
  side?: number;
  /** Dòng cuối đầu trang (ví dụ thanh tiến độ). */
  footer?: React.ReactNode;
  /** Sticker góc phải khi không có tranh `side` (mặc định đèn lồng). */
  decor?: number;
  eyebrow: string;
  title: string;
  chips: string[];
  blurb?: string;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: JA.gold,
          backgroundColor: JA.green,
          paddingLeft: 72,
          paddingRight: wide && side ? 290 : 52,
          paddingVertical: 26,
          minHeight: 220,
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {banner ? <Image source={banner} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
        {/* Lớp phủ xanh rừng: đậm bên trái để chữ đọc rõ, trong suốt dần về phải để thấy banner. */}
        <LinearGradient
          colors={['rgba(14,48,35,0.95)', 'rgba(23,57,43,0.8)', 'rgba(23,57,43,0.12)']}
          locations={[0, 0.42, 0.78]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: 0, left: 0, height: 4, backgroundColor: JA.gold, opacity: 0.8 }} />
        {wide && side ? (
          <Image
            source={side}
            contentFit="cover"
            pointerEvents="none"
            style={{ position: 'absolute', right: 40, top: 22, bottom: 22, width: 230, borderRadius: 16, borderWidth: 2, borderColor: JA.gold }}
          />
        ) : wide ? (
          <Image source={decor ?? ZH_V4.ja.lantern} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 28, top: 10, width: 96, height: 120 }} />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 4, height: 54, borderRadius: 2, backgroundColor: JA.gold }} />
          <View style={{ gap: 6, flexShrink: 1 }}>
            <Text className="font-sans text-label" style={{ color: JA.heroEyebrow, letterSpacing: 1.6 }}>
              {eyebrow.toUpperCase()}
            </Text>
            <Text className="font-heavy" style={{ color: JA.heroTitle, fontSize: Platform.OS === 'web' ? 40 : 28, lineHeight: Platform.OS === 'web' ? 46 : 34 }}>
              {title}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {chips.map((label) => (
            <View
              key={label}
              style={{ height: 30, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,249,236,0.94)', borderWidth: 1, borderColor: JA.goldLine, justifyContent: 'center' }}
            >
              <Text className="font-strong text-label" style={{ color: JA.green }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        {blurb ? (
          <Text className="font-sans text-body" style={{ color: '#F3EBD6', marginTop: 6, maxWidth: 560 }}>
            {blurb}
          </Text>
        ) : null}
        {footer}
      </View>
      <ZhLevelCorners source={ZH_V4.ja.corner} c={56} />
    </View>
  );
}

/** Tiêu đề mục: quạt nhỏ giữa hai vạch vàng, dòng phụ căn giữa. */
export function JaSectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6, marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
        <Image source={ZH_V4.ja.frameH} contentFit="contain" style={{ flex: 1, height: 22 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={ZH_V4.ja.fan} contentFit="contain" style={{ width: 40, height: 34 }} />
          <Text className="font-heavy text-sectionTitle" style={{ color: JA.green }}>
            {title}
          </Text>
        </View>
        <Image source={ZH_V4.ja.frameH} contentFit="contain" style={{ flex: 1, height: 22, transform: [{ scaleX: -1 }] }} />
      </View>
      <Text className="font-sans text-label" style={{ color: JA.ink2, textAlign: 'center' }}>
        {subtitle}
      </Text>
    </View>
  );
}

function JaTopicCard({ topic, bookSlug, lessonsLabel, en }: { topic: BookVocabTheme; bookSlug: string; lessonsLabel: string; en: boolean }) {
  const thumb = JA_THUMB[topic.nameVi];
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/vocabulary/book/${bookSlug}/${topic.slug}` as never)}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: hovered ? JA.gold : JA.goldLine,
        backgroundColor: JA.card,
        transform: [{ scale: pressed ? 0.985 : hovered ? 1.012 : 1 }],
        shadowColor: JA.green,
        shadowOpacity: hovered ? 0.18 : 0.07,
        shadowRadius: hovered ? 14 : 8,
        shadowOffset: { width: 0, height: 6 },
      })}
    >
      {thumb ? (
        <Image source={thumb} contentFit="cover" style={{ width: '100%', height: 138 }} />
      ) : (
        <View style={{ height: 138, backgroundColor: JA.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={ZH_V4.ja.fan} contentFit="contain" style={{ width: 84, height: 70, opacity: 0.9 }} />
        </View>
      )}
      <View style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text className="flex-1 font-strong text-body" style={{ color: JA.ink }} numberOfLines={1}>
            {en ? topic.name : topic.nameVi}
          </Text>
          <View style={{ minWidth: 38, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: JA.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-strong text-label" style={{ color: JA.green2 }}>
              {topic.words.length}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text className="font-sans text-label" style={{ color: JA.ink2, flexShrink: 1 }}>
            {lessonsLabel}
          </Text>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: JA.green2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 16 }}>→</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Lưới chủ đề sách tiếng Nhật: tiêu đề có quạt, bốn thẻ mỗi hàng trên máy tính, mỗi thẻ có tranh riêng. */
export function JaTopicGrid({ book }: { book: BookVocabBook }) {
  const { L, en } = useL();
  return (
    <View>
      <JaSectionTitle
        title={L('Chọn chủ đề để học', 'Choose a topic to study')}
        subtitle={L('Khám phá từ vựng qua những tình huống gần gũi, sinh động và giàu văn hoá Nhật Bản.', 'Explore vocabulary through everyday scenes rich in Japanese culture.')}
      />
      <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
        {book.topics.map((topic, index) => {
          const dialogues = topic.lessons.filter((l) => isDialogueLesson(l.slug)).length;
          const vocabs = topic.lessons.length - dialogues;
          return (
            <Appear key={topic.slug} index={Math.min(index, 8)}>
              <JaTopicCard
                topic={topic}
                bookSlug={book.slug}
                en={en}
                lessonsLabel={L(`${dialogues} bài hội thoại · ${vocabs} bài từ riêng lẻ`, `${dialogues} dialogues · ${vocabs} word sets`)}
              />
            </Appear>
          );
        })}
      </Grid>
    </View>
  );
}

/** Thẻ một bài: 話 cho bài hội thoại, 語 cho bài từ riêng lẻ, số từ và mũi tên. */
function JaLessonCard({ lesson, en, meta, thumb }: { lesson: BookVocabLesson; en: boolean; meta: string; thumb?: number }) {
  const { L } = useL();
  const vocab = isVocabLesson(lesson.slug);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`Mở ${lesson.nameVi}`, `Open ${lesson.name}`)}
      onPress={() => router.push(`/vocabulary/topic/${lesson.slug}` as never)}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: hovered ? JA.gold : JA.goldLine,
        backgroundColor: JA.card,
        transform: [{ scale: pressed ? 0.985 : hovered ? 1.01 : 1 }],
        shadowColor: JA.green,
        shadowOpacity: hovered ? 0.14 : 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      })}
    >
      {thumb ? (
        <Image source={thumb} contentFit="cover" style={{ width: 96, height: 64, borderRadius: 12, borderWidth: 1.5, borderColor: JA.gold }} />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 1.5,
            borderColor: JA.gold,
            backgroundColor: vocab ? JA.greenSoft : JA.goldSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: JA.green, fontSize: 22, fontWeight: '700' }}>{vocab ? '語' : '話'}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text className="font-strong text-body" style={{ color: JA.ink }} numberOfLines={1}>
          {en ? lesson.name : lesson.nameVi}
        </Text>
        <Text className="font-sans text-label" style={{ color: JA.ink2 }} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={{ minWidth: 38, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: JA.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="font-strong text-label" style={{ color: JA.green2 }}>
          {lesson.words.length}
        </Text>
      </View>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: JA.green2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 16 }}>→</Text>
      </View>
    </Pressable>
  );
}

/** Trang một chủ đề Nhật: đầu trang có tranh chủ đề, rồi hai mục: bài hội thoại và từ riêng lẻ. */
export function JaUnitPage({ book, topic }: { book: BookVocabBook; topic: BookVocabTheme }) {
  const { L, en } = useL();
  const thumb = JA_THUMB[topic.nameVi];
  const dialogues = topic.lessons.filter((l) => isDialogueLesson(l.slug));
  const vocabs = topic.lessons.filter((l) => !isDialogueLesson(l.slug));
  const dialogueMeta = (lesson: BookVocabLesson) => L(`Hội thoại · ${lesson.words.length} từ`, `Dialogue · ${lesson.words.length} words`);
  const vocabMeta = (lesson: BookVocabLesson) => L(`Từ riêng lẻ · ${lesson.words.length} từ`, `Single words · ${lesson.words.length} words`);
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 120 }}>
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 30 }}>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/vocabulary/book/${book.slug}` as never)}>
          <Text className="font-strong text-label" style={{ color: JA.green2 }}>
            ‹ {L('Tất cả chủ đề', 'All topics')}
          </Text>
        </Pressable>

        <Appear>
          <JaIntroHero
            banner={ZH_V4.ja.banner}
            side={thumb}
            eyebrow={L('Chủ đề · Tiếng Nhật', 'Topic · Japanese')}
            title={en ? topic.name : topic.nameVi}
            chips={[
              L(`${dialogues.length} bài hội thoại`, `${dialogues.length} dialogues`),
              L(`${vocabs.length} bài từ riêng lẻ`, `${vocabs.length} word sets`),
              L(`${topic.words.length} từ`, `${topic.words.length} words`),
            ]}
            blurb={topic.blurb}
          />
        </Appear>

        {dialogues.length > 0 ? (
          <View>
            <JaSectionTitle
              title={L('Bài hội thoại', 'Dialogues')}
              subtitle={L('Học theo tình huống: mỗi bài có một đoạn hội thoại và các từ đi kèm.', 'Learn through scenes: each lesson has a dialogue and its words.')}
            />
            <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
              {dialogues.map((lesson, index) => (
                <Appear key={lesson.slug} index={Math.min(index, 8)}>
                  <JaLessonCard lesson={lesson} en={en} meta={dialogueMeta(lesson)} thumb={sceneOf(lesson.nameVi)} />
                </Appear>
              ))}
            </Grid>
          </View>
        ) : null}

        {vocabs.length > 0 ? (
          <View>
            <JaSectionTitle
              title={L('Từ riêng lẻ', 'Single words')}
              subtitle={L('Học từng từ một, mỗi bài tối đa 20 từ, gom từ mọi bài hội thoại của chủ đề.', 'Study words one by one, up to 20 per set, gathered from every dialogue in this topic.')}
            />
            <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
              {vocabs.map((lesson, index) => (
                <Appear key={lesson.slug} index={Math.min(index, 8)}>
                  <JaLessonCard lesson={lesson} en={en} meta={vocabMeta(lesson)} thumb={JA_SET_ART[lesson.slug] ?? thumb} />
                </Appear>
              ))}
            </Grid>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

/** Đầu trang một bài Nhật: banner, tên bài, số từ và loại bài (hội thoại hoặc từ riêng lẻ). */
export function JaLessonHero({ title, vocab, wordCount, scene, pct }: { title: string; vocab: boolean; wordCount: number; scene?: number; pct?: number }) {
  const { L } = useL();
  return (
    <JaIntroHero
      banner={ZH_V4.ja.banner}
      side={scene}
      decor={vocab ? JA_STICKER.hanko : JA_STICKER.daruma}
      eyebrow={vocab ? L('Từ riêng lẻ · Tiếng Nhật', 'Single words · Japanese') : L('Hội thoại · Tiếng Nhật', 'Dialogue · Japanese')}
      title={title}
      chips={[L(`${wordCount} từ`, `${wordCount} words`), vocab ? L('Học từng từ', 'Word by word') : L('Theo tình huống', 'By scene')]}
      footer={pct === undefined ? null : <JaProgressBar pct={pct} />}
    />
  );
}

/** Thanh tiến độ vàng kim: đã học bao nhiêu phần trăm bộ. */
export function JaProgressBar({ pct }: { pct: number }) {
  const { L } = useL();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <View style={{ marginTop: 10, gap: 6, maxWidth: 560 }}>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(255,249,236,0.22)', borderWidth: 1, borderColor: JA.gold, overflow: 'hidden' }}>
        <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: JA.gold }} />
      </View>
      <Text className="font-strong text-label" style={{ color: '#F5E3B0' }}>
        {L(`Đã học ${clamped}%`, `${clamped}% studied`)}
      </Text>
    </View>
  );
}

/** Nền hoạ tiết mờ phía sau trang bài Nhật (ảnh phố Nhật, độ tương phản thấp). */
export function JaPageBackdrop() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -10, left: -30, right: -30, bottom: 0, opacity: 0.16 }}>
      <Image source={ZH_V4.ja.bg} contentFit="cover" style={StyleSheet.absoluteFill} />
    </View>
  );
}

/**
 * Thẻ cách luyện / trạng thái kiểu Nhật: nền kem có tranh sticker ở giữa, viền vàng, bốn góc hoa anh đào,
 * vạch ngang seigaiha dưới tranh, tiêu đề xanh rừng, nhãn và mũi tên.
 */
export function JaTile({
  art,
  title,
  sub,
  chip,
  value,
  onPress,
  disabled = false,
  minHeight = 230,
}: {
  art?: number;
  title: string;
  sub?: string;
  chip?: string;
  value?: number | string;
  onPress: () => void;
  disabled?: boolean;
  minHeight?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
        minHeight,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: hovered ? JA.gold : JA.goldLine,
        backgroundColor: JA.card,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.98 : hovered ? 1.012 : 1 }],
        shadowColor: JA.green,
        shadowOpacity: hovered ? 0.2 : 0.08,
        shadowRadius: hovered ? 16 : 9,
        shadowOffset: { width: 0, height: 6 },
      })}
    >
      <View style={{ height: Math.round(minHeight * 0.52), overflow: 'hidden' }}>
        <LinearGradient colors={['#E6F1E0', '#F7EBCB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {art ? (
          <Image source={art} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: '16%', right: '16%', top: '12%', bottom: '12%' }} />
        ) : null}
        <ZhLevelCorners source={ZH_V4.ja.corner} c={40} />
        {value !== undefined ? (
          <View style={{ position: 'absolute', right: 12, top: 12, minWidth: 40, height: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,249,236,0.96)', borderWidth: 1, borderColor: JA.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-heavy text-label" style={{ color: JA.green2 }}>{value}</Text>
          </View>
        ) : null}
      </View>
      <Image source={ZH_V4.ja.frameH} contentFit="contain" pointerEvents="none" style={{ width: '100%', height: 16, marginTop: 8 }} />
      <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14, gap: 4 }}>
        <Text className="font-heavy text-cardTitle" style={{ color: JA.green }} numberOfLines={2}>
          {title}
        </Text>
        {sub ? (
          <Text className="font-sans text-label" style={{ color: JA.ink2, lineHeight: 17 }} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          {chip ? (
            <View style={{ paddingHorizontal: 10, height: 24, borderRadius: 999, backgroundColor: JA.goldSoft, borderWidth: 1, borderColor: JA.gold, justifyContent: 'center' }}>
              <Text className="font-strong text-label" style={{ color: JA.green }}>{chip}</Text>
            </View>
          ) : <View />}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: JA.green2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 16 }}>→</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Một từ trong bài: chữ lớn xanh rừng, phiên âm vàng, nghĩa, nút lưu và ví dụ mở ra khi bấm. */
export function JaWordRow({ word, saved, onSave }: { word: StudyWord; saved: boolean; onSave: () => void }) {
  const { L } = useL();
  const [open, setOpen] = React.useState(false);
  const hasDetails = Boolean(word.example || word.collocation);
  return (
    <View style={{ borderRadius: 18, borderWidth: 1.5, borderColor: JA.goldLine, backgroundColor: JA.card, padding: 14, gap: 8, shadowColor: JA.green, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
            <Text className="font-heavy text-cardTitle" style={{ color: JA.green }}>{word.word}</Text>
            {word.romanization ? <Text className="font-sans text-label" style={{ color: '#A07A2C' }}>{word.romanization}</Text> : null}
            {word.pos ? (
              <View style={{ paddingHorizontal: 8, height: 20, borderRadius: 999, backgroundColor: JA.greenSoft, justifyContent: 'center' }}>
                <Text className="font-strong text-label" style={{ color: JA.green2 }}>{word.pos}</Text>
              </View>
            ) : null}
          </View>
          {word.meaningVi ? <Text className="font-sans text-body" style={{ color: JA.ink }}>{word.meaningVi}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasDetails ? (
            <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={{ height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: JA.gold, justifyContent: 'center' }}>
              <Text className="font-strong text-label" style={{ color: JA.green2 }}>{open ? L('Thu gọn', 'Collapse') : L('Ví dụ', 'Example')}</Text>
            </Pressable>
          ) : null}
          {saved ? (
            <Text className="font-strong text-label" style={{ color: JA.green2 }}>✓ {L('Đã lưu', 'Saved')}</Text>
          ) : (
            <Pressable accessibilityRole="button" onPress={onSave} style={{ height: 30, paddingHorizontal: 14, borderRadius: 999, backgroundColor: JA.green2, justifyContent: 'center' }}>
              <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>{L('Lưu', 'Save')}</Text>
            </Pressable>
          )}
        </View>
      </View>
      {open && hasDetails ? (
        <View style={{ borderTopWidth: 1, borderColor: JA.goldLine, paddingTop: 8, gap: 6 }}>
          {word.example ? <ExampleSentence example={word.example} word={word.word} language="ja" /> : null}
          {word.collocation ? <Text className="font-sans text-label" style={{ color: JA.ink2 }}>{word.collocation}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

/** Các bài khác cùng chủ đề (unit): người học chuyển bài mà không phải quay lại danh sách. */
export function JaSiblingLessons({
  lessons,
  currentSlug,
  title,
  subtitle,
}: {
  lessons: BookVocabLesson[];
  currentSlug: string;
  title: string;
  subtitle: string;
}) {
  const { en } = useL();
  return (
    <View>
      <JaSectionTitle title={title} subtitle={subtitle} />
      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
        {lessons.map((lesson) => {
          const active = lesson.slug === currentSlug;
          const vocab = isVocabLesson(lesson.slug);
          return (
            <Pressable
              key={lesson.slug}
              accessibilityRole="link"
              onPress={() => router.push(`/vocabulary/topic/${lesson.slug}` as never)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: active || hovered ? JA.gold : JA.goldLine,
                backgroundColor: active ? JA.goldSoft : JA.card,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: JA.gold, backgroundColor: vocab ? JA.greenSoft : JA.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: JA.green, fontSize: 18, fontWeight: '700' }}>{vocab ? '語' : '話'}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-strong text-label" style={{ color: JA.ink }} numberOfLines={2}>
                  {en ? lesson.name : lesson.nameVi}
                </Text>
                <Text className="font-sans text-label" style={{ color: JA.ink2 }}>{lesson.words.length} {en ? 'words' : 'từ'}</Text>
              </View>
              {active ? <Text className="font-strong text-label" style={{ color: JA.green2 }}>●</Text> : null}
            </Pressable>
          );
        })}
      </Grid>
    </View>
  );
}
