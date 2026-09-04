/**
 * Chuẩn hoá số điện thoại về E.164 trước khi gửi cho Supabase.
 *
 * VÌ SAO PHẢI CÓ LỚP NÀY: Supabase gửi SMS theo đúng chuỗi mình đưa vào, không
 * đoán giúp. Người Việt gõ `0912 345 678`, còn nhà mạng cần `+84912345678`.
 * Gửi sai định dạng thì OTP không bao giờ tới, mà lỗi trả về chỉ là "invalid
 * phone" — không nói được sai ở đâu.
 *
 * Và mỗi tin nhắn gửi hỏng là một lần TỐN TIỀN THẬT: SMS tính phí theo lượt gửi,
 * kể cả gửi tới số không tồn tại. Nên chặn ở client rẻ hơn hẳn chặn ở server.
 *
 * Mặc định là Việt Nam (+84) vì đó là người dùng của app, nhưng số đã có dấu `+`
 * thì tôn trọng nguyên vẹn — người dùng ở nước ngoài vẫn đăng nhập được.
 */

export const DEFAULT_COUNTRY_CODE = '84';

/** Đầu số di động Việt Nam sau khi bỏ số 0: Viettel/Vina/Mobi/Vietnamobile/Gmobile. */
const VN_MOBILE_PREFIXES = ['3', '5', '7', '8', '9'];

export type PhoneParseResult =
  | { ok: true; e164: string; national: string }
  | { ok: false; reason: PhoneError };

export type PhoneError = 'empty' | 'not_digits' | 'too_short' | 'too_long' | 'not_vn_mobile';

export const PHONE_ERROR_LABEL: Record<PhoneError, string> = {
  empty: 'Chưa nhập số điện thoại.',
  not_digits: 'Số điện thoại chỉ gồm chữ số, dấu cách, dấu chấm, gạch ngang và dấu + ở đầu.',
  too_short: 'Số điện thoại quá ngắn.',
  too_long: 'Số điện thoại quá dài.',
  not_vn_mobile:
    'Đây không phải đầu số di động Việt Nam. Số di động bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
};

/** Bỏ mọi ký tự trình bày, giữ lại chữ số và dấu + duy nhất ở đầu. */
function stripFormatting(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[\s.\-()]/g, '').replace(/\+/g, '');
}

export function parsePhone(raw: string): PhoneParseResult {
  const cleaned = stripFormatting(raw ?? '');
  if (cleaned.length === 0) return { ok: false, reason: 'empty' };

  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(digits)) return { ok: false, reason: 'not_digits' };

  // Số quốc tế đã ghi rõ mã nước thì giữ nguyên, chỉ kiểm độ dài theo E.164.
  if (cleaned.startsWith('+') && !digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    if (digits.length < 8) return { ok: false, reason: 'too_short' };
    if (digits.length > 15) return { ok: false, reason: 'too_long' };
    return { ok: true, e164: `+${digits}`, national: digits };
  }

  // Ba cách người Việt hay gõ, quy hết về 9 chữ số phần thuê bao.
  let national = digits;
  if (national.startsWith(DEFAULT_COUNTRY_CODE)) national = national.slice(DEFAULT_COUNTRY_CODE.length);
  if (national.startsWith('0')) national = national.slice(1);

  if (national.length < 9) return { ok: false, reason: 'too_short' };
  if (national.length > 9) return { ok: false, reason: 'too_long' };
  if (!VN_MOBILE_PREFIXES.includes(national[0] ?? '')) return { ok: false, reason: 'not_vn_mobile' };

  return { ok: true, e164: `+${DEFAULT_COUNTRY_CODE}${national}`, national: `0${national}` };
}

/**
 * Che bớt số để hiện trên màn nhập OTP.
 *
 * Hiện đủ số thì ảnh chụp màn hình lộ số thật; che sạch thì người dùng không
 * kiểm được mình có gõ nhầm không. Giữ ba số cuối là đủ để họ nhận ra số của
 * mình mà người khác nhìn lướt không đọc được.
 */
export function maskPhone(e164: string): string {
  if (e164.length <= 4) return e164;
  const tail = e164.slice(-3);
  const head = e164.slice(0, Math.min(4, e164.length - 3));
  return `${head}${'•'.repeat(Math.max(0, e164.length - head.length - 3))}${tail}`;
}

/** Mã OTP hợp lệ về hình thức — chặn trước khi gọi mạng. */
export function isValidOtp(code: string, length = 6): boolean {
  return new RegExp(`^\\d{${length}}$`).test(code.trim());
}
