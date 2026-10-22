import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';

type MeetingTurn = {
  speaker: 'you' | 'colleague_1' | 'colleague_2';
  name: string;
  role: string;
  time: string;
  text: string;
};

const SAMPLE_MEETING_TURNS: MeetingTurn[] = [
  {
    speaker: 'colleague_1',
    name: 'Sarah Chen',
    role: 'Product Lead',
    time: '00:04',
    text: 'Good morning everyone. Let us review the Q3 launch roadmap and confirm if our API integrations are on track.',
  },
  {
    speaker: 'you',
    name: 'Bạn (Learner)',
    role: 'Tech Lead',
    time: '00:18',
    text: 'Yeah, uhm, so our backend services are mostly done, but, like, we have some issues with latency under peak traffic.',
  },
  {
    speaker: 'colleague_2',
    name: 'Marcus Bell',
    role: 'DevOps Architect',
    time: '00:36',
    text: 'Understood. Is that bottleneck primarily due to database connection pooling, or network round-trips?',
  },
  {
    speaker: 'you',
    name: 'Bạn (Learner)',
    role: 'Tech Lead',
    time: '00:48',
    text: 'I think it is the database. We cannot finish the migration on Friday unless Marcus helps us optimize queries.',
  },
  {
    speaker: 'colleague_1',
    name: 'Sarah Chen',
    role: 'Product Lead',
    time: '01:05',
    text: 'Marcus, could you pair with the team today? We need a stable deployment by next Tuesday.',
  },
];

type ExecutiveRephrase = {
  original: string;
  professional: string;
  rationaleVi: string;
};

const REPHRASES: ExecutiveRephrase[] = [
  {
    original: 'Yeah, uhm, so our backend services are mostly done, but, like, we have some issues with latency...',
    professional: 'Our core backend infrastructure is substantially complete; however, we have observed non-trivial latency anomalies under peak load.',
    rationaleVi: 'Loại bỏ từ đệm "uhm", "like" và nâng tầm diễn đạt kỹ thuật chính xác hơn.',
  },
  {
    original: 'I think it is the database. We cannot finish the migration on Friday...',
    professional: 'Initial profiling points to database query performance. Given the current scope, completing the migration by Friday introduces unnecessary risk.',
    rationaleVi: 'Tránh dùng "I think" chung chung và cách nói phủ định gay gắt "we cannot finish", thay bằng ngôn ngữ đánh giá rủi ro chuyên nghiệp.',
  },
];

export default function MeetingAssistant() {
  const [activeTab, setActiveTab] = useState<'record' | 'transcript'>('record');
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [customText, setCustomText] = useState('');
  const [customMinutes, setCustomMinutes] = useState('3');
  const [showReport, setShowReport] = useState(true);

  const listen = useListen();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      listen.stop();
      setShowReport(true);
    } else {
      setElapsedSeconds(0);
      setRecording(true);
      setShowReport(false);
      listen.start();
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <HubScreen title="Trợ lý cuộc họp AI" subtitle="Ghi âm tách giọng · Đánh giá WPM & phong cách công sở" back>
      {/* Mode Selector Tabs */}
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: HUB.glass, borderWidth: 1, borderColor: HUB.line }}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'record' }}
          onPress={() => setActiveTab('record')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            backgroundColor: activeTab === 'record' ? HUB.glassStrong : 'transparent',
          }}
        >
          <Icon name="mic" size={16} color={activeTab === 'record' ? HUB.sky : HUB.muted} />
          <Text style={{ color: activeTab === 'record' ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: activeTab === 'record' ? '800' : '600' }}>
            Ghi âm & Tách giọng
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'transcript' }}
          onPress={() => setActiveTab('transcript')}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            backgroundColor: activeTab === 'transcript' ? HUB.glassStrong : 'transparent',
          }}
        >
          <Icon name="book" size={16} color={activeTab === 'transcript' ? HUB.sky : HUB.muted} />
          <Text style={{ color: activeTab === 'transcript' ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: activeTab === 'transcript' ? '800' : '600' }}>
            Dán nội dung họp
          </Text>
        </Pressable>
      </View>

      {/* Recording Mode */}
      {activeTab === 'record' ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Ghi âm thảo luận nhóm</Text>
              <Text style={{ color: HUB.muted, fontSize: 12 }}>Tự động nhận diện thời gian nói & tách người nói</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: recording ? 'rgba(239, 68, 68, 0.2)' : HUB.glassStrong }}>
              <Text style={{ color: recording ? '#EF4444' : HUB.sky, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {recording ? formatTimer(elapsedSeconds) : '01:25 (Mẫu)'}
              </Text>
            </View>
          </View>

          {/* Action button */}
          <Pressable
            accessibilityRole="button"
            onPress={toggleRecording}
            style={{
              height: 48,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: recording ? '#EF4444' : HUB.blue,
            }}
          >
            <Icon name={recording ? 'close' : 'mic'} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
              {recording ? 'Dừng cuộc họp & Xuất biên bản' : 'Bắt đầu ghi âm cuộc họp mới'}
            </Text>
          </Pressable>

          {/* Live Speaker Diarization Preview */}
          <View style={{ gap: 8 }}>
            <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>Nhận diện tách giọng người nói (Speaker Diarization):</Text>
            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
              {SAMPLE_MEETING_TURNS.map((turn, i) => {
                const isYou = turn.speaker === 'you';
                return (
                  <View
                    key={i}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: isYou ? 'rgba(140, 83, 27, 0.12)' : HUB.glassStrong,
                      borderWidth: 1,
                      borderColor: isYou ? 'rgba(140, 83, 27, 0.3)' : HUB.line,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: isYou ? '#6A4BD9' : '#C084FC', fontSize: 12, fontWeight: '800' }}>{turn.name}</Text>
                        <Text style={{ color: HUB.muted, fontSize: 10 }}>• {turn.role}</Text>
                      </View>
                      <Text style={{ color: HUB.muted, fontSize: 10, fontVariant: ['tabular-nums'] }}>{turn.time}</Text>
                    </View>
                    <Text style={{ color: HUB.ink, fontSize: 13, lineHeight: 18 }}>{turn.text}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* Manual Paste Mode */
        <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
          <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Dán phần phát biểu của bạn</Text>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            multiline
            placeholder="Dán các câu bạn đã nói trong cuộc họp để phân tích..."
            placeholderTextColor={HUB.muted}
            style={{
              minHeight: 120,
              borderRadius: 12,
              padding: 12,
              color: HUB.ink,
              backgroundColor: HUB.glassStrong,
              borderWidth: 1,
              borderColor: HUB.line,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: HUB.body, fontSize: 13 }}>Thời lượng bạn nói khoảng:</Text>
            <TextInput
              value={customMinutes}
              onChangeText={setCustomMinutes}
              keyboardType="numeric"
              style={{
                width: 50,
                height: 36,
                borderRadius: 8,
                textAlign: 'center',
                color: HUB.ink,
                backgroundColor: HUB.glassStrong,
                borderWidth: 1,
                borderColor: HUB.line,
              }}
            />
            <Text style={{ color: HUB.body, fontSize: 13 }}>phút</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowReport(true)}
            style={{
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: HUB.blue,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Phân tích ngay</Text>
          </Pressable>
        </View>
      )}

      {/* Post-Meeting Executive Summary (Biên bản cuộc họp thông minh) */}
      {showReport ? (
        <View style={{ gap: 12 }}>
          {/* 4 Core Meeting Metrics */}
          <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="sparkle" size={18} color="#38BDF8" />
                <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Biên bản Cuộc họp Thông minh</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '800' }}>HOÀN TẤT</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Metric 1: Speaking Ratio */}
              <View style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '600' }}>Tỷ lệ thời gian bạn nói</Text>
                <Text style={{ color: '#6A4BD9', fontSize: 22, fontWeight: '800' }}>34%</Text>
                <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '700' }}>✓ Cân bằng lý tưởng (30-40%)</Text>
              </View>

              {/* Metric 2: WPM */}
              <View style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '600' }}>Tốc độ nói trung bình</Text>
                <Text style={{ color: '#A855F7', fontSize: 22, fontWeight: '800' }}>132 WPM</Text>
                <Text style={{ color: HUB.muted, fontSize: 10 }}>Chuẩn tự nhiên nơi công sở</Text>
              </View>

              {/* Metric 3: Filler words */}
              <View style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '600' }}>Từ đệm phát hiện</Text>
                <Text style={{ color: '#F59E0B', fontSize: 22, fontWeight: '800' }}>4 từ</Text>
                <Text style={{ color: HUB.muted, fontSize: 10 }}>uhm (2), like (2)</Text>
              </View>

              {/* Metric 4: Pronunciation in meeting */}
              <View style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '600' }}>Độ rõ phát âm</Text>
                <Text style={{ color: '#10B981', fontSize: 22, fontWeight: '800' }}>85%</Text>
                <Text style={{ color: HUB.muted, fontSize: 10 }}>2 từ cần chú ý âm cuối</Text>
              </View>
            </View>
          </View>

          {/* Pronunciation Watchlist during meeting */}
          <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Từ phát âm cần cải thiện trong cuộc họp</Text>
            <View style={{ gap: 8 }}>
              <View style={{ padding: 10, borderRadius: 10, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>migration (/maɪˈɡreɪ.ʃən/)</Text>
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Bạn đọc: /mɪˈɡreɪ.ʃən/</Text>
                </View>
                <Text style={{ color: HUB.muted, fontSize: 11 }}>Âm đầu là nguyên âm đôi /aɪ/, không phải âm ngắn /ɪ/.</Text>
              </View>

              <View style={{ padding: 10, borderRadius: 10, backgroundColor: HUB.glassStrong, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>optimize (/ˈɑːp.tə.maɪz/)</Text>
                  <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>Thiếu âm cuối /z/</Text>
                </View>
                <Text style={{ color: HUB.muted, fontSize: 11 }}>Cần rung nhẹ dây thanh quản cho âm /z/ ở cuối từ.</Text>
              </View>
            </View>
          </View>

          {/* Executive Business Rephrasing */}
          <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>
                Diễn đạt lại theo phong cách Lãnh đạo & Công sở (Executive Rephrasing)
              </Text>
              <Text style={{ color: HUB.muted, fontSize: 12 }}>
                Chuyển hoá câu nói mộc mạc thành ngôn từ ngoại giao, tự tin chuẩn quốc tế
              </Text>
            </View>

            {REPHRASES.map((item, idx) => (
              <View key={idx} style={{ padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line, gap: 6 }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Câu bạn đã nói:</Text>
                  <Text style={{ color: HUB.muted, fontSize: 13, fontStyle: 'italic' }}>“{item.original}”</Text>
                </View>

                <View style={{ gap: 2, paddingTop: 4 }}>
                  <Text style={{ color: '#6A4BD9', fontSize: 11, fontWeight: '700' }}>Khuyên dùng (Executive Band 9):</Text>
                  <Text style={{ color: '#E0F2FE', fontSize: 13, fontWeight: '600', lineHeight: 19 }}>“{item.professional}”</Text>
                </View>

                <Text style={{ color: '#94A3B8', fontSize: 11, lineHeight: 16 }}>💡 {item.rationaleVi}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </HubScreen>
  );
}
