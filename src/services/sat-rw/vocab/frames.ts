/**
 * Vốn từ cho câu "Từ trong ngữ cảnh" — soạn tay, không gọi model dòng nào.
 *
 * VÌ SAO PHẢI SOẠN TAY, KHÁC HẲN COMMAND OF EVIDENCE. Bảng số thì sinh từ hư
 * không được: dựng dữ liệu rồi tính đáp án từ chính dữ liệu. Từ vựng thì không —
 * code không tự biết `provisional` khác `permanent` chỗ nào. Đây là chỗ thoát y
 * hệt `data/paraphrase.ts`: dữ liệu đọc được, sửa được, sai ở đâu thấy ngay đó.
 *
 * NHƯNG SOẠN TAY KHÔNG CÓ NGHĨA LÀ SOẠN TỪNG CÂU. Mỗi khung dưới đây sinh ra
 * NHIỀU câu, vì câu dẫn lấy từ 1.399 bài đọc thật trong kho — mỗi lần từ ấy xuất
 * hiện trong một câu đủ ngữ cảnh là một đề mới. Ba mươi khung ra khoảng hai trăm
 * câu. Phần soạn tay là phần KHÔNG NHÂN ĐƯỢC; phần nhân được thì để máy làm.
 *
 * TỪ ĐƯỢC CHỌN THEO SỐ LẦN XUẤT HIỆN THẬT TRONG KHO, không theo cảm tính. Quét
 * trước rồi mới soạn: soạn một khung cho từ không có trong kho là soạn một khung
 * không bao giờ dùng tới.
 *
 * NHIỄU KHÔNG ĐƯỢC GẦN NGHĨA VỚI ĐÁP ÁN. Bản đầu có năm cặp hỏng đúng kiểu này —
 * robust/complex, persistent/recurring, fragile/delicate, deliberate/calculated,
 * static/stable. "Demonstrated its complex connection" là tiếng Anh bình thường,
 * nên câu ấy có hai đáp án bào chữa được và người học chọn đúng vẫn bị chấm sai.
 * Đây là lỗi của DỮ LIỆU chứ không phải của máy, và không hàng rào nào bắt được:
 * phán đoán gần nghĩa hay không là việc người soạn. Cùng kỷ luật `paraphrase.ts`
 * đã ghi: thà bảng ngắn mà mỗi dòng đúng.
 *
 * CUES LÀ ĐIỀU KIỆN ĐỂ NGỮ CẢNH ÉP ĐƯỢC ĐÁP ÁN. Một câu chứa `robust` mà xung
 * quanh không có gì nói về độ bền hay dữ liệu thì blank ấy điền được nhiều từ,
 * và câu hỏi có nhiều đáp án đúng. Bắt buộc có ít nhất một cue là cách kiểm được
 * bằng code cho điều đó — không chặt chẽ tuyệt đối, nhưng loại được phần lớn ca
 * mơ hồ. Xem `verify.ts` để biết chỗ này KHÔNG bảo đảm được gì.
 */

/** Vì sao một phương án sai. Mỗi mã là một kiểu hiểu nhầm có tên. */
export type VocabDistractorWhy =
  /** Nghĩa ngược hẳn với thứ ngữ cảnh đòi. */
  | 'opposite'
  /** Đúng hướng nhưng quá mức — mức độ chính là chỗ ăn thua. */
  | 'too_strong'
  /** Liên quan tới chủ đề nhưng ngữ cảnh không ép ra nghĩa ấy. */
  | 'related_not_entailed'
  /** Sai văn phong hoặc sai sắc thái cho văn học thuật. */
  | 'wrong_register';

export type VocabFrame = {
  /** Đáp án đúng. */
  word: string;
  /** Nghĩa đang nhắm tới — viết cho người soạn đọc, không hiện ra đề. */
  sense: string;
  /**
   * Câu dẫn phải chứa ít nhất một cụm này thì mới dùng được.
   * Không có cue thì blank điền được nhiều từ và câu hỏi có nhiều đáp án đúng.
   */
  cues: readonly string[];
  distractors: readonly { word: string; why: VocabDistractorWhy }[];
};

export const VOCAB_FRAMES: readonly VocabFrame[] = Object.freeze([
  {
    word: 'empirical',
    sense: 'dựa trên quan sát và đo đạc, không phải suy luận thuần lý',
    cues: ['evidence', 'data', 'observation', 'observations', 'measurement', 'experiment', 'study'],
    distractors: [
      { word: 'theoretical', why: 'opposite' },
      { word: 'anecdotal', why: 'related_not_entailed' },
      { word: 'conclusive', why: 'too_strong' },
    ],
  },
  {
    word: 'precise',
    sense: 'chính xác đến từng chi tiết, không mơ hồ',
    cues: ['measurement', 'measurements', 'exact', 'accuracy', 'definition', 'calculation', 'instrument'],
    distractors: [
      { word: 'approximate', why: 'opposite' },
      { word: 'elaborate', why: 'related_not_entailed' },
      { word: 'flawless', why: 'too_strong' },
    ],
  },
  {
    word: 'mitigate',
    sense: 'làm nhẹ bớt tác hại, không phải xoá bỏ',
    cues: ['risk', 'damage', 'effects', 'impact', 'harm', 'losses', 'consequences'],
    distractors: [
      { word: 'eliminate', why: 'too_strong' },
      { word: 'aggravate', why: 'opposite' },
      { word: 'postpone', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'novel',
    sense: 'mới, chưa từng có trước đó',
    cues: ['approach', 'method', 'technique', 'first', 'previously', 'new'],
    distractors: [
      { word: 'conventional', why: 'opposite' },
      { word: 'revolutionary', why: 'too_strong' },
      { word: 'fictional', why: 'wrong_register' },
    ],
  },
  {
    word: 'abundant',
    sense: 'có rất nhiều, dư dả',
    cues: ['supply', 'resources', 'found', 'available', 'quantities', 'common'],
    distractors: [
      { word: 'scarce', why: 'opposite' },
      { word: 'infinite', why: 'too_strong' },
      { word: 'valuable', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'robust',
    sense: 'vững, chịu được sai lệch mà vẫn đúng',
    cues: ['method', 'model', 'evidence', 'design', 'system', 'results', 'analysis'],
    distractors: [
      { word: 'fragile', why: 'opposite' },
      { word: 'infallible', why: 'too_strong' },
      { word: 'hypothetical', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'unprecedented',
    sense: 'chưa từng xảy ra trước đây',
    cues: ['history', 'ever', 'first time', 'record', 'never', 'scale'],
    distractors: [
      { word: 'routine', why: 'opposite' },
      { word: 'inevitable', why: 'related_not_entailed' },
      { word: 'catastrophic', why: 'too_strong' },
    ],
  },
  {
    word: 'implicit',
    sense: 'ngầm hiểu, không nói thẳng ra',
    cues: ['assumption', 'assumptions', 'stated', 'explicit', 'suggests', 'understood'],
    distractors: [
      { word: 'explicit', why: 'opposite' },
      { word: 'ambiguous', why: 'related_not_entailed' },
      { word: 'undeniable', why: 'too_strong' },
    ],
  },
  {
    word: 'inherent',
    sense: 'vốn có trong bản chất, không do bên ngoài gán vào',
    cues: ['nature', 'property', 'limitation', 'limitations', 'quality', 'structure'],
    distractors: [
      { word: 'acquired', why: 'opposite' },
      { word: 'apparent', why: 'related_not_entailed' },
      { word: 'insurmountable', why: 'too_strong' },
    ],
  },
  {
    word: 'preliminary',
    sense: 'bước đầu, chưa phải kết luận cuối',
    cues: ['results', 'findings', 'study', 'analysis', 'stage', 'further'],
    distractors: [
      { word: 'definitive', why: 'opposite' },
      { word: 'thorough', why: 'related_not_entailed' },
      { word: 'irreversible', why: 'too_strong' },
    ],
  },
  {
    word: 'persistent',
    sense: 'kéo dài dai dẳng, không mất đi',
    cues: ['remained', 'continued', 'years', 'despite', 'problem', 'pattern'],
    distractors: [
      { word: 'fleeting', why: 'opposite' },
      { word: 'permanent', why: 'too_strong' },
      { word: 'seasonal', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'uniform',
    sense: 'giống nhau ở mọi chỗ, không đổi',
    cues: ['throughout', 'across', 'distribution', 'consistent', 'everywhere', 'layer'],
    distractors: [
      { word: 'variable', why: 'opposite' },
      { word: 'identical', why: 'too_strong' },
      { word: 'orderly', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'sustained',
    sense: 'giữ được liên tục trong thời gian dài',
    cues: ['period', 'years', 'growth', 'effort', 'over', 'decades'],
    distractors: [
      { word: 'brief', why: 'opposite' },
      { word: 'perpetual', why: 'too_strong' },
      { word: 'gradual', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'coherent',
    sense: 'các phần khớp nhau thành một khối hợp lý',
    cues: ['account', 'argument', 'theory', 'explanation', 'picture', 'narrative'],
    distractors: [
      { word: 'disjointed', why: 'opposite' },
      { word: 'irrefutable', why: 'too_strong' },
      { word: 'detailed', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'ambiguous',
    sense: 'hiểu được theo nhiều cách, không rõ nghĩa nào',
    cues: ['interpretation', 'meaning', 'unclear', 'evidence', 'wording', 'results'],
    distractors: [
      { word: 'unequivocal', why: 'opposite' },
      { word: 'meaningless', why: 'too_strong' },
      { word: 'contested', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'rigorous',
    sense: 'chặt chẽ, làm đúng chuẩn nghiêm ngặt',
    cues: ['method', 'testing', 'standards', 'analysis', 'proof', 'training'],
    distractors: [
      { word: 'lax', why: 'opposite' },
      { word: 'infallible', why: 'too_strong' },
      { word: 'lengthy', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'fragile',
    sense: 'dễ hỏng, dễ vỡ khi bị tác động',
    cues: ['ecosystem', 'balance', 'structure', 'easily', 'damage', 'threatened'],
    distractors: [
      { word: 'resilient', why: 'opposite' },
      { word: 'worthless', why: 'wrong_register' },
      { word: 'remote', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'subtle',
    sense: 'tinh vi, khó nhận ra nếu không để ý',
    cues: ['difference', 'differences', 'change', 'shift', 'detect', 'noticed'],
    distractors: [
      { word: 'blatant', why: 'opposite' },
      { word: 'imperceptible', why: 'too_strong' },
      { word: 'gradual', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'viable',
    sense: 'khả thi, làm được trên thực tế',
    cues: ['alternative', 'option', 'solution', 'commercially', 'strategy', 'economically'],
    distractors: [
      { word: 'impractical', why: 'opposite' },
      { word: 'optimal', why: 'too_strong' },
      { word: 'affordable', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'discrete',
    sense: 'tách rời thành từng đơn vị riêng biệt',
    cues: ['units', 'categories', 'steps', 'separate', 'distinct', 'values'],
    distractors: [
      { word: 'continuous', why: 'opposite' },
      { word: 'discreet', why: 'wrong_register' },
      { word: 'numerous', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'divergent',
    sense: 'tách ra theo những hướng khác nhau',
    cues: ['views', 'results', 'paths', 'opinions', 'interpretations', 'evolved'],
    distractors: [
      { word: 'convergent', why: 'opposite' },
      { word: 'irreconcilable', why: 'too_strong' },
      { word: 'outdated', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'speculative',
    sense: 'còn là phỏng đoán, chưa có bằng chứng đỡ',
    cues: ['hypothesis', 'remains', 'evidence', 'claim', 'proposal', 'suggestion'],
    distractors: [
      { word: 'established', why: 'opposite' },
      { word: 'fraudulent', why: 'wrong_register' },
      { word: 'ambitious', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'scarce',
    sense: 'hiếm, không đủ để đáp ứng nhu cầu',
    cues: ['resources', 'supply', 'water', 'food', 'became', 'limited'],
    distractors: [
      { word: 'plentiful', why: 'opposite' },
      { word: 'nonexistent', why: 'too_strong' },
      { word: 'expensive', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'contingent',
    sense: 'phụ thuộc vào một điều kiện khác',
    cues: ['upon', 'depends', 'conditions', 'outcome', 'approval', 'whether'],
    distractors: [
      { word: 'independent', why: 'opposite' },
      { word: 'guaranteed', why: 'opposite' },
      { word: 'temporary', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'cumulative',
    sense: 'cộng dồn dần qua thời gian',
    cues: ['effect', 'effects', 'over time', 'total', 'gradually', 'exposure'],
    distractors: [
      { word: 'immediate', why: 'opposite' },
      { word: 'irreversible', why: 'related_not_entailed' },
      { word: 'overwhelming', why: 'too_strong' },
    ],
  },
  {
    word: 'deliberate',
    sense: 'có chủ ý, không phải tình cờ',
    cues: ['choice', 'attempt', 'decision', 'accident', 'intentional', 'strategy'],
    distractors: [
      { word: 'accidental', why: 'opposite' },
      { word: 'unavoidable', why: 'related_not_entailed' },
      { word: 'malicious', why: 'wrong_register' },
    ],
  },
  {
    word: 'static',
    sense: 'đứng yên, không thay đổi',
    cues: ['remained', 'unchanged', 'over', 'rather than', 'dynamic', 'state'],
    distractors: [
      { word: 'dynamic', why: 'opposite' },
      { word: 'frozen', why: 'wrong_register' },
      { word: 'predictable', why: 'related_not_entailed' },
    ],
  },
  {
    word: 'reluctant',
    sense: 'không muốn làm, làm mà còn ngần ngại',
    cues: ['agreed', 'accept', 'admit', 'refused', 'hesitant', 'only after'],
    distractors: [
      { word: 'eager', why: 'opposite' },
      { word: 'incapable', why: 'related_not_entailed' },
      { word: 'hostile', why: 'too_strong' },
    ],
  },
]);

export function frameFor(word: string): VocabFrame | undefined {
  return VOCAB_FRAMES.find((f) => f.word === word);
}
