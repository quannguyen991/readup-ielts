import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { BilingualLines, LessonCard } from '@/components/sentence/LessonCard';
import { ArticleFeed } from '@/components/bilingual/ArticleFeed';
import { HScroll, Icon, Pagination } from '@/components/ui';
import {
  BILINGUAL_LEVELS,
  BILINGUAL_OUTLETS,
  BILINGUAL_TOPICS,
  articlesOfOutlet,
  bilingualStats,
  type BilingualArticle,
  type BilingualOutlet,
} from '@/data/bilingual-repository';
import { stripInline } from '@/lib/inlineMarkup';
import { useReadingFonts } from '@/lib/readingFonts';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { bilingualTagline, bilingualTopic } from '@/components/bilingual/labels-en';

/**
 * Cổng "Đọc báo song ngữ".
 *
 * HAI TẦNG, như một sạp báo: chọn TỜ BÁO trước, rồi mới chọn BÀI. Bày 104 bài
 * lẫn lộn trên một lưới thì người học không có cách nào ước lượng giọng văn và
 * độ khó — một bài NASA viết cho nhà khoa học đứng cạnh một bài VOA viết cho
 * người mới học. Đi qua tờ báo, người học chọn được "hôm nay đọc cái dễ" hay
 * "hôm nay đọc cái thật".
 *
 * BẢN QUYỀN. Chỉ những nơi cho phép dùng lại toàn văn mới có mặt ở đây (xem
 * `BILINGUAL_OUTLETS`). Mỗi bài báo có link bài gốc trên đầu và ghi rõ giấy
 * phép ở cuối. Kho này MIỄN PHÍ cho mọi người — không nằm sau gói trả phí.
 *
 * Tờ báo đang chọn nằm trên URL (`?s=voa`), để gửi link cho bạn là mở đúng chỗ.
 *
 * THIẾT KẾ (26/09/2026): bỏ dáng "sạp báo giấy" cũ — viền đen 2px, bóng lệch đen,
 * nút sắp xếp chữ máy đánh — vì người dùng thấy giống IELTS Dictionary. Giờ dùng
 * đúng ngôn ngữ của Band 9: thẻ trắng bóng mềm, dấu vân vẽ từ dữ liệu (thanh phân
 * bố trình độ của tờ báo, cặp vạch Anh–Việt theo độ dài từng đoạn của bài).
 */

const PAGE_SIZE = 12;
const INK = '#1E2748';
const MUTED = '#5A6485';

/** "B1 – B2" → "B2": tô màu theo mức cao hơn của khoảng. */
function levelKey(level: string): string {
  return level.split(/\s*[–-]\s*/).pop() ?? level;
}

/** Hai–ba chữ cái đầu tên báo, làm con dấu thay logo (không mượn logo của ai). */
function monogram(name: string): string {
  const caps = name.split(/\s+/).filter(Boolean).map((w) => w[0]!.toUpperCase());
  return caps.slice(0, 3).join('');
}

const SOFT_CARD = {
  borderWidth: 1,
  borderColor: '#F3F0FB',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(94, 72, 35,0.08)' } as object)
    : { elevation: 2 }),
};

type SortKey = 'new' | 'easy' | 'short';

export default function BilingualPortalScreen() {
  useReadingFonts();
  const params = useLocalSearchParams<{ s?: string }>();
  const outletKey = typeof params.s === 'string' && BILINGUAL_OUTLETS.some((o) => o.key === params.s) ? params.s : null;
  const outlet = BILINGUAL_OUTLETS.find((o) => o.key === outletKey) ?? null;

  return (
    <Screen>
      <CrossFade swapKey={outlet ? `outlet-${outlet.key}` : 'portal'}>
        {outlet ? <OutletView outlet={outlet} /> : <PortalView />}
      </CrossFade>
    </Screen>
  );
}

/* ====================================================================== */
/*                                 TẦNG 1 — SẠP BÁO                        */
/* ====================================================================== */

function PortalView() {
  const { L } = useL();
  const stats = bilingualStats();
  return (
    <View>
      <Appear>
        <LightHero
        scene="home"
          badge={L('MIỄN PHÍ', 'FREE')}
          line1={L('Đọc báo', 'Bilingual')}
          line2={L('song ngữ', 'news reading')}
          subtitle={L(
            `${stats.articles} bài báo và bài phân tích, tiếng Anh nguyên văn đặt cạnh bản dịch. Rê chuột vào từ để xem nghĩa, ví dụ và từ đồng nghĩa.`,
            `${stats.articles} news stories and analyses, original English side by side with a Vietnamese translation. Hover over a word to see its meaning, examples and synonyms.`,
          )}
          footer={
            <>
              <HeroStat value={String(stats.articles)} label={L('bài báo', 'articles')} />
              <HeroStat value={String(BILINGUAL_OUTLETS.length)} label={L('tờ báo', 'outlets')} />
              <HeroStat value="100%" label={L('miễn phí', 'free')} />
            </>
          }
        />
      </Appear>

      <Appear index={1}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={L('Mở kệ sách song ngữ', 'Open bilingual book library')}
          onPress={() => router.push('/bilingual/books' as never)}
          className="mt-5"
        >
          <View className="flex-row flex-wrap items-center justify-between gap-4 rounded-[22px] bg-white p-5" style={SOFT_CARD}>
            <View className="flex-row items-center gap-4" style={{ flexShrink: 1 }}>
              <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: '#F3F0FB' }}>
                <Icon name="book" size={25} color="#6A4BD9" strokeWidth={1.9} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text className="font-heavy" style={{ color: INK, fontSize: 20 }}>
                  {L('Kệ sách song ngữ', 'Bilingual bookshelf')}
                </Text>
                <Text className="mt-1 font-sans" style={{ color: MUTED, fontSize: 14, lineHeight: 20 }}>
                  {L('Sách kiến thức, truyện và bản sách riêng của bạn', 'Nonfiction, stories and your own book files')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 rounded-pill px-4 py-2.5" style={{ backgroundColor: color.primary }}>
              <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 13 }}>
                {L('Mở kệ sách', 'Open library')}
              </Text>
              <Icon name="arrow-right" size={16} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </View>
        </Pressable>
      </Appear>

      <Appear index={2}>
        <View className="mt-8">
          <ArticleFeed />
        </View>
      </Appear>

      <Appear index={3}>
        <Text className="font-sans" style={{ marginTop: 22, fontSize: 13, lineHeight: 20, color: INK, opacity: 0.75 }}>
          {L('Bài có giấy phép dùng lại, kèm link gốc.', 'Openly licensed articles, each linked to its source.')}
        </Text>
      </Appear>
    </View>
  );
}

/* ====================================================================== */
/*                              TẦNG 2 — MỘT TỜ BÁO                        */
/* ====================================================================== */

function OutletView({ outlet }: { outlet: BilingualOutlet }) {
  const [sort, setSort] = useState<SortKey>(outlet.key === 'readup' ? 'easy' : 'new');
  const [level, setLevel] = useState<string>('all');
  const [topic, setTopic] = useState<string>('all');
  const [page, setPage] = useState(0);
  const { L, en } = useL();

  const all = useMemo(() => articlesOfOutlet(outlet.key), [outlet.key]);
  const levels = BILINGUAL_LEVELS.filter((l) => all.some((a) => a.level === l));
  const topics = BILINGUAL_TOPICS.filter((t) => all.some((a) => a.topic === t));

  const list = useMemo(() => {
    const rank = (l: string) => BILINGUAL_LEVELS.indexOf(l);
    const filtered = all.filter((a) => (level === 'all' || a.level === level) && (topic === 'all' || a.topic === topic));
    if (sort === 'easy') return [...filtered].sort((a, b) => rank(a.level) - rank(b.level) || a.order - b.order);
    if (sort === 'short') return [...filtered].sort((a, b) => a.wordCount - b.wordCount);
    return filtered;
  }, [all, level, topic, sort]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = list.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.setParams({ s: undefined })}
        className="self-start flex-row items-center gap-1.5 py-1"
      >
        <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.2} />
        <Text className="font-semi" style={{ fontSize: 14, color: INK }}>
          {L('Tất cả tờ báo', 'All outlets')}
        </Text>
      </Pressable>

      {/* đầu báo */}
      <Appear>
        <View className="mt-3 flex-row flex-wrap items-center gap-4 rounded-[22px] bg-white p-5" style={SOFT_CARD}>
          <View className="items-center justify-center rounded-2xl" style={{ width: 64, height: 64, backgroundColor: outlet.cover }}>
            <Text className="font-heavy" style={{ fontSize: 20, color: outlet.ink }}>
              {monogram(outlet.name)}
            </Text>
          </View>
          <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
            <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 34, color: INK }}>
              {outlet.name}
            </Text>
            <Text className="mt-0.5 font-sans" style={{ fontSize: 15, lineHeight: 22, color: MUTED }}>
              {bilingualTagline(outlet.key, outlet.tagline, en)}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <StatPill value={String(all.length)} label={L('bài', 'articles')} />
            <StatPill value={levels.length > 1 ? `${levels[0]} → ${levels[levels.length - 1]}` : (levels[0] ?? '—')} label={L('trình độ', 'level')} />
          </View>
        </View>
      </Appear>

      {/* sắp xếp + lọc */}
      <View className="mt-5 flex-row flex-wrap items-center gap-3">
        <View className="flex-row rounded-pill p-1" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
          <SortTab label={L('Mới nhất', 'Newest')} active={sort === 'new'} onPress={() => { setSort('new'); setPage(0); }} />
          <SortTab label={L('Dễ trước', 'Easiest')} active={sort === 'easy'} onPress={() => { setSort('easy'); setPage(0); }} />
          <SortTab label={L('Ngắn trước', 'Shortest')} active={sort === 'short'} onPress={() => { setSort('short'); setPage(0); }} />
        </View>
        <Text className="font-semi text-label" style={{ color: INK, opacity: 0.7 }}>
          {L(`${list.length} bài khớp`, `${list.length} matching`)}
        </Text>
      </View>

      <FilterRow>
        <Chip label={L('Mọi trình độ', 'All levels')} active={level === 'all'} onPress={() => { setLevel('all'); setPage(0); }} />
        {levels.map((l) => (
          <Chip key={l} label={l} active={level === l} onPress={() => { setLevel(level === l ? 'all' : l); setPage(0); }} />
        ))}
      </FilterRow>
      {topics.length > 1 ? (
        <FilterRow>
          <Chip label={L('Mọi chủ đề', 'All topics')} active={topic === 'all'} onPress={() => { setTopic('all'); setPage(0); }} />
          {topics.map((t) => (
            <Chip key={t} label={bilingualTopic(t, en)} active={topic === t} onPress={() => { setTopic(topic === t ? 'all' : t); setPage(0); }} />
          ))}
        </FilterRow>
      ) : null}

      <View className="mt-6">
        <CrossFade swapKey={`${sort}-${level}-${topic}-${current}`}>
          {shown.length > 0 ? (
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
              {shown.map((a, i) => (
                <Appear key={a.id} index={i} style={{ height: '100%' }}>
                  <ArticleCard article={a} outlet={outlet} />
                </Appear>
              ))}
            </Grid>
          ) : (
            <Text className="font-sans" style={{ fontSize: 15, color: INK }}>
              {L('Không có bài nào khớp bộ lọc — thử bỏ bớt một điều kiện.', 'No articles match these filters — try removing one.')}
            </Text>
          )}
        </CrossFade>
      </View>

      <Pagination page={current} pageCount={pageCount} onChange={setPage} />
    </View>
  );
}

function ArticleCard({ article, outlet }: { article: BilingualArticle; outlet: BilingualOutlet }) {
  const source = article.source;
  const { L, en } = useL();
  return (
    <LessonCard
      number={article.order}
      eyebrow={bilingualTopic(article.topic, en).toUpperCase()}
      level={levelKey(article.level)}
      levelLabel={L(`${article.level} · ${article.estMinutes} phút đọc`, `${article.level} · ${article.estMinutes} min read`)}
      icon="book"
      title={stripInline(article.titleEn)}
      blurb={stripInline(en ? article.standfirstEn : article.titleVi)}
      meta={[
        { icon: 'list', label: L(`${article.wordCount} từ`, `${article.wordCount} words`) },
        { icon: 'note', label: L(`${article.paragraphs.length} đoạn`, `${article.paragraphs.length} paragraphs`) },
      ]}
      done={0}
      visual={(tone, active) => <BilingualLines pairs={article.paragraphs} tone={tone} active={active} />}
      onPress={() => router.push(`/bilingual/${article.id}` as never)}
      secondary={source ? { label: L(`Bài gốc · ${outlet.name}`, `Original · ${outlet.name}`), onPress: () => void Linking.openURL(source.url) } : undefined}
    />
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: '#F3F0FB' }}>
      <Text className="font-heavy" style={{ fontSize: 15, color: INK }}>
        {value}
      </Text>
      <Text className="font-mid text-label" style={{ color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}

function SortTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      aria-selected={active}
      onPress={onPress}
      className="rounded-pill px-3.5 py-1.5"
      style={{
        backgroundColor: active ? color.primary : 'transparent',
        ...(Platform.OS === 'web' ? ({ transition: 'background-color 160ms ease' } as object) : null),
      }}
    >
      <Text className="font-strong" style={{ fontSize: 13, color: active ? '#FFFFFF' : INK }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <HScroll style={{ marginTop: 12 }}>
      <View className="flex-row gap-1.5 py-0.5">{children}</View>
    </HScroll>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={active}
      className="items-center justify-center rounded-pill px-3 py-1.5"
      style={{ minHeight: 44, borderWidth: 1, borderColor: active ? color.primary : '#F3F0FB', backgroundColor: active ? color.primary : 'rgba(255,255,255,0.85)' }}
    >
      <Text className="font-semi" style={{ fontSize: 13, color: active ? '#FFFFFF' : INK }}>{label}</Text>
    </Pressable>
  );
}
