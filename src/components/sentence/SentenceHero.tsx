import React, { useMemo } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NightHero } from '@/components/catalog/NightHero';
import { LearnSticker } from '@/components/sentence/LearnSticker';
import { Icon } from '@/components/ui';
import { DICTATION_SETS } from '@/data/dictation-sets';
import { ESSAYS } from '@/data/essays';
import { PARAGRAPH_PROMPTS } from '@/data/paragraph-prompts';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { setProgress, type LearnMode } from '@/services/sentence/learn-status';
import { buildToday, type PlanItem, type PlanSet } from '@/services/sentence/today-plan';
import { useLearnStats } from '@/store/useSentenceStore';
import { useL } from '@/i18n/useL';

/**
 * ĐẦU TRANG của các trang luyện câu, cùng ngôn ngữ thiết kế với trang "Hôm nay":
 * cửa sổ đêm có tiêu đề pixel + ba việc "Lộ trình hôm nay" (tiếp tục bài dở, bài mới vừa sức,
 * thử thách). Mọi con số lấy từ lịch sử làm bài thật.
 */

export type HeroKind = 'dictation' | 'translation' | 'express' | 'paragraph' | 'essay';

const dictIds = (id: string, n: number) => Array.from({ length: n }, (_, i) => `${id}-${String(i + 1).padStart(2, '0')}`);

function plansFor(kind: HeroKind): { mode: LearnMode; sets: PlanSet[]; unit: [string, string] } {
  if (kind === 'dictation' || kind === 'express') {
    const base = kind === 'express' ? '/sentence/express' : '/sentence/dictation';
    return {
      mode: kind,
      unit: ['câu', 'sentences'],
      sets: DICTATION_SETS.map((s) => ({ id: s.id, title: s.title, level: s.level, ids: dictIds(s.id, s.sentences.length), href: `${base}?set=${s.id}` })),
    };
  }
  if (kind === 'translation') {
    return {
      mode: 'translation',
      unit: ['câu', 'sentences'],
      sets: TRANSLATION_SETS.map((s) => ({ id: s.id, title: s.title, level: s.level, ids: s.items.map((i) => i.id), href: `/sentence/translate?set=${s.id}` })),
    };
  }
  if (kind === 'essay') {
    return {
      mode: 'essay',
      unit: ['câu', 'sentences'],
      sets: ESSAYS.map((e) => ({ id: e.id, title: e.title, level: e.level, ids: e.sentences.map((_, i) => `${e.id}:${i}`), href: `/sentence/essay?id=${e.id}` })),
    };
  }
  return {
    mode: 'paragraph',
    unit: ['đoạn', 'paragraphs'],
    sets: PARAGRAPH_PROMPTS.map((p) => ({ id: p.id, title: p.title, level: p.level, ids: [p.id], href: `/sentence/paragraph?id=${p.id}` })),
  };
}

const KIND_STYLE: Record<PlanItem['kind'], { bg: string; ink: string; vi: string; en: string; icon: 'play' | 'sparkle' | 'target' }> = {
  continue: { bg: '#FEF3C7', ink: '#92400E', vi: 'Tiếp tục', en: 'Continue', icon: 'play' },
  fresh: { bg: '#DCFCE7', ink: '#15803D', vi: 'Bài mới', en: 'New', icon: 'sparkle' },
  challenge: { bg: '#FFE4E6', ink: '#BE123C', vi: 'Thử thách', en: 'Challenge', icon: 'target' },
};

export function SentenceHero({
  kind,
  title,
  sub,
  secondary,
}: {
  kind: HeroKind;
  title: string;
  sub: string;
  secondary?: { label: string; onPress: () => void };
}) {
  const { L, en } = useL();
  const stats = useLearnStats();
  const { mode, sets, unit } = useMemo(() => plansFor(kind), [kind]);
  const plan = useMemo(() => buildToday(sets, stats, mode), [sets, stats, mode]);
  const totals = useMemo(() => {
    let learned = 0;
    let learning = 0;
    let units = 0;
    for (const s of sets) {
      const p = setProgress(stats, mode, s.ids);
      units += p.learned;
      if (p.state === 'learned') learned += 1;
      else if (p.state === 'learning') learning += 1;
    }
    return { learned, learning, units };
  }, [sets, stats, mode]);

  const first = plan[0];
  return (
    <View style={{ gap: 14 }}>
      <NightHero
        compact
        scene="today"
        title={title}
        sub={sub}
        pills={[
          { icon: 'book', label: L(`${sets.length} bài`, `${sets.length} sets`) },
          { icon: 'trophy', label: L(`${totals.learned} đã học · ${totals.learning} đang học`, `${totals.learned} learned · ${totals.learning} in progress`) },
          { icon: 'note', label: L(`${totals.units} ${unit[0]} đã làm đúng`, `${totals.units} ${unit[1]} done right`) },
        ]}
        primary={first ? { label: `${en ? KIND_STYLE[first.kind].en : KIND_STYLE[first.kind].vi}: ${first.set.title}`, onPress: () => router.push(first.set.href as never) } : undefined}
        secondary={secondary}
      />

      {plan.length > 0 ? (
        <View>
          <Text className="font-nun-heavy" style={{ fontSize: 18, color: '#2B2350', marginBottom: 8 }}>
            {L('Lộ trình hôm nay', "Today's path")}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {plan.map((p) => {
              const st = KIND_STYLE[p.kind];
              return (
                <Pressable
                  key={p.kind}
                  accessibilityRole="button"
                  accessibilityLabel={`${en ? st.en : st.vi}: ${p.set.title}`}
                  onPress={() => router.push(p.set.href as never)}
                  style={({ pressed }) => ({
                    flexGrow: 1,
                    flexBasis: 240,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#C9C2EE',
                    padding: 14,
                    opacity: pressed ? 0.92 : 1,
                    ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 0 rgba(42,34,181,0.16)' } as object) : {}),
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: st.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Icon name={st.icon} size={13} color={st.ink} strokeWidth={2.4} />
                      <Text className="font-nun-heavy" style={{ fontSize: 12.5, color: st.ink }}>{en ? st.en : st.vi}</Text>
                    </View>
                    <Text className="font-nun-strong" style={{ fontSize: 12.5, color: '#6B6590' }}>{p.set.level}</Text>
                    <View style={{ flex: 1 }} />
                    <LearnSticker state={p.progress.state} learned={p.progress.learned} total={p.progress.total} size="sm" />
                  </View>
                  <Text className="font-nun-heavy" numberOfLines={2} style={{ fontSize: 17, lineHeight: 22, color: '#2B2350', marginTop: 8 }}>{p.set.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
