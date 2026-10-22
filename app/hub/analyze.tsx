import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC, BADGE_STYLES } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { Icon } from '@/components/ui/Icon';
import { intonationScore, intonationStats, pitchTrack } from '@/services/hub/pitch';
import { buildVoiceReport, type DimensionScore, type VoiceReport } from '@/services/hub/voice-report';

type TopicPrompt = {
  id: string;
  part: string;
  topic: string;
  question: string;
};

const IELTS_PROMPTS: TopicPrompt[] = [
  { id: 'p1-weather', part: 'Part 1', topic: 'Weather', question: 'What kind of weather do you like best, and why?' },
  { id: 'p1-work', part: 'Part 1', topic: 'Studies & Work', question: 'Do you prefer working alone or in a team?' },
  { id: 'p2-teacher', part: 'Part 2', topic: 'An Influential Teacher', question: 'Describe a teacher who had a positive impact on your education.' },
  { id: 'p3-education', part: 'Part 3', topic: 'Future of Education', question: 'How will artificial intelligence transform classroom learning in the next decade?' },
];

const DIM_LABEL: Record<DimensionScore['key'], { vi: string; en: string }> = {
  pronunciation: { vi: 'Phát âm', en: 'Pronunciation' },
  intonation: { vi: 'Ngữ điệu', en: 'Intonation' },
  fluency: { vi: 'Độ trôi chảy', en: 'Fluency' },
  grammar: { vi: 'Ngữ pháp', en: 'Grammar' },
  vocabulary: { vi: 'Từ vựng', en: 'Vocabulary' },
  coherence: { vi: 'Độ mạch lạc', en: 'Coherence' },
};

const GOOD = '#15803D';
const FAIR = '#6A4BD9';
const POOR = '#B91C1C';
const UNKNOWN = '#7C6552';

/** Màu theo điểm 0–100: xanh ≥ 80, cam 60–79, đỏ < 60. */
function scoreColor(score: number): string {
  return score >= 80 ? GOOD : score >= 60 ? FAIR : POOR;
}

function SectionTitle({ children, aside }: { children: string; aside?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ color: COSMIC.ink, fontSize: 16, fontWeight: '800' }}>{children}</Text>
      {aside ? <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '600' }}>{aside}</Text> : null}
    </View>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={{ flexBasis: '48%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: '#F3F0FB', gap: 2 }}>
      <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: COSMIC.ink, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}</Text>
      {hint ? <Text style={{ color: COSMIC.muted, fontSize: 11 }}>{hint}</Text> : null}
    </View>
  );
}

function DimensionRow({ dim }: { dim: DimensionScore }) {
  const label = DIM_LABEL[dim.key];
  const measured = dim.score !== null;
  const color = measured ? scoreColor(dim.score as number) : COSMIC.muted;
  return (
    <View style={{ gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COSMIC.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: COSMIC.ink, fontSize: 14, fontWeight: '700' }}>
          {label.vi} <Text style={{ color: COSMIC.muted, fontWeight: '500', fontSize: 12 }}>· {label.en}</Text>
        </Text>
        <Text style={{ color, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {measured ? `${dim.score}/100` : 'Chưa đo'}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F3F0FB', overflow: 'hidden' }}>
        {measured ? <View style={{ width: `${dim.score as number}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} /> : null}
      </View>
      <Text style={{ color: COSMIC.muted, fontSize: 12, lineHeight: 17 }}>{dim.note}</Text>
    </View>
  );
}

export default function AnalyzePage() {
  const listen = useListen();
  const audio = useMicAudio();
  const [mode, setMode] = useState<'free' | 'topic'>('free');
  const [selectedPrompt, setSelectedPrompt] = useState<TopicPrompt>(IELTS_PROMPTS[0]!);
  const [seconds, setSeconds] = useState(0);
  const [report, setReport] = useState<VoiceReport | null>(null);
  const durationRef = useRef(0);
  const pitchRef = useRef<{ score: number | null; note: string } | null>(null);
  const wasListening = useRef(false);

  // Đồng hồ ghi âm
  useEffect(() => {
    if (!listen.listening) return;
    const t = setInterval(() => setSeconds(Math.round(listen.elapsed() / 1000)), 500);
    return () => clearInterval(t);
  }, [listen.listening, listen.elapsed]);

  // Báo cáo: chỉ dựng từ bản ghi thật, đúng lúc người học bấm dừng
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

  const recording = listen.listening;

  return (
    <HubScreen title="Phân tích giọng nói" subtitle="Ghi âm, rồi xem bài nói của bạn được đo thế nào." back>
      {/* Chế độ: ghi âm tự do hay trả lời đề IELTS */}
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: COSMIC.line }}>
        {(['free', 'topic'] as const).map((m) => {
          const on = mode === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setMode(m)}
              style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#FFFFFF' : 'transparent', borderWidth: on ? 1 : 0, borderColor: COSMIC.cardBorder }}
            >
              <Text style={{ color: on ? COSMIC.ink : COSMIC.muted, fontSize: 13, fontWeight: '800' }}>
                {m === 'free' ? 'Ghi âm tự do' : 'Đề IELTS (Part 1–3)'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'topic' ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {IELTS_PROMPTS.map((p) => {
              const sel = p.id === selectedPrompt.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedPrompt(p)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: sel ? '#F3F0FB' : '#F3F0FB', borderWidth: 1, borderColor: sel ? COSMIC.blue : COSMIC.cardBorder }}
                >
                  <Text style={{ color: sel ? COSMIC.blue : COSMIC.body, fontSize: 12, fontWeight: '700' }}>
                    {p.part} · {p.topic}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ backgroundColor: '#F3F0FB', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: COSMIC.ink, fontSize: 15, fontWeight: '600', lineHeight: 22 }}>{selectedPrompt.question}</Text>
          </View>
        </View>
      ) : null}

      {/* Nút ghi âm */}
      <View style={[GLASS_CARD, { padding: 22, gap: 14, alignItems: 'center' }]}>
        <Text style={{ color: recording ? POOR : COSMIC.ink, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </Text>

        {!listen.supported ? (
          <Text style={{ color: FAIR, fontSize: 13, textAlign: 'center' }}>
            Trình duyệt này không có bộ nhận giọng. Hãy mở bằng Chrome trên máy tính hoặc Android.
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Dừng và phân tích' : 'Bắt đầu ghi âm'}
            onPress={() => void toggle()}
            style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: recording ? POOR : COSMIC.blue }}
          >
            <Icon name={recording ? 'close' : 'mic'} size={30} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        )}

        <Text style={{ color: COSMIC.muted, fontSize: 12, textAlign: 'center' }}>
          {recording ? 'Đang nghe. Bấm dừng khi nói xong để xem kết quả.' : 'Bấm mic, nói tự nhiên, rồi bấm dừng.'}
        </Text>
      </View>

      {/* Kết quả: chỉ hiện số đo được từ bản ghi này */}
      {!report ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 8 }]}>
          <SectionTitle>Kết quả</SectionTitle>
          <Text style={{ color: COSMIC.muted, fontSize: 13, lineHeight: 19 }}>
            Sau khi bạn dừng ghi âm, phần này hiện các số đo lấy từ đúng bài nói đó: tốc độ, từ đệm, ngập ngừng, độ rõ và ngữ điệu. Chiều nào không đo được sẽ ghi “Chưa đo”, không đoán số.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {/* Tổng quan */}
          <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
            <SectionTitle aside="Chỉ tính các chiều đo được">Tổng quan</SectionTitle>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 96, alignItems: 'center', gap: 2 }}>
                <Text style={{ color: report.overall === null ? COSMIC.muted : scoreColor(report.overall), fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  {report.overall === null ? '—' : report.overall}
                </Text>
                <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '700' }}>ĐIỂM / 100</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: BADGE_STYLES.NEW.bg, borderColor: BADGE_STYLES.NEW.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: BADGE_STYLES.NEW.text, fontSize: 11, fontWeight: '800' }}>
                    Band ước lượng {report.estimatedBand === null ? '—' : report.estimatedBand.toFixed(1)}
                  </Text>
                </View>
                <Text style={{ color: COSMIC.muted, fontSize: 11, lineHeight: 16 }}>
                  Ước lượng từ số đo giọng nói, không phải điểm chấm IELTS chính thức.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Stat label="Số từ" value={String(report.wordCount)} />
              <Stat label="Tốc độ" value={report.wpm === null ? '—' : `${report.wpm}`} hint={report.wpm === null ? 'Cần nói thêm' : 'từ / phút'} />
              <Stat label="Từ đệm" value={String(report.fillers.total)} hint={report.fillers.total ? Object.keys(report.fillers.byWord).slice(0, 3).join(', ') : 'Không có'} />
              <Stat label="Ngập ngừng" value={String(report.pauses.count)} hint={report.pauses.count ? `dài nhất ${(report.pauses.longestMs / 1000).toFixed(1)} giây` : undefined} />
            </View>
          </View>

          {/* Sáu chiều */}
          <View style={[GLASS_CARD, { padding: 18 }]}>
            <SectionTitle aside="6 chiều">Chi tiết từng chiều</SectionTitle>
            {report.dimensions.map((d) => (
              <DimensionRow key={d.key} dim={d} />
            ))}
          </View>

          {/* Bài nói, tô theo độ tin cậy của máy nghe */}
          <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
            <SectionTitle>Bài nói của bạn</SectionTitle>
            <View style={{ gap: 8 }}>
              {report.segments.map((s, i) => {
                const c = s.level === 'good' ? GOOD : s.level === 'fair' ? FAIR : s.level === 'poor' ? POOR : UNKNOWN;
                return (
                  <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: c, paddingLeft: 10, paddingVertical: 2 }}>
                    <Text style={{ color: COSMIC.body, fontSize: 14, lineHeight: 21 }}>{s.text}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11, lineHeight: 16 }}>
              Màu vạch bên trái là độ tin cậy của máy nghe: xanh cao, cam trung bình, đỏ thấp, xám không có số.
            </Text>
            {report.repeated.length ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>Từ lặp lại nhiều</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {report.repeated.slice(0, 8).map((r) => (
                    <View key={r.word} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: COSMIC.cardBorder }}>
                      <Text style={{ color: COSMIC.body, fontSize: 12, fontWeight: '700' }}>
                        {r.word} × {r.count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </HubScreen>
  );
}
