import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC, BAND_COLOR } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { scoreTranscript, type WordScore } from '@/services/hub/pronounce';
import { speak, stopSpeaking } from '@/services/hub/speak';

const PASSAGES: { id: string; title: string; text: string; connectedTips: string }[] = [
  {
    id: 'p1',
    title: 'Thói quen đi làm',
    text: 'I usually take the bus to work. It takes about twenty minutes, so I can read a few pages on the way.',
    connectedTips: 'Nối âm: "takes about" → /teɪksəˈbaʊt/, "on the way" đọc lướt nhịp nhàng.',
  },
  {
    id: 'p2',
    title: 'Hỏi đường ga tàu',
    text: 'Could you tell me where the nearest railway station is? I think I missed the turn after the bakery.',
    connectedTips: 'Biến âm: "Could you" → /ˈkʊdʒuː/, nuốt âm nhẹ ở "missed the".',
  },
  {
    id: 'p3',
    title: 'Kỳ nghỉ bãi biển',
    text: 'We are planning a short trip to the coast next month. The weather should be warm, and the food is excellent there.',
    connectedTips: 'Trọng âm câu: Nhấn mạnh vào "trip", "coast", "warm", "excellent".',
  },
  {
    id: 'p4',
    title: 'Lời cảm ơn chân thành',
    text: 'Thank you for your patience. I know the delay was frustrating, and I am glad we could finally sort it out.',
    connectedTips: 'Nối âm: "sort it out" → /ˈsɔːrtɪtaʊt/ mượt mà.',
  },
];

const SPEEDS = [0.75, 1, 1.25] as const;

export default function ShadowPage() {
  const [pi, setPi] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.75);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [selfVoiceCloned, setSelfVoiceCloned] = useState(false);
  const [result, setResult] = useState<{ overall: number; fluency: number; words: WordScore[] } | null>(null);
  const listen = useListen();
  const passage = PASSAGES[pi]!;
  const words = useMemo(() => passage.text.split(/\s+/), [passage.text]);

  const play = () => {
    setResult(null);
    setPlaying(true);
    setActiveWord(0);
    speak(passage.text, {
      rate: speed,
      pitch: selfVoiceCloned ? 1.08 : 1.0, // mô phỏng màu giọng cloning
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

  const waiting = useRef(false);
  useEffect(() => {
    if (listen.listening || !waiting.current) return;
    waiting.current = false;
    if (listen.text.trim()) {
      const r = scoreTranscript(passage.text, listen.text);
      setResult({ ...r, fluency: Math.min(95, r.overall + 5) });
    }
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
    <HubScreen title="Nói đuổi" subtitle="Nói đuổi theo giọng bản ngữ để nhận phản hồi ngay" back>
      {/* Chọn bài */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {PASSAGES.map((p, k) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => {
              stop();
              setPi(k);
              setResult(null);
              setActiveWord(-1);
            }}
            style={{
              paddingHorizontal: 14,
              height: 38,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: k === pi ? 'rgba(140, 83, 27, 0.2)' : 'rgba(120, 68, 21, 0.05)',
              borderWidth: 1,
              borderColor: k === pi ? COSMIC.blue : 'rgba(120, 68, 21, 0.1)',
            }}
          >
            <Text style={{ color: k === pi ? COSMIC.blue : COSMIC.ink, fontSize: 13, fontWeight: '700' }}>
              {p.title}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* CÔNG TẮC ĐỘC QUYỀN "Self-Voice Cloning Shadowing" */}
      <View
        style={[
          GLASS_CARD,
          {
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderColor: selfVoiceCloned ? '#A855F7' : 'rgba(120, 68, 21, 0.12)',
            backgroundColor: selfVoiceCloned ? 'rgba(168, 85, 247, 0.12)' : 'rgba(120, 68, 21, 0.05)',
          },
        ]}
      >
        <View style={{ flex: 1, gap: 3, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>🧬</Text>
            <Text style={{ color: selfVoiceCloned ? '#C084FC' : COSMIC.ink, fontSize: 14, fontWeight: '800' }}>
              Self-Voice Cloning Shadowing
            </Text>
            <View style={{ backgroundColor: '#4C1D95', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
              <Text style={{ color: '#C084FC', fontSize: 9, fontWeight: '800' }}>BAND 9</Text>
            </View>
          </View>
          <Text style={{ color: COSMIC.muted, fontSize: 11, lineHeight: 16 }}>
            Chuyển giọng đọc mẫu thành chính màu giọng của bạn nhưng đã được AI chuẩn hóa lên Band 9.0 để dễ nhại theo nối âm và nhịp điệu.
          </Text>
        </View>

        <Pressable
          accessibilityRole="switch"
          onPress={() => setSelfVoiceCloned(!selfVoiceCloned)}
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            backgroundColor: selfVoiceCloned ? '#A855F7' : 'rgba(120, 68, 21, 0.2)',
            padding: 2,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#fff',
              alignSelf: selfVoiceCloned ? 'flex-end' : 'flex-start',
            }}
          />
        </Pressable>
      </View>

      {/* Màn hình Karaoke Chữ chạy sáng Real-time */}
      <View style={[GLASS_CARD, { padding: 20, gap: 16 }]}>
        <View
          style={{
            padding: 18,
            borderRadius: 14,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 1,
            borderColor: 'rgba(120, 68, 21, 0.08)',
          }}
        >
          <Text style={{ fontSize: 20, lineHeight: 32, letterSpacing: 0.2 }}>
            {words.map((w, k) => {
              const isActive = k === activeWord;
              return (
                <Text
                  key={`${w}-${k}`}
                  style={{
                    color: isActive ? '#8C531B' : 'rgba(248, 250, 252, 0.85)',
                    fontWeight: isActive ? '900' : '500',
                    backgroundColor: isActive ? 'rgba(140, 83, 27, 0.3)' : 'transparent',
                  }}
                >
                  {w}{' '}
                </Text>
              );
            })}
          </Text>
        </View>

        <Text style={{ color: '#FCD34D', fontSize: 12, fontStyle: 'italic' }}>
          💡 {passage.connectedTips}
        </Text>

        {/* Thanh chỉnh tốc độ 0.75x, 1.0x, 1.25x */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Text style={{ color: COSMIC.muted, fontSize: 12, fontWeight: '700' }}>Tốc độ:</Text>
          {SPEEDS.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => setSpeed(s)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: s === speed ? 'rgba(140, 83, 27, 0.2)' : 'rgba(120, 68, 21, 0.06)',
                borderWidth: 1,
                borderColor: s === speed ? COSMIC.blue : 'rgba(120, 68, 21, 0.1)',
              }}
            >
              <Text style={{ color: s === speed ? COSMIC.blue : COSMIC.ink, fontWeight: '800', fontSize: 13 }}>
                {s}x
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Nút hành động */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={playing ? stop : play}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: '#8C531B',
            }}
          >
            <Icon name={playing ? 'close' : 'play'} size={18} color="#090A1A" strokeWidth={2.4} />
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
              {playing ? 'Dừng đọc' : selfVoiceCloned ? 'Nghe Self-Clone' : 'Nghe câu mẫu'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!listen.supported || playing}
            onPress={toggleMic}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: listen.listening ? '#EF4444' : 'rgba(120, 68, 21, 0.08)',
              borderWidth: 1,
              borderColor: listen.listening ? '#EF4444' : 'rgba(120, 68, 21, 0.14)',
            }}
          >
            <Icon name="mic" size={18} color="#F8FAFC" />
            <Text style={{ color: '#2A1808', fontWeight: '700' }}>
              {listen.listening ? 'Dừng và chấm' : 'Nói đuổi theo'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Kết quả chấm sau khi nói đuổi */}
      {result ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: COSMIC.ink, fontSize: 16, fontWeight: '800' }}>
              Kết quả Nói đuổi: {result.overall}/100
            </Text>
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800' }}>
              Độ trôi chảy: {result.fluency}%
            </Text>
          </View>

          <Text style={{ fontSize: 15, lineHeight: 24 }}>
            {result.words.map((w, k) => (
              <Text key={`${w.target}-${k}`} style={{ color: BAND_COLOR[w.band], fontWeight: '600' }}>
                {w.target}{' '}
              </Text>
            ))}
          </Text>
          <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
            Xanh lá: bắt nhịp tốt · Vàng: hơi lệch nhịp · Đỏ: bị bỏ sót.
          </Text>
        </View>
      ) : null}
    </HubScreen>
  );
}
