import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon, Pagination } from '@/components/ui';
import {
  CEFR_LEVELS,
  EXAMS,
  SAT_TEXT_TYPES,
  TIERS_BY_EXAM,
  TIER_LABEL,
  TOPICS,
  filterArticles,
  libraryStats,
  type ArticleFilters,
} from '@/data/articles';
import { BILINGUAL_ARTICLES } from '@/data/bilingual-repository';
import { useDueCards, useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import type { CefrLevel } from '@/types/database';
import { CrossFade } from '@/components/motion/Motion';
import { useL } from '@/i18n/useL';

/**
 * Kho bài đọc.
 *
 * BỘ LỌC GẤP LẠI, KHÔNG BÀY HẾT RA. Bản trước xếp năm hàng chip luôn hiện — kỳ
 * thi, track, khổ bài, độ khó, chủ đề — cộng hàng sắp xếp, chiếm gần hết màn
 * hình đầu tiên. Người mới vào chưa biết mình muốn lọc gì, nên năm hàng ấy chỉ
 * là bức tường chắn giữa họ và bài đọc. Giờ mặc định chỉ có ô tìm kiếm và một
 * nút mở bộ lọc; ai cần lọc thì mở ra, và khi đã chọn thì số bộ lọc đang bật
 * hiện ngay trên nút nên không ai quên mình đang lọc gì.
 *
 * PHÂN TRANG, KHÔNG PHẢI "XEM THÊM". Nút xem thêm nối bài vào cuối danh sách
 * mãi mãi: cuộn tới bài thứ 60 rồi mở một bài, quay lại là mất sạch vị trí.
 * Trang có số thì quay lại vẫn đúng trang, và mỗi màn chỉ có 9 thẻ nên mắt còn
 * nhìn được từng thẻ thay vì lướt qua một dải dài.
 */

const PAGE_SIZE = 9;

/** Nhãn tiếng Anh cho bộ lọc (dữ liệu gốc ở `data/articles` giữ tiếng Việt). */
const TIER_LABEL_EN: Record<keyof typeof TIER_LABEL, string> = {
  p1: 'Passage 1 (~750 words)',
  p2: 'Passage 2 (~900 words)',
  p3: 'Passage 3 (~1050 words)',
  short_academic: 'Short academic text',
  headline: 'Official test links',
  official_practice: 'Official tests',
  sat_short: 'SAT — short text (25–150 words)',
  sat_long: 'SAT — long text (500–750 words)',
};
const SAT_TEXT_TYPE_EN: Record<string, string> = {
  literature: 'Literature',
  history_social: 'History & social studies',
  humanities: 'Humanities',
  science: 'Science',
};

export default function LibraryScreen() {
  const { L, en } = useL();
  const [search, setSearch] = useState('');
  const [exam, setExam] = useState<NonNullable<ArticleFilters['exam']>>('all');
  const [track, setTrack] = useState<NonNullable<ArticleFilters['track']>>('all');
  const [tier, setTier] = useState<NonNullable<ArticleFilters['tier']>>('all');
  const [satTextType, setSatTextType] =
    useState<NonNullable<ArticleFilters['satTextType']>>('all');
  const [level, setLevel] = useState<CefrLevel | 'all'>('all');
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<NonNullable<ArticleFilters['kind']>>('all');
  const [sort, setSort] = useState<NonNullable<ArticleFilters['sort']>>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const stats = useMemo(() => libraryStats(), []);
  const entries = useVocabStore((s) => s.entries);
  const dueCount = useDueCards().length;
  const savedCount = Object.keys(entries).length;

  const articles = useMemo(
    () => filterArticles({ search, exam, track, tier, satTextType, level, topic, kind, sort }),
    [search, exam, track, tier, satTextType, level, topic, kind, sort],
  );

  const activeFilters =
    (exam !== 'all' ? 1 : 0) +
    (track !== 'all' ? 1 : 0) +
    (tier !== 'all' ? 1 : 0) +
    (satTextType !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (topic ? 1 : 0) +
    (kind !== 'all' ? 1 : 0);

  /**
   * Đổi kỳ thi thì bỏ hết bộ lọc con của kỳ thi cũ. Không bỏ thì người dùng dễ
   * rơi vào tổ hợp rỗng kiểu "SAT + General Training" mà không hiểu vì sao
   * không còn bài nào.
   */
  const selectExam = (next: NonNullable<ArticleFilters['exam']>) => {
    setExam(next);
    setTrack('all');
    setTier('all');
    setSatTextType('all');
    setPage(0);
  };

  const reset = () => {
    setSearch('');
    setExam('all');
    setTrack('all');
    setTier('all');
    setSatTextType('all');
    setLevel('all');
    setTopic(undefined);
    setKind('all');
    setSort('newest');
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = articles.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Screen>
      <LightHero
        scene="home"
        badge="READING LIBRARY" art="verbal"
        line1={L('Kho bài đọc', 'Reading library')}
        line2={L('đọc kỹ, nhớ lâu hơn', 'read closely, remember longer')}
        subtitle={L('Bài thật từ nguồn công khai. Đọc, chạm vào từ để tra ngay trong câu gặp nó, rồi ôn lại đúng lúc sắp quên.', 'Real texts from public sources. Read, tap a word to look it up right in its sentence, then review it just before you forget.')}
        footer={
          <>
            <HeroStat value={String(stats.readable)} label={L('bài đọc đầy đủ', 'full readings')} />
            <HeroStat value={String(stats.ielts)} label={L('passage IELTS', 'IELTS passages')} />
            <HeroStat value={String(stats.sat)} label={L('passage SAT', 'SAT passages')} />
            <HeroStat value={String(savedCount)} label={L('từ đã lưu', 'saved words')} />
          </>
        }
      >
        <Button
          label={L('Đọc song ngữ', 'Bilingual reading')}
          variant="brand"
          size="lg"
          iconRight="arrow-right"
          onPress={() => router.push('/bilingual' as never)}
        />
        <Button
          label={L('Mở sổ từ', 'Open notebook')}
          variant="outline"
          size="lg"
          iconLeft="letters"
          onPress={() => router.push('/vocabulary' as never)}
        />
      </LightHero>

      {/*
        Lối sang kho song ngữ đặt NGAY TRÊN bộ lọc, không nhét xuống chân trang.
        Hai kho khác nhau ở chỗ được phép hiện gì (xem `bilingual-repository`),
        nên người vào đây tìm bài đọc cần biết có kho thứ hai ngay từ đầu.
      */}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/bilingual' as never)}
        className="mt-5 flex-row flex-wrap items-center gap-4 rounded-card border border-accent-200 bg-accent-50 p-4"
        style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
      >
        <View className="h-12 w-12 items-center justify-center rounded-panel bg-accent-600">
          <Icon name="languages" size={22} color="#FFFFFF" strokeWidth={1.9} />
        </View>
        <View className="min-w-[220px] flex-1">
          <Text className="font-heavy text-cardTitle text-accent-900">{L('Đọc song ngữ Anh–Việt', 'English–Vietnamese bilingual reading')}</Text>
          <Text className="mt-0.5 font-sans text-body text-accent-800">
            {L(
              `${BILINGUAL_ARTICLES.length} bài viết riêng cho người học tiếng Việt, bản gốc và bản dịch nằm cạnh nhau theo từng đoạn.`,
              `${BILINGUAL_ARTICLES.length} articles written for Vietnamese learners, with the original and translation side by side, paragraph by paragraph.`,
            )}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-strong text-body text-accent-700">{L('Mở kho', 'Open')}</Text>
          <Icon name="arrow-right" size={16} color={color.accent} strokeWidth={2} />
        </View>
      </Pressable>

      {/* ------------------------------------------------ tìm kiếm + bộ lọc */}
      <View className="mt-5 flex-row flex-wrap items-center gap-2">
        <View className="min-w-[260px] flex-1 flex-row items-center gap-2 rounded-card border border-border bg-surface px-4">
          <Icon name="search" size={18} color={color.subtle} />
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(0);
            }}
            placeholder={L('Tìm bài đọc, chủ đề hoặc từ vựng…', 'Search readings, topics or words…')}
            placeholderTextColor={color.subtle}
            className="h-11 flex-1 font-sans text-body text-ink"
            style={{ outlineStyle: 'none' } as never}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} accessibilityLabel={L('Xoá tìm kiếm', 'Clear search')}>
              <Icon name="close" size={16} color={color.subtle} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          aria-expanded={showFilters}
          onPress={() => setShowFilters((v) => !v)}
          className="h-11 flex-row items-center gap-2 rounded-card border border-border bg-surface px-4"
        >
          <Icon name="filter" size={16} color={color.body} />
          <Text className="font-semi text-body text-ink">{L('Bộ lọc', 'Filters')}</Text>
          {activeFilters > 0 ? (
            <View className="h-5 min-w-[20px] items-center justify-center rounded-pill bg-primary-600 px-1.5">
              <Text className="font-strong text-white" style={{ fontSize: 10 }}>
                {activeFilters}
              </Text>
            </View>
          ) : null}
          <Icon name={showFilters ? 'chevron-down' : 'chevron-right'} size={15} color={color.subtle} />
        </Pressable>
      </View>

      {showFilters ? (
        <Card className="mt-3">
          <FilterRow label={L('Kỳ thi', 'Exam')}>
            <Chip label={L('Tất cả', 'All')} active={exam === 'all'} onPress={() => selectExam('all')} />
            {EXAMS.map((e) => (
              <Chip
                key={e.value}
                label={e.label}
                active={exam === e.value}
                onPress={() => selectExam(exam === e.value ? 'all' : e.value)}
              />
            ))}
          </FilterRow>

          <FilterRow label={exam === 'sat' ? L('Loại văn bản', 'Text type') : 'Track'}>
            {exam === 'sat' ? (
              <>
                <Chip
                  label={L('Tất cả', 'All')}
                  active={satTextType === 'all'}
                  onPress={() => setSatTextType('all')}
                />
                {SAT_TEXT_TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    label={en ? (SAT_TEXT_TYPE_EN[t.value] ?? t.label) : t.label}
                    active={satTextType === t.value}
                    onPress={() => setSatTextType(satTextType === t.value ? 'all' : t.value)}
                  />
                ))}
              </>
            ) : (
              <>
                <Chip label={L('Tất cả', 'All')} active={track === 'all'} onPress={() => setTrack('all')} />
                <Chip
                  label="Academic"
                  active={track === 'academic'}
                  onPress={() => setTrack(track === 'academic' ? 'all' : 'academic')}
                />
                <Chip
                  label="General Training"
                  active={track === 'general_training'}
                  onPress={() => setTrack(track === 'general_training' ? 'all' : 'general_training')}
                />
              </>
            )}
          </FilterRow>

          {exam !== 'all' ? (
            <FilterRow label={L('Khổ bài', 'Length')}>
              <Chip label={L('Tất cả', 'All')} active={tier === 'all'} onPress={() => setTier('all')} />
              {TIERS_BY_EXAM[exam].map((t) => (
                <Chip
                  key={t}
                  label={en ? TIER_LABEL_EN[t] : TIER_LABEL[t]}
                  active={tier === t}
                  onPress={() => setTier(tier === t ? 'all' : t)}
                />
              ))}
            </FilterRow>
          ) : null}

          <FilterRow label={L('Độ khó', 'Level')}>
            <Chip label={L('Tất cả', 'All')} active={level === 'all'} onPress={() => setLevel('all')} />
            {CEFR_LEVELS.map((l) => (
              <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
            ))}
          </FilterRow>

          <FilterRow label={L('Chủ đề', 'Topic')}>
            <Chip label={L('Tất cả', 'All')} active={!topic} onPress={() => setTopic(undefined)} />
            {TOPICS.map((t) => (
              <Chip
                key={t.slug}
                label={en ? t.name : t.nameVi}
                active={topic === t.slug}
                onPress={() => setTopic(topic === t.slug ? undefined : t.slug)}
              />
            ))}
          </FilterRow>

          <FilterRow label={L('Dạng bài', 'Type')}>
            <Chip
              label={L('Đọc được toàn văn', 'Full text')}
              active={kind === 'readable'}
              onPress={() => setKind(kind === 'readable' ? 'all' : 'readable')}
            />
            {/*
              Nhãn "Link đề chính thức", không phải "Chỉ tiêu đề": 41 bài tin chỉ
              có tiêu đề đã gỡ khỏi kho, còn lại đúng 8 link tới đề thi chính
              thức của Cambridge / College Board / Khan Academy — thứ người luyện
              thi chủ động đi tìm, không phải một thiếu sót.
            */}
            <Chip
              label={L('Link đề chính thức', 'Official test links')}
              active={kind === 'headline'}
              onPress={() => setKind(kind === 'headline' ? 'all' : 'headline')}
            />
          </FilterRow>

          <Pressable onPress={reset} className="mt-1 flex-row items-center gap-1 self-start py-1">
            <Icon name="refresh" size={14} color={color.primary} />
            <Text className="font-semi text-label text-primary-600">{L('Bỏ hết bộ lọc', 'Clear all filters')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {/* ------------------------------------------------------- kết quả */}
      <View className="mt-5 flex-row flex-wrap items-center justify-between gap-3">
        <Text className="font-strong text-cardTitle text-ink">
          {L(`${articles.length} bài${activeFilters > 0 || search ? ' khớp bộ lọc' : ''}`, `${articles.length} ${activeFilters > 0 || search ? 'matching readings' : 'readings'}`)}
        </Text>
        <View className="flex-row flex-wrap items-center gap-1.5">
          {(['newest', 'shortest', 'easiest', 'hardest'] as const).map((s) => (
            <Chip
              key={s}
              label={L(SORT_LABEL[s], SORT_LABEL_EN[s])}
              active={sort === s}
              onPress={() => {
                setSort(s);
                setPage(0);
              }}
            />
          ))}
        </View>
      </View>

      <View className="mt-3">
        {/* Đổi trang hay đổi bộ lọc: danh sách mới mờ dần vào. */}
        <CrossFade swapKey={`${current}-${shown[0]?.id ?? 0}`}>
        {shown.length > 0 ? (
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
            {shown.map((article) => (
              <ArticleCard key={article.id} article={article} layout="cover" />
            ))}
          </Grid>
        ) : (
          <Card className="items-center py-10">
            <Icon name="search" size={26} color={color.subtle} />
            <Text className="mt-2 text-center font-sans text-body text-muted">
              {L('Không có bài nào khớp. Thử bỏ bớt bộ lọc.', 'Nothing matches. Try removing some filters.')}
            </Text>
            <Button className="mt-3" variant="outline" label={L('Bỏ hết bộ lọc', 'Clear all filters')} onPress={reset} />
          </Card>
        )}
        </CrossFade>
      </View>

      {pageCount > 1 ? (
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
      ) : null}

      {/* --------------------------------------------------- ôn từ đã lưu */}
      <Card className="mt-5 flex-row flex-wrap items-center justify-between gap-3">
        <View className="min-w-[220px] flex-1">
          <Text className="font-strong text-cardTitle text-ink">{L('Sổ từ của bạn', 'Your notebook')}</Text>
          <Text className="mt-0.5 font-sans text-body text-muted">
            {savedCount === 0
              ? L('Chưa có từ nào. Mở một bài rồi chạm vào từ bất kỳ để lưu kèm câu gốc.', 'No words yet. Open a reading and tap any word to save it with its sentence.')
              : dueCount > 0
                ? L(`${savedCount} từ đã lưu · ${dueCount} thẻ đến hạn ôn hôm nay`, `${savedCount} saved words · ${dueCount} cards due today`)
                : L(`${savedCount} từ đã lưu · chưa có thẻ nào đến hạn`, `${savedCount} saved words · nothing due yet`)}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Button
            variant="outline"
            label={L('Mở sổ từ', 'Open notebook')}
            onPress={() => router.push('/vocabulary' as never)}
          />
          <Button
            label={L('Ôn ngay', 'Review now')}
            disabled={dueCount === 0}
            onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
          />
        </View>
      </Card>
    </Screen>
  );
}

const SORT_LABEL: Record<'newest' | 'shortest' | 'easiest' | 'hardest', string> = {
  newest: 'Mới nhất',
  shortest: 'Ngắn nhất',
  easiest: 'Dễ nhất',
  hardest: 'Khó nhất',
};
const SORT_LABEL_EN: Record<'newest' | 'shortest' | 'easiest' | 'hardest', string> = {
  newest: 'Newest',
  shortest: 'Shortest',
  easiest: 'Easiest',
  hardest: 'Hardest',
};

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5 py-0.5">{children}</View>
      </ScrollView>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={active}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
