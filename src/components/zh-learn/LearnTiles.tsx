import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ZH_DIALOGUES, ZH_GRAMMAR } from '@/data/zh-learn';
import { isPassed, useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** Hai lối vào ở lộ trình HSK: Ngữ pháp và Hội thoại tiếng Trung. */
export function ZhLearnTiles({ accent }: { accent: string }) {
  const best = useGrammarProgressStore((s) => s.best);
  const gDone = ZH_GRAMMAR.filter((l) => isPassed(best, l.id)).length;
  const dDone = ZH_DIALOGUES.filter((d) => isPassed(best, d.id)).length;
  const tiles = [
    { zh: '语法', title: 'Ngữ pháp HSK', sub: `${gDone}/${ZH_GRAMMAR.length} bài · ví dụ pinyin, nghe, kiểm tra`, href: '/ngu-phap-trung' },
    { zh: '会话', title: 'Hội thoại HSK', sub: `${dDone}/${ZH_DIALOGUES.length} bài · nghe từng câu, bật tắt pinyin`, href: '/hoi-thoai-trung' },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {tiles.map((t) => (
        <Pressable key={t.href} accessibilityRole="link" onPress={() => router.push(t.href as never)} style={{ flexGrow: 1, flexBasis: 280, minHeight: 92, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1.5, borderColor: accent, backgroundColor: 'rgba(255,251,243,0.96)' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: accent }}>{t.zh}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#4A1A24' }}>{t.title}</Text>
            <Text style={{ fontSize: 13, color: '#6E4B4F' }}>{t.sub}</Text>
          </View>
          <Text style={{ fontSize: 22, color: accent }}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}
