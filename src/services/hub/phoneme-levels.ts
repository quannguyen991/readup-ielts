/**
 * Độ khó của 44 âm đối với NGƯỜI VIỆT, lộ trình 3 chặng và cách xếp lưới IPA (15/11/2026).
 *
 * Độ khó là đánh giá của Band 9 dựa trên hệ âm tiếng Việt:
 * - Dễ: tiếng Việt có âm gần giống (i, u, a, b, m, h, w, j, ng-…).
 * - Vừa: có âm gần nhưng hay đọc lệch (t, d, s, z cuối từ; ɔː, ʌ, ɒ; l, n cuối).
 * - Khó: tiếng Việt không có (θ ð ʃ ʒ dʒ r), hoặc hay lẫn với âm khác (ɪ/iː, ʊ/uː, æ/e, ə, nguyên âm đôi kết thúc bằng ə).
 */
import { PHONEMES, type Phoneme } from './phonemes';

export type PhonemeLevel = 'easy' | 'medium' | 'hard';

export const LEVEL_ORDER: readonly PhonemeLevel[] = ['easy', 'medium', 'hard'];

export const LEVEL_LABEL: Record<PhonemeLevel, { vi: string; en: string }> = {
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Vừa', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};

const EASY = ['iː', 'uː', 'ɑː', 'e', 'aɪ', 'aʊ', 'ɔɪ', 'p', 'b', 'k', 'ɡ', 'f', 'h', 'm', 'w', 'j'];
const MEDIUM = ['ɔː', 'ʌ', 'ɒ', 'eɪ', 'əʊ', 't', 'd', 'v', 's', 'z', 'tʃ', 'n', 'ŋ', 'l'];
const HARD = ['ɪ', 'ʊ', 'æ', 'ɜː', 'ə', 'ɪə', 'eə', 'ʊə', 'θ', 'ð', 'ʃ', 'ʒ', 'dʒ', 'r'];

export const PHONEME_LEVEL: Readonly<Record<string, PhonemeLevel>> = Object.fromEntries([
  ...EASY.map((s) => [s, 'easy'] as const),
  ...MEDIUM.map((s) => [s, 'medium'] as const),
  ...HARD.map((s) => [s, 'hard'] as const),
]);

export function levelOf(symbol: string): PhonemeLevel {
  return PHONEME_LEVEL[symbol] ?? 'medium';
}

export const STAGES: ReadonlyArray<{ level: PhonemeLevel; title: string; titleEn: string; hint: string; hintEn: string }> = [
  { level: 'easy', title: 'Âm quen thuộc', titleEn: 'Familiar sounds', hint: 'Tiếng Việt có âm gần giống', hintEn: 'Close to a Vietnamese sound' },
  { level: 'medium', title: 'Âm hay đọc lệch', titleEn: 'Often mispronounced', hint: 'Giống mà không giống hẳn', hintEn: 'Similar, but not the same' },
  { level: 'hard', title: 'Âm khó, cần luyện kỹ', titleEn: 'Tricky sounds', hint: 'Tiếng Việt không có hoặc dễ lẫn', hintEn: 'Not in Vietnamese, or easy to confuse' },
];

/** Âm đã có điểm (đã luyện ít nhất một lần). */
export function practicedCount(best: Readonly<Record<string, number>>): number {
  return PHONEMES.filter((p) => best[p.symbol] !== undefined).length;
}

export function stageProgress(level: PhonemeLevel, best: Readonly<Record<string, number>>): { done: number; total: number } {
  const list = PHONEMES.filter((p) => levelOf(p.symbol) === level);
  return { done: list.filter((p) => best[p.symbol] !== undefined).length, total: list.length };
}

/** Chặng đang học: chặng đầu tiên còn âm chưa luyện (hết cả ba thì ở chặng cuối). */
export function currentStage(best: Readonly<Record<string, number>>): PhonemeLevel {
  for (const level of LEVEL_ORDER) {
    const { done, total } = stageProgress(level, best);
    if (done < total) return level;
  }
  return 'hard';
}

/** Âm nên luyện tiếp: chưa luyện, theo thứ tự dễ → khó rồi theo thứ tự trong khoá. */
export function nextToPractice(best: Readonly<Record<string, number>>): Phoneme | undefined {
  for (const level of LEVEL_ORDER) {
    const hit = PHONEMES.find((p) => levelOf(p.symbol) === level && best[p.symbol] === undefined);
    if (hit) return hit;
  }
  return undefined;
}

export type GridRow = { label: string; labelEn: string; symbols: string[] };
export type GridSection = { id: string; title: string; titleEn: string; subtitle?: string; rows: GridRow[] };

const VOICELESS = ['p', 't', 'k', 'f', 'θ', 's', 'ʃ', 'h', 'tʃ'];

/** Lưới IPA: nguyên âm (dài / ngắn), nguyên âm đôi, phụ âm (vô thanh / hữu thanh / mũi và lỏng). */
export function gridSections(): GridSection[] {
  const mono = PHONEMES.filter((p) => p.group === 'monophthong');
  const di = PHONEMES.filter((p) => p.group === 'diphthong');
  const cons = PHONEMES.filter((p) => p.group === 'consonant');
  const stops = cons.filter((p) => p.chapter === 'voiceless-voiced');
  const liquids = cons.filter((p) => p.chapter === 'nasal-liquid');
  return [
    {
      id: 'vowels',
      title: 'Nguyên âm',
      titleEn: 'Vowels',
      rows: [
        { label: 'Dài', labelEn: 'Long', symbols: mono.filter((p) => p.symbol.includes('ː')).map((p) => p.symbol) },
        { label: 'Ngắn', labelEn: 'Short', symbols: mono.filter((p) => !p.symbol.includes('ː')).map((p) => p.symbol) },
      ],
    },
    {
      id: 'diphthongs',
      title: 'Nguyên âm đôi',
      titleEn: 'Diphthongs',
      subtitle: `${di.length} âm`,
      rows: [{ label: '', labelEn: '', symbols: di.map((p) => p.symbol) }],
    },
    {
      id: 'consonants',
      title: 'Phụ âm',
      titleEn: 'Consonants',
      rows: [
        { label: 'Vô thanh', labelEn: 'Voiceless', symbols: stops.filter((p) => VOICELESS.includes(p.symbol)).map((p) => p.symbol) },
        { label: 'Hữu thanh', labelEn: 'Voiced', symbols: stops.filter((p) => !VOICELESS.includes(p.symbol)).map((p) => p.symbol) },
        { label: 'Mũi & lỏng', labelEn: 'Nasal & liquid', symbols: liquids.map((p) => p.symbol) },
      ],
    },
  ];
}
