import React from 'react';

import { CatPose, CatSticker } from './CatSticker';

/**
 * MÈO BÁM LÊN TÁC VỤ — một con mèo đứng trên mép trên của một ô (thẻ, ô khu vực, ô kỹ năng).
 * Tư thế ngồi hoặc cuộn nằm trên viền; tư thế thò tay, thò đầu (hangingPaws, peeking) lấn xuống một
 * chút để chân bám vào viền.
 *
 * Đặt làm con trực tiếp của ô đó. Ô không được cắt tràn (overflow hidden) thì phần trên của mèo mới hiện.
 */

/** Tư thế bám qua viền: lấn xuống viền để tay hoặc đầu nằm trên mép. */
const CLINGING: CatPose[] = ['hangingPaws', 'peeking', 'clingHang', 'clingPeek', 'clingWave', 'clingClimb'];

export function PerchCat({
  pose,
  size = 60,
  side = 'right',
  inset = 16,
  offset = 0,
}: {
  pose: CatPose;
  size?: number;
  side?: 'left' | 'right';
  /** Khoảng cách từ mép ô tới mèo. */
  inset?: number;
  /** Mép trên của ô nằm cách đỉnh lớp chứa bao nhiêu (khi lớp chứa có đệm trên). */
  offset?: number;
}) {
  const lift = CLINGING.includes(pose) ? 0.55 : 0.92;
  const edge = side === 'right' ? { right: inset } : { left: inset };
  return <CatSticker pose={pose} size={size} style={{ position: 'absolute', top: offset - size * lift, ...edge }} />;
}
