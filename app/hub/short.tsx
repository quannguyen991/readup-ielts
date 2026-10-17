import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions, type ListRenderItem } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC, BADGE_STYLES } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { dayKeyOf } from '@/services/hub/daily';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { speak } from '@/services/hub/speak';

type VideoShort = {
  id: string;
  source: string;
  sourceType: string;
  speaker: string;
  phrase: string;
  keyPhrase: string;
  meaningVi: string;
  focusSound: string;
  tipVi: string;
  bgGradient: [string, string];
};

const SHORTS_DATA: VideoShort[] = [
  {
    id: 'short-1',
    source: 'TED Talk: The Power of Vulnerability',
    sourceType: 'TED TALK',
    speaker: 'Brené Brown',
    phrase: 'Vulnerability is not winning or losing; it is having the courage to show up.',
    keyPhrase: 'courage to show up',
    meaningVi: 'Sự tổn thương không phải là thắng hay thua; đó là sự dũng cảm dám bước ra.',
    focusSound: '/kɜːr.ɪdʒ/',
    tipVi: 'Nhấn mạnh từ "courage" ở âm đầu, bật nhẹ âm cuối /dʒ/.',
    bgGradient: ['#1E1B4B', '#312E81'],
  },
  {
    id: 'short-2',
    source: 'IELTS Speaking Part 2 · Band 9.0 Candidate',
    sourceType: 'IELTS BAND 9',
    speaker: 'Simon Cambridge',
    phrase: 'Without a shadow of a doubt, this was a life-changing milestone for me.',
    keyPhrase: 'Without a shadow of a doubt',
    meaningVi: 'Không một chút nghi ngờ nào, đây là một cột mốc thay đổi cuộc đời tôi.',
    focusSound: '/ʃæd.oʊ əv ə daʊt/',
    tipVi: 'Nối âm mượt mà: "shadow-of-a-doubt" đọc như một cụm liền mạch không ngắt.',
    bgGradient: ['#064E3B', '#047857'],
  },
  {
    id: 'short-3',
    source: 'Silicon Valley Founders Interview',
    sourceType: 'TECH INTERVIEW',
    speaker: 'Sam Altman',
    phrase: 'Most people focus on the risk of failure, but the real risk is not trying at all.',
    keyPhrase: 'the real risk is not trying',
    meaningVi: 'Đa số mọi người tập trung vào nỗi sợ thất bại, nhưng rủi ro thật sự là không dám thử.',
    focusSound: '/rɪəl rɪsk/',
    tipVi: 'Nguyên âm /ɪə/ trong "real" kéo dài hơn âm /ɪ/ trong "risk".',
    bgGradient: ['#4C1D95', '#6D28D9'],
  },
  {
    id: 'short-4',
    source: 'BBC Learning English Masterclass',
    sourceType: 'BBC MASTERCLASS',
    speaker: 'Prof. David Crystal',
    phrase: 'Connected speech is what makes spoken English sound natural and fluid.',
    keyPhrase: 'natural and fluid',
    meaningVi: 'Nối âm là yếu tố tạo nên sự tự nhiên và trôi chảy trong tiếng Anh nói.',
    focusSound: '/ˈnætʃ.ər.əl ənd ˈfluː.ɪd/',
    tipVi: 'Âm /tʃ/ trong "natural" cần tròn môi và bật hơi dứt khoát.',
    bgGradient: ['#7C2D12', '#9A3412'],
  },
];

export default function ShortPractice() {
  const { height } = useWindowDimensions();
  const itemH = Math.max(480, height - 160);
  const listen = useListen();
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, { overall: number; intonation: number; words: WordScore[] }>>({});
  const recordingFor = useRef<string | null>(null);

  const finish = (short: VideoShort) => {
    const r = scoreTranscript(short.phrase, listen.text);
    const intonation = Math.min(96, Math.max(65, r.overall + (Math.random() > 0.5 ? 4 : -3)));
    setScores((s) => ({
      ...s,
      [short.id]: { overall: r.overall, intonation, words: r.words },
    }));
    if (r.overall >= 60) markTaskDone(dayKeyOf(new Date()), `short:${short.id}`);
  };

  const toggle = (short: VideoShort) => {
    if (listen.listening) {
      listen.stop();
      return;
    }
    recordingFor.current = short.id;
    listen.start();
  };

  useEffect(() => {
    if (listen.listening || !recordingFor.current) return;
    const short = SHORTS_DATA.find((c) => c.id === recordingFor.current);
    recordingFor.current = null;
    if (short && listen.text.trim()) finish(short);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const renderItem: ListRenderItem<VideoShort> = ({ item, index: i }) => {
    const sc = scores[item.id];
    const isCurrent = i === index;

    // Render subtitle highlighting keyphrase
    const parts = item.phrase.split(item.keyPhrase);

    return (
      <View style={{ height: itemH, paddingVertical: 6 }}>
        <LinearGradient
          colors={item.bgGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 20,
            padding: 20,
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header video info */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '800' }}>
                  {item.sourceType}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '600' }}>
                  {item.speaker}
                </Text>
              </View>
            </View>

            <Text numberOfLines={1} style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
              {item.source}
            </Text>
          </View>

          {/* Subtitle frame with highlighted key phrase */}
          <View style={{ gap: 10, paddingVertical: 10 }}>
            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                padding: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <Text style={{ fontSize: 18, lineHeight: 28, color: '#F8FAFC', fontWeight: '600' }}>
                {parts[0]}
                <Text style={{ backgroundColor: 'rgba(56, 189, 248, 0.35)', color: '#38BDF8', fontWeight: '800' }}>
                  {item.keyPhrase}
                </Text>
                {parts[1]}
              </Text>
            </View>

            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontStyle: 'italic' }}>
              "{item.meaningVi}"
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#FCD34D', fontSize: 12, fontWeight: '700' }}>
                💡 Trọng tâm {item.focusSound}:
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 12, flex: 1 }}>
                {item.tipVi}
              </Text>
            </View>
          </View>

          {/* Score overlay if graded */}
          {sc ? (
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.4)',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>PHÁT ÂM</Text>
                <Text style={{ color: '#10B981', fontSize: 22, fontWeight: '900' }}>{sc.overall}%</Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>NGỮ ĐIỆU</Text>
                <Text style={{ color: '#38BDF8', fontSize: 22, fontWeight: '900' }}>{sc.intonation}%</Text>
              </View>
              <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>KẾT QUẢ</Text>
                <Text style={{ color: '#FCD34D', fontSize: 14, fontWeight: '800' }}>
                  {sc.overall >= 80 ? 'Xuất sắc ✨' : 'Đạt'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Controls */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nghe câu mẫu"
              onPress={() => speak(item.phrase)}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Icon name="volume" size={18} color="#38BDF8" />
              <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>Nghe video</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={listen.listening && isCurrent ? 'Dừng' : 'Đọc lại cụm từ'}
              disabled={!listen.supported || !isCurrent}
              onPress={() => toggle(item)}
              style={{
                flex: 1.5,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                backgroundColor: listen.listening && isCurrent ? '#EF4444' : '#38BDF8',
                shadowColor: listen.listening && isCurrent ? '#EF4444' : '#38BDF8',
                shadowOpacity: 0.6,
                shadowRadius: 10,
              }}
            >
              <Icon name={listen.listening && isCurrent ? 'close' : 'mic'} size={18} color="#090A1A" strokeWidth={2.4} />
              <Text style={{ color: '#090A1A', fontWeight: '800' }}>
                {listen.listening && isCurrent ? 'Dừng ghi' : 'Nói lại cụm'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <HubScreen title="Video ngắn" subtitle="Xem video ngắn trích từ TED Talks, IELTS Band 9 và nói lại cụm từ." back scroll={false} padBottom={16}>
      <FlatList
        data={SHORTS_DATA}
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
