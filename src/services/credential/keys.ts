import { ed25519 } from '@noble/curves/ed25519.js';

/**
 * Danh tính người học: cặp khoá Ed25519 và `did:key` dựng từ khoá công khai.
 *
 * VÌ SAO `did:key` CHỨ KHÔNG BLOCKCHAIN. `did:key` không cần sổ cái, không cần
 * máy chủ, không cần mạng: định danh CHÍNH LÀ khoá công khai đã mã hoá, nên ai
 * cầm chuỗi DID là kiểm được chữ ký ngay tại chỗ, kể cả lúc mất mạng. Mọi
 * phương thức DID khác đều đòi tra cứu ở đâu đó — mà "ở đâu đó" là thứ trường
 * học vùng thiếu hạ tầng không có, và cũng là thứ biến một hồ sơ năng lực thành
 * một dịch vụ có thể chết.
 *
 * ĐÁNH ĐỔI, NÓI THẲNG: mất khoá riêng là mất, không có khôi phục. Đó là cái giá
 * của việc không có máy chủ, và nó phải được nói ra ở mặt giao diện chứ không
 * giấu trong mã.
 *
 * VÌ SAO TỰ VIẾT BASE58. Repo có kỷ luật không thêm dependency khi tự làm được.
 * Base58btc là một thuật toán ngắn, định nghĩa rõ, và kiểm được bằng test —
 * thêm một gói cho bốn chục dòng là đổi một thứ đọc được lấy một thứ phải tin.
 */

export class KeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyError';
  }
}

/* ------------------------------------------------------------------ base58 */

/** Bảng chữ cái base58btc: bỏ 0, O, I, l vì nhìn dễ nhầm nhau. */
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const INDEX: ReadonlyMap<string, number> = new Map(
  ALPHABET.split('').map((c, i) => [c, i] as const),
);

/**
 * Mã hoá base58btc.
 *
 * Byte 0 ở đầu phải xử lý riêng: phép chia cơ số coi chúng là không có giá trị
 * nên chúng biến mất, mà `[0x00, 0x01]` và `[0x01]` là hai khoá khác nhau. Quy
 * ước base58btc là mỗi byte 0 đứng đầu ghi thành một ký tự "1".
 */
export function base58btcEncode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;

  // Chia liên tiếp cho 58 trên mảng chữ số cơ số 256. Dùng BigInt thì ngắn hơn
  // nhưng chậm hơn nhiều lần và không cần thiết ở kích thước 34 byte.
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i]!;
    for (let j = 0; j < digits.length; j += 1) {
      const x = digits[j]! * 256 + carry;
      digits[j] = x % 58;
      carry = (x / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let out = '1'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i -= 1) out += ALPHABET[digits[i]!];
  return out;
}

/** Giải mã base58btc. Ném `KeyError` khi gặp ký tự ngoài bảng. */
export function base58btcDecode(s: string): Uint8Array {
  if (s.length === 0) return new Uint8Array([]);

  let zeros = 0;
  while (zeros < s.length && s[zeros] === '1') zeros += 1;

  const bytes: number[] = [];
  for (let i = zeros; i < s.length; i += 1) {
    const ch = s[i]!;
    const value = INDEX.get(ch);
    if (value === undefined) {
      throw new KeyError(`Ký tự "${ch}" không thuộc bảng base58btc`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j += 1) {
      const x = bytes[j]! * 58 + carry;
      bytes[j] = x % 256;
      carry = (x / 256) | 0;
    }
    while (carry > 0) {
      bytes.push(carry % 256);
      carry = (carry / 256) | 0;
    }
  }

  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[zeros + i] = bytes[bytes.length - 1 - i]!;
  return out;
}

/* ----------------------------------------------------------------- did:key */

/** Tiền tố multicodec của ed25519-pub, viết dạng varint: 0xed 0x01. */
const ED25519_MULTICODEC = Object.freeze([0xed, 0x01]);

const PUBLIC_KEY_BYTES = 32;

export type KeyPair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  did: string;
};

/** `did:key` cho một khoá công khai Ed25519 32 byte. */
export function didKeyFromPublicKey(publicKey: Uint8Array): string {
  if (publicKey.length !== PUBLIC_KEY_BYTES) {
    throw new KeyError(`Khoá công khai Ed25519 phải 32 byte, nhận ${publicKey.length}`);
  }
  const prefixed = new Uint8Array(ED25519_MULTICODEC.length + publicKey.length);
  prefixed.set(ED25519_MULTICODEC, 0);
  prefixed.set(publicKey, ED25519_MULTICODEC.length);
  // "z" là tiền tố multibase cho base58btc. Không có nó thì không biết chuỗi
  // đằng sau được mã hoá bằng bảng nào.
  return `did:key:z${base58btcEncode(prefixed)}`;
}

/**
 * Lấy lại khoá công khai từ một `did:key`.
 *
 * Kiểm cả mã multicodec chứ không chỉ độ dài: x25519-pub cũng là 32 byte và
 * cũng đi qua base58 trót lọt. Nhận nhầm nó thì mọi phép kiểm chữ ký sau đó đều
 * trượt, mà thông báo lỗi lại nói về chữ ký chứ không nói về khoá — đúng loại
 * lỗi dẫn người đi tìm sai chỗ.
 */
export function publicKeyFromDidKey(did: string): Uint8Array {
  if (!did.startsWith('did:key:')) {
    throw new KeyError('Chỉ nhận DID phương thức "key"');
  }
  const encoded = did.slice('did:key:'.length);
  if (!encoded.startsWith('z')) {
    throw new KeyError('Thiếu tiền tố multibase "z" (base58btc)');
  }

  const bytes = base58btcDecode(encoded.slice(1));
  if (bytes.length !== ED25519_MULTICODEC.length + PUBLIC_KEY_BYTES) {
    throw new KeyError(`Khoá phải dài ${ED25519_MULTICODEC.length + PUBLIC_KEY_BYTES} byte, nhận ${bytes.length}`);
  }
  if (bytes[0] !== ED25519_MULTICODEC[0] || bytes[1] !== ED25519_MULTICODEC[1]) {
    const got = `0x${bytes[0]!.toString(16)} 0x${bytes[1]!.toString(16)}`;
    throw new KeyError(`Không phải khoá Ed25519 — mã multicodec là ${got}`);
  }
  return bytes.slice(ED25519_MULTICODEC.length);
}

/** Sinh một danh tính mới. Khoá riêng KHÔNG bao giờ rời khỏi thiết bị. */
export function generateKeyPair(): KeyPair {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey, did: didKeyFromPublicKey(publicKey) };
}
