import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { LEVEL_LESSONS, type GrammarLevel } from '@/services/hub/grammar-course';
import { PASS_PERCENT } from '@/services/hub/level-test';
import { useHubStore } from '@/store/useHubStore';
import { useLevelTestStore } from '@/store/useLevelTestStore';

const LEVELS: GrammarLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];
const LEVEL_TITLE: Record<GrammarLevel, string> = {
  A1: 'Sơ cấp',
  A2: 'Sơ trung cấp',
  B1: 'Trung cấp',
  B2: 'Trung cao cấp',
  C: 'Cao cấp (Band 8.0 - 9.0 Mastery)',
};

const A1_ICONS: Record<string, string> = {
  'a1-articles': 'abc',
  'a1-can': '💪',
  'a1-past-simple': '📖',
  'a1-plurals': '🎯',
  'a1-present-continuous': '🎬',
  'a1-present-simple': '🌅',
  'a1-questions': '❓',
  'a1-there-is': '📍',
};

export default function GrammarLevels() {
  const [level, setLevel] = useState<GrammarLevel>('A1');
  const lessonsDone = useHubStore((s) => s.lessonsDone);
  const list = LEVEL_LESSONS[level];
  const doneCount = list.filter((l) => lessonsDone[l.id]).length;
  const best = useLevelTestStore((s) => s.best[level]);

  return (
    <HubScreen title="Làm chủ ngữ pháp tiếng Anh" subtitle="Lộ trình A1 → C · Quy tắc & Luyện nói tương tác cùng Khối cầu AI" back>
      {/* 5 Level Large Tabs */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {LEVELS.map((lv) => {
          const on = lv === level;
          return (
            <Pressable
              key={lv}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setLevel(lv)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? '#8C531B' : HUB.glassStrong,
                borderWidth: 1.5,
                borderColor: on ? '#8C531B' : HUB.line,
              }}
            >
              <Text style={{ color: on ? '#fff' : HUB.ink, fontSize: 16, fontWeight: '800' }}>{lv}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Level Summary Header */}
      <View style={{ gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>{LEVEL_TITLE[level]}</Text>
        <Text style={{ color: HUB.muted, fontSize: 13 }}>
          {`Hoàn thành ${list.length} bài học để nâng cao kỹ năng · Đã xong ${doneCount}/${list.length}`}
        </Text>
      </View>

      {/* Level Mastery Test Card */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/hub/grammar/test/${level}` as never)}
        style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }]}
      >
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(124, 58, 237, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={20} color="#C084FC" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{`Đề kiểm tra chuẩn ${level}`}</Text>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>
            {best ? `Điểm cao nhất ${best.percent}% · Đã làm ${best.attempts} lần` : `10 câu kiểm tra tổng hợp · Đạt từ ${PASS_PERCENT}%`}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB.muted} />
      </Pressable>

      {/* Lesson List */}
      <View style={{ gap: 10 }}>
        {list.map((l, idx) => {
          const done = Boolean(lessonsDone[l.id]);
          const emojiIcon = A1_ICONS[l.id] ?? (level === 'C' ? '⚡' : '📘');

          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={l.title}
              onPress={() => {
                // If it's a grammar lesson like Can/Can't, allow direct practice with Voice Orb
                router.push(`/hub/tutor/grammar?lessonId=${l.id}` === '' ? '/hub/tutor/grammar' : (`/hub/grammar/${l.id}` as never));
              }}
              style={[
                GLASS_CARD,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: done ? 'rgba(34, 197, 94, 0.4)' : HUB.line,
                },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? 'rgba(34, 197, 94, 0.2)' : HUB.glassStrong,
                }}
              >
                {emojiIcon === 'abc' ? (
                  <Text style={{ color: done ? '#34D399' : '#8C531B', fontSize: 14, fontWeight: '800' }}>abc</Text>
                ) : (
                  <Text style={{ fontSize: 18 }}>{emojiIcon}</Text>
                )}
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{l.title}</Text>
                  {done ? (
                    <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                      <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '800' }}>ĐÃ XONG</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>{l.subtitle}</Text>
              </View>

              {/* Action shortcuts: voice orb or quiz */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  accessibilityLabel="Luyện nói cùng Khối cầu AI"
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({
                      pathname: '/hub/tutor/[id]',
                      params: { id: 'grammar', lessonTitle: l.title, lessonId: l.id },
                    } as never);
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: 'rgba(140, 83, 27, 0.2)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Icon name="mic" size={13} color="#38BDF8" />
                  <Text style={{ color: '#8C531B', fontSize: 11, fontWeight: '800' }}>Luyện nói</Text>
                </Pressable>
                <Icon name="chevron-right" size={16} color={HUB.muted} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </HubScreen>
  );
}
