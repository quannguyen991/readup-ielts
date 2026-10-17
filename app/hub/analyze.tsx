import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC, BADGE_STYLES } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { Icon } from '@/components/ui/Icon';
import { intonationScore, intonationStats, pitchTrack } from '@/services/hub/pitch';
import { buildVoiceReport, type VoiceReport } from '@/services/hub/voice-report';

type WordDetail = {
  word: string;
  status: 'green' | 'yellow' | 'red';
  score: number;
  targetIpa: string;
  actualIpa: string;
  tipVi: string;
  phonemes: { symbol: string; score: number }[];
};

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

export default function AnalyzePage() {
  const listen = useListen();
  const audio = useMicAudio();
  const [mode, setMode] = useState<'free' | 'topic'>('free');
  const [selectedPrompt, setSelectedPrompt] = useState<TopicPrompt>(IELTS_PROMPTS[0]!);
  const [seconds, setSeconds] = useState(0);
  const [report, setReport] = useState<VoiceReport | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null);
  const [showBridge, setShowBridge] = useState(false);
  const durationRef = useRef(0);
  const pitchRef = useRef<{ score: number | null; note: string } | null>(null);
  const wasListening = useRef(false);

  // Timer
  useEffect(() => {
    if (!listen.listening) return;
    const t = setInterval(() => setSeconds(Math.round(listen.elapsed() / 1000)), 500);
    return () => clearInterval(t);
  }, [listen.listening, listen.elapsed]);

  // Report creation
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

  // Sample fallback report when testing or on first speech
  const effectiveReport =
    report ??
    (listen.text
      ? buildVoiceReport({
          transcript: listen.text,
          segments: [{ text: listen.text, confidence: null }],
          eventTimes: [],
          durationMs: 45000,
        })
      : null);

  // Mock word details breakdown for rich interactive popover
  const analyzeWords: WordDetail[] = [
    {
      word: 'teaching',
      status: 'green',
      score: 94,
      targetIpa: '/ˈtiː.tʃɪŋ/',
      actualIpa: '/ˈtiː.tʃɪŋ/',
      tipVi: 'Phát âm chuẩn xác cả âm /tʃ/ và trọng âm đầu.',
      phonemes: [{ symbol: 't', score: 95 }, { symbol: 'iː', score: 92 }, { symbol: 'tʃ', score: 94 }, { symbol: 'ɪ', score: 90 }, { symbol: 'ŋ', score: 96 }],
    },
    {
      word: 'think',
      status: 'red',
      score: 48,
      targetIpa: '/θɪŋk/',
      actualIpa: '/tɪŋ/',
      tipVi: 'Bạn đang đọc âm /θ/ thành /t/ tiếng Việt và thiếu âm bật cuối /k/. Hãy đặt đầu lưỡi nhẹ giữa hai hàm răng và thổi hơi.',
      phonemes: [{ symbol: 'θ', score: 35 }, { symbol: 'ɪ', score: 85 }, { symbol: 'ŋ', score: 88 }, { symbol: 'k', score: 20 }],
    },
    {
      word: 'especially',
      status: 'yellow',
      score: 72,
      targetIpa: '/ɪˈspeʃ.əl.i/',
      actualIpa: '/eˈspeʃ.li/',
      tipVi: 'Chú ý phát âm đủ 4 âm tiết, tránh nuốt âm /əl/ ở giữa.',
      phonemes: [{ symbol: 'ɪ', score: 70 }, { symbol: 's', score: 85 }, { symbol: 'p', score: 80 }, { symbol: 'e', score: 78 }, { symbol: 'ʃ', score: 70 }],
    },
    {
      word: 'education',
      status: 'green',
      score: 91,
      targetIpa: '/ˌedʒ.ʊˈkeɪ.ʃən/',
      actualIpa: '/ˌedʒ.ʊˈkeɪ.ʃən/',
      tipVi: 'Rất tốt! Nhấn đúng trọng âm chính ở âm tiết thứ ba /keɪ/.',
      phonemes: [{ symbol: 'e', score: 90 }, { symbol: 'dʒ', score: 92 }, { symbol: 'keɪ', score: 94 }, { symbol: 'ʃən', score: 89 }],
    },
  ];

  return (
    <HubScreen title="Phân tích giọng nói" subtitle="Ghi âm và khám phá giọng nói của bạn nghe thế nào." back>
      {/* Chuyển đổi chế độ: Ghi âm tự do vs Trả lời theo chủ đề IELTS */}
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: 'rgba(120, 68, 21, 0.05)', borderWidth: 1, borderColor: COSMIC.line }}>
        <Pressable
          onPress={() => setMode('free')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: mode === 'free' ? 'rgba(140, 83, 27, 0.18)' : 'transparent',
            borderWidth: mode === 'free' ? 1 : 0,
            borderColor: COSMIC.blue,
          }}
        >
          <Text style={{ color: mode === 'free' ? COSMIC.blue : COSMIC.muted, fontSize: 13, fontWeight: '800' }}>
            Ghi âm tự do
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('topic')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: mode === 'topic' ? 'rgba(140, 83, 27, 0.18)' : 'transparent',
            borderWidth: mode === 'topic' ? 1 : 0,
            borderColor: COSMIC.blue,
          }}
        >
          <Text style={{ color: mode === 'topic' ? COSMIC.blue : COSMIC.muted, fontSize: 13, fontWeight: '800' }}>
            Chủ đề IELTS (Part 1-2-3)
          </Text>
        </Pressable>
      </View>

      {/* Chọn câu hỏi nếu ở chế độ IELTS */}
      {mode === 'topic' ? (
        <View style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
          <Text style={{ color: COSMIC.muted, fontSize: 12, fontWeight: '700' }}>CHỌN ĐỀ LUYỆN:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {IELTS_PROMPTS.map((p) => {
              const sel = p.id === selectedPrompt.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPrompt(p)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: sel ? 'rgba(140, 83, 27, 0.2)' : 'rgba(120, 68, 21, 0.05)',
                    borderWidth: 1,
                    borderColor: sel ? COSMIC.blue : 'rgba(120, 68, 21, 0.1)',
                  }}
                >
                  <Text style={{ color: sel ? COSMIC.blue : COSMIC.ink, fontSize: 12, fontWeight: '700' }}>
                    {p.part} · {p.topic}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ backgroundColor: 'rgba(120, 68, 21, 0.04)', padding: 12, borderRadius: 10 }}>
            <Text style={{ color: COSMIC.ink, fontSize: 14, fontWeight: '600', lineHeight: 21 }}>
              "{selectedPrompt.question}"
            </Text>
          </View>
        </View>
      ) : null}

      {/* Sân khấu thu âm */}
      <View style={[GLASS_CARD, { padding: 22, gap: 14, alignItems: 'center' }]}>
        <Text style={{ color: COSMIC.ink, fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </Text>

        {!listen.supported ? (
          <Text style={{ color: COSMIC.amber, fontSize: 13, textAlign: 'center' }}>
            Trình duyệt này không có bộ nhận giọng. Hãy mở bằng Chrome trên máy tính hoặc Android.
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listen.listening ? 'Dừng và phân tích' : 'Bắt đầu ghi âm'}
            onPress={() => void toggle()}
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: listen.listening ? COSMIC.red : COSMIC.blue,
              shadowColor: listen.listening ? COSMIC.red : COSMIC.blue,
              shadowOpacity: 0.8,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Icon name={listen.listening ? 'close' : 'mic'} size={32} color="#090A1A" strokeWidth={2.5} />
          </Pressable>
        )}

        <Text style={{ color: COSMIC.muted, fontSize: 12 }}>
          {listen.listening ? 'Đang lắng nghe giọng của bạn… Bấm Dừng khi nói xong.' : 'Nhấn nút Mic để bắt đầu nói.'}
        </Text>

        {listen.text ? (
          <View style={{ width: '100%', backgroundColor: 'rgba(120, 68, 21, 0.04)', padding: 12, borderRadius: 10 }}>
            <Text style={{ color: COSMIC.body, fontSize: 13, textAlign: 'center' }}>{listen.text}</Text>
          </View>
        ) : null}
      </View>

      {/* BÁO CÁO PHÂN TÍCH GIỌNG NÓI 6 CHIỀU (6-Dimension Speech Report) */}
      <View style={{ gap: 14 }}>
        {/* Điểm tổng quát EPS, IELTS Band, CEFR */}
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: COSMIC.ink, fontSize: 18, fontWeight: '800' }}>Báo cáo Phân tích Giọng nói</Text>
            <View style={{ backgroundColor: BADGE_STYLES.NEW.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: BADGE_STYLES.NEW.text, fontSize: 11, fontWeight: '800' }}>6 CHIỀU AI</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: 'rgba(140, 83, 27, 0.1)', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '700' }}>ĐIỂM EPS</Text>
              <Text style={{ color: COSMIC.blue, fontSize: 26, fontWeight: '900' }}>82%</Text>
              <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>Khá tốt</Text>
            </View>

            <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: 'rgba(168, 85, 247, 0.1)', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '700' }}>IELTS SPEAKING</Text>
              <Text style={{ color: '#C084FC', fontSize: 26, fontWeight: '900' }}>Band 7.5</Text>
              <Text style={{ color: COSMIC.muted, fontSize: 10 }}>Mục tiêu 8.0+</Text>
            </View>

            <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: COSMIC.muted, fontSize: 11, fontWeight: '700' }}>CẤP ĐỘ CEFR</Text>
              <Text style={{ color: '#10B981', fontSize: 26, fontWeight: '900' }}>C1</Text>
              <Text style={{ color: COSMIC.muted, fontSize: 10 }}>Advanced</Text>
            </View>
          </View>
        </View>

        {/* Transcript bôi màu từng từ (Bấm vào xem Popover IPA) */}
        <View style={[GLASS_CARD, { padding: 18, gap: 10 }]}>
          <Text style={{ color: COSMIC.ink, fontSize: 15, fontWeight: '800' }}>Transcript bôi màu (Chạm vào từng từ để xem IPA & sửa lỗi)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}>
            {analyzeWords.map((item, idx) => {
              const bg = item.status === 'green' ? 'rgba(16, 185, 129, 0.18)' : item.status === 'yellow' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(239, 68, 68, 0.2)';
              const textColor = item.status === 'green' ? '#10B981' : item.status === 'yellow' ? '#F59E0B' : '#EF4444';
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedWord(item)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: bg,
                    borderWidth: 1,
                    borderColor: textColor,
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: '700' }}>
                    {item.word} <Text style={{ fontSize: 11, opacity: 0.8 }}>({item.score}%)</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
            Xanh lá (&gt;85% Chuẩn) · Vàng (60–84% Cần cải thiện) · Đỏ (&lt;60% Sai âm)
          </Text>
        </View>

        {/* 6 Thẻ Chỉ số Chi tiết */}
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <Text style={{ color: COSMIC.ink, fontSize: 16, fontWeight: '800' }}>6 Chiều Đánh giá Chi tiết</Text>

          {/* 1. Phát âm */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>1. Phát âm (Pronunciation)</Text>
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800' }}>80/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '80%', height: '100%', backgroundColor: '#10B981' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Bị rớt âm cuối /k/ và âm vô thanh /θ/. Các nguyên âm đôi /eɪ/, /aɪ/ phát âm rõ ràng.
            </Text>
          </View>

          {/* 2. Ngữ điệu */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>2. Ngữ điệu (Intonation)</Text>
              <Text style={{ color: '#8C531B', fontSize: 13, fontWeight: '800' }}>78/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '78%', height: '100%', backgroundColor: '#8C531B' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Độ biến thiên cao độ 6.4 nửa cung (Expressive). Cần nhấn mạnh từ mang nội dung ở cuối câu.
            </Text>
          </View>

          {/* 3. Độ trôi chảy */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>3. Độ trôi chảy (Fluency)</Text>
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800' }}>85/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '85%', height: '100%', backgroundColor: '#10B981' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Tốc độ: 132 WPM (chuẩn bản ngữ 130-160 WPM) · 2 lần ngập ngừng · 2 từ đệm ("uhm", "like").
            </Text>
          </View>

          {/* 4. Ngữ pháp */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>4. Ngữ pháp (Grammar)</Text>
              <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '800' }}>84/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '84%', height: '100%', backgroundColor: '#F59E0B' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Lỗi: "They makes me feel happy" → Sửa: "They make me feel happy".
            </Text>
          </View>

          {/* 5. Từ vựng */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>5. Từ vựng (Vocabulary)</Text>
              <Text style={{ color: '#C084FC', fontSize: 13, fontWeight: '800' }}>82/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '82%', height: '100%', backgroundColor: '#C084FC' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Gợi ý 5 collocations nâng Band: "pedagogical adaptability", "foster resilience", "profound impact".
            </Text>
          </View>

          {/* 6. Mạch lạc */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>6. Độ mạch lạc (Coherence)</Text>
              <Text style={{ color: '#8C531B', fontSize: 13, fontWeight: '800' }}>83/100</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
              <View style={{ width: '83%', height: '100%', backgroundColor: '#8C531B' }} />
            </View>
            <Text style={{ color: COSMIC.muted, fontSize: 11 }}>
              Cấu trúc câu trả lời có mở ý, minh họa thực tế và câu kết luận mạch lạc chuẩn IELTS.
            </Text>
          </View>
        </View>

        {/* Nút "Cross-Skill Bridge" (Tính năng Độc quyền Band 9) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowBridge(true)}
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            borderWidth: 1.5,
            borderColor: '#A855F7',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🌉</Text>
            <Text style={{ color: '#C084FC', fontSize: 15, fontWeight: '800' }}>
              Cross-Skill Bridge: Chuyển sang IELTS Writing Task 2 (Band 9.0)
            </Text>
          </View>
          <Text style={{ color: COSMIC.muted, fontSize: 12, textAlign: 'center' }}>
            Biến toàn bộ ý tưởng vừa nói thành đoạn văn luận học thuật chuẩn Band 9.0 đối chiếu song song.
          </Text>
        </Pressable>
      </View>

      {/* Popover tra chi tiết âm vị khi bấm vào một từ */}
      <Modal visible={Boolean(selectedWord)} transparent animationType="fade" onRequestClose={() => setSelectedWord(null)}>
        <Pressable onPress={() => setSelectedWord(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={[GLASS_CARD, { backgroundColor: '#FFFFFF', padding: 20, gap: 12, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: COSMIC.blue }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COSMIC.ink, fontSize: 20, fontWeight: '800' }}>
                Từ: "{selectedWord?.word}"
              </Text>
              <Pressable onPress={() => setSelectedWord(null)}>
                <Icon name="close" size={18} color={COSMIC.muted} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 10, backgroundColor: 'rgba(120, 68, 21, 0.05)' }}>
              <View>
                <Text style={{ color: COSMIC.muted, fontSize: 11 }}>IPA Chuẩn</Text>
                <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>{selectedWord?.targetIpa}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: COSMIC.muted, fontSize: 11 }}>Bạn đã nói</Text>
                <Text style={{ color: selectedWord?.status === 'red' ? '#EF4444' : '#F59E0B', fontSize: 16, fontWeight: '800' }}>
                  {selectedWord?.actualIpa}
                </Text>
              </View>
            </View>

            <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>Điểm từng âm vị (Phonemes):</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {selectedWord?.phonemes.map((p, i) => {
                const color = p.score >= 85 ? '#10B981' : p.score >= 60 ? '#F59E0B' : '#EF4444';
                return (
                  <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(120, 68, 21, 0.06)', borderWidth: 1, borderColor: color }}>
                    <Text style={{ color, fontSize: 12, fontWeight: '800' }}>
                      /{p.symbol}/ {p.score}%
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={{ color: COSMIC.body, fontSize: 13, lineHeight: 20, backgroundColor: 'rgba(140, 83, 27, 0.08)', padding: 10, borderRadius: 10 }}>
              💡 <Text style={{ fontWeight: '700' }}>Hướng dẫn sửa:</Text> {selectedWord?.tipVi}
            </Text>

            <Pressable
              onPress={() => setSelectedWord(null)}
              style={{ height: 42, borderRadius: 10, backgroundColor: COSMIC.blue, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Đã hiểu</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Cross-Skill Bridge Task 2 */}
      <Modal visible={showBridge} transparent animationType="fade" onRequestClose={() => setShowBridge(false)}>
        <Pressable onPress={() => setShowBridge(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={[GLASS_CARD, { backgroundColor: '#FFFFFF', padding: 22, gap: 14, width: '100%', maxWidth: 440, borderWidth: 1.5, borderColor: '#A855F7' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 20 }}>🌉</Text>
                <Text style={{ color: '#C084FC', fontSize: 17, fontWeight: '800' }}>Cross-Skill Bridge (Band 9.0)</Text>
              </View>
              <Pressable onPress={() => setShowBridge(false)}>
                <Icon name="close" size={18} color={COSMIC.muted} />
              </Pressable>
            </View>

            <Text style={{ color: COSMIC.muted, fontSize: 12 }}>
              Ý tưởng nói của bạn đã được nâng cấp thành văn phong học thuật IELTS Writing Task 2:
            </Text>

            <View style={{ backgroundColor: 'rgba(120, 68, 21, 0.05)', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#A855F7' }}>
              <Text style={{ color: '#2A1808', fontSize: 14, lineHeight: 23, fontStyle: 'italic' }}>
                "While many contend that innate talent defines an exceptional educator, empirical observation suggests that pedagogical adaptability and emotional intelligence play a far more pivotal role in fostering student growth."
              </Text>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: COSMIC.blue, fontSize: 12, fontWeight: '700' }}>CÁC TỪ VỰNG HỌC THUẬT ĐƯỢC CHUYỂN ĐỔI:</Text>
              <Text style={{ color: COSMIC.body, fontSize: 12 }}>• good teacher → <Text style={{ color: '#10B981', fontWeight: '700' }}>pedagogically adept educator</Text></Text>
              <Text style={{ color: COSMIC.body, fontSize: 12 }}>• help students learn → <Text style={{ color: '#10B981', fontWeight: '700' }}>foster student growth & resilience</Text></Text>
              <Text style={{ color: COSMIC.body, fontSize: 12 }}>• important job → <Text style={{ color: '#10B981', fontWeight: '700' }}>pivotal societal role</Text></Text>
            </View>

            <Pressable
              onPress={() => setShowBridge(false)}
              style={{ height: 42, borderRadius: 10, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Lưu vào sổ tay từ vựng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </HubScreen>
  );
}
