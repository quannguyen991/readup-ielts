/**
 * Truy cập biến môi trường có kiểm tra.
 *
 * Quy ước:
 * - `EXPO_PUBLIC_*` được inline vào bundle client → chỉ chứa thứ công khai được.
 * - Key bí mật (service key, ANTHROPIC_API_KEY, OPENAI_API_KEY) CHỈ đọc trong
 *   code chạy server (Expo Router API route hoặc Supabase Edge Function).
 */

export const publicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;

export function hasSupabaseConfig(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/** Chỉ gọi được ở server. Ném lỗi rõ ràng nếu thiếu biến. */
export function serverEnv(name: ServerEnvName): string {
  const value = process.env[name];
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
