import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { PHONEMES, type Phoneme } from '@/services/hub/phonemes';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';
import { useVocabStore } from '@/store/useVocabStore';

type Dimension = {
  name: string;
  nameEn: string;
  score: number;
};

const RADAR_DIMENSIONS: Dimension[] = [
  { name: 'Phát âm', nameEn: 'Pronunciation', score: 80 },
  { name: 'Ngữ điệu', nameEn: 'Intonation', score: 78 },
  { name: 'Lưu loát', nameEn: 'Fluency', score: 85 },
  { name: 'Ngữ pháp', nameEn: 'Grammar', score: 84 },
  { name: 'Từ vựng', nameEn: 'Vocabulary', score: 82 },
  { name: 'Mạch lạc', nameEn: 'Coherence', score: 83 },
];

export default function HubProgress() {
  const best = useHubStore((s) => s.phonemeBest);
  const tries = useHubStore((s) => s.phonemeTries);
  const trophyScore = useHubStore((s) => s.trophyScore);
  const wordBookmarks = useHubStore((s) => s.wordBookmarks);
  const saved = useHubStore((s) => s.saved);
  const mentorRequests = useHubStore((s) => s.mentorRequests);
  const requestMentor = useHubStore((s) => s.requestMentor);

  // Sub-tabs for Leaderboard vs Saved Bookmarks
  const [bottomTab, setBottomTab] = useState<'leaderboard' | 'bookmarks'>('leaderboard');

  // Phoneme detail & mentor escalation modal
  const [selectedPhoneme, setSelectedPhoneme] = useState<Phoneme | null>(null);
  const [escalationStep, setEscalationStep] = useState<'view' | 'recording' | 'submitted'>('view');
  const [mentorRecordTimer, setMentorRecordTimer] = useState(5);

  const listen = useListen();

  const handleOpenPhoneme = (p: Phoneme) => {
    setSelectedPhoneme(p);
    setEscalationStep('view');
  };

  const handleStartMentorRecording = () => {
    setEscalationStep('recording');
    setMentorRecordTimer(5);
    listen.start();
    const interval = setInterval(() => {
      setMentorRecordTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          listen.stop();
          if (selectedPhoneme) requestMentor(selectedPhoneme.symbol);
          setEscalationStep('submitted');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  return (
    <HubScreen title="Tiến độ" subtitle="Báo cáo năng lực 6 chiều · Ma trận 44 âm & Giải đấu">
      {/* 0. Hàng chỉ số nhanh — lấy từ dữ liệu thật trong store */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Âm đã vững', value: `${Object.values(best).filter((v) => v >= 80).length}/${PHONEMES.length}`, tone: '#16A34A', bg: '#DCFCE7' },
          { label: 'Lượt luyện âm', value: String(Object.values(tries).reduce((a, b) => a + b, 0)), tone: '#8C531B', bg: '#FDF1E0' },
          { label: 'Cúp', value: String(trophyScore), tone: '#B45309', bg: '#FEF3C7' },
          { label: 'Đã lưu', value: String(wordBookmarks.length + saved.length), tone: '#0369A1', bg: '#E0F2FE' },
        ].map((x) => (
          <View key={x.label} style={[GLASS_CARD, { flexBasis: '47%', flexGrow: 1, padding: 14, gap: 4 }]}>
            <Text style={{ color: HUB.muted, fontSize: 12, fontWeight: '700' }}>{x.label}</Text>
            <Text style={{ color: x.tone, fontSize: 24, fontWeight: '900' }}>{x.value}</Text>
            <View style={{ alignSelf: 'flex-start', height: 4, width: 36, borderRadius: 2, backgroundColor: x.bg }} />
          </View>
        ))}
      </View>

      {/* 1. Biểu đồ Radar 6 Đỉnh & Điểm Dự đoán (Proficiency Radar & Band Predictor) */}
      <View style={[GLASS_CARD, { padding: 18, gap: 14, borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Biểu đồ Năng lực 6 Chiều</Text>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>Chuẩn đánh giá quốc tế CEFR & IELTS Examiner</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(14, 165, 233, 0.25)', borderWidth: 1, borderColor: '#8C531B' }}>
              <Text style={{ color: '#8C531B', fontSize: 14, fontWeight: '800' }}>IELTS 7.5 • C1</Text>
            </View>
            <Text style={{ color: '#16A34A', fontSize: 10, fontWeight: '700' }}>EPS: 82/100</Text>
          </View>
        </View>

        {/* 6-Axis Visual Dimension Grid */}
        <View style={{ gap: 10 }}>
          {RADAR_DIMENSIONS.map((dim) => (
            <View key={dim.name} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>{dim.name}</Text>
                  <Text style={{ color: HUB.muted, fontSize: 11 }}>({dim.nameEn})</Text>
                </View>
                <Text style={{ color: dim.score >= 80 ? '#16A34A' : '#B45309', fontSize: 13, fontWeight: '800' }}>
                  {dim.score}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(120, 68, 21, 0.08)', overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${dim.score}%`,
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: dim.score >= 80 ? '#0284C7' : '#F59E0B',
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 2. Ma trận 44 Âm vị IPA & Nút Cầu cứu Mentor */}
      <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Ma trận 44 Âm vị IPA</Text>
            <Text style={{ color: HUB.muted, fontSize: 11 }}>Chạm vào âm đỏ để kích hoạt 1-Click Mentor Escalation</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: HUB.green }} />
              <Text style={{ color: HUB.muted, fontSize: 10 }}>&gt;80%</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: HUB.amber }} />
              <Text style={{ color: HUB.muted, fontSize: 10 }}>50-79%</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: HUB.red }} />
              <Text style={{ color: HUB.muted, fontSize: 10 }}>&lt;50%</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PHONEMES.map((p) => {
            const s = best[p.symbol];
            const isRed = s !== undefined && s < 50;
            const tone = s === undefined ? HUB.line : s >= 80 ? HUB.green : s >= 50 ? HUB.amber : HUB.red;

            return (
              <Pressable
                key={p.symbol}
                accessibilityRole="button"
                accessibilityLabel={`Âm ${p.symbol}, ${s ?? 0} điểm`}
                onPress={() => handleOpenPhoneme(p)}
                style={{
                  width: 50,
                  height: 48,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isRed ? 'rgba(239, 68, 68, 0.2)' : s === undefined ? HUB.glass : `${tone}26`,
                  borderWidth: 1.5,
                  borderColor: isRed ? '#EF4444' : tone,
                }}
              >
                <Text style={{ color: isRed ? '#DC2626' : HUB.ink, fontSize: 14, fontWeight: '700' }}>
                  /{p.symbol}/
                </Text>
                <Text style={{ color: isRed ? '#B91C1C' : HUB.muted, fontSize: 9, fontWeight: '700' }}>
                  {s === undefined ? '—' : `${s}%`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Bảng Xếp hạng Giải đấu (10000+) & Kho Bookmark */}
      <View style={{ gap: 10 }}>
        {/* Toggle between Leaderboard & Bookmarks */}
        <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: HUB.glass, borderWidth: 1, borderColor: HUB.line }}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: bottomTab === 'leaderboard' }}
            onPress={() => setBottomTab('leaderboard')}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: bottomTab === 'leaderboard' ? HUB.glassStrong : 'transparent',
            }}
          >
            <Icon name="star" size={16} color={bottomTab === 'leaderboard' ? '#B45309' : HUB.muted} />
            <Text style={{ color: bottomTab === 'leaderboard' ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: '700' }}>
              Giải đấu Kim Cương ({trophyScore} 🏆)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: bottomTab === 'bookmarks' }}
            onPress={() => setBottomTab('bookmarks')}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: bottomTab === 'bookmarks' ? HUB.glassStrong : 'transparent',
            }}
          >
            <Icon name="bookmark" size={16} color={bottomTab === 'bookmarks' ? HUB.sky : HUB.muted} />
            <Text style={{ color: bottomTab === 'bookmarks' ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: '700' }}>
              Kho Đã lưu ({wordBookmarks.length + saved.length})
            </Text>
          </Pressable>
        </View>

        {bottomTab === 'leaderboard' ? (
          <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Bảng Xếp Hạng Tuần Này</Text>
              <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '800' }}>🏆 Giải 10,000+</Text>
            </View>

            {[
              { rank: 1, name: 'Hoàng Nam (IELTS 8.5)', points: 12450, isMe: false },
              { rank: 2, name: 'Minh Anh (SAT 1520)', points: 11820, isMe: false },
              { rank: 3, name: 'Bạn (Learner)', points: trophyScore, isMe: true },
              { rank: 4, name: 'Phương Thảo', points: 9980, isMe: false },
              { rank: 5, name: 'Bảo Long', points: 9420, isMe: false },
            ].map((r) => (
              <View
                key={r.rank}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: r.isMe ? 'rgba(14, 165, 233, 0.2)' : HUB.glassStrong,
                  borderWidth: r.isMe ? 1 : 0,
                  borderColor: '#8C531B',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ color: r.rank <= 3 ? '#B45309' : HUB.muted, fontSize: 14, fontWeight: '800' }}>
                    #{r.rank}
                  </Text>
                  <Text style={{ color: r.isMe ? '#8C531B' : HUB.ink, fontSize: 13, fontWeight: r.isMe ? '800' : '600' }}>
                    {r.name}
                  </Text>
                </View>
                <Text style={{ color: '#B45309', fontSize: 13, fontWeight: '800' }}>{r.points} 🏆</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Từ vựng & Bộ học đã lưu</Text>
            {wordBookmarks.length === 0 && saved.length === 0 ? (
              <Text style={{ color: HUB.muted, fontSize: 12 }}>Bạn chưa lưu từ vựng hay bộ học nào.</Text>
            ) : null}

            {wordBookmarks.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>TỪ VỰNG TỪ ĐIỂN ĐÃ BOOKMARK:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {wordBookmarks.map((w) => (
                    <Pressable
                      key={w}
                      onPress={() => speak(w)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: HUB.glassStrong,
                        borderWidth: 1,
                        borderColor: HUB.line,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Text style={{ color: HUB.sky, fontSize: 12, fontWeight: '700' }}>{w}</Text>
                      <Icon name="volume" size={12} color={HUB.muted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Phoneme Detail & 1-Click Mentor Escalation Modal */}
      <Modal visible={Boolean(selectedPhoneme)} animationType="slide" transparent onRequestClose={() => setSelectedPhoneme(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(9, 10, 26, 0.88)', justifyContent: 'center', padding: 18 }}>
          {selectedPhoneme ? (
            <View style={[GLASS_CARD, { padding: 20, gap: 14 }]}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '800' }}>/{selectedPhoneme.symbol}/</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: HUB.glassStrong }}>
                    <Text style={{ color: HUB.muted, fontSize: 11 }}>{selectedPhoneme.group}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedPhoneme(null)} style={{ padding: 4 }}>
                  <Icon name="close" size={20} color={HUB.muted} />
                </Pressable>
              </View>

              {/* Tips & Examples */}
              <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>{selectedPhoneme.tipVi}</Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {selectedPhoneme.examples.map(([word, ipa]) => (
                  <Pressable
                    key={word}
                    onPress={() => speak(word)}
                    style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: HUB.glassStrong, alignItems: 'center', gap: 2 }}
                  >
                    <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '700' }}>{word}</Text>
                    <Text style={{ color: HUB.sky, fontSize: 11 }}>{ipa}</Text>
                  </Pressable>
                ))}
              </View>

              {/* 1-Click Mentor Escalation Section for Red Phonemes (<50%) */}
              {(best[selectedPhoneme.symbol] ?? 0) < 50 || mentorRequests[selectedPhoneme.symbol] ? (
                <View style={{ padding: 14, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1.5, borderColor: '#EF4444', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>🚨</Text>
                    <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '800' }}>
                      ĐIỂM YẾU BÁO ĐỘNG ({best[selectedPhoneme.symbol] ?? 45}%)
                    </Text>
                  </View>

                  <Text style={{ color: HUB.body, fontSize: 12, lineHeight: 17 }}>
                    Bạn đang gặp trở ngại với âm /{selectedPhoneme.symbol}/. Bạn có thể nhờ Mentor Band 8.5+ thị phạm và gửi nhận xét cá nhân.
                  </Text>

                  {escalationStep === 'view' ? (
                    <Pressable
                      onPress={handleStartMentorRecording}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#EF4444',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                        🔥 Nhờ Mentor Band 8.5+ sửa giúp (Ghi âm 5s)
                      </Text>
                    </Pressable>
                  ) : escalationStep === 'recording' ? (
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '800' }}>
                        Đang thu âm: {mentorRecordTimer}s còn lại...
                      </Text>
                      <Text style={{ color: HUB.muted, fontSize: 11 }}>Hãy đọc to 2 từ ví dụ phía trên.</Text>
                    </View>
                  ) : (
                    <View style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: '#16A34A', fontSize: 13, fontWeight: '800' }}>
                        ✓ Đã gửi bản ghi âm thành công!
                      </Text>
                      <Text style={{ color: HUB.muted, fontSize: 11, textAlign: 'center' }}>
                        Mentor Band 8.5+ sẽ phản hồi thị phạm âm /{selectedPhoneme.symbol}/ trong vòng 15 phút.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Regular AI Practice Button */}
              <Pressable
                onPress={() => {
                  setSelectedPhoneme(null);
                  router.push(`/hub/phoneme/${encodeURIComponent(selectedPhoneme.symbol)}` as never);
                }}
                style={{
                  height: 46,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HUB.blue,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Luyện lại với AI</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </HubScreen>
  );
}
