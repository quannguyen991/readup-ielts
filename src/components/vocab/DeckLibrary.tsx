import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon, SectionHeader } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG, notebookDeck, splitLevelSlug } from '@/data/study-decks';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS, LISTENING_SECTIONS } from '@/data/vocab-listening';
import { BOOK_VOCAB_BOOKS, BOOK_VOCAB_DECKS, GLOBAL_SUCCESS_DECKS, VOCAB_TOPICS } from '@/data/vocab-topics';
import { DESTINATION_DECKS } from '@/data/destination-vocab';
import { OXFORD_TOPIC_DECKS } from '@/data/oxford-topics-decks';
import { unitsFor } from '@/data/intl/units';
import { DAILY_TALK_TOPICS } from '@/data/vocab-daily';
import { STUDY4_CATEGORY_INFO, STUDY4_CATEGORY_ORDER, STUDY4_DECKS, type Study4Category } from '@/data/study4-vocab';
import { byRecent, deckProgress, fold, isInProgress, mergeLastAtByBase, mergeStagesByBase, type DeckProgress } from '@/services/vocab/deck-library';
import { studiedLemmas } from '@/services/vocab/topic-fsrs';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { isKnown, useIntlStore } from '@/store/useIntlStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { bi, useL } from '@/i18n/useL';

import { DeckActionCard, DeckCard } from './DeckCard';
import { SourceCard } from './SourceCard';
import { UnitTile } from './UnitTile';
import { BookBanner, BookGroupHead, CoverShelf } from './BookShelf';
import { BOOK_NAMES, SOURCE_BOOKS, bookIdOfDeck, hasOwnCover } from '@/data/book-covers';
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
  /** The deck belongs to a book and is shown inside that book's detail page. */
  isBookTopic?: boolean;
  /** Bộ gộp nhiều buổi (cấp HSK, giáo trình tiếng Nhật): tiến độ lấy từ tổng các buổi này. */
  lessonSlugs?: readonly string[];
  study4Category?: Study4Category;
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
  { key: 'books', label: 'Sách từ vựng', labelEn: 'Vocabulary books', icon: 'book' },
  { key: 'zh', label: 'Tiếng Trung', labelEn: 'Chinese', icon: 'letters' },
  { key: 'ja', label: 'Tiếng Nhật', labelEn: 'Japanese', icon: 'letters' },
  { key: 'toeic', label: 'TOEIC', labelEn: 'TOEIC', icon: 'book' },
  { key: 'toefl', label: 'TOEFL', labelEn: 'TOEFL', icon: 'book' },
  { key: 'study4', label: 'Bộ bổ trợ', labelEn: 'More collections', icon: 'book' },
];

const PERSONAL = FILTERS.filter((f) => f.key === 'all' || f.key === 'learning' || f.key === 'mine');
const SOURCES = FILTERS.filter((f) => !PERSONAL.includes(f));

/** Sách tiếng Anh (tiếng Trung và tiếng Nhật có nhóm riêng). */
const ENGLISH_BOOKS = BOOK_VOCAB_BOOKS.filter((b) => b.language !== 'zh' && b.language !== 'ja');

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
  books: { title: 'Sách từ vựng', titleEn: 'Vocabulary books', subtitle: `${ENGLISH_BOOKS.length} sách tiếng Anh; chia theo chủ đề và unit tối đa 50 từ`, subtitleEn: `${ENGLISH_BOOKS.length} English books, split into topics and units of up to 50 words`, icon: 'book' },
  zh: { title: 'Tiếng Trung · HSK 3.0', titleEn: 'Chinese · HSK 3.0', subtitle: '7 cấp HSK, mỗi cấp chia buổi học tối đa 50 từ', subtitleEn: 'Seven HSK levels, each split into lessons of up to 50 words', icon: 'letters' },
  ja: { title: 'Tiếng Nhật · Irodori', titleEn: 'Japanese · Irodori', subtitle: '4 giáo trình giao tiếp, mỗi giáo trình 9 chủ đề', subtitleEn: 'Four conversation courses, 9 topics each', icon: 'letters' },
  toeic: { title: 'TOEIC', titleEn: 'TOEIC', subtitle: 'Mỗi unit 10 từ, đánh dấu từ đã thuộc để theo dõi tiến độ', subtitleEn: 'Each unit has 10 words; mark the ones you know to track progress', icon: 'book' },
  toefl: { title: 'TOEFL', titleEn: 'TOEFL', subtitle: 'Mỗi unit 10 từ, đánh dấu từ đã thuộc để theo dõi tiến độ', subtitleEn: 'Each unit has 10 words; mark the ones you know to track progress', icon: 'book' },
  study4: { title: 'Bộ từ bổ trợ', titleEn: 'More vocabulary collections', subtitle: '11 bộ chia theo IELTS, TOEIC, SAT, học thuật và thành ngữ', subtitleEn: '11 collections grouped by IELTS, TOEIC, SAT, academic vocabulary and idioms', icon: 'book' },
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
const PREVIEW_ALL = 4;

function lib(slug: string, title: string, words: readonly { word: string }[], subtitle?: string, en?: LibDeck['en']): LibDeck {
  const look = deckLook(slug);
  return { slug, title, subtitle, words, look, en, cover: VOCAB_COVERS[slug], haystack: fold(`${title} ${subtitle ?? ''} ${look.sourceLabel} ${en?.title ?? ''} ${look.sourceLabelEn}`) };
}

/** Tiếng Trung: mỗi cấp HSK là một bộ, bìa công bút, bấm vào mở danh sách buổi của cấp đó. */
function zhLevelDecks(): LibDeck[] {
  return BOOK_VOCAB_BOOKS.filter((b) => b.language === 'zh').flatMap((book) =>
    book.topics.map((topic) => ({
      ...lib(topic.slug, topic.nameVi, topic.words, `${topic.words.length.toLocaleString('vi-VN')} từ · ${topic.lessons.length} buổi học`, { title: topic.name }),
      look: deckLook(topic.slug),
      href: `/vocabulary/book/${book.slug}/${topic.slug}`,
      lessonSlugs: topic.lessons.map((l) => l.slug),
    })),
  );
}

/** Tiếng Nhật: mỗi giáo trình Irodori là một bộ, bấm vào mở danh sách chủ đề của giáo trình. */
function jaBookDecks(): LibDeck[] {
  return BOOK_VOCAB_BOOKS.filter((b) => b.language === 'ja').map((book) => {
    const level = book.nameVi.split(' · ').pop() ?? book.nameVi;
    return {
      ...lib(book.slug, `Irodori · ${level}`, book.words, `${book.topics.length} chủ đề · ${book.words.length.toLocaleString('vi-VN')} từ`, { title: `Irodori · ${level}` }),
      look: deckLook(book.slug),
      href: `/vocabulary/book/${book.slug}`,
      lessonSlugs: book.topics.flatMap((t) => t.lessons.map((l) => l.slug)),
    };
  });
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
  ...STUDY4_DECKS.map((t) => ({
    ...lib(t.slug, t.nameVi, t.words, t.blurb, { title: t.name }),
    study4Category: t.category,
    haystack: fold(`${t.nameVi} ${t.name} ${t.blurb} ${STUDY4_CATEGORY_INFO[t.category].vi} ${STUDY4_CATEGORY_INFO[t.category].en} ${t.words.map((w) => w.word).join(' ')}`),
  })),
  ...ENGLISH_BOOKS.map((book) => ({
    ...lib(book.slug, book.nameVi, book.words, `${book.topics.length} chủ đề · ${book.words.length.toLocaleString('vi-VN')} từ`, { title: book.name }),
    look: { source: 'books' as const, sourceLabel: 'Sách từ vựng', sourceLabelEn: 'Vocabulary books', accent: ['#EDE9FE', '#6A4BD9'] as const, icon: 'book' as const },
    href: `/vocabulary/book/${book.slug}`,
  })),
  ...zhLevelDecks(),
  ...jaBookDecks(),
  ...BOOK_VOCAB_DECKS.map((t) => ({ ...lib(t.slug, t.nameVi, t.words, t.blurb, { title: t.name }), isBookTopic: true })),
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

const baseOfSlug = (slug: string) => splitLevelSlug(slug).base;

export function DeckLibrary({ initialFilter = 'all' }: { initialFilter?: LibraryFilter }) {
  const { L, en } = useL();
  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const customMap = useCustomDeckStore((s) => s.decks);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const known = useIntlStore((s) => s.known);
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const contentRef = useRef<View>(null);
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

  // Bộ nhiều cấp học qua `<bộ>--B1`…: gộp về bộ gốc để thẻ ở đây thấy đúng tiến độ đã học.
  const stagesByBase = useMemo(() => mergeStagesByBase(stages, baseOfSlug), [stages]);
  const lastAtByBase = useMemo(() => mergeLastAtByBase(lastAt ?? {}, baseOfSlug), [lastAt]);
  const studied = useMemo(() => studiedLemmas({ entries, cards }), [entries, cards]);
  const progress = useMemo(() => {
    const map = new Map<string, DeckProgress>();
    for (const d of decks) {
      if (d.lessonSlugs) {
        // Bộ gộp nhiều buổi: cộng tiến độ của mọi buổi, lần học gần nhất là lần muộn nhất.
        const merged: Record<string, NonNullable<StageMap>[string]> = {};
        let last: string | null = null;
        for (const s of d.lessonSlugs) {
          Object.assign(merged, stagesByBase[s] ?? {});
          const at = lastAtByBase[s];
          if (at && (!last || at > last)) last = at;
        }
        map.set(d.slug, deckProgress(d.words, merged, last, studied));
        continue;
      }
      map.set(d.slug, deckProgress(d.words, d.knownExam ? knownStages(d, known) : stagesByBase[d.slug], lastAtByBase[d.slug], d.knownExam ? undefined : studied));
    }
    return map;
  }, [decks, stagesByBase, lastAtByBase, known, studied]);
  const prog = (d: LibDeck) => progress.get(d.slug)!;

  const learning = useMemo(() => byRecent(decks.filter((d) => isInProgress(progress.get(d.slug)!)), (d) => progress.get(d.slug)!.lastAt), [decks, progress]);
  const count = (f: LibraryFilter) => (f === 'all' ? decks.length : f === 'learning' ? learning.length : f === 'books' ? ENGLISH_BOOKS.length : decks.filter((d) => d.look.source === f && !d.isBookTopic).length);

  const needle = fold(query);
  const inSource = !needle && SOURCES.some((f) => f.key === filter);
  const results = needle ? decks.filter((d) => d.haystack.includes(needle)) : [];

  const pick = (key: LibraryFilter) => {
    setFilter(key);
    setQuery('');
    setLimit(PAGE);
    // Lưới thẻ cao: chọn một nhóm thì đưa danh sách bộ của nhóm lên đầu màn.
    if (WEB && key !== 'all' && key !== 'learning' && key !== 'mine') requestAnimationFrame(() => (contentRef.current as unknown as HTMLElement | null)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
  };
  const open = (d: LibDeck) => router.push((d.href ?? `/vocabulary/topic/${d.slug}`) as never);
  const card = (d: LibDeck, i: number) => (
    <Appear key={d.slug} index={Math.min(i, 8)} style={{ height: '100%' }}>
      <UnitTile
        index={i}
        tag={inSource ? L(`Bộ ${i + 1}`, `Deck ${i + 1}`) : en ? d.look.sourceLabelEn : d.look.sourceLabel}
        title={en && d.en ? d.en.title : d.title}
        words={d.words.slice(0, 3).map((w) => w.word)}
        total={d.words.length}
        progress={prog(d)}
        onPress={() => open(d)}
      />
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
  const statsOf = (list: LibDeck[]) => {
    let total = 0;
    let mastered = 0;
    for (const d of list) {
      total += d.words.length;
      mastered += prog(d).mastered;
    }
    return { total, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
  };
  /** Đầu nhóm: nhóm có bìa dùng banner nền đêm (ở tab Tất cả, bấm bìa là mở nhóm); nhóm khác để tiêu đề thường. */
  const sourceHead = (s: DeckSource, inTab: boolean) => {
    const ids = SOURCE_BOOKS[s];
    if (!ids) return null;
    const list = bySource(s).filter((d) => !d.isBookTopic);
    const st = statsOf(list);
    const info = SECTION[s];
    return (
      <BookBanner
        ids={ids}
        eyebrow={L('Bộ sưu tập', 'Collection')}
        title={L(info.title, info.titleEn)}
        subtitle={L(info.subtitle, info.subtitleEn)}
        chips={[L(`${list.length} bộ`, `${list.length} decks`), L(`${st.total.toLocaleString('vi-VN')} từ`, `${st.total.toLocaleString('en-US')} words`)]}
        mastered={st.mastered}
        total={st.total}
        masteredLabel={L('đã thuộc', 'mastered')}
        cta={inTab ? undefined : L(`Xem cả ${list.length} bộ →`, `See all ${list.length} decks →`)}
        onCta={inTab ? undefined : () => pick(s)}
        onCover={inTab ? undefined : () => pick(s)}
      />
    );
  };
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
    const all = bySource(s).filter((d) => !d.isBookTopic);
    const cap = filter === 'all' ? (s === 'study4' ? all.length : PREVIEW_ALL) : limit;
    const shown = all.slice(0, cap);
    if (s === 'mine') {
      return (
        <>
          {grid([...shown.map(card), notebookHint, createCard].filter(Boolean))}
          {moreFor(s, all.length, shown.length)}
        </>
      );
    }
    if (s === 'books') {
      const covered = all.filter((d) => d.cover);
      return (
        <CoverShelf
          items={covered.map((d) => ({
            key: d.slug,
            id: d.slug,
            uri: d.cover,
            title: en && d.en ? d.en.title : d.title,
            meta: L(`${d.words.length.toLocaleString('vi-VN')} từ`, `${d.words.length.toLocaleString('en-US')} words`),
            pct: statsOf([d]).pct,
            onPress: () => open(d),
          }))}
        />
      );
    }
    if (s === 'study4') {
      // Mỗi bộ trong nhóm này là một cuốn riêng: một kệ bìa liền xếp theo kỳ thi, bấm bìa mở thẳng bộ.
      const ordered = STUDY4_CATEGORY_ORDER.flatMap((category) => all.filter((deck) => deck.study4Category === category));
      const covered = ordered.filter((d) => hasOwnCover(d.slug));
      const plain = ordered.filter((d) => !hasOwnCover(d.slug));
      return (
        <>
          {covered.length ? (
            <CoverShelf
              items={covered.map((d) => ({
                key: d.slug,
                id: d.slug,
                title: en && d.en ? d.en.title : d.title,
                meta: L(`${d.words.length.toLocaleString('vi-VN')} từ`, `${d.words.length.toLocaleString('en-US')} words`),
                pct: statsOf([d]).pct,
                onPress: () => open(d),
              }))}
            />
          ) : null}
          {plain.length ? grid(plain.map(card)) : null}
        </>
      );
    }
    if (s === 'globalSuccess' || s === 'destination') {
      // Nhóm nhiều sách: tab Tất cả chỉ cần banner (quạt bìa); trong nhóm thì mỗi sách một đoạn có bìa nhỏ làm đầu.
      if (filter === 'all') return null;
      const groups = (SOURCE_BOOKS[s] ?? [])
        .map((id) => ({ id, decks: all.filter((d) => bookIdOfDeck(d.slug) === id) }))
        .filter((g) => g.decks.length);
      return (
        <>
          {groups.map((g) => {
            const st = statsOf(g.decks);
            const name = BOOK_NAMES[g.id];
            return (
              <View key={g.id} className="mt-7">
                <BookGroupHead
                  id={g.id}
                  title={name ? L(name.vi, name.en) : g.id}
                  meta={L(`${g.decks.length} unit · ${st.total.toLocaleString('vi-VN')} từ · ${st.pct}% đã thuộc`, `${g.decks.length} units · ${st.total.toLocaleString('en-US')} words · ${st.pct}% mastered`)}
                />
                {grid(g.decks.map(card))}
              </View>
            );
          })}
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
      <View className="mt-1 flex-row items-center gap-2">
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

      {/* Bộ lọc của riêng bạn: chip nhỏ, yên tĩnh. */}
      <View className="mt-3 flex-row flex-wrap gap-2" accessibilityRole="tablist">
        {PERSONAL.map((f) => {
          const on = !needle && filter === f.key;
          const n = count(f.key);
          if (f.key === 'learning' && n === 0) return null;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => pick(f.key)}
              className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
              style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#F3F0FB' }}
            >
              <Icon name={f.icon} size={14} color={on ? '#FFFFFF' : '#64748B'} strokeWidth={2} />
              <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>{L(f.label, f.labelEn)}</Text>
              <Text className="font-sans text-label" style={{ color: on ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>{n}</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/vocabulary/theo-muc' as never)}
          className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
          style={{ backgroundColor: '#F1ECFF', borderWidth: 1, borderColor: '#DCD3F7' }}
        >
          <Icon name="target" size={14} color={color.primary} strokeWidth={2} />
          <Text className="font-semi text-label" style={{ color: color.primary }}>{L('Học theo mức A1 → C2', 'Study by level A1 → C2')}</Text>
        </Pressable>
      </View>

      {inSource ? (
        <View className="mt-4">
          <Pressable accessibilityRole="button" onPress={() => pick('all')} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
            <Icon name="chevron-left" size={16} color={color.primary} strokeWidth={2.4} />
            <Text className="font-strong text-label" style={{ color: color.primary }}>{L('Tất cả bộ sưu tập', 'All collections')}</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 8, paddingVertical: 8, paddingRight: 16 }}>
            {SOURCES.map((f) => {
              const on = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  accessibilityRole="tab"
                  aria-selected={on}
                  onPress={() => pick(f.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 16, height: 44, backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#E6E0F5' }}
                >
                  <Text className="font-strong" style={{ fontSize: 15, color: on ? '#FFFFFF' : color.ink }}>{L(f.label, f.labelEn)}</Text>
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, backgroundColor: on ? 'rgba(255,255,255,0.22)' : '#F1ECFF' }}>
                    <Text className="font-strong" style={{ fontSize: 13, color: on ? '#FFFFFF' : color.primary }}>{count(f.key)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* Chọn nhóm sách: bìa màu như lưới "App có gì"; bấm một bìa để mở bộ sưu tập. */
        <View className="mt-4" accessibilityRole="tablist">
          <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={12}>
            {SOURCES.map((f, i) => (
              <SourceCard
                key={f.key}
                index={i}
                icon={f.icon}
                title={L(f.label, f.labelEn)}
                badge={L(`${count(f.key)} BỘ`, `${count(f.key)} DECKS`)}
                selected={false}
                onPress={() => pick(f.key)}
              />
            ))}
          </Grid>
        </View>
      )}

      <CrossFade swapKey={needle ? 'search' : filter}>
        <View ref={contentRef}>
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
              {(['mine', 'daily', 'books', 'zh', 'ja', 'ielts', 'toeic', 'toefl', 'study4', 'globalSuccess', 'vfi', 'vfia', 'listening', 'destination', 'satMath', 'satVerbal'] as const).map((s) => (
                <View key={s} className="mt-7">
                  {sourceHead(s, false) ?? <SectionHeader title={L(SECTION[s].title, SECTION[s].titleEn)} subtitle={L(SECTION[s].subtitle, SECTION[s].subtitleEn)} icon={SECTION[s].icon} />}
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
              {sourceHead(filter, true) ?? (filter !== 'mine' ? (
                <View style={{ marginBottom: 4 }}>
                  <Text className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: color.ink }}>{L(SECTION[filter].title, SECTION[filter].titleEn)}</Text>
                  <Text className="font-sans" style={{ marginTop: 2, fontSize: 14, color: '#6E5E4B' }}>
                    {L(`${count(filter)} bộ · ${bySource(filter).reduce((n, d) => n + (d.isBookTopic ? 0 : d.words.length), 0).toLocaleString('vi-VN')} từ`, `${count(filter)} decks · ${bySource(filter).reduce((n, d) => n + (d.isBookTopic ? 0 : d.words.length), 0).toLocaleString('en-US')} words`)}
                  </Text>
                </View>
              ) : (
                <SectionHeader title={L(SECTION[filter].title, SECTION[filter].titleEn)} subtitle={L(SECTION[filter].subtitle, SECTION[filter].subtitleEn)} icon={SECTION[filter].icon} />
              ))}
              {sourceBody(filter)}
            </View>
          )}
        </View>
      </CrossFade>
    </View>
  );
}
