import { useEffect, useLayoutEffect, useRef } from 'react';

import { useGameFx } from '@/store/useGameFx';

/**
 * Màn học đăng ký "Gợi ý của Cú" cho câu đang mở.
 *
 * `handler` trả về true nếu đã gợi ý được (lúc ấy mới trừ một lượt Cú), false nếu
 * câu này không còn gì để gợi ý. Truyền `null` khi câu hiện tại không nhận gợi ý
 * (đã trả lời, lật thẻ…) — nút Hỏi Cú sẽ mờ đi.
 *
 * GỢI Ý DO MÃ TÍNH, KHÔNG HỎI AI: bỏ hai phương án sai, hay lộ vài chữ cái đầu —
 * đáp án đã có sẵn trong câu hỏi.
 */
export function useOwlHint(handler: (() => boolean) | null): void {
  const ref = useRef(handler);
  useLayoutEffect(() => {
    ref.current = handler;
  });
  const active = handler !== null;
  useEffect(() => {
    if (!active) return;
    const fn = () => ref.current?.() ?? false;
    useGameFx.getState().setHint(fn);
    return () => {
      if (useGameFx.getState().hint === fn) useGameFx.getState().setHint(null);
    };
  }, [active]);
}
