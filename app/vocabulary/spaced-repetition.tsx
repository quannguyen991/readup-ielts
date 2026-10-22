import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { HeroShell } from '@/components/layout/HeroShell';
import { useNow } from '@/lib/clock';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { pronounce } from '@/services/audio/pronounce';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { useVocabStore, type VocabEntry } from '@/store/useVocabStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useStudyStore } from '@/store/useStudyStore';
import {
  calculateMemoryLevels,
  importLearnedTopicWords,
  WEEKDAY_LABELS,
} from '@/services/vocab/spaced-repetition';
import { CARD_KINDS, isDue } from '@/services/vocab/schedule';
import { addDays, dueDayByWord, scheduleSummary, unifiedLoad } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteBook } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';
import { pick, useL } from '@/i18n/useL';
import type { Locale } from '@/i18n/keys';

/** Nhãn thứ bằng tiếng Anh, cùng thứ tự với `WEEKDAY_LABELS` (CN → Th7). */
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SpacedRepetitionScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const { L, en, locale } = useL();

  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const gradeCard = useVocabStore((s) => s.gradeCard);
  const stages = useTopicStudyStore((s) => s.stages);
  const lapses = useTopicStudyStore((s) => s.lapses);
  const reviews = useTopicStudyStore((s) => s.reviews);
  const logWordsReviewed = useStudyStore((s) => s.logWordsReviewed);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'forgetful' | 'mastered'>('all');

  // Tự động đồng bộ các từ học ở bộ chủ đề vào sổ từ FSRS nếu chưa có
  useEffect(() => {
    const hasLearnedWords =
      Object.values(stages).some((topic) => Object.values(topic).some((st) => st >= 1)) ||
      Object.values(reviews ?? {}).some((w) => Object.keys(w ?? {}).length > 0);
    if (!hasLearnedWords) return;

    // Từ đã có lịch Leitner (kể cả mới trả lời một lần, chưa lên chặng 1) cũng vào sổ, đúng ngày đã xếp.
    const merged: Record<string, Record<string, number>> = { ...stages };
    for (const [slug, words] of Object.entries(reviews ?? {}))
      for (const w of Object.keys(words ?? {})) merged[slug] = { ...(merged[slug] ?? {}), [w]: Math.max(1, merged[slug]?.[w] ?? 0) };
    const outcome = importLearnedTopicWords(merged, entries, cards, new Date(), (slug, w) => reviews?.[slug]?.[w]?.due);
    if (outcome.addedCount > 0) {
      useVocabStore.setState({
        entries: outcome.entries,
        cards: outcome.cards,
      });
    }
  }, [stages, reviews, entries, cards]);

  const nowMs = useNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const today = todayKey(now);

  // LỊCH ÔN THẬT: lịch Leitner của bộ từ (cập nhật ở MỌI câu trả lời, lưu ngay) + thẻ FSRS của
  // những từ không nằm trong lịch Leitner. Từ nào có ngày ôn thì hiện nhãn "Đã lên lịch".
  const leitnerDue = useMemo(() => dueDayByWord(reviews), [reviews]);
  const fsrsDueDay = useMemo(() => {
    const out = new Map<string, string>();
    for (const e of Object.values(entries)) {
      let best: number | null = null;
      for (const kind of CARD_KINDS) {
        const c = cards[`${e.id}:${kind}`];
        if (c) best = best === null ? new Date(c.due).getTime() : Math.min(best, new Date(c.due).getTime());
      }
      if (best !== null) out.set(e.id, todayKey(new Date(best)));
    }
    return out;
  }, [entries, cards]);
  const extraDue = useMemo(
    () => Object.values(entries).filter((e) => !leitnerDue.has(e.lemma.trim().toLowerCase())).map((e) => fsrsDueDay.get(e.id)).filter((d): d is string => !!d),
    [entries, leitnerDue, fsrsDueDay],
  );
  const plan = useMemo(() => unifiedLoad(reviews, extraDue, today, 7), [reviews, extraDue, today]);
  const summary = useMemo(() => scheduleSummary(reviews, today), [reviews, today]);
  const forecast = useMemo(
    () => plan.map((d, i) => ({ dateKey: d.day, count: d.count, isToday: i === 0, dayLabel: WEEKDAY_LABELS[new Date(`${d.day}T12:00:00Z`).getUTCDay()]! })),
    [plan],
  );
  const dueLabel = (e: VocabEntry): { text: string; hot: boolean } | null => {
    const d = leitnerDue.get(e.lemma.trim().toLowerCase()) ?? fsrsDueDay.get(e.id);
    if (!d) return null;
    if (d <= today) return { text: L('Ôn hôm nay', 'Due today'), hot: true };
    if (d === addDays(today, 1)) return { text: L('Ôn mai', 'Due tomorrow'), hot: false };
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    return { text: L(`Ôn ${WEEKDAY_LABELS[wd]} ${d.slice(8)}/${d.slice(5, 7)}`, `Due ${WEEKDAY_EN[wd]} ${d.slice(5, 7)}/${d.slice(8)}`), hot: false };
  };
  const levels = useMemo(
    () => calculateMemoryLevels(entries, cards, lapses, now),
    [entries, cards, lapses, now],
  );

  // Danh sách từ đến hạn ôn
  const dueEntries = useMemo(() => {
    return Object.values(entries).filter((entry) => {
      return CARD_KINDS.some((kind) => {
        const c = cards[`${entry.id}:${kind}`];
        return c && new Date(c.due).getTime() <= nowMs;
      });
    });
  }, [entries, cards, nowMs]);

  // Danh sách từ hiển thị theo bộ lọc và tìm kiếm
  const wordList = useMemo(() => {
    let list = Object.values(entries);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definitionVi?.toLowerCase().includes(q) ||
          w.exampleSentence?.toLowerCase().includes(q),
      );
    }

    if (filterMode === 'due') {
      const dueIds = new Set(dueEntries.map((e) => e.id));
      list = list.filter((w) => dueIds.has(w.id));
    } else if (filterMode === 'forgetful') {
      list = list.filter((w) => {
        let maxLapse = 0;
        for (const topicMap of Object.values(lapses)) {
          if (topicMap[w.lemma]) maxLapse = Math.max(maxLapse, topicMap[w.lemma] ?? 0);
        }
        return maxLapse >= 2;
      });
    } else if (filterMode === 'mastered') {
      list = list.filter((w) => {
        const own = CARD_KINDS.map((k) => cards[`${w.id}:${k}`]).filter(Boolean);
        return own.some((c) => c && c.stability >= 21);
      });
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, cards, lapses, dueEntries, search, filterMode]);

  const maxLevel = Math.max(
    1,
    levels.unmemorized,
    levels.needLearning,
    levels.forgetful,
    levels.temporary,
    levels.mastered,
  );
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count));

  return (
    <Screen>
      {/* Đầu trang kiểu hero trang chủ: tên trang, số từ và nút ôn. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L('Quay lại', 'Back')}
        onPress={() => router.back()}
        className="mb-3 flex-row items-center gap-1 self-start rounded-full bg-surfaceAlt px-3 py-1.5"
      >
        <Icon name="chevron-left" size={16} color="#94A3B8" />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>{L('Quay lại', 'Back')}</Text>
      </Pressable>

      <HeroShell radius={26} style={{ padding: 20, marginBottom: 16 }}>
        <Text className="font-strong text-label" style={{ color: 'rgba(27,17,64,0.75)', letterSpacing: 1.4 }}>
          {L('ÔN LẶP NGẮT QUÃNG', 'SPACED REVIEW')}
        </Text>
        <Text className="mt-1 font-heavy text-pageTitle" style={{ color: '#1B1140' }}>
          {L('Toàn bộ từ đã học', 'All learned words')}
        </Text>
        <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.85)' }}>
          {L(`${Object.keys(entries).length} từ`, `${Object.keys(entries).length} words`)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Ôn ngay với bộ thẻ', 'Review now with flashcards')}
          onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
          style={({ pressed }: { pressed: boolean }) => ({
            alignSelf: 'flex-start',
            marginTop: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 44,
            paddingHorizontal: 20,
            borderRadius: 999,
            backgroundColor: '#1B1140',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Icon name="book" size={16} color="#FFFFFF" />
          <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
            {dueEntries.length > 0 ? L(`Ôn ngay (${dueEntries.length})`, `Review now (${dueEntries.length})`) : L('Ôn tất cả', 'Review all')}
          </Text>
        </Pressable>
      </HeroShell>

      {/* Lịch ôn 7 ngày: số từ đến hạn mỗi ngày, cộng dồn khi học thêm */}
      <View
        style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F0FB', paddingHorizontal: 16, paddingVertical: 14 } as never}
        accessibilityLabel={L('Lịch ôn 7 ngày tới', 'Review plan, next 7 days')}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text className="font-strong text-body text-ink">{L('Lịch ôn của bạn', 'Your review plan')}</Text>
          <Text className="font-sans text-label text-muted">
            {summary.scheduled === 0
              ? L('Học một vòng để xếp lịch', 'Study a round to build the plan')
              : L(`Đã lên lịch ${summary.scheduled} từ · hôm nay ${summary.dueToday} · mai ${summary.tomorrow} · 7 ngày ${summary.week}`, `${summary.scheduled} scheduled · today ${summary.dueToday} · tomorrow ${summary.tomorrow} · 7 days ${summary.week}`)}
          </Text>
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {plan.map((d, i) => {
            const wd = new Date(`${d.day}T12:00:00Z`).getUTCDay();
            const label = i === 0 ? L('Hôm nay', 'Today') : i === 1 ? L('Mai', 'Tmrw') : en ? WEEKDAY_EN[wd]! : WEEKDAY_LABELS[wd]!;
            return (
              <View
                key={d.day}
                style={{ flexGrow: 1, flexBasis: 74, alignItems: 'center', borderRadius: 12, paddingVertical: 8, backgroundColor: i === 0 ? '#F3F0FB' : '#F3F0FB', borderWidth: i === 0 ? 1 : 0, borderColor: '#D9BC7F' }}
              >
                <Text className="font-semi text-label text-muted">{label}</Text>
                <Text className="font-heavy text-bodyLg text-ink">{d.count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Hai khối: Mức độ nhớ & Dự báo ôn tập 7 ngày tới */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
        {/* Khối 1: Mức độ nhớ */}
        <View
          style={{
            flex: 1,
            backgroundColor: themedHex('#8B6CF0'),
            backgroundImage: 'linear-gradient(105deg, #D9BC7F 0%, #6A4BD9 100%)',
            boxShadow: '0 8px 24px rgba(168,132,63, 0.28)',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.25)',
          } as never}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View aria-hidden>
              <SealIcon name="gauge" color="#F2B632" size={34} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
              {L('Mức độ nhớ', 'Memory levels')}
            </Text>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>
                {L(`${levels.dueCount} từ đến hạn ôn`, `${levels.dueCount} words due`)}
              </Text>
            </View>
          </View>

          {/* Biểu đồ 5 cột mức độ nhớ */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 100,
              marginTop: 18,
            }}
          >
            {[
              { key: 'unmemorized', label: L('Chưa nhớ', 'Not yet'), count: levels.unmemorized, color: 'rgba(255, 255, 255, 0.45)' },
              { key: 'needLearning', label: L('Cần học', 'To learn'), count: levels.needLearning, color: '#F3F0FB' },
              { key: 'forgetful', label: L('Hay quên', 'Often forgot'), count: levels.forgetful, color: '#FECACA' },
              { key: 'temporary', label: L('Nhớ tạm', 'Short-term'), count: levels.temporary, color: '#FDE047' },
              { key: 'mastered', label: L('Nhớ sâu', 'Long-term'), count: levels.mastered, color: '#86EFAC' },
            ].map((col) => {
              const h = col.count > 0 ? Math.max(14, (col.count / maxLevel) * 60) : 6;
              return (
                <View key={col.key} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                    {col.count}
                  </Text>
                  <View
                    style={{
                      width: '100%',
                      maxWidth: 32,
                      height: h,
                      borderRadius: 5,
                      backgroundColor: col.color,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', marginTop: 6, fontWeight: '600' }}>
                    {col.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Khối 2: Dự báo ôn tập 7 ngày tới */}
        <View
          style={{
            flex: 1,
            backgroundColor: themedHex('#8B6CF0'),
            backgroundImage: 'linear-gradient(105deg, #D9BC7F 0%, #6A4BD9 100%)',
            boxShadow: '0 8px 24px rgba(168,132,63, 0.28)',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.25)',
          } as never}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View aria-hidden>
              <SealIcon name="calendar" color="#22A06B" size={34} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
              {L('Dự báo ôn tập 7 ngày tới', 'Review forecast, next 7 days')}
            </Text>
            {dueEntries.length > 0 ? (
              <View aria-hidden>
                <Label text={L('Ôn hôm nay', 'Review today')} color="#F2B632" tilt={5} size={11} />
              </View>
            ) : null}
          </View>

          {/* Biểu đồ 7 ngày */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 100,
              marginTop: 18,
            }}
          >
            {forecast.map((item) => {
              const h = item.count > 0 ? Math.max(14, (item.count / maxForecast) * 60) : 6;
              const isToday = item.isToday;

              return (
                <View key={item.dateKey} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      marginBottom: 4,
                    }}
                  >
                    {item.count}
                  </Text>
                  <View
                    style={{
                      width: '100%',
                      maxWidth: 30,
                      height: h,
                      borderRadius: 5,
                      backgroundColor: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      fontWeight: isToday ? '700' : '500',
                      marginTop: 6,
                    }}
                  >
                    {en ? (WEEKDAY_EN[WEEKDAY_LABELS.indexOf(item.dayLabel)] ?? item.dayLabel) : item.dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Thanh tìm kiếm & lọc */}
      <View className="mb-4 flex-row flex-wrap items-center gap-2">
        <View className="min-w-[200px] flex-1 flex-row items-center rounded-xl border border-border bg-surface px-3 py-2">
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder={L('Tìm theo từ, nghĩa hoặc ví dụ...', 'Search by word, meaning or example...')}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A', outlineStyle: 'none' as never }}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row gap-1.5">
          <Pressable
            onPress={() => setFilterMode('all')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'all' ? '#6A4BD9' : '#F3F0FB',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'all' ? '#FFFFFF' : '#64748B' }}>
              {L('Tất cả', 'All')} ({Object.keys(entries).length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('due')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'due' ? '#6A4BD9' : '#F3F0FB',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'due' ? '#FFFFFF' : '#64748B' }}>
              {L('Đến hạn', 'Due')} ({dueEntries.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('forgetful')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'forgetful' ? '#EF4444' : '#F3F0FB',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'forgetful' ? '#FFFFFF' : '#64748B' }}>
              {L('Hay quên', 'Often forgot')} ({levels.forgetful})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('mastered')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'mastered' ? '#10B981' : '#F3F0FB',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'mastered' ? '#FFFFFF' : '#64748B' }}>
              {L('Nhớ sâu', 'Long-term')} ({levels.mastered})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Danh sách từ */}
      <View style={{ gap: 10 }}>
        {wordList.map((entry) => {
          return (
            <View
              key={entry.id}
              style={{
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#F3F0FB',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                paddingHorizontal: 18,
                paddingVertical: 14,
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              } as never}
            >
              {/* Cột trái: Từ + phiên âm + từ loại + đồng nghĩa */}
              <View style={{ flex: wide ? 1.2 : undefined, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                  {entry.word}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  {entry.partOfSpeech ?? 'word'}
                  {entry.phonetic ? ` · ${entry.phonetic}` : ''}
                  {entry.synonyms?.length ? ` · ${entry.synonyms.slice(0, 2).join(', ')}` : ''}
                  {entry.antonyms?.length ? L(` (Trái nghĩa: ${entry.antonyms.slice(0, 2).join(', ')})`, ` (Antonyms: ${entry.antonyms.slice(0, 2).join(', ')})`) : ''}
                </Text>
              </View>

              {/* Cột giữa: Nghĩa tiếng Việt + ví dụ */}
              <View style={{ flex: wide ? 1.8 : undefined, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>
                  {entry.definitionVi ?? entry.definitionGeneral ?? '—'}
                </Text>
                {entry.exampleSentence ? (
                  <View style={{ marginTop: 3 }}>
                    <ExampleSentence example={entry.exampleSentence} word={entry.word} className="font-sans text-label text-muted" />
                  </View>
                ) : null}
              </View>

              {/* Cột phải: Thời gian + nút phát âm */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: wide ? 'center' : 'flex-end' }}>
                {(() => {
                  const b = dueLabel(entry);
                  return b ? (
                    <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: b.hot ? '#F3F0FB' : '#F3F0FB' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: b.hot ? '#6A4BD9' : '#5A3EBA' }}>{b.text}</Text>
                    </View>
                  ) : null;
                })()}
                <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                  {formatRelativeTime(entry.createdAt, locale)}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={L(`Phát âm ${entry.word}`, `Pronounce ${entry.word}`)}
                  onPress={() => void pronounce(entry.word)}
                  style={{
                    padding: 8,
                    borderRadius: 999,
                    backgroundColor: '#F3F0FB',
                  }}
                >
                  <Icon name="volume" size={15} color="#6A4BD9" />
                </Pressable>
              </View>
            </View>
          );
        })}

        {wordList.length === 0 ? (
          <View className="items-center rounded-2xl bg-surfaceAlt px-4 py-12">
            <View aria-hidden>
              <Motion kind="float">
                <Sticker tilt={-6}>
                  <CuteBook size={68} />
                </Sticker>
              </Motion>
            </View>
            <Text className="mt-3 font-strong text-cardTitle text-ink">
              {L('Chưa có từ nào trong danh sách này', 'No words in this list yet')}
            </Text>
            <Text className="mt-1 max-w-sm text-center font-sans text-label text-muted">
              {L(
                'Học các từ trong thư viện bộ từ hoặc lưu từ lúc đọc báo để FSRS tự động xếp lịch lặp lại ngắt quãng.',
                'Learn words from the word-set library or save words while reading, and FSRS will schedule spaced reviews for you.',
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function formatRelativeTime(isoDate: string, lc: Locale): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return pick(lc, 'vừa xong', 'just now');
  if (minutes < 60) return pick(lc, `${minutes} phút trước`, `${minutes} min ago`);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return pick(lc, `${hours} giờ trước`, `${hours} h ago`);
  const days = Math.floor(hours / 24);
  if (days === 1) return pick(lc, 'hôm qua', 'yesterday');
  return pick(lc, `${days} ngày trước`, `${days} days ago`);
}
