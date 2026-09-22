import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade, PressScale } from '@/components/motion/Motion';
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
import { HoverPressable } from '@/components/ui/HoverPressable';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';

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
 */

const PAGE_SIZE = 12;
const INK = '#1F2A12';

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
        <Text style={{ marginTop: 22, fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 13, lineHeight: 20, color: '#5B6350' }}>
          Chỉ đăng lại bài từ những nơi cho phép dùng lại toàn văn (public domain hoặc Creative Commons). Mỗi bài có link bài gốc và ghi
          giấy phép. Bài của ReadUp Analysis do ReadUp tự viết.
        </Text>
      </Appear>
    </View>
  );
}

function OutletCard({ outlet, count }: { outlet: BilingualOutlet; count: number }) {
  const featured = outlet.key === 'readup';
  return (
    <PressScale
      accessibilityRole="link"
      accessibilityLabel={`Mở ${outlet.name}`}
      onPress={() => router.setParams({ s: outlet.key })}
      style={{ height: '100%' }}
    >
      <View className="h-full overflow-hidden rounded-card bg-white" style={sticker}>
        {/* bìa — chữ tên báo là hình minh hoạ, không mượn logo của ai */}
        <View className="justify-between p-6" style={{ backgroundColor: outlet.cover, minHeight: 190 }}>
          <View className="flex-row items-start justify-between gap-3">
            <Text
              style={{
                fontFamily: readingFont.display,
                fontWeight: '800',
                fontStyle: outlet.key === 'gv' || featured ? 'italic' : 'normal',
                fontSize: 34,
                lineHeight: 38,
                color: outlet.ink,
                flexShrink: 1,
              }}
            >
              {outlet.name}
            </Text>
            {featured ? (
              <View className="rounded-pill px-2.5 py-1" style={{ backgroundColor: INK, transform: [{ rotate: '4deg' }] }}>
                <Text style={{ fontSize: 9.5, fontWeight: '800', letterSpacing: 1, color: '#F2B84B' }}>RECOMMENDED</Text>
              </View>
            ) : null}
          </View>
          <View className="mt-6 flex-row items-end justify-between">
            <Text style={{ fontFamily: readingFont.display, fontWeight: '800', fontSize: 56, lineHeight: 58, color: outlet.ink, opacity: 0.95 }}>
              {count}
              <Text style={{ fontFamily: readingFont.body, fontStyle: 'italic', fontWeight: '400', fontSize: 18 }}> bài</Text>
            </Text>
            <View className="h-11 w-11 items-center justify-center rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <Icon name="arrow-right" size={20} color={outlet.ink} strokeWidth={2.2} />
            </View>
          </View>
        </View>
        <View className="px-6 py-4">
          <Text style={{ fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 15.5, lineHeight: 23, color: '#33402A' }}>
            {outlet.tagline}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: readingFont.mono, fontSize: 10.5, letterSpacing: 1.2, color: '#7A8466' }}>
            {outlet.license.toUpperCase()}
          </Text>
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
        <Icon name="chevron-left" size={16} color="#3F4636" strokeWidth={2.2} />
        <Text className="font-semi" style={{ fontSize: 13, color: '#3F4636' }}>
          Quay lại danh sách báo
        </Text>
      </Pressable>

      {/* đầu báo */}
      <Appear>
        <View className="mt-4 items-center border-b border-t py-7" style={{ borderColor: 'rgba(31,42,18,0.18)' }}>
          <Text
            style={{
              fontFamily: readingFont.display,
              fontWeight: '800',
              fontStyle: outlet.key === 'gv' || outlet.key === 'readup' ? 'italic' : 'normal',
              fontSize: 46,
              lineHeight: 52,
              color: INK,
              textAlign: 'center',
            }}
          >
            {outlet.name}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 16, color: '#4A5236', textAlign: 'center' }}>
            {outlet.tagline}
          </Text>
        </View>
      </Appear>

      {/* sắp xếp + lọc */}
      <View className="mt-6 flex-row flex-wrap items-center gap-2.5">
        <SortTab label="↓ Mới nhất" active={sort === 'new'} onPress={() => { setSort('new'); setPage(0); }} />
        <SortTab label="◔ Dễ trước" active={sort === 'easy'} onPress={() => { setSort('easy'); setPage(0); }} />
        <SortTab label="≡ Ngắn trước" active={sort === 'short'} onPress={() => { setSort('short'); setPage(0); }} />
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
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={26}>
              {shown.map((a, i) => (
                <Appear key={a.id} index={i} style={{ height: '100%' }}>
                  <ArticleCard article={a} outlet={outlet} />
                </Appear>
              ))}
            </Grid>
          ) : (
            <Text style={{ fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 16, color: '#5B6350' }}>
              Không có bài nào khớp bộ lọc — thử bỏ bớt một điều kiện.
            </Text>
          )}
        </CrossFade>
      </View>

      <Pagination page={current} pageCount={pageCount} onChange={setPage} />
    </View>
  );
}

const TOPIC_TINT: Record<string, string> = {
  'Khoa học & môi trường': '#CFE3C0',
  'Ngôn ngữ & giáo dục': '#E9D9F2',
  'Đời sống & xã hội': '#F6DCC6',
  'Lịch sử & văn hoá': '#EFE2B8',
  'Công nghệ & kinh tế': '#CFDDF3',
  'Sức khoẻ & cơ thể': '#F4CFCF',
  'Việt Nam & khu vực': '#F3E6A6',
};

function ArticleCard({ article, outlet }: { article: BilingualArticle; outlet: BilingualOutlet }) {
  const tint = TOPIC_TINT[article.topic] ?? '#E8EBDD';
  const source = article.source;

  return (
    <HoverPressable
      accessibilityRole="link"
      onPress={() => router.push(`/bilingual/${article.id}` as never)}
      className="h-full"
      style={({ hovered, pressed }) => [
        { transform: [{ translateY: hovered ? -3 : 0 }], opacity: pressed ? 0.94 : 1 },
        Platform.OS === 'web' ? ({ transitionProperty: 'transform', transitionDuration: '200ms' } as object) : null,
      ]}
    >
      {/* bìa chữ: tiêu đề làm tranh, màu theo chủ đề — không dùng ảnh của báo */}
      <View className="overflow-hidden rounded-card p-5" style={{ backgroundColor: tint, minHeight: 170, borderWidth: 1.5, borderColor: 'rgba(31,42,18,0.15)' }}>
        <Text style={{ fontFamily: readingFont.mono, fontSize: 10, letterSpacing: 1.4, color: 'rgba(31,42,18,0.6)' }}>
          {article.level} · {article.estMinutes} MIN
        </Text>
        <Text
          numberOfLines={4}
          style={{ marginTop: 10, fontFamily: readingFont.display, fontStyle: 'italic', fontWeight: '800', fontSize: 25, lineHeight: 29, color: INK }}
        >
          “{stripInline(article.titleEn)}”
        </Text>
        <View className="absolute -bottom-6 -right-4 h-24 w-24 rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </View>

      <View className="mt-3.5 flex-1">
        <Text style={{ fontFamily: readingFont.mono, fontSize: 10.5, letterSpacing: 1.2, color: '#6B7B3F' }}>
          ▤ {article.topic.toUpperCase()}
        </Text>
        <Text numberOfLines={3} style={{ marginTop: 6, fontFamily: readingFont.display, fontWeight: '700', fontSize: 20, lineHeight: 26, color: INK }}>
          {stripInline(article.titleEn)}
        </Text>

        {source ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(source.url)}
            className="mt-2 self-start flex-row items-center gap-1 rounded-pill px-2.5 py-0.5"
            style={{ borderWidth: 1.2, borderColor: '#93A7F5', backgroundColor: 'rgba(147,167,245,0.12)' }}
          >
            <Text style={{ fontFamily: readingFont.display, fontWeight: '700', fontSize: 10, letterSpacing: 0.6, color: '#3B4FB8' }}>
              LINK BÀI VIẾT GỐC | {outlet.name.toUpperCase()}
            </Text>
            <Icon name="external" size={10} color="#3B4FB8" strokeWidth={2.2} />
          </Pressable>
        ) : null}

        <Text numberOfLines={2} style={{ marginTop: 8, fontFamily: readingFont.body, fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: '#55604A' }}>
          {stripInline(article.titleVi)}
        </Text>
        <View className="flex-1" />
        <View className="mt-4 flex-row items-center justify-between border-t pt-2.5" style={{ borderColor: 'rgba(31,42,18,0.12)' }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: readingFont.mono, fontSize: 10, letterSpacing: 1, color: '#7A8466' }}>
            {source?.author ? `BY ${source.author.toUpperCase()}` : 'READUP ANALYSIS'}
          </Text>
          <Text style={{ fontFamily: readingFont.mono, fontSize: 10, letterSpacing: 1, color: '#7A8466' }}>
            {article.wordCount} TỪ
          </Text>
        </View>
      </View>
    </HoverPressable>
  );
}

function SortTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className="px-3.5 py-2"
      style={{
        borderWidth: 2,
        borderColor: INK,
        backgroundColor: active ? INK : '#FFFFFF',
        ...(Platform.OS === 'web' ? ({ boxShadow: `3px 3px 0 ${INK}` } as object) : null),
      }}
    >
      <Text style={{ fontFamily: readingFont.mono, fontSize: 11.5, letterSpacing: 1, fontWeight: '700', color: active ? '#FFFFFF' : INK }}>
        {label.toUpperCase()}
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
      accessibilityState={{ selected: active }}
      className="rounded-pill px-3 py-1.5"
      style={{ borderWidth: 1.5, borderColor: active ? INK : 'rgba(31,42,18,0.2)', backgroundColor: active ? '#E3EACF' : 'rgba(255,255,255,0.7)' }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: '600', color: INK }}>{label}</Text>
    </Pressable>
  );
}

const sticker = {
  borderWidth: 2,
  borderColor: INK,
  ...(Platform.OS === 'web' ? ({ boxShadow: `5px 6px 0 ${INK}` } as object) : { elevation: 4 }),
};
