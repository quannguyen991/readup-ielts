import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { levelsWithSentences, type EaLang } from '@/services/east-asian-sentences/pool';

/** Hai lối vào ở lộ trình HSK / JLPT: Nghe chép chính tả và Dịch câu. */
export function EaSentenceTiles({ lang, accent }: { lang: EaLang; accent: string }) {
  const range = levelsWithSentences(lang);
  const span = range.length ? `${range[0]!.replace('JLPT ', '')} → ${range[range.length - 1]!.replace('JLPT ', '')}` : '';
  const tiles = [
    { mark: lang === 'zh' ? '听写' : '書取', title: 'Nghe chép chính tả', sub: `Nghe câu, gõ lại chữ · ${span}`, href: `/nghe-chep-ea/${lang}` },
    { mark: lang === 'zh' ? '翻译' : '翻訳', title: 'Dịch câu', sub: `Việt ↔ ${lang === 'zh' ? 'Trung' : 'Nhật'} · gõ hoặc chọn nghĩa`, href: `/dich-cau-ea/${lang}` },
    ...(lang === 'ja' ? [{ mark: '文法', title: 'Ngữ pháp JLPT', sub: '127 mẫu N5 → N1 · ví dụ, nghe, điền chỗ trống', href: '/ngu-phap-nhat' }, { mark: '漢字', title: 'Kanji JLPT', sub: '2.383 chữ N5 → N1 · âm Hán Việt, âm On/Kun, luyện đoán', href: '/kanji-nhat' }] : []),
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {tiles.map((t) => (
        <Pressable key={t.href} accessibilityRole="link" onPress={() => router.push(t.href as never)} style={{ flexGrow: 1, flexBasis: 280, minHeight: 92, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1.5, borderColor: '#EAD9B8', backgroundColor: '#FFFBF3' }}>
          <Text style={{ fontSize: 36, fontWeight: '400', color: accent }}>{t.mark}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '400', color: '#4A1A24' }}>{t.title}</Text>
            <Text style={{ fontSize: 13, color: '#6E4B4F' }}>{t.sub}</Text>
          </View>
          <Text style={{ fontSize: 22, color: accent }}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}
