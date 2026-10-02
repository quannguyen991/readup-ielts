import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { setSfxVolume } from '@/services/audio/sfx';
import { clampVolume } from '@/services/audio/sfx-core';
import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tuỳ chọn âm thanh theo MÁY (không đồng bộ lên tài khoản): âm lượng hiệu ứng và
 * công tắc "Huấn luyện viên giọng nói". Bật / tắt hẳn tiếng hiệu ứng vẫn là
 * `useGameStore.sound` (đã có từ trước, phím M).
 */
type AudioPrefs = {
  /** 0–1, mặc định 0,8. */
  volume: number;
  /** Huấn luyện viên giọng nói ở các màn luyện nói — mặc định BẬT. */
  coach: boolean;
  setVolume: (v: number) => void;
  setCoach: (on: boolean) => void;
};

export const useAudioPrefs = create<AudioPrefs>()(
  persist(
    (set) => ({
      volume: 0.8,
      coach: true,
      setVolume: (v) => {
        const volume = clampVolume(v);
        setSfxVolume(volume);
        set({ volume });
      },
      setCoach: (coach) => set({ coach }),
    }),
    {
      name: `${STORAGE_PREFIX}audio-prefs`,
      storage: storage<AudioPrefs>(),
      version: 1,
      partialize: (s) => ({ volume: s.volume, coach: s.coach }) as AudioPrefs,
      onRehydrateStorage: () => (state) => {
        if (state) setSfxVolume(state.volume);
      },
    },
  ),
);
