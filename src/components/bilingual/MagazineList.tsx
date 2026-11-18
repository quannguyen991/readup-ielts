import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Icon } from '@/components/ui';
import { BILINGUAL_LEVELS, type BilingualArticle } from '@/data/bilingual-repository';
import { stripInline } from '@/lib/inlineMarkup';
import { readingFont } from '@/lib/readingFonts';
import { useL } from '@/i18n/useL';
import { color, fontFamily } from '@/theme/tokens';
import { foldVi } from '@/components/catalog/catalog-model';
import { ArticleCard } from './ArticleFeed';
import { ArticleCover, CATEGORIES, CATEGORY_ORDER, categoryOf, type CategoryKey } from './ArticleCover';

/**
 * DANH SÁCH BÀI CỦA MỘT TỜ BÁO, dạng tạp chí: ô tìm kiếm + chọn mức + chọn chủ đề ở đầu,
 * một BÀI NỔI BẬT lớn (ảnh bìa, tiêu đề Anh, tiêu đề Việt, tóm tắt), rồi lưới thẻ có ảnh bìa.
 *
 * Bài nổi bật là bài đầu danh sách sau khi lọc — đổi bộ lọc thì bài nổi bật đổi theo,
 * nên luôn có một "cửa chính" rõ ràng thay vì một lưới thẻ ngang hàng.
 */

const PAGE = 12;
const INK = '#2B2350';
const MUTED = '#6B6590';
const SOFT = {
  borderWidth: 1,
  borderColor: '#EEEAF8',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 12px 30px rgba(80,60,160,0.08)' } as object)
    : { elevation: 2 }),
};

type Sort = 'new' | 'easy' | 'short';

export function MagazineList({ articles, defaultSort = 'new' }: { articles: BilingualArticle[]; defaultSort?: Sort }) {
  const { L, en } = useL();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [cat, setCat] = useState<CategoryKey | 'all'>('all');
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [shown, setShown] = useState(PAGE);

  const levels = useMemo(() => BILINGUAL_LEVELS.filter((l) => articles.some((a) => a.level === l)), [articles]);
  const cats = useMemo(() => {
    const m = new Map<CategoryKey, number>();
    for (const a of articles) m.set(categoryOf(a.topic), (m.get(categoryOf(a.topic)) ?? 0) + 1);
    return CATEGORY_ORDER.filter((k) => (m.get(k) ?? 0) > 0).map((k) => [k, m.get(k)!] as const);
  }, [articles]);

  const list = useMemo(() => {
    const needle = foldVi(query.trim());
    const rank = (l: string) => BILINGUAL_LEVELS.indexOf(l);
    const out = articles.filter(
      (a) =>
        (level === 'all' || a.level === level) &&
        (cat === 'all' || categoryOf(a.topic) === cat) &&
        (!needle || foldVi(`${stripInline(a.titleEn)} ${a.titleVi} ${a.source?.author ?? ''} ${a.topic}`).includes(needle)),
    );
    if (sort === 'easy') return [...out].sort((a, b) => rank(a.level) - rank(b.level) || a.order - b.order);
    if (sort === 'short') return [...out].sort((a, b) => a.wordCount - b.wordCount);
    return out;
  }, [articles, query, level, cat, sort]);

  const reset = () => setShown(PAGE);
  const [featured, ...rest] = list;

  return (
    <View style={{ gap: 18 }}>
      {/* Tìm kiếm + sắp xếp */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <View
          style={[SOFT, { flex: 1, minWidth: 240, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 16, minHeight: 48 }]}
        >
          <Icon name="search" size={18} color={MUTED} />
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              reset();
            }}
            placeholder={L('Tìm bài báo, tác giả…', 'Search articles, authors…')}
            placeholderTextColor="#9A94B8"
            accessibilityLabel={L('Tìm bài báo', 'Search articles')}
            style={{ flex: 1, fontSize: 15, color: INK, paddingVertical: 10, outlineStyle: 'none' } as object}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá tìm kiếm', 'Clear search')} onPress={() => setQuery('')} hitSlop={10}>
              <Icon name="close" size={16} color={MUTED} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 999, padding: 4 }}>
          {([
            ['new', L('Mới nhất', 'Newest')],
            ['easy', L('Dễ trước', 'Easiest')],
            ['short', L('Ngắn trước', 'Shortest')],
          ] as const).map(([k, label]) => (
            <Pressable
              key={k}
              accessibilityRole="tab"
              aria-selected={sort === k}
              onPress={() => {
                setSort(k);
                reset();
              }}
              style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: sort === k ? color.primary : 'transparent' }}
            >
              <Text className="font-strong" style={{ fontSize: 13, color: sort === k ? '#FFFFFF' : INK }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Mức + chủ đề */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        <Chip on={level === 'all'} label={L('Mọi mức', 'All levels')} onPress={() => { setLevel('all'); reset(); }} />
        {levels.map((l) => (
          <Chip key={l} on={level === l} label={l} onPress={() => { setLevel(level === l ? 'all' : l); reset(); }} />
        ))}
      </ScrollView>
      {cats.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <Chip on={cat === 'all'} label={L('Mọi chủ đề', 'All topics')} onPress={() => { setCat('all'); reset(); }} subtle />
          {cats.map(([k, n]) => (
            <Chip key={k} on={cat === k} label={CATEGORIES[k].label} count={n} onPress={() => { setCat(cat === k ? 'all' : k); reset(); }} subtle />
          ))}
        </ScrollView>
      ) : null}

      <Text className="font-semi" style={{ fontSize: 13, color: MUTED }}>{L(`${list.length} bài`, `${list.length} articles`)}</Text>

      {!featured ? (
        <View style={[SOFT, { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 28, alignItems: 'center', gap: 8 }]}>
          <Icon name="search" size={26} color={MUTED} />
          <Text className="font-sans" style={{ fontSize: 15, color: MUTED, textAlign: 'center' }}>
            {L('Không có bài nào khớp. Thử bỏ bớt bộ lọc.', 'No articles match. Try removing a filter.')}
          </Text>
        </View>
      ) : (
        <>
          <FeaturedArticle a={featured} />
          {rest.length > 0 ? (
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={18}>
              {rest.slice(0, shown).map((a) => (
                <ArticleCard key={a.id} a={a} en={en} />
              ))}
            </Grid>
          ) : null}
          {rest.length > shown ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShown((n) => n + PAGE)}
              style={{ alignSelf: 'center', minHeight: 44, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1, borderColor: color.primary, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="font-semi" style={{ fontSize: 14, color: color.primary }}>
                {L(`Xem thêm (${rest.length - shown} bài)`, `Show more (${rest.length - shown} left)`)}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

/** Bài nổi bật: ảnh bìa lớn bên trái, chữ bên phải (xếp dọc trên màn hẹp). */
function FeaturedArticle({ a }: { a: BilingualArticle }) {
  const { L, en } = useL();
  const wide = useWindowDimensions().width >= 900;
  const title = stripInline(a.titleEn);
  const standfirst = stripInline(en ? a.standfirstEn : a.standfirstVi);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={() => router.push(`/bilingual/${a.id}` as never)}
      style={[SOFT, { borderRadius: 26, backgroundColor: '#FFFFFF', overflow: 'hidden', flexDirection: wide ? 'row' : 'column' }]}
    >
      <View style={{ flex: wide ? 1.15 : undefined }}>
        <ArticleCover article={a} height={wide ? 340 : 200} />
      </View>
      <View style={{ flex: 1, padding: wide ? 28 : 18, gap: 10, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E8F5EE' }}>
            <Text className="font-semi" style={{ fontSize: 12.5, color: '#1E7F5C' }}>{CATEGORIES[categoryOf(a.topic)].short}</Text>
          </View>
          <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F1ECFF' }}>
            <Text className="font-semi" style={{ fontSize: 12.5, color: '#6A4BD9' }}>{a.level}</Text>
          </View>
        </View>
        <Text numberOfLines={4} style={{ color: INK, fontSize: wide ? 30 : 24, lineHeight: wide ? 37 : 30, fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '700' }}>
          {title}
        </Text>
        {!en ? (
          <Text className="font-strong" numberOfLines={2} style={{ fontSize: 16, lineHeight: 23, color: '#4B4478' }}>{a.titleVi}</Text>
        ) : null}
        <Text numberOfLines={3} style={{ fontFamily: fontFamily.regular, fontSize: 14.5, lineHeight: 22, color: MUTED }}>{standfirst}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          <Text className="font-semi" style={{ fontSize: 13, color: MUTED }}>
            {a.source?.author ? `${a.source.author} · ` : ''}{L(`${a.estMinutes} phút đọc`, `${a.estMinutes} min read`)} · {L(`${a.wordCount} từ`, `${a.wordCount} words`)}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: color.primary }}>
            <Text className="font-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>{L('Đọc bài này', 'Read this')}</Text>
            <Icon name="arrow-right" size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Chip({ label, on, onPress, count, subtle }: { label: string; on: boolean; onPress: () => void; count?: number; subtle?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={on}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: subtle ? 40 : 44,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: on ? color.primary : '#E3DEF3',
        backgroundColor: on ? color.primary : subtle ? 'rgba(255,255,255,0.7)' : '#FFFFFF',
      }}
    >
      <Text className="font-semi" style={{ fontSize: 13.5, color: on ? '#FFFFFF' : INK }}>{label}</Text>
      {count !== undefined ? <Text className="font-sans" style={{ fontSize: 12.5, color: on ? 'rgba(255,255,255,0.85)' : MUTED }}>{count}</Text> : null}
    </Pressable>
  );
}
