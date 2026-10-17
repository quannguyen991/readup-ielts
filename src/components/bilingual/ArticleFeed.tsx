import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Icon } from '@/components/ui';
import { BILINGUAL_ARTICLES, BILINGUAL_OUTLETS, outletKeyOf, type BilingualArticle } from '@/data/bilingual-repository';
import { stripInline } from '@/lib/inlineMarkup';
import { readingFont } from '@/lib/readingFonts';
import { useL } from '@/i18n/useL';
import { fontFamily } from '@/theme/tokens';
import { ArticleCover, CATEGORIES, CATEGORY_ORDER, categoryOf, type CategoryKey } from './ArticleCover';

const PAGE = 24;
const GOLD = '#C8A24A';
/** Màu chữ ấm, không đen: tiêu đề nâu đậm, chữ phụ nâu nhạt, chữ meta xám ấm. */
const TEXT_STRONG = '#3A2D20';
const TEXT_SOFT = '#6E5E4B';
const TEXT_META = '#9A8A74';
const LINE = '#EADFCB';

const CARD_SHADOW = {
  borderWidth: 1,
  borderColor: '#F2EEE6',
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 2px rgba(94,72,35,0.04), 0 8px 22px rgba(94, 72, 35,0.07)' } as object)
    : { elevation: 2 }),
};

/**
 * Lưới bài đọc kiểu báo: hàng chip chủ đề và nguồn, rồi thẻ có ảnh bìa. Mỗi thẻ hiện chủ
 * đề, độ khó, số phút và cờ EN | VI. Không có thanh tiến độ vì app chưa lưu tiến độ đọc
 * từng bài.
 */
export function ArticleFeed() {
  const { L, en } = useL();
  const [category, setCategory] = useState<CategoryKey | 'all'>('all');
  const [source, setSource] = useState<string>('all');
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => {
    const m = new Map<CategoryKey, number>();
    for (const a of BILINGUAL_ARTICLES) {
      const k = categoryOf(a.topic);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return CATEGORY_ORDER.map((k) => [k, m.get(k) ?? 0] as const).filter(([, n]) => n > 0);
  }, []);

  const list = useMemo(
    () =>
      BILINGUAL_ARTICLES.filter(
        (a) => (category === 'all' || categoryOf(a.topic) === category) && (source === 'all' || outletKeyOf(a) === source),
      ),
    [category, source],
  );

  return (
    <View style={{ gap: 16 }}>
      <ChipRow>
        <Chip label={L('Tất cả', 'All')} count={BILINGUAL_ARTICLES.length} on={category === 'all'} onPress={() => { setCategory('all'); setShown(PAGE); }} />
        {counts.map(([k, n]) => (
          <Chip key={k} label={CATEGORIES[k].label} count={n} on={category === k} onPress={() => { setCategory(k); setShown(PAGE); }} />
        ))}
      </ChipRow>

      <ChipRow small>
        <Chip small label={L('Mọi nguồn', 'All sources')} on={source === 'all'} onPress={() => { setSource('all'); setShown(PAGE); }} />
        {BILINGUAL_OUTLETS.map((o) => (
          <Chip small key={o.key} label={o.name} on={source === o.key} onPress={() => { setSource(o.key); setShown(PAGE); }} />
        ))}
      </ChipRow>

      {list.length === 0 ? (
        <Text style={{ fontFamily: fontFamily.regular, color: TEXT_SOFT, fontSize: 14 }}>{L('Chưa có bài nào trong bộ lọc này.', 'No articles match this filter.')}</Text>
      ) : (
        <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={18}>
          {list.slice(0, shown).map((a) => (
            <ArticleCard key={a.id} a={a} en={en} />
          ))}
        </Grid>
      )}

      {list.length > shown ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShown((n) => n + PAGE)}
          style={{ alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 999, borderWidth: 1, borderColor: GOLD, backgroundColor: '#FFFFFF' }}
        >
          <Text style={{ color: TEXT_STRONG, fontSize: 14, fontFamily: fontFamily.semibold }}>
            {L(`Xem thêm (${list.length - shown} bài)`, `Show more (${list.length - shown} left)`)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChipRow({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: small ? 8 : 10, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

function Chip({ label, count, on, onPress, small = false }: { label: string; count?: number; on: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: small ? 12 : 16,
        paddingVertical: small ? 6 : 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: on ? GOLD : LINE,
        backgroundColor: on ? GOLD : '#FFFFFF',
      }}
    >
      <Text style={{ color: on ? '#FFFFFF' : TEXT_SOFT, fontSize: small ? 12.5 : 13.5, fontFamily: fontFamily.semibold }}>{label}</Text>
      {count !== undefined ? (
        <Text style={{ color: on ? 'rgba(255,255,255,0.85)' : TEXT_META, fontSize: 12, fontFamily: fontFamily.regular }}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

function ArticleCard({ a, en }: { a: BilingualArticle; en: boolean }) {
  const { L } = useL();
  const title = stripInline(a.titleEn);
  const standfirst = stripInline(en ? a.standfirstEn : a.standfirstVi);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={() => router.push(`/bilingual/${a.id}` as never)}
      style={[CARD_SHADOW, { borderRadius: 22, backgroundColor: '#FFFFFF', overflow: 'hidden' }]}
    >
      <View>
        <ArticleCover article={a} height={172} />
        <View style={{ position: 'absolute', left: 12, top: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)' }}>
          <Text style={{ color: TEXT_SOFT, fontSize: 11.5, fontFamily: fontFamily.semibold }}>{CATEGORIES[categoryOf(a.topic)].short}</Text>
        </View>
        <View style={{ position: 'absolute', right: 12, top: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F3E7CF' }}>
          <Text style={{ color: '#7A5520', fontSize: 11.5, fontFamily: fontFamily.semibold }}>{a.level}</Text>
        </View>
      </View>

      <View style={{ padding: 16, gap: 8 }}>
        <Text
          numberOfLines={2}
          style={{ color: TEXT_STRONG, fontSize: 17, lineHeight: 22, fontFamily: readingFont.fraunces, fontStyle: 'italic', fontWeight: '600' }}
        >
          {title}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: fontFamily.regular, color: TEXT_SOFT, fontSize: 13, lineHeight: 18 }}>
          {standfirst}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: LINE, overflow: 'hidden' }}>
              <Text style={{ paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontFamily: fontFamily.semibold, color: '#7A5520', backgroundColor: '#F3E7CF' }}>EN</Text>
              <Text style={{ paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontFamily: fontFamily.semibold, color: TEXT_META }}>VI</Text>
            </View>
            <Text style={{ color: TEXT_META, fontSize: 12, fontFamily: fontFamily.regular }}>{L(`${a.estMinutes} phút`, `${a.estMinutes} min`)}</Text>
          </View>
          <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD }}>
            <Icon name="arrow-right" size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
