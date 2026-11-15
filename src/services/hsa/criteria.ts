import type { Bi } from '@/i18n/useL';
import type { HsaLevel, HsaQuestionKind } from '@/data/hsa';

/**
 * Năm tiêu chí chấm của phần Tiếng Anh HSA. Mỗi dạng câu thuộc đúng một tiêu chí, nên điểm theo
 * tiêu chí cộng lại chính là điểm cả bài, không có câu nào bị bỏ ngoài.
 */
export type CriterionId = 'grammar' | 'vocab' | 'dialogue' | 'reading' | 'reasoning';
export type HsaSection = 'language' | 'reading' | 'reasoning';

export type Criterion = {
  id: CriterionId;
  title: Bi;
  /** Ký hiệu ngắn in dưới điểm, như FC / LR / GRA trong bảng chấm Speaking. */
  short: string;
  hint: Bi;
  section: HsaSection;
  kinds: readonly HsaQuestionKind[];
};

export const CRITERIA: readonly Criterion[] = [
  {
    id: 'grammar',
    title: { vi: 'Ngữ pháp & cấu trúc câu', en: 'Grammar & sentence structure' },
    short: 'GRA',
    hint: { vi: 'Chia thì, mệnh đề, viết lại và kết hợp câu', en: 'Tenses, clauses, rewriting and combining sentences' },
    section: 'language',
    kinds: ['sentence-completion', 'sentence-rewriting', 'sentence-combination'],
  },
  {
    id: 'vocab',
    title: { vi: 'Từ vựng & sắc thái nghĩa', en: 'Vocabulary & shades of meaning' },
    short: 'LEX',
    hint: { vi: 'Đồng nghĩa, trái nghĩa, nghĩa theo ngữ cảnh', en: 'Synonyms, antonyms, meaning in context' },
    section: 'language',
    kinds: ['synonym-antonym', 'vocabulary-in-context'],
  },
  {
    id: 'dialogue',
    title: { vi: 'Giao tiếp & hội thoại', en: 'Communication & dialogue' },
    short: 'COM',
    hint: { vi: 'Hoàn thành và sắp xếp hội thoại tự nhiên', en: 'Completing and ordering natural dialogue' },
    section: 'language',
    kinds: ['dialogue-completion', 'dialogue-ordering'],
  },
  {
    id: 'reading',
    title: { vi: 'Đọc hiểu văn bản học thuật', en: 'Academic reading' },
    short: 'RDG',
    hint: { vi: 'Điền khuyết theo đoạn, ý chính, mục đích tác giả, bằng chứng, số liệu', en: 'Cloze, main idea, author purpose, evidence, data' },
    section: 'reading',
    kinds: ['cloze', 'reading-comprehension', 'author-purpose', 'evidence-evaluation', 'data-interpretation', 'sentence-insertion'],
  },
  {
    id: 'reasoning',
    title: { vi: 'Suy luận', en: 'Reasoning' },
    short: 'RSN',
    hint: { vi: 'Rút kết luận hợp lý từ tình huống cho sẵn', en: 'Drawing sound conclusions from a given situation' },
    section: 'reasoning',
    kinds: ['reasoning'],
  },
];

export const CRITERION_BY_ID: Record<CriterionId, Criterion> = Object.fromEntries(CRITERIA.map((c) => [c.id, c])) as Record<CriterionId, Criterion>;

export const KIND_CRITERION: Record<HsaQuestionKind, CriterionId> = Object.fromEntries(
  CRITERIA.flatMap((c) => c.kinds.map((k) => [k, c.id] as const)),
) as Record<HsaQuestionKind, CriterionId>;

export const LEVELS: readonly HsaLevel[] = ['A2', 'B1', 'B2', 'C1'];

export const SECTION_LABEL: Record<HsaSection, Bi> = {
  language: { vi: 'Ngôn ngữ', en: 'Language' },
  reading: { vi: 'Đọc hiểu', en: 'Reading' },
  reasoning: { vi: 'Suy luận', en: 'Reasoning' },
};

/** Cách làm mẫu và lỗi hay gặp theo từng dạng câu — phần "bài mẫu gợi ý" ở trang kết quả. */
export type KindGuide = { steps: Bi; pitfall: Bi };

export const KIND_GUIDE: Record<HsaQuestionKind, KindGuide> = {
  'sentence-completion': {
    steps: {
      vi: 'Đọc cả câu rồi xác định chỗ trống cần loại từ gì. Gạch dấu hiệu thì và chủ ngữ (since, yesterday, if…). Loại đáp án sai dạng từ trước, rồi thử từng đáp án còn lại vào câu.',
      en: 'Read the whole sentence and decide what kind of word the gap needs. Mark tense signals and the subject (since, yesterday, if…). Remove wrong word forms first, then test the rest in the sentence.',
    },
    pitfall: { vi: 'Chọn theo cảm giác "nghe quen" mà bỏ qua dấu hiệu thì hoặc sự hòa hợp chủ ngữ – động từ.', en: 'Choosing what “sounds familiar” and ignoring tense signals or subject–verb agreement.' },
  },
  'synonym-antonym': {
    steps: {
      vi: 'Đọc nghĩa của từ trong câu, không dịch rời từng từ. Tự nghĩ một từ thay thế trước khi nhìn đáp án. Với câu hỏi trái nghĩa, gạch chữ “opposite” để khỏi chọn nhầm đồng nghĩa.',
      en: 'Read the word as used in the sentence, not in isolation. Think of a replacement before looking at the options. For antonym items, underline “opposite” so you do not pick a synonym.',
    },
    pitfall: { vi: 'Chọn từ có nghĩa thông dụng nhất mà quên nghĩa trong ngữ cảnh đang xét.', en: 'Picking the most common meaning and forgetting the one the context needs.' },
  },
  'dialogue-completion': {
    steps: {
      vi: 'Xác định ai đang nói, mục đích câu (hỏi, đề nghị, từ chối, đồng ý). Chọn câu đáp khớp mục đích và mức độ lịch sự, rồi kiểm tra nó có nối được với câu kế tiếp.',
      en: 'Work out who is speaking and the function (question, offer, refusal, agreement). Choose the reply that matches the function and politeness, then check it links to the next line.',
    },
    pitfall: { vi: 'Chọn câu đúng ngữ pháp nhưng không trả lời đúng điều vừa được hỏi.', en: 'Choosing a grammatical reply that does not answer what was just asked.' },
  },
  'dialogue-ordering': {
    steps: {
      vi: 'Tìm câu mở đầu (lời chào hoặc câu hỏi đầu tiên) và câu kết (cảm ơn, tạm biệt). Nối các cặp hỏi – đáp, rồi tìm từ nối như however, so, then để xếp phần giữa.',
      en: 'Find the opener (a greeting or first question) and the closer (thanks, goodbye). Match question–answer pairs, then use linkers such as however, so, then to place the middle.',
    },
    pitfall: { vi: 'Xếp theo nội dung quen thuộc mà không kiểm tra đại từ (it, they, that) đang chỉ vào đâu.', en: 'Ordering by familiar content without checking what pronouns (it, they, that) refer to.' },
  },
  'sentence-rewriting': {
    steps: {
      vi: 'Giữ nguyên nghĩa là yêu cầu số một. Nhận ra cấu trúc gốc (bị động, câu điều kiện, so sánh, tường thuật) rồi chọn cấu trúc tương đương. Kiểm tra thì và đại từ sau khi chuyển.',
      en: 'Keeping the meaning is rule one. Spot the original structure (passive, conditional, comparison, reported speech) and pick the equivalent. Check tense and pronouns after the change.',
    },
    pitfall: { vi: 'Chọn câu đúng ngữ pháp nhưng đổi mất nghĩa, nhất là với phủ định và so sánh.', en: 'Choosing a grammatical sentence that changes the meaning, especially with negatives and comparisons.' },
  },
  'sentence-combination': {
    steps: {
      vi: 'Xác định quan hệ giữa hai câu: nguyên nhân, nhượng bộ, mục đích, đối lập. Chọn liên từ hoặc cấu trúc đúng quan hệ đó, rồi kiểm tra dấu câu và chủ ngữ.',
      en: 'Identify the relation between the two sentences: cause, concession, purpose, contrast. Choose the linker or structure for that relation, then check punctuation and subjects.',
    },
    pitfall: { vi: 'Dùng liên từ sai quan hệ (ví dụ because thay vì although).', en: 'Using a linker with the wrong relation (for example because instead of although).' },
  },
  cloze: {
    steps: {
      vi: 'Đọc lướt cả đoạn để nắm ý trước khi điền. Với mỗi chỗ trống, nhìn từ đứng trước và sau để biết loại từ, rồi chọn từ hợp ý của cả câu. Điền xong đọc lại đoạn để chắc mạch văn liền.',
      en: 'Skim the whole passage for the gist before filling in. For each gap look at the words before and after to find the word type, then pick what fits the sentence’s meaning. Re-read the passage to check it flows.',
    },
    pitfall: { vi: 'Điền từng câu riêng lẻ, không để ý ý chung của đoạn.', en: 'Filling each gap in isolation without the passage’s overall idea.' },
  },
  'reading-comprehension': {
    steps: {
      vi: 'Đọc câu hỏi trước, gạch từ khóa, rồi tìm đoạn chứa từ khóa đó. Đáp án đúng thường là cách diễn đạt khác của câu trong bài, không phải câu y nguyên.',
      en: 'Read the question first, underline keywords, then locate the matching part of the passage. The right answer is usually a paraphrase of the text, not a copy of it.',
    },
    pitfall: { vi: 'Chọn đáp án chứa nhiều từ giống bài nhất, trong khi nó đổi ý hoặc nói quá hơn bài.', en: 'Choosing the option that shares the most words with the text when it changes or overstates the idea.' },
  },
  reasoning: {
    steps: {
      vi: 'Liệt kê dữ kiện cho sẵn bằng lời của mình. Chỉ chọn kết luận mà dữ kiện bảo đảm được, loại mọi đáp án cần thêm giả định. Thử phủ định đáp án để xem dữ kiện có mâu thuẫn không.',
      en: 'Restate the given facts in your own words. Choose only a conclusion the facts guarantee and drop options that need an extra assumption. Try negating an option to see if it contradicts the facts.',
    },
    pitfall: { vi: 'Chọn kết luận “nghe hợp lý” nhưng dữ kiện không đủ để khẳng định.', en: 'Choosing a conclusion that “sounds reasonable” but is not supported by the facts.' },
  },
  'vocabulary-in-context': {
    steps: {
      vi: 'Đọc cả câu chứa từ và câu ngay trước nó. Đoán nghĩa từ manh mối (đối lập, ví dụ, giải thích đi kèm), rồi thử thế đáp án vào đúng vị trí của từ.',
      en: 'Read the sentence with the word and the one before it. Infer the meaning from clues (contrast, example, nearby explanation), then substitute each option into the word’s place.',
    },
    pitfall: { vi: 'Dùng nghĩa từ điển đầu tiên mà quên rằng từ đa nghĩa đổi nghĩa theo bài.', en: 'Using the first dictionary meaning and forgetting that polysemous words change with the text.' },
  },
  'author-purpose': {
    steps: {
      vi: 'Tự hỏi “tác giả viết đoạn này để làm gì: giải thích, so sánh, phản bác, đề xuất?”. Nhìn động từ ở đầu mỗi đáp án và chọn động từ khớp cách đoạn văn vận hành.',
      en: 'Ask “why did the author write this: explain, compare, refute, propose?”. Look at the verb opening each option and pick the one that matches how the passage works.',
    },
    pitfall: { vi: 'Chọn mục đích quá rộng hoặc chỉ khớp một chi tiết nhỏ.', en: 'Choosing a purpose that is too broad or matches only one small detail.' },
  },
  'evidence-evaluation': {
    steps: {
      vi: 'Xác định chính xác điều cần chứng minh. Bằng chứng tốt phải liên quan trực tiếp, đủ mạnh và không chỉ lặp lại luận điểm. Loại đáp án nói chung chung hoặc lạc đề.',
      en: 'Pin down exactly what needs proving. Good evidence is directly relevant, strong enough and not just a restatement of the claim. Drop vague or off-topic options.',
    },
    pitfall: { vi: 'Chọn bằng chứng cùng chủ đề nhưng không liên quan tới luận điểm đang xét.', en: 'Choosing evidence on the same topic that does not bear on the claim being tested.' },
  },
  'data-interpretation': {
    steps: {
      vi: 'Đọc tiêu đề và đơn vị của bảng hay biểu đồ trước. Tìm đúng hàng, cột mà câu hỏi nhắc tới, rồi so sánh số liệu. Chỉ kết luận điều số liệu cho thấy, không suy thêm nguyên nhân.',
      en: 'Read the title and units of the table or chart first. Find the exact row and column the question names, then compare the figures. Conclude only what the data shows, not extra causes.',
    },
    pitfall: { vi: 'Nhầm đơn vị hoặc đọc xu hướng từ hai điểm dữ liệu.', en: 'Mixing up units or reading a trend from two data points.' },
  },
  'sentence-insertion': {
    steps: {
      vi: 'Đọc câu cần chèn và tìm đại từ hoặc từ nối trong đó (this, however, for example). Tìm vị trí mà câu trước giải thích được những từ đó và câu sau vẫn nối mạch.',
      en: 'Read the sentence to insert and find the pronouns or linkers in it (this, however, for example). Find the spot where the previous sentence explains them and the next one still follows.',
    },
    pitfall: { vi: 'Chèn theo chủ đề chung mà không kiểm tra từ nối trong câu.', en: 'Inserting by general topic without checking the linkers in the sentence.' },
  },
};
