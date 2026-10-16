import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions, type ListRenderItem } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, BAND_COLOR, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { dayKeyOf } from '@/services/hub/daily';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { CLIPS, type Clip } from '@/services/hub/content';
import { speak } from '@/services/hub/speak';

/**
 * Luyện nói bằng các câu ngắn, lướt dọc như video. Chưa có video: mỗi câu là một
 * thẻ chữ có mẹo phát âm, nghe giọng trình duyệt đọc mẫu, rồi nói theo để chấm.
 */
export default function ShortPractice() {
  const { height } = useWindowDimensions();
  const itemH = Math.max(420, height - 170);
  const listen = useListen();
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, { overall: number; words: WordScore[] }>>({});
  const recordingFor = useRef<string | null>(null);
  const data = useMemo(() => CLIPS, []);

  const finish = (clip: Clip) => {
    const r = scoreTranscript(clip.phrase, listen.text);
    setScores((s) => ({ ...s, [clip.id]: { overall: r.overall, words: r.words } }));
    if (r.overall >= 60) markTaskDone(dayKeyOf(new Date()), `short:${clip.id}`);
  };

  const toggle = (clip: Clip) => {
    if (listen.listening) {
      listen.stop();
      return;
    }
    recordingFor.current = clip.id;
    listen.start();
  };

  // Khi micro vừa dừng, chấm câu đang được đọc.
  useEffect(() => {
    if (listen.listening || !recordingFor.current) return;
    const clip = data.find((c) => c.id === recordingFor.current);
    recordingFor.current = null;
    if (clip && listen.text.trim()) finish(clip);
    // finish đọc listen.text hiện tại; chỉ cần chạy khi micro dừng hoặc chữ đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const renderItem: ListRenderItem<Clip> = ({ item, index: i }) => {
    const sc = scores[item.id];
    const isCurrent = i === index;
    return (
      <View style={{ height: itemH, paddingVertical: 8 }}>
        <View style={[GLASS_CARD, { flex: 1, padding: 18, justifyContent: 'space-between' }]}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>{item.context} · trọng tâm /{item.focus}/</Text>
            <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '800', lineHeight: 32 }}>{item.phrase}</Text>
            <Text style={{ color: HUB.body, fontSize: 14 }}>{item.meaning}</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ color: HUB.amber, fontSize: 13, lineHeight: 19 }}>Mẹo: {item.tipVi}</Text>
          </View>
          {sc ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Điểm {sc.overall}/100</Text>
              <Text style={{ fontSize: 14, lineHeight: 22 }}>
                {sc.words.map((w, k) => (
                  <Text key={`${w.target}-${k}`} style={{ color: BAND_COLOR[w.band] }}>{w.target} </Text>
                ))}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Nghe mẫu" onPress={() => speak(item.phrase)} style={{ flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
              <Icon name="volume" size={18} color={HUB.blue} />
              <Text style={{ color: HUB.ink, fontWeight: '700' }}>Nghe mẫu</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={listen.listening && isCurrent ? 'Dừng' : 'Nói theo'}
              disabled={!listen.supported || !isCurrent}
              onPress={() => toggle(item)}
              style={{ flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: listen.listening && isCurrent ? HUB.red : HUB.blue, opacity: isCurrent ? 1 : 0.5 }}
            >
              <Icon name="mic" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>{listen.listening && isCurrent ? 'Dừng' : 'Nói theo'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <HubScreen title="Video ngắn" subtitle="Lướt lên xuống, nghe mẫu rồi nói theo" back scroll={false} padBottom={8}>
      {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12, marginBottom: 6 }}>Chấm giọng cần Chrome trên máy tính hoặc Android.</Text> : null}
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={itemH}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: itemH, offset: itemH * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.y / itemH))}
        style={{ flex: 1 }}
      />
    </HubScreen>
  );
}
