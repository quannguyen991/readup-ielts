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
  const [isReviewing, setIsReviewing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

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

  // Ôn tập
  const reviewList = dueEntries.length > 0 ? dueEntries : Object.values(entries).slice(0, 20);
  const currentWord = reviewList[reviewIndex];

  const handleGrade = (rating: 1 | 2 | 3 | 4) => {
    if (!currentWord) return;
    gradeCard(currentWord.id, 'word_to_meaning', rating);
    logWordsReviewed(1);
    logStudyTime('review', 1);
    setRevealed(false);

    if (reviewIndex + 1 < reviewList.length) {
      setReviewIndex((prev) => prev + 1);
    } else {
      setIsReviewing(false);
      setReviewIndex(0);
    }
  };

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
      <View className="mb-4 flex-row items-center justify-between">
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

        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ôn tất cả"
            onPress={() => {
              setReviewIndex(0);
              setRevealed(false);
              setIsReviewing(true);
            }}
            className="flex-row items-center gap-2 rounded-xl bg-ink px-4 py-2"
          >
            <Icon name="book" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
              {dueEntries.length > 0 ? `Ôn ngay (${dueEntries.length})` : 'Ôn tất cả'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Màn hình ôn tập FSRS nếu đang bật */}
      {isReviewing && currentWord ? (
        <Card className="mb-6 border-primary-200 bg-surface p-6 shadow-lg">
          <View className="flex-row items-center justify-between border-b border-border pb-3">
            <Badge label={`Ôn tập FSRS (${reviewIndex + 1}/${reviewList.length})`} tone="primary" />
            <Pressable onPress={() => setIsReviewing(false)}>
              <Text className="font-semi text-label text-muted">Đóng [✕]</Text>
            </Pressable>
          </View>

          <View className="my-6 items-center">
            <Text className="font-heavy text-pageTitle text-ink">{currentWord.word}</Text>
            {currentWord.phonetic ? (
              <Text className="mt-1 font-sans text-label text-muted">{currentWord.phonetic}</Text>
            ) : null}

            <Pressable
              onPress={() =>
                Speech.speak(currentWord.word, {
                  language: 'en-US',
                  rate: 0.9,
                  voice: englishVoice(),
                })
              }
              className="mt-3 flex-row items-center gap-1.5 rounded-full bg-surfaceAlt px-3 py-1.5"
            >
              <Icon name="volume" size={14} color="#64748B" />
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Nghe phát âm</Text>
            </Pressable>

            {revealed ? (
              <View className="mt-6 w-full rounded-2xl bg-surfaceAlt p-4">
                <Text className="font-strong text-sectionTitle text-primary-700">
                  {currentWord.definitionVi ?? '—'}
                </Text>
                {currentWord.definitionGeneral ? (
                  <Text className="mt-1 font-sans text-body text-body">
                    {currentWord.definitionGeneral}
                  </Text>
                ) : null}
                {currentWord.exampleSentence ? (
                  <Text className="mt-2 font-sans text-label italic text-muted">
                    “{currentWord.exampleSentence}”
                  </Text>
                ) : null}
              </View>
            ) : (
              <View className="mt-8 w-full max-w-xs">
                <Button
                  label="Lật xem nghĩa"
                  variant="primary"
                  onPress={() => setRevealed(true)}
                />
              </View>
            )}
          </View>

          {revealed ? (
            <View className="border-t border-border pt-4">
              <Text className="mb-3 text-center font-semi text-label text-muted">
                Bạn nhớ từ này thế nào?
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleGrade(1)}
                  style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#DC2626', fontSize: 13 }}>Quên (1)</Text>
                  <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>Ôn lại ngay</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(2)}
                  style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#D97706', fontSize: 13 }}>Khó (2)</Text>
                  <Text style={{ fontSize: 10, color: '#F59E0B', marginTop: 2 }}>Sau 1-2 ngày</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(3)}
                  style={{ flex: 1, backgroundColor: '#DBEAFE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#2563EB', fontSize: 13 }}>Nhớ (3)</Text>
                  <Text style={{ fontSize: 10, color: '#3B82F6', marginTop: 2 }}>Sau 3-4 ngày</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleGrade(4)}
                  style={{ flex: 1, backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#16A34A', fontSize: 13 }}>Dễ (4)</Text>
                  <Text style={{ fontSize: 10, color: '#22C55E', marginTop: 2 }}>Sau 1 tuần</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Hai khối: Mức độ nhớ & Dự báo ôn tập 7 ngày tới */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, marginBottom: 20 }}>
        {/* Khối 1: Mức độ nhớ */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#0F172A',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#1E293B',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
              Mức độ nhớ
            </Text>
            <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '600' }}>
              {levels.dueCount} từ đến hạn ôn
            </Text>
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
              { label: 'Chưa nhớ', count: levels.unmemorized, color: '#64748B' },
              { label: 'Cần học', count: levels.needLearning, color: '#38BDF8' },
              { label: 'Hay quên', count: levels.forgetful, color: '#EF4444' },
              { label: 'Nhớ tạm', count: levels.temporary, color: '#F59E0B' },
              { label: 'Nhớ sâu', count: levels.mastered, color: '#10B981' },
            ].map((col) => {
              const h = col.count > 0 ? Math.max(14, (col.count / maxLevel) * 60) : 6;
              return (
                <View key={col.label} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 4 }}>
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
                  <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 6, fontWeight: '500' }}>
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
            backgroundColor: '#0F172A',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#1E293B',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
            Dự báo ôn tập 7 ngày tới
          </Text>

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
                      color: isToday ? '#F97316' : '#94A3B8',
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
                      backgroundColor: isToday ? '#EA580C' : '#64748B',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: isToday ? '#F97316' : '#94A3B8',
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
              backgroundColor: filterMode === 'all' ? '#0F172A' : '#F1F5F9',
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
                borderRadius: 14,
                backgroundColor: '#0F172A',
                borderWidth: 1,
                borderColor: '#1E293B',
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Cột trái: Từ + phiên âm + từ loại + đồng nghĩa */}
              <View style={{ flex: wide ? 1.2 : undefined, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  {entry.word}
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
                  {entry.partOfSpeech ?? 'word'}
                  {entry.phonetic ? ` - ${entry.phonetic}` : ''}
                  {entry.synonyms?.length ? ` - ${entry.synonyms.slice(0, 2).join(', ')}` : ''}
                  {entry.antonyms?.length ? ` (Trái nghĩa: ${entry.antonyms.slice(0, 2).join(', ')})` : ''}
                </Text>
              </View>

              {/* Cột giữa: Nghĩa tiếng Việt + ví dụ */}
              <View style={{ flex: wide ? 1.8 : undefined, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#F1F5F9' }}>
                  {entry.definitionVi ?? entry.definitionGeneral ?? '—'}
                </Text>
                {entry.exampleSentence ? (
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }} numberOfLines={2}>
                    {entry.exampleSentence}
                  </Text>
                ) : null}
              </View>

              {/* Cột phải: Thời gian + nút phát âm */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: wide ? 'center' : 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#64748B' }}>
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
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <Icon name="volume" size={15} color="#94A3B8" />
                </Pressable>
              </View>
            </View>
          );
        })}

        {wordList.length === 0 ? (
          <View className="items-center rounded-2xl bg-surfaceAlt px-4 py-12">
            <Icon name="book" size={32} color="#94A3B8" />
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
