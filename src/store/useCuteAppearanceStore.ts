import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

export type CutePalette = 'original' | 'strawberry' | 'sky' | 'lemon' | 'lilac';

/** Global cute decorations; the pastel Band 9 palette remains readable without them. */
type CuteAppearanceState = {
  effectsEnabled: boolean;
  palette: CutePalette;
  customMascotImage: string | null;
  setEffectsEnabled: (enabled: boolean) => void;
  setPalette: (palette: CutePalette) => void;
  setCustomMascotImage: (image: string | null) => void;
};

export const useCuteAppearanceStore = create<CuteAppearanceState>()(
  persist(
    (set) => ({
      effectsEnabled: false,
      palette: 'original',
      customMascotImage: null,
      setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
      setPalette: (palette) => set({ palette }),
      setCustomMascotImage: (customMascotImage) => set({ customMascotImage }),
    }),
    {
      name: `${STORAGE_PREFIX}cute-appearance`,
      storage: storage<CuteAppearanceState>(),
      version: 4,
      migrate: (persisted) => ({
        ...(persisted as Partial<CuteAppearanceState>),
        effectsEnabled: false,
        palette: 'original',
      }) as CuteAppearanceState,
      partialize: (state) => ({
        effectsEnabled: state.effectsEnabled,
        palette: state.palette,
        customMascotImage: state.customMascotImage,
      }) as CuteAppearanceState,
    },
  ),
);
