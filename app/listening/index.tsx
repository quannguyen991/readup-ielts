import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { GROUP_LABEL, ListeningCover } from '@/components/listening/cover';
import { CatSticker } from '@/components/mascot/CatSticker';
import { HUB_UI, HubHero, HubPanel, hubLift } from '@/components/hub/HubUi';
import { Icon, Pagination } from '@/components/ui';
import { LISTENING_TESTS } from '@/data/listening-tests';
import { compareSourceTests } from '@/services/ielts/source-catalog';
import { sectionNumbers } from '@/services/listening/scoring';
import type { ListeningGroupType, ListeningLevel, ListeningSection, ListeningTest } from '@/services/listening/types';
import { playSfx } from '@/services/audio/sfx-ui';
import { useListeningStore } from '@/store/useListeningStore';
import { useL } from '@/i18n/useL';

/**
 * Thư viện Listening: lọc bên trái (Bài lẻ theo Section / Full đề / Dictation),
 * lưới thẻ bên phải. Mỗi thẻ "Bài lẻ" là MỘT section của một đề; "Full đề" chỉ
 * liệt kê đề có đủ 4 section.
 */

type Item = { test: ListeningTest; section: ListeningSection | null; task?: ListeningGroupType };

/** Một đề nghe trong kho sách Cambridge / Actual Test (chỉ metadata, không kèm lời thoại). */
type SourceMeta = {
  id: string;
  title: string;
  source: string;
  section?: string;
  questionCount: number;
  audioCount: number;
  answerKeyVerified: boolean;
};

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

type Mode = 'single' | 'full' | 'source' | 'task' | 'dictation';
const TASKS: { key: ListeningGroupType | string; vi: string; en: string }[] = [
  { key: 'gap', vi: 'Điền từ', en: 'Completion' },
  { key: 'mcq-one', vi: 'Trắc nghiệm một đáp án', en: 'Single choice' },
  { key: 'mcq-many', vi: 'Trắc nghiệm nhiều đáp án', en: 'Multiple choice' },
  { key: 'matching', vi: 'Nối thông tin', en: 'Matching' },
];

type Hover = { hovered?: boolean };

/** Nút lọc dạng viên thuốc, chọn được nhiều. */
function Pill({ label, on, onPress, count }: { label: string; on: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        playSfx('tab');
        onPress();
      }}
      style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: on ? HUB_UI.purple : HUB_UI.line, backgroundColor: on ? HUB_UI.purple : '#FFFFFF' }}
    >
      <Text style={{ fontSize: 14, fontWeight: '800', color: on ? '#FFFFFF' : HUB_UI.navy }}>{label}</Text>
      {count !== undefined ? <Text style={{ fontSize: 12.5, fontWeight: '800', color: on ? '#E3DAFF' : HUB_UI.muted }}>{count}</Text> : null}
    </Pressable>
  );
}

export default function ListeningLibrary() {
  const { L } = useL();
  const attempts = useListeningStore((s) => s.attempts);

  const [selection, setSelection] = useState<{ option: Mode; child: string | null }>({ option: 'single', child: null });
  const [sources, setSources] = useState<string[]>([]);
  const [levels, setLevels] = useState<ListeningLevel[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Kho sách Cambridge: đọc từ API cục bộ, chỉ tải khi người dùng mở mục này.
  const [sourceTests, setSourceTests] = useState<SourceMeta[] | null>(null);
  const [sourceError, setSourceError] = useState(false);
  useEffect(() => {
    if (selection.option !== 'source' || sourceTests || sourceError) return;
    let alive = true;
    fetch('/api/ielts/local-ocr')
      .then(async (response) => {
        if (!response.ok) throw new Error('not-ready');
        return (await response.json()) as { tests: SourceMeta[] };
      })
      .then((data) => {
        if (alive) setSourceTests(data.tests.filter((t) => t.section === 'Listening').sort(compareSourceTests));
      })
      .catch(() => {
        if (alive) setSourceError(true);
      });
    return () => {
      alive = false;
    };
  }, [selection.option, sourceTests, sourceError]);

  const toggle = <T extends string>(list: T[], set: (v: T[]) => void, k: T) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of LISTENING_TESTS) counts.set(t.source, (counts.get(t.source) ?? 0) + 1);
    return [...counts.entries()].map(([key, count]) => ({ key, label: key, count }));
  }, []);

  const categories = useMemo(() => [...new Set(LISTENING_TESTS.map((t) => t.cover.category).filter((v): v is string => !!v))], []);

  const filterKey = [selection.option, selection.child, category, ...sources, ...levels].join('|');
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setPage(0);
  }

  const items = useMemo<Item[]>(() => {
    if (selection.option === 'source' || selection.option === 'dictation') return [];
    const pool = LISTENING_TESTS.filter(
      (t) => (sources.length === 0 || sources.includes(t.source)) && (levels.length === 0 || levels.includes(t.level)) && (!category || t.cover.category === category),
    );
    if (selection.option === 'full') {
      return pool.filter((t) => t.sections.length === 4).map((test) => ({ test, section: null }));
    }
    if (selection.option === 'task') {
      const task = (selection.child ?? 'gap') as ListeningGroupType;
      return pool.flatMap((test) => test.sections
        .filter((s) => s.groups.some((g) => g.type === task))
        .map((section) => ({ test, section, task })));
    }
    const want = selection.child ? Number(selection.child.slice(1)) : null;
    return pool.flatMap((test) =>
      test.sections.filter((s) => want === null || s.n === want).map((section) => ({ test, section })),
    );
  }, [category, levels, selection, sources]);

  const filtersOn = sources.length + levels.length > 0 || category !== null;
  const clear = () => {
    setSources([]);
    setLevels([]);
    setCategory(null);
  };

  const sectionTotal = useMemo(() => LISTENING_TESTS.reduce((n, t) => n + t.sections.length, 0), []);
  const fullTotal = useMemo(() => LISTENING_TESTS.filter((t) => t.sections.length === 4).length, []);
  const modes: { key: Mode; icon: string; tint: string; title: string; count: string }[] = [
    { key: 'single', icon: '🎧', tint: '#DFEEFF', title: L('Bài lẻ', 'Single sections'), count: `${sectionTotal} ${L('bài', 'sections')}` },
    { key: 'full', icon: '🏁', tint: '#FFF0D6', title: L('Full đề', 'Full test'), count: `${fullTotal} ${L('đề', 'tests')}` },
    { key: 'source', icon: '📚', tint: '#EFE4FF', title: L('Cambridge & Actual', 'Cambridge & Actual'), count: sourceTests ? `${sourceTests.length} ${L('đề', 'tests')}` : '160+ ' + L('đề', 'tests') },
    { key: 'task', icon: '🎯', tint: '#DDF7E8', title: L('Luyện theo dạng', 'By question type'), count: `${TASKS.length} ${L('dạng', 'types')}` },
    { key: 'dictation', icon: '✍️', tint: '#FFE3E8', title: 'Dictation', count: L('Nghe chép', 'Listen and type') },
  ];

  const pick = (key: Mode) => {
    playSfx('tab');
    if (key === 'dictation') {
      router.push('/sentence' as never);
      return;
    }
    setSelection({ option: key, child: null });
  };

  const showFilters = selection.option !== 'source';

  return (
    <Screen>
      <HubHero
        eyebrow="IELTS · LISTENING"
        title={L('Nghe một lần, làm như thi thật', 'Listen once, like the real test')}
        accent={L('hoặc nghe lại để học', 'or replay to learn')}
        stats={[
          { value: String(LISTENING_TESTS.length), label: L('Đề nghe', 'Tests') },
          { value: String(sectionTotal), label: L('Bài lẻ', 'Sections') },
          { value: '160+', label: L('Đề Cambridge & Actual', 'Cambridge & Actual') },
          { value: String(attempts.length), label: L('Lượt đã làm', 'Your attempts') },
        ]}
      />

      <HubPanel title={L('Chọn kiểu luyện', 'Choose a mode')} icon="gamepad">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {modes.map((m) => {
            const on = selection.option === m.key;
            return (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => pick(m.key)}
                style={({ hovered }: Hover) => ({ flexGrow: 1, flexBasis: 150, gap: 6, padding: 14, borderRadius: 18, borderWidth: 2, backgroundColor: on ? HUB_UI.wash : '#FFFFFF', ...(on ? { borderColor: HUB_UI.purple } : hubLift(hovered)) }) as never}
              >
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: m.tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{m.icon}</Text>
                </View>
                <Text style={{ color: on ? HUB_UI.purple : HUB_UI.navy, fontSize: 15.5, fontWeight: '900' }}>{m.title}</Text>
                <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '700' }}>{m.count}</Text>
              </Pressable>
            );
          })}
        </View>

        {selection.option === 'single' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pill label={L('Mọi Section', 'All sections')} on={!selection.child} onPress={() => setSelection({ option: 'single', child: null })} />
            {[1, 2, 3, 4].map((n) => (
              <Pill key={n} label={`Section ${n}`} on={selection.child === `s${n}`} onPress={() => setSelection({ option: 'single', child: selection.child === `s${n}` ? null : `s${n}` })} />
            ))}
          </View>
        ) : null}
        {selection.option === 'task' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TASKS.map((t) => (
              <Pill key={t.key} label={L(t.vi, t.en)} on={(selection.child ?? 'gap') === t.key} onPress={() => setSelection({ option: 'task', child: t.key })} />
            ))}
          </View>
        ) : null}
      </HubPanel>

      {showFilters ? (
        <HubPanel title={L('Bộ lọc', 'Filters')} icon="cursor" badge={filtersOn ? L('ĐANG LỌC', 'ON') : undefined}>
          <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '800' }}>{L('NGUỒN TÀI LIỆU', 'SOURCES')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sourceOptions.map((o) => (
              <Pill key={o.key} label={o.label} count={o.count} on={sources.includes(o.key)} onPress={() => toggle(sources, setSources, o.key)} />
            ))}
          </View>
          <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '800' }}>{L('TRÌNH ĐỘ', 'LEVEL')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {([['easy', L('Dễ', 'Easy')], ['medium', L('Trung bình', 'Medium')], ['hard', L('Khó', 'Hard')]] as [ListeningLevel, string][]).map(([k, label]) => (
              <Pill key={k} label={label} on={levels.includes(k)} onPress={() => toggle(levels, setLevels, k)} />
            ))}
          </View>
          {categories.length ? (
            <>
              <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '800' }}>{L('CHỦ ĐỀ', 'TOPIC')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                <Pill label={L('Tất cả chủ đề', 'All topics')} on={!category} onPress={() => setCategory(null)} />
                {categories.map((name) => (
                  <Pill key={name} label={name} on={category === name} onPress={() => setCategory(category === name ? null : name)} />
                ))}
              </ScrollView>
            </>
          ) : null}
          {filtersOn ? (
            <Pressable onPress={clear} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: HUB_UI.purple, fontSize: 14, fontWeight: '900' }}>{L('Xoá bộ lọc', 'Clear filters')}</Text>
            </Pressable>
          ) : null}
        </HubPanel>
      ) : null}

      <HubPanel
        title={selection.option === 'source' ? L('Đề Cambridge & Actual', 'Cambridge & Actual') : L('Danh sách bài nghe', 'Listening tests')}
        icon="book"
        badge={selection.option === 'source' ? (sourceTests ? String(sourceTests.length) : '…') : String(items.length)}
      >
        <View key={filterKey}>
          {selection.option === 'source' ? (
            <SourceShelf tests={sourceTests} error={sourceError} page={page} onPage={setPage} />
          ) : items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 18 }}>
              <CatSticker pose="sleep" size={96} />
              <Text style={{ marginTop: 10, textAlign: 'center', color: HUB_UI.muted, fontSize: 14.5 }}>
                {L('Chưa có bài nào khớp. Bỏ bớt một bộ lọc là ra.', 'Nothing matches yet. Remove a filter to see more.')}
              </Text>
            </View>
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
      </HubPanel>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/listening/history' as never)}
        style={({ hovered }: Hover) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
      >
        <Text style={{ fontSize: 26 }}>🕘</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900' }}>{L('Xem lịch sử làm bài', 'View history')}</Text>
          <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '600' }}>{L(`${attempts.length} lượt đã làm`, `${attempts.length} attempts`)}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB_UI.muted} />
      </Pressable>
    </Screen>
  );
}

function SourceShelf({ tests, error, page, onPage }: { tests: SourceMeta[] | null; error: boolean; page: number; onPage: (p: number) => void }) {
  const { L } = useL();
  if (error) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 18 }}>
        <CatSticker pose="sleep" size={96} />
        <Text style={{ marginTop: 10, textAlign: 'center', color: HUB_UI.muted, fontSize: 14.5 }}>
          {L(
            'Kho đề Cambridge chỉ mở được trên máy có dữ liệu cục bộ (bản chạy thử). Bản đưa lên mạng chưa có mục này.',
            'The Cambridge bank only opens on a machine with local data (dev build). The online build does not have it yet.',
          )}
        </Text>
      </View>
    );
  }
  if (!tests) {
    return <Text className="font-nun text-body text-muted">{L('Đang tải kho đề…', 'Loading the bank…')}</Text>;
  }
  const pageCount = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  return (
    <>
      <Text className="mb-3 font-nun-mid text-label text-muted">
        <Text className="font-nun-heavy text-ink">{tests.length}</Text>{' '}
        {L('đề nghe từ sách Cambridge và Actual Test', 'listening tests from the Cambridge and Actual Test books')}
      </Text>
      <Grid columns={3} tabletColumns={2} mobileColumns={1}>
        {tests.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE).map((t, i) => (
          <Appear key={t.id} index={i} style={{ height: '100%' }}>
            <SourceCard test={t} />
          </Appear>
        ))}
      </Grid>
      <Pagination page={current} pageCount={pageCount} onChange={onPage} />
    </>
  );
}

function SourceCard({ test }: { test: SourceMeta }) {
  const { L } = useL();
  const chip = (text: string, muted = false) => (
    <View key={text} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: muted ? '#FFFFFF' : HUB_UI.wash, borderWidth: muted ? 1 : 0, borderColor: HUB_UI.line }}>
      <Text className="font-nun-mid" style={{ fontSize: 13, color: muted ? HUB_UI.muted : HUB_UI.purple }}>
        {text}
      </Text>
    </View>
  );
  return (
    <PressScale
      onPress={() => {
        playSfx('select');
        router.push(`/ielts-source-practice?test=${encodeURIComponent(test.id)}` as never);
      }}
      style={{ height: '100%' }}
      fill
      accessibilityRole="link"
      accessibilityLabel={test.title}
    >
      <View style={{ height: '100%', overflow: 'hidden', borderRadius: 18, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF', padding: 14 }}>
        <Text className="mb-1.5 font-nun-strong" style={{ fontSize: 13, color: HUB_UI.purple }}>
          {test.source}
        </Text>
        <Text className="font-nun-heavy text-body text-ink" numberOfLines={2}>
          {test.title}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {chip(`${test.questionCount} câu`)}
          {chip(test.audioCount > 0 ? L('Có audio', 'Audio') : L('Chưa có audio', 'No audio'), test.audioCount === 0)}
          {test.answerKeyVerified ? chip(L('Đáp án đã kiểm', 'Key checked')) : null}
        </View>
      </View>
    </PressScale>
  );
}

function countAttempts(list: { testId: string; section: number | null }[], it: Item): number {
  return list.filter((a) => a.testId === it.test.id && a.section === (it.section?.n ?? null)).length;
}

function TestCard({ item, count }: { item: Item; count: number }) {
  const { L } = useL();
  const { test, section, task } = item;
  const secs = section ? [task ? { ...section, groups: section.groups.filter((g) => g.type === task) } : section] : test.sections;
  const types = typesOf(secs);
  const questions = secs.reduce((a, s) => a + sectionNumbers(s).length, 0);
  const href = section ? `/listening/${test.id}?s=${section.n}${task ? `&task=${task}` : ''}` : `/listening/${test.id}`;

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
      <View style={{ height: '100%', overflow: 'hidden', borderRadius: 18, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
        <ListeningCover test={test} section={section?.n ?? null}>
          {count > 0 ? (
            <View
              style={{ position: 'absolute', left: 10, top: 10, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(15,23,42,0.55)' }}
            >
              <Text className="font-nun-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
                {L(`${count} lượt làm bài`, `${count} ${count === 1 ? 'attempt' : 'attempts'}`)}
              </Text>
            </View>
          ) : null}
          {!section ? (
            <View style={{ position: 'absolute', left: 10, bottom: 10, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#0F1D33' }}>
              <Text className="font-nun-heavy" style={{ fontSize: 13, color: '#F3D9A0' }}>
                Full test
              </Text>
            </View>
          ) : null}
        </ListeningCover>
        <View className="flex-1 p-3.5">
          {test.cover.category ? (
            <Text className="mb-1.5 font-nun-strong" style={{ fontSize: 13, color: HUB_UI.purple }}>
              {test.cover.category}
            </Text>
          ) : null}
          <Text className="font-nun-heavy text-body text-ink" numberOfLines={2}>
            {test.title}
            {section && test.sections.length > 1 ? ` — ${task ? GROUP_LABEL[task] : section.title}` : ''}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {types.map((t) => (
              <View key={t} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: HUB_UI.wash }}>
                <Text className="font-nun-mid" style={{ fontSize: 13, color: HUB_UI.purple }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
          <Text className="mt-2.5 font-nun-mid text-label text-muted">
            {L(`${questions} câu · ~${minutesOf(secs)} phút`, `${questions} questions · ~${minutesOf(secs)} min`)}
          </Text>
        </View>
      </View>
    </PressScale>
  );
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => { playSfx('tab'); onPress(); }}
      className="rounded-pill border px-3.5 py-2"
      style={{ minHeight: 40, borderColor: selected ? color.primary : color.border, backgroundColor: selected ? '#F3F0FB' : '#FFFFFF' }}
    >
      <Text className="font-nun-strong" style={{ fontSize: 13, color: selected ? color.primary : color.ink }}>{label}</Text>
    </Pressable>
  );
}
