/** Thay cho expo-linear-gradient/build/normalizeColor: màu gradient đi qua chiikawaRecolor trước. */
import { normalizeColor as original } from 'expo-linear-gradient/build/normalizeColor';
import { chiikawaRecolor } from './chiikawa-recolor';

export function normalizeColor(color, opacity) {
  return original(chiikawaRecolor(color), opacity);
}
