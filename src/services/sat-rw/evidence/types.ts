/**
 * Câu Command of Evidence định lượng: một bảng số, một nhận định, bốn phương án.
 *
 * VÌ SAO DẠNG NÀY SINH ĐƯỢC BẰNG CODE KHI CÁC DẠNG ĐỌC HIỂU KHÁC THÌ KHÔNG. Mọi
 * dạng khác đòi VĂN HAY, mà sinh văn bằng luật thì dở. Dạng này không đòi văn —
 * nó đòi DỮ LIỆU, và dựng dữ liệu rồi tính đáp án từ chính dữ liệu ấy là việc
 * SAT Math đã làm tốt suốt.
 *
 * VÀ NÓ MIỄN NHIỄM VỚI LỖI 32% ĐÃ ĐO. Bảng số là bịa, nên không kiến thức phổ
 * thông nào đoán được đáp án — muốn trả lời buộc phải đọc bảng. Đây là dạng mà
 * phép thử bịt mắt luôn xanh vì lý do đúng, chứ không phải vì hàng rào bỏ sót.
 */

/** Bảng số liệu đi kèm câu hỏi. */
export type EvidenceTable = {
  caption: string;
  /** Nhãn cột đầu tiên — cột tên thực thể. */
  entityHeader: string;
  /** Nhãn các cột SỐ, theo thứ tự. */
  columns: string[];
  rows: { entity: string; values: number[] }[];
  /** Đơn vị của mọi ô số. Đi vào câu chữ của phương án. */
  unit: string;
};

/**
 * Một mệnh đề về bảng — dựng có CẤU TRÚC, không phải một chuỗi chữ.
 *
 * ĐÂY LÀ CHỖ QUYẾT ĐỊNH. Nếu phương án chỉ là chuỗi chữ thì phải có ai đó đánh
 * dấu cái nào đúng, và cái dấu ấy sai lúc nào không ai biết. Dựng thành mệnh đề
 * thì `evaluate` PHÁN XỬ được nó bằng chính bảng số — đáp án là kết quả của một
 * phép tính, không phải một lời khai.
 */
export type Claim =
  /** "X có N <đơn vị> vào <cột>." */
  | { kind: 'value'; entity: string; column: string; value: number }
  /** "X là nơi cao nhất / thấp nhất vào <cột>." */
  | { kind: 'rank'; entity: string; column: string; extreme: 'highest' | 'lowest' }
  /** "X tăng / giảm giữa <from> và <to>." */
  | { kind: 'change'; entity: string; from: string; to: string; direction: 'increase' | 'decrease' }
  /** "X tăng / giảm nhiều hơn mọi nơi khác giữa <from> và <to>." */
  | {
      kind: 'change-most';
      entity: string;
      from: string;
      to: string;
      direction: 'increase' | 'decrease';
    };

/** Vì sao một phương án sai. Mỗi mã là một kiểu hiểu nhầm có tên. */
export type DistractorCode =
  /** Đúng với bảng, nhưng không đỡ nhận định. Kiểu đề thật hay dùng nhất. */
  | 'accurate_but_irrelevant'
  /** Đọc nhầm hàng — nói về thực thể khác. */
  | 'wrong_row'
  /** Đảo chiều so sánh: cao ↔ thấp, tăng ↔ giảm. */
  | 'reversed_comparison'
  /** Khẳng định một con số bảng không hề có. */
  | 'not_in_table';

export type EvidenceOption = {
  claim: Claim;
  /** `null` ở phương án đúng. */
  code: DistractorCode | null;
  text: string;
};

export type EvidenceItem = {
  /** `${templateSlug}:${seed}` — mở lại đúng id là ra đúng câu ấy. */
  id: string;
  templateSlug: string;
  /** Vài câu dẫn, kết bằng nhận định cần được đỡ. */
  passage: string;
  /** Nhận định ấy, dạng cấu trúc — để kiểm phương án đúng có thật sự đỡ nó không. */
  thesis: Claim;
  table: EvidenceTable;
  stem: string;
  options: EvidenceOption[];
  answerIndex: number;
  solutionVi: string;
};
