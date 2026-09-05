import type { ProbeDraft } from '@/services/proofloop/draft-schema';
import { hashId } from '@/services/proofloop/transfer-source';

/**
 * Cấy MỘT lỗi có tên vào một bản do AI sinh ra, để hỏi người học có nhận ra không.
 *
 * VÌ SAO DẠY BẰNG CÁCH NÀY. Vế thứ hai của đề bài cuộc thi — và của đời sống —
 * là người học phải biết đọc kết quả do máy sinh ra. Dạy điều đó bằng một bài
 * giảng "AI có thể bịa đặt" thì họ gật đầu rồi quên. Cho họ bắt tận tay một lỗi
 * trên chính bài họ vừa làm thì khác hẳn, vì lúc đó nó không còn là chuyện người
 * ta kể.
 *
 * VÌ SAO CẤY CHỨ KHÔNG CHỜ AI TỰ SAI. Chờ thì không đo được: không biết bao giờ
 * lỗi xuất hiện, không biết lỗi loại gì, và quan trọng nhất là KHÔNG BIẾT ĐÁP ÁN
 * — không có đối chứng thì mọi câu trả lời của người học đều không kết luận được.
 * Cấy thì đối chứng là thứ ta tự đặt vào, nên chấm được bằng luật chứ không phải
 * bằng một model khác chấm hộ.
 *
 * MỘT NỬA SỐ BẢN PHẢI SẠCH. Không có bản sạch thì người học học được đúng một
 * mẹo: cứ nói "có lỗi" là trúng. Lúc ấy con số đẹp lên còn năng lực thì không,
 * và cái đang đo trở thành thói quen bấm nút. Không kêu oan cũng là một năng lực,
 * và ở đây nó có kỹ năng riêng để ghi vào sổ.
 */

/** Bốn họ lỗi. Mỗi họ là một cách khác nhau mà một bản AI trôi chảy vẫn sai. */
export type FlawKind =
  /** Trích dẫn hoặc con số không có thật trong nguồn. */
  | 'fabricated-evidence'
  /** Trích đúng chữ nhưng chỉ sai chỗ. */
  | 'wrong-source-pointer'
  /** Tuyên bố một điều nó không có cách nào kiểm được. */
  | 'overclaim'
  /** Lời giải thích chống lại chính đáp án nó chấm là đúng. */
  | 'self-contradiction';

export const FLAW_KINDS: readonly FlawKind[] = [
  'fabricated-evidence',
  'wrong-source-pointer',
  'overclaim',
  'self-contradiction',
];

export const FLAW_LABEL: Readonly<Record<FlawKind, string>> = Object.freeze({
  'fabricated-evidence': 'Trích dẫn không có trong bài',
  'wrong-source-pointer': 'Chỉ sai chỗ trong bài',
  overclaim: 'Nói chắc một điều nó không kiểm được',
  'self-contradiction': 'Giải thích ngược với đáp án',
});

/** Khoá kỹ năng cho bản SẠCH: nhận ra không có gì sai cũng là một năng lực. */
export const NO_FALSE_ALARM = 'false-alarm-control';

/** Bản đem cho người học soi, kèm đối chứng ta tự đặt vào. */
export type AuditItem = {
  shown: ProbeDraft;
  /** Câu AI nói thêm — chỗ duy nhất lỗi `overclaim` sống được. */
  extraNote: string | null;
  /** Lỗi đã cấy, `null` nghĩa là bản này sạch. */
  planted: FlawKind | null;
};

/**
 * Thay một từ dài trong câu bằng một từ dài lấy từ chỗ khác của bài.
 *
 * Cách này cho ra một câu trích ĐỌC VẪN TRÔI nhưng không còn nguyên văn — đúng
 * kiểu bịa mà model hay mắc nhất, và cũng là kiểu khó bắt nhất bằng mắt. Ghép
 * đại một từ vô nghĩa thì người học nhận ra ngay, và bài kiểm mất hết giá trị.
 */
function fabricate(evidenceText: string, paragraphs: string[]): string | null {
  const words = evidenceText.split(/(\s+)/);
  const targetIndex = words.findIndex((w) => /^[A-Za-z]{6,}$/.test(w));
  if (targetIndex === -1) return null;

  const target = words[targetIndex] as string;
  const pool = paragraphs
    .join(' ')
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter((w) => w.length >= 6 && w.toLowerCase() !== target.toLowerCase());
  if (pool.length === 0) return null;

  const replacement = pool[hashId(evidenceText) % pool.length] as string;
  words[targetIndex] = replacement;
  return words.join('');
}

const OVERCLAIM_NOTES = [
  'This confirms you have fully understood inference questions.',
  'Based on this answer you are ready for Band 7.5.',
  'You clearly guessed on the previous question.',
] as const;

/**
 * Dựng bản đem soi từ một bản nháp đã hợp lệ.
 *
 * TẤT ĐỊNH theo `seed`: cùng một lượt thì luôn ra cùng một bản. Bốc ngẫu nhiên
 * làm hỏng hai thứ — không dựng lại được ca lạ khi cần soi, và trong nghiên cứu
 * hai tuần thì "mỗi em gặp một bản khác nhau" là biến không kiểm soát nằm ngay
 * giữa phép đo.
 *
 * Cấy hỏng thì trả về bản SẠCH chứ không cố cấy kiểu khác. Nói dối rằng có lỗi
 * trong khi không cấy được lỗi nào là hỏng nặng hơn hẳn việc thiếu một bản bẩn.
 */
export function buildAuditItem(
  draft: ProbeDraft,
  paragraphs: string[],
  seed: string,
): AuditItem {
  const h = hashId(seed);

  // Một nửa sạch — xem chú thích đầu tệp.
  if (h % 2 === 0) return { shown: draft, extraNote: null, planted: null };

  const kind = FLAW_KINDS[Math.floor(h / 2) % FLAW_KINDS.length] as FlawKind;

  if (kind === 'fabricated-evidence') {
    const faked = fabricate(draft.evidenceText, paragraphs);
    if (faked === null) return { shown: draft, extraNote: null, planted: null };
    return {
      shown: { ...draft, evidenceText: faked },
      extraNote: null,
      planted: 'fabricated-evidence',
    };
  }

  if (kind === 'wrong-source-pointer') {
    // Bài chỉ có một đoạn thì không có chỗ nào để chỉ sai.
    if (paragraphs.length < 2) return { shown: draft, extraNote: null, planted: null };
    const moved = (draft.evidenceParagraphIndex + 1) % paragraphs.length;
    return {
      shown: { ...draft, evidenceParagraphIndex: moved },
      extraNote: null,
      planted: 'wrong-source-pointer',
    };
  }

  if (kind === 'overclaim') {
    /*
      Ba câu này vi phạm đúng luật mà cả app tự đặt ra cho mình: không nói về thứ
      không nhìn thấy được. Người học bắt được câu như vậy trên bản của AI là đã
      học được chính cái luật ấy, mà không cần ai giảng.
    */
    const note = OVERCLAIM_NOTES[h % OVERCLAIM_NOTES.length] as string;
    return { shown: draft, extraNote: note, planted: 'overclaim' };
  }

  // self-contradiction: lời giải thích quay sang chê chính phương án được chấm đúng.
  if (draft.whyEachWrong.length === 0) return { shown: draft, extraNote: null, planted: null };
  const correctText = draft.options[draft.correctOption] ?? '';
  const twisted = [...draft.whyEachWrong];
  twisted[0] = `"${correctText}" is not supported by the passage, so it cannot be the answer.`;
  return {
    shown: { ...draft, whyEachWrong: twisted },
    extraNote: null,
    planted: 'self-contradiction',
  };
}
