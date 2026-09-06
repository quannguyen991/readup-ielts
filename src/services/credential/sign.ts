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

export type VerifyResult = { ok: true } | { ok: false; reason: string };

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
    return { ok: false, reason: `DID không đọc được: ${(err as Error).message}` };
  }

  if (!proofValue.startsWith('z')) {
    return { ok: false, reason: 'Chữ ký thiếu tiền tố multibase "z" (base58btc)' };
  }

  let signature: Uint8Array;
  try {
    signature = base58btcDecode(proofValue.slice(1));
  } catch (err) {
    return { ok: false, reason: `Chữ ký không giải mã được: ${(err as Error).message}` };
  }
  if (signature.length !== SIGNATURE_BYTES) {
    return { ok: false, reason: `Chữ ký phải dài ${SIGNATURE_BYTES} byte, nhận ${signature.length}` };
  }

  let message: Uint8Array;
  try {
    message = new TextEncoder().encode(canonicalize(payload));
  } catch (err) {
    return { ok: false, reason: `Nội dung không tuần tự hoá được: ${(err as Error).message}` };
  }

  let valid: boolean;
  try {
    valid = ed25519.verify(signature, message, publicKey);
  } catch (err) {
    // Chữ ký đúng độ dài nhưng nằm ngoài đường cong vẫn làm thư viện ném lỗi.
    return { ok: false, reason: `Chữ ký không hợp lệ: ${(err as Error).message}` };
  }

  return valid
    ? { ok: true }
    : { ok: false, reason: 'Chữ ký không khớp — nội dung đã bị sửa, hoặc do khoá khác ký' };
}
