import { sha256 } from '@noble/hashes/sha2.js';

import { canonicalize } from '@/services/credential/canonical';
import { base58btcEncode } from '@/services/credential/keys';
import { signPayload, verifyPayload, type VerifyFailure } from '@/services/credential/sign';

/**
 * Nhãn xuất xứ cho một câu hỏi do AI sinh.
 *
 * VÌ SAO CÓ NÓ. Người học đang làm những câu hỏi mà họ không biết ai viết, đã bị
 * kiểm những gì, và đã hỏng bao nhiêu lần trước khi tới tay mình. Cả ngành đang
 * bán đề sinh bằng LLM mà không kèm một dòng xuất xứ nào. Nhãn này là "nhãn dinh
 * dưỡng" cho nội dung do máy sinh: model nào viết, hàng rào nào đã chạy, và —
 * quan trọng nhất — hàng rào nào CHƯA chạy.
 *
 * ĐÂY LÀ DẠNG CỤ THỂ CỦA AI LITERACY, không phải một bài giảng về AI literacy.
 * Một dòng "câu này đã bị loại 2 lần vì trích dẫn không có thật trong bài" dạy
 * chuyện model bịa hiệu quả hơn mọi lời cảnh báo, vì nó xảy ra trên đúng bài
 * người học đang làm, ngay trước mắt họ.
 *
 * LUẬT KHÔNG ĐƯỢC PHÁ: `not-run` KHÔNG BAO GIỜ được gộp vào `passed`. Lời gọi
 * model hỏng thì câu vẫn phục vụ — chặn người học vì hàng rào tự nó hỏng là phạt
 * nhầm người — nhưng nhãn phải ghi là chưa kiểm. Nói dối rằng đã kiểm biến cả
 * biên nhận thành đồ trang trí, và đó là thứ duy nhất ở đây không được phép.
 */

export type GateName = 'rules' | 'blind';

/** Vì sao một hàng rào không chạy. Không bao giờ là "coi như đỗ". */
export type NotRunReason =
  /** Lời gọi model hỏng — mạng, hạn mức, proxy chết. */
  | 'check-failed'
  /** Hàng rào này không áp dụng cho loại câu đó. */
  | 'not-applicable';

export type GateOutcome =
  | { gate: GateName; result: 'passed'; note?: string }
  | { gate: GateName; result: 'rejected'; reason: string }
  | { gate: GateName; result: 'not-run'; why: NotRunReason };

/** Mọi thứ dựng nên một nhãn, trừ chính id của nó. */
export type LabelInput = {
  itemId: string;
  sourceId: string;
  /** Tên đầy đủ của model, có phiên bản. "claude" hay "gpt" là vô dụng về sau. */
  model: string;
  generatedAt: string;
  /** Số bản nháp đã dựng, kể cả bản được nhận. */
  attempts: number;
  /** Mã lý do loại của từng bản nháp trước, theo đúng thứ tự. */
  rejectedDrafts: readonly string[];
  gates: readonly GateOutcome[];
};

export type ProvenanceLabel = LabelInput & { id: string };

export type SignedLabel = {
  label: ProvenanceLabel;
  /** DID của hệ thống đã ký nhãn — không phải của người học. */
  issuer: string;
  proofValue: string;
};

/** Mọi hàng rào phải có mặt trong một nhãn đầy đủ. */
const REQUIRED_GATES: readonly GateName[] = Object.freeze(['rules', 'blind']);

const ID_CHARS = 12;

/**
 * Id tất định của một nhãn: băm nội dung rồi cắt ngắn.
 *
 * Cắt còn 12 ký tự base58 (~70 bit) vì id này đi vào chứng chỉ và hiện trên màn
 * hình, mà một chuỗi 44 ký tự thì không ai đối chiếu bằng mắt. 70 bit vẫn thừa
 * cho vài triệu nhãn — và id KHÔNG phải thứ chống giả mạo, chữ ký mới là. Nếu
 * ai đó dựng được hai nhãn trùng id thì họ vẫn không ký nổi cái thứ hai.
 */
export function labelId(input: LabelInput): string {
  const digest = sha256(new TextEncoder().encode(canonicalize(input)));
  return base58btcEncode(digest).slice(0, ID_CHARS);
}

export function buildLabel(input: LabelInput): ProvenanceLabel {
  return { ...input, id: labelId(input) };
}

export type GateStatus = 'passed' | 'rejected' | 'not-run' | 'absent';

/** Trạng thái của một hàng rào. `absent` nghĩa là nhãn không nhắc tới nó. */
export function gateStatus(label: ProvenanceLabel, gate: GateName): GateStatus {
  const found = label.gates.find((g) => g.gate === gate);
  return found ? found.result : 'absent';
}

/**
 * Đúng khi MỌI hàng rào đều đã chạy và đều đỗ.
 *
 * `not-run` và `absent` đều trả về false. Đó là toàn bộ lý do hàm này tồn tại
 * thay vì để mỗi màn hình tự đếm — đếm tay là chỗ `not-run` lặng lẽ trôi vào
 * cột "đã kiểm".
 */
export function isFullyChecked(label: ProvenanceLabel): boolean {
  return REQUIRED_GATES.every((g) => gateStatus(label, g) === 'passed');
}

/* ------------------------------------------------------------------ chữ ký */

export function signLabel(
  label: ProvenanceLabel,
  privateKey: Uint8Array,
  issuer: string,
): SignedLabel {
  return { label, issuer, proofValue: signPayload(label, privateKey) };
}

export type LabelFailure = 'not-an-object' | 'missing-issuer' | 'missing-proof' | 'id-mismatch';

export const LABEL_FAILURE_VI: Readonly<Record<LabelFailure, string>> = Object.freeze({
  'not-an-object': 'Không phải một nhãn hợp lệ',
  'missing-issuer': 'Thiếu issuer',
  'missing-proof': 'Thiếu chữ ký',
  'id-mismatch': 'id không khớp nội dung — nhãn đã bị sửa',
});

export type LabelReport =
  | { ok: true; id: string; issuer: string; fullyChecked: boolean }
  | { ok: false; code: LabelFailure | VerifyFailure; reason: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Kiểm một nhãn. Không bao giờ ném.
 *
 * Kiểm id TRƯỚC chữ ký, có chủ ý: id sai nghĩa là nội dung không tự nhất quán,
 * và câu trả lời "id không khớp nội dung" chỉ thẳng vào chỗ hỏng, còn "chữ ký
 * không khớp" thì đúng nhưng dẫn người đi tìm sai chỗ.
 */
export function verifyLabel(raw: unknown): LabelReport {
  if (!isRecord(raw) || !isRecord(raw.label)) {
    return { ok: false, code: 'not-an-object', reason: LABEL_FAILURE_VI['not-an-object'] };
  }
  if (typeof raw.issuer !== 'string') {
    return { ok: false, code: 'missing-issuer', reason: LABEL_FAILURE_VI['missing-issuer'] };
  }
  if (typeof raw.proofValue !== 'string') {
    return { ok: false, code: 'missing-proof', reason: LABEL_FAILURE_VI['missing-proof'] };
  }

  const label = raw.label as unknown as ProvenanceLabel;
  const { id, ...input } = label;
  let recomputed: string;
  try {
    recomputed = labelId(input as LabelInput);
  } catch {
    return { ok: false, code: 'not-an-object', reason: LABEL_FAILURE_VI['not-an-object'] };
  }
  if (recomputed !== id) {
    return { ok: false, code: 'id-mismatch', reason: LABEL_FAILURE_VI['id-mismatch'] };
  }

  const verdict = verifyPayload(label, raw.proofValue, raw.issuer);
  if (!verdict.ok) return { ok: false, code: verdict.code, reason: verdict.reason };

  return { ok: true, id, issuer: raw.issuer, fullyChecked: isFullyChecked(label) };
}
