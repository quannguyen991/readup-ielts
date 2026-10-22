import { themedHex } from '@/theme/palette-state';

/**
 * Bảng màu của bản đồ lộ trình: nền kem vàng, vàng kim của Band 9, xanh cho bài đang mở.
 * Các màu vàng đi qua `themedHex` để chủ đề Chiikawa đổi bảng màu cùng phần còn lại của app.
 */
export function rmColors() {
  return {
    ground: themedHex('#F3F0FB'),
    groundDeep: themedHex('#F3F0FB'),
    ink: '#2B2350',
    body: '#2B2350',
    muted: '#9C8552',
    gold: themedHex('#8B6CF0'),
    goldDeep: themedHex('#6A4BD9'),
    goldSoft: themedHex('#F3F0FB'),
    line: themedHex('#D9B979'),
    path: themedHex('#C9A36A'),
    green: '#4CAF50',
    greenDeep: '#2E8B45',
    locked: '#BDB8AE',
    card: '#FFFFFF',
    warn: '#6A4BD9',
    danger: '#B33A2A',
  };
}

export type RmColors = ReturnType<typeof rmColors>;
