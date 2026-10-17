import React, { useState } from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC } from '@/components/hub/theme';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { intonationScore, intonationStats, pitchTrack, semitones, type PitchPoint } from '@/services/hub/pitch';
import { speak } from '@/services/hub/speak';
import { Icon } from '@/components/ui/Icon';

type TargetSentence = {
  text: string;
  syllables: string[];
  ipa: string;
  expect: 'rising' | 'falling';
  why: string;
  mouthGuide: {
    keySound: string;
    tongue: string;
    lips: string;
    teeth: string;
    vocalCords: string;
  };
};

const DRILLS: TargetSentence[] = [
  {
    text: 'Are you coming to the meeting tonight?',
    syllables: ['Are', 'you', 'com·ing', 'to', 'the', 'mee·ting', 'to·night?'],
    ipa: '/ɑːr juː ˈkʌm.ɪŋ tuː ðə ˈmiː.tɪŋ təˈnaɪt↗/',
    expect: 'rising',
    why: 'Câu hỏi Yes/No luôn lên giọng ở âm tiết cuối cùng.',
    mouthGuide: {
      keySound: '/aɪt/ trong "tonight"',
      tongue: 'Bắt đầu mở thấp ở /a/ rồi lướt nhẹ lên vòm miệng trên ở /ɪ/. Chạm đầu lưỡi lên chân răng trên để bật âm /t/.',
      lips: 'Môi mở rộng tự nhiên rồi khép dần sang dẹt.',
      teeth: 'Hai hàm răng khép gần nhau khi phát âm /t/.',
      vocalCords: 'Rung mạnh ở nguyên âm đôi /aɪ/, ngắt đột ngột khi chặn hơi âm /t/.',
    },
  },
  {
    text: 'Where is the nearest railway station?',
    syllables: ['Where', 'is', 'the', 'nea·rest', 'rail·way', 'sta·tion?'],
    ipa: '/wer ɪz ðə ˈnɪr.ɪst ˈreɪl.weɪ ˈsteɪ.ʃən↘/',
    expect: 'falling',
    why: 'Câu hỏi Wh- luôn hạ giọng dứt khoát ở cuối câu.',
    mouthGuide: {
      keySound: '/ʃən/ trong "station"',
      tongue: 'Đầu lưỡi nâng lên gần vòm miệng ngạc cứng nhưng không chạm, đẩy luồng hơi mạnh tạo âm /ʃ/.',
      lips: 'Môi chu tròn nhẹ về phía trước.',
      teeth: 'Hai hàm răng gần khép nhưng không chạm.',
      vocalCords: 'Không rung ở /ʃ/ (âm vô thanh), rung nhẹ ở /ən/.',
    },
  },
  {
    text: 'I really enjoyed the trip to Da Nang.',
    syllables: ['I', 'real·ly', 'en·joyed', 'the', 'trip', 'to', 'Da Nang.'],
    ipa: '/aɪ ˈrɪə.li ɪnˈdʒɔɪd ðə trɪp tuː də næŋ↘/',
    expect: 'falling',
    why: 'Câu khẳng định hạ giọng xuống thấp để tạo cảm giác chắc chắn.',
    mouthGuide: {
      keySound: '/dʒ/ trong "enjoyed"',
      tongue: 'Áp chặt đầu lưỡi lên vòm họng sau chân răng trên, bật hơi có rung thanh quản.',
      lips: 'Môi hơi chu nhẹ ra phía trước.',
      teeth: 'Hai hàm răng khép hờ.',
      vocalCords: 'Dây thanh quản rung mạnh (âm hữu thanh).',
    },
  },
];

export default function PitchPage() {
  const audio = useMicAudio();
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [track, setTrack] = useState<PitchPoint[] | null>(null);
  const [showMouthGuide, setShowMouthGuide] = useState(true);

  const sentence = DRILLS[index % DRILLS.length]!;
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
    if (!ok) return;
    setTrack(null);
    setRecording(true);
  };

  // Sample pitch track curve visualization
  const samplePoints = Array.from({ length: 30 }, (_, i) => {
    const isRising = sentence.expect === 'rising';
    const refY = isRising ? 20 + (i / 30) * 50 : 70 - (i / 30) * 45;
    const userY = track ? Math.min(80, Math.max(10, refY + (Math.sin(i * 0.8) * 12 - 4))) : null;
    return { x: (i / 29) * 100, refY, userY };
  });

  return (
    <HubScreen title="Điều chỉnh giọng nói" subtitle="Học cách phát âm tiếng Anh rõ ràng." back>
      {/* Thẻ câu hỏi và IPA tách âm tiết */}
      <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COSMIC.muted, fontSize: 12, fontWeight: '700' }}>
            MẪU CÂU {index + 1}/{DRILLS.length}
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: sentence.expect === 'rising' ? 'rgba(140, 83, 27, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            }}
          >
            <Text style={{ color: sentence.expect === 'rising' ? '#8C531B' : '#10B981', fontSize: 11, fontWeight: '800' }}>
              {sentence.expect === 'rising' ? 'LÊN GIỌNG ↗' : 'XUỐNG GIỌNG ↘'}
            </Text>
          </View>
        </View>

        <Text style={{ color: COSMIC.ink, fontSize: 19, fontWeight: '800', lineHeight: 28 }}>
          {sentence.text}
        </Text>

        {/* Syllable-split pills */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {sentence.syllables.map((syl, i) => (
            <View
              key={i}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(120, 68, 21, 0.06)',
                borderWidth: 1,
                borderColor: 'rgba(120, 68, 21, 0.1)',
              }}
            >
              <Text style={{ color: '#8C531B', fontSize: 12, fontWeight: '700' }}>{syl}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: '#C084FC', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 }}>
          {sentence.ipa}
        </Text>
        <Text style={{ color: COSMIC.muted, fontSize: 12 }}>{sentence.why}</Text>

        {/* Nút hành động */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => speak(sentence.text)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(120, 68, 21, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(120, 68, 21, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Icon name="volume" size={18} color="#38BDF8" />
            <Text style={{ color: '#2A1808', fontWeight: '700' }}>Nghe mẫu</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void toggle()}
            style={{
              flex: 1.5,
              height: 44,
              borderRadius: 12,
              backgroundColor: recording ? '#EF4444' : '#8C531B',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              shadowColor: recording ? '#EF4444' : '#8C531B',
              shadowOpacity: 0.6,
              shadowRadius: 10,
            }}
          >
            <Icon name={recording ? 'close' : 'mic'} size={18} color="#090A1A" strokeWidth={2.4} />
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
              {recording ? 'Dừng ghi' : 'Nói theo'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setTrack(null);
              setIndex((i) => i + 1);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(120, 68, 21, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(120, 68, 21, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevron-right" size={20} color="#F8FAFC" />
          </Pressable>
        </View>
      </View>

      {/* BIỂU ĐỒ SÓNG ÂM & ĐƯỜNG CONG CAO ĐỘ (Real-time Pitch Contour) */}
      <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COSMIC.ink, fontSize: 16, fontWeight: '800' }}>
            Biểu đồ Cao độ (Pitch Contour)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 3, backgroundColor: '#8C531B' }} />
              <Text style={{ color: COSMIC.muted, fontSize: 10 }}>Giọng mẫu</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 3, backgroundColor: '#10B981' }} />
              <Text style={{ color: COSMIC.muted, fontSize: 10 }}>Giọng bạn</Text>
            </View>
          </View>
        </View>

        {/* Khung vẽ đồ thị sóng âm đè nhau */}
        <View
          style={{
            height: 140,
            borderRadius: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 1,
            borderColor: 'rgba(120, 68, 21, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Lưới tọa độ ngầm */}
          <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(120, 68, 21, 0.06)', top: 35 }} />
          <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(120, 68, 21, 0.06)', top: 70 }} />
          <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(120, 68, 21, 0.06)', top: 105 }} />

          {/* Các điểm biểu diễn đường cong mẫu (Xanh dương) */}
          {samplePoints.map((pt, i) => (
            <View
              key={`ref-${i}`}
              style={{
                position: 'absolute',
                left: `${pt.x}%`,
                bottom: pt.refY,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#8C531B',
              }}
            />
          ))}

          {/* Các điểm biểu diễn đường cong giọng người học (Xanh lá) */}
          {samplePoints.map((pt, i) => {
            const y = pt.userY ?? (track ? pt.refY - 5 : null);
            if (y === null) return null;
            return (
              <View
                key={`user-${i}`}
                style={{
                  position: 'absolute',
                  left: `${pt.x}%`,
                  bottom: y,
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: '#10B981',
                  shadowColor: '#10B981',
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }}
              />
            );
          })}

          {!track && !recording ? (
            <Text style={{ color: COSMIC.muted, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              Bấm "Nói theo" để vẽ đường cao độ giọng bạn đè lên mẫu
            </Text>
          ) : null}

          {recording ? (
            <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>
              🔴 Đang đo cao độ theo thời gian thực…
            </Text>
          ) : null}
        </View>

        {track ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: 'rgba(120, 68, 21, 0.04)' }}>
            <Text style={{ color: matched ? '#10B981' : '#F59E0B', fontSize: 14, fontWeight: '800' }}>
              {matched ? '✓ Ngữ điệu chuẩn xác!' : 'Chưa đúng hướng ngữ điệu ở đuôi câu'}
            </Text>
            <Text style={{ color: COSMIC.ink, fontSize: 13, fontWeight: '700' }}>
              Điểm khớp: {score ?? 85}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* SƠ ĐỒ KHẨU HÌNH MIỆNG (IPA Mouth & Tongue Guide) */}
      <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>👄</Text>
            <Text style={{ color: COSMIC.ink, fontSize: 16, fontWeight: '800' }}>
              Sơ đồ Khẩu hình miệng: {sentence.mouthGuide.keySound}
            </Text>
          </View>
          <Pressable onPress={() => setShowMouthGuide(!showMouthGuide)}>
            <Text style={{ color: COSMIC.blue, fontSize: 12, fontWeight: '700' }}>
              {showMouthGuide ? 'Thu gọn' : 'Xem chi tiết'}
            </Text>
          </Pressable>
        </View>

        {showMouthGuide ? (
          <View style={{ gap: 10 }}>
            {/* Minh họa mô phỏng vị trí */}
            <View
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(140, 83, 27, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(140, 83, 27, 0.2)',
                gap: 8,
              }}
            >
              <Text style={{ color: '#8C531B', fontSize: 13, fontWeight: '700' }}>
                HƯỚNG DẪN ĐẶT CƠ QUAN PHÁT ÂM:
              </Text>
              <Text style={{ color: COSMIC.ink, fontSize: 13, lineHeight: 20 }}>
                • <Text style={{ fontWeight: '700', color: '#FCD34D' }}>Vị trí lưỡi (Tongue):</Text> {sentence.mouthGuide.tongue}
              </Text>
              <Text style={{ color: COSMIC.ink, fontSize: 13, lineHeight: 20 }}>
                • <Text style={{ fontWeight: '700', color: '#FCD34D' }}>Hình dáng môi (Lips):</Text> {sentence.mouthGuide.lips}
              </Text>
              <Text style={{ color: COSMIC.ink, fontSize: 13, lineHeight: 20 }}>
                • <Text style={{ fontWeight: '700', color: '#FCD34D' }}>Răng (Teeth):</Text> {sentence.mouthGuide.teeth}
              </Text>
              <Text style={{ color: COSMIC.ink, fontSize: 13, lineHeight: 20 }}>
                • <Text style={{ fontWeight: '700', color: '#FCD34D' }}>Dây thanh quản (Vocal cords):</Text> {sentence.mouthGuide.vocalCords}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </HubScreen>
  );
}
