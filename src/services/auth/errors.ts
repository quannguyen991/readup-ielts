/**
 * Dịch lỗi xác thực của Supabase sang tiếng Việt CÓ HƯỚNG XỬ LÝ.
 *
 * Lỗi gốc là tiếng Anh và viết cho lập trình viên: "Invalid login credentials"
 * đúng nhưng không nói người dùng nên làm gì tiếp. Tệ hơn, vài lỗi quan trọng
 * nhất lại là lỗi CẤU HÌNH của app chứ không phải lỗi của người dùng — chưa bật
 * provider, chưa nối nhà cung cấp SMS — mà nếu hiện nguyên văn thì người dùng
 * ngồi thử lại mãi một việc không bao giờ chạy được.
 *
 * Nguyên tắc: nói rõ ai phải làm gì. Lỗi của người dùng thì hướng dẫn thao tác;
 * lỗi của hệ thống thì nói thẳng là lỗi hệ thống, đừng bắt họ thử lại.
 */

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'otp_expired'
  | 'otp_wrong'
  | 'rate_limited'
  | 'email_not_confirmed'
  | 'already_registered'
  | 'provider_disabled'
  | 'sms_not_configured'
  | 'not_configured'
  | 'link_wrong_browser'
  | 'link_used'
  | 'network'
  | 'unknown';

export type AuthErrorInfo = {
  kind: AuthErrorKind;
  message: string;
  /** true = người dùng thử lại được. false = lỗi cấu hình, thử lại vô ích. */
  retryable: boolean;
  /** Số giây phải chờ, đọc từ chính thông báo của Supabase khi có. */
  retryAfterSeconds?: number;
};

const MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: 'Thông tin đăng nhập không đúng. Kiểm tra lại rồi thử lần nữa.',
  otp_expired: 'Mã đã hết hạn. Bấm gửi lại để nhận mã mới.',
  otp_wrong: 'Mã không đúng. Kiểm tra lại tin nhắn rồi nhập lại.',
  rate_limited: 'Bạn vừa yêu cầu mã quá nhiều lần. Chờ một chút rồi thử lại.',
  email_not_confirmed: 'Email chưa được xác nhận. Mở hộp thư và bấm liên kết xác nhận trước.',
  already_registered: 'Tài khoản này đã tồn tại. Đăng nhập thay vì đăng ký mới.',
  provider_disabled:
    'Cách đăng nhập này chưa được bật cho ứng dụng. Đây là lỗi cấu hình phía app, không phải lỗi của bạn.',
  sms_not_configured:
    'Chưa nối nhà cung cấp SMS nên chưa gửi được mã. Đây là lỗi cấu hình phía app — tạm thời dùng cách đăng nhập khác.',
  not_configured:
    'Ứng dụng chưa nối máy chủ tài khoản, nên đăng nhập chưa dùng được. Dữ liệu học vẫn lưu trên thiết bị này bình thường.',
  link_wrong_browser:
    'Liên kết này phải mở bằng chính trình duyệt đã bấm gửi. Quay lại đó rồi bấm gửi liên kết mới.',
  link_used:
    'Liên kết đã dùng rồi hoặc đã hết hạn. Mỗi liên kết chỉ dùng được một lần — bấm gửi lại để nhận cái mới.',
  network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  unknown: 'Có lỗi xảy ra. Thử lại sau ít phút.',
};

/** Đọc "you can only request this after 46 seconds" ra số 46. */
function readRetryAfter(text: string): number | undefined {
  const match = text.match(/after (\d+) seconds?/i);
  return match ? Number(match[1]) : undefined;
}

function classify(raw: string, status?: number): AuthErrorKind {
  const text = raw.toLowerCase();

  if (text.includes('for security purposes') || text.includes('rate limit') || status === 429) {
    return 'rate_limited';
  }
  /*
    Hai lỗi của luồng PKCE, đo được từ chính máy chủ Supabase:

      thiếu code_verifier → "invalid request: both auth code and code verifier
                             should be non-empty"  (400)
      không còn flow state → "invalid flow state, no valid flow state found" (404)

    Trước đây cả hai rơi vào `unknown` và app bảo "thử lại sau ít phút" — lời
    khuyên SAI, vì thử lại y hệt sẽ hỏng y hệt. Người dùng cần biết phải đổi
    trình duyệt hay xin liên kết mới, hai việc hoàn toàn khác nhau.
  */
  if (text.includes('code verifier') || text.includes('code_verifier')) return 'link_wrong_browser';
  if (text.includes('flow state') || text.includes('flow_state_not_found')) return 'link_used';

  if (text.includes('token has expired') || text.includes('otp_expired') || text.includes('expired')) {
    return 'otp_expired';
  }
  if (text.includes('invalid') && (text.includes('otp') || text.includes('token'))) return 'otp_wrong';
  if (text.includes('invalid login credentials')) return 'invalid_credentials';
  if (text.includes('email not confirmed')) return 'email_not_confirmed';
  if (text.includes('already registered') || text.includes('user already')) return 'already_registered';
  if (
    text.includes('provider is not enabled') ||
    text.includes('unsupported provider') ||
    text.includes('signups not allowed')
  ) {
    return 'provider_disabled';
  }
  if (text.includes('sms') || text.includes('phone provider') || text.includes('twilio')) {
    return 'sms_not_configured';
  }
  if (text.includes('chưa cấu hình supabase') || text.includes('not configured')) return 'not_configured';
  if (text.includes('fetch') || text.includes('network') || text.includes('failed to fetch')) {
    return 'network';
  }
  return 'unknown';
}

/**
 * `error` nhận bất cứ thứ gì catch được: AuthError của Supabase, Error thường,
 * hay một chuỗi. Màn hình chỉ cần gọi hàm này rồi hiện `message`.
 */
export function describeAuthError(error: unknown): AuthErrorInfo {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : '';

  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  const kind = classify(raw, Number.isFinite(status) ? status : undefined);

  return {
    kind,
    message: MESSAGES[kind],
    // Lỗi cấu hình thì thử lại bao nhiêu lần cũng vậy — nút "Thử lại" ở những
    // ca này chỉ khiến người dùng bấm mãi rồi nghĩ máy mình hỏng.
    retryable: kind !== 'provider_disabled' && kind !== 'sms_not_configured' && kind !== 'not_configured',
    retryAfterSeconds: kind === 'rate_limited' ? readRetryAfter(raw) : undefined,
  };
}
