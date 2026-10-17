import { themedHex } from '@/theme/palette-state';

/**
 * Bảng màu của bản đồ lộ trình: nền kem vàng, vàng kim của Band 9, xanh cho bài đang mở.
 * Các màu vàng đi qua `themedHex` để chủ đề Chiikawa đổi bảng màu cùng phần còn lại của app.
 */
export function rmColors() {
  return {
    ground: themedHex('#FFF8E1'),
    groundDeep: themedHex('#FCEBB8'),
    ink: '#3B2A10',
    body: '#6E5626',
    muted: '#9C8552',
    gold: themedHex('#EBC26A'),
    goldDeep: themedHex('#B8862A'),
    goldSoft: themedHex('#FFF1C7'),
    line: themedHex('#D9B979'),
    path: themedHex('#C9A36A'),
    green: '#4CAF50',
    greenDeep: '#2E8B45',
    locked: '#BDB8AE',
    card: '#FFFFFF',
    warn: '#A8741A',
    danger: '#B33A2A',
  };
}

export type RmColors = ReturnType<typeof rmColors>;
