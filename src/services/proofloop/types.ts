/**
 * Bốn vi-kỹ-năng. Chỉ bốn, và đều là thứ phép so bằng chứng đỡ được trực tiếp.
 *
 * Bản đồ tám trục nghe hay hơn, nhưng với vài chục lượt làm bài thì phần lớn ô
 * rỗng — mà một bản đồ rỗng là nhiễu chứ không phải chẩn đoán.
 */
export type MicroSkill = 'locate' | 'paraphrase' | 'entailment' | 'quantifier';

/** Chỗ người học khoanh làm bằng chứng cho câu trả lời của chính mình. */
export type EvidenceMark = {
  paragraphIndex: number;
  phrase: string;
  startOffset: number;
  endOffset: number;
};

/**
 * Tên trạng thái là ĐIỀU QUAN SÁT ĐƯỢC, không phải điều suy ra.
 *
 * Không có `hiểu thật`, không có `đoán bừa` — hai chữ đó là phán đoán về trạng
 * thái trong đầu người học, và hệ thống này không nhìn thấy trạng thái đó.
 *
 * `unobserved` là trạng thái RIÊNG, không được nhập vào `misaligned`: không đo
 * được khác với đo rồi không thấy gì.
 */
export type ProofState =
  | 'unobserved'
  | 'aligned-correct'
  | 'misaligned-correct'
  | 'aligned-wrong'
  | 'misaligned-wrong';

export type ProbeKind = 'transfer' | 'evidence-reselect' | 'entailment' | 'locate';

export type Observation = {
  answerCorrect: boolean;
  mark: EvidenceMark | null;
  /**
   * Đoạn chứa đáp án, theo bộ đề.
   *
   * `null` nghĩa là câu này KHÔNG có đối chứng — migration `passage_tier` đã bỏ
   * ràng buộc not null của `evidence_paragraph_index`, nên chuyện này có thật.
   * Không có đối chứng thì không so được, và không so được thì không kết luận.
   */
  truthParagraphIndex: number | null;
};
