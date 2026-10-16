import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, BAND_COLOR, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { speak, stopSpeaking } from '@/services/hub/speak';

const PASSAGES: { id: string; text: string }[] = [
  { id: 'p1', text: 'I usually take the bus to work. It takes about twenty minutes, so I can read a few pages on the way.' },
  { id: 'p2', text: 'Could you tell me where the nearest station is? I think I missed the turn after the bakery.' },
  { id: 'p3', text: 'We are planning a short trip to the coast next month. The weather should be warm, and the food is excellent there.' },
  { id: 'p4', text: 'Thank you for your patience. I know the delay was frustrating, and I am glad we could finally sort it out.' },
];

const SPEEDS = [0.75, 1, 1.25] as const;

/** Đọc theo câu mẫu: chữ chạy theo giọng đọc, chỉnh được tốc độ, rồi nói lại để chấm. */
export default function ShadowPage() {
  const [pi, setPi] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.75);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ overall: number; words: WordScore[] } | null>(null);
  const listen = useListen();
  const passage = PASSAGES[pi]!;
  const words = useMemo(() => passage.text.split(/\s+/), [passage.text]);

  const play = () => {
    setResult(null);
    setPlaying(true);
    setActiveWord(0);
    // Đổi vị trí ký tự của giọng đọc thành chỉ số từ.
    speak(passage.text, {
      rate: speed,
      onWord: (charIndex) => {
        const before = passage.text.slice(0, charIndex);
        setActiveWord(before.split(/\s+/).filter(Boolean).length);
      },
      onDone: () => {
        setPlaying(false);
        setActiveWord(-1);
      },
    });
  };

  const stop = () => {
    stopSpeaking();
    setPlaying(false);
    setActiveWord(-1);
  };

  // Khi micro vừa dừng, chấm câu đọc theo (dùng chữ cuối cùng máy đã nghe được).
  const waiting = useRef(false);
  useEffect(() => {
    if (listen.listening || !waiting.current) return;
    waiting.current = false;
    if (listen.text.trim()) setResult(scoreTranscript(passage.text, listen.text));
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
    <HubScreen title="Nói đuổi" subtitle="Nghe câu mẫu, đọc theo chữ đang chạy" back>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {PASSAGES.map((p, k) => (
          <Pressable key={p.id} accessibilityRole="button" onPress={() => { stop(); setPi(k); setResult(null); setActiveWord(-1); }} style={{ paddingHorizontal: 12, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: k === pi ? HUB.blue : HUB.glassStrong, borderWidth: 1, borderColor: k === pi ? HUB.blue : HUB.line }}>
            <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>Bài {k + 1}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 18, gap: 16 }]}>
        <Text style={{ fontSize: 19, lineHeight: 30 }}>
          {words.map((w, k) => (
            <Text key={`${w}-${k}`} style={{ color: k === activeWord ? HUB.amber : HUB.ink, fontWeight: k === activeWord ? '800' : '500' }}>
              {w}{' '}
            </Text>
          ))}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SPEEDS.map((s) => (
            <Pressable key={s} accessibilityRole="button" onPress={() => setSpeed(s)} style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: s === speed ? HUB.violet : HUB.glassStrong }}>
              <Text style={{ color: HUB.ink, fontWeight: '700' }}>{s}x</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Dừng' : 'Nghe câu mẫu'} onPress={playing ? stop : play} style={{ flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: HUB.blue }}>
            <Icon name={playing ? 'close' : 'play'} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800' }}>{playing ? 'Dừng' : 'Nghe câu mẫu'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listen.listening ? 'Dừng và chấm' : 'Đọc theo'}
            disabled={!listen.supported || playing}
            onPress={toggleMic}
            style={{ flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: listen.listening ? HUB.red : HUB.glassStrong, borderWidth: 1, borderColor: HUB.line, opacity: listen.supported ? 1 : 0.5 }}
          >
            <Icon name="mic" size={18} color={HUB.ink} />
            <Text style={{ color: HUB.ink, fontWeight: '700' }}>{listen.listening ? 'Dừng và chấm' : 'Đọc theo'}</Text>
          </Pressable>
        </View>
        {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12 }}>Chấm giọng cần Chrome trên máy tính hoặc Android.</Text> : null}
      </View>

      {result ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
          <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Điểm {result.overall}/100</Text>
          <Text style={{ fontSize: 15, lineHeight: 24 }}>
            {result.words.map((w, k) => (
              <Text key={`${w.target}-${k}`} style={{ color: BAND_COLOR[w.band] }}>{w.target} </Text>
            ))}
          </Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>Từ xanh khớp tốt, vàng khá, đỏ chưa khớp. Chấm theo chữ máy nghe được.</Text>
        </View>
      ) : null}
    </HubScreen>
  );
}
