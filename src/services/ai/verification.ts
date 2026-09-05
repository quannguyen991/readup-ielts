/**
 * Biên nhận kiểm chứng: app đã đối chiếu những gì AI nói, và kết quả ra sao.
 *
 * VÌ SAO CÓ FILE NÀY. App vốn ĐÃ kiểm AI ở nhiều chỗ — dò trích dẫn có thật
 * trong bài không, tính đáp án toán bằng code chứ không để model tính, so đoạn
 * bằng chứng với đoạn thật. Nhưng mọi kết quả kiểm đều bị vứt đi ngay sau khi
 * dùng: người học chỉ thấy phần đã lọc sạch, không hề biết có một lớp lọc.
 *
 * Giấu đi như vậy vừa lãng phí vừa dạy sai. Người học lớn lên cùng AI cần biết
 * ba điều, và cả ba đều chứng minh được ngay tại đây thay vì giảng suông:
 *
 *   1. AI BỊA — và bịa một cách trôi chảy, tự tin, đúng ngữ pháp.
 *   2. Có những khẳng định KIỂM ĐƯỢC bằng máy, có những khẳng định thì không.
 *   3. Việc cần làm không phải là tin hay không tin, mà là HỎI "kiểm bằng gì".
 *
 * Một biên nhận nói "AI đưa 4 dẫn chứng, 1 cái không có trong bài bạn nên đã bị
 * loại" dạy điều 1 mạnh hơn mọi bài giảng về ảo giác của mô hình ngôn ngữ —
 * bởi vì nó xảy ra trên chính bài của người học, ngay trước mắt họ.
 *
 * KHÔNG THỔI PHỒNG. Biên nhận này chỉ nói về những gì MÁY kiểm được. Chất lượng
 * nhận xét, độ chuẩn của band điểm, việc lời khuyên có hợp với người này không —
 * tất cả nằm ngoài tầm và phải được nói rõ là nằm ngoài tầm. Một biên nhận ngụ ý
 * "đã kiểm hết" còn nguy hiểm hơn không có biên nhận nào.
 */

/** Cách một khẳng định của AI được kiểm. */
export type CheckMethod =
  /** Đối chiếu nguyên văn với văn bản gốc — máy kiểm được tuyệt đối. */
  | 'quote-match'
  /** Tính lại bằng code; AI không tham gia vào con số. */
  | 'computed'
  /** So với dữ liệu có sẵn trong đề (đoạn chứa đáp án, số từ tối thiểu…). */
  | 'cross-check'
  /** Không kiểm được bằng máy — phải nói thẳng ra. */
  | 'unverifiable';

export type VerificationItem = {
  /** Tên việc, viết cho người học đọc chứ không phải tên hàm. */
  label: string;
  method: CheckMethod;
  /** Số khẳng định đã kiểm. `null` khi việc này không đếm được. */
  checked: number | null;
  /** Trong số đã kiểm, bao nhiêu cái KHÔNG qua và đã bị loại. */
  rejected: number | null;
  /** Câu giải thích ngắn cho người học. */
  noteVi: string;
};

export type VerificationReceipt = {
  /** Model đã tạo ra nội dung này. Không giấu tên. */
  model: string | null;
  items: VerificationItem[];
};

export const METHOD_LABEL: Record<CheckMethod, string> = {
  'quote-match': 'Đối chiếu nguyên văn',
  computed: 'Tính bằng code',
  'cross-check': 'So với dữ liệu đề',
  unverifiable: 'Máy không kiểm được',
};

/**
 * Đếm trích dẫn thật và trích dẫn bịa.
 *
 * Tách riêng khỏi chỗ lọc để chỗ lọc không phải gánh thêm việc thống kê, và để
 * luật "thế nào là có thật" chỉ có MỘT bản — hai bản sẽ trôi lệch nhau, và lúc
 * ấy biên nhận sẽ nói sai về chính hệ thống của mình.
 */
export function countQuoteMatches(
  quotes: readonly string[],
  source: string,
): { checked: number; rejected: number } {
  const hay = source.toLowerCase();
  let rejected = 0;
  for (const q of quotes) {
    const trimmed = q.trim();
    if (trimmed.length < 2 || !hay.includes(trimmed.toLowerCase())) rejected += 1;
  }
  return { checked: quotes.length, rejected };
}

/**
 * Biên nhận cho một lượt chấm bài viết.
 *
 * `unverifiable` để CUỐI và luôn có mặt: nếu chỉ liệt kê những thứ đã kiểm, biên
 * nhận sẽ đọc như một giấy chứng nhận, mà nó không phải. Dòng cuối là chỗ nói ra
 * phần app không bảo đảm được — và đó mới là phần dạy được nhiều nhất.
 */
export function writingReceipt(input: {
  model: string | null;
  quotesChecked: number;
  quotesRejected: number;
  annotationsChecked: number;
  annotationsRejected: number;
  wordCount: number;
}): VerificationReceipt {
  return {
    model: input.model,
    items: [
      {
        label: 'Dẫn chứng AI trích từ bài của bạn',
        method: 'quote-match',
        checked: input.quotesChecked,
        rejected: input.quotesRejected,
        noteVi:
          input.quotesRejected > 0
            ? `${input.quotesRejected} đoạn AI nói là trích từ bài bạn nhưng dò lại không có thật — đã bị loại trước khi hiện lên.`
            : 'Mọi đoạn AI nói là trích từ bài bạn đều dò lại được nguyên văn.',
      },
      {
        label: 'Vị trí các lỗi được đánh dấu',
        method: 'quote-match',
        checked: input.annotationsChecked,
        rejected: input.annotationsRejected,
        noteVi:
          input.annotationsRejected > 0
            ? `${input.annotationsRejected} lỗi không neo được vào chỗ nào trong bài nên đã bị bỏ.`
            : 'Mỗi lỗi đều neo được vào đúng một đoạn chữ có thật trong bài.',
      },
      {
        label: 'Số từ',
        method: 'computed',
        checked: 1,
        rejected: 0,
        noteVi: `${input.wordCount} từ, đếm bằng code. App không hỏi AI con số này vì nó tự đếm được — và số từ ảnh hưởng thẳng tới điểm Task Response.`,
      },
      {
        label: 'Band điểm và lời nhận xét',
        method: 'unverifiable',
        checked: null,
        rejected: null,
        noteVi:
          'Không có cách nào để máy kiểm. Đây là ước lượng của AI, có thể lệch so với giám khảo thật — đó là lý do app luôn trả một KHOẢNG band chứ không phải một con số.',
      },
    ],
  };
}

/** Tổng kết một dòng, dùng cho nhãn thu gọn. */
export function summarise(receipt: VerificationReceipt): {
  checked: number;
  rejected: number;
  unverifiable: number;
} {
  let checked = 0;
  let rejected = 0;
  let unverifiable = 0;
  for (const item of receipt.items) {
    if (item.method === 'unverifiable') {
      unverifiable += 1;
      continue;
    }
    checked += item.checked ?? 0;
    rejected += item.rejected ?? 0;
  }
  return { checked, rejected, unverifiable };
}
