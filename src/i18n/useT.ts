import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { translate, type Locale, type MessageKey } from './index';
import { STORAGE_PREFIX, storage } from '@/store/persist';

/**
 * Ngôn ngữ hiện tại, nhớ trên máy người dùng.
 *
 * MẶC ĐỊNH TIẾNG VIỆT, không đoán theo ngôn ngữ trình duyệt. App phục vụ người
 * học Việt Nam; đoán theo trình duyệt sẽ ném bản tiếng Anh vào mặt một người
 * đang dùng máy cài sẵn tiếng Anh mà vẫn muốn học bằng tiếng Việt — và đó là
 * phần lớn người dùng thật.
 */
type LocaleState = {
  locale: Locale;
  /** Lúc đổi gần nhất — đồng bộ giữa các máy: máy nào đổi sau thì thắng. */
  changedAt: string;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'vi',
      changedAt: '',
      setLocale: (locale) => set({ locale, changedAt: new Date().toISOString() }),
    }),
    { name: `${STORAGE_PREFIX}locale`, storage: storage<LocaleState>() },
  ),
);

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/**
 * Hook dịch.
 *
 * Trả về hàm chứ không trả về từ điển: component chỉ gọi `t('mastery.title')` và
 * không cần biết ngôn ngữ nào đang bật. Nhờ vậy đổi ngôn ngữ là đổi đúng một chỗ.
 */
export function useT(): { t: Translate; locale: Locale } {
  const locale = useLocaleStore((s) => s.locale);
  const t = useCallback<Translate>((key, params) => translate(locale, key, params), [locale]);
  return { t, locale };
}
