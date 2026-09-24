import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { LetterCellState } from '@/services/sentence/letter-cells';
import { color, paper } from '@/theme/tokens';

/**
 * Một ô chữ cái của bài chép chính tả.
 *
 * Ba chuyển động, mỗi cái trả lời một câu hỏi khác nhau của người đang gõ:
 *
 *   Gõ trúng   — ô nảy nhẹ một nhịp. Trả lời "máy có nhận phím vừa bấm không",
 *                câu hỏi mà một ô đứng im không trả lời được, nhất là khi chữ
 *                vừa gõ trùng chữ đang có sẵn.
 *   Gõ sai     — ô rung ngang hai nhịp. Rung là tín hiệu người ta ĐỌC ĐƯỢC MÀ
 *                KHÔNG CẦN NHÌN THẲNG vào ô đó, nên mắt đang ở chỗ khác vẫn
 *                biết có gì hỏng.
 *   Con trỏ    — viền ô sáng lên và nhấp nháy chậm, để biết phím tiếp theo sẽ
 *                rơi vào đâu.
 *
 * Rung CHỈ chạy khi lỗi vừa mới xuất hiện, không chạy lại mỗi lần React vẽ lại:
 * một ô rung suốt là thứ gây khó chịu chứ không còn là tín hiệu.
 */
export function LetterCell({
  char,
  state,
  caret,
  liveResult,
  celebrate = false,
  delayMs = 0,
  size = 32,
}: {
  char: string;
  state: LetterCellState;
  caret: boolean;
  liveResult: boolean;
  /** Cả câu đã đúng — ô chuyển xanh và nảy theo đợt sóng. */
  celebrate?: boolean;
  /** Độ trễ của ô này trong đợt sóng, tính theo vị trí chữ cái. */
  delayMs?: number;
  /** Bề ngang ô (px) — lưới tự thu nhỏ để từ dài nhất vừa một dòng, xem `fitCells`. */
  size?: number;
}) {
  const wrong = liveResult && state === 'wrong';
  const filled = char.length > 0;

  const pop = useSharedValue(filled ? 1 : 0.9);
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);

  /*
    Nảy khi ô vừa có chữ, xẹp lại khi bị xoá — và khi cả câu đã đúng thì nảy
    mạnh hơn một nhịp, lệch nhau theo vị trí chữ cái nên cả dãy chạy thành một
    đợt sóng từ trái sang phải. Nảy đồng loạt thì chỉ thấy cả khối giật một cái.

    MỘT EFFECT DUY NHẤT GHI VÀO `pop`. Tách thành hai effect thì thứ tự chạy
    quyết định ai thắng, và cái thua biến mất không để lại dấu vết nào.
  */
  useEffect(() => {
    pop.value = celebrate
      ? withDelay(
          delayMs,
          withSequence(
            withTiming(1.22, { duration: 130, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) }),
          ),
        )
      : filled
        ? withSequence(
            withTiming(1.18, { duration: 90, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
          )
        : withTiming(0.9, { duration: 120 });
  }, [celebrate, delayMs, filled, char, pop]);

  // Rung đúng một lần, ngay lúc ô chuyển sang sai.
  useEffect(() => {
    if (!wrong) {
      shake.value = 0;
      return;
    }
    shake.value = withSequence(
      withTiming(-3, { duration: 45 }),
      withTiming(3, { duration: 45 }),
      withTiming(-2, { duration: 45 }),
      withTiming(2, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }, [wrong, shake]);

  // Con trỏ thở chậm; ô không phải con trỏ thì tắt hẳn.
  useEffect(() => {
    if (!caret) {
      glow.value = withTiming(0, { duration: 150 });
      return;
    }
    glow.value = withRepeat(withTiming(1, { duration: 620 }), -1, true);
  }, [caret, glow]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { translateX: shake.value }],
    borderWidth: celebrate || caret || filled || wrong ? 1.6 : 1,
    borderColor: celebrate
      ? color.success
      : wrong
        ? color.danger
        : caret
          ? paper.brandMid
          : filled
            ? paper.fillEdge
            : paper.brandSoft,
    backgroundColor: celebrate
      ? color.successSoft
      : wrong
        ? color.dangerSoft
        : filled
          ? paper.fill
          : '#FBFCFA',
    // Đang ăn mừng thì tắt nhịp thở của con trỏ: hai chuyển động cùng lúc trên
    // cùng một ô làm cả hai trông như lỗi vẽ.
    opacity: caret && !celebrate ? 0.72 + glow.value * 0.28 : 1,
  }));

  /*
    Kích thước đặt trong `style`, KHÔNG dùng `className`.

    NativeWind không gắn được className vào `Animated.View` của Reanimated, nên
    lớp `h-9 w-8` bị bỏ qua lặng lẽ và ô co lại còn bằng chữ bên trong — trông
    như một dãy chấm. Đây là lỗi đã gặp thật, không phải đề phòng.
  */
  return (
    <Animated.View
      style={[
        {
          height: Math.round(size * 1.125),
          width: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size >= 24 ? 8 : 5,
          borderStyle: 'solid',
        },
        style,
      ]}
    >
      <Text
        className="font-strong text-body"
        style={{ color: celebrate ? color.success : wrong ? color.danger : paper.ink, ...(size < 24 ? { fontSize: Math.max(10, Math.round(size * 0.62)), lineHeight: Math.round(size * 1.05) } : null) }}
      >
        {char}
      </Text>
    </Animated.View>
  );
}
