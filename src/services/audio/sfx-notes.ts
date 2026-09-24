/**
 * Phần THUẦN của bộ âm thanh game — không chạm Web Audio, nên test được trong Node.
 */

/**
 * Thang ngũ cung trưởng tính bằng nửa cung: Đô Rê Mi Sol La, lên quãng tám rồi
 * lặp lại. Tiếng "đúng" leo từng bậc theo combo — nghe được mình đang lên đà — mà
 * bậc nào cũng hợp với bậc nào (thang ngũ cung không có quãng nghịch), nên đúng
 * liên tiếp mười câu vẫn thành một câu nhạc chứ không thành tiếng còi.
 */
const PENTATONIC = [0, 2, 4, 7, 9];

/** Số nửa cung nâng lên cho câu đúng thứ `combo` liên tiếp; từ bậc thứ 11 thì đứng ở đỉnh. */
export function comboSemitones(combo: number): number {
  const step = Math.max(0, Math.min(10, Math.floor(combo) - 1));
  return Math.floor(step / PENTATONIC.length) * 12 + PENTATONIC[step % PENTATONIC.length]!;
}

/** Tần số (Hz) của nốt cách `base` một số nửa cung. */
export function shiftHz(base: number, semitones: number): number {
  return base * Math.pow(2, semitones / 12);
}
