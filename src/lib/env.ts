/**
 * Truy cập biến môi trường có kiểm tra.
 *
 * Quy ước:
 * - `EXPO_PUBLIC_*` được inline vào bundle client → chỉ chứa thứ công khai được.
 * - Key bí mật (service key, ANTHROPIC_API_KEY, OPENAI_API_KEY) CHỈ đọc trong
 *   code chạy server (Expo Router API route hoặc Supabase Edge Function).
 */

/**
 * Email đăng nhập gửi LIÊN KẾT hay MÃ 6 SỐ.
 *
 * Không phải lựa chọn thẩm mỹ — nó do gói Supabase quyết định. Gói free dùng
 * SMTP mặc định thì **không sửa được mẫu email**, mà mẫu mặc định chỉ có
 * `{{ .ConfirmationURL }}`, không có `{{ .Token }}`. Bày ô nhập mã ở trạng thái
 * đó là hứa một thứ không bao giờ tới: người dùng mở hộp thư, thấy một cái nút,
 * quay lại app tìm mã, không có, rồi tưởng email chưa gửi.
 *
 * `scripts/provision-supabase.ts` tự đặt biến này: cài được mẫu có `{{ .Token }}`
 * thì ghi `code`, không thì ghi `link`. Mặc định là `link` vì đó là thứ chạy
 * được khi chưa cấu hình gì.
 */
export type EmailAuthMode = 'link' | 'code';

export const publicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  emailAuthMode: (process.env.EXPO_PUBLIC_EMAIL_AUTH_MODE === 'code'
    ? 'code'
    : 'link') as EmailAuthMode,

  /**
   * Tài khoản nhận tiền, hiện trên mã QR chuyển khoản.
   *
   * CÔNG KHAI THEO THIẾT KẾ — số tài khoản nhận nằm ngay trên mã QR mà ai cũng
   * quét được, đúng như số tài khoản in trên hoá đơn giấy. Nó không cấp quyền
   * gì; biết số tài khoản chỉ để chuyển tiền VÀO, không rút ra được.
   *
   * Chưa khai thì trang thanh toán nói thẳng "chưa cấu hình", chứ không hiện
   * một mã QR trỏ vào hư không — người dùng quét, chuyển tiền đi đâu đó, rồi
   * không ai truy được.
   */
  bankBin: process.env.EXPO_PUBLIC_BANK_BIN ?? '',
  bankAccount: process.env.EXPO_PUBLIC_BANK_ACCOUNT ?? '',
  bankAccountName: process.env.EXPO_PUBLIC_BANK_ACCOUNT_NAME ?? '',

  /**
   * Người bán và kênh liên hệ — hiện ở trang Liên hệ, chân trang, trang thanh toán.
   *
   * CÔNG KHAI THEO THIẾT KẾ, cùng lý do với số tài khoản nhận tiền: người vừa
   * chuyển tiền mà chưa thấy gói bật phải biết hỏi ai. Chưa khai thì các chỗ đó
   * im lặng chứ không bịa ra một địa chỉ — chuẩn hoá và kiểm ở `src/lib/contact.ts`.
   */
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '',
  supportZalo: process.env.EXPO_PUBLIC_SUPPORT_ZALO ?? '',
  sellerName: process.env.EXPO_PUBLIC_SELLER_NAME ?? '',
  sellerAddress: process.env.EXPO_PUBLIC_SELLER_ADDRESS ?? '',
  sellerTaxId: process.env.EXPO_PUBLIC_SELLER_TAX_ID ?? '',

  /**
   * Mã đo lường quảng cáo. Để trống thì không tải script nào và không hiện
   * thông báo cookie — xem `src/services/analytics/track.ts`.
   */
  metaPixelId: process.env.EXPO_PUBLIC_META_PIXEL_ID ?? '',
  ga4Id: process.env.EXPO_PUBLIC_GA4_ID ?? '',
} as const;

/** Đủ ba giá trị để dựng được QR chuyển khoản chưa. */
export function hasBankConfig(): boolean {
  return /^\d{6}$/.test(publicEnv.bankBin) && /^[A-Za-z0-9]{4,19}$/.test(publicEnv.bankAccount);
}

export function hasSupabaseConfig(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/**
 * Bảng tra tĩnh cho biến môi trường phía server.
 *
 * Vì sao không viết `process.env[name]`: Metro thay thế `process.env.X` bằng giá
 * trị thật NGAY LÚC ĐÓNG GÓI, dựa trên chuỗi nó đọc được trong mã. Truy cập động
 * thì không có chuỗi nào để nó nhìn thấy, và biến sẽ là `undefined` ở bản dựng —
 * lỗi chỉ lộ ra khi chạy thật. Viết thẳng từng tên ra đây khiến mọi biến đều nằm
 * ở dạng Metro nhận diện được, và trình biên dịch bắt lỗi ngay nếu union
 * `ServerEnvName` thêm tên mới mà quên khai ở đây.
 */
const SERVER_ENV: Record<ServerEnvName, string | undefined> = {
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
};

/** Chỉ gọi được ở server. Ném lỗi rõ ràng nếu thiếu biến. */
export function serverEnv(name: ServerEnvName): string {
  const value = SERVER_ENV[name];
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường ${name}. Thêm vào .env.local (xem .env.example) rồi khởi động lại dev server.`,
    );
  }
  return value;
}

export type ServerEnvName =
  | 'SUPABASE_SERVICE_KEY'
  | 'ANTHROPIC_API_KEY'
  | 'OPENAI_API_KEY'
  | 'OPENAI_BASE_URL';
