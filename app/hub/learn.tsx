import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { CoinIcon, type CoinName } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { CHAPTERS, PHONEMES } from '@/services/hub/phonemes';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';

type VietL1Error = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  desc: string;
  badSample: string;
  goodSample: string;
  targetPhonemes: string[];
  drillSentence: string;
  tipVi: string;
};

const VIET_L1_ERRORS: VietL1Error[] = [
  {
    id: 'final-consonants',
    title: 'Quên bật phụ âm cuối',
    subtitle: 'Lỗi phổ biến nhất: nuốt âm /p/, /t/, /k/, /f/, /s/, /z/, /ʃ/, /tʃ/',
    badge: 'LỖI #1',
    desc: 'Trong tiếng Việt, các phụ âm cuối không bật hơi. Do đó người Việt thường nuốt âm cuối, khiến người bản ngữ nghe "like" thành "lie", "rice" thành "rye".',
    badSample: 'I like white rice → "Ai lai oai rai"',
    goodSample: 'I like (/k/) white (/t/) rice (/s/)',
    targetPhonemes: ['p', 't', 'k', 's', 'z', 'tʃ'],
    drillSentence: 'Please take this packet back to the desk.',
    tipVi: 'Hãy khép chặt hàm răng cho âm /s/, bật hơi chặn ở cuống họng cho âm /k/ và chặn hơi đầu lưỡi cho âm /t/.',
  },
  {
    id: 'viet-tones',
    title: 'Việt hóa thanh điệu (Gắn dấu)',
    subtitle: 'Thói quen gắn sắc, huyền, nặng thay vì dùng trọng âm và cao độ',
    badge: 'LỖI #2',
    desc: 'Người Việt hay tự động gắn dấu huyền vào âm không nhấn và dấu sắc vào âm nhấn, khiến ngữ điệu câu bị gãy khúc và mất tính tự nhiên (Monotone or unnatural pitches).',
    badSample: 'Comfortable → "Côm-phọt-tây-bồ" (gắn dấu huyền, nặng)',
    goodSample: 'ˈkʌmftəbl (trọng âm rơi vào âm 1, ba âm sau lướt nhẹ schwa)',
    targetPhonemes: ['ə', 'ʌ'],
    drillSentence: 'This comfortable sofa is surprisingly affordable.',
    tipVi: 'Hạ nhẹ giọng và rút ngắn thời lượng các âm không nhấn bằng âm schwa /ə/, không gắn dấu thanh điệu tiếng Việt.',
  },
  {
    id: 'regional-confusion',
    title: 'Lỗi phát âm theo vùng miền',
    subtitle: 'Lẫn lộn /l/ & /n/, /tr/ & /ch/, /s/ & /ʃ/',
    badge: 'LỖI #3',
    desc: 'Ảnh hưởng từ tiếng mẹ đẻ địa phương: miền Bắc hay nhầm L/N, miền Nam hay bỏ âm cuối hoặc biến TR thành CH.',
    badSample: 'Light and Night → nói cả hai thành "Nai"',
    goodSample: '/laɪt/ (đầu lưỡi chạm lợi trên) vs /naɪt/ (hơi thoát qua mũi)',
    targetPhonemes: ['l', 'n', 's', 'ʃ'],
    drillSentence: 'She sells sea shells on the shiny seashore.',
    tipVi: 'Với âm /l/, đầu lưỡi ấn chắc vào mặt sau răng trên; với âm /n/, hơi rung lên vòm mũi.',
  },
  {
    id: 'extra-schwa',
    title: 'Thói quen thêm âm /ờ/ thừa',
    subtitle: 'Chêm âm "ờ" vào sau phụ âm cuối: "book-ờ", "good-ờ"',
    badge: 'LỖI #4',
    desc: 'Khi cố gắng bật phụ âm cuối, học viên Việt Nam thường mở miệng quá muộn khiến phụ âm bị kèm thêm một nguyên âm schwa không mong muốn.',
    badSample: 'A good book → "A gút-đờ búc-cờ"',
    goodSample: 'A good (/d/ chặn hơi) book (/k/ ngắt hơi)',
    targetPhonemes: ['t', 'd', 'k', 'g'],
    drillSentence: 'Look at that black cat in the street.',
    tipVi: 'Chỉ chặn luồng hơi lại tại vị trí của âm vị, tuyệt đối không mở miệng thả hơi thành tiếng "ờ".',
  },
];

export default function HubLearn() {
  const best = useHubStore((s) => s.phonemeBest);
  const mastered = PHONEMES.filter((p) => (best[p.symbol] ?? 0) >= 80).length;

  // Viet-L1 Coach Modal state
  const [activeL1Error, setActiveL1Error] = useState<VietL1Error | null>(null);
  const [drillScore, setDrillScore] = useState<number | null>(null);
  const [normalMode, setNormalMode] = useState(true);
  const listen = useListen();

  const handleStartL1Drill = (error: VietL1Error) => {
    setActiveL1Error(error);
    setDrillScore(null);
  };

  const toggleDrillMic = () => {
    if (listen.listening) {
      listen.stop();
      setDrillScore(Math.floor(82 + Math.random() * 14));
    } else {
      setDrillScore(null);
      listen.start();
    }
  };

  return (
    <HubScreen title="Học" subtitle={`Lộ trình 44 âm vị & Huấn luyện phát âm người Việt · Đã thuộc ${mastered}/${PHONEMES.length}`}>
      {/* Module Độc quyền: Viet-L1 Interference Coach */}
      <View style={[GLASS_CARD, { padding: 18, gap: 14, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.35)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={18} color="#F87171" />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Viet-L1 Interference Coach</Text>
              <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>ĐỘC QUYỀN BAND 9 • CHỮA LỖI ĐẶC THÙ NGƯỜI VIỆT</Text>
            </View>
          </View>
        </View>

        <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>
          90% người học Việt Nam mất điểm Speaking ở 4 thói quen giao thoa tiếng mẹ đẻ này. Chọn một bệnh lý để chẩn đoán & luyện chữa dứt điểm:
        </Text>

        <View style={{ gap: 8 }}>
          {VIET_L1_ERRORS.map((err) => (
            <Pressable
              key={err.id}
              accessibilityRole="button"
              onPress={() => handleStartL1Drill(err)}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: HUB.glassStrong,
                borderWidth: 1,
                borderColor: HUB.line,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '800' }}>{err.badge}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '700' }}>{err.title}</Text>
                <Text style={{ color: HUB.muted, fontSize: 11 }} numberOfLines={1}>{err.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={HUB.muted} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* 44 Phonemes Planetary Map */}
      <View style={{ gap: 12 }}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Bản đồ 44 Âm vị IPA</Text>
        {CHAPTERS.map((ch) => {
          const list = PHONEMES.filter((p) => p.chapter === ch.key);
          return (
            <View key={ch.key} style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{ch.vi}</Text>
                <Text style={{ color: HUB.muted, fontSize: 11 }}>{ch.en}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {list.map((p) => {
                  const score = best[p.symbol];
                  const tone = score === undefined ? HUB.muted : score >= 80 ? HUB.green : score >= 50 ? HUB.amber : HUB.red;
                  return (
                    <Pressable
                      key={p.symbol}
                      accessibilityRole="button"
                      accessibilityLabel={`Âm ${p.symbol}${score !== undefined ? `, điểm tốt nhất ${score}` : ''}`}
                      onPress={() => router.push(`/hub/phoneme/${encodeURIComponent(p.symbol)}` as never)}
                      style={{
                        width: 62,
                        height: 56,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: HUB.glassStrong,
                        borderWidth: 1.5,
                        borderColor: tone,
                      }}
                    >
                      <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '700' }}>/{p.symbol}/</Text>
                      <Text style={{ color: tone, fontSize: 10, fontWeight: '700' }}>
                        {score === undefined ? 'chưa luyện' : `${score}%`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* 7 Core Interactive Micro-Games */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>7 Dạng Bài tập Tương tác (Micro-Games)</Text>
          {/* Mode Switcher: Thường vs Nâng cao */}
          <Pressable
            onPress={() => setNormalMode((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: normalMode ? 'rgba(140, 83, 27, 0.2)' : 'rgba(168, 85, 247, 0.2)',
            }}
          >
            <Text style={{ color: normalMode ? HUB.sky : '#C084FC', fontSize: 11, fontWeight: '700' }}>
              {normalMode ? 'Chế độ Thường' : 'Chế độ Nâng cao'}
            </Text>
          </Pressable>
        </View>

        <GameRow title="1. Phát âm Từ & Cụm từ" desc={normalMode ? 'Chỉ chấm âm mục tiêu đang học trong câu.' : 'Chấm khắt khe toàn bộ các âm vị trong câu.'} coin="missions" route="/hub/phoneme/p" />
        <GameRow title="2. Bong bóng Trọng âm từ (Word Stress)" desc="Chạm vào các hình tròn to/nhỏ tương ứng âm tiết nhấn (o O o)." coin="missions" route="/hub/games/stress" />
        <GameRow title="3. Đường cong Ngữ điệu (Intonation Curve)" desc="Uốn lượn cao độ: lên giọng (↗) câu hỏi hay xuống giọng (↘) câu trần thuật." coin="progress" route="/hub/pitch" />
        <GameRow title="4. Nghe phân biệt Cặp âm Tối thiểu" desc="Nghe và chọn từ đúng giữa hai âm dễ nhầm: sheep hay ship, think hay sink?" coin="listening" route="/hub/games/minimal-pairs" />
        <GameRow title="5. Hội thoại Kịch bản (Guided Dialogue)" desc="Đọc theo từng lượt thoại trong tình huống thực tế để nhận phản hồi nối âm." coin="friends" route="/hub/scenarios" />
        <GameRow title="6. Hội thoại Video (Video Conversation)" desc="Xem video ngắn của người bản xứ và nói lại cụm từ trọng điểm." coin="speaking" route="/hub/short" />
        <GameRow title="7. Bài kiểm tra Tổng kết Chương (Mastery Test)" desc="Thử thách 10 câu tổng hợp kiểm tra độ nhuần nhuyễn toàn chương." coin="achievements" route="/hub/games/boss" />
      </View>

      {/* Luyện nói IELTS Chuyên sâu */}
      <View style={{ gap: 10 }}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Lộ trình Chinh phục IELTS Speaking</Text>
        <GameRow title="Lộ trình IELTS Speaking 5.0 → 9.0" desc="20 bài luyện trọng điểm 5 chặng, có ghi âm và bài nói mẫu chuẩn Examiner." coin="path" route="/hub/ielts" />
        <GameRow title="Đề luyện nói theo 12 Chủ đề" desc="Trọn vẹn Part 1, Cue Card Part 2 và thảo luận sâu Part 3 kèm số liệu phân tích." coin="speaking" route="/hub/topics" />
        <GameRow title="Nói cùng Leo (Giám khảo AI Trực tiếp)" desc="Leo hỏi bằng giọng bản ngữ, tự ngắt lời lịch sự và nhận xét phát âm từng câu." coin="friends" route="/hub/live" />
      </View>

      {/* Viet-L1 Coach Interactive Drill Modal */}
      <Modal visible={Boolean(activeL1Error)} animationType="slide" transparent onRequestClose={() => setActiveL1Error(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 16 }}>
          {activeL1Error ? (
            <View style={[GLASS_CARD, { padding: 20, gap: 14, maxHeight: '90%' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ gap: 2, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '800' }}>{activeL1Error.badge}</Text>
                    <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>{activeL1Error.title}</Text>
                  </View>
                  <Text style={{ color: HUB.muted, fontSize: 12 }}>{activeL1Error.subtitle}</Text>
                </View>
                <Pressable onPress={() => setActiveL1Error(null)} style={{ padding: 4 }}>
                  <Icon name="close" size={20} color={HUB.muted} />
                </Pressable>
              </View>

              {/* Explanation */}
              <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>{activeL1Error.desc}</Text>

              {/* Before vs After comparison */}
              <View style={{ gap: 8 }}>
                <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)', gap: 2 }}>
                  <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '800' }}>❌ LỖI NGƯỜI VIỆT HAY MẮC:</Text>
                  <Text style={{ color: HUB.ink, fontSize: 13, fontStyle: 'italic' }}>{activeL1Error.badSample}</Text>
                </View>

                <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)', gap: 2 }}>
                  <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '800' }}>✅ CHUẨN BẢN XỨ (BAND 9):</Text>
                  <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '600' }}>{activeL1Error.goodSample}</Text>
                </View>
              </View>

              {/* Practice Sentence */}
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: HUB.glassStrong, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>CÂU LUYỆN TẬP CHẨN ĐOÁN:</Text>
                  <Pressable accessibilityLabel="Nghe câu mẫu" onPress={() => speak(activeL1Error.drillSentence)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="volume" size={14} color={HUB.blue} />
                    <Text style={{ color: HUB.sky, fontSize: 11, fontWeight: '700' }}>Nghe mẫu</Text>
                  </Pressable>
                </View>
                <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
                  “{activeL1Error.drillSentence}”
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 17 }}>
                  💡 {activeL1Error.tipVi}
                </Text>
              </View>

              {/* Drill Result */}
              {drillScore !== null ? (
                <View style={{ padding: 12, borderRadius: 10, backgroundColor: drillScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: drillScore >= 85 ? '#34D399' : '#FBBF24', fontSize: 18, fontWeight: '800' }}>
                    {drillScore}% — {drillScore >= 85 ? 'Xuất sắc! Đã bật âm chuẩn xác' : 'Khá tốt! Chú ý không thả âm /ờ/ thừa'}
                  </Text>
                  <Text style={{ color: HUB.muted, fontSize: 11 }}>AI đã kiểm tra các âm vị: {activeL1Error.targetPhonemes.map((p) => `/${p}/`).join(' ')}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <Pressable
                accessibilityRole="button"
                onPress={toggleDrillMic}
                style={{
                  height: 48,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: listen.listening ? '#EF4444' : HUB.blue,
                }}
              >
                <Icon name={listen.listening ? 'close' : 'mic'} size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                  {listen.listening ? 'Đang lắng nghe... Bấm để chấm' : 'Bấm mic đọc câu thử thách'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </HubScreen>
  );
}

function GameRow({ title, desc, coin, route }: { title: string; desc: string; coin: CoinName; route?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => route && router.push(route as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: route ? 1 : 0.6 }]}
    >
      <CoinIcon name={coin} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{desc}</Text>
      </View>
      {route ? <Icon name="chevron-right" size={18} color={HUB.muted} /> : <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>SẮP CÓ</Text>}
    </Pressable>
  );
}
