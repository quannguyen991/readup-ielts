import type { StudyWord } from './topic-study';

/**
 * "noun · /ˈhæbɪtæt/" — bỏ phần trống, bộ SAT không có loại từ và phiên âm.
 * Nằm riêng (không ở `study-decks.ts`) để khung học nạp ngay mà không kéo kho bộ từ theo.
 */
export function posIpa(w: Pick<StudyWord, 'pos' | 'ipa'>): string {
  return [w.pos, w.ipa].filter(Boolean).join(' · ');
}
