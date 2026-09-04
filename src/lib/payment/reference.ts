/**
 * Mã đối chiếu in trong nội dung chuyển khoản.
 *
 * Đây là thứ DUY NHẤT nối một lần chuyển khoản với một tài khoản trong app. Sao
 * kê ngân hàng không có email, không có user id — chỉ có số tiền, thời gian, và
 * một dòng nội dung do người chuyển gõ. Nếu dòng đó không nhận dạng được thì
 * việc đối chiếu quay về đoán mò theo số tiền, và hai người cùng mua gói Pro
 * trong một buổi chiều là đủ để cấp nhầm.
 *
 * BỐN RÀNG BUỘC, và cả bốn đều đến từ chỗ mã này phải sống sót qua hệ thống
 * ngân hàng chứ không phải từ thẩm mỹ:
 *
 * 1. CHỈ A–Z VÀ SỐ. Ngân hàng bỏ dấu, viết hoa, và nhiều nơi thay ký tự đặc
 *    biệt bằng khoảng trắng.
 * 2. KHÔNG CÓ KÝ TỰ DỄ NHÌN NHẦM. Bỏ 0/O, 1/I/L, U — người dùng đọc mã trên
 *    màn hình rồi gõ tay vào app ngân hàng, và `RU0O` với `RUOO` nhìn như nhau.
 * 3. CÓ KÝ TỰ KIỂM. Gõ sai một ký tự phải phát hiện được ngay tại chỗ nhập,
 *    thay vì để tiền bay đi rồi mới biết.
 * 4. NGẮN. Ô nội dung của nhiều app ngân hàng chỉ vài chục ký tự, và người dùng
 *    gõ tay từng ký tự một.
 */

/** 30 ký tự, đã bỏ 0 O 1 I L U vì dễ nhìn nhầm khi chép tay. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
/** Tiền tố mã đối chiếu thanh toán. */
const PREFIX = 'RU';
/** Tiền tố mã mời. KHÁC mã thanh toán để hai thứ không bao giờ bị lẫn. */
export const INVITE_PREFIX = 'RD';
/** Tiền tố mã nhóm mua chung. Khác cả hai mã trên — ba loại mã, ba tiền tố. */
export const GROUP_PREFIX = 'RG';
const BODY_LENGTH = 6;

/** Nhãn đứng trước mã trong nội dung chuyển khoản, để người đọc sao kê nhận ra ngay. */
export const TRANSFER_LABEL = 'READUP';

/**
 * Ký tự kiểm: tổng vị trí các ký tự thân, chia dư cho cỡ bảng chữ.
 *
 * Không dùng Luhn hay CRC vì bảng chữ này không phải số. Tổng đơn giản bắt được
 * lỗi phổ biến nhất — GÕ SAI MỘT KÝ TỰ — với xác suất 29/30. Nó KHÔNG bắt được
 * lỗi đảo chỗ hai ký tự; đánh đổi có ý thức, vì mã được chép chứ không được nhớ,
 * và người chép hiếm khi đảo chỗ.
 */
function checkChar(body: string): string {
  let sum = 0;
  for (const ch of body) sum += ALPHABET.indexOf(ch);
  return ALPHABET[sum % ALPHABET.length]!;
}

/**
 * Sinh mã mới. Dùng nguồn ngẫu nhiên của hệ thống, KHÔNG dùng `Math.random()`.
 *
 * Mã đoán được nghĩa là người khác dựng được một mã trùng đơn đang chờ của
 * người thứ ba. 30^6 ≈ 729 triệu tổ hợp là quá đủ, nhưng chỉ khi nó thật sự
 * ngẫu nhiên.
 */
export function generateReference(random: () => number = cryptoRandom): string {
  return generateCode(PREFIX, random);
}

/**
 * Mã mời bạn bè. Cùng bộ máy với mã đối chiếu, khác mỗi tiền tố.
 *
 * Dùng chung `checkChar` là có chủ ý: mã mời cũng bị chép tay (đọc cho bạn qua
 * điện thoại, gõ lại từ ảnh chụp màn hình), nên cũng cần bắt được lỗi gõ sai.
 */
export function generateInviteCode(random: () => number = cryptoRandom): string {
  return generateCode(INVITE_PREFIX, random);
}

/** Mã nhóm mua chung. Chia sẻ qua link mời, người khác gõ lại để tham gia. */
export function generateGroupCode(random: () => number = cryptoRandom): string {
  return generateCode(GROUP_PREFIX, random);
}

function generateCode(prefix: string, random: () => number): string {
  let body = '';
  for (let i = 0; i < BODY_LENGTH; i += 1) {
    body += ALPHABET[Math.floor(random() * ALPHABET.length)]!;
  }
  return `${prefix}${body}${checkChar(body)}`;
}

function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  // Chia cho 2^32 để ra [0, 1). Không dùng modulo trên số nguyên vì nó lệch về
  // các giá trị đầu bảng khi cỡ bảng không chia hết cho 2^32.
  return buf[0]! / 0x1_0000_0000;
}

/** Mã có đúng khuôn và đúng ký tự kiểm không. */
export function isValidReference(code: string): boolean {
  return isValidCode(PREFIX, code);
}

/** Mã mời có đúng khuôn và đúng ký tự kiểm không. */
export function isValidInviteCode(code: string): boolean {
  return isValidCode(INVITE_PREFIX, code);
}

/** Mã nhóm có đúng khuôn và đúng ký tự kiểm không. */
export function isValidGroupCode(code: string): boolean {
  return isValidCode(GROUP_PREFIX, code);
}

function isValidCode(prefix: string, code: string): boolean {
  const upper = code.trim().toUpperCase();
  if (upper.length !== prefix.length + BODY_LENGTH + 1) return false;
  if (!upper.startsWith(prefix)) return false;
  const body = upper.slice(prefix.length, prefix.length + BODY_LENGTH);
  const check = upper.slice(-1);
  for (const ch of body + check) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return checkChar(body) === check;
}

/** Nội dung chuyển khoản hoàn chỉnh — thứ người dùng dán vào app ngân hàng. */
export function transferDescription(code: string): string {
  return `${TRANSFER_LABEL} ${code}`;
}

/**
 * Tìm mã hợp lệ trong một dòng sao kê.
 *
 * Ngân hàng chèn thêm chữ vào nội dung ("CHUYEN TIEN TU ... READUP RU7K3M9 ..."),
 * gộp mất khoảng trắng, hoặc cắt bớt. Nên quét mọi cụm ký tự đủ dài rồi để ký
 * tự kiểm quyết định — an toàn hơn nhiều so với khớp cả câu.
 *
 * Trả về mã ĐẦU TIÊN qua được ký tự kiểm. Nếu một dòng có hai mã hợp lệ thì đó
 * là chuyện bất thường, và người đối chiếu phải tự xem — hàm này không đoán.
 */
export function extractReference(text: string): string | null {
  const upper = text.toUpperCase();
  const total = PREFIX.length + BODY_LENGTH + 1;
  for (const match of upper.matchAll(new RegExp(`${PREFIX}[A-Z0-9]{${BODY_LENGTH + 1}}`, 'g'))) {
    const candidate = match[0].slice(0, total);
    if (isValidReference(candidate)) return candidate;
  }
  return null;
}
