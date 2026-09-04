/**
 * Dựng chuỗi QR chuyển khoản theo chuẩn VietQR (Napas) / EMVCo.
 *
 * KHÔNG GỌI API NÀO. Chuỗi QR là dữ liệu thuần: vài trường TLV nối lại rồi ký
 * bằng CRC-16. Có dịch vụ sinh ảnh QR miễn phí (img.vietqr.io), nhưng dùng nó
 * nghĩa là trang thanh toán phụ thuộc một máy chủ bên thứ ba — hỏng lúc nào
 * không biết, và số tài khoản của người bán đi qua máy họ mỗi lần hiện trang.
 * Sinh tại chỗ thì không có cả hai vấn đề, và chạy được cả khi mất mạng.
 *
 * CẤU TRÚC EMVCo: mỗi trường là `<id 2 chữ số><độ dài 2 chữ số><giá trị>`, lồng
 * nhau được. Trường 63 (CRC) luôn đứng cuối và được tính trên TOÀN BỘ chuỗi
 * phía trước, KỂ CẢ bốn ký tự "6304" của chính nó — chi tiết này sai là mọi app
 * ngân hàng đều báo "mã QR không hợp lệ" mà không nói vì sao.
 *
 * Tham chiếu: EMV QR Code Specification for Payment Systems (MPM), và tài liệu
 * VietQR của Napas cho nhánh 38.
 */

export type VietQrInput = {
  /** Mã BIN 6 chữ số của ngân hàng thụ hưởng. Vietcombank 970436, MB 970422… */
  bankBin: string;
  /**
   * Số tài khoản thụ hưởng.
   *
   * CHỮ VÀ SỐ, không phải chỉ số. Tài khoản ảo (VA) của ZaloPay, MoMo, ViettelPay
   * đều có dạng như `99ZP26030M39069491` — chặn chữ cái ở đây là loại bỏ đúng
   * nhóm người bán phổ biến nhất ở Việt Nam.
   */
  accountNumber: string;
  /** Số tiền, đơn vị đồng. Bỏ qua = QR để người trả tự nhập số tiền. */
  amountVnd?: number | null;
  /** Nội dung chuyển khoản. Ngân hàng thường viết hoa và bỏ dấu, nên chỉ dùng A-Z 0-9. */
  description?: string | null;
  /** Tên người thụ hưởng, tuỳ chọn — có cũng chỉ để người trả yên tâm. */
  accountName?: string | null;
};

/**
 * Một trường TLV.
 *
 * Độ dài LUÔN hai chữ số có đệm 0. `"9"` là sai, phải là `"09"` — lỗi này sinh
 * ra một chuỗi trông vẫn hợp lý nhưng máy quét đọc lệch từ đó trở đi.
 */
export function tlv(id: string, value: string): string {
  if (id.length !== 2) throw new Error(`ID trường phải đúng 2 chữ số, nhận "${id}".`);
  if (value.length > 99) {
    throw new Error(`Giá trị trường ${id} dài ${value.length} ký tự, EMVCo chỉ cho tối đa 99.`);
  }
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/**
 * CRC-16/CCITT-FALSE: đa thức 0x1021, khởi tạo 0xFFFF, không đảo bit, không XOR ra.
 *
 * Có cả tá biến thể CRC-16 và chúng cho kết quả khác nhau hoàn toàn. Giá trị
 * kiểm chuẩn của biến thể này là CRC("123456789") = 0x29B1 — test khoá đúng con
 * số đó, vì chọn nhầm biến thể là lỗi im lặng: chuỗi vẫn dựng ra, chỉ có điều
 * không app ngân hàng nào quét được.
 */
export function crc16(input: string): number {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/**
 * Chuẩn hoá nội dung chuyển khoản.
 *
 * Ngân hàng Việt Nam gần như luôn bỏ dấu và viết hoa nội dung, và nhiều nơi cắt
 * cả ký tự đặc biệt. Nếu ta gửi đi "Nâng cấp gói Pro" mà sao kê về là
 * "NANG CAP GOI PRO" thì việc đối chiếu bằng chuỗi sẽ trượt. Nên tự chuẩn hoá
 * TRƯỚC, để thứ ta lưu và thứ ngân hàng trả về là một.
 */
export function normalizeDescription(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const GUID_NAPAS = 'A000000727';
/** Chuyển khoản tới TÀI KHOẢN. `QRIBFTTC` là tới thẻ — khác nhau, đừng đổi bừa. */
const SERVICE_TO_ACCOUNT = 'QRIBFTTA';

export function buildVietQrPayload(input: VietQrInput): string {
  if (!/^\d{6}$/.test(input.bankBin)) {
    throw new Error(`Mã BIN ngân hàng phải là 6 chữ số, nhận "${input.bankBin}".`);
  }
  if (!/^[A-Za-z0-9]{4,19}$/.test(input.accountNumber)) {
    throw new Error(
      `Số tài khoản phải là 4–19 ký tự chữ hoặc số, nhận "${input.accountNumber}".`,
    );
  }

  const beneficiary = tlv('00', input.bankBin) + tlv('01', input.accountNumber);
  const merchantAccount =
    tlv('00', GUID_NAPAS) + tlv('01', beneficiary) + tlv('02', SERVICE_TO_ACCOUNT);

  const parts = [
    tlv('00', '01'),
    // 11 = QR tĩnh, quét nhiều lần. 12 = QR động, dùng một lần. Có số tiền cụ
    // thể thì đây là QR của một giao dịch, nên phải là 12.
    tlv('01', input.amountVnd ? '12' : '11'),
    tlv('38', merchantAccount),
    tlv('53', '704'), // VND
  ];

  if (input.amountVnd) {
    if (!Number.isInteger(input.amountVnd) || input.amountVnd <= 0) {
      throw new Error(`Số tiền phải là số nguyên dương, nhận ${input.amountVnd}.`);
    }
    // Không dấu phân cách nghìn, không phần thập phân — VND không có xu.
    parts.push(tlv('54', String(input.amountVnd)));
  }

  parts.push(tlv('58', 'VN'));

  if (input.accountName) {
    const name = normalizeDescription(input.accountName).slice(0, 25);
    if (name) parts.push(tlv('59', name));
  }

  if (input.description) {
    const purpose = normalizeDescription(input.description).slice(0, 99 - 4);
    if (purpose) parts.push(tlv('62', tlv('08', purpose)));
  }

  const body = parts.join('');
  // "6304" phải nằm trong dữ liệu được tính CRC. Đây là chỗ hay sai nhất.
  const withCrcHeader = `${body}6304`;
  const checksum = crc16(withCrcHeader).toString(16).toUpperCase().padStart(4, '0');
  return `${withCrcHeader}${checksum}`;
}

/**
 * Đọc ngược chuỗi TLV thành cây, dùng cho test và cho việc soi lỗi.
 *
 * Có hàm này thì test kiểm được CẤU TRÚC thật sự dựng ra, thay vì so chuỗi với
 * một hằng số chép tay — kiểu so sánh đó chỉ chứng minh chuỗi không đổi, chứ
 * không chứng minh nó đúng.
 */
export function parseTlv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  let at = 0;
  while (at + 4 <= payload.length) {
    const id = payload.slice(at, at + 2);
    const length = Number(payload.slice(at + 2, at + 4));
    if (!Number.isInteger(length)) throw new Error(`Độ dài không phải số ở vị trí ${at + 2}.`);
    const value = payload.slice(at + 4, at + 4 + length);
    if (value.length !== length) {
      throw new Error(`Trường ${id} khai dài ${length} nhưng chỉ còn ${value.length} ký tự.`);
    }
    out[id] = value;
    at += 4 + length;
  }
  if (at !== payload.length) throw new Error(`Còn thừa ${payload.length - at} ký tự không đọc được.`);
  return out;
}

/** Chuỗi QR có toàn vẹn không — dùng để test và để bắt lỗi khi ai đó sửa tay. */
export function verifyVietQrChecksum(payload: string): boolean {
  if (payload.length < 8) return false;
  const body = payload.slice(0, -4);
  if (!body.endsWith('6304')) return false;
  const expected = crc16(body).toString(16).toUpperCase().padStart(4, '0');
  return payload.slice(-4).toUpperCase() === expected;
}
