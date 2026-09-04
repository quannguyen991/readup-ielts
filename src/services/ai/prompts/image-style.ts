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

/**
 * Illustration 3D cho banner hero các trang chính.
 *
 * BA LUẬT ĐƯỢC RÚT TỪ LẦN SINH TRƯỚC, mỗi luật ứng với một tấm hỏng thật:
 *
 * 1. CẤM PHÔNG NỀN PHẲNG. math-hero được vẽ kèm một tấm giấy kẻ ô làm phông, và
 *    tấm giấy đó KHÔNG bóc được: các đường kẻ xanh nhạt chặn đường loang, nên
 *    phần trắng bên trong lưới còn lại thành mảng rách lởm chởm. Đo ra thì không
 *    có dung sai nào cứu được — đường kẻ lệch màu 102 so với trắng, cây thước
 *    chỉ lệch 60-79, nên ngưỡng nào qua được lưới cũng ăn mất thước.
 *
 * 2. VẬT THỂ RỜI, CÓ KHOẢNG HỞ. Ảnh được đặt lên banner gradient, nên mọi thứ
 *    dính liền nhau thành một khối sẽ đọc ra là một vệt, không ra hình.
 *
 * 3. ĐỪNG XANH-TÍM TOÀN BỘ. Banner vốn đã xanh chuyển tím; vật thể cùng tông sẽ
 *    lẫn vào nền. Giữ xanh tím cho chi tiết, còn khối chính dùng màu sáng (kem,
 *    trắng ngà) và điểm vàng đồng — đo trên bản ghép thật thì đó là hai tông
 *    nổi rõ nhất trên nền tím.
 */
export function illustrationPrompt(scene: string): string {
  return [
    `A soft 3D rendered illustration of ${scene}.`,
    'Clay-render / soft plastic material, smooth rounded shapes, subtle glossy highlights,',
    'gentle studio lighting with soft shadows, objects floating with clear empty space between them.',
    `${PALETTE}, with warm gold accents used sparingly.`,
    'Main volumes in light cream and off-white so the subject stays readable when placed',
    'over a saturated blue-violet banner; blue and violet used for details only.',
    // KHÔNG được viết "transparent" ở đây. Model không xuất được alpha, nên nó
    // vẽ luôn cái bàn cờ ca-rô — ký hiệu quy ước của vùng trong suốt — thành một
    // ô vuông giữa ảnh. Đã dính đúng lỗi đó. Bắt nó vẽ trên nền trắng phẳng, rồi
    // `transparency.ts` bóc nền ra bằng code.
    'Plain pure white background with no pattern and no checkerboard.',
    'NO background plane, NO desk surface, NO sheet of paper behind the objects,',
    'NO grid, NO frame, NO shadow slab — only the objects themselves on empty white.',
    'Centred hero composition with breathing room,',
    'friendly and study-motivating mood, high detail, product-marketing quality.',
    NO_TEXT + '.',
  ].join(' ');
}
