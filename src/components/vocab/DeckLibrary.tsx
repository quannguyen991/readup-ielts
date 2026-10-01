import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon, SectionHeader } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { NOTEBOOK_SLUG, notebookDeck } from '@/data/study-decks';
import { LISTENING_DECKS, LISTENING_SECTIONS } from '@/data/vocab-listening';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { byRecent, deckProgress, fold, isInProgress, type DeckProgress } from '@/services/vocab/deck-library';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

import { DeckActionCard, DeckCard } from './DeckCard';
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
};

const FILTERS: { key: LibraryFilter; label: string; labelEn: string; icon: IconName }[] = [
  { key: 'all', label: 'Tất cả', labelEn: 'All', icon: 'grid' },
  { key: 'learning', label: 'Đang học', labelEn: 'In progress', icon: 'flame' },
  { key: 'mine', label: 'Của bạn', labelEn: 'Yours', icon: 'bookmark' },
  { key: 'ielts', label: 'Chủ đề IELTS', labelEn: 'IELTS topics', icon: 'book' },
  { key: 'listening', label: 'Nghe IELTS', labelEn: 'IELTS listening', icon: 'volume' },
  { key: 'satMath', label: 'SAT Math', labelEn: 'SAT Math', icon: 'grid' },
  { key: 'satVerbal', label: 'SAT Verbal', labelEn: 'SAT Verbal', icon: 'letters' },
];

const SECTION: Record<DeckSource, { title: string; titleEn: string; subtitle: string; subtitleEn: string; icon: IconName }> = {
  mine: { title: 'Của bạn', titleEn: 'Yours', subtitle: 'Sổ từ bạn lưu khi đọc và các bộ bạn tự tạo', subtitleEn: 'Words you saved while reading, plus decks you made', icon: 'bookmark' },
  ielts: { title: 'Chủ đề IELTS', titleEn: 'IELTS topics', subtitle: 'Mỗi bộ xếp từ dễ tới khó theo band', subtitleEn: 'Each deck goes from easy to hard by band', icon: 'book' },
  listening: { title: 'Nghe IELTS', titleEn: 'IELTS listening', subtitle: 'Chia theo từng Section của đề', subtitleEn: 'Grouped by test Section', icon: 'volume' },
  satMath: { title: 'Từ vựng SAT Math', titleEn: 'SAT Math vocabulary', subtitle: 'Từ hay gặp trong đề Toán, chia bài ngắn', subtitleEn: 'Common words in Math questions, in short lessons', icon: 'grid' },
  satVerbal: { title: 'Từ vựng SAT Verbal', titleEn: 'SAT Verbal vocabulary', subtitle: 'Từ nối, sắc thái, từ trong ngữ cảnh', subtitleEn: 'Transitions, nuance and words in context', icon: 'letters' },
};

const LISTENING_SECTION_OF = new Map(LISTENING_DECKS.map((d) => [d.slug, d.section]));

const WEB = Platform.OS === 'web';
const LEARNING_PREVIEW = 6;

function lib(slug: string, title: string, words: readonly { word: string }[], subtitle?: string, en?: LibDeck['en']): LibDeck {
  const look = deckLook(slug);
  return { slug, title, subtitle, words, look, en, haystack: fold(`${title} ${subtitle ?? ''} ${look.sourceLabel} ${en?.title ?? ''} ${look.sourceLabelEn}`) };
}

const STATIC_DECKS: LibDeck[] = [
  ...VOCAB_TOPICS.map((t) => lib(t.slug, t.nameVi, t.words, t.name, { title: t.name })),
  ...LISTENING_DECKS.map((t) => lib(t.slug, t.nameVi, t.words, t.name, { title: t.name })),
  ...SAT_MATH_VOCAB_LESSONS.map((l) => lib(l.slug, l.title, l.words)),
  ...SAT_VERBAL_VOCAB_LESSONS.map((l) => lib(l.slug, l.title, l.words)),
];

export function DeckLibrary({ initialFilter = 'all' }: { initialFilter?: LibraryFilter }) {
  const { L, en } = useL();
  const entries = useVocabStore((s) => s.entries);
  const customMap = useCustomDeckStore((s) => s.decks);
  const stages = useTopicStudyStore((s) => s.stages);
  const lastAt = useTopicStudyStore((s) => s.lastAt);
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);
  const [query, setQuery] = useState('');
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
    for (const d of decks) map.set(d.slug, deckProgress(d.words, stages[d.slug], lastAt?.[d.slug]));
    return map;
  }, [decks, stages, lastAt]);
  const prog = (d: LibDeck) => progress.get(d.slug)!;

  const learning = useMemo(() => byRecent(decks.filter((d) => isInProgress(progress.get(d.slug)!)), (d) => progress.get(d.slug)!.lastAt), [decks, progress]);
  const count = (f: LibraryFilter) => (f === 'all' ? decks.length : f === 'learning' ? learning.length : decks.filter((d) => d.look.source === f).length);

  const needle = fold(query);
  const results = needle ? decks.filter((d) => d.haystack.includes(needle)) : [];

  const open = (slug: string) => router.push(`/vocabulary/topic/${slug}` as never);
  const card = (d: LibDeck, i: number) => (
    <Appear key={d.slug} index={Math.min(i, 8)} style={{ height: '100%' }}>
      <DeckCard title={en && d.en ? d.en.title : d.title} subtitle={en && d.en ? d.en.subtitle : d.subtitle} progress={prog(d)} accent={d.look.accent} icon={d.look.icon} sourceLabel={en ? d.look.sourceLabelEn : d.look.sourceLabel} now={now} onPress={() => open(d.slug)} />
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
      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
        {items}
      </Grid>
    </View>
  );
  const bySource = (s: DeckSource) => decks.filter((d) => d.look.source === s);
  /** Nội dung một nhóm; bộ Nghe chia tiếp theo từng Section của đề, mỗi Section một dòng tiêu đề. */
  const sourceBody = (s: DeckSource) => {
    if (s === 'mine') return grid([...bySource('mine').map(card), notebookHint, createCard].filter(Boolean));
    if (s !== 'listening') return grid(bySource(s).map(card));
    const all = bySource('listening');
    return LISTENING_SECTIONS.map((sec) => {
      const items = all.filter((d) => LISTENING_SECTION_OF.get(d.slug) === sec.key);
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
    });
  };

  return (
    <View>
      {/* Tìm + lọc */}
      <View className="mt-5 flex-row items-center gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-2xl bg-white px-3.5" style={{ height: 48, borderWidth: 1.5, borderColor: query ? color.primary : '#F0EBE2', ...(WEB ? ({ transition: 'border-color 200ms ease' } as object) : null) }}>
          <Icon name="search" size={17} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
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
              }}
              className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
              style={{
                backgroundColor: on ? color.primary : '#FFFFFF',
                borderWidth: 1,
                borderColor: on ? color.primary : '#F0EBE2',
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
              {results.length ? grid(results.map(card)) : null}
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
              {(['mine', 'ielts', 'listening', 'satMath', 'satVerbal'] as const).map((s) => (
                <View key={s} className="mt-7">
                  <SectionHeader title={L(SECTION[s].title, SECTION[s].titleEn)} subtitle={L(SECTION[s].subtitle, SECTION[s].subtitleEn)} icon={SECTION[s].icon} />
                  {sourceBody(s)}
                </View>
              ))}
            </>
          ) : filter === 'learning' ? (
            <View className="mt-5">
              <SectionHeader title={L('Bộ từ đang học', 'Decks in progress')} subtitle={L('Học gần nhất đứng đầu', 'Most recent first')} icon="flame" iconTone="warning" />
              {grid(learning.map(card))}
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
