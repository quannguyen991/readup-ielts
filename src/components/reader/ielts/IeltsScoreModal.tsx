import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { useL } from '@/i18n/useL';

type Props = {
  visible: boolean;
  score: number;
  total: number;
  estimatedBand: number | null;
  onReviewDetail: () => void;
  onRetake: () => void;
  onClose: () => void;
};

export function IeltsScoreModal({
  visible,
  score,
  total,
  estimatedBand,
  onReviewDetail,
  onRetake,
  onClose,
}: Props) {
  const { L } = useL();
  if (!visible) return null;

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const incorrect = total - score;

  const cheer =
    pct >= 80
      ? { text: L('Xuất sắc! 🏆', 'Outstanding! 🏆'), color: 'text-emerald-600', bg: 'bg-emerald-50' }
      : pct >= 60
        ? { text: L('Khá lắm! ⭐', 'Good job! ⭐'), color: 'text-blue-600', bg: 'bg-blue-50' }
        : { text: L('Cần luyện thêm! 💪', 'Keep practicing! 💪'), color: 'text-rose-600', bg: 'bg-rose-50' };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          {/* Header */}
          <View className="items-center mb-5">
            <View className={`rounded-full px-3 py-1 mb-2 ${cheer.bg}`}>
              <Text className={`text-xs font-bold ${cheer.color}`}>{cheer.text}</Text>
            </View>
            <Text className="text-xl font-extrabold text-gray-900">
              {L('Kết quả bài Reading', 'Reading Test Results')}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {L('Hoàn thành bài kiểm tra IELTS Reading', 'IELTS Reading practice complete')}
            </Text>
          </View>

          {/* Band Score & Raw Score Card */}
          <View className="rounded-2xl bg-gray-50 border border-gray-100 p-5 items-center mb-5">
            {estimatedBand !== null ? (
              <View className="items-center mb-3">
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {L('Điểm ước tính', 'Estimated Band')}
                </Text>
                <Text className="text-4xl font-black text-rose-600 mt-1">
                  Band {estimatedBand.toFixed(1)}
                </Text>
              </View>
            ) : null}

            {/* Score pill counts */}
            <View className="w-full flex-row items-center justify-around border-t border-gray-200/80 pt-3">
              <View className="items-center">
                <Text className="text-xl font-extrabold text-emerald-600">{score}</Text>
                <Text className="text-[11px] font-medium text-gray-500">{L('Đúng', 'Correct')}</Text>
              </View>

              <View className="h-8 w-px bg-gray-200" />

              <View className="items-center">
                <Text className="text-xl font-extrabold text-rose-600">{incorrect}</Text>
                <Text className="text-[11px] font-medium text-gray-500">{L('Sai', 'Incorrect')}</Text>
              </View>

              <View className="h-8 w-px bg-gray-200" />

              <View className="items-center">
                <Text className="text-xl font-extrabold text-gray-900">{pct}%</Text>
                <Text className="text-[11px] font-medium text-gray-500">{L('Tỉ lệ', 'Accuracy')}</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-2.5">
            <Pressable
              onPress={onReviewDetail}
              className="w-full h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-sm"
            >
              <Icon name="search" size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text className="text-sm font-bold text-white">
                {L('Xem chi tiết từng câu & Chỉ lỗi sai', 'Review Answers & Explanations')}
              </Text>
            </Pressable>

            <View className="flex-row gap-2">
              <Pressable
                onPress={onRetake}
                className="flex-1 h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100"
              >
                <Text className="text-xs font-bold text-gray-700">
                  {L('Làm lại bài', 'Retake Test')}
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="flex-1 h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100"
              >
                <Text className="text-xs font-bold text-gray-700">
                  {L('Đóng', 'Close')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
