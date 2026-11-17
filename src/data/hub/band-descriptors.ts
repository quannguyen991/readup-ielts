import type { CriterionKey } from '@/services/speaking/grade';

/**
 * Mô tả tóm lược các mức band của bốn tiêu chí chấm IELTS Speaking, viết lại bằng tiếng Việt ngắn gọn
 * (không chép nguyên văn bảng chính thức) để đối chiếu với điểm của người học.
 */

export const BAND_NAME: Record<number, string> = { 4: 'Limited', 5: 'Modest', 6: 'Competent', 7: 'Good', 8: 'Very good', 9: 'Expert' };

export const DESCRIPTORS: Record<CriterionKey, Record<number, string>> = {
  fc: {
    4: 'Trả lời ngắn, ngắt quãng dài và hay dừng để tìm từ; các ý nối với nhau còn rời rạc.',
    5: 'Nói được thành đoạn nhưng hay ngập ngừng, lặp ý hoặc tự sửa; từ nối cơ bản và đôi lúc lặp lại.',
    6: 'Sẵn sàng nói dài, thỉnh thoảng mất mạch vì ngập ngừng hay lặp; dùng nhiều từ nối nhưng chưa luôn chính xác.',
    7: 'Nói dài không tốn nhiều sức; chỉ ngập ngừng khi tìm ý; dùng linh hoạt nhiều từ nối và cách chuyển ý.',
    8: 'Trôi chảy, hiếm khi ngập ngừng và thường vì tìm ý; triển khai chủ đề mạch lạc, đúng trọng tâm.',
    9: 'Liền mạch gần như không ngắt; từ nối và cách phát triển ý hoàn toàn tự nhiên.',
  },
  lr: {
    4: 'Vốn từ cơ bản, lặp từ nhiều; khó diễn đạt khi chủ đề không quen.',
    5: 'Đủ để nói chủ đề quen thuộc, hạn chế khi gặp chủ đề lạ; hay phải nói vòng.',
    6: 'Đủ vốn từ để bàn chủ đề dài dù đôi lúc dùng từ chưa chính xác; diễn đạt lại khá thành công.',
    7: 'Dùng linh hoạt nhiều từ, có cụm ít phổ biến và thành ngữ dù đôi khi chưa chuẩn; diễn đạt lại hiệu quả.',
    8: 'Vốn từ rộng, dùng thành thạo từ ít gặp và thành ngữ; lỗi dùng từ hiếm.',
    9: 'Dùng từ chính xác, tự nhiên và tinh tế ở mọi chủ đề.',
  },
  gr: {
    4: 'Câu đơn là chính, câu phức hạn chế; lỗi nhiều và đôi khi gây khó hiểu.',
    5: 'Câu đơn khá chính xác nhưng cấu trúc phức hạn chế và hay lỗi.',
    6: 'Trộn câu đơn và câu phức; còn lỗi ở cấu trúc phức nhưng ít gây hiểu nhầm.',
    7: 'Dùng nhiều cấu trúc phức khá linh hoạt, nhiều câu không lỗi; còn lỗi nhỏ.',
    8: 'Dùng rộng và linh hoạt các cấu trúc; phần lớn câu không lỗi, lỗi hiếm và không hệ thống.',
    9: 'Cấu trúc đa dạng và chính xác; chỉ có sơ suất nhỏ.',
  },
  pr: {
    4: 'Ít đặc điểm phát âm tích cực; hay phát âm sai gây khó nghe.',
    5: 'Có vài đặc điểm tích cực nhưng không duy trì được; đôi lúc khó hiểu.',
    6: 'Dùng được một số đặc điểm phát âm nhưng chưa đều; nghe hiểu được, đôi chỗ không rõ.',
    7: 'Duy trì được các đặc điểm tích cực, chỉ vài lỗi nhỏ; dễ hiểu suốt bài.',
    8: 'Đa dạng đặc điểm phát âm, dễ hiểu suốt bài; ảnh hưởng của giọng mẹ đẻ rất nhẹ.',
    9: 'Đầy đủ đặc điểm phát âm chuẩn và tinh tế; hoàn toàn dễ hiểu.',
  },
};

/** Mô tả của mức band gần nhất (kẹp trong 4–9). */
export function descriptorFor(key: CriterionKey, band: number): { band: number; text: string } {
  const b = Math.min(9, Math.max(4, Math.floor(band)));
  return { band: b, text: DESCRIPTORS[key][b]! };
}

/** Việc cần làm để lên mức kế tiếp: mô tả của band cao hơn một bậc (hết thang thì chúc mừng). */
export function nextDescriptor(key: CriterionKey, band: number): { band: number; text: string } | null {
  const b = Math.min(9, Math.max(4, Math.floor(band)));
  return b >= 9 ? null : { band: b + 1, text: DESCRIPTORS[key][b + 1]! };
}

export function bandLabel(band: number): string {
  const b = Math.min(9, Math.max(4, Math.floor(band)));
  return BAND_NAME[b]!;
}
