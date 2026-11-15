import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { Icon } from '@/components/ui';
import { NeonIcon, NeonWindow, PixelText } from '@/components/neon/Neon';
import { NEON_PALETTES } from '@/components/neon/NeonTile';
import { useL } from '@/i18n/useL';
import {
  GROUPS,
  GROUP_ORDER,
  STAGES,
  foldVi,
  progressByLevel,
  recommendedStage,
  type GroupKey,
  type LevelProgress,
  type StageKey,
} from './catalog-model';
import { GoldButton } from './NightHero';
import { AnyIcon, GROUP_ART, STAGE_ART } from './night-art';

/**
 * TRANG CHỌN BÀI CÓ LỘ TRÌNH — dùng chung cho Chép chính tả, Dịch câu, Shadow, Đọc báo song ngữ.
 *
 * Thứ tự đọc từ trên xuống: LỘ TRÌNH ĐỀ XUẤT (cửa sổ neon: mức nào, đã xong bao nhiêu, nên bắt đầu ở đâu)
 * → BỘ LỌC (tìm kiếm, tình huống) → DANH SÁCH BÀI chia theo tình huống. Chọn một mức thì chỉ hiện bài của mức đó;
 * bấm lại mức đang chọn (hoặc "Mọi mức") để xem tất cả. Giao diện theo trang Hôm nay: cửa sổ viền tím có ba chấm màu,
 * chữ pixel, icon pixel neon, nút vàng bấm lún.
 *
 * Thẻ bài do trang gọi tự vẽ (`node`) — mỗi bài luyện có "dấu vân" riêng (sóng âm, cặp vạch Anh–Việt…).
 */

export type CatalogItem = {
  id: string;
  level: StageKey;
  topic: string;
  group: GroupKey;
  title: string;
  done: boolean;
  node: React.ReactNode;
};

const INK = '#2B2350';
const MUTED = '#6B6590';
const INDIGO = '#2A22B5';
const PER_GROUP = 8;

export function CatalogHub({
  items,
  unitVi = 'bài',
  unitEn = 'sets',
  searchHintVi = 'Tìm chủ đề hoặc tên bài…',
  searchHintEn = 'Search topic or title…',
  onStart,
  startLabelVi,
  startLabelEn,
}: {
  items: CatalogItem[];
  unitVi?: string;
  unitEn?: string;
  searchHintVi?: string;
  searchHintEn?: string;
  /** Bấm "Bắt đầu / Tiếp tục" ở lộ trình: mở bài đầu tiên chưa làm của mức đề xuất. */
  onStart?: (item: CatalogItem) => void;
  startLabelVi?: string;
  startLabelEn?: string;
}) {
  const { L, en } = useL();
  const progress = useMemo(() => progressByLevel(items), [items]);
  const recommended = useMemo(() => recommendedStage(progress), [progress]);
  const [level, setLevel] = useState<StageKey | 'all'>(() => recommended ?? 'all');
  const [group, setGroup] = useState<GroupKey | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const needle = foldVi(query.trim());
  const visible = useMemo(
    () =>
      items.filter(
        (it) =>
          (level === 'all' || it.level === level) &&
          (group === 'all' || it.group === group) &&
          (!needle || foldVi(`${it.title} ${it.topic}`).includes(needle)),
      ),
    [items, level, group, needle],
  );

  // Số bài theo nhóm trong phạm vi mức + tìm kiếm (không tính bộ lọc nhóm, để chip hiện đúng số sẽ thấy).
  const groupCounts = useMemo(() => {
    const m = new Map<GroupKey, number>();
    for (const it of items) {
      if ((level !== 'all' && it.level !== level) || (needle && !foldVi(`${it.title} ${it.topic}`).includes(needle))) continue;
      m.set(it.group, (m.get(it.group) ?? 0) + 1);
    }
    return m;
  }, [items, level, needle]);
  const totalInScope = [...groupCounts.values()].reduce((a, b) => a + b, 0);

  const startItem = useMemo(() => {
    if (!recommended) return null;
    return items.find((it) => it.level === recommended && !it.done) ?? items.find((it) => it.level === recommended) ?? null;
  }, [items, recommended]);

  const sections = GROUP_ORDER.map((g) => ({ g, list: visible.filter((it) => it.group === g) })).filter((s) => s.list.length > 0);
  const startDone = recommended ? (progress.find((p) => p.key === recommended)?.done ?? 0) : 0;

  return (
    <View style={{ gap: 22 }}>
      {/* ───────────── LỘ TRÌNH ĐỀ XUẤT ───────────── */}
      <NeonWindow title={L('Lộ trình đề xuất', 'Suggested path')} icon="rocket">
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text className="font-nun-strong" style={{ flexShrink: 1, minWidth: 220, fontSize: 15, lineHeight: 22, color: MUTED }}>
              {L('Đi từ mức dễ lên khó. Bấm một mức để chỉ xem bài của mức đó.', 'Go from easy to hard. Tap a level to see only its sets.')}
            </Text>
            {onStart && startItem && recommended ? (
              <GoldButton
                label={en ? (startLabelEn ?? `Start ${recommended}`) : (startLabelVi ?? `${startDone > 0 ? 'Tiếp tục' : 'Bắt đầu'} ${recommended}`)}
                onPress={() => onStart(startItem)}
              />
            ) : null}
          </View>
          <RoadmapStrip progress={progress} selected={level} recommended={recommended} onSelect={(k) => setLevel(level === k ? 'all' : k)} />
        </View>
      </NeonWindow>

      {/* ───────────── BỘ LỌC ───────────── */}
      <View style={{ gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 16, minHeight: 50, borderWidth: 2, borderColor: '#C9C2EE', ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 0 rgba(42,34,181,0.18)' } as object) : {}) }}
        >
          <AnyIcon name="magnifier" height={26} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={en ? searchHintEn : searchHintVi}
            placeholderTextColor="#9A94B8"
            accessibilityLabel={en ? searchHintEn : searchHintVi}
            style={{ flex: 1, fontSize: 15, color: INK, paddingVertical: 10, outlineStyle: 'none' } as object}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={L('Xoá tìm kiếm', 'Clear search')} onPress={() => setQuery('')} hitSlop={10}>
              <Icon name="close" size={16} color={MUTED} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingBottom: 8 }}>
          <Chip on={group === 'all'} onPress={() => setGroup('all')} label={L('Tất cả', 'All')} count={totalInScope} />
          {GROUP_ORDER.filter((g) => (groupCounts.get(g) ?? 0) > 0 || group === g).map((g) => (
            <Chip
              key={g}
              on={group === g}
              onPress={() => setGroup(group === g ? 'all' : g)}
              label={en ? GROUPS[g].en : GROUPS[g].vi}
              count={groupCounts.get(g) ?? 0}
              art={GROUP_ART[g]}
            />
          ))}
          <Chip on={level === 'all'} onPress={() => setLevel('all')} label={L('Mọi mức', 'All levels')} outline />
        </ScrollView>
      </View>

      {/* ───────────── DANH SÁCH BÀI ───────────── */}
      {sections.length === 0 ? (
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: '#C9C2EE', padding: 28, alignItems: 'center', gap: 8 }}>
          <AnyIcon name="magnifier" height={48} />
          <Text className="font-sans" style={{ fontSize: 15, color: MUTED, textAlign: 'center' }}>
            {L('Không có bài nào khớp. Thử chọn "Mọi mức" hoặc xoá bớt từ khoá.', 'Nothing matches. Try “All levels” or clear the search.')}
          </Text>
        </View>
      ) : (
        sections.map(({ g, list }) => {
          const open = expanded[g] || group !== 'all' || list.length <= PER_GROUP + 2;
          const shown = open ? list : list.slice(0, PER_GROUP);
          return (
            <View key={g} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AnyIcon name={GROUP_ART[g]} height={46} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <PixelText size={30} color={INDIGO}>{en ? GROUPS[g].en : GROUPS[g].vi}</PixelText>
                  <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>{en ? GROUPS[g].subEn : GROUPS[g].subVi}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: INDIGO }}>
                  <PixelText size={20}>{list.length} {en ? unitEn : unitVi}</PixelText>
                </View>
              </View>
              <View style={{ borderTopWidth: 3, borderStyle: 'dotted', borderColor: 'rgba(42,34,181,0.28)' }} />
              <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
                {shown.map((it) => (
                  <View key={it.id} style={{ height: '100%' }}>{it.node}</View>
                ))}
              </Grid>
              {!open ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpanded((e) => ({ ...e, [g]: true }))}
                  style={{ alignSelf: 'center', minHeight: 46, paddingHorizontal: 22, borderRadius: 999, borderWidth: 2, borderColor: INDIGO, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 0 #1A1566' } as object) : {}) }}
                >
                  <Text className="font-nun-heavy" style={{ fontSize: 14, color: INDIGO }}>
                    {L(`Xem thêm ${list.length - PER_GROUP} ${unitVi}`, `Show ${list.length - PER_GROUP} more`)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

/* ====================================================================== */

/**
 * Dải các mức: thẻ tối có hai vầng sáng màu riêng của mức (cùng bảng màu với thẻ neon của Hôm nay), icon pixel, tên mức,
 * mô tả một dòng và thanh tiến độ vàng. Mức đang chọn viền vàng sáng; mức đề xuất có nhãn riêng.
 */
export function RoadmapStrip({
  progress,
  selected,
  recommended,
  onSelect,
  showProgress = true,
}: {
  progress: readonly LevelProgress[];
  selected: StageKey | 'all';
  recommended: StageKey | null;
  onSelect: (k: StageKey) => void;
  /** Tắt thanh tiến độ khi chưa có dữ liệu tiến độ (chỉ hiện số bài mỗi mức). */
  showProgress?: boolean;
}) {
  const { L, en } = useL();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6, paddingRight: 6 }}>
      {progress.map((p, i) => {
        const stage = STAGES.find((s) => s.key === p.key)!;
        const art = STAGE_ART[p.key];
        const [base, glowA, glowB] = NEON_PALETTES[art.palette]!;
        const on = selected === p.key;
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        const finished = p.total > 0 && p.done >= p.total;
        return (
          <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              aria-selected={on}
              accessibilityLabel={`${p.key} ${en ? stage.en.title : stage.vi.title}`}
              onPress={() => onSelect(p.key)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
                ({
                  width: 232,
                  minHeight: 168,
                  borderRadius: 22,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: on ? '#FFD84A' : 'rgba(255,255,255,0.3)',
                  transform: [{ translateY: pressed ? 2 : hovered ? -3 : 0 }],
                  boxShadow: on ? '0 0 0 3px rgba(255,216,74,0.3), 0 0 26px rgba(255,216,74,0.5), 0 5px 0 #B88A00' : `0 5px 0 ${glowB}66`,
                }) as object
              }
            >
              <LinearGradient colors={[base, '#120C45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 999, backgroundColor: glowA, opacity: 0.8, ...(Platform.OS === 'web' ? ({ filter: 'blur(34px)' } as object) : {}) }} />
              <View pointerEvents="none" style={{ position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: 999, backgroundColor: glowB, opacity: 0.6, ...(Platform.OS === 'web' ? ({ filter: 'blur(34px)' } as object) : {}) }} />
              <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: 8 }}>
                <NeonIcon name={finished ? 'check' : art.icon} height={62} />
              </View>
              <View style={{ flex: 1, padding: 14, gap: 4, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ paddingHorizontal: 9, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
                    <PixelText size={22}>{p.key}</PixelText>
                  </View>
                  {showProgress && recommended === p.key && !finished ? (
                    <View style={{ paddingHorizontal: 7, borderRadius: 6, backgroundColor: '#FFD84A' }}>
                      <PixelText size={18} color="#2B1D00">{L('ĐỀ XUẤT', 'START HERE')}</PixelText>
                    </View>
                  ) : null}
                </View>
                <Text className="font-nun-heavy" style={{ fontSize: 19, lineHeight: 23, color: '#FFFFFF' }}>{en ? stage.en.title : stage.vi.title}</Text>
                <Text className="font-nun-strong" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17, color: 'rgba(255,255,255,0.82)' }}>{en ? stage.en.sub : stage.vi.sub}</Text>
                {showProgress ? (
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', marginTop: 4 }}>
                    <View style={{ width: `${pct}%`, height: 8, backgroundColor: '#FFD84A' } as object} />
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: p.done ? '#FFE680' : 'rgba(255,255,255,0.78)' }}>
                    {!showProgress
                      ? L(`${p.total} bài`, `${p.total} articles`)
                      : p.done === 0
                        ? L(`Chưa bắt đầu · ${p.total} bài`, `Not started · ${p.total} sets`)
                        : L(`${p.done}/${p.total} bài`, `${p.done}/${p.total} sets`)}
                  </Text>
                </View>
              </View>
            </Pressable>
            {i < progress.length - 1 ? <Icon name="chevron-right" size={18} color="#8B83D6" strokeWidth={2.6} /> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function Chip({ label, on, onPress, count, art, outline }: { label: string; on: boolean; onPress: () => void; count?: number; art?: React.ComponentProps<typeof AnyIcon>['name']; outline?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={on}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        minHeight: 46,
        paddingHorizontal: 15,
        borderRadius: 999,
        borderWidth: 2,
        borderStyle: outline && !on ? 'dashed' : 'solid',
        borderColor: on ? INDIGO : '#C9C2EE',
        backgroundColor: on ? INDIGO : '#FFFFFF',
        ...(on && Platform.OS === 'web' ? ({ boxShadow: '0 4px 0 #1A1566' } as object) : {}),
      }}
    >
      {art ? <AnyIcon name={art} height={26} /> : null}
      <Text className="font-nun-heavy" style={{ fontSize: 14, color: on ? '#FFFFFF' : INK }}>{label}</Text>
      {count !== undefined ? <Text className="font-nun-strong" style={{ fontSize: 13, color: on ? 'rgba(255,255,255,0.85)' : MUTED }}>{count}</Text> : null}
    </Pressable>
  );
}
