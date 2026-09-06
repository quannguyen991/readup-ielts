import type { QuestionType } from '@/types/database';
import type { MicroSkill } from '@/services/proofloop/types';

/**
 * Dạng câu hỏi nào đo vi-kỹ-năng nào.
 *
 * VÌ SAO CẦN LỚP NÀY. Sổ bằng chứng ghi theo KỸ NĂNG, còn bộ đề chỉ biết DẠNG
 * CÂU HỎI. Thiếu ánh xạ này thì Reading không biết ghi vào ô nào, và đó đúng là
 * lý do mảng Reading — mảng được lấy làm ví dụ chính trong mọi tài liệu — lại là
 * mảng duy nhất không gửi gì lên sổ.
 *
 * VÌ SAO KHÔNG LẤY THẲNG `q.type` LÀM KHOÁ KỸ NĂNG. Làm vậy được 17 kỹ năng, và
 * `services/mastery/types.ts` đã nói trước vì sao đừng: với vài chục lượt làm
 * bài thì phần lớn ô rỗng, mà một bản đồ rỗng là nhiễu chứ không phải chẩn đoán.
 * Bốn vi-kỹ-năng thì ô nào cũng đủ số lượt để nói được điều gì đó.
 *
 * ÁNH XẠ NÀY LÀ MỘT PHÁN ĐOÁN, KHÔNG PHẢI SỰ THẬT. Nó xét việc DẠNG ĐỀ bắt người
 * đọc làm gì, chứ không xét từng câu cụ thể. Chỗ nào phải hy sinh thì ghi rõ ở
 * dưới thay vì giấu đi.
 */

/**
 * `null` nghĩa là dạng này KHÔNG đo được bằng phép so bằng chứng theo đoạn.
 *
 * Hai dạng Standard English Conventions của SAT kiểm dấu câu và cấu trúc mệnh đề.
 * Câu trả lời đúng không nằm ở "đoạn nào trong bài", nên hỏi người học khoanh
 * đoạn là hỏi một câu vô nghĩa. Trả `null` để chúng không vào sổ, thay vì nhét
 * bừa vào một kỹ năng gần gần — nhét bừa thì sổ vẫn đầy, nhưng đầy bằng số rác.
 */
const SKILL_BY_TYPE: Readonly<Record<QuestionType, MicroSkill | null>> = Object.freeze({
  // Hỏi bài có kéo theo phát biểu này không. Không tìm chỗ, mà xét quan hệ suy ra.
  true_false_not_given: 'entailment',
  yes_no_not_given: 'entailment',
  sat_inference: 'entailment',
  // Quan hệ logic giữa hai vế — cùng loại thao tác với suy ra.
  sat_transitions: 'entailment',
  /*
    Nhượng bộ đã biết. Text structure hỏi bài được TỔ CHỨC ra sao, không phải một
    mệnh đề được kéo theo. Không có ô nào trong bốn ô hợp thật sự; `entailment` là
    ô sai ít nhất vì cả hai đều bắt đọc quan hệ giữa các phần chứ không tra một
    cụm. Nếu sau này số liệu cho thấy ô này lẫn lộn, tách ra thành kỹ năng thứ năm
    chứ đừng đổi sang `paraphrase`.
  */
  sat_text_structure: 'entailment',

  // Tra đúng chỗ. Câu trả lời nằm nguyên trong bài, việc của người đọc là tìm ra.
  matching_information: 'locate',
  // Nối đặc điểm với người/vật: việc chính là TRA đúng chỗ nói về ai.
  matching_features: 'locate',
  // Nối vế câu: phải thấy vế sau có được bài kéo theo hay không.
  matching_sentence_endings: 'entailment',
  sentence_completion: 'locate',
  short_answer: 'locate',
  sat_command_of_evidence: 'locate',

  // Nhận ra cùng một ý được nói lại bằng chữ khác.
  matching_headings: 'paraphrase',
  multiple_choice: 'paraphrase',
  summary_completion: 'paraphrase',
  sat_words_in_context: 'paraphrase',
  sat_central_idea: 'paraphrase',
  sat_rhetorical_synthesis: 'paraphrase',

  // Ngữ pháp thuần — xem chú thích ở trên.
  sat_boundaries: null,
  sat_form_structure_sense: null,
});

/**
 * Những dạng đã được khai trong bảng — dùng để test phân biệt "khai là không đo
 * được" với "quên khai". `readingSkillFor` trả `null` cho cả hai, nên nếu chỉ
 * nhìn giá trị trả về thì một dạng bị bỏ quên trông y hệt một dạng cố ý bỏ ra.
 */
export const DECLARED_QUESTION_TYPES: ReadonlySet<string> = new Set(Object.keys(SKILL_BY_TYPE));

/**
 * Vi-kỹ-năng mà dạng câu hỏi này đo, hoặc `null` nếu không đo được bằng bằng chứng.
 *
 * LƯU Ý VỀ `quantifier`. Hàm này không bao giờ trả về nó, và đó là chủ đích chứ
 * không phải thiếu sót. Một câu True/False/Not Given có phải bẫy lượng từ hay
 * không ("all" đổi thành "most") là chuyện của TỪNG CÂU, nhìn dạng đề không thấy
 * được. Muốn ô đó có số thì phải gắn nhãn ở tầng sinh đề; trước khi có nhãn ấy,
 * đoán mò sẽ đổ lượt của `entailment` sang một ô mà ta không kiểm chứng được.
 */
export function readingSkillFor(type: QuestionType): MicroSkill | null {
  return SKILL_BY_TYPE[type] ?? null;
}

/** Dạng câu hỏi có vào sổ bằng chứng hay không. */
export function isLedgerScored(type: QuestionType): boolean {
  return readingSkillFor(type) !== null;
}
