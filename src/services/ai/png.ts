import { PNG } from 'pngjs';

import { stripWhiteBackground } from './transparency';

/**
 * Giải mã PNG, bóc nền trắng, mã hoá lại.
 *
 * Tách khỏi `transparency.ts` để phần logic bóc nền vẫn là hàm thuần trên mảng
 * byte và test được mà không cần dựng file PNG thật.
 */
export async function makeBackgroundTransparent(
  bytes: Uint8Array,
  options: { tolerance?: number } = {},
): Promise<{ bytes: Uint8Array; clearedPercent: number } | null> {
  let png: PNG;

  try {
    png = PNG.sync.read(Buffer.from(bytes));
  } catch {
    // Proxy có thể trả JPEG hoặc WebP. Không bóc được thì dùng ảnh gốc — thà có
    // nền trắng còn hơn không có ảnh.
    return null;
  }

  const cleared = stripWhiteBackground(
    new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    png.width,
    png.height,
    options,
  );

  const total = png.width * png.height;
  const clearedPercent = total > 0 ? (cleared / total) * 100 : 0;

  /*
    Hai ngưỡng an toàn. Điều cần canh là "CHỦ THỂ CÒN KHÔNG", không phải "đã bóc
    bao nhiêu".

    Bản đầu chặn theo trần 92% đã bóc, và nó BẮT NHẦM 5 icon: icon là nét mảnh
    trên nền trống, nền chiếm hơn 92% là chuyện đương nhiên chứ không phải dấu
    hiệu hỏng. Đo phần CÒN LẠI mới đúng: bóc 97% mà vẫn còn 3% nét thì icon vẫn
    nguyên vẹn, còn bóc 60% mà chẳng còn gì thì mới là đã ăn vào hình.

    Sàn 2% ở chiều kia: gần như không bóc được gì nghĩa là ảnh không có nền
    phẳng, giữ lại kết quả cũng chẳng lợi gì.
  */
  const remainingPercent = 100 - clearedPercent;
  if (clearedPercent < 2) return null;
  if (remainingPercent < 1) return null;

  return { bytes: new Uint8Array(PNG.sync.write(png)), clearedPercent };
}
