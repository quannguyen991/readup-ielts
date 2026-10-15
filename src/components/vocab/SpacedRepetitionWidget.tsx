import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useNow } from '@/lib/clock';
import { useVocabStore } from '@/store/useVocabStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import {
  calculate7DayForecast,
  calculateMemoryLevels,
  importLearnedTopicWords,
  WEEKDAY_LABELS,
} from '@/services/vocab/spaced-repetition';
import { useL } from '@/i18n/useL';

const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SpacedRepetitionWidget() {
  const { L, en } = useL();
  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const stages = useTopicStudyStore((s) => s.stages);
  const lapses = useTopicStudyStore((s) => s.lapses);

  // Tự động đồng bộ các từ đã học từ các bộ chủ đề vào sổ từ FSRS nếu chưa có
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

  const maxCount = Math.max(1, ...forecast.map((f) => f.count));

  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: themedHex('#B8955A'),
        backgroundImage: 'linear-gradient(105deg, #D9BC7F 0%, #A8843F 100%)',
        boxShadow: '0 8px 24px rgba(168,132,63, 0.28)',
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
      } as never}
    >
      {/* Tiêu đề & số liệu tóm tắt */}
      <Text className="font-heavy text-inkInverse" style={{ fontSize: 18, color: '#FFFFFF' }}>
        {L('Lặp lại ngắt quãng', 'Spaced repetition')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
        <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
          {L('Từ đến hạn:', 'Due words:')}{' '}
          <Text style={{ fontWeight: '700', color: levels.dueCount > 0 ? '#FEF08A' : '#FFFFFF' }}>
            {levels.dueCount}
          </Text>
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
          {L('Thuần thục:', 'Mastered:')}{' '}
          <Text style={{ fontWeight: '700', color: '#BBF7D0' }}>{levels.mastered}</Text>
        </Text>
      </View>

      {/* Tiêu đề biểu đồ */}
      <Text
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.25)',
          alignSelf: 'flex-start',
          paddingBottom: 2,
        }}
      >
        {L('Dự báo ôn tập 7 ngày tới', 'Review forecast, next 7 days')}
      </Text>

      {/* Biểu đồ cột 7 ngày */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 110,
          marginTop: 14,
          paddingHorizontal: 4,
        }}
      >
        {forecast.map((item) => {
          // Tính chiều cao cột tối thiểu 10px, tối đa 65px
          const barHeight = item.count > 0 ? Math.max(16, (item.count / maxCount) * 65) : 8;
          const isToday = item.isToday;

          return (
            <View key={item.dateKey} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
              {/* Con số trên đỉnh cột */}
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

              {/* Cột bar */}
              <View
                style={{
                  width: '100%',
                  maxWidth: 36,
                  height: barHeight,
                  borderRadius: 6,
                  backgroundColor: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                }}
              />

              {/* Nhãn thứ (CN, Th2, ...) */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? '700' : '500',
                  color: isToday ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  marginTop: 6,
                }}
              >
                {en ? (WEEKDAY_EN[WEEKDAY_LABELS.indexOf(item.dayLabel)] ?? item.dayLabel) : item.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Nút mở màn hình Spaced Repetition */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L('Mở màn hình lặp lại ngắt quãng', 'Open spaced repetition')}
        onPress={() => router.push('/vocabulary/spaced-repetition' as never)}
        style={{
          marginTop: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          paddingVertical: 12,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        } as never}
      >
        <Icon name="calendar" size={18} color="#A8843F" />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#A8843F' }}>
          {L('Lặp lại ngắt quãng', 'Spaced repetition')}
        </Text>
      </Pressable>
    </View>
  );
}
