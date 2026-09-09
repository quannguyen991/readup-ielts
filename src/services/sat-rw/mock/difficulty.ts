import type { MockItem } from './item';

/**
 * Độ khó TÍNH BẰNG CODE, không gán tay.
 *
 * `SatRwQuestion` không có trường độ khó, mà module 2 của đề số hoá thì thích ứng
 * theo kết quả module 1 — không có độ khó thì không thích ứng được. Gán tay 384
 * câu vừa tốn vừa không kiểm được: hai người gán ra hai bảng khác nhau, và không
 * ai nói được vì sao câu này khó hơn câu kia.
 *
 * BA TÍN HIỆU, mỗi tín hiệu có lý do đọc được:
 *
 *   · ĐỘ DÀI ĐOẠN — nhiều chữ hơn thì phải giữ nhiều thứ trong đầu hơn.
 *   · ĐỘ LỆCH ĐỘ DÀI GIỮA CÁC PHƯƠNG ÁN — một phương án dài hẳn hoặc ngắn hẳn thì
 *     tự lộ, và người luyện thi loại nó bằng hình dáng chứ không bằng nghĩa. Bốn
 *     phương án dài xấp xỉ nhau thì buộc phải đọc. Nên lệch NHIỀU là DỄ.
 *   · MẢNG — Standard English Conventions là tra luật, có đúng có sai rạch ròi;
 *     Information and Ideas đòi suy luận từ văn bản. Thô, nhưng đúng chiều.
 *
 * NÓI THẲNG ĐÂY LÀ PHỎNG THEO. Ba tín hiệu này CHƯA từng được hiệu chuẩn với kết
 * quả người học thật — không có dữ liệu nào nói câu điểm 0,7 khó hơn câu điểm 0,4
 * bao nhiêu. Nó đủ để chia đề thành hai bậc cho cơ chế thích ứng chạy, và KHÔNG
 * đủ để hiện cho người học xem như một nhãn "câu này khó". Cùng lối nói của ngưỡng
 * chuyển module bên Math: "phỏng theo chứ không phải quy tắc chính thức".
 */

export type RwDifficulty = 'easy' | 'medium' | 'hard';

const DOMAIN_LOAD: Record<MockItem['domain'], number> = {
  'Standard English Conventions': 0,
  'Expression of Ideas': 0.35,
  'Craft and Structure': 0.7,
  'Information and Ideas': 1,
};

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** 0 khi bốn phương án dài xấp xỉ nhau, tiến tới 1 khi một cái lệch hẳn. */
function optionSpread(options: readonly string[]): number {
  const lens = options.map(words);
  if (lens.length === 0) return 0;
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Điểm khó trong [0, 1]. Càng lớn càng khó.
 *
 * Trọng số cố ý để mảng nặng nhất: khoảng cách giữa "tra luật dấu phẩy" và "suy
 * ra thái độ tác giả" lớn hơn khoảng cách giữa một đoạn 40 từ và một đoạn 90 từ.
 */
export function difficultyScore(item: MockItem): number {
  const lengthLoad = Math.min(1, words(item.passage) / 120);
  // Lệch nhiều là DỄ, nên lấy phần bù.
  const discriminationLoad = 1 - optionSpread(item.options);
  const domainLoad = DOMAIN_LOAD[item.domain] ?? 0.5;

  /*
    MẢNG CHỈ ĐƯỢC LÀ MỘT TÍN HIỆU, KHÔNG ĐƯỢC LÀ TÍN HIỆU CHÍNH.

    Bản đầu cho mảng trọng số 0,5 và nó át hai tín hiệu kia: độ khó gần như bằng
    mảng. Mà blueprint đã ghim tỉ lệ mảng của mỗi module rồi, nên độ khó cũng bị
    ghim theo — đo thật thấy module "khó" có 15 câu khó còn module "dễ" có 13,
    tức là cơ chế thích ứng gần như không làm gì.

    Hạ mảng xuống 0,3 thì trong cùng một mảng vẫn còn chênh lệch để bộ chọn bám
    vào, và thích ứng mới có chỗ hoạt động.
  */
  return 0.3 * domainLoad + 0.4 * discriminationLoad + 0.3 * lengthLoad;
}

/**
 * Ba bậc, cắt theo NGƯỠNG CỐ ĐỊNH chứ không theo phân vị của kho.
 *
 * Cắt theo phân vị thì thêm câu mới vào kho là đổi bậc của những câu cũ — một đề
 * đã làm hôm qua hôm nay thành đề khác, và hai lần làm không so được với nhau.
 * Ngưỡng cố định thì bậc của một câu chỉ phụ thuộc vào chính nó.
 */
export function difficultyOf(item: MockItem): RwDifficulty {
  const s = difficultyScore(item);
  if (s < 0.42) return 'easy';
  if (s < 0.62) return 'medium';
  return 'hard';
}
