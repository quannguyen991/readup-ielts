import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { paper } from '@/components/zh-learn/parts';
import { ZH } from '@/components/vocab/chinese/palette';
import { ZH_DIALOGUES, zhDialoguesOfLevel, zhLevelsWith, type HskLevel } from '@/data/zh-learn';
import { HanyuCourseBanner } from '@/components/zh-learn/HanyuCourseBanner';
import { isPassed, useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** Hội thoại tiếng Trung theo cấp HSK và chủ đề: nghe, đọc pinyin, hiểu nghĩa, làm 5 câu kiểm tra. */
export default function ZhDialogueIndex() {
  const best = useGrammarProgressStore((s) => s.best);
  const levels = zhLevelsWith(ZH_DIALOGUES);
  const passedIn = (lv: HskLevel) => zhDialoguesOfLevel(lv).filter((d) => isPassed(best, d.id)).length;
  const [level, setLevel] = useState<HskLevel>(levels.find((lv) => passedIn(lv) < zhDialoguesOfLevel(lv).length) ?? levels[0] ?? 1);
  const items = zhDialoguesOfLevel(level);
  const done = ZH_DIALOGUES.filter((d) => isPassed(best, d.id)).length;

  return (
    <Screen>
      <HanyuCourseBanner />
      <View style={{ ...(paper as object), backgroundColor: ZH.seal, borderColor: ZH.gold2 } as object}>
        <Text style={{ fontSize: 13, letterSpacing: 1.2, color: ZH.gold2, fontWeight: '700' }}>HỘI THOẠI TIẾNG TRUNG</Text>
        <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#FFFBF3', marginTop: 4 }}>会话 · Hội thoại HSK</Text>
        <Text style={{ fontSize: 15, color: '#F4E6C2', marginTop: 6 }}>{done}/{ZH_DIALOGUES.length} bài đã đạt · nghe từng câu, bật tắt pinyin và nghĩa Việt</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }} accessibilityRole="tablist">
        {levels.map((lv) => {
          const active = lv === level;
          return (
            <Pressable key={lv} accessibilityRole="tab" aria-selected={active} onPress={() => setLevel(lv)} style={{ flexGrow: 1, flexBasis: 90, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: active ? ZH.seal : '#FFFFFF', borderWidth: 1.5, borderColor: active ? ZH.seal : ZH.line }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: active ? '#FFFFFF' : ZH.ink }}>HSK {lv}</Text>
              <Text style={{ fontSize: 13, color: active ? '#F4E6C2' : ZH.ink2 }}>{passedIn(lv)}/{zhDialoguesOfLevel(lv).length}</Text>
            </Pressable>
          );
        })}
      </View>

      {items.length === 0 ? <Text style={{ marginTop: 20, color: ZH.ink2 }}>Chưa có bài cho cấp này.</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {items.map((d) => {
          const ok = isPassed(best, d.id);
          return (
            <Pressable key={d.id} accessibilityRole="link" onPress={() => router.push(`/hoi-thoai-trung/${d.id}` as never)} style={{ flexGrow: 1, flexBasis: 280, minHeight: 84, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: ok ? ZH.sageSoft : ZH.card, borderWidth: 1.5, borderColor: ok ? ZH.sage : ZH.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? ZH.sage : ZH.goldSoftBg }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: ok ? '#FFFFFF' : ZH.seal }}>{ok ? '✓' : d.order}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '800', color: ZH.seal }}>{d.titleZh}</Text>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: ZH.ink }}>{d.title}</Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: ZH.ink2 }}>{d.topic} · {d.lines.length} câu · {d.minutes} phút</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
