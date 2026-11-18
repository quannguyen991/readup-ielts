import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { EaLang } from '@/data/learning-path/east-asian';
import { STORAGE_PREFIX, storage } from './persist';

/**
 * Lựa chọn giao diện của màn Tiếng Trung / Tiếng Nhật: skin đang dùng và cấp đang
 * xem theo từng tiếng. Chỉ lưu trên máy (đây là sở thích giao diện, không phải
 * tiến độ học — tiến độ nằm ở các kho học có đồng bộ).
 */
type EaState = {
  skin: Partial<Record<EaLang, string>>;
  level: Partial<Record<EaLang, string>>;
  setSkin: (lang: EaLang, id: string) => void;
  setLevel: (lang: EaLang, id: string) => void;
};

export const useEaStore = create<EaState>()(
  persist(
    (set) => ({
      skin: {},
      level: {},
      setSkin: (lang, id) => set((s) => ({ skin: { ...s.skin, [lang]: id } })),
      setLevel: (lang, id) => set((s) => ({ level: { ...s.level, [lang]: id } })),
    }),
    {
      name: `${STORAGE_PREFIX}east-asia-ui`,
      storage: storage<EaState>(),
      version: 1,
      partialize: (s) => ({ skin: s.skin, level: s.level }) as EaState,
    },
  ),
);
