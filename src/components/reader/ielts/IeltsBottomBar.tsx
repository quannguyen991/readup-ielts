import React, { useRef, useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

export type QuestionNavItem = {
  id: string;
  number: number;
  answered: boolean;
  marked?: boolean;
  isCorrect?: boolean;
};

type Props = {
  items: QuestionNavItem[];
  activeNumber: number;
  onSelectNumber: (number: number) => void;
  isReviewMode?: boolean;
  passageTitle?: string;
  totalScore?: { correct: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  onShowSummary?: () => void;
};

export function IeltsBottomBar({
  items,
  activeNumber,
  onSelectNumber,
  isReviewMode = false,
  passageTitle = 'Passage 1',
  totalScore,
  onPrev,
  onNext,
  onSubmit,
  submitting = false,
  hasPrev = true,
  hasNext = true,
  nextLabel = '7 - 13 →',
  prevLabel = '←',
  onShowSummary,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const answeredCount = items.filter((i) => i.answered).length;
  const correctCount = totalScore ? totalScore.correct : items.filter((i) => i.isCorrect).length;
  const totalCount = totalScore ? totalScore.total : items.length;

  useEffect(() => {
    if (activeNumber > 0 && scrollRef.current) {
      const x = Math.max(0, (activeNumber - 1) * 32 - 100);
      scrollRef.current.scrollTo({ x, animated: true });
    }
  }, [activeNumber]);

  return (
    <View className="h-14 w-full flex-row items-center justify-between border-t border-gray-200 bg-white px-4 select-none">
      {/* Left: 3x3 Grid button + "Passage 1 / Đã làm 0 / 13" */}
      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={onShowSummary}
          accessibilityRole="button"
          accessibilityLabel="Danh sách câu"
          className="h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100"
        >
          <Svg width={14} height={14} viewBox="0 0 16 16" fill="#4B5563">
            <Rect x="1" y="1" width="3" height="3" rx="0.5" />
            <Rect x="6.5" y="1" width="3" height="3" rx="0.5" />
            <Rect x="12" y="1" width="3" height="3" rx="0.5" />
            <Rect x="1" y="6.5" width="3" height="3" rx="0.5" />
            <Rect x="6.5" y="6.5" width="3" height="3" rx="0.5" />
            <Rect x="12" y="6.5" width="3" height="3" rx="0.5" />
            <Rect x="1" y="12" width="3" height="3" rx="0.5" />
            <Rect x="6.5" y="12" width="3" height="3" rx="0.5" />
            <Rect x="12" y="12" width="3" height="3" rx="0.5" />
          </Svg>
        </Pressable>

        <View className="justify-center">
          <Text className="text-[12.5px] font-bold text-gray-900 leading-tight">
            {isReviewMode ? 'Tất cả câu hỏi' : passageTitle}
          </Text>
          <Text className="text-[11px] text-gray-400 leading-tight mt-0.5">
            {isReviewMode
              ? `Làm đúng ${correctCount} / ${totalCount}`
              : `Đã làm ${answeredCount} / ${totalCount}`}
          </Text>
        </View>
      </View>

      {/* Center: Scrollable pills container */}
      <View className="flex-1 mx-3 overflow-hidden">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', gap: 4, paddingHorizontal: 4 }}
        >
          {/* Passage 1 pill */}
          <View className="rounded-full border border-[#EF4444] bg-white px-2.5 py-0.5 mr-1">
            <Text className="text-[11.5px] font-bold text-[#DC2626]">Passage 1</Text>
          </View>

          {/* Question Number Circles */}
          {items.map((it) => {
            const isCurrent = it.number === activeNumber;

            let pillBg = 'border-gray-300 bg-white';
            let textColor = 'text-gray-700';

            if (isReviewMode) {
              if (it.isCorrect) {
                pillBg = 'border-[#10B981] bg-[#10B981]';
                textColor = 'text-white';
              } else {
                pillBg = 'border-[#F87171] bg-[#F87171]';
                textColor = 'text-white';
              }
            } else if (it.answered) {
              pillBg = 'border-blue-400 bg-blue-50';
              textColor = 'text-blue-700 font-bold';
            }

            return (
              <Pressable
                key={it.id || it.number}
                onPress={() => onSelectNumber(it.number)}
                className={`h-6 w-6 min-w-[24px] items-center justify-center rounded-full border ${pillBg} ${
                  isCurrent ? 'ring-2 ring-gray-800 ring-offset-1' : ''
                }`}
              >
                <Text className={`text-[11px] font-semibold ${textColor}`}>
                  {it.number}
                </Text>
              </Pressable>
            );
          })}

          {/* P2, P3 tabs */}
          <View className="flex-row items-center gap-1.5 ml-1">
            <View className="h-6 px-1.5 items-center justify-center">
              <Text className="text-[11.5px] font-medium text-gray-400">P2</Text>
            </View>
            <View className="h-6 px-1.5 items-center justify-center">
              <Text className="text-[11.5px] font-medium text-gray-400">P3</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Right: Red solid button "7 - 13 →" or "Trước / Tiếp" */}
      <View className="flex-row items-center gap-2">
        {isReviewMode ? (
          <>
            <Pressable
              onPress={onPrev}
              disabled={!hasPrev}
              className={`h-8 px-3 items-center justify-center rounded-md border border-gray-300 bg-white ${
                !hasPrev ? 'opacity-40' : 'hover:bg-gray-50'
              }`}
            >
              <Text className="text-xs font-semibold text-gray-700">Trước</Text>
            </Pressable>

            <Pressable
              onPress={onNext}
              disabled={!hasNext}
              className={`h-8 px-3.5 items-center justify-center rounded-md bg-[#DC2626] ${
                !hasNext ? 'opacity-40' : 'hover:bg-red-700'
              }`}
            >
              <Text className="text-xs font-bold text-white">Tiếp</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={onNext || onSubmit}
            disabled={submitting}
            className="h-8 px-4 items-center justify-center rounded-md bg-[#DC2626] hover:bg-red-700 active:bg-red-800"
          >
            <Text className="text-xs font-bold text-white tracking-wide">
              {submitting ? 'Đang nộp…' : nextLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
