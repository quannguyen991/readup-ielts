/**
 * ÔN HÔM NAY — lịch ôn theo ngày của bộ từ chủ đề (`services/vocab/review-schedule.ts`).
 *
 * Khối xanh kiểu bento: số từ đến hạn hôm nay, biểu đồ 7 ngày tới (mỗi cột một
 * ngày), và nút ôn từng bộ (`/vocabulary/topic/<bộ>/quiz?only=due`).
 * `slug` có giá trị thì chỉ tính một bộ (trang của bộ đó).
 * Chưa có từ nào trong lịch (chưa học) thì không hiện gì.
 */
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CuteCalendar } from '@/components/illust/Cute';
import { CuteFlame, Motion, Sparkles } from '@/components/illust/CuteMore';
import { useHydrated } from '@/components/layout/useHydrated';
import { getVocabTopic } from '@/data/vocab-topics';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { dueBySlug, forecast } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useL } from '@/i18n/useL';

const DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function deckName(slug: string, en = false): string {
  const topic = getVocabTopic(slug);
  if (topic) return en ? topic.name : topic.nameVi;
  return SAT_VOCAB_LESSONS.find((l) => l.slug === slug)?.title ?? slug;
}

export function DueToday({ slug }: { slug?: string }) {
  const hydrated = useHydrated();
  const { L, en } = useL();
  const all = useTopicStudyStore((s) => s.reviews);
  const today = todayKey();
  const reviews = useMemo(() => (slug ? (all?.[slug] ? { [slug]: all[slug]! } : {}) : all ?? {}), [all, slug]);
  const due = useMemo(() => dueBySlug(reviews, today), [reviews, today]);
  const days = useMemo(() => forecast(reviews, today, 7), [reviews, today]);
  const scheduled = Object.values(reviews).reduce((a, w) => a + Object.keys(w ?? {}).length, 0);
  if (!hydrated || scheduled === 0) return null;

  const total = Object.values(due).reduce((a, w) => a + w.length, 0);
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <View style={{ borderRadius: 28, padding: 20, backgroundColor: '#22A06B', overflow: 'hidden', marginTop: 14 }}>
      <Sparkles count={6} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy" style={{ fontSize: 26, color: '#FFFFFF' }}>
            {L('Ôn hôm nay.', 'Review today.')}
          </Text>
          <View style={{ marginTop: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              {total > 0 ? L(`🔁 ${total} từ đến hạn`, `🔁 ${total} words due`) : L('🎉 Hết từ đến hạn', '🎉 Nothing due')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} aria-hidden>
          <Motion kind="wobble">
            <CuteFlame size={48} sleepy={total === 0} />
          </Motion>
          <Motion kind="float" delay={0.4}>
            <CuteCalendar size={58} />
          </Motion>
        </View>
      </View>

      {/* 7 ngày tới: cột cao theo số từ đến hạn */}
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 92, paddingHorizontal: 4 }} accessibilityLabel={days.map((d) => L(`${d.day}: ${d.count} từ`, `${d.day}: ${d.count} words`)).join(', ')}>
        {days.map((d, i) => {
          const wd = new Date(`${d.day}T12:00:00Z`).getUTCDay();
          return (
            <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text className="font-strong" style={{ fontSize: 12, color: '#FFFFFF' }}>
                {d.count || ''}
              </Text>
              <View style={{ width: '70%', height: Math.max(6, (d.count / max) * 52), borderRadius: 6, backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }} />
              <Text className="font-semi" style={{ fontSize: 12, color: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.8)' }}>
                {i === 0 ? L('Nay', 'Today') : en ? DAY_EN[wd] : DAY[wd]}
              </Text>
            </View>
          );
        })}
      </View>

      {total > 0 ? (
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(due).map(([s, words]) => (
            <Pressable
              key={s}
              accessibilityRole="link"
              onPress={() => router.push(`/vocabulary/topic/${s}/quiz?only=due` as never)}
              style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: hovered ? '#F0FDF4' : '#FFFFFF' })}
            >
              <Text className="font-strong" style={{ fontSize: 14, color: '#14532D' }}>
                {slug ? L('Ôn ngay', 'Review now') : deckName(s, en)}
              </Text>
              <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#22A06B' }}>
                <Text className="font-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
                  {words.length}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
