import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { Screen } from '@/components/layout/Screen';
import { HoverGlossText, type WordPick } from '@/components/reader/HoverGloss';
import { WordPopover } from '@/components/reader/WordPopover';
import { Icon } from '@/components/ui';
import { getBilingualStory } from '@/data/bilingual-stories';
import { englishVoice } from '@/services/audio/voice';
import { readingFont, useReadingFonts } from '@/lib/readingFonts';
import { useL } from '@/i18n/useL';

const INK = '#1E2748';
const MUTED = '#68718A';
const GOLD = '#A17C43';
const PANEL = {
  borderWidth: 1,
  borderColor: '#EEE7DB',
  ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(71,54,27,0.06)' } as object) : { elevation: 2 }),
};

export default function BilingualStoryScreen() {
  useReadingFonts();
  const { L } = useL();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const story = getBilingualStory(id ?? '');
  const [wordPick, setWordPick] = React.useState<WordPick | null>(null);
  const [wordParagraph, setWordParagraph] = React.useState<number | null>(null);
  const wordCount = story?.paragraphs.reduce((total, paragraph) => total + paragraph.en.trim().split(/\s+/).length, 0) ?? 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  useEffect(() => () => { Speech.stop(); }, []);

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-GB', rate: 0.88, voice: englishVoice() });
  };

  if (!story) {
    return (
      <Screen>
        <Text className="font-heavy" style={{ color: INK, fontSize: 22 }}>{L('Không tìm thấy truyện', 'Story not found')}</Text>
        <Pressable onPress={() => router.replace('/bilingual/books' as never)} className="mt-4 self-start rounded-pill px-4 py-3" style={{ backgroundColor: GOLD }}>
          <Text className="font-heavy" style={{ color: '#FFFFFF' }}>{L('Về kệ sách', 'Back to library')}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.back()} className="mb-3 self-start flex-row items-center gap-1.5 py-1">
        <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.2} />
        <Text className="font-semi" style={{ color: INK, fontSize: 14 }}>{L('Kệ sách', 'Bookshelf')}</Text>
      </Pressable>

      <View className="rounded-[22px] bg-white p-5" style={PANEL}>
        <Text className="font-heavy" style={{ color: GOLD, fontSize: 11, letterSpacing: 1.3 }}>{L(`TRUYỆN SONG NGỮ NGUYÊN BẢN · ${story.level}`, `BAND 9 ORIGINAL BILINGUAL STORY · ${story.level}`)}</Text>
        <Text className="mt-2 font-heavy" style={{ color: INK, fontSize: 27, lineHeight: 35 }}>{story.titleEn}</Text>
        <Text className="mt-1 font-semi" style={{ color: GOLD, fontSize: 16 }}>{story.titleVi}</Text>
        <Text className="mt-3 font-sans" style={{ color: MUTED, fontSize: 14, lineHeight: 21 }}>{story.summaryVi}</Text>
        <Text className="mt-3 font-mid" style={{ color: MUTED, fontSize: 12 }}>{wordCount} {L('từ tiếng Anh', 'English words')} · {story.paragraphs.length} {L('đoạn đối chiếu', 'paired passages')} · {readingMinutes} {L('phút đọc', 'min read')}</Text>
      </View>

      <View className="mt-4 gap-3">
        {story.paragraphs.map((paragraph, index) => (
          <View key={index} className="flex-row flex-wrap gap-3 rounded-[22px] bg-white p-5" style={PANEL}>
            <View style={{ flex: 1, minWidth: 280 }}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-heavy" style={{ color: GOLD, fontSize: 11, letterSpacing: 1.1 }}>ENGLISH · {String(index + 1).padStart(2, '0')}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={L('Nghe đoạn tiếng Anh', 'Listen to English paragraph')} onPress={() => speak(paragraph.en)} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#F8F1E4' }}>
                  <Icon name="volume" size={17} color={GOLD} strokeWidth={1.9} />
                </Pressable>
              </View>
              <HoverGlossText text={paragraph.en} fontFamily={readingFont.body} fontSize={17} lineHeight={29} color={INK} onWordPress={(pick) => { setWordPick(pick); setWordParagraph(index); }} />
            </View>
            <View style={{ flex: 1, minWidth: 280, borderLeftWidth: Platform.OS === 'web' ? 1 : 0, borderColor: '#F0EAE0', paddingLeft: Platform.OS === 'web' ? 16 : 0 }}>
              <Text className="mb-2 font-heavy" style={{ color: GOLD, fontSize: 11, letterSpacing: 1.1 }}>TIẾNG VIỆT · {String(index + 1).padStart(2, '0')}</Text>
              <Text style={{ color: INK, fontFamily: readingFont.body, fontSize: 17, lineHeight: 29 }}>{paragraph.vi}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text className="mt-4 font-sans" style={{ color: MUTED, fontSize: 12, lineHeight: 18 }}>
        {L('Đọc liền mạch theo từng cặp đoạn Anh–Việt. Di chuột hoặc chạm vào từ tiếng Anh để xem nghĩa; bấm biểu tượng loa để nghe đoạn đang đọc.', 'Read each English passage alongside its Vietnamese pair. Hover or tap an English word for its meaning, or use the speaker button to listen.')}
      </Text>
      <WordPopover pick={wordPick} table={{}} articleId={`story:${story.id}`} articleTitle={story.titleEn} paragraphIndex={wordParagraph} onClose={() => { setWordPick(null); setWordParagraph(null); }} />
    </Screen>
  );
}
