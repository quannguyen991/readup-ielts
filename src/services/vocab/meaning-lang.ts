import type { StudyWord } from './topic-study';

/**
 * NGÔN NGỮ NGHĨA khi học từ: tiếng Việt (mặc định) hoặc tiếng Anh.
 *
 * Kết hợp với chiều học sẵn có (thấy từ → chọn nghĩa, thấy nghĩa → tìm từ) cho đủ các cặp:
 *   Nhật/Trung ↔ Việt, Nhật/Trung ↔ Anh, Anh ↔ Việt và Anh ↔ Anh (từ tiếng Anh với định nghĩa tiếng Anh).
 *
 * Cách làm: màn học nào cũng đọc nghĩa ở `meaningVi`, nên khi chọn tiếng Anh ta đổi chữ trong `meaningVi`
 * sang nghĩa tiếng Anh ngay tại nguồn (xem `useStudyDeck`) — không phải sửa từng màn. Nghĩa tiếng Việt gốc
 * được giữ ở `viMeaning` để lưu vào sổ từ vẫn đúng tiếng Việt.
 */
export type MeaningLang = 'vi' | 'en';

export const DEFAULT_MEANING_LANG: MeaningLang = 'vi';

export const isMeaningLang = (v: unknown): v is MeaningLang => v === 'vi' || v === 'en';

/**
 * Nghĩa tiếng Anh gọn cho từ Nhật/Trung: nguồn thường liệt kê nhiều nghĩa ("root; stem; origin; source; this; …").
 * Lấy tối đa 3 nghĩa đầu và cắt ở ranh giới nghĩa để đáp án trắc nghiệm không dài lê thê.
 */
export function shortGloss(gloss: string, maxSenses = 3, maxLen = 80): string {
  const parts = gloss
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length >= maxSenses) break;
    const next = [...out, p].join('; ');
    if (out.length > 0 && next.length > maxLen) break;
    out.push(p);
  }
  return out.join('; ') || gloss.trim();
}

/**
 * Áp ngôn ngữ nghĩa lên danh sách từ. `vi` trả lại đúng danh sách (không tạo bản sao).
 * Từ nào không có nghĩa tiếng Anh thì giữ nghĩa tiếng Việt, để không có thẻ trống.
 */
export function applyMeaningLang<W extends StudyWord>(words: readonly W[], lang: MeaningLang): readonly W[] {
  if (lang === 'vi') return words;
  return words.map((w) => {
    const definition = (w.definitionEn ?? '').trim();
    if (!definition) return w;
    const eastAsian = w.language === 'ja' || w.language === 'zh';
    return {
      ...w,
      viMeaning: w.viMeaning ?? w.meaningVi,
      meaningVi: eastAsian ? shortGloss(definition) : definition,
      glossLanguage: 'en' as const,
      // Câu ví dụ: bản dịch tiếng Anh nếu có, nếu không giữ bản tiếng Việt.
      exampleVi: w.exampleEn ?? w.exampleVi,
    };
  });
}

/** Nghĩa tiếng Việt GỐC của một từ (kể cả khi đang học bằng nghĩa tiếng Anh) — dùng khi lưu vào sổ từ. */
export const vietnameseOf = (w: Pick<StudyWord, 'meaningVi' | 'viMeaning'>): string => w.viMeaning ?? w.meaningVi;
