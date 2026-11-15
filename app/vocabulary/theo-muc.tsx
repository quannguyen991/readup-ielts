import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { STAGE_TONE, type StageKey } from '@/components/catalog/catalog-model';
import { NightHero } from '@/components/catalog/NightHero';
import { deckIconFor } from '@/components/catalog/deck-icon';
import { AnyIcon, STAGE_ART } from '@/components/catalog/night-art';
import { NeonHeading, NeonWindow, PixelText } from '@/components/neon/Neon';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { DESTINATION_DECKS } from '@/data/destination-vocab';
import { OXFORD_TOPIC_DECKS } from '@/data/oxford-topics-decks';
import { VFI_DECKS } from '@/data/vocab-for-ielts';
import { VFIA_DECKS } from '@/data/vocab-for-ielts-advanced';
import { LISTENING_DECKS } from '@/data/vocab-listening';
import { GLOBAL_SUCCESS_DECKS, VOCAB_TOPICS } from '@/data/vocab-topics';
import { levelOf } from '@/data/study-decks';
import { useL } from '@/i18n/useL';

/**
 * TỪ VỰNG THEO MỨC: chọn một mức CEFR (hoặc mức IELTS tương ứng) rồi thấy MỌI bộ có từ ở mức đó,
 * mỗi bộ kèm số từ của riêng mức ấy. Bấm vào bộ là học đúng phần từ của mức đã chọn
 * (đường dẫn `<bộ>--B2`, màn học đã hiểu hậu tố này).
 *
 * Band IELTS của từ trong kho là bốn khoảng 5–6, 6–7, 7–8, 8+; `levelOf` quy chúng về B1, B2, C1, C2.
 * Vì hai thang trùng nhau nên chỉ cần MỘT bộ chọn, mỗi mức mang cả hai nhãn.
 */

const LEVELS: { key: StageKey; ielts: string; ieltsEn: string; blurb: string; blurbEn: string }[] = [
  { key: 'A1', ielts: 'IELTS dưới 4.5', ieltsEn: 'IELTS below 4.5', blurb: 'Từ nền tảng nhất', blurbEn: 'Core everyday words' },
  { key: 'A2', ielts: 'IELTS ~4.5', ieltsEn: 'IELTS ~4.5', blurb: 'Từ thường gặp hằng ngày', blurbEn: 'Common daily words' },
  { key: 'B1', ielts: 'IELTS 5.0–6.0', ieltsEn: 'IELTS 5.0–6.0', blurb: 'Từ nói và viết cơ bản', blurbEn: 'Basic speaking and writing' },
  { key: 'B2', ielts: 'IELTS 6.0–7.0', ieltsEn: 'IELTS 6.0–7.0', blurb: 'Từ lập luận, học thuật nhẹ', blurbEn: 'Argument and light academic' },
  { key: 'C1', ielts: 'IELTS 7.0–8.0', ieltsEn: 'IELTS 7.0–8.0', blurb: 'Từ học thuật, sắc thái', blurbEn: 'Academic and nuanced words' },
  { key: 'C2', ielts: 'IELTS 8.0+', ieltsEn: 'IELTS 8.0+', blurb: 'Từ hiếm, văn phong cao', blurbEn: 'Rare, high-register words' },
];

type SourceKey = 'ielts' | 'oxford' | 'vfi' | 'vfia' | 'globalSuccess' | 'destination' | 'listening';
const SOURCE_ORDER: SourceKey[] = ['oxford', 'ielts', 'vfi', 'vfia', 'destination', 'globalSuccess', 'listening'];
const SOURCE_LABEL: Record<SourceKey, { vi: string; en: string }> = {
  oxford: { vi: 'Oxford 3000', en: 'Oxford 3000' },
  ielts: { vi: 'Chủ đề IELTS', en: 'IELTS topics' },
  vfi: { vi: 'Vocabulary for IELTS', en: 'Vocabulary for IELTS' },
  vfia: { vi: 'Vocabulary for IELTS Advanced', en: 'Vocabulary for IELTS Advanced' },
  destination: { vi: 'Destination B1–C2', en: 'Destination B1–C2' },
  globalSuccess: { vi: 'Global Success 10–12', en: 'Global Success 10–12' },
  listening: { vi: 'Nghe IELTS', en: 'IELTS listening' },
};

type Row = { slug: string; title: string; titleEn: string; source: SourceKey; total: number; byLevel: Partial<Record<StageKey, number>> };

let cache: Row[] | null = null;
/** Đếm một lần cho cả phiên: duyệt ~10 000 từ, đủ nhanh nhưng không cần làm lại mỗi lần đổi mức. */
function rows(): Row[] {
  if (cache) return cache;
  const out: Row[] = [];
  const add = (source: SourceKey, slug: string, title: string, titleEn: string, words: readonly { cefr?: string; band: string }[]) => {
    const byLevel: Partial<Record<StageKey, number>> = {};
    for (const w of words) {
      const lv = levelOf(w) as StageKey;
      if (LEVELS.some((l) => l.key === lv)) byLevel[lv] = (byLevel[lv] ?? 0) + 1;
    }
    out.push({ slug, title, titleEn, source: source, total: words.length, byLevel });
  };
  for (const t of OXFORD_TOPIC_DECKS) add('oxford', t.slug, t.title, t.titleEn, t.words.map((w) => ({ band: w.level })));
  for (const t of VOCAB_TOPICS) add('ielts', t.slug, t.nameVi, t.name, t.words);
  for (const t of VFI_DECKS) add('vfi', t.slug, t.name, t.name, t.words);
  for (const t of VFIA_DECKS) add('vfia', t.slug, t.name, t.name, t.words);
  for (const t of DESTINATION_DECKS) add('destination', t.slug, t.nameVi, t.name, t.words);
  for (const t of GLOBAL_SUCCESS_DECKS) add('globalSuccess', t.slug, t.nameVi, t.name, t.words);
  for (const t of LISTENING_DECKS) add('listening', t.slug, t.nameVi, t.name, t.words);
  cache = out;
  return out;
}

const INK = '#2B2350';
const MUTED = '#6B6590';
export default function VocabByLevelScreen() {
  const { L, en } = useL();
  const wide = useWindowDimensions().width >= 900;
  const all = useMemo(() => rows(), []);
  const [level, setLevel] = useState<StageKey>('B2');
  const [source, setSource] = useState<SourceKey | 'all'>('all');

  const totals = useMemo(() => {
    const m = new Map<StageKey, { decks: number; words: number }>();
    for (const l of LEVELS) m.set(l.key, { decks: 0, words: 0 });
    for (const r of all) for (const l of LEVELS) {
      const n = r.byLevel[l.key] ?? 0;
      if (n > 0) {
        const t = m.get(l.key)!;
        t.decks += 1;
        t.words += n;
      }
    }
    return m;
  }, [all]);

  const forLevel = useMemo(() => all.filter((r) => (r.byLevel[level] ?? 0) > 0), [all, level]);
  const sourcesHere = SOURCE_ORDER.filter((s) => forLevel.some((r) => r.source === s));
  const shownSources = source === 'all' ? sourcesHere : sourcesHere.filter((s) => s === source);
  const info = LEVELS.find((l) => l.key === level)!;
  const tone = STAGE_TONE[level];
  const t = totals.get(level)!;
  const grandWords = [...totals.values()].reduce((a, b) => a + b.words, 0);

  const open = (r: Row) => router.push(`/vocabulary/topic/${r.slug}--${level}` as never);

  return (
    <Screen>
      <NightHero
        scene="path"
        title={L('Từ vựng theo mức', 'Vocabulary by level')}
        sub={L(
          'Chọn mức CEFR hoặc band IELTS bạn muốn học: app xếp mọi bộ có từ ở mức đó, bấm vào là học đúng phần từ của mức.',
          'Pick a CEFR level or IELTS band: every deck with words at that level is listed, and tapping one studies just those words.',
        )}
        pills={[
          { icon: 'gem', label: L(`${grandWords.toLocaleString('vi-VN')} lượt từ`, `${grandWords.toLocaleString('en-US')} word entries`) },
          { icon: 'book', label: L(`${all.length} bộ`, `${all.length} decks`) },
          { icon: 'rocket', label: 'A1 → C2' },
        ]}
      />

      <View style={{ marginTop: 22 }}>
        <NeonHeading title={L('Chọn mức', 'Pick a level')} icon="rocket" subtitle={L('Mỗi thẻ ghi mức CEFR, band IELTS tương ứng và số bộ, số từ.', 'Each card shows the CEFR level, matching IELTS band, and deck and word counts.')} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
        {LEVELS.map((l) => {
          const n = totals.get(l.key)!;
          const on = level === l.key;
          const art = STAGE_ART[l.key];
          return (
            <View
              key={l.key}
              style={{ flexGrow: 1, flexBasis: wide ? 280 : 240, minWidth: 220, borderRadius: 30, padding: 3, backgroundColor: on ? '#FFD84A' : 'transparent', ...(on && Platform.OS === 'web' ? ({ boxShadow: '0 0 0 4px rgba(255,216,74,0.35), 0 0 30px rgba(255,216,74,0.55)' } as object) : {}) }}
            >
              <NeonTile
                title={en ? l.blurbEn : l.blurb}
                sub={n.words ? L(`${n.decks} bộ · ${n.words.toLocaleString('vi-VN')} từ`, `${n.decks} decks · ${n.words.toLocaleString('en-US')} words`) : L('Chưa có từ', 'No words yet')}
                chip={`${l.key} · ${en ? l.ieltsEn : l.ielts}${on ? ' ★' : ''}`}
                icon={art.icon}
                palette={NEON_PALETTES[art.palette]!}
                minHeight={150}
                onPress={() => {
                  setLevel(l.key);
                  setSource('all');
                }}
              />
            </View>
          );
        })}
      </View>

      <NeonWindow
        style={{ marginTop: 26 }}
        title={L(`Mức ${level} · ${info.ielts}`, `Level ${level} · ${info.ieltsEn}`)}
        badge={L(`${t.decks} bộ · ${t.words.toLocaleString('vi-VN')} từ`, `${t.decks} decks · ${t.words.toLocaleString('en-US')} words`)}
        icon={STAGE_ART[level].icon}
        padded={false}
      >
        <View style={{ backgroundColor: tone.soft, paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip on={source === 'all'} label={L('Tất cả nguồn', 'All sources')} onPress={() => setSource('all')} />
            {sourcesHere.map((s) => (
              <Chip key={s} on={source === s} label={en ? SOURCE_LABEL[s].en : SOURCE_LABEL[s].vi} onPress={() => setSource(source === s ? 'all' : s)} />
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 16, gap: 18 }}>
          {shownSources.length === 0 ? (
            <Text className="font-sans" style={{ fontSize: 15, color: MUTED }}>{L('Chưa có bộ nào có từ ở mức này.', 'No deck has words at this level yet.')}</Text>
          ) : (
            shownSources.map((s) => {
              const list = forLevel.filter((r) => r.source === s).sort((a, b) => (b.byLevel[level] ?? 0) - (a.byLevel[level] ?? 0));
              return (
                <View key={s} style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <PixelText size={26} color="#2A22B5">{en ? SOURCE_LABEL[s].en : SOURCE_LABEL[s].vi}</PixelText>
                    <View style={{ flex: 1, borderTopWidth: 3, borderStyle: 'dotted', borderColor: 'rgba(42,34,181,0.3)', marginTop: 3 }} />
                    <Text className="font-sans" style={{ fontSize: 13, color: MUTED }}>{L(`${list.length} bộ`, `${list.length} decks`)}</Text>
                  </View>
                  <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
                    {list.map((r) => {
                      const n = r.byLevel[level] ?? 0;
                      return (
                        <Pressable
                          key={r.slug}
                          accessibilityRole="button"
                          accessibilityLabel={`${en ? r.titleEn : r.title} ${level}`}
                          onPress={() => open(r)}
                          style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
                            ({ borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: hovered ? tone.mid : '#E4DFF6', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, transform: [{ translateY: pressed ? 2 : hovered ? -2 : 0 }], boxShadow: `0 3px 0 ${tone.mid}55` }) as object
                          }
                        >
                          <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F1A6E', borderWidth: 2, borderColor: tone.mid }}>
                            <AnyIcon name={deckIconFor(r.title, r.titleEn, r.source)} height={40} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text className="font-strong" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20, color: INK }}>{en ? r.titleEn : r.title}</Text>
                            <Text className="font-sans" style={{ fontSize: 13, color: MUTED }}>
                              {L(`${n} từ mức ${level} / ${r.total} từ`, `${n} ${level} words of ${r.total}`)}
                            </Text>
                          </View>
                          <Icon name="chevron-right" size={18} color={tone.mid} strokeWidth={2.4} />
                        </Pressable>
                      );
                    })}
                  </Grid>
                </View>
              );
            })
          )}
        </View>
      </NeonWindow>
    </Screen>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={on}
      onPress={onPress}
      style={{ minHeight: 42, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? '#2A22B5' : '#C9C2EE', backgroundColor: on ? '#2A22B5' : '#FFFFFF', ...(on && Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 #1A1566' } as object) : {}) }}
    >
      <Text className="font-semi" style={{ fontSize: 14, color: on ? '#FFFFFF' : INK }}>{label}</Text>
    </Pressable>
  );
}
