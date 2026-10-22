import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { LinearGradient } from 'expo-linear-gradient';
import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { matchesWritingFilter } from '@/lib/writing/prompt-filter';
import { PlanNudge } from '@/components/billing/PlanUi';
import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { CatSticker } from '@/components/mascot/CatSticker';
import { GLASS, GOLD, GOLD_BUTTON } from '@/components/layout/phone-theme';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import {
  CheckGroup,
  FilterRail,
  type RailSelection,
  type RailSkill,
} from '@/components/practice/FilterRail';
import { Badge, Button, Card, Icon, Pagination } from '@/components/ui';
import { ARTICLES, filterArticles, isReadable, type ArticleMeta } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { AVAILABLE_IELTS_TYPES, QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { color } from '@/theme/tokens';
import type { CefrLevel, PassageTier } from '@/types/database';
import { useL, type L as LFn } from '@/i18n/useL';

/**
 * Trang Luyện tập.
 *
 * Bản trước là một hub với vài thẻ gợi ý — nó không trả lời được câu "tôi muốn
 * làm riêng Passage 2 của IELTS thì vào đâu". Bản này đổi thành THƯ VIỆN BÀI
 * TẬP có thanh lọc phân cấp: chọn kỹ năng → kiểu bài → khổ bài, rồi lọc thêm
 * theo nguồn và trình độ.
 *
 * Listening links to its playable question bank. Speaking stays unavailable
 * until a source-backed prompt set has been imported.
 */

const TIER_BY_CHILD: Record<string, PassageTier> = {
  p1: 'p1',
  p2: 'p2',
  p3: 'p3',
  short: 'short_academic',
};

/** Dựng theo ngôn ngữ giao diện — nhãn đi thẳng vào `FilterRail`. */
const buildSkills = (L: LFn): RailSkill[] => [
  {
    key: 'reading',
    label: 'Reading',
    icon: 'book',
    tint: themedHex('#E68AAE'),
    options: [
      {
        key: 'single',
        label: L('Bài lẻ', 'Single passages'),
        children: [
          { key: 'p1', label: L('Passage 1 (~750 từ)', 'Passage 1 (~750 words)') },
          { key: 'p2', label: L('Passage 2 (~900 từ)', 'Passage 2 (~900 words)') },
          { key: 'p3', label: L('Passage 3 (~1050 từ)', 'Passage 3 (~1050 words)') },
          { key: 'short', label: L('Bài ngắn', 'Short texts') },
        ],
      },
      { key: 'full', label: L('Full đề — 3 passage, 60 phút', 'Full test — 3 passages, 60 minutes') },
    ],
  },
  {
    key: 'listening',
    label: 'Listening',
    icon: 'volume',
    tint: '#F59E0B',
    options: [],
    href: '/listening',
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: 'pencil',
    tint: '#D5B377',
    options: [
      {
        key: 'single',
        label: L('Bài lẻ', 'Single tasks'),
        children: [
          { key: 'task1', label: L('Task 1 — biểu đồ', 'Task 1 — charts') },
          { key: 'task2', label: L('Task 2 — luận', 'Task 2 — essays') },
        ],
      },
    ],
  },
  {
    key: 'speaking',
    label: 'Speaking',
    icon: 'chat',
    tint: '#C97A9A',
    options: [],
    comingSoon: true,
  },
];

const LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

/** Dạng biểu đồ Task 1 — đúng những gì kho đề đang có, không kê thừa. */
/** Dạng đề Task 2 — đúng năm dạng có trong kho, đếm từ dữ liệu chứ không kê. */
const ESSAY_KINDS = [
  { key: 'opinion', label: 'Opinion' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'advantage_disadvantage', label: 'Advantages / Disadvantages' },
  { key: 'two_part', label: 'Two-part Question' },
  { key: 'problem_solution', label: 'Problem / Solution' },
];

const WRITING_BANDS = [
  { key: '6', label: 'Band 6' },
  { key: '6.5', label: 'Band 6.5' },
  { key: '7', label: 'Band 7' },
];

/**
 * Bề ngang hình thu nhỏ trên thẻ đề.
 *
 * Cố định chứ không đo theo thẻ: `ChartFigure` nhận width để tính toạ độ SVG,
 * mà đo bằng onLayout thì lần vẽ đầu chưa có số, hình nhảy một nhịp khi lưới
 * hiện ra. Thẻ hẹp hơn thì hình co lại theo khung, không tràn.
 */
const THUMB_WIDTH = 260;

const CHART_KINDS = [
  { key: 'line', label: 'Line Graph' },
  { key: 'bar', label: 'Bar Chart' },
  { key: 'pie', label: 'Pie Chart' },
  { key: 'table', label: 'Table' },
];

const READABLE_TOTAL = ARTICLES.filter(isReadable).length;

/**
 * Bài đọc & đề viết — tác vụ riêng, mở từ trang IELTS. Không nằm trong trang chủ IELTS,
 * để trang chủ chỉ còn là nơi chọn tính năng.
 */
export default function ReadingLibraryScreen() {
  const { L, locale } = useL();
  const SKILLS = useMemo(() => buildSkills(L), [L]);
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const phone = width < 640;

  const [selection, setSelection] = useState<RailSelection>({
    skill: 'reading',
    option: 'single',
    child: null,
  });
  const [sources, setSources] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  /*
    Lọc theo LOẠI CÂU HỎI và DẠNG BIỂU ĐỒ.

    Khác các bộ lọc trên ở một điểm quan trọng: đề của app SINH RA lúc bắt đầu
    làm bài, chưa tồn tại lúc chọn bài. Nên đây không phải lọc danh sách sẵn có
    mà là ĐẶT HÀNG — chọn xong thì đề sinh ra chỉ gồm những dạng đã chọn. Giao
    diện phải nói đúng điều đó, nếu không người dùng tưởng nó lọc mà số bài
    không đổi rồi nghĩ bộ lọc hỏng.
  */
  const [qTypes, setQTypes] = useState<string[]>([]);
  const [chartKinds, setChartKinds] = useState<string[]>([]);
  const [essayKinds, setEssayKinds] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [railOpen, setRailOpen] = useState(false);

  // Đếm số bài theo nguồn để chip lọc nói được nguồn nào có bao nhiêu — danh sách
  // nguồn mà không có số thì người dùng bấm mò.
  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of ARTICLES) {
      const key = a.sourceName ?? 'Khác';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: key === 'Khác' ? L('Khác', 'Other') : key, count }));
  }, [L]);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  /**
   * Mỗi trang 8 thẻ.
   *
   * Bản trước vẽ tối đa 60 thẻ một lượt rồi ghi chú "đang hiện 60 bài đầu, lọc
   * thêm để thu hẹp" — tức là bắt người dùng lọc cho tới khi vừa màn, dù thứ họ
   * cần chỉ là lật trang. Số đếm phía trên vẫn là tổng số bài khớp, không phải
   * số thẻ đang vẽ.
   */
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);

  const filterKey = [
    selection.skill,
    selection.option,
    selection.child,
    ...sources,
    ...levels,
    ...qTypes,
    ...chartKinds,
    ...essayKinds,
    ...bands,
  ].join('|');

  /*
    Đổi bộ lọc thì về trang 1 — chỉnh NGAY TRONG LÚC RENDER, không qua effect.

    Không làm vậy thì lọc từ 300 bài xuống 12 bài trong khi đang ở trang 9 sẽ ra
    một màn trống, trông như bộ lọc hỏng. Nhưng gọi `setPage` trong effect lại
    khiến React vẽ một nhịp thừa với trang cũ rồi mới vẽ lại — đây đúng là mẫu
    "chỉnh state khi prop đổi" mà React khuyến nghị làm ngay trong thân hàm.
  */
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const readingMatches = useMemo(() => {
    if (selection.skill !== 'reading' || selection.option !== 'single') return [];
    const tier = selection.child ? TIER_BY_CHILD[selection.child] : undefined;
    // Không chọn khổ nào thì lấy tất cả — 'all' là giá trị `filterArticles` hiểu.
    return filterArticles({ kind: 'readable', exam: 'ielts', tier: tier ?? 'all', sort: 'easiest' })
      .filter((a) => (sources.length === 0 ? true : sources.includes(a.sourceName ?? '')))
      .filter((a) => (levels.length === 0 ? true : levels.includes(a.cefrLevel ?? '')));
  }, [levels, selection, sources]);

  const writingMatches = useMemo(() => {
    if (selection.skill !== 'writing') return [];
    const child = selection.child;
    return WRITING_PROMPTS.filter((p) =>
      matchesWritingFilter(p, { child, chartKinds, essayKinds, bands }),
    );
  }, [bands, chartKinds, essayKinds, selection]);

  const filtersOn =
    sources.length + levels.length + qTypes.length + chartKinds.length + essayKinds.length + bands.length >
    0;
  const clearFilters = () => {
    setSources([]);
    setLevels([]);
    setQTypes([]);
    setChartKinds([]);
    setEssayKinds([]);
    setBands([]);
  };

  const rail = (
    <FilterRail
      skills={SKILLS}
      selection={selection}
      /*
        Chọn "Full đề" là ĐI THẲNG sang phòng thi, không dừng ở một thẻ có nút.

        Thẻ trung gian trước đây chỉ nói lại đúng những gì cái nút vừa bấm đã
        nói, rồi bắt bấm thêm một lần nữa. Người chọn "Full đề" đã quyết rồi.
      */
      onSelect={(next) => {
        if (next.skill === 'reading' && next.option === 'full') {
          router.push('/mock-tests' as never);
          return;
        }
        setSelection(next);
      }}
      onNavigate={(href) => router.push(href as never)}
      groups={
        selection.skill === 'reading' ? (
          <View className="mt-2 gap-2">
            <CheckGroup
              title={L('Loại câu hỏi', 'Question types')}
              note={
                AVAILABLE_IELTS_TYPES.length > 1
                  ? L('Chọn rồi thì đề sinh ra chỉ gồm những dạng này.', 'Once picked, generated tests only include these types.')
                  : L('Bộ sinh đề hiện mới làm được dạng này. Các dạng khác đang dựng.', 'The test generator only supports this type for now. Others are in progress.')
              }
              options={AVAILABLE_IELTS_TYPES.map((t) => ({ key: t, label: QUESTION_TYPE_LABEL[t] }))}
              selected={qTypes}
              onToggle={(k) => toggle(qTypes, setQTypes, k)}
            />
            <CheckGroup
              title={L('Nguồn tài liệu', 'Sources')}
              options={sourceOptions}
              selected={sources}
              onToggle={(k) => toggle(sources, setSources, k)}
            />
            <CheckGroup
              title={L('Trình độ', 'Level')}
              options={LEVELS.map((l) => ({ key: l, label: l }))}
              selected={levels}
              onToggle={(k) => toggle(levels, setLevels, k)}
            />
          </View>
        ) : selection.skill === 'writing' && selection.child !== 'sat' ? (
          <View className="mt-2 gap-2">
            {/*
              Bộ lọc dựng theo ĐÚNG trường có thật trong kho đề. Bản tham chiếu
              còn có các tab nguồn kiểu "Actual Tests" hay "C10-C20"; ở đây cả 60
              đề đều do app sinh ra từ một nguồn, nên bày tab nguồn là bày ra
              những ngăn rỗng chỉ để trông giống.
            */}
            {/*
              Chưa chọn Task nào thì danh sách gồm CẢ HAI, nên phải bày cả hai bộ
              lọc. Bày mỗi "Dạng đề" của Task 2 lên trên một danh sách đầy biểu đồ
              Task 1 thì người dùng chọn Opinion xong thấy biến mất gần hết bài mà
              không hiểu vì sao.
            */}
            {selection.child !== 'task2' ? (
              <CheckGroup
                title={L('Dạng biểu đồ (Task 1)', 'Chart type (Task 1)')}
                options={CHART_KINDS}
                selected={chartKinds}
                onToggle={(k) => toggle(chartKinds, setChartKinds, k)}
              />
            ) : null}
            {selection.child !== 'task1' ? (
              <CheckGroup
                title={L('Dạng đề (Task 2)', 'Essay type (Task 2)')}
                options={ESSAY_KINDS}
                selected={essayKinds}
                onToggle={(k) => toggle(essayKinds, setEssayKinds, k)}
              />
            ) : null}
            <CheckGroup
              title={L('Band mục tiêu', 'Target band')}
              options={WRITING_BANDS}
              selected={bands}
              onToggle={(k) => toggle(bands, setBands, k)}
            />
          </View>
        ) : null
      }
    />
  );

  return (
    <Screen cat="write">
      {phone ? (
        <Appear>
          <PhoneHeroPanel
            eyebrow="IELTS · READING"
            title="Reading"
            line2={L('đọc để hiểu, không chỉ chọn đáp án', 'read to understand, not just to pick answers')}
            subtitle={L('Chọn dạng câu, làm có giờ.', 'Pick a type, work against the clock.')}
            stats={[
              { value: READABLE_TOTAL.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN'), label: L('bài đọc', 'readings') },
              { value: '15', label: L('dạng câu hỏi', 'question types') },
              { value: '60', label: L('phút full đề', 'min full test') },
            ]}
            primary={{ label: L('Bài ngắn', 'Short texts'), onPress: () => setSelection({ skill: 'reading', option: 'single', child: 'short' }) }}
            links={[
              { icon: 'clipboard', label: L('Full đề Reading', 'Full Reading test'), onPress: () => router.push('/mock-tests' as never) },
              { icon: 'refresh', label: L('Xen kẽ dạng bài', 'Mixed practice'), onPress: () => router.push('/practice-mixed' as never) },
              { icon: 'book', label: L('Đề tự nạp', 'My imported tests'), onPress: () => router.push('/ielts-source-practice' as never) },
            ]}
          />
        </Appear>
      ) : (
      <Appear>
        <LightHero
          badge="IELTS · READING" art="verbal"
          line1="Reading"
          line2={L('đọc để hiểu, không chỉ chọn đáp án', 'read to understand, not just to pick answers')}
          subtitle={L('Chọn dạng câu, làm có giờ.', 'Pick a type, work against the clock.')}
          footer={
            <>
              <HeroStat value={READABLE_TOTAL.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} label={L('bài đọc', 'readings')} />
              <HeroStat value="15" label={L('dạng câu hỏi', 'question types')} />
              <HeroStat value="60" label={L('phút full đề', 'min full test')} />
            </>
          }
        >
          <Button
            label={L('Bài ngắn', 'Short texts')}
            variant="brand"
            size="lg"
            iconRight="arrow-right"
            onPress={() => setSelection({ skill: 'reading', option: 'single', child: 'short' })}
          />
          <Button
            label={L('Full đề Reading', 'Full Reading test')}
            variant="outline"
            size="lg"
            iconLeft="clipboard"
            onPress={() => router.push('/mock-tests' as never)}
          />
          <Button
            label={L('Xen kẽ dạng bài', 'Mixed practice')}
            variant="outline"
            size="lg"
            iconLeft="refresh"
            onPress={() => router.push('/practice-mixed' as never)}
          />
          <Button
            label={L('Đề tự nạp', 'My imported tests')}
            variant="outline"
            size="lg"
            iconLeft="book"
            onPress={() => router.push('/ielts-source-practice' as never)}
          />
        </LightHero>
      </Appear>
      )}

      {!wide ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setRailOpen((v) => !v)}
          style={({ pressed }) => ({ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, ...GLASS, transform: [{ scale: pressed ? 0.97 : 1 }] } as never)}
        >
          <Icon name="filter" size={16} color={GOLD.ink} strokeWidth={2} />
          <Text className="font-strong" style={{ fontSize: 14, color: GOLD.ink }}>
            {railOpen ? L('Đóng bộ lọc', 'Close filters') : L('Bộ lọc', 'Filters')}
          </Text>
        </Pressable>
      ) : null}

      <PlanNudge />

      <View className={wide ? 'mt-4 flex-row gap-5' : 'mt-4'}>
        {wide || railOpen ? (
          <Appear index={2} style={wide ? { width: 268 } : undefined}>
            <View className={wide ? '' : 'mb-4'}>{rail}</View>
          </Appear>
        ) : null}

        {/*
          `key` gồm cả bộ lọc, nên đổi lọc là khối kết quả dựng lại và chạy lại
          hiệu ứng hiện dần. Đây không phải trang trí: lọc xong mà lưới đứng im
          thì không biết bộ lọc đã ăn chưa, nhất là khi số bài không đổi mấy.
        */}
        <View
          className="flex-1"
          key={filterKey}
        >
          {selection.skill === 'reading' ? (
            <ResultGrid
              count={readingMatches.length}
              page={page}
              pageSize={PAGE_SIZE}
              onChangePage={setPage}
              label={L('bài đọc', 'readings')}
              empty={L('Không có bài nào khớp. Bỏ bớt một bộ lọc là ra.', 'Nothing matches. Remove a filter to see more.')}
              onClear={filtersOn ? clearFilters : undefined}
            >
              {readingMatches
                .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
                .map((article: ArticleMeta, i: number) => (
                  <Appear key={article.id} index={i}>
                    <ArticleCard
                      article={article}
                      layout="cover"
                      query={qTypes.length > 0 ? `types=${qTypes.join(',')}` : undefined}
                    />
                  </Appear>
                ))}
            </ResultGrid>
          ) : selection.skill === 'writing' ? (
            (
              <ResultGrid
                count={writingMatches.length}
                page={page}
                pageSize={PAGE_SIZE}
                onChangePage={setPage}
                label={L('đề viết', 'writing prompts')}
                empty={L('Chưa có đề nào.', 'No prompts yet.')}
              >
                {writingMatches
                  .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
                  .map((prompt, i) => (
                    <Appear key={prompt.id} index={i} style={{ height: '100%' }}>
                      <WritingPromptCard prompt={prompt} />
                    </Appear>
                  ))}
              </ResultGrid>
            )
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

/** Viền gradient của hero điện thoại: cùng bảng màu với hero trang chủ. */
const HERO_RING = ['#FF5FA2', '#FFD84A', '#3A8CFF', '#8A3FE0'] as unknown as [string, string, ...string[]];

/**
 * Đầu trang Luyện tập trên điện thoại: thẻ kính, nút vàng là việc chính, các lối phụ
 * thành hàng danh sách. Máy tính và máy tính bảng vẫn dùng LightHero.
 */
function PhoneHeroPanel({
  eyebrow,
  title,
  line2,
  subtitle,
  stats,
  primary,
  links,
}: {
  eyebrow: string;
  title: string;
  line2: string;
  subtitle: string;
  stats: { value: string; label: string }[];
  primary: { label: string; onPress: () => void };
  links: { icon: 'clipboard' | 'refresh' | 'book'; label: string; onPress: () => void }[];
}) {
  return (
    <LinearGradient colors={HERO_RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 2 }}>
      <View style={{ borderRadius: 26, overflow: 'hidden', backgroundColor: '#0B0520' }}>
        <HeroBackdrop />
        <View style={{ padding: 20 }}>
      <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.6, color: 'rgba(27,17,64,0.7)' }}>
        {eyebrow}
      </Text>
      <Text className="font-heavy" style={{ marginTop: 4, fontSize: 30, lineHeight: 36, color: '#1B1140' }}>
        {title}
      </Text>
      <Text className="font-strong" style={{ marginTop: 6, fontSize: 16, lineHeight: 22, color: '#1B1140' }}>
        {line2}
      </Text>
      <Text className="font-sans" style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: 'rgba(27,17,64,0.75)' }}>
        {subtitle}
      </Text>

      <View style={{ marginTop: 16, flexDirection: 'row', borderRadius: 18, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.45)' }}>
        {stats.map((s, i) => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderColor: 'rgba(156,133,82,0.2)' }}>
            <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 24, color: '#1B1140' }}>
              {s.value}
            </Text>
            <Text className="font-sans" style={{ fontSize: 11, lineHeight: 15, color: 'rgba(27,17,64,0.75)' }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={primary.onPress}
        style={({ pressed }) => ({ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 14, backgroundColor: '#1B1140', transform: [{ scale: pressed ? 0.98 : 1 }] } as never)}
      >
        <Text className="font-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
          {primary.label}
        </Text>
        <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.2} />
      </Pressable>

      <View style={{ marginTop: 12, gap: 8 }}>
        {links.map((l) => (
          <Pressable
            key={l.label}
            accessibilityRole="button"
            onPress={l.onPress}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingHorizontal: 14, minHeight: 50, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', opacity: pressed ? 0.8 : 1 } as never)}
          >
            <Icon name={l.icon} size={18} color={'rgba(27,17,64,0.7)'} strokeWidth={2} />
            <Text className="flex-1 font-strong" style={{ fontSize: 15, color: '#1B1140' }}>
              {l.label}
            </Text>
            <Icon name="chevron-right" size={16} color={'rgba(27,17,64,0.75)'} strokeWidth={2.2} />
          </Pressable>
        ))}
      </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function ResultGrid({
  count,
  page,
  pageSize,
  onChangePage,
  label,
  empty,
  onClear,
  children,
}: {
  count: number;
  page: number;
  pageSize: number;
  onChangePage: (next: number) => void;
  label: string;
  empty: string;
  /** Có bộ lọc đang bật thì cho một đường thoát về "tất cả". */
  onClear?: () => void;
  children: React.ReactNode;
}) {
  const { L } = useL();
  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-mid text-label text-muted">
          <Text className="font-heavy text-ink">{count}</Text> {label} {L('khớp bộ lọc', 'match your filters')}
        </Text>
        {onClear ? (
          <Pressable onPress={onClear} accessibilityRole="button">
            <Text className="font-strong text-label text-primary-700">{L('Xoá bộ lọc', 'Clear filters')}</Text>
          </Pressable>
        ) : null}
      </View>

      {count === 0 ? (
        <Card>
          <View className="items-center py-6">
            <CatSticker pose="sleep" size={96} />
            <Text className="mt-3 text-center font-sans text-body text-muted">{empty}</Text>
            {onClear ? (
              <Button className="mt-3" label={L('Xoá bộ lọc', 'Clear filters')} variant="outline" onPress={onClear} />
            ) : null}
          </View>
        </Card>
      ) : (
        <>
          <Grid columns={2} tabletColumns={2} mobileColumns={1}>
            {children}
          </Grid>
          <Pagination page={Math.min(page, pageCount - 1)} pageCount={pageCount} onChange={onChangePage} />
        </>
      )}
    </View>
  );
}

function WritingPromptCard({ prompt }: { prompt: (typeof WRITING_PROMPTS)[number] }) {
  const { L } = useL();
  return (
    <PressScale
      onPress={() => router.push(`/write/${prompt.id}` as never)}
      style={{ height: '100%' }}
    >
      <Card className="h-full">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge
            label={prompt.task === 'ielts_task1' ? 'Task 1' : 'Task 2'}
            tone={prompt.task === 'ielts_task1' ? 'primary' : 'accent'}
            shape="tag"
          />
          {prompt.chartKind ? <Badge label={prompt.chartKind} tone="neutral" shape="tag" /> : null}
          <Badge label={`Band ${prompt.difficultyBand}`} tone="info" shape="tag" />
        </View>
        {/*
          Task 1 hiện luôn biểu đồ ngay trên thẻ.

          Đề Task 1 là "tả cái biểu đồ này", nên chỉ đọc chữ đề thì chưa biết
          mình sắp làm gì — hai đề line graph khác nhau có phần chữ gần như y
          hệt. Nhìn thấy hình rồi mới chọn được đề muốn luyện.

          Hình dựng từ chính `chartData` của đề, không phải ảnh chụp sẵn, nên nó
          không bao giờ lệch với hình trong màn làm bài.
        */}
        {prompt.chartData ? (
          <View className="mt-2 overflow-hidden">
            <ChartFigure data={prompt.chartData} width={THUMB_WIDTH} />
          </View>
        ) : null}
        <Text className="mt-2 font-sans text-body text-ink" numberOfLines={prompt.chartData ? 2 : 4}>
          {prompt.promptText}
        </Text>
        <View className="flex-1" />
        <View className="mt-2 flex-row items-center gap-3">
          <Meta icon="clock" text={L(`${Math.round(prompt.timeLimitSeconds / 60)} phút`, `${Math.round(prompt.timeLimitSeconds / 60)} min`)} />
          <Meta icon="list" text={L(`≥ ${prompt.minWords} từ`, `≥ ${prompt.minWords} words`)} />
        </View>
      </Card>
    </PressScale>
  );
}

function Meta({ icon, text }: { icon: 'clock' | 'list'; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={13} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{text}</Text>
    </View>
  );
}
