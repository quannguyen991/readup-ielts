import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { EXAM_INK } from './ExamToolbar';

/**
 * Đồng hồ đếm ngược của phòng thi, nằm trong thanh công cụ (`timerSlot`).
 *
 * Tự giữ giây của nó, nên mỗi giây không làm cả màn đọc dựng lại. Có `endAt` thì
 * đồng hồ bám theo giờ thật và gọi `onExpire` đúng một lần khi hết giờ; không có thì
 * đếm từ `startSeconds` và dừng khi `paused`.
 */
export function ExamClock({
  paused = false,
  onToggle,
  endAt,
  onExpire,
  startSeconds = 20 * 60,
}: {
  paused?: boolean;
  onToggle?: () => void;
  /** Mốc kết thúc tuyệt đối (ms). */
  endAt?: number;
  /** Gọi đúng một lần khi hết giờ. */
  onExpire?: () => void;
  startSeconds?: number;
}) {
  const [left, setLeft] = useState(() => (endAt !== undefined ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : startSeconds));
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    if (endAt !== undefined) {
      let fired = false;
      const tick = () => {
        const s = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setLeft(s);
        if (s <= 0 && !fired) {
          fired = true;
          expireRef.current?.();
        }
      };
      tick();
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    }
    if (paused) return;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, endAt]);

  const label = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  return (
    <Pressable
      onPress={onToggle}
      disabled={!onToggle}
      accessibilityRole="button"
      accessibilityLabel={paused ? 'Chạy tiếp đồng hồ' : 'Tạm dừng đồng hồ'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        height: 34,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: EXAM_INK,
        backgroundColor: '#FFFFFF',
        opacity: paused ? 0.6 : 1,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: EXAM_INK, fontVariant: ['tabular-nums'] as never }}>{label}</Text>
    </Pressable>
  );
}
