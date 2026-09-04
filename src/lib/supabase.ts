import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { hasSupabaseConfig, publicEnv } from './env';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;

/**
 * Supabase client phía người dùng (anon key + RLS).
 * Trên native dùng AsyncStorage để lưu session; trên web dùng localStorage mặc định.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!hasSupabaseConfig()) {
    throw new Error(
      'Chưa cấu hình Supabase. Điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env.local.',
    );
  }

  if (!client) {
    client = createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        /*
          LUỒNG IMPLICIT, và đây là một đánh đổi có ý thức chứ không phải mặc định.

          PKCE an toàn hơn: nó chỉ trả về một mã dùng một lần, phải đổi lấy token
          bằng `code_verifier` mà chỉ trình duyệt đã gửi yêu cầu mới có. Luồng
          implicit trả token thẳng trên URL sau dấu `#`, nên token lọt vào lịch
          sử trình duyệt.

          NHƯNG chính cái `code_verifier` ấy làm đăng nhập không dùng được ở đây:

            - Cách đăng nhập DUY NHẤT đang bật là email (Google/Facebook đều tắt).
            - Gói Supabase free KHÔNG cho sửa mẫu email — đã thử PATCH và bị từ
              chối thẳng — nên email gửi đi là một LIÊN KẾT, không phải mã 6 số.
            - Người ta bấm gửi trên máy tính rồi mở mail trên điện thoại. Trình
              duyệt đó không có `code_verifier`, và Supabase trả
              "both auth code and code verifier should be non-empty".

          Tức là với PKCE, một phần lớn người dùng KHÔNG THỂ đăng nhập, bằng bất
          kỳ cách nào. Một tính năng an toàn tuyệt đối mà không ai vào được thì
          không bảo vệ ai cả.

          ĐỔI LẠI PKCE KHI: bật được Google/Facebook (OAuth quay về đúng trình
          duyệt nên PKCE chạy ngon), hoặc lên gói trả phí / nối SMTP riêng để đổi
          email sang mã 6 số. Lúc đó đổi dòng dưới về 'pkce' là xong, phần còn
          lại của app không phụ thuộc vào lựa chọn này.
        */
        flowType: 'implicit',
      },
    });
  }

  return client;
}
