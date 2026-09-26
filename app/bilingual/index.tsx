import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade, PressScale } from '@/components/motion/Motion';
import { BilingualLines, LEVEL_TONE, LessonCard } from '@/components/sentence/LessonCard';
import { Icon, Pagination } from '@/components/ui';
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
 * đúng ngôn ngữ của ReadUp: thẻ trắng bóng mềm, dấu vân vẽ từ dữ liệu (thanh phân
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
  borderColor: '#E6E8F2',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(30,41,99,0.08)' } as object)
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
  const stats = bilingualStats();
  return (
    <View>
      <Appear>
        <LightHero
        scene="home"
          badge="BILINGUAL PRESS · MIỄN PHÍ"
          line1="Đọc báo"
          line2="song ngữ"
          subtitle={`${stats.articles} bài báo và bài phân tích, tiếng Anh nguyên văn đặt cạnh bản dịch. Rê chuột vào từ để xem nghĩa, ví dụ và từ đồng nghĩa.`}
          footer={
            <>
              <HeroStat value={String(stats.articles)} label="bài báo" />
              <HeroStat value={String(BILINGUAL_OUTLETS.length)} label="tờ báo" />
              <HeroStat value="100%" label="miễn phí" />
            </>
          }
        />
      </Appear>

      <View className="mt-8">
        <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={22}>
          {BILINGUAL_OUTLETS.map((o, i) => (
            <Appear key={o.key} index={i + 1} style={{ height: '100%' }}>
              <OutletCard outlet={o} count={articlesOfOutlet(o.key).length} />
            </Appear>
          ))}
        </Grid>
      </View>

      <Appear index={6}>
        <Text className="font-sans" style={{ marginTop: 22, fontSize: 13, lineHeight: 20, color: INK, opacity: 0.75 }}>
          Chỉ đăng lại bài từ những nơi cho phép dùng lại toàn văn (public domain hoặc Creative Commons). Mỗi bài có link bài gốc và ghi
          giấy phép. Bài của ReadUp Analysis do ReadUp tự viết.
        </Text>
      </Appear>
    </View>
  );
}

function OutletCard({ outlet, count }: { outlet: BilingualOutlet; count: number }) {
  const featured = outlet.key === 'readup';
  const articles = useMemo(() => articlesOfOutlet(outlet.key), [outlet.key]);
  const byLevel = useMemo(() => {
    const out: { level: string; n: number }[] = [];
    for (const l of BILINGUAL_LEVELS) {
      const n = articles.filter((x) => x.level === l).length;
      if (n > 0) out.push({ level: l, n });
    }
    return out;
  }, [articles]);
  const minutes = articles.map((x) => x.estMinutes);
  const span = minutes.length ? `${Math.min(...minutes)}–${Math.max(...minutes)} phút/bài` : '';

  return (
    <PressScale
      accessibilityRole="link"
      accessibilityLabel={`Mở ${outlet.name}`}
      onPress={() => router.setParams({ s: outlet.key })}
      style={{ height: '100%' }}
    >
      <View className="h-full rounded-[22px] bg-white p-5" style={SOFT_CARD}>
        <View className="flex-row items-center gap-4">
          <View className="items-center justify-center rounded-2xl" style={{ width: 58, height: 58, backgroundColor: outlet.cover }}>
            <Text className="font-heavy" style={{ fontSize: 18, letterSpacing: 0.5, color: outlet.ink }}>
              {monogram(outlet.name)}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-heavy" style={{ fontSize: 20, lineHeight: 25, color: INK }}>
                {outlet.name}
              </Text>
              {featured ? (
                <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: '#EEF2FF' }}>
                  <Text className="font-strong" style={{ fontSize: 11, color: color.primary }}>
                    Nên đọc trước
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-0.5 font-sans" style={{ fontSize: 14, lineHeight: 20, color: MUTED }} numberOfLines={2}>
              {outlet.tagline}
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: '#F1F4FB' }}>
            <Icon name="arrow-right" size={18} color={INK} strokeWidth={2.2} />
          </View>
        </View>

        {/* Dấu vân: tờ báo này nặng trình độ nào — chia đúng theo số bài thật. */}
        <View className="mt-5 flex-row overflow-hidden rounded-pill" style={{ height: 10, backgroundColor: '#F1F4FB' }}>
          {byLevel.map((l) => (
            <View key={l.level} style={{ flexGrow: l.n, flexBasis: 0, backgroundColor: (LEVEL_TONE[levelKey(l.level)] ?? LEVEL_TONE.B1!).mid }} />
          ))}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
          {byLevel.map((l) => (
            <View key={l.level} className="flex-row items-center gap-1">
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: (LEVEL_TONE[levelKey(l.level)] ?? LEVEL_TONE.B1!).mid }} />
              <Text className="font-mid text-label" style={{ color: MUTED }}>
                {l.level} · {l.n}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-1" />
        <View className="mt-4 flex-row flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3" style={{ borderColor: '#EEF0F6' }}>
          <Text className="font-strong" style={{ fontSize: 14, color: INK }}>
            {count} bài
          </Text>
          {span ? <Text className="font-mid text-label" style={{ color: MUTED }}>{span}</Text> : null}
          <View className="ml-auto rounded-pill px-2 py-0.5" style={{ backgroundColor: '#F1F4FB' }}>
            <Text className="font-semi" style={{ fontSize: 11, color: MUTED }}>
              {outlet.license}
            </Text>
          </View>
        </View>
      </View>
    </PressScale>
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
          Tất cả tờ báo
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
              {outlet.tagline}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <StatPill value={String(all.length)} label="bài" />
            <StatPill value={levels.length > 1 ? `${levels[0]} → ${levels[levels.length - 1]}` : (levels[0] ?? '—')} label="trình độ" />
          </View>
        </View>
      </Appear>

      {/* sắp xếp + lọc */}
      <View className="mt-5 flex-row flex-wrap items-center gap-3">
        <View className="flex-row rounded-pill p-1" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
          <SortTab label="Mới nhất" active={sort === 'new'} onPress={() => { setSort('new'); setPage(0); }} />
          <SortTab label="Dễ trước" active={sort === 'easy'} onPress={() => { setSort('easy'); setPage(0); }} />
          <SortTab label="Ngắn trước" active={sort === 'short'} onPress={() => { setSort('short'); setPage(0); }} />
        </View>
        <Text className="font-semi text-label" style={{ color: INK, opacity: 0.7 }}>
          {list.length} bài khớp
        </Text>
      </View>

      <FilterRow>
        <Chip label="Mọi trình độ" active={level === 'all'} onPress={() => { setLevel('all'); setPage(0); }} />
        {levels.map((l) => (
          <Chip key={l} label={l} active={level === l} onPress={() => { setLevel(level === l ? 'all' : l); setPage(0); }} />
        ))}
      </FilterRow>
      {topics.length > 1 ? (
        <FilterRow>
          <Chip label="Mọi chủ đề" active={topic === 'all'} onPress={() => { setTopic('all'); setPage(0); }} />
          {topics.map((t) => (
            <Chip key={t} label={t} active={topic === t} onPress={() => { setTopic(topic === t ? 'all' : t); setPage(0); }} />
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
              Không có bài nào khớp bộ lọc — thử bỏ bớt một điều kiện.
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
  return (
    <LessonCard
      number={article.order}
      eyebrow={`${article.topic.toUpperCase()}`}
      level={levelKey(article.level)}
      levelLabel={`${article.level} · ${article.estMinutes} phút đọc`}
      icon="book"
      title={stripInline(article.titleEn)}
      blurb={stripInline(article.titleVi)}
      meta={[
        { icon: 'list', label: `${article.wordCount} từ` },
        { icon: 'note', label: `${article.paragraphs.length} đoạn` },
      ]}
      done={0}
      visual={(tone, active) => <BilingualLines pairs={article.paragraphs} tone={tone} active={active} />}
      onPress={() => router.push(`/bilingual/${article.id}` as never)}
      secondary={source ? { label: `Bài gốc · ${outlet.name}`, onPress: () => void Linking.openURL(source.url) } : undefined}
    />
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: '#F1F4FB' }}>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
      <View className="flex-row gap-1.5 py-0.5">{children}</View>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={active}
      className="rounded-pill px-3 py-1.5"
      style={{ borderWidth: 1, borderColor: active ? color.primary : '#E0E4F0', backgroundColor: active ? color.primary : 'rgba(255,255,255,0.85)' }}
    >
      <Text className="font-semi" style={{ fontSize: 13, color: active ? '#FFFFFF' : INK }}>{label}</Text>
    </Pressable>
  );
}
