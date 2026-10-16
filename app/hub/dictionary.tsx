import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, BAND_COLOR, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { dictionarySize, lookupWord, type WordInfo } from '@/services/hub/content';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { speak } from '@/services/hub/speak';

/**
 * Từ điển của khu luyện nói: tra phiên âm, nghĩa và câu ví dụ từ kho của app, nghe
 * phát âm mẫu, rồi đọc thử để được chấm theo chữ. Chưa có tra bằng ảnh chụp sách.
 */
export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [hit, setHit] = useState<WordInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<{ overall: number; words: WordScore[] } | null>(null);
  const listen = useListen();

  const search = () => {
    const q = query.trim();
    if (!q) return;
    setSearched(true);
    setResult(null);
    setHit(lookupWord(q));
  };

  // Khi micro vừa dừng, chấm từ đang tra bằng chữ cuối cùng máy nghe được.
  const waiting = useRef(false);
  useEffect(() => {
    if (listen.listening || !waiting.current) return;
    waiting.current = false;
    if (hit && listen.text.trim()) setResult(scoreTranscript(hit.word, listen.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const toggleMic = () => {
    if (listen.listening) {
      waiting.current = true;
      listen.stop();
      return;
    }
    setResult(null);
    listen.start();
  };

  return (
    <HubScreen title="Từ điển" subtitle={`Tra từ hoặc cụm từ · ${dictionarySize()} từ có phiên âm`} back>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Nhập một từ, ví dụ: menu"
          placeholderTextColor={HUB.muted}
          autoCapitalize="none"
          accessibilityLabel="Từ cần tra"
          style={{ flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Tra từ" onPress={search} style={{ width: 52, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
          <Icon name="search" size={18} color="#fff" />
        </Pressable>
      </View>

      {searched && !hit ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 6 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>Chưa có từ này trong kho</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>Thử một từ khác, hoặc tìm trong các chủ đề từ vựng của app.</Text>
        </View>
      ) : null}

      {hit ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '800' }}>{hit.word}</Text>
            <Text style={{ color: HUB.muted, fontSize: 14 }}>{hit.ipa}</Text>
            <Text style={{ color: HUB.violet, fontSize: 12, fontWeight: '700' }}>{hit.pos}</Text>
          </View>
          <Text style={{ color: HUB.body, fontSize: 15 }}>{hit.meaningVi}</Text>
          {hit.example ? <Text style={{ color: HUB.muted, fontSize: 13, lineHeight: 19 }}>“{hit.example}”</Text> : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Nghe phát âm" onPress={() => speak(hit.word)} style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
              <Icon name="volume" size={18} color={HUB.blue} />
              <Text style={{ color: HUB.ink, fontWeight: '700' }}>Nghe</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={listen.listening ? 'Dừng và chấm' : 'Đọc thử'} disabled={!listen.supported} onPress={toggleMic} style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: listen.listening ? HUB.red : HUB.blue, opacity: listen.supported ? 1 : 0.5 }}>
              <Icon name="mic" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>{listen.listening ? 'Dừng' : 'Đọc thử'}</Text>
            </Pressable>
          </View>
          {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12 }}>Chấm giọng cần Chrome trên máy tính hoặc Android.</Text> : null}
          {result ? (
            <Text style={{ fontSize: 16 }}>
              {result.words.map((w, k) => (
                <Text key={`${w.target}-${k}`} style={{ color: BAND_COLOR[w.band], fontWeight: '800' }}>{w.target} ({w.score}) </Text>
              ))}
            </Text>
          ) : null}
        </View>
      ) : null}
    </HubScreen>
  );
}
