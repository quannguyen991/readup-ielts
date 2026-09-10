import React from 'react';
import { Text } from 'react-native';

import { AccountCard } from '@/components/account/AccountCard';
import { Screen } from '@/components/layout/Screen';

/**
 * Cài đặt tài khoản.
 *
 * ĐÃ GỠ BẢNG "KẾT NỐI SUPABASE" (10/09/2026). Nó in ra đường dẫn dự án Supabase
 * và tên các biến môi trường, kèm một dòng nhắc "điền vào .env.local rồi khởi
 * động lại dev server" — chỉ dẫn dành cho người đang DỰNG app, đặt nhầm vào
 * trang của người ĐANG HỌC.
 *
 * Đường dẫn dự án và khoá anon vốn không phải bí mật (chúng đi kèm mọi request
 * từ trình duyệt), nên gỡ đi không phải để bịt lỗ hổng. Gỡ vì hai lý do khác:
 * nó không giúp người học được gì, và một trang cài đặt phơi ra tên biến môi
 * trường thì trông như bản chưa làm xong.
 *
 * Cần kiểm cấu hình thì có `scripts/check-setup.ts` — đúng chỗ cho việc ấy.
 */
export default function SettingsScreen() {
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Cài đặt</Text>
      <AccountCard />
    </Screen>
  );
}
