/**
 * Kiểu mục từ điển SAT Verbal và hai hàm dựng mục (từ nối / từ thường). Tách ra
 * tệp riêng để các tệp bổ sung (`sat-rw-lexicon-more-*.ts`) dùng chung mà không
 * vòng import với `sat-rw-lexicon.ts`.
 */
export type LexEntry = {
  pos: string;
  meaningVi: string;
  definitionEn: string;
  synonyms: string[];
  antonyms: string[];
  example: string;
  /** Chỉ từ nối: quan hệ logic mà từ nối này báo hiệu. */
  logic?: string;
};

export const T = (
  logic: string,
  meaningVi: string,
  definitionEn: string,
  synonyms: string[],
  antonyms: string[],
  example: string,
): LexEntry => ({ pos: 'transition', logic, meaningVi, definitionEn, synonyms, antonyms, example });

export const W = (
  pos: string,
  meaningVi: string,
  definitionEn: string,
  synonyms: string[],
  antonyms: string[],
  example: string,
): LexEntry => ({ pos, meaningVi, definitionEn, synonyms, antonyms, example });
