import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ielts/SourceCover';
import { color } from '@/theme/tokens';

export type ExamMode = 'simulation' | 'practice';

interface ExamModeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: ExamMode) => void;
  testTitle: string;
  questionCount?: number;
  initialMode?: ExamMode;
}

const OPTIONS: { mode: ExamMode; title: string; sub: string; points: string[] }[] = [
  {
    mode: 'simulation',
    title: 'Thi thử như thi thật',
    sub: '',
    points: ['Đồng hồ đếm ngược, tự nộp khi hết giờ', 'Chấm điểm theo band'],
  },
  {
    mode: 'practice',
    title: 'Luyện tập tự do',
    sub: '',
    points: ['Không giới hạn thời gian', 'Xem đáp án và giải thích'],
  },
];

/** Hộp chọn chế độ làm bài: chọn một thẻ rồi bấm "Bắt đầu làm bài". */
export function ExamModeModal({ visible, onClose, onSelectMode, testTitle, questionCount = 40, initialMode = 'simulation' }: ExamModeModalProps) {
  const [mode, setMode] = useState<ExamMode>(initialMode);
  useEffect(() => {
    if (visible) setMode(initialMode);
  }, [visible, initialMode]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(30, 22, 60, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 760,
            maxHeight: '92%',
            borderRadius: 22,
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: color.border,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: color.border }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: color.ink }} numberOfLines={2}>{testTitle}</Text>
              <Text style={{ fontSize: 12, color: color.muted, fontWeight: '500' }}>{questionCount} câu</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              style={({ hovered }: { hovered?: boolean }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hovered ? color.primarySoft : color.surfaceAlt,
              })}
            >
              <Icon name="close" size={16} color={color.body} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {OPTIONS.map((option) => {
                const on = mode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => setMode(option.mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={{
                      flex: 1,
                      flexBasis: 280,
                      gap: 12,
                      padding: 18,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: on ? color.primaryDark : color.border,
                      backgroundColor: on ? color.primarySoft : color.surface,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: on ? 6 : 2,
                          borderColor: on ? color.primaryDark : color.borderStrong,
                          backgroundColor: color.surface,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: color.ink }}>{option.title}</Text>
                      </View>
                    </View>
                    <View style={{ gap: 8 }}>
                      {option.points.map((point) => (
                        <View key={point} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          <Icon name="check" size={14} color={color.success} />
                          <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: color.body }}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: color.border }}>
            <Pressable
              onPress={() => onSelectMode(mode)}
              accessibilityRole="button"
              style={({ hovered }: { hovered?: boolean }) => ({
                height: 46,
                paddingHorizontal: 32,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hovered ? color.primary : color.primaryDark,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: color.white }}>Bắt đầu làm bài</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
