import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type LayoutChangeEvent } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { FlatCover, numOf, SECTION_TONE, Text, type SkillName } from '@/components/ielts/SourceCover';
import { color } from '@/theme/tokens';

export type CatalogTest = {
  id: string;
  title: string;
  source: string;
  section?: SkillName;
  pageCount: number;
  questionCount: number;
  hasAnswerKey: boolean;
  answerKeyVerified: boolean;
  externalOnly: boolean;
  partCount?: number;
  missingComponents?: string[];
};

export type CollectionFilter = 'all' | 'cambridge' | 'vol';
export type SortOrder = 'newest' | 'oldest';

type Props = {
  tests: CatalogTest[];
  L: (vi: string, en: string) => string;
  collection: CollectionFilter;
  onCollection: (next: CollectionFilter) => void;
  skill: string;
  onSkill: (next: string) => void;
  query: string;
  onQuery: (next: string) => void;
  onOpen: (id: string) => void;
};

type Hover = { hovered?: boolean };

/** Số bộ sách hiện ngay; phần còn lại mở dần để hàng trăm thẻ không đè lên máy cùng lúc. */
const FIRST_GROUPS = 3;
const MORE_GROUPS = 4;
const GAP = 16;
const MIN_CARD = 190;
const SIDEBAR = 248;
const WIDE = 920;

const SKILLS: { id: SkillName; icon: 'book' | 'volume' | 'list' | 'target'; vi: string }[] = [
  { id: 'Reading', icon: 'book', vi: 'Reading' },
  { id: 'Listening', icon: 'volume', vi: 'Listening' },
  { id: 'Writing', icon: 'list', vi: 'Writing' },
  { id: 'Speaking', icon: 'target', vi: 'Speaking' },
];

export function SourceCatalog(props: Props) {
  const { tests, L, collection, skill, onOpen } = props;
  // Gõ tìm kiếm không chặn ô nhập: danh sách lọc theo giá trị trễ một nhịp.
  const query = useDeferredValue(props.query);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [book, setBook] = useState('all');
  const [visibleGroups, setVisibleGroups] = useState(FIRST_GROUPS);
  const [width, setWidth] = useState(1100);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width)), []);

  const wide = width >= WIDE;
  const gridWidth = wide ? width - SIDEBAR - GAP : width;
  const cols = Math.max(1, Math.min(5, Math.floor((gridWidth + GAP) / (MIN_CARD + GAP))));
  const cardWidth = Math.floor((gridWidth - GAP * (cols - 1)) / cols);

  // Lọc theo tab bộ đề + tìm kiếm trước, để số đếm ở cột trái luôn khớp với kết quả.
  const base = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\bcam\b/g, 'cambridge');
    return tests.filter((item) => {
      const source = item.source.toLowerCase();
      if (collection === 'cambridge' && !source.includes('cambridge')) return false;
      if (collection === 'vol' && !source.includes('vol')) return false;
      if (q && !(item.title.toLowerCase().includes(q) || source.includes(q) || (item.section ?? '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tests, collection, query]);

  const skillCount = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of base) if (item.section) out[item.section] = (out[item.section] ?? 0) + 1;
    return out;
  }, [base]);

  const books = useMemo(() => [...new Set(base.filter((item) => skill === 'all' || item.section === skill).map((item) => item.source))], [base, skill]);

  const filtered = useMemo(
    () => base.filter((item) => (skill === 'all' || item.section === skill) && (book === 'all' || item.source === book)),
    [base, skill, book],
  );

  const groups = useMemo(() => {
    const bySource = new Map<string, CatalogTest[]>();
    for (const item of filtered) {
      const list = bySource.get(item.source);
      if (list) list.push(item);
      else bySource.set(item.source, [item]);
    }
    const all = [...bySource.entries()].map(([source, items]) => ({ source, items }));
    return sort === 'newest' ? all : all.reverse();
  }, [filtered, sort]);

  // Chọn bộ sách không còn trong kết quả thì về "tất cả", tránh màn trống khó hiểu.
  useEffect(() => {
    if (book !== 'all' && !books.includes(book)) setBook('all');
  }, [book, books]);

  useEffect(() => {
    setVisibleGroups(FIRST_GROUPS);
  }, [collection, skill, query, sort, book]);

  const shown = groups.slice(0, visibleGroups);
  const hidden = groups.length - shown.length;
  const dirty = collection !== 'all' || skill !== 'all' || book !== 'all' || query.trim() !== '';
  const clearAll = () => {
    props.onCollection('all');
    props.onSkill('all');
    props.onQuery('');
    setBook('all');
  };
  const open = useCallback((id: string) => onOpen(id), [onOpen]);

  const sidebar = (
    <View style={{ width: wide ? SIDEBAR : '100%', gap: 12 }}>
      <View style={{ padding: 14, gap: 10, borderRadius: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: color.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{L('Kỹ năng', 'Skill')}</Text>
        <View style={{ flexDirection: wide ? 'column' : 'row', flexWrap: 'wrap', gap: 6 }}>
          <SkillRow label={L('Tất cả kỹ năng', 'All skills')} count={base.length} on={skill === 'all'} onPress={() => props.onSkill('all')} wide={wide} />
          {SKILLS.map((item) => (
            <SkillRow
              key={item.id}
              label={item.vi}
              icon={item.icon}
              tone={SECTION_TONE[item.id]}
              count={skillCount[item.id] ?? 0}
              on={skill === item.id}
              onPress={() => props.onSkill(skill === item.id ? 'all' : item.id)}
              wide={wide}
            />
          ))}
        </View>
      </View>

      <View style={{ padding: 14, gap: 10, borderRadius: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: color.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{L('Bộ sách', 'Book')}</Text>
        <ScrollView style={{ maxHeight: wide ? 300 : 180 }} contentContainerStyle={{ gap: 2 }} showsVerticalScrollIndicator>
          <BookRow label={L('Tất cả bộ sách', 'All books')} on={book === 'all'} onPress={() => setBook('all')} />
          {books.map((name) => (
            <BookRow key={name} label={name} on={book === name} onPress={() => setBook(name)} />
          ))}
        </ScrollView>
      </View>

      {dirty ? (
        <Pressable onPress={clearAll} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: color.primaryDark }}>{L('Xóa bộ lọc', 'Clear filters')}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View onLayout={onLayout} style={{ gap: 16 }}>
      {/* Thanh tab bộ đề */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 14, backgroundColor: color.surfaceAlt, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        <Tab label={L('Tất cả', 'All')} on={collection === 'all'} onPress={() => props.onCollection('all')} />
        <Tab label="Cambridge IELTS" on={collection === 'cambridge'} onPress={() => props.onCollection('cambridge')} />
        <Tab label="Actual Tests" on={collection === 'vol'} onPress={() => props.onCollection('vol')} />
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: GAP, alignItems: 'flex-start' }}>
        {sidebar}

        <View style={{ flex: 1, width: wide ? undefined : '100%', gap: 18, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <View
              style={{
                flex: 1,
                minWidth: 220,
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <Icon name="search" size={17} color={color.primaryDark} />
              <TextInput
                value={props.query}
                onChangeText={props.onQuery}
                placeholder={L('Tìm đề, ví dụ: Cam 19 Reading', 'Search, e.g. Cam 19 Reading')}
                placeholderTextColor={color.subtle}
                style={{ flex: 1, height: '100%', color: color.ink, fontSize: 14, fontFamily: 'BeVietnamPro_500Medium', outlineStyle: 'none' } as never}
              />
              {props.query ? (
                <Pressable onPress={() => props.onQuery('')} accessibilityLabel={L('Xóa từ khóa', 'Clear search')} hitSlop={8}>
                  <Icon name="close" size={15} color={color.muted} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
              accessibilityRole="button"
              style={({ hovered }: Hover) => ({
                height: 44,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: hovered ? color.primaryDark : color.border,
                backgroundColor: color.surface,
              })}
            >
              <Text style={{ fontSize: 13, color: color.muted, fontWeight: '500' }}>{L('Sắp xếp', 'Sort')}</Text>
              <Text style={{ fontSize: 13, color: color.ink, fontWeight: '700' }}>
                {sort === 'newest' ? L('Mới nhất trước', 'Newest first') : L('Cũ nhất trước', 'Oldest first')}
              </Text>
            </Pressable>
          </View>

          {shown.map((group) => (
            <View key={group.source} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: color.ink }}>{group.source}</Text>
                <View style={{ paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, backgroundColor: color.primarySoft }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: color.primaryDark }}>{group.items.length}</Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: color.border }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {group.items.map((item) => (
                  <TestCard key={item.id} item={item} width={cardWidth} L={L} onOpen={open} />
                ))}
              </View>
            </View>
          ))}

          {hidden > 0 ? (
            <Pressable
              onPress={() => setVisibleGroups((n) => n + MORE_GROUPS)}
              accessibilityRole="button"
              style={({ hovered }: Hover) => ({
                alignSelf: 'center',
                height: 44,
                paddingHorizontal: 22,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: color.primaryDark,
                backgroundColor: hovered ? color.primarySoft : color.surface,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: color.primaryDark }}>
                {L(`Xem thêm ${Math.min(hidden, MORE_GROUPS)} bộ sách (còn ${hidden})`, `Show ${Math.min(hidden, MORE_GROUPS)} more books (${hidden} left)`)}
              </Text>
            </Pressable>
          ) : null}

          {!groups.length ? (
            <View style={{ padding: 32, alignItems: 'center', gap: 8, borderRadius: 18, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: color.ink }}>{L('Không có đề phù hợp', 'No tests match')}</Text>
              <Text style={{ fontSize: 13, color: color.body }}>{L('Thử bỏ bớt bộ lọc hoặc đổi từ khóa.', 'Try removing a filter or changing the keyword.')}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Tab({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      style={({ hovered }: Hover) => ({
        height: 38,
        paddingHorizontal: 18,
        borderRadius: 10,
        justifyContent: 'center',
        backgroundColor: on ? color.surface : hovered ? color.primarySoft : 'transparent',
        borderWidth: on ? 1 : 0,
        borderColor: color.border,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: on ? color.primaryDark : color.body }}>{label}</Text>
    </Pressable>
  );
}

function SkillRow({
  label,
  count,
  on,
  onPress,
  icon,
  tone,
  wide,
}: {
  label: string;
  count: number;
  on: boolean;
  onPress: () => void;
  icon?: 'book' | 'volume' | 'list' | 'target';
  tone?: { bg: string; fg: string };
  wide: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ hovered }: Hover) => ({
        width: wide ? '100%' : undefined,
        minHeight: 40,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: on ? color.primaryDark : 'transparent',
        backgroundColor: on ? color.primarySoft : hovered ? color.canvas : 'transparent',
      })}
    >
      <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: tone?.bg ?? color.surfaceAlt }}>
        <Icon name={icon ?? 'list'} size={14} color={tone?.fg ?? color.primaryDark} />
      </View>
      <Text style={{ flex: wide ? 1 : undefined, fontSize: 14, fontWeight: on ? '700' : '600', color: color.ink }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: color.muted }}>{count}</Text>
    </Pressable>
  );
}

function BookRow({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={({ hovered }: Hover) => ({
        minHeight: 34,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 8,
        backgroundColor: hovered ? color.canvas : 'transparent',
      })}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: on ? 5 : 1.5,
          borderColor: on ? color.primaryDark : color.borderStrong,
          backgroundColor: color.surface,
        }}
      />
      <Text style={{ fontSize: 13, fontWeight: on ? '700' : '500', color: on ? color.ink : color.body }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const TestCard = memo(function TestCard({ item, width, L, onOpen }: { item: CatalogTest; width: number; L: Props['L']; onOpen: (id: string) => void }) {
  const isCam = item.source.toLowerCase().includes('cambridge');
  const tone = item.section ? SECTION_TONE[item.section] : null;
  const coverW = width - 16;
  const meta = `${item.questionCount} ${L('câu', 'q')}`;

  return (
    <Pressable
      onPress={() => onOpen(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ hovered }: Hover) => ({
        width,
        padding: 8,
        gap: 10,
        borderRadius: 18,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: hovered ? color.primaryDark : color.border,
      })}
    >
      <FlatCover kind={isCam ? 'CAMBRIDGE' : 'ACTUAL VOL'} num={numOf(item.source)} width={coverW} height={Math.round(coverW * 1.11)} radius={12} />
      <View style={{ paddingHorizontal: 6, gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: color.ink, lineHeight: 20, minHeight: 40 }} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {tone && item.section ? (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: tone.bg }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: tone.fg }}>{item.section}</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 12, color: color.muted, fontWeight: '500' }} numberOfLines={1}>{meta}</Text>
        </View>
      </View>
      <View style={{ height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: color.primaryDark, marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: color.white }}>{L('Làm bài', 'Start')}</Text>
      </View>
    </Pressable>
  );
});
