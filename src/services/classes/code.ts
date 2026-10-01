/**
 * MÃ LỚP — 6 ký tự giáo viên đọc to hoặc viết lên bảng cho cả lớp gõ.
 *
 * Bảng chữ trùng với mã nhóm mua chung (`lib/payment/reference.ts`): bỏ 0/O,
 * 1/I/L và U/V — những cặp học sinh chép nhầm khi nhìn lên bảng. 30 ký tự, 6 vị
 * trí là ~729 triệu mã: đủ để đoán mò không trúng lớp nào.
 *
 * Người gõ được phép gõ thường, có dấu cách hay gạch nối ("abc-123", "ABC 123"):
 * `normalizeClassCode` dọn hết trước khi tra.
 */
export const CLASS_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CLASS_CODE_LENGTH = 6;

/** Byte ngẫu nhiên an toàn (Web Crypto có sẵn ở Node 19+, Vercel và trình duyệt). */
function cryptoBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

/**
 * Sinh một mã mới. Lấy mẫu loại bỏ (bỏ byte ≥ 240) để mọi ký tự có xác suất
 * bằng nhau — `byte % 30` thẳng thì 16 ký tự đầu bảng ra nhiều hơn.
 */
export function generateClassCode(bytes: (n: number) => Uint8Array = cryptoBytes): string {
  const size = CLASS_CODE_ALPHABET.length;
  const limit = 256 - (256 % size);
  let code = '';
  while (code.length < CLASS_CODE_LENGTH) {
    for (const b of bytes(16)) {
      if (b >= limit) continue;
      code += CLASS_CODE_ALPHABET[b % size];
      if (code.length === CLASS_CODE_LENGTH) break;
    }
  }
  return code;
}

/** "abc-12 3" → "ABC123". Bỏ dấu cách, gạch nối, gạch dưới, dấu chấm; viết hoa. */
export function normalizeClassCode(input: string): string {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[\s\-_.·–—]+/gu, '');
}

export function isValidClassCode(code: string): boolean {
  if (code.length !== CLASS_CODE_LENGTH) return false;
  for (const ch of code) if (!CLASS_CODE_ALPHABET.includes(ch)) return false;
  return true;
}

/** Hiện mã cho dễ đọc to: "ABC123" → "ABC 123". */
export function formatClassCode(code: string): string {
  return code.length === CLASS_CODE_LENGTH ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
