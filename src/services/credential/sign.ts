import { ed25519 } from '@noble/curves/ed25519.js';

import { canonicalize } from './canonical';
import { base58btcDecode, base58btcEncode, publicKeyFromDidKey } from './keys';

/**
 * Ký và kiểm chữ ký trên dữ liệu JSON.
 *
 * KÝ THÌ NÉM LỖI, KIỂM THÌ TRẢ VỀ LÝ DO. Hai chiều này cố ý không đối xứng:
 *
 *   · Lúc ký, dữ liệu là của chính mình. Nó hỏng nghĩa là mã của mình sai, và
 *     câu trả lời đúng là dừng ngay tại chỗ — chứ không phải tạo ra một chữ ký
 *     hợp lệ về hình thức trên một payload méo.
 *   · Lúc kiểm, dữ liệu đến từ NGƯỜI LẠ. Một bộ kiểm mà ném lỗi khi gặp file rác
 *     là một bộ kiểm không dùng được: dán nhầm file vào là nó sập, thay vì nói
 *     "file này không hợp lệ vì…". Mọi đầu vào hỏng đều phải ra một lý do đọc
 *     được.
 *
 * CHỮ KÝ KHÔNG CHỨNG MINH ĐIỀU NGƯỜI TA HAY TƯỞNG. Nó chứng minh "dữ liệu này
 * không bị sửa sau khi ký, bởi người giữ khoá này". Nó KHÔNG chứng minh người
 * học không gian lận lúc làm bài. Hai chuyện khác nhau, và chỗ nào nói về chứng
 * chỉ cũng phải giữ đúng ranh giới ấy.
 */

/**
 * Mã lỗi máy đọc được, kèm câu tiếng Việt cho mặt trong app.
 *
 * VÌ SAO TÁCH MÃ RA KHỎI CÂU CHỮ. Bộ kiểm độc lập xuất tiếng Anh cho người
 * ngoài, còn app nói tiếng Việt với người học — cùng một sự cố. Trả về mỗi một
 * chuỗi thì một trong hai mặt sẽ hiện sai ngôn ngữ, và dịch ngược một câu văn
 * là việc không làm nổi. Mã thì mỗi mặt tự dựng câu của mình.
 *
 * Cùng khuôn với `QuestionRejection` và `RetryReason` đã có trong repo.
 */
export type VerifyFailure =
  /** DID không đọc được: sai phương thức, sai multibase, sai loại khoá. */
  | 'bad-did'
  /** Chữ ký thiếu tiền tố multibase "z". */
  | 'proof-not-multibase'
  /** Chuỗi chữ ký không giải mã base58 được. */
  | 'proof-undecodable'
  /** Chữ ký giải ra không đúng 64 byte. */
  | 'proof-bad-length'
  /** Nội dung không tuần tự hoá tất định được. */
  | 'payload-not-canonical'
  /** Chữ ký đúng dạng nhưng không hợp lệ về mặt toán. */
  | 'signature-malformed'
  /** Chữ ký không khớp nội dung — đã bị sửa, hoặc khoá khác ký. */
  | 'signature-mismatch';

export const FAILURE_VI: Readonly<Record<VerifyFailure, string>> = Object.freeze({
  'bad-did': 'DID không đọc được',
  'proof-not-multibase': 'Chữ ký thiếu tiền tố multibase "z" (base58btc)',
  'proof-undecodable': 'Chữ ký không giải mã được',
  'proof-bad-length': 'Chữ ký sai độ dài',
  'payload-not-canonical': 'Nội dung không tuần tự hoá được',
  'signature-malformed': 'Chữ ký không hợp lệ',
  'signature-mismatch': 'Chữ ký không khớp — nội dung đã bị sửa, hoặc do khoá khác ký',
});

export type VerifyResult =
  | { ok: true }
  | { ok: false; code: VerifyFailure; reason: string; detail?: string };

function fail(code: VerifyFailure, detail?: string): VerifyResult {
  const reason = detail ? `${FAILURE_VI[code]}: ${detail}` : FAILURE_VI[code];
  return detail ? { ok: false, code, reason, detail } : { ok: false, code, reason };
}

/**
 * Ký `payload`, trả về chuỗi chữ ký multibase base58btc (tiền tố "z").
 *
 * Ném lỗi nếu `payload` không tuần tự hoá tất định được — xem `canonical.ts`.
 */
export function signPayload(payload: unknown, privateKey: Uint8Array): string {
  const message = new TextEncoder().encode(canonicalize(payload));
  return `z${base58btcEncode(ed25519.sign(message, privateKey))}`;
}

/** Độ dài chữ ký Ed25519, cố định. */
const SIGNATURE_BYTES = 64;

/** Kiểm chữ ký. Không bao giờ ném — mọi đầu vào hỏng đều ra một lý do. */
export function verifyPayload(payload: unknown, proofValue: string, did: string): VerifyResult {
  let publicKey: Uint8Array;
  try {
    publicKey = publicKeyFromDidKey(did);
  } catch (err) {
    return fail('bad-did', (err as Error).message);
  }

  if (!proofValue.startsWith('z')) return fail('proof-not-multibase');

  let signature: Uint8Array;
  try {
    signature = base58btcDecode(proofValue.slice(1));
  } catch (err) {
    return fail('proof-undecodable', (err as Error).message);
  }
  if (signature.length !== SIGNATURE_BYTES) {
    return fail('proof-bad-length', `cần ${SIGNATURE_BYTES} byte, nhận ${signature.length}`);
  }

  let message: Uint8Array;
  try {
    message = new TextEncoder().encode(canonicalize(payload));
  } catch (err) {
    return fail('payload-not-canonical', (err as Error).message);
  }

  let valid: boolean;
  try {
    valid = ed25519.verify(signature, message, publicKey);
  } catch (err) {
    // Chữ ký đúng độ dài nhưng nằm ngoài đường cong vẫn làm thư viện ném lỗi.
    return fail('signature-malformed', (err as Error).message);
  }

  return valid ? { ok: true } : fail('signature-mismatch');
}
