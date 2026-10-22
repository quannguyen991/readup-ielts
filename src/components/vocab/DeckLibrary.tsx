import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon, SectionHeader } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG, notebookDeck } from '@/data/study-decks';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS, LISTENING_SECTIONS } from '@/data/vocab-listening';
import { GLOBAL_SUCCESS_DECKS, VOCAB_TOPICS } from '@/data/vocab-topics';
import { DESTINATION_DECKS } from '@/data/destination-vocab';
import { OXFORD_TOPIC_DECKS } from '@/data/oxford-topics-decks';
import { unitsFor } from '@/data/intl/units';
import { DAILY_TALK_TOPICS } from '@/data/vocab-daily';
import { byRecent, deckProgress, fold, isInProgress, type DeckProgress } from '@/services/vocab/deck-library';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { isKnown, useIntlStore } from '@/store/useIntlStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { bi, useL } from '@/i18n/useL';

import { DeckActionCard, DeckCard } from './DeckCard';
import { VOCAB_COVERS } from '@/data/vocab-covers';
import { deckLook, type DeckLook, type DeckSource } from './deck-style';

/**
 * THƯ VIỆN BỘ TỪ — trang đầu của Quiz từ vựng (và trang Từ vựng chủ đề, lọc sẵn
 * nhóm IELTS). CHỌN BỘ TRƯỚC: mỗi bộ là một thẻ có tiến độ, lần học cuối, số từ;
 * bấm vào là sang trang của bộ, nơi có đủ các cách luyện.
 *
 * Bộ đang học đứng đầu, xếp theo lần học gần nhất — người quay lại app thường
 * muốn học tiếp bộ hôm qua, không muốn dò lại trong 80 bộ.
 */

export type LibraryFilter = 'all' | 'learning' | DeckSource;

type LibDeck = {
  slug: string;
  title: string;
  subtitle?: string;
  words: readonly { word: string }[];
  look: DeckLook;
  haystack: string;
  /** Tên hiển thị khi giao diện tiếng Anh (bộ người dùng tự đặt tên và bài SAT thì giữ nguyên). */
  en?: { title: string; subtitle?: string };
  /** Đường dẫn riêng (unit TOEIC/TOEFL mở trang unit thay vì trang bộ từ). */
  href?: string;
  /** Kỳ thi của unit: tiến độ lấy từ danh sách "đã thuộc" chứ không từ bảng học theo chủ đề. */
  knownExam?: 'toeic' | 'toefl';
  /** Ảnh bìa của bộ (nếu đã có), xem `VOCAB_COVERS`. */
  cover?: string;
};

const FILTERS: { key: LibraryFilter; label: string; labelEn: string; icon: IconName }[] = [
  { key: 'all', label: 'Tất cả', labelEn: 'All', icon: 'grid' },
  { key: 'learning', label: 'Đang học', labelEn: 'In progress', icon: 'flame' },
  { key: 'mine', label: 'Của bạn', labelEn: 'Yours', icon: 'bookmark' },
  { key: 'oxford', label: 'Oxford 3000', labelEn: 'Oxford 3000', icon: 'book' },
  { key: 'ielts', label: 'Chủ đề IELTS', labelEn: 'IELTS topics', icon: 'book' },
  { key: 'globalSuccess', label: 'Global Success 10–12', labelEn: 'Global Success 10–12', icon: 'letters' },
  { key: 'vfi', label: 'Vocabulary for IELTS', labelEn: 'Vocabulary for IELTS', icon: 'letters' },
  { key: 'vfia', label: 'Vocabulary for IELTS Advanced', labelEn: 'Vocabulary for IELTS Advanced', icon: 'letters' },
  { key: 'listening', label: 'Nghe IELTS', labelEn: 'IELTS listening', icon: 'volume' },
  { key: 'destination', label: 'Destination B1–C2', labelEn: 'Destination B1–C2', icon: 'book' },
  { key: 'satMath', label: 'SAT Math', labelEn: 'SAT Math', icon: 'grid' },
  { key: 'satVerbal', label: 'SAT Verbal', labelEn: 'SAT Verbal', icon: 'letters' },
  { key: 'daily', label: 'Giao tiếp hằng ngày', labelEn: 'Everyday talk', icon: 'letters' },
  { key: 'toeic', label: 'TOEIC', labelEn: 'TOEIC', icon: 'book' },
  { key: 'toefl', label: 'TOEFL', labelEn: 'TOEFL', icon: 'book' },
];

const SECTION: Record<DeckSource, { title: string; titleEn: string; subtitle: string; subtitleEn: string; icon: IconName }> = {
  mine: { title: 'Của bạn', titleEn: 'Yours', subtitle: 'Sổ từ bạn lưu khi đọc và các bộ bạn tự tạo', subtitleEn: 'Words you saved while reading, plus decks you made', icon: 'bookmark' },
  oxford: { title: 'Chủ đề Oxford 3000', titleEn: 'Oxford 3000 Topics', subtitle: '18 chủ đề từ vựng cốt lõi phân theo cấp độ A1–C1', subtitleEn: '18 core topics categorized with CEFR levels A1–C1', icon: 'book' },
  ielts: { title: 'Chủ đề IELTS', titleEn: 'IELTS topics', subtitle: 'Mỗi bộ xếp từ dễ tới khó theo band', subtitleEn: 'Each deck goes from easy to hard by band', icon: 'book' },
  globalSuccess: { title: 'Global Success 10–12', titleEn: 'Global Success 10–12', subtitle: '30 unit theo lớp, mỗi unit có thêm 30 từ nâng cao', subtitleEn: '30 grade units, each with 30 extra advanced words', icon: 'letters' },
  vfi: { title: 'Vocabulary for IELTS', titleEn: 'Vocabulary for IELTS', subtitle: '20 unit theo giáo trình, mỗi unit thêm 20 từ mở rộng', subtitleEn: '20 units in book order, each with 20 extra words', icon: 'letters' },
  vfia: { title: 'Vocabulary for IELTS Advanced', titleEn: 'Vocabulary for IELTS Advanced', subtitle: '20 unit nâng cao, mỗi unit thêm 15 từ mở rộng', subtitleEn: '20 advanced units, each with 15 extra words', icon: 'letters' },
  listening: { title: 'Nghe IELTS', titleEn: 'IELTS listening', subtitle: 'Chia theo từng Section của đề', subtitleEn: 'Grouped by test Section', icon: 'volume' },
  destination: { title: 'Destination B1–C2', titleEn: 'Destination B1–C2', subtitle: 'Học từ vựng theo unit, kèm quiz và bài luyện', subtitleEn: 'Vocabulary by unit with quizzes and practice', icon: 'book' },
  satMath: { title: 'Từ vựng SAT Math', titleEn: 'SAT Math vocabulary', subtitle: 'Từ hay gặp trong đề Toán, chia bài ngắn', subtitleEn: 'Common words in Math questions, in short lessons', icon: 'grid' },
  satVerbal: { title: 'Từ vựng SAT Verbal', titleEn: 'SAT Verbal vocabulary', subtitle: 'Từ nối, sắc thái, từ trong ngữ cảnh', subtitleEn: 'Transitions, nuance and words in context', icon: 'letters' },
  daily: { title: 'Giao tiếp hằng ngày', titleEn: 'Everyday talk', subtitle: '20 chủ đề, mỗi từ kèm ví dụ và ngữ cảnh dùng', subtitleEn: '20 topics, each word with an example and where to use it', icon: 'letters' },
  toeic: { title: 'TOEIC', titleEn: 'TOEIC', subtitle: 'Mỗi unit 10 từ, đánh dấu từ đã thuộc để theo dõi tiến độ', subtitleEn: 'Each unit has 10 words; mark the ones you know to track progress', icon: 'book' },
  toefl: { title: 'TOEFL', titleEn: 'TOEFL', subtitle: 'Mỗi unit 10 từ, đánh dấu từ đã thuộc để theo dõi tiến độ', subtitleEn: 'Each unit has 10 words; mark the ones you know to track progress', icon: 'book' },
};

const INTL_ACCENT: Record<'toeic' | 'toefl' | 'daily', readonly [string, string]> = {
  daily: ['#ECFDF5', '#047857'],
  toeic: ['#E0F2FE', '#0369A1'],
  toefl: ['#FCE7F3', '#BE185D'],
};

/** Unit TOEIC/TOEFL thành thẻ bộ từ: nhãn TOEIC/TOEFL, bấm vào mở đúng trang unit. */
function intlDecks(exam: 'toeic' | 'toefl'): LibDeck[] {
  const label = exam.toUpperCase();
  return unitsFor(exam).map((u) => {
    const title = `Unit ${u.index} · ${bi(u.title, 'vi')}`;
    const look: DeckLook = { source: exam, sourceLabel: label, sourceLabelEn: label, accent: INTL_ACCENT[exam], icon: 'book' };
    return {
      slug: `${exam}-unit-${u.index}`,
      title,
      subtitle: u.words.slice(0, 3).join(', '),
      words: u.words.map((word) => ({ word })),
      look,
      en: { title: `Unit ${u.index} · ${bi(u.title, 'en')}` },
      haystack: fold(`${title} ${label} ${u.words.join(' ')}`),
      href: `/${exam}/vocab/${u.index}`,
      knownExam: exam,
    };
  });
}

type StageMap = Parameters<typeof deckProgress>[1];
/** Bộ đánh dấu "đã thuộc" → mức thuộc (2) để dùng chung thanh tiến độ với các bộ khác. */
function knownStages(d: LibDeck, known: Record<string, true>): StageMap {
  const out: Record<string, 2> = {};
  for (const w of d.words) if (d.knownExam && isKnown(known, d.knownExam, w.word)) out[w.word] = 2;
  return out;
}

const LISTENING_SECTION_OF = new Map(LISTENING_DECKS.map((d) => [d.slug, d.section]));

const WEB = Platform.OS === 'web';
const LEARNING_PREVIEW = 6;
/** Số bộ hiện mỗi lần: vẽ cả trăm thẻ có hiệu ứng cùng lúc làm đổi tab bị khựng. */
const PAGE = 12;
/** Ở tab Tất cả, mỗi nhóm chỉ xem trước bấy nhiêu bộ. */
const PREVIEW_ALL = 8;

function lib(slug: string, title: string, words: readonly { word: string }[], subtitle?: string, en?: LibDeck['en']): LibDeck {
  const look = deckLook(slug);
  return { slug, title, subtitle, words, look, en, cover: VOCAB_COVERS[slug], haystack: fold(`${title} ${subtitle ?? ''} ${look.sourceLabel} ${en?.title ?? ''} ${look.sourceLabelEn}`) };
}

const STATIC_DECKS: LibDeck[] = [
  ...OXFORD_TOPIC_DECKS.map((t) => ({
    slug: t.slug,
    title: t.title,
    subtitle: t.titleEn,
    words: t.words,
    look: {
      source: 'oxford' as const,
      sourceLabel: 'Oxford 3000',
      sourceLabelEn: 'Oxford 3000',
      accent: ['#E0E7FF', '#4338CA'] as const,
      icon: 'book' as const,
    },
    en: { title: t.titleEn },
    cover: t.cover,
    haystack: fold(`${t.title} ${t.titleEn} oxford 3000 ${t.words.map((w) => w.word).join(' ')}`),
  })),
  ...VOCAB_TOPICS.map((t) => lib(t.slug, t.nameVi, t.words, t.name, { title: t.name })),
  // Unit titles already identify the lesson; omit the long source/enrichment blurb on each card.
  ...GLOBAL_SUCCESS_DECKS.map((t) => lib(t.slug, t.nameVi, t.words, undefined, { title: t.name })),
  ...VFI_DECKS.map((t) => lib(t.slug, t.name, t.words, t.blurb, { title: t.name })),
  ...VFIA_DECKS.map((t) => lib(t.slug, t.name, t.words, t.blurb, { title: t.name })),
  ...LISTENING_DECKS.map((t) => lib(t.slug, t.nameVi, t.words, t.name, { title: t.name })),
  ...DESTINATION_DECKS.map((t) => lib(t.slug, t.nameVi, t.words, t.name, { title: t.name })),
  ...SAT_MATH_VOCAB_LESSONS.map((l) => lib(l.slug, l.title, l.words)),
  ...SAT_VERBAL_VOCAB_LESSONS.map((l) => lib(l.slug, l.title, l.words)),
  ...intlDecks('toeic'),
  ...intlDecks('toefl'),
  ...DAILY_TALK_TOPICS.map((t) => ({ slug: t.slug, title: t.nameVi, subtitle: t.blurb, words: t.words, look: { source: 'daily' as const, sourceLabel: 'Giao tiếp hằng ngày', sourceLabelEn: 'Everyday talk', accent: INTL_ACCENT.daily, icon: 'letters' as const }, en: { title: t.name, subtitle: t.blurb }, cover: VOCAB_COVERS[t.slug], haystack: fold(`${t.nameVi} ${t.name} giao tiếp hằng ngày ${t.words.map((w) => w.word).join(' ')}`) })),
];

export function DeckLibrary({ initialFilter = 'all' }: { initialFilter?: LibraryFilter }) {
  const { L, en } = useL();
  const entries = useVocabStore((s) => s.entries);
  const customMap = useCustomDeckStore((s) => s.decks);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const known = useIntlStore((s) => s.known);
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const now = useMemo(() => new Date(), []);

  const notebook = useMemo(() => notebookDeck(Object.values(entries)), [entries]);
  const notebookReady = notebook.words.length >= 4;

  const decks = useMemo<LibDeck[]>(() => {
    const custom = Object.values(customMap)
      .filter((d) => d.words.length >= 4)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((d) => lib(`${CUSTOM_PREFIX}${d.id}`, d.name, d.words, d.words.slice(0, 3).map((w) => w.word).join(', ')));
    const mine = [...(notebookReady ? [lib(NOTEBOOK_SLUG, 'Sổ từ của bạn', notebook.words, 'từ bạn lưu khi đọc', { title: 'Your notebook', subtitle: 'words you saved while reading' })] : []), ...custom];
    return [...mine, ...STATIC_DECKS];
  }, [customMap, notebook, notebookReady]);

  const progress = useMemo(() => {
    const map = new Map<string, DeckProgress>();
    for (const d of decks) map.set(d.slug, deckProgress(d.words, d.knownExam ? knownStages(d, known) : stages[d.slug], lastAt?.[d.slug]));
    return map;
  }, [decks, stages, lastAt, known]);
  const prog = (d: LibDeck) => progress.get(d.slug)!;

  const learning = useMemo(() => byRecent(decks.filter((d) => isInProgress(progress.get(d.slug)!)), (d) => progress.get(d.slug)!.lastAt), [decks, progress]);
  const count = (f: LibraryFilter) => (f === 'all' ? decks.length : f === 'learning' ? learning.length : decks.filter((d) => d.look.source === f).length);

  const needle = fold(query);
  const results = needle ? decks.filter((d) => d.haystack.includes(needle)) : [];

  const open = (d: LibDeck) => router.push((d.href ?? `/vocabulary/topic/${d.slug}`) as never);
  const card = (d: LibDeck, i: number) => (
    <Appear key={d.slug} index={Math.min(i, 8)} style={{ height: '100%' }}>
      <DeckCard title={en && d.en ? d.en.title : d.title} subtitle={en && d.en ? d.en.subtitle : d.subtitle} progress={prog(d)} accent={d.look.accent} icon={d.look.icon} sourceLabel={en ? d.look.sourceLabelEn : d.look.sourceLabel} cover={d.cover} now={now} onPress={() => open(d)} />
    </Appear>
  );
  const createCard = (
    <Appear key="create" index={2} style={{ height: '100%' }}>
      <DeckActionCard title={L('Tạo bộ từ bài bạn thích', 'Make a deck from any text')} detail={L('Dán một đoạn tiếng Anh bất kỳ, app lọc ra từ đáng học thành bộ riêng.', 'Paste any English passage and the app picks out the words worth learning.')} icon="plus" onPress={() => router.push('/vocabulary/import' as never)} />
    </Appear>
  );
  const notebookHint = notebookReady ? null : (
    <Appear key="notebook-hint" index={1} style={{ height: '100%' }}>
      <DeckActionCard title={L('Sổ từ của bạn', 'Your notebook')} detail={L(`Mới có ${notebook.words.length} từ. Chạm vào từ khi đọc bài để lưu, đủ 4 từ là học được.`, `Only ${notebook.words.length} words so far. Tap words while reading to save them — 4 words and you can start studying.`)} icon="bookmark" onPress={() => router.push('/library' as never)} />
    </Appear>
  );

  const grid = (items: React.ReactNode[]) => (
    <View className="mt-3">
      <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
        {items}
      </Grid>
    </View>
  );
  const bySource = (s: DeckSource) => decks.filter((d) => d.look.source === s);
  /** Nút ở cuối lưới: ở tab Tất cả thì mở hẳn tab của nhóm, ở tab lẻ thì hiện thêm bộ. */
  const moreFor = (s: DeckSource | null, total: number, shown: number) => {
    if (total <= shown) return null;
    const toTab = filter === 'all' && s !== null;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => (toTab && s ? setFilter(s) : setLimit((n) => n + PAGE))}
        className="mt-4 self-center rounded-pill px-4 py-2"
        style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F0FB' }}
      >
        <Text className="font-strong text-label" style={{ color: color.primary }}>
          {toTab ? L(`Xem cả ${total} bộ →`, `See all ${total} decks →`) : L(`Xem thêm (còn ${total - shown} bộ)`, `Show more (${total - shown} left)`)}
        </Text>
      </Pressable>
    );
  };
  /** Nội dung một nhóm; bộ Nghe chia tiếp theo từng Section của đề, mỗi Section một dòng tiêu đề. */
  const sourceBody = (s: DeckSource) => {
    const cap = filter === 'all' ? PREVIEW_ALL : limit;
    const all = bySource(s);
    const shown = all.slice(0, cap);
    if (s === 'mine') {
      return (
        <>
          {grid([...shown.map(card), notebookHint, createCard].filter(Boolean))}
          {moreFor(s, all.length, shown.length)}
        </>
      );
    }
    if (s !== 'listening') {
      return (
        <>
          {grid(shown.map(card))}
          {moreFor(s, all.length, shown.length)}
        </>
      );
    }
    return (
      <>
        {LISTENING_SECTIONS.map((sec) => {
          const items = shown.filter((d) => LISTENING_SECTION_OF.get(d.slug) === sec.key);
          if (!items.length) return null;
          return (
            <View key={String(sec.key)} className="mt-5">
              <View className="flex-row flex-wrap items-baseline gap-x-2">
                <Text className="font-strong text-body text-ink">{L(sec.title, sec.titleEn)}</Text>
                <Text className="font-sans text-label text-muted">{L(sec.subtitle, sec.subtitleEn)}</Text>
              </View>
              {grid(items.map(card))}
            </View>
          );
        })}
        {moreFor(s, all.length, shown.length)}
      </>
    );
  };

  return (
    <View>
      {/* Tìm + lọc */}
      <View className="mt-5 flex-row items-center gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-2xl bg-white px-3.5" style={{ height: 48, borderWidth: 1.5, borderColor: query ? color.primary : '#F3F0FB', ...(WEB ? ({ transition: 'border-color 200ms ease' } as object) : null) }}>
          <Icon name="search" size={17} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setLimit(PAGE);
            }}
            placeholder={L('Tìm bộ từ theo tên… (gõ không dấu cũng được)', 'Search decks by name…')}
            placeholderTextColor="#94A3B8"
            accessibilityLabel={L('Tìm bộ từ', 'Search decks')}
            className="min-w-0 flex-1 font-sans text-body text-ink"
            style={WEB ? ({ outlineStyle: 'none' } as object) : undefined}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá tìm kiếm', 'Clear search')} onPress={() => setQuery('')} className="h-7 w-7 items-center justify-center rounded-pill bg-surfaceAlt">
              <Icon name="close" size={14} color="#64748B" strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2" accessibilityRole="tablist">
        {FILTERS.map((f) => {
          const on = !needle && filter === f.key;
          const n = count(f.key);
          if (f.key === 'learning' && n === 0) return null;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => {
                setFilter(f.key);
                setQuery('');
                setLimit(PAGE);
              }}
              className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
              style={{
                backgroundColor: on ? color.primary : '#FFFFFF',
                borderWidth: 1,
                borderColor: on ? color.primary : '#F3F0FB',
                ...(WEB ? ({ transition: 'background-color 200ms ease, border-color 200ms ease' } as object) : null),
              }}
            >
              <Icon name={f.icon} size={14} color={on ? '#FFFFFF' : '#64748B'} strokeWidth={2} />
              <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                {L(f.label, f.labelEn)}
              </Text>
              <Text className="font-sans text-label" style={{ color: on ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CrossFade swapKey={needle ? 'search' : filter}>
        <View>
          {needle ? (
            <View className="mt-5">
              <SectionHeader title={L('Kết quả tìm', 'Search results')} subtitle={results.length ? L(`${results.length} bộ khớp “${query.trim()}”`, `${results.length} decks match “${query.trim()}”`) : L('Không có bộ nào khớp', 'No matching decks')} icon="search" />
              {results.length ? grid(results.slice(0, limit).map(card)) : null}
              {moreFor(null, results.length, Math.min(limit, results.length))}
            </View>
          ) : filter === 'all' ? (
            <>
              {learning.length > 0 ? (
                <View className="mt-5">
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <SectionHeader title={L('Bộ từ đang học', 'Decks in progress')} subtitle={L('Học gần nhất đứng đầu', 'Most recent first')} icon="flame" iconTone="warning" />
                    </View>
                    {learning.length > LEARNING_PREVIEW ? (
                      <Pressable accessibilityRole="button" onPress={() => setFilter('learning')}>
                        <Text className="font-strong text-label" style={{ color: color.primary }}>
                          {L(`Xem cả ${learning.length} bộ →`, `See all ${learning.length} decks →`)}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {grid(learning.slice(0, LEARNING_PREVIEW).map(card))}
                </View>
              ) : null}
              {(['mine', 'daily', 'ielts', 'toeic', 'toefl', 'globalSuccess', 'vfi', 'vfia', 'listening', 'destination', 'satMath', 'satVerbal'] as const).map((s) => (
                <View key={s} className="mt-7">
                  <SectionHeader title={L(SECTION[s].title, SECTION[s].titleEn)} subtitle={L(SECTION[s].subtitle, SECTION[s].subtitleEn)} icon={SECTION[s].icon} />
                  {sourceBody(s)}
                </View>
              ))}
            </>
          ) : filter === 'learning' ? (
            <View className="mt-5">
              <SectionHeader title={L('Bộ từ đang học', 'Decks in progress')} subtitle={L('Học gần nhất đứng đầu', 'Most recent first')} icon="flame" iconTone="warning" />
              {grid(learning.slice(0, limit).map(card))}
              {moreFor(null, learning.length, Math.min(limit, learning.length))}
            </View>
          ) : (
            <View className="mt-5">
              <SectionHeader title={L(SECTION[filter].title, SECTION[filter].titleEn)} subtitle={L(SECTION[filter].subtitle, SECTION[filter].subtitleEn)} icon={SECTION[filter].icon} />
              {sourceBody(filter)}
            </View>
          )}
        </View>
      </CrossFade>
    </View>
  );
}
