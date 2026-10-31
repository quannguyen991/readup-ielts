import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

type Props = {
  title: string;
  subtitle?: string;
  onExit: () => void;
  timerSlot?: React.ReactNode;
  timerText?: string;
  onCycleSize?: () => void;
  onToggleFlag?: () => void;
  isFlagged?: boolean;
  onToggleTheme?: () => void;
  isDark?: boolean;
  isReviewMode?: boolean;
  scoreText?: string;
};

export function IeltsExamHeader({
  title,
  subtitle = 'Làm bài passage 1',
  onExit,
  timerSlot,
  timerText,
  onCycleSize,
  onToggleFlag,
  isFlagged = false,
  onToggleTheme,
  isDark = false,
  isReviewMode = false,
  scoreText,
}: Props) {
  return (
    <View className="h-14 w-full flex-row items-center justify-between border-b border-gray-200 bg-white px-4 select-none">
      {/* Left: [ ✕ ] + Title & subtitle */}
      <View className="flex-row items-center gap-3">
        {/* Close button */}
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel="Thoát"
          className="h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100"
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth={2.2} strokeLinecap="round">
            <Line x1="18" y1="6" x2="6" y2="18" />
            <Line x1="6" y1="6" x2="18" y2="18" />
          </Svg>
        </Pressable>

        {/* Title & subtitle */}
        <View className="justify-center">
          <Text className="text-[13.5px] font-bold text-gray-900 leading-tight">
            {title}
          </Text>
          <Text className="text-[11px] text-gray-500 leading-tight mt-0.5">
            {isReviewMode ? (scoreText ?? 'Xem lại kết quả & giải thích') : subtitle}
          </Text>
        </View>
      </View>

      {/* Center: Blue clock + 59:58 timer */}
      <View className="flex-row items-center justify-center">
        {timerSlot ? (
          timerSlot
        ) : (
          <View className="flex-row items-center gap-1.5">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Line x1="12" y1="6" x2="12" y2="12" />
              <Line x1="12" y1="12" x2="16" y2="14" />
            </Svg>
            <Text className="text-[13.5px] font-medium text-gray-800 tabular-nums">
              {timerText || '59:58'}
            </Text>
          </View>
        )}
      </View>

      {/* Right: Aa + Flag + Moon */}
      <View className="flex-row items-center gap-4">
        {/* Aa button */}
        <Pressable
          onPress={onCycleSize}
          accessibilityRole="button"
          accessibilityLabel="Cỡ chữ"
          className="h-8 items-center justify-center px-1 hover:opacity-75"
        >
          <Text className="text-[13.5px] font-medium text-gray-600">Aa</Text>
        </Pressable>

        {/* Flag button */}
        <Pressable
          onPress={onToggleFlag}
          accessibilityRole="button"
          accessibilityLabel="Đánh dấu"
          className="h-8 w-8 items-center justify-center hover:opacity-75"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill={isFlagged ? '#EF4444' : 'none'} stroke={isFlagged ? '#EF4444' : '#6B7280'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <Line x1="4" y1="22" x2="4" y2="15" />
          </Svg>
        </Pressable>

        {/* Moon / Night mode icon */}
        <Pressable
          onPress={onToggleTheme}
          accessibilityRole="button"
          accessibilityLabel="Giao diện sáng tối"
          className="h-8 w-8 items-center justify-center hover:opacity-75"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}
