import React from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';

export type ExamMode = 'simulation' | 'practice';

interface ExamModeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: ExamMode) => void;
  testTitle: string;
  questionCount?: number;
}

export function ExamModeModal({
  visible,
  onClose,
  onSelectMode,
  testTitle,
  questionCount = 40,
}: ExamModeModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(20, 15, 10, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 820,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 28,
            gap: 20,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            borderWidth: 1,
            borderColor: '#EFE5D8',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: '#E11D48', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>IELTS</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#945619', textTransform: 'uppercase', letterSpacing: 1 }}>
                  CHỌN PHƯƠNG THỨC LÀM BÀI
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: '#2A1808',
                  fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
                }}
              >
                {testTitle}
              </Text>
              <Text style={{ fontSize: 14, color: '#7C6552' }}>
                Chọn hình thức bạn muốn trải nghiệm hôm nay ({questionCount} câu hỏi · Cambridge & Actual Volumes)
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#FAF5EE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={18} color="#7C6552" />
            </Pressable>
          </View>

          {/* 2 Big Choice Cards */}
          <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
            {/* CARD 1: THI THỬ NHƯ THI THẬT */}
            <Pressable
              onPress={() => onSelectMode('simulation')}
              style={{
                flex: 1,
                minWidth: 340,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: '#E11D48',
                backgroundColor: '#FFF1F2',
                padding: 22,
                gap: 14,
                shadowColor: '#E11D48',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ backgroundColor: '#E11D48', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                    ★ CHUẨN THI THẬT IDP / BC
                  </Text>
                </View>
                <Text style={{ fontSize: 24 }}>🎓</Text>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 19, fontWeight: '900', color: '#881337' }}>
                  Thi Thử Như Thi Thật
                </Text>
                <Text style={{ fontSize: 13, color: '#9F1239', fontWeight: '600' }}>
                  Real Computer-delivered IELTS Exam
                </Text>
              </View>

              <View style={{ gap: 8, marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#E11D48', fontWeight: '900', fontSize: 14 }}>⏱</Text>
                  <Text style={{ fontSize: 13, color: '#4C0519', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>Bấm giờ chuẩn 60:00</Text> đếm ngược, tự nộp khi hết giờ
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#E11D48', fontWeight: '900', fontSize: 14 }}>🖥</Text>
                  <Text style={{ fontSize: 13, color: '#4C0519', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>Form chuẩn 100% CD-IELTS</Text>: Top bar đen, split screen
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#E11D48', fontWeight: '900', fontSize: 14 }}>📑</Text>
                  <Text style={{ fontSize: 13, color: '#4C0519', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>40 câu hỏi, cờ Review</Text>, chuyển Passage 1, 2, 3
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#E11D48', fontWeight: '900', fontSize: 14 }}>🔒</Text>
                  <Text style={{ fontSize: 13, color: '#4C0519', fontWeight: '600' }}>
                    Nghiêm ngặt, không lộ đáp án, chấm điểm Band chuẩn
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#E11D48',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                  VÀO PHÒNG THI THẬT →
                </Text>
              </View>
            </Pressable>

            {/* CARD 2: LUYỆN TẬP TỰ DO */}
            <Pressable
              onPress={() => onSelectMode('practice')}
              style={{
                flex: 1,
                minWidth: 340,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: '#8C531B',
                backgroundColor: '#FAF5EE',
                padding: 22,
                gap: 14,
                shadowColor: '#8C531B',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ backgroundColor: '#8C531B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>
                    TỰ DO · KHÔNG ÁP LỰC · HỌC SÂU
                  </Text>
                </View>
                <Text style={{ fontSize: 24 }}>📚</Text>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 19, fontWeight: '900', color: '#2A1808' }}>
                  Chế Độ Luyện Tập
                </Text>
                <Text style={{ fontSize: 13, color: '#7C6552', fontWeight: '600' }}>
                  Self-paced Practice & Deep Learning
                </Text>
              </View>

              <View style={{ gap: 8, marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#8C531B', fontWeight: '900', fontSize: 14 }}>⏳</Text>
                  <Text style={{ fontSize: 13, color: '#452A12', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>Thời gian linh hoạt</Text>, có nút Tạm dừng & Làm tiếp
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#8C531B', fontWeight: '900', fontSize: 14 }}>🧩</Text>
                  <Text style={{ fontSize: 13, color: '#452A12', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>Tùy chọn từng bài</Text>: Làm cả đề hoặc riêng Passage 1/2/3
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#8C531B', fontWeight: '900', fontSize: 14 }}>🔍</Text>
                  <Text style={{ fontSize: 13, color: '#452A12', fontWeight: '600' }}>
                    <Text style={{ fontWeight: '800' }}>Kiểm tra đáp án ngay</Text> sau mỗi câu để đối chiếu
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#8C531B', fontWeight: '900', fontSize: 14 }}>💡</Text>
                  <Text style={{ fontSize: 13, color: '#452A12', fontWeight: '600' }}>
                    Xem giải thích chi tiết, trích dẫn văn bản, tra từ vựng
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#8C531B',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                  BẮT ĐẦU LUYỆN TẬP →
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
