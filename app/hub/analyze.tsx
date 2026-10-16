import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, BAND_COLOR, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { intonationScore, intonationStats, pitchTrack } from '@/services/hub/pitch';
import { buildVoiceReport, type VoiceReport } from '@/services/hub/voice-report';

const LABEL: Record<string, string> = {
  pronunciation: 'Phát âm',
  intonation: 'Ngữ điệu',
  fluency: 'Độ lưu loát',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
  coherence: 'Mạch lạc',
};

/** Ghi âm tự do rồi xem báo cáo: chữ, nhịp nói và ngữ điệu đo từ âm thanh micro. */
export default function AnalyzePage() {
  const listen = useListen();
  const audio = useMicAudio();
  const [seconds, setSeconds] = useState(0);
  const [report, setReport] = useState<VoiceReport | null>(null);
  const durationRef = useRef(0);
  const pitchRef = useRef<{ score: number | null; note: string } | null>(null);
  const wasListening = useRef(false);

  // Đồng hồ hiển thị khi đang ghi.
  useEffect(() => {
    if (!listen.listening) return;
    const t = setInterval(() => setSeconds(Math.round(listen.elapsed() / 1000)), 500);
    return () => clearInterval(t);
  }, [listen.listening, listen.elapsed]);

  // Khi micro vừa dừng hẳn và có chữ, dựng báo cáo.
  useEffect(() => {
    if (wasListening.current && !listen.listening && listen.text.trim()) {
      setReport(
        buildVoiceReport({
          transcript: listen.text,
          segments: listen.segments,
          eventTimes: listen.times,
          durationMs: durationRef.current,
          intonation: pitchRef.current ?? undefined,
        }),
      );
    }
    wasListening.current = listen.listening;
  }, [listen.listening, listen.text, listen.segments, listen.times]);

  const toggle = async () => {
    if (listen.listening) {
      durationRef.current = listen.elapsed();
      // Dừng âm thanh trước để có cao độ sẵn khi báo cáo được dựng.
      const { samples, sampleRate } = await audio.stop();
      const track = pitchTrack(samples, sampleRate);
      const stats = intonationStats(track);
      const score = intonationScore(stats);
      pitchRef.current = {
        score,
        note: score === null
          ? 'Chưa đủ giọng để đo ngữ điệu. Nói to và rõ hơn.'
          : `Độ rộng cao độ ${stats.rangeSt?.toFixed(1)} nửa cung, ${Math.round(stats.voicedRatio * 100)}% khung có giọng.`,
      };
      listen.stop();
      return;
    }
    setReport(null);
    setSeconds(0);
    pitchRef.current = null;
    await audio.start();
    listen.start();
  };

  return (
    <HubScreen title="Phân tích giọng nói" subtitle="Nói tự do trong 1–2 phút, rồi xem bạn nghe thế nào." back>
      <View style={[GLASS_CARD, { padding: 16, gap: 12, alignItems: 'center' }]}>
        <Text style={{ color: HUB.ink, fontSize: 30, fontWeight: '800' }}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</Text>
        {!listen.supported ? (
          <Text style={{ color: HUB.amber, fontSize: 13, textAlign: 'center' }}>Trình duyệt này không có bộ nhận giọng. Mở bằng Chrome trên máy tính hoặc Android.</Text>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={listen.listening ? 'Dừng và phân tích' : 'Bắt đầu ghi'} onPress={() => void toggle()} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: listen.listening ? HUB.red : HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{listen.listening ? 'Dừng' : 'Ghi'}</Text>
          </Pressable>
        )}
        {listen.listening ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Đang nghe…</Text> : null}
        {listen.text && listen.listening ? <Text style={{ color: HUB.body, fontSize: 13, textAlign: 'center' }}>{listen.text}</Text> : null}
      </View>

      {report ? <ReportView report={report} /> : null}
    </HubScreen>
  );
}

function ReportView({ report }: { report: VoiceReport }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Điểm tổng {report.overall ?? '—'}/100</Text>
        <Text style={{ color: HUB.body, fontSize: 13 }}>
          {report.estimatedBand !== null ? `Ước lượng band Speaking ${report.estimatedBand.toFixed(1)} (chỉ là ước lượng từ các chiều đo được).` : 'Chưa đủ dữ liệu để ước lượng band.'}
        </Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{report.wordCount} từ · {report.wpm ?? '—'} từ/phút · {report.pauses.count} lần ngập ngừng</Text>
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Sáu chiều</Text>
        {report.dimensions.map((d) => (
          <View key={d.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>{LABEL[d.key]}</Text>
              <Text style={{ color: d.score === null ? HUB.muted : HUB.ink, fontSize: 13, fontWeight: '800' }}>{d.score === null ? 'chưa chấm' : `${d.score}`}</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: HUB.glassStrong, overflow: 'hidden' }}>
              {d.score !== null ? <View style={{ width: `${d.score}%`, height: 8, borderRadius: 4, backgroundColor: d.score >= 70 ? HUB.green : d.score >= 50 ? HUB.amber : HUB.red }} /> : null}
            </View>
            <Text style={{ color: HUB.muted, fontSize: 11 }}>{d.note}</Text>
          </View>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Bản ghi</Text>
        <Text style={{ fontSize: 15, lineHeight: 24 }}>
          {report.segments.map((s, i) => (
            <Text key={`${i}-${s.text}`} style={{ color: s.level === 'unknown' ? HUB.body : BAND_COLOR[s.level] }}>
              {s.text}{' '}
            </Text>
          ))}
        </Text>
        <Text style={{ color: HUB.muted, fontSize: 11 }}>Màu theo độ tin cậy của máy nghe: xanh chắc, vàng khá, đỏ chưa chắc.</Text>
      </View>

      {report.repeated.length > 0 ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Từ lặp nhiều</Text>
          <Text style={{ color: HUB.body, fontSize: 13 }}>{report.repeated.map((r) => `${r.word} (${r.count})`).join(' · ')}</Text>
        </View>
      ) : null}
    </View>
  );
}
