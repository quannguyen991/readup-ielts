import React from 'react';

import { useTopicStudyStore } from '@/store/useTopicStudyStore';

import { useStudyBackdrop } from '@/components/art/ArtBackdrop';

import { STUDY_THEMES, themeOf, type StudyTheme } from './study-theme';

/**
 * Chủ đề đang DÙNG theo cài đặt: "Nền & hiệu ứng" tắt (mặc định) thì luôn là chủ đề phẳng; bật thì theo
 * chủ đề đã chọn. Chỉ đọc hai trường của store nên chỉ vẽ lại khi một trong hai đổi.
 * Chỉ `StudyFrame` và nền (`TravelBackdrop`) gọi hàm này; mọi thành phần con đọc qua `useStudyTheme()`.
 */
export function useStoreTheme(): StudyTheme {
  const fx = useTopicStudyStore((s) => s.studyFx);
  const id = useTopicStudyStore((s) => s.studyTheme);
  const art = useStudyBackdrop(fx);
  if (art) return STUDY_THEMES[art.tone === 'dark' ? 'art-dark' : 'art-light'];
  return fx ? themeOf(id) : STUDY_THEMES.plain;
}

export function useStoreThemeId(): string {
  return useStoreTheme().id;
}

const ThemeContext = React.createContext<StudyTheme | null>(null);
export const StudyThemeProvider = ThemeContext.Provider;

/**
 * Chủ đề cho thành phần con của màn ôn từ. Ngoài `StudyFrame` (ví dụ thẻ ghi nhớ ở trang bộ từ, nền
 * sáng của app) luôn là chủ đề phẳng — chủ đề tối không bao giờ rò ra màn không có nền theo chủ đề.
 */
export function useStudyTheme(): StudyTheme {
  return React.useContext(ThemeContext) ?? STUDY_THEMES.plain;
}
