import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { CEFR_LEVELS, GRAMMAR_LESSONS, lessonsOfLevel, type CefrLevel } from '@/data/grammar';
import { LevelCard } from '@/components/vocab/LevelCard';
import { LevelHeader } from '@/components/vocab/LevelHeader';
import { useReadingFonts } from '@/lib/readingFonts';
import { isPassed, useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** DANH SÁCH NGỮ PHÁP: chọn cấp độ A1 → C2, bấm bài để vào phòng học. */

const INK = '#2B2350';
const ACCENT = '#B94A70';

export default function GrammarIndex() {
  useReadingFonts();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [level, setLevel] = useState<CefrLevel>('A1');
  const lessons = lessonsOfLevel(level);
  const counts = (lv: CefrLevel) => GRAMMAR_LESSONS.filter((l) => l.level === lv).length;
  const best = useGrammarProgressStore((st) => st.best);
  const passed = (id: string) => isPassed(best, id);
  const next = GRAMMAR_LESSONS.find((l) => !passed(l.id));
  const doneCount = GRAMMAR_LESSONS.filter((l) => passed(l.id)).length;
  const passedIn = (lv: CefrLevel) => lessonsOfLevel(lv).filter((l) => passed(l.id)).length;
  // Cấp đầu tiên còn bài chưa đạt: đó là chỗ nên học tiếp theo lộ trình.
  const suggested = CEFR_LEVELS.find((lv) => passedIn(lv) < counts(lv)) ?? null;

  return (
    <Screen>
      <LevelHeader eyebrow="Ngữ pháp" title="Luyện ngữ pháp" subtitle="Mỗi bài có các bước rõ ràng: định nghĩa, dùng khi nào, quy tắc, lỗi hay mắc, rồi kiểm tra cuối." />

      <View style={{ marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: INK, padding: 18, gap: 6, boxShadow: `0 4px 0 ${INK}` } as object}>
        <Text className="font-sans" style={{ fontSize: 13, color: '#6B5E4E' }}>Tiến độ của bạn: {doneCount} / {GRAMMAR_LESSONS.length} bài đã đạt</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: '#F3F0FB', overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((doneCount / GRAMMAR_LESSONS.length) * 100)}%`, height: 8, backgroundColor: ACCENT } as object} />
        </View>
        {next ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/ngu-phap/${next.id}` as never)}
            style={({ pressed }: { pressed: boolean }) => ({ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.8 : 1 }) as object}
          >
            <Text className="font-strong" style={{ fontSize: 12, color: ACCENT, letterSpacing: 0.5 }}>BÀI TIẾP THEO</Text>
            <Text className="font-heavy" style={{ fontSize: 18, color: INK }}>{next.level} · {next.title} ›</Text>
          </Pressable>
        ) : (
          <Text className="font-heavy" style={{ fontSize: 18, color: INK }}>Bạn đã đạt hết các bài.</Text>
        )}
        {suggested && suggested !== level ? (
          <Pressable accessibilityRole="button" onPress={() => setLevel(suggested)} style={{ alignSelf: 'flex-start' }}>
            <Text className="font-strong" style={{ fontSize: 14, color: ACCENT }}>Lộ trình gợi ý cấp {suggested} · xem ›</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 }}>
        {CEFR_LEVELS.map((lv) => (
          <LevelCard
            key={lv}
            lv={lv}
            title={lv}
            sub={`${passedIn(lv)}/${counts(lv)} bài đạt${lv === suggested ? ' · gợi ý' : ''}`}
            en={false}
            selected={lv === level}
            onPress={() => setLevel(lv)}
          />
        ))}
      </View>

      {lessons.length === 0 ? (
        <Text className="font-sans" style={{ marginTop: 22, fontSize: 16, color: INK }}>Cấp {level} đang được soạn. Bạn có thể học các cấp đã có bài.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
          {lessons.map((l, i) => (
            <Appear key={l.id} index={i} style={{ width: wide ? '48%' : '100%' } as object}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push(`/ngu-phap/${l.id}` as never)}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: INK, padding: 20, gap: 8, boxShadow: `0 5px 0 ${INK}` } as object}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: '#F3F0FB' }}>
                    <Text className="font-strong" style={{ color: ACCENT, fontSize: 12 }}>{l.level} · Bài {l.order}</Text>
                  </View>
                  {passed(l.id) ? <Text className="font-strong" style={{ color: '#15803D', fontSize: 13 }}>✓ Đã đạt</Text> : null}
                  <Text className="font-sans" style={{ color: '#6B5E4E', fontSize: 13 }}>{l.minutes} phút</Text>
                </View>
                <Text className="font-heavy" style={{ fontSize: 21, lineHeight: 27, color: INK }}>{l.title}</Text>
                <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: '#4B4036' }}>{l.summary}</Text>
                <Text className="font-strong" style={{ marginTop: 6, color: ACCENT, fontSize: 15 }}>Vào bài học ›</Text>
              </Pressable>
            </Appear>
          ))}
        </View>
      )}
    </Screen>
  );
}
