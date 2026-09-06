import { gateStatus, type ProvenanceLabel } from './label';

/**
 * Sổ phán quyết — gộp các nhãn xuất xứ thành con số công bố được.
 *
 * ĐÂY LÀ CHỖ SẢN PHẨM TỰ ĐẺ RA PHÉP ĐO. Mỗi lần ReadUp sinh một câu hỏi, hàng
 * rào bịt mắt cho ra một phán quyết về hành vi của model. Trước tệp này, phán
 * quyết ấy sống trong một HTTP response rồi biến mất. Tích luỹ nó lại thì app
 * không còn chỉ là app: nó là một đài quan sát chất lượng đề do AI sinh, và nó
 * tự trả tiền cho mình bằng việc đồng thời là một chỗ học tử tế.
 *
 * Câu hỏi nó trả lời: **bao nhiêu phần trăm câu hỏi đọc hiểu do AI sinh ra là
 * trả lời được mà không cần đọc bài — và model nào tệ nhất?**
 */

/** Mã lý do mà hàng rào bịt mắt sinh ra. Mọi mã khác là của hàng rào luật. */
const BLIND_REJECTION = 'answerable-without-passage';

/** Cỡ mẫu tối thiểu để được phép kết luận bất cứ điều gì. */
export const MIN_SAMPLE = 200;

/**
 * NGƯỠNG PHỦ ĐỊNH, ĐĂNG KÝ TRƯỚC KHI ĐO.
 *
 * Con số này được ghi vào mã nguồn và commit TRƯỚC khi phép đo chạy lần đầu, để
 * một kết quả đáng thất vọng không thể bị diễn giải lại sau khi đã nhìn thấy nó.
 * Lịch sử git là bằng chứng cho thứ tự ấy — đó là toàn bộ lý do nó nằm ở đây
 * chứ không nằm trong một tài liệu sửa lúc nào cũng được.
 *
 * Chọn 8% vì dưới mức đó, chi phí GẤP ĐÔI số lời gọi model không đổi lại được
 * thứ gì mà một lần rà soát tay của giáo viên không làm được rẻ hơn.
 */
export const FALSIFICATION_THRESHOLD = 0.08;

export type Counts = {
  /** Số câu có nhãn. */
  items: number;
  /** Số lượt hàng rào bịt mắt THẬT SỰ chạy — mẫu số của tỉ lệ. */
  blindRuns: number;
  /** Số lượt bị loại vì trả lời được khi chưa đọc bài — tử số. */
  blindRejections: number;
  /**
   * Số lượt hàng rào bịt mắt KHÔNG chạy được.
   *
   * Nằm ngoài phân số, đếm riêng, và luôn được công bố kèm. Gộp vào mẫu số thì
   * tỉ lệ bị pha loãng bởi những lượt chưa từng đo; gộp vào tử số thì thổi phồng.
   */
  blindNotRun: number;
  /** `null` khi chưa có lượt nào chạy — khác hẳn với 0. */
  blindRejectionRate: number | null;
  /** Đếm mọi mã lý do loại, kể cả của hàng rào luật. */
  byReason: Record<string, number>;
};

export type ModelCounts = Counts & { model: string };

export type Summary = {
  overall: Counts;
  /** Sắp theo tỉ lệ loại giảm dần — model tệ nhất lên đầu. */
  byModel: ModelCounts[];
};

function emptyCounts(): Omit<Counts, 'blindRejectionRate'> {
  return { items: 0, blindRuns: 0, blindRejections: 0, blindNotRun: 0, byReason: {} };
}

/**
 * Đếm một nhãn vào một bộ đếm.
 *
 * MỘT NHÃN CÓ THỂ MANG NHIỀU LƯỢT CHẠY. `rejectedDrafts` ghi lại từng bản nháp
 * đã bị loại, nên một câu phải dựng ba lần là ba lượt hàng rào chứ không phải
 * một. Đếm theo CÂU sẽ giấu mất đúng phần thú vị: model hỏng bao nhiêu lần trước
 * khi ra được một câu dùng được.
 */
function tally(acc: ReturnType<typeof emptyCounts>, label: ProvenanceLabel): void {
  acc.items += 1;

  for (const reason of label.rejectedDrafts) {
    acc.byReason[reason] = (acc.byReason[reason] ?? 0) + 1;
    if (reason === BLIND_REJECTION) {
      acc.blindRuns += 1;
      acc.blindRejections += 1;
    }
  }

  // Phán quyết của bản CUỐI — bản đã ra khỏi vòng thử lại.
  const final = gateStatus(label, 'blind');
  if (final === 'passed') {
    acc.blindRuns += 1;
  } else if (final === 'rejected') {
    acc.blindRuns += 1;
    acc.blindRejections += 1;
    acc.byReason[BLIND_REJECTION] = (acc.byReason[BLIND_REJECTION] ?? 0) + 1;
  } else if (final === 'not-run') {
    acc.blindNotRun += 1;
  }
  // `absent`: nhãn không nhắc tới hàng rào này. Không đếm vào đâu cả — đếm nó
  // là bịa ra một lượt chạy chưa từng xảy ra.
}

function finish(acc: ReturnType<typeof emptyCounts>): Counts {
  return {
    ...acc,
    blindRejectionRate: acc.blindRuns === 0 ? null : acc.blindRejections / acc.blindRuns,
  };
}

export function summarise(labels: readonly ProvenanceLabel[]): Summary {
  const overall = emptyCounts();
  const byModel = new Map<string, ReturnType<typeof emptyCounts>>();

  for (const label of labels) {
    tally(overall, label);
    let bucket = byModel.get(label.model);
    if (!bucket) {
      bucket = emptyCounts();
      byModel.set(label.model, bucket);
    }
    tally(bucket, label);
  }

  const models = [...byModel.entries()]
    .map(([model, acc]) => ({ model, ...finish(acc) }))
    .sort((a, b) => {
      // Model tệ nhất lên đầu. Chưa đo được thì xuống cuối chứ không xếp như 0% —
      // "chưa đo" và "đo rồi, sạch" là hai chuyện khác nhau.
      const ra = a.blindRejectionRate ?? -1;
      const rb = b.blindRejectionRate ?? -1;
      return rb - ra || b.blindRuns - a.blindRuns;
    });

  return { overall: finish(overall), byModel: models };
}

/**
 * Kết luận đã VIẾT SẴN cho từng khả năng, không diễn giải lại sau khi thấy số.
 *
 * Cả ba câu dưới đây được soạn trước khi phép đo chạy lần đầu. Việc chọn câu nào
 * là một phép so sánh số học, không phải một quyết định — đó chính là điều làm
 * cho việc đăng ký trước có nghĩa.
 */
export type PreregisteredVerdict =
  | { kind: 'sample-too-small'; text: string }
  | { kind: 'below-threshold'; text: string }
  | { kind: 'above-threshold'; text: string };

export function preregisteredVerdict(summary: Summary): PreregisteredVerdict {
  const { blindRuns, blindRejectionRate } = summary.overall;

  if (blindRuns < MIN_SAMPLE || blindRejectionRate === null) {
    return {
      kind: 'sample-too-small',
      text:
        `Mẫu ${blindRuns} lượt, dưới mức tối thiểu ${MIN_SAMPLE} đã đăng ký. ` +
        'Không rút kết luận nào từ con số này.',
    };
  }

  const pct = (blindRejectionRate * 100).toFixed(1);

  if (blindRejectionRate < FALSIFICATION_THRESHOLD) {
    return {
      kind: 'below-threshold',
      text:
        `Tỉ lệ loại ${pct}%, dưới ngưỡng ${FALSIFICATION_THRESHOLD * 100}% đã đăng ký trước. ` +
        'Hàng rào bịt mắt bắt được ít hơn mức đáng để chạy ở quy mô lớn: chi phí gấp đôi số ' +
        'lời gọi model để loại dưới một câu trong mười hai. Cơ chế đúng về nguyên tắc nhưng ' +
        'không đáng tiền ở quy mô này.',
    };
  }

  return {
    kind: 'above-threshold',
    text:
      `Tỉ lệ loại ${pct}% trên ${blindRuns} lượt, vượt ngưỡng ${FALSIFICATION_THRESHOLD * 100}% ` +
      'đã đăng ký trước. Một phần đáng kể đề đọc hiểu do AI sinh ra trả lời được mà không cần ' +
      'đọc bài, và không luật hình thức nào bắt được chúng.',
  };
}
