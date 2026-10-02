import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { CheckGroup, FilterRail, type RailSelection, type RailSkill } from '@/components/practice/FilterRail';
import { GROUP_LABEL, ListeningCover } from '@/components/listening/cover';
import { Button, Card, Icon, Pagination } from '@/components/ui';
import { LISTENING_TESTS } from '@/data/listening-tests';
import { sectionNumbers } from '@/services/listening/scoring';
import type { ListeningLevel, ListeningSection, ListeningTest } from '@/services/listening/types';
import { playSfx } from '@/services/audio/sfx-ui';
import { useListeningStore } from '@/store/useListeningStore';
import { color } from '@/theme/tokens';
import { useL, type L as LFn } from '@/i18n/useL';

/**
 * Thư viện Listening: lọc bên trái (Bài lẻ theo Section / Full đề / Dictation),
 * lưới thẻ bên phải. Mỗi thẻ "Bài lẻ" là MỘT section của một đề; "Full đề" chỉ
 * liệt kê đề có đủ 4 section.
 */

const buildSkills = (L: LFn): RailSkill[] => [
  { key: 'reading', label: 'Reading', icon: 'book', tint: '#B8955A', options: [], href: '/practice' },
  {
    key: 'listening',
    label: 'Listening',
    icon: 'volume',
    tint: '#F59E0B',
    options: [
      {
        key: 'single',
        label: L('Bài lẻ', 'Single sections'),
        children: [1, 2, 3, 4].map((n) => ({ key: `s${n}`, label: `Section ${n}` })),
      },
      { key: 'full', label: L('Full đề', 'Full test') },
      { key: 'dictation', label: 'Dictation' },
    ],
  },
  { key: 'writing', label: 'Writing', icon: 'pencil', tint: '#D5B377', options: [], href: '/write' },
  { key: 'speaking', label: 'Speaking', icon: 'chat', tint: '#B07A3A', options: [], href: '/speaking' },
];

type Item = { test: ListeningTest; section: ListeningSection | null };

const PAGE_SIZE = 12;

function typesOf(sections: ListeningSection[]): string[] {
  const set = new Set<string>();
  for (const s of sections) for (const g of s.groups) set.add(GROUP_LABEL[g.type]);
  return [...set];
}

function minutesOf(sections: ListeningSection[]): number {
  const sec = sections.reduce((a, s) => a + (s.durationSec ?? 330), 0);
  return Math.max(1, Math.round(sec / 60));
}

export default function ListeningLibrary() {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const SKILLS = useMemo(() => buildSkills(L), [L]);
  const attempts = useListeningStore((s) => s.attempts);

  const [selection, setSelection] = useState<RailSelection>({ skill: 'listening', option: 'single', child: null });
  const [sources, setSources] = useState<string[]>([]);
  const [levels, setLevels] = useState<ListeningLevel[]>([]);
  const [railOpen, setRailOpen] = useState(false);
  const [page, setPage] = useState(0);

  const toggle = <T extends string>(list: T[], set: (v: T[]) => void, k: T) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of LISTENING_TESTS) counts.set(t.source, (counts.get(t.source) ?? 0) + 1);
    return [...counts.entries()].map(([key, count]) => ({ key, label: key, count }));
  }, []);

  const filterKey = [selection.option, selection.child, ...sources, ...levels].join('|');
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setPage(0);
  }

  const items = useMemo<Item[]>(() => {
    const pool = LISTENING_TESTS.filter(
      (t) => (sources.length === 0 || sources.includes(t.source)) && (levels.length === 0 || levels.includes(t.level)),
    );
    if (selection.option === 'full') {
      return pool.filter((t) => t.sections.length === 4).map((test) => ({ test, section: null }));
    }
    const want = selection.child ? Number(selection.child.slice(1)) : null;
    return pool.flatMap((test) =>
      test.sections.filter((s) => want === null || s.n === want).map((section) => ({ test, section })),
    );
  }, [levels, selection, sources]);

  const filtersOn = sources.length + levels.length > 0;
  const clear = () => {
    setSources([]);
    setLevels([]);
  };

  const rail = (
    <FilterRail
      skills={SKILLS}
      selection={selection}
      onSelect={(next) => {
        playSfx('tab');
        if (next.skill === 'listening' && next.option === 'dictation') {
          router.push('/sentence' as never);
          return;
        }
        setSelection(next);
      }}
      onNavigate={(href) => router.push(href as never)}
      groups={
        <View className="mt-2 gap-2">
          <CheckGroup
            title={L('Nguồn tài liệu', 'Sources')}
            options={sourceOptions}
            selected={sources}
            onToggle={(k) => toggle(sources, setSources, k)}
          />
          <CheckGroup
            title={L('Trình độ', 'Level')}
            options={[
              { key: 'easy', label: L('Dễ', 'Easy') },
              { key: 'medium', label: L('Trung bình', 'Medium') },
              { key: 'hard', label: L('Khó', 'Hard') },
            ]}
            selected={levels}
            onToggle={(k) => toggle(levels, setLevels, k as ListeningLevel)}
          />
        </View>
      }
    />
  );

  return (
    <Screen>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View>
          <Text className="font-heavy text-ink" style={{ fontSize: 26 }}>
            Listening
          </Text>
          <Text className="font-sans text-label text-muted">
            {L('Nghe một lần, làm như thi thật — hoặc nghe lại để học.', 'Listen once like the real test, or replay to learn.')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/listening/history' as never)}
          className="flex-row items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-2"
        >
          <Icon name="clock" size={15} color={color.primary} />
          <Text className="font-strong text-label text-primary-700">{L('Xem lịch sử làm bài', 'View history')}</Text>
        </Pressable>
      </View>

      {!wide ? (
        <View className="mt-3">
          <Button
            label={railOpen ? L('Đóng bộ lọc', 'Close filters') : L('Bộ lọc', 'Filters')}
            variant="outline"
            iconLeft="filter"
            onPress={() => setRailOpen((v) => !v)}
          />
        </View>
      ) : null}

      <View className={wide ? 'mt-4 flex-row gap-5' : 'mt-4'}>
        {wide || railOpen ? (
          <View style={wide ? { width: 268 } : undefined} className={wide ? '' : 'mb-4'}>
            {rail}
          </View>
        ) : null}

        <View className="flex-1" key={filterKey}>
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="font-mid text-label text-muted">
              <Text className="font-heavy text-ink">{items.length}</Text> {L('bài khớp bộ lọc', 'tests match')}
            </Text>
            {filtersOn ? (
              <Pressable onPress={clear} accessibilityRole="button">
                <Text className="font-strong text-label text-primary-700">{L('Xoá bộ lọc', 'Clear filters')}</Text>
              </Pressable>
            ) : null}
          </View>

          {items.length === 0 ? (
            <Card>
              <View className="items-center py-6">
                <Icon name="search" size={22} color={color.subtle} />
                <Text className="mt-3 text-center font-sans text-body text-muted">
                  {L('Chưa có bài nào khớp. Bỏ bớt một bộ lọc là ra.', 'Nothing matches yet. Remove a filter to see more.')}
                </Text>
              </View>
            </Card>
          ) : (
            <>
              <Grid columns={3} tabletColumns={2} mobileColumns={1}>
                {items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((it, i) => (
                  <Appear key={`${it.test.id}-${it.section?.n ?? 'full'}`} index={i} style={{ height: '100%' }}>
                    <TestCard item={it} count={countAttempts(attempts, it)} />
                  </Appear>
                ))}
              </Grid>
              <Pagination
                page={Math.min(page, Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1))}
                pageCount={Math.max(1, Math.ceil(items.length / PAGE_SIZE))}
                onChange={setPage}
              />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

function countAttempts(list: { testId: string; section: number | null }[], it: Item): number {
  return list.filter((a) => a.testId === it.test.id && a.section === (it.section?.n ?? null)).length;
}

function TestCard({ item, count }: { item: Item; count: number }) {
  const { L } = useL();
  const { test, section } = item;
  const secs = section ? [section] : test.sections;
  const types = typesOf(secs);
  const questions = secs.reduce((a, s) => a + sectionNumbers(s).length, 0);
  const href = section ? `/listening/${test.id}?s=${section.n}` : `/listening/${test.id}`;

  return (
    <PressScale
      onPress={() => {
        playSfx('select');
        router.push(href as never);
      }}
      style={{ height: '100%' }}
      fill
      accessibilityRole="link"
      accessibilityLabel={`${test.title}${section ? ` — Section ${section.n}` : ''}`}
    >
      <View className="h-full overflow-hidden rounded-card border border-border bg-surface">
        <ListeningCover test={test} section={section?.n ?? null}>
          {count > 0 ? (
            <View
              style={{ position: 'absolute', left: 10, top: 10, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(15,23,42,0.55)' }}
            >
              <Text className="font-strong" style={{ fontSize: 11, color: '#FFFFFF' }}>
                {L(`${count} lượt làm bài`, `${count} ${count === 1 ? 'attempt' : 'attempts'}`)}
              </Text>
            </View>
          ) : null}
          {!section ? (
            <View style={{ position: 'absolute', left: 10, bottom: 10, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#0F1D33' }}>
              <Text className="font-heavy" style={{ fontSize: 12, color: '#F3D9A0' }}>
                Full test
              </Text>
            </View>
          ) : null}
        </ListeningCover>
        <View className="flex-1 p-3.5">
          <Text className="font-heavy text-body text-ink" numberOfLines={2}>
            {test.title}
            {section && test.sections.length > 1 ? ` — ${section.title}` : ''}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {types.map((t) => (
              <View key={t} className="rounded-pill bg-primary-50 px-2.5 py-1">
                <Text className="font-semi text-primary-700" style={{ fontSize: 11 }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
          <Text className="mt-2.5 font-mid text-label text-muted">
            {L(`${questions} câu · ~${minutesOf(secs)} phút`, `${questions} questions · ~${minutesOf(secs)} min`)}
          </Text>
        </View>
      </View>
    </PressScale>
  );
}
