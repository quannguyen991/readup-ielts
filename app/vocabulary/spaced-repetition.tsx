import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';

import { Screen } from '@/components/layout/Screen';
import { useNow } from '@/lib/clock';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { englishVoice } from '@/services/audio/voice';
import { useVocabStore, type VocabEntry } from '@/store/useVocabStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useStudyStore } from '@/store/useStudyStore';
import {
  calculate7DayForecast,
  calculateMemoryLevels,
  importLearnedTopicWords,
} from '@/services/vocab/spaced-repetition';
import { CARD_KINDS, isDue } from '@/services/vocab/schedule';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteBook } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';

export default function SpacedRepetitionScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const gradeCard = useVocabStore((s) => s.gradeCard);
  const stages = useTopicStudyStore((s) => s.stages);
  const lapses = useTopicStudyStore((s) => s.lapses);
  const logWordsReviewed = useStudyStore((s) => s.logWordsReviewed);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'forgetful' | 'mastered'>('all');

  // Tự động đồng bộ các từ học ở bộ chủ đề vào sổ từ FSRS nếu chưa có
  useEffect(() => {
    const hasLearnedWords = Object.values(stages).some((topic) =>
      Object.values(topic).some((st) => st >= 1),
    );
    if (!hasLearnedWords) return;

    const outcome = importLearnedTopicWords(stages, entries, cards);
    if (outcome.addedCount > 0) {
      useVocabStore.setState({
        entries: outcome.entries,
        cards: outcome.cards,
      });
    }
  }, [stages, entries, cards]);

  const nowMs = useNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const forecast = useMemo(() => calculate7DayForecast(entries, cards, now), [entries, cards, now]);
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
      {/* Header bar */}
      <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            className="flex-row items-center gap-1 rounded-full bg-surfaceAlt px-3 py-1.5"
          >
            <Icon name="chevron-left" size={16} color="#94A3B8" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>Quay lại</Text>
          </Pressable>
          <View>
            <Text className="font-heavy text-ink" style={{ fontSize: 22 }}>
              Toàn bộ từ đã học
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {Object.keys(entries).length} từ
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View aria-hidden>
            <PageStickers scene="review" size={76} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ôn ngay với bộ thẻ"
            onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 14,
              backgroundColor: '#5B8BEE',
              backgroundImage: 'linear-gradient(105deg, #7FA3F6 0%, #4A7FE8 100%)',
              boxShadow: '0 4px 14px rgba(74, 127, 232, 0.3)',
              paddingHorizontal: 16,
              paddingVertical: 10,
            } as never}
          >
            <Icon name="book" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
              {dueEntries.length > 0 ? `Ôn ngay (${dueEntries.length})` : 'Ôn tất cả'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Hai khối: Mức độ nhớ & Dự báo ôn tập 7 ngày tới */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
        {/* Khối 1: Mức độ nhớ */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#5B8BEE',
            backgroundImage: 'linear-gradient(105deg, #7FA3F6 0%, #4A7FE8 100%)',
            boxShadow: '0 8px 24px rgba(74, 127, 232, 0.28)',
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
              Mức độ nhớ
            </Text>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>
                {levels.dueCount} từ đến hạn ôn
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
              { label: 'Chưa nhớ', count: levels.unmemorized, color: 'rgba(255, 255, 255, 0.45)' },
              { label: 'Cần học', count: levels.needLearning, color: '#BAE6FD' },
              { label: 'Hay quên', count: levels.forgetful, color: '#FECACA' },
              { label: 'Nhớ tạm', count: levels.temporary, color: '#FDE047' },
              { label: 'Nhớ sâu', count: levels.mastered, color: '#86EFAC' },
            ].map((col) => {
              const h = col.count > 0 ? Math.max(14, (col.count / maxLevel) * 60) : 6;
              return (
                <View key={col.label} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
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
                  <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.9)', marginTop: 6, fontWeight: '600' }}>
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
            backgroundColor: '#5B8BEE',
            backgroundImage: 'linear-gradient(105deg, #7FA3F6 0%, #4A7FE8 100%)',
            boxShadow: '0 8px 24px rgba(74, 127, 232, 0.28)',
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
              Dự báo ôn tập 7 ngày tới
            </Text>
            {dueEntries.length > 0 ? (
              <View aria-hidden>
                <Label text="Ôn hôm nay" color="#F2B632" tilt={5} size={11} />
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
                      fontSize: 11,
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
                      fontSize: 10,
                      color: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      fontWeight: isToday ? '700' : '500',
                      marginTop: 6,
                    }}
                  >
                    {item.dayLabel}
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
            placeholder="Tìm theo từ, nghĩa hoặc ví dụ..."
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
              backgroundColor: filterMode === 'all' ? '#4A7FE8' : '#F1F5F9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'all' ? '#FFFFFF' : '#64748B' }}>
              Tất cả ({Object.keys(entries).length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('due')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'due' ? '#EA580C' : '#F1F5F9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'due' ? '#FFFFFF' : '#64748B' }}>
              Đến hạn ({dueEntries.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('forgetful')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'forgetful' ? '#EF4444' : '#F1F5F9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'forgetful' ? '#FFFFFF' : '#64748B' }}>
              Hay quên ({levels.forgetful})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('mastered')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: filterMode === 'mastered' ? '#10B981' : '#F1F5F9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filterMode === 'mastered' ? '#FFFFFF' : '#64748B' }}>
              Nhớ sâu ({levels.mastered})
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
                borderColor: '#E2E8F0',
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
                  {entry.antonyms?.length ? ` (Trái nghĩa: ${entry.antonyms.slice(0, 2).join(', ')})` : ''}
                </Text>
              </View>

              {/* Cột giữa: Nghĩa tiếng Việt + ví dụ */}
              <View style={{ flex: wide ? 1.8 : undefined, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>
                  {entry.definitionVi ?? entry.definitionGeneral ?? '—'}
                </Text>
                {entry.exampleSentence ? (
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }} numberOfLines={2}>
                    {entry.exampleSentence}
                  </Text>
                ) : null}
              </View>

              {/* Cột phải: Thời gian + nút phát âm */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: wide ? 'center' : 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                  {formatRelativeTime(entry.createdAt)}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Phát âm ${entry.word}`}
                  onPress={() =>
                    Speech.speak(entry.word, {
                      language: 'en-US',
                      rate: 0.9,
                      voice: englishVoice(),
                    })
                  }
                  style={{
                    padding: 8,
                    borderRadius: 999,
                    backgroundColor: '#EFF6FF',
                  }}
                >
                  <Icon name="volume" size={15} color="#4A7FE8" />
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
              Chưa có từ nào trong danh sách này
            </Text>
            <Text className="mt-1 max-w-sm text-center font-sans text-label text-muted">
              Học các từ trong thư viện bộ từ hoặc lưu từ lúc đọc báo để FSRS tự động xếp lịch lặp lại ngắt quãng.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hôm qua';
  return `${days} ngày trước`;
}
