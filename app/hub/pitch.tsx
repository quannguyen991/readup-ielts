import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { intonationScore, intonationStats, pitchTrack, semitones, type PitchPoint } from '@/services/hub/pitch';
import { speak } from '@/services/hub/speak';

/** Câu luyện ngữ điệu: câu hỏi Yes/No lên giọng, câu kể và câu hỏi wh- xuống giọng. */
const SENTENCES: { text: string; expect: 'rising' | 'falling'; why: string }[] = [
  { text: 'Are you coming to the meeting tonight?', expect: 'rising', why: 'Câu hỏi Yes/No thường lên giọng ở cuối.' },
  { text: 'Where is the nearest station?', expect: 'falling', why: 'Câu hỏi wh- thường xuống giọng ở cuối.' },
  { text: 'I really enjoyed the trip to Da Nang.', expect: 'falling', why: 'Câu kể xuống giọng ở cuối.' },
  { text: 'Would you like some more tea?', expect: 'rising', why: 'Lời mời Yes/No lên giọng.' },
  { text: 'Thank you for waiting.', expect: 'falling', why: 'Lời cảm ơn xuống giọng, nghe chắc chắn.' },
];

export default function PitchPage() {
  const audio = useMicAudio();
  const [i, setI] = useState(0);
  const [recording, setRecording] = useState(false);
  const [track, setTrack] = useState<PitchPoint[] | null>(null);
  const [supported, setSupported] = useState(true);

  const sentence = SENTENCES[i % SENTENCES.length]!;
  const stats = track ? intonationStats(track) : null;
  const score = stats ? intonationScore(stats) : null;
  const matched = stats?.finalDirection === sentence.expect;

  const toggle = async () => {
    if (recording) {
      const { samples, sampleRate } = await audio.stop();
      setRecording(false);
      setTrack(pitchTrack(samples, sampleRate));
      return;
    }
    const ok = await audio.start();
    if (!ok) {
      setSupported(false);
      return;
    }
    setTrack(null);
    setRecording(true);
  };

  // Vẽ đường cao độ bằng các cột: chiều cao theo nửa cung trong khoảng của chính câu nói.
  const voiced = track?.filter((p) => p.hz !== null) ?? [];
  const sts = voiced.map((p) => semitones(p.hz!));
  const lo = sts.length ? Math.min(...sts) : 0;
  const hi = sts.length ? Math.max(...sts) : 1;
  const span = Math.max(1, hi - lo);
  const bars = track ? track.filter((_, k) => k % 2 === 0) : [];

  return (
    <HubScreen title="Điều chỉnh giọng nói" subtitle="Nghe mẫu, đọc theo, rồi xem đường lên xuống của giọng bạn" back>
      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800', lineHeight: 26 }}>{sentence.text}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{sentence.why}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable accessibilityRole="button" onPress={() => speak(sentence.text)} style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontWeight: '700' }}>Nghe mẫu</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!supported} onPress={() => void toggle()} style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: recording ? HUB.red : HUB.blue, opacity: supported ? 1 : 0.5 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{recording ? 'Dừng' : 'Đọc theo'}</Text>
          </Pressable>
        </View>
        {!supported ? <Text style={{ color: HUB.amber, fontSize: 12 }}>Không mở được micro. Cho phép micro cho trang này rồi thử lại.</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => { setI((n) => n + 1); setTrack(null); }} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ color: HUB.blue, fontSize: 13, fontWeight: '700' }}>Câu khác →</Text>
        </Pressable>
      </View>

      {track ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Đường cao độ của bạn</Text>
          {voiced.length < 8 ? (
            <Text style={{ color: HUB.amber, fontSize: 13 }}>Chưa đủ giọng để vẽ. Nói to và rõ hơn rồi thử lại.</Text>
          ) : (
            <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
              {bars.map((p, k) => {
                const h = p.hz === null ? 4 : 10 + ((semitones(p.hz) - lo) / span) * 100;
                return <View key={k} style={{ flex: 1, height: h, borderRadius: 2, backgroundColor: p.hz === null ? HUB.glassStrong : HUB.blue }} />;
              })}
            </View>
          )}
          <Text style={{ color: matched ? HUB.green : HUB.amber, fontSize: 14, fontWeight: '700' }}>
            {stats?.finalDirection === null
              ? 'Chưa nghe rõ cuối câu.'
              : matched
                ? `Đúng hướng: cuối câu ${stats?.finalDirection === 'rising' ? 'lên' : 'xuống'} giọng như mẫu.`
                : `Cuối câu của bạn ${stats?.finalDirection === 'rising' ? 'lên' : stats?.finalDirection === 'falling' ? 'xuống' : 'bằng'}, còn mẫu là ${sentence.expect === 'rising' ? 'lên' : 'xuống'}.`}
          </Text>
          {score !== null ? <Text style={{ color: HUB.body, fontSize: 13 }}>Điểm độ rộng ngữ điệu: {score}/100 (độ rộng tự nhiên là 5–12 nửa cung).</Text> : null}
        </View>
      ) : null}
    </HubScreen>
  );
}
