/**
 * Ngữ cảnh "khung duyệt": các thành phần dùng chung (Card, Button, Badge) đổi sang kiểu
 * retro chỉ khi nằm trong khung duyệt VÀ giao diện retro đang bật. Khung làm bài và khung
 * toàn màn không bọc Provider này nên giữ nguyên kiểu cũ.
 */
import { createContext, useContext } from 'react';

import { useRetroOn } from './retro-mode-store';

const RetroScopeContext = createContext(false);

/** Bọc phần nội dung của khung duyệt, `value` là bật/tắt giao diện retro. */
export const RetroScope = RetroScopeContext.Provider;

/** Đúng khi đang ở khung duyệt và giao diện retro bật. */
export function useRetroStyle(): boolean {
  const inScope = useContext(RetroScopeContext);
  const on = useRetroOn();
  return inScope && on;
}
