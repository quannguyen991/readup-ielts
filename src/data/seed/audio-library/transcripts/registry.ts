// FILE NÀY DO scripts/build-audio-library.mjs SINH RA. ĐỪNG SỬA TAY.
// require() phải là chuỗi literal để Metro phân tích được lúc build.

export const AUDIO_CHUNKS: Record<number, () => unknown> = {
  0: () => require('./chunk-00.json'),
  1: () => require('./chunk-01.json'),
  2: () => require('./chunk-02.json'),
  3: () => require('./chunk-03.json'),
  4: () => require('./chunk-04.json'),
  5: () => require('./chunk-05.json'),
  6: () => require('./chunk-06.json'),
  7: () => require('./chunk-07.json'),
  8: () => require('./chunk-08.json'),
  9: () => require('./chunk-09.json'),
  10: () => require('./chunk-10.json'),
};
