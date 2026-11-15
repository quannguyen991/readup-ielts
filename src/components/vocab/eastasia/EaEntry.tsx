import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { eaLevels, type EaLang } from '@/data/learning-path/east-asian';
import { useL } from '@/i18n/useL';
import { useEaStore } from '@/store/useEaStore';

import { EA_FONT, useSkinFont } from './EaParts';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import { skinById } from './skins';

/** Hai thẻ lối vào "Lộ trình HSK" / "Lộ trình JLPT", dùng tranh của skin người học đang chọn. */
export function EaEntryBanners() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
      <EntryCard lang="zh" />
      <EntryCard lang="ja" />
    </View>
  );
}

function EntryCard({ lang }: { lang: EaLang }) {
  const { L } = useL();
  const skin = skinById(useEaStore((s) => s.skin[lang]), lang);
  useSkinFont(skin);
  const levels = eaLevels(lang);
  const words = levels.reduce((n, l) => n + l.words, 0);
  const motif = lang === 'zh' ? ZH_MOTIF.phoenix : JA_MOTIF.craneFly;
  const c = skin.c;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={lang === 'zh' ? L('Lộ trình HSK 1 đến 6', 'HSK 1 to 6 roadmap') : L('Lộ trình JLPT N5 đến N1', 'JLPT N5 to N1 roadmap')}
      onPress={() => router.push(`/vocabulary/lo-trinh/${lang}` as never)}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: 320, height: 150, borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: c.accent, opacity: pressed ? 0.9 : 1 })}
    >
      <Image source={skin.thumb} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <LinearGradient colors={c.wash} locations={[0, 0.5, 0.95]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22, gap: 4, maxWidth: '68%' }}>
        <Text style={{color: c.accent, fontSize: 12, letterSpacing: 2, fontFamily: EA_FONT.heavy}}>{lang === 'zh' ? L('TIẾNG TRUNG', 'CHINESE') : L('TIẾNG NHẬT', 'JAPANESE')}</Text>
        <Text style={{color: c.ink, fontSize: 26, fontFamily: EA_FONT.heavy}}>{lang === 'zh' ? L('Lộ trình HSK 1–6', 'HSK 1–6 roadmap') : L('Lộ trình JLPT N5–N1', 'JLPT N5–N1 roadmap')}</Text>
        <Text style={{color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body}}>{`${words.toLocaleString('vi-VN')} ${L('từ', 'words')} · ${levels.length} ${L('cấp', 'levels')}`}</Text>
      </View>
      <Image source={motif} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 8, top: 6, width: 120, height: 120 }} />
    </Pressable>
  );
}
