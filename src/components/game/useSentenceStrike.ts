import { useCallback, useRef } from 'react';

import { useGameStore, type GameSource } from '@/store/useGameStore';

/**
 * Chấm MỘT câu dài (chép chính tả, dịch câu, chép theo video) cho game đúng một
 * lần, ở đúng lúc câu được phân xử — không phải lúc bấm sang câu sau:
 *
 *   - gõ đúng trọn câu     → `strike(true)`: tia nạp đòn chạm quái, nhát chém bổ xuống;
 *   - bấm "Xem đáp án"     → `strike(false)`: bỏ cuộc thì trúng đòn;
 *   - xong nhờ gợi ý miễn phí → `strike(null)`: không chém, không mất tim.
 *
 * Gọi lần hai cho cùng `key` thì bỏ qua, nên nơi gọi không phải tự giữ cờ.
 */
export function useSentenceStrike(key: string, source: GameSource): (result: boolean | null) => void {
  const scored = useRef<string | null>(null);
  return useCallback(
    (result: boolean | null) => {
      if (scored.current === key) return;
      scored.current = key;
      if (result !== null) useGameStore.getState().answer(result, source);
    },
    [key, source],
  );
}
