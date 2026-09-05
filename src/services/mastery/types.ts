/**
 * Sổ bằng chứng học tập — dùng chung cho mọi kỹ năng.
 *
 * VÌ SAO CÓ LỚP NÀY. `services/proofloop` đã làm đúng việc cần làm, nhưng chỉ
 * cho Reading: quan sát người học trả lời và chỉ bằng chứng, phân loại bằng luật
 * cố định, chọn phép thử cô lập đúng một biến, và CHỈ công nhận hiểu khi họ làm
 * được trên một bài KHÁC. Nguyên tắc ấy không có gì riêng của Reading cả.
 *
 * Lớp này nâng nguyên tắc đó lên thành xương sống: mọi kỹ năng gửi về cùng một
 * hình dạng quan sát, đi qua cùng một bộ phân loại, và chịu cùng một điều kiện
 * công nhận. Nhờ vậy câu "app nghĩ bạn đã hiểu gì" có MỘT câu trả lời, không
 * phải năm câu trả lời rời rạc theo từng module.
 *
 * ĐIỀU QUAN TRỌNG NHẤT, và cũng là điều dễ bị bào mòn nhất khi thêm kỹ năng mới:
 * bộ phân loại và bảng phép thử KHÔNG BAO GIỜ do model quyết. Model chỉ soạn nội
 * dung phép thử. Nếu model được phép nói "học sinh đã hiểu" thì một lời giải
 * thích trôi chảy sẽ tự phong cho mình là bằng chứng học tập.
 */

/**
 * Mảng kỹ năng. Mỗi mảng có cách "chỉ bằng chứng" riêng, xem `EvidencePointer`.
 *
 * `ai-literacy` KHÔNG phải một môn học thêm vào cho vui.
 *
 * Đề thi có bốn kỹ năng, nhưng thứ người học đang phải làm mỗi ngày mà không ai
 * dạy là ĐỌC KẾT QUẢ DO MÁY SINH RA và biết chỗ nào tin được. Mảng này đo đúng
 * năng lực đó, và đo bằng chính bộ máy hai trục của các mảng kia — nên nó không
 * phải một cái bảng riêng dán thêm vào, mà là cùng một câu hỏi hỏi trên một loại
 * đối tượng khác.
 */
export type Domain =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'sat-math'
  | 'sat-verbal'
  | 'ai-literacy';

export const DOMAIN_LABEL: Record<Domain, string> = {
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
  writing: 'Viết',
  'sat-math': 'SAT Math',
  'sat-verbal': 'SAT Verbal',
  'ai-literacy': 'Đọc kết quả của AI',
};

/**
 * Một vi-kỹ-năng, định danh bằng cặp (mảng, khoá).
 *
 * Khoá là chuỗi tự do vì mỗi mảng có bộ kỹ năng riêng và chúng tiến hoá độc lập:
 * Reading có `locate`/`entailment`, SAT Math có `linear_equations_one_var`. Gom
 * tất cả vào một union sẽ biến mọi lần thêm kỹ năng thành một lần sửa kiểu chung.
 */
export type SkillRef = { domain: Domain; key: string };

export function skillId(ref: SkillRef): string {
  return `${ref.domain}:${ref.key}`;
}

/**
 * Người học đã chỉ vào đâu để đỡ câu trả lời của mình.
 *
 * Bốn mảng chỉ bằng bốn cách, nhưng đều quy về một câu hỏi: "chỗ bạn dựa vào có
 * đúng là chỗ đỡ đáp án không". Đó là điều kiện đủ để dùng chung bộ phân loại.
 */
export type EvidencePointer =
  /** Đọc: đoạn văn người học khoanh. */
  | { kind: 'paragraph'; index: number }
  /** Nghe: câu trong phụ đề mà người học cho là chứa đáp án. */
  | { kind: 'transcript-line'; index: number }
  /** Viết: loại lỗi người học nhận ra ở chỗ được đánh dấu. */
  | { kind: 'error-tag'; tag: string }
  /** Toán: bước giải người học cho là mấu chốt. */
  | { kind: 'step'; index: number };

/**
 * Một lần quan sát, gửi từ bất kỳ mảng nào.
 *
 * `sourceId` là ĐỊNH DANH NGUỒN — bài đọc, video, đề, bài viết. Điều kiện chuyển
 * giao so hai `sourceId` với nhau, nên trường này phải là thứ ổn định và thật;
 * đặt bừa một chuỗi ngẫu nhiên mỗi lượt sẽ khiến mọi phép thử đều "đạt chuyển
 * giao" và cả cơ chế mất nghĩa.
 */
export type Observation = {
  skill: SkillRef;
  sourceId: string;
  answerCorrect: boolean;
  /** `null` khi người học không chỉ bằng chứng, hoặc bài không có đối chứng. */
  pointer: EvidencePointer | null;
  /** Bằng chứng THẬT, theo đề. `null` nghĩa là câu này không có đối chứng. */
  truth: EvidencePointer | null;
  at: string;
};

/** Bốn trạng thái quan sát được. Giữ nguyên tên và nghĩa của ProofLoop. */
export type ProofState =
  | 'unobserved'
  | 'aligned-correct'
  | 'misaligned-correct'
  | 'aligned-wrong'
  | 'misaligned-wrong';

export type ProbeKind = 'transfer' | 'evidence-reselect' | 'entailment' | 'locate';

/**
 * Trạng thái của một kỹ năng trong sổ.
 *
 * `confirmed` là phát biểu về HIỆN TẠI, không phải huy chương: một lần trượt sau
 * đó gỡ lại. Xem `applyOutcome`.
 */
export type SkillStatus = 'unobserved' | 'needs-probe' | 'probing' | 'confirmed';

export type SkillRecord = {
  skill: SkillRef;
  status: SkillStatus;
  /** Trạng thái quan sát gần nhất — quyết định phép thử tiếp theo. */
  lastState: ProofState;
  /** Nguồn của quan sát gần nhất; phép thử chuyển giao phải dùng nguồn KHÁC. */
  lastSourceId: string | null;
  /** Tổng số lượt làm bài đã gửi lên, KỂ CẢ lượt không khoanh bằng chứng. */
  observations: number;
  /**
   * Số lượt THẬT SỰ quan sát được — trạng thái khác `unobserved`.
   *
   * Tách khỏi `observations` vì màn hình nói "N lượt quan sát" ngay bên cạnh chữ
   * "chưa quan sát được". Hai dòng đó cãi nhau, và dòng sai là dòng đếm: người
   * học làm 10 câu mà không khoanh câu nào thì hệ thống quan sát được đúng 0 lần.
   *
   * Có thể `undefined` ở sổ lưu từ bản cũ — luôn đọc qua `?? 0`.
   */
  observed: number;
  /** Số lần đã đạt chuyển giao trên một nguồn khác. */
  transfers: number;
  updatedAt: string;
};

export type Ledger = Record<string, SkillRecord>;
