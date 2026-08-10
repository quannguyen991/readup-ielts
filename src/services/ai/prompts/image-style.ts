/**
 * Prompt template cho việc sinh ảnh. Mỗi loại tài nguyên có template riêng để
 * cả bộ giữ được cùng một ngôn ngữ thị giác với 5 ảnh tham chiếu giao diện.
 */

/** Bảng màu dùng chung, nhắc lại trong mọi prompt để ảnh hoà với UI. */
const PALETTE =
  'palette limited to royal blue #2563EB, violet #7C3AED, soft lavender #C4ADF8, ' +
  'pale blue #DBE7FE, off-white #F7F8FC, slate #334155';

const NO_TEXT = 'absolutely no text, no letters, no numbers, no watermark, no signature';

/** Icon điều hướng và icon loại câu hỏi: line-style bo tròn, nét đều. */
export function iconPrompt(subject: string): string {
  return [
    `A single minimalist line-art icon of ${subject}.`,
    'Outline style only: uniform 2px stroke weight, rounded line caps and joins,',
    'geometric and centred, generous padding, no fill except very light pastel accents.',
    `Flat vector look, ${PALETTE}.`,
    'Pure white background, perfectly square composition, centred subject.',
    NO_TEXT + '.',
  ].join(' ');
}

/** Thumbnail bài đọc: ảnh thực, tông trầm, hài hoà với UI. */
export function thumbnailPrompt(subject: string): string {
  return [
    `Editorial photograph of ${subject}.`,
    'Realistic photography, natural light, shallow depth of field, calm muted tones,',
    'slightly desaturated with a subtle cool blue-violet colour grade so it sits',
    'harmoniously beside a blue and violet user interface.',
    'Clean composition with empty space, no people looking at camera, documentary feel.',
    'Landscape 3:2 framing.',
    NO_TEXT + '.',
  ].join(' ');
}

/** Illustration 3D cho banner hero các trang chính. */
export function illustrationPrompt(scene: string): string {
  return [
    `A soft 3D rendered illustration of ${scene}.`,
    'Clay-render / soft plastic material, smooth rounded shapes, subtle glossy highlights,',
    'gentle studio lighting with soft shadows, floating slightly with a light sense of depth.',
    `${PALETTE}, with warm gold accents used sparingly.`,
    'Transparent-looking clean background, centred hero composition with breathing room,',
    'friendly and study-motivating mood, high detail, product-marketing quality.',
    NO_TEXT + '.',
  ].join(' ');
}
