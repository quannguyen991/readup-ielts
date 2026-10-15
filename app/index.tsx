import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';

import { WELCOME_SEEN_KEY, entryPath } from '@/lib/welcome-page';
import { ChiikawaLoader } from '@/components/chiikawa/ChiikawaLoader';
import { useChiikawaActive } from '@/components/chiikawa/chiikawa';

/**
 * Cửa vào.
 *
 * Lần ĐẦU mở link trên một máy → trang giới thiệu ngắn `/gioi-thieu` (toàn màn hình, ít chữ: Band 9 là gì, phần nào
 * mở/khoá, hai nút). Đã xem rồi → vào thẳng trang chủ app `/intro` (ở đó người đã học có nút "Tiếp tục học" đầu trang).
 * Bản app gốc (không có localStorage) giữ như cũ: vào `/intro`.
 *
 * Quyết định ở phía trình duyệt (bản dựng tĩnh không biết máy này đã xem hay chưa), nên khung đầu tiên không vẽ gì.
 */
export default function Index() {
  const [target, setTarget] = useState<string | null>(Platform.OS === 'web' ? null : '/intro');
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let seen = false;
    try {
      seen = localStorage.getItem(WELCOME_SEEN_KEY) === '1';
    } catch {
      seen = false;
    }
    setTarget(entryPath(seen));
  }, []);
  const chiikawa = useChiikawaActive();
  if (!target) return chiikawa ? <ChiikawaLoader label="Đang mở Band 9…" /> : null;
  return <Redirect href={target as never} />;
}
