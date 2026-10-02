import type { GeneratedQuestion } from './types';
import { overlapRatio } from '@/services/proofloop/probe-validity';
import { COMPLETION_TYPES } from './ielts-types';

/**
 * Bộ kiểm đề đọc — chạy TRƯỚC khi một bộ đề được đóng băng vào seed.
 *
 * VÌ SAO CẦN. Đề thi trong app không còn sinh lúc chạy nữa: nó sinh một lần lúc
 * build rồi nằm yên trong seed. Đổi lại tính ổn định ấy là mất luôn cơ hội sửa
 * sau — một bộ đề hỏng lọt vào seed thì mọi người mở nó đều gặp cùng cái hỏng,
 * mãi mãi, cho tới khi có ai đó tình cờ nhận ra. Nên hàng rào phải đứng ở đúng
 * cửa đóng băng.
 *
 * NHỮNG LUẬT DƯỚI ĐÂY KHÔNG PHẢI TÔI NGHĨ RA. Chúng chép lại đúng những kiểu
 * hỏng mà bản sinh-bằng-luật trước đã mắc và đã được ghi lại trong
 * `offline-generator.ts`: đáp án luôn ở đoạn 1, câu hỏi chép nguyên câu trong
 * bài nên dò chuỗi là ra, TFNG chỉ có một nhãn. Mỗi luật ở đây bịt đúng một
 * trong số đó.
 */

export type QuestionRejection =
  /** Câu trích dẫn không có thật trong bài. */
  | 'evidence-not-in-passage'
  /** Chỉ số đoạn không trỏ tới đoạn chứa câu trích. */
  | 'evidence-paragraph-mismatch'
  /** Đáp án điền từ không có trong bài — người học không thể tìm ra. */
  | 'answer-not-in-passage'
  /** Trắc nghiệm mà đáp án không nằm trong các phương án. */
  | 'answer-not-among-options'
  /** TFNG/YNNG trả về nhãn ngoài ba nhãn hợp lệ. */
  | 'bad-label'
  /** Đề chép gần nguyên câu trong bài — dò chuỗi là ra, không cần đọc. */
  | 'stem-copies-evidence'
  /** Thiếu phương án, hoặc phương án trùng nhau. */
  | 'bad-options';

export type SetRejection =
  /** Cả bộ chỉ có một nhãn TFNG — đoán bừa một nhãn là trúng hết. */
  | 'labels-not-varied'
  /** Trắc nghiệm dồn hết vào một chữ cái. */
  | 'answer-letter-bias'
  /** Bằng chứng dồn hết vào một đoạn — đoán vị trí là ra. */
  | 'evidence-clustered'
  /** Hai câu hỏi gần trùng nhau. */
  | 'duplicate-stems';

const TFNG_LABELS = new Set(['TRUE', 'FALSE', 'NOT GIVEN']);
const YNNG_LABELS = new Set(['YES', 'NO', 'NOT GIVEN']);

/** Dạng bắt người học lấy chữ TỪ TRONG BÀI, nên đáp án phải có thật ở đó. */
const FROM_PASSAGE: ReadonlySet<string> = COMPLETION_TYPES;

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trên ngưỡng này thì đề đang chép lại câu trong bài.
 *
 * Để rộng tay hơn hàng rào phép thử (0.6): đề đọc hiểu vốn phải nhắc lại vài từ
 * khoá của bài, không thì người học không biết tìm ở đâu. Chỉ chặn khi gần như
 * chép nguyên câu.
 */
const COPY_THRESHOLD = 0.8;

export type QuestionVerdict = { ok: true } | { ok: false; reason: QuestionRejection };

export function verifyQuestion(
  question: GeneratedQuestion,
  paragraphs: string[],
): QuestionVerdict {
  const bad = (reason: QuestionRejection): QuestionVerdict => ({ ok: false, reason });

  const passage = norm(paragraphs.join(' '));

  if (!question.evidenceText || !passage.includes(norm(question.evidenceText))) {
    return bad('evidence-not-in-passage');
  }

  const para = paragraphs[question.evidenceParagraphIndex];
  if (para === undefined || !norm(para).includes(norm(question.evidenceText))) {
    return bad('evidence-paragraph-mismatch');
  }

  /*
    Đề không được là bản chép của câu bằng chứng.

    Đây đúng là kiểu hỏng mà bản sinh-bằng-luật trước mắc: "chép nguyên câu
    trong bài rồi khoét một từ". Câu như vậy giải được bằng dò chuỗi, và thứ nó
    đo là kỹ năng tìm chuỗi chứ không phải đọc hiểu.
  */
  /*
    Luật này KHÔNG áp cho họ điền từ.

    Dạng điền từ lấy chính câu trong bài làm khung rồi khoét một chỗ — trùng chữ
    là bản chất của nó, không phải lỗi. Cái phải chặn ở họ ấy nằm chỗ khác và đã
    có luật riêng: đáp án phải là chữ có thật trong bài.

    Với bốn họ còn lại thì trùng gần hết chữ đúng là hỏng: câu giải được bằng dò
    chuỗi, và thứ nó đo là kỹ năng tìm chuỗi chứ không phải đọc hiểu.
  */
  if (!FROM_PASSAGE.has(question.type) && overlapRatio(question.prompt, question.evidenceText) > COPY_THRESHOLD) {
    return bad('stem-copies-evidence');
  }

  if (question.type === 'true_false_not_given' && !TFNG_LABELS.has(question.correctAnswer.trim().toUpperCase())) {
    return bad('bad-label');
  }
  if (question.type === 'yes_no_not_given' && !YNNG_LABELS.has(question.correctAnswer.trim().toUpperCase())) {
    return bad('bad-label');
  }

  if (FROM_PASSAGE.has(question.type) && !passage.includes(norm(question.correctAnswer))) {
    return bad('answer-not-in-passage');
  }

  if (question.options && question.options.length > 0) {
    const seen = new Set(question.options.map(norm));
    if (seen.size !== question.options.length || question.options.length < 3) {
      return bad('bad-options');
    }
    /*
      Đáp án trắc nghiệm có thể là nguyên văn phương án, hoặc là chữ cái A–D.
      Nhận cả hai vì hai cách viết đều gặp trong dữ liệu; điều phải chặn là đáp
      án không ứng với phương án nào.
    */
    const letter = question.correctAnswer.trim().toUpperCase();
    const byLetter = /^[A-Z]$/.test(letter) && letter.charCodeAt(0) - 65 < question.options.length;
    const byText = question.options.some((o) => norm(o) === norm(question.correctAnswer));
    if (!byLetter && !byText) return bad('answer-not-among-options');
  }

  return { ok: true };
}

export type SetVerdict = { ok: true } | { ok: false; reasons: SetRejection[] };

/**
 * Kiểm CẢ BỘ, không chỉ từng câu.
 *
 * Mỗi câu có thể hợp lệ riêng lẻ mà cả bộ vẫn đoán được: mười ba câu TFNG cùng
 * đáp án TRUE thì mỗi câu đều đúng luật, và người học chỉ cần chọn TRUE mười ba
 * lần. Đó chính là kiểu hỏng "đáp án LUÔN là đoạn 1" của bản trước.
 */
export function verifySet(questions: GeneratedQuestion[], paragraphs: string[]): SetVerdict {
  const reasons: SetRejection[] = [];

  for (const kind of ['true_false_not_given', 'yes_no_not_given'] as const) {
    const labels = questions.filter((q) => q.type === kind).map((q) => q.correctAnswer.trim().toUpperCase());
    if (labels.length >= 3 && new Set(labels).size < 2) reasons.push('labels-not-varied');
  }

  const mc = questions.filter((q) => q.type === 'multiple_choice');
  if (mc.length >= 4) {
    const letters = mc.map((q) => q.correctAnswer.trim().toUpperCase()[0]);
    if (new Set(letters).size < 2) reasons.push('answer-letter-bias');
  }

  /*
    Bằng chứng phải rải ra. Nếu quá nửa số câu cùng trỏ về một đoạn thì người học
    đọc mỗi đoạn ấy là làm được cả bộ, và bài đọc còn lại thành trang trí.
  */
  if (questions.length >= 6 && paragraphs.length >= 3) {
    const counts = new Map<number, number>();
    for (const q of questions) {
      counts.set(q.evidenceParagraphIndex, (counts.get(q.evidenceParagraphIndex) ?? 0) + 1);
    }
    const worst = Math.max(...counts.values());
    if (worst > questions.length * 0.5) reasons.push('evidence-clustered');
  }

  for (let i = 0; i < questions.length; i += 1) {
    for (let j = i + 1; j < questions.length; j += 1) {
      const a = questions[i] as GeneratedQuestion;
      const b = questions[j] as GeneratedQuestion;
      if (overlapRatio(a.prompt, b.prompt) > 0.85) {
        reasons.push('duplicate-stems');
        i = questions.length;
        break;
      }
    }
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
