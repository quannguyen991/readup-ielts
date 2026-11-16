import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { paper } from '@/components/zh-learn/parts';
import { ZH } from '@/components/vocab/chinese/palette';
import { ZH_GRAMMAR, zhGrammarOfLevel, zhLevelsWith, type HskLevel } from '@/data/zh-learn';
import { HanyuCourseBanner } from '@/components/zh-learn/HanyuCourseBanner';
import { isPassed, useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** Ngữ pháp tiếng Trung theo cấp HSK: chọn cấp, bấm bài để vào học. */
export default function ZhGrammarIndex() {
  const best = useGrammarProgressStore((s) => s.best);
  const levels = zhLevelsWith(ZH_GRAMMAR);
  const passedIn = (lv: HskLevel) => zhGrammarOfLevel(lv).filter((l) => isPassed(best, l.id)).length;
  const [level, setLevel] = useState<HskLevel>(levels.find((lv) => passedIn(lv) < zhGrammarOfLevel(lv).length) ?? levels[0] ?? 1);
  const lessons = zhGrammarOfLevel(level);
  const done = ZH_GRAMMAR.filter((l) => isPassed(best, l.id)).length;

  return (
    <Screen>
      <HanyuCourseBanner />
      <View style={{ ...(paper as object), backgroundColor: ZH.seal, borderColor: ZH.gold2 } as object}>
        <Text style={{ fontSize: 13, letterSpacing: 1.2, color: ZH.gold2, fontWeight: '700' }}>NGỮ PHÁP TIẾNG TRUNG</Text>
        <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#FFFBF3', marginTop: 4 }}>语法 · Ngữ pháp HSK</Text>
        <Text style={{ fontSize: 15, color: '#F4E6C2', marginTop: 6 }}>{done}/{ZH_GRAMMAR.length} bài đã đạt · mỗi bài có ví dụ pinyin, nghe và 5 câu kiểm tra</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }} accessibilityRole="tablist">
        {levels.map((lv) => {
          const active = lv === level;
          return (
            <Pressable key={lv} accessibilityRole="tab" aria-selected={active} onPress={() => setLevel(lv)} style={{ flexGrow: 1, flexBasis: 90, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: active ? ZH.seal : '#FFFFFF', borderWidth: 1.5, borderColor: active ? ZH.seal : ZH.line }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: active ? '#FFFFFF' : ZH.ink }}>HSK {lv}</Text>
              <Text style={{ fontSize: 13, color: active ? '#F4E6C2' : ZH.ink2 }}>{passedIn(lv)}/{zhGrammarOfLevel(lv).length}</Text>
            </Pressable>
          );
        })}
      </View>

      {lessons.length === 0 ? <Text style={{ marginTop: 20, color: ZH.ink2 }}>Chưa có bài cho cấp này.</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {lessons.map((l) => {
          const ok = isPassed(best, l.id);
          return (
            <Pressable key={l.id} accessibilityRole="link" onPress={() => router.push(`/ngu-phap-trung/${l.id}` as never)} style={{ flexGrow: 1, flexBasis: 260, minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: ok ? ZH.sageSoft : ZH.card, borderWidth: 1.5, borderColor: ok ? ZH.sage : ZH.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? ZH.sage : ZH.goldSoftBg }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: ok ? '#FFFFFF' : ZH.seal }}>{ok ? '✓' : l.order}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: ZH.seal }}>{l.titleZh}</Text>
                <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', color: ZH.ink }}>{l.title}</Text>
                <Text style={{ fontSize: 12, color: ZH.ink2 }}>{l.minutes} phút</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
