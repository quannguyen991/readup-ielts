import type { ProbeDraft } from './draft-schema';
import type { ProbeKind } from './types';

/**
 * Phép thử này có đo đúng thứ nó nói không.
 *
 * VÌ SAO CẦN THÊM MỘT TẦNG NỮA. `draft-schema.ts` đã có bảy luật, nhưng cả bảy
 * đều hỏi về HÌNH THỨC: đúng định dạng chưa, chữ có nguyên văn không, đếm có
 * khớp không. Một phép thử lọt sạch bảy luật đó vẫn có thể vô dụng — chép lại
 * nguyên câu hỏi cũ, dán sẵn cụm quyết định vào đề, hoặc chỉ đường tới một đoạn
 * không hề chứa câu nó vừa trích.
 *
 * Đây là chỗ AI làm việc nặng nhất trong cả hệ thống, nên cũng là chỗ phải canh
 * chặt nhất. Model được giao một việc khó thật: cho một người vừa hỏng ở kỹ năng
 * X, hãy chế ra một câu đo đúng X và chỉ X. Không luật nào thay nó làm được việc
 * ấy. Nhưng "không thay được" không có nghĩa là "tin lời" — nó có nghĩa là phải
 * kiểm được kết quả, và kiểm bằng thứ không phải model.
 *
 * TÁCH CHẶN VỚI GHI NHẬN. Luật nào sai là hỏng thì chặn. Luật nào chỉ là dấu
 * hiệu đáng ngờ thì ghi lại chứ không chặn — chặn hết thì tỉ lệ loại vọt lên và
 * tính năng chết, mà im lặng bỏ qua thì không bao giờ biết mình đang đẻ ra đề
 * kiểu gì. Số ghi nhận được là thứ đem ra công bố được.
 */

export type ProbeRejection =
  /** Phép thử chuyển giao mà vẫn nằm trên chính bài đã gây khó khăn. */
  | 'transfer-same-source'
  /** Chỉ số đoạn không trỏ tới đoạn thật sự chứa câu vừa trích. */
  | 'evidence-paragraph-mismatch'
  /** Cụm quyết định nằm sẵn trong đề — người học chỉ cần dò chữ. */
  | 'stem-leaks-decisive-phrase'
  /** Chuyển giao mà dùng lại đúng câu bằng chứng cũ. */
  | 'transfer-reuses-original-evidence'
  /** Chuyển giao mà chỉ chép lại câu hỏi cũ. */
  | 'transfer-reuses-original-stem'
  /** Hai phương án trùng nhau sau khi chuẩn hoá. */
  | 'duplicate-options';

/** Dấu hiệu đáng ngờ — ghi lại, không chặn. Xem chú thích đầu file. */
export type ProbeWarning =
  /** Phương án đúng dài vượt trội: người học đoán được mà không cần đọc. */
  | 'correct-option-longest'
  /** Chỉ hai phương án: đoán bừa đã trúng một nửa. */
  | 'only-two-options';

export type ProbeValidityInput = {
  draft: ProbeDraft;
  kind: ProbeKind;
  /** Bài đọc của PHÉP THỬ, tách sẵn theo đoạn. */
  paragraphs: string[];
  /** Nguồn của phép thử. */
  probeSourceId: string;
  /** Nguồn nơi khó khăn đã xuất hiện. */
  difficultySourceId: string;
  /** Câu hỏi gốc đã làm lộ khó khăn. */
  originalStem: string;
  /** Câu bằng chứng của câu hỏi gốc. */
  originalEvidenceText: string;
};

export type ProbeValidityResult =
  | { ok: true; warnings: ProbeWarning[] }
  | { ok: false; reason: ProbeRejection; warnings: ProbeWarning[] };

function normalise(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function words(s: string): string[] {
  return normalise(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Hai câu có phải chỉ là một câu viết lại không.
 *
 * Dùng bigram chứ không dùng từ đơn: "the cat sat" và "sat the cat" trùng hết từ
 * đơn nhưng không trùng bigram nào, và đó đúng là điều cần phân biệt khi hỏi
 * "model có chép lại câu cũ không".
 *
 * Câu quá ngắn thì không có bigram nào để so; lúc đó lùi về so nguyên văn, vì
 * suy ra từ hai bigram là suy ra từ nhiễu.
 */
export function overlapRatio(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  if (wa.length < 3 || wb.length < 3) return normalise(a) === normalise(b) ? 1 : 0;

  const bigrams = (w: string[]) => new Set(w.slice(0, -1).map((x, i) => `${x} ${w[i + 1]}`));
  const A = bigrams(wa);
  const B = bigrams(wb);
  let shared = 0;
  for (const g of A) if (B.has(g)) shared += 1;

  // Chia cho bên NHỎ hơn, không chia cho hợp của hai bên. Model chép nguyên câu
  // cũ rồi nối thêm một mệnh đề vẫn là chép; chia cho hợp sẽ cho nó lọt.
  const denom = Math.min(A.size, B.size);
  return denom === 0 ? 0 : shared / denom;
}

/** Trên ngưỡng này thì coi là viết lại chứ không phải viết mới. */
const REUSE_THRESHOLD = 0.6;

function warningsFor(draft: ProbeDraft): ProbeWarning[] {
  const out: ProbeWarning[] = [];

  if (draft.options.length === 2) out.push('only-two-options');

  const correct = draft.options[draft.correctOption];
  const others = draft.options.filter((_, i) => i !== draft.correctOption);
  if (correct && others.length > 0) {
    const mean = others.reduce((s, o) => s + o.length, 0) / others.length;
    const longest = others.every((o) => correct.length > o.length);
    if (longest && mean > 0 && correct.length > mean * 1.6) out.push('correct-option-longest');
  }

  return out;
}

/**
 * Chạy sau `validateDraft`, không thay nó.
 *
 * Thứ tự có ý nghĩa: `validateDraft` bảo đảm bản nháp ĐÚNG HÌNH DẠNG và chữ có
 * thật trong bài. Chỉ khi đã chắc hai điều đó thì mới hỏi được câu ở đây — phép
 * thử này có đo được gì không. Đảo lại thì mọi luật dưới đây phải tự đi kiểm
 * kiểu dữ liệu, và luật kiểm nào cũng lo hai việc thì không luật nào chắc.
 */
export function checkProbeValidity(input: ProbeValidityInput): ProbeValidityResult {
  const { draft, kind, paragraphs } = input;
  const warnings = warningsFor(draft);
  const reject = (reason: ProbeRejection): ProbeValidityResult => ({ ok: false, reason, warnings });

  /*
    LUẬT NẶNG NHẤT, VÀ LÀ LÝ DO TẦNG NÀY TỒN TẠI.

    Sổ bằng chứng chỉ công nhận khi người học làm được trên một NGUỒN KHÁC — đó
    là toàn bộ lý do phép thử chuyển giao có mặt, vì lặp lại đúng bài cũ không
    tách nổi "đã hiểu" khỏi "nhớ bài này". Nhưng lời dặn gửi cho model lại bảo nó
    dựng câu mới "trong cùng bài đọc này".

    Hai câu đó chống nhau, và bên thua là cơ chế: phép thử chuyển giao chưa bao
    giờ rời khỏi bài gốc, nên điều kiện công nhận không bao giờ được thoả một
    cách thật. Luật này chặn ở đúng chỗ mâu thuẫn, để nó không thể im lặng nữa.
  */
  if (kind === 'transfer' && input.probeSourceId === input.difficultySourceId) {
    return reject('transfer-same-source');
  }

  /*
    Trích đúng chữ nhưng chỉ sai đoạn thì `validateDraft` không bắt được: nó so
    chữ với TOÀN BÀI. Với phép thử `locate` — loại chỉ hỏi mỗi "đoạn nào" — chỉ
    số đoạn sai biến đáp án đúng thành đáp án sai, và người học bị chấm oan.
  */
  const para = paragraphs[draft.evidenceParagraphIndex];
  if (para === undefined || !normalise(para).includes(normalise(draft.evidenceText))) {
    return reject('evidence-paragraph-mismatch');
  }

  /*
    Cụm quyết định nằm sẵn trong đề thì người học không cần đọc bài: dò chữ trong
    đề rồi tìm phương án chứa chữ ấy là xong. Câu đó vẫn "đúng đáp án", nên không
    có luật hình thức nào bắt được — nhưng nó không còn đo đọc hiểu nữa.
  */
  if (normalise(draft.stem).includes(normalise(draft.decisivePhrase))) {
    return reject('stem-leaks-decisive-phrase');
  }

  if (kind === 'transfer') {
    if (overlapRatio(draft.evidenceText, input.originalEvidenceText) > REUSE_THRESHOLD) {
      return reject('transfer-reuses-original-evidence');
    }
    if (overlapRatio(draft.stem, input.originalStem) > REUSE_THRESHOLD) {
      return reject('transfer-reuses-original-stem');
    }
  }

  const seen = new Set<string>();
  for (const option of draft.options) {
    const key = normalise(option);
    if (seen.has(key)) return reject('duplicate-options');
    seen.add(key);
  }

  return { ok: true, warnings };
}
