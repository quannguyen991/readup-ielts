import b1 from './seed/sentence-notes/batch-1.json';
import b2 from './seed/sentence-notes/batch-2.json';
import b3 from './seed/sentence-notes/batch-3.json';
import b4 from './seed/sentence-notes/batch-4.json';
import b5 from './seed/sentence-notes/batch-5.json';
import b6 from './seed/sentence-notes/batch-6.json';
import b7 from './seed/sentence-notes/batch-7.json';
import b8 from './seed/sentence-notes/batch-8.json';

/**
 * Ghi chú CẤU TRÚC soạn sẵn cho từng câu chép chính tả (648 câu trong 54 bài +
 * 100 câu của kho cũ). Soạn MỘT lần bằng AI rồi kiểm bằng test (khối ghép lại
 * phải trùng từng từ với câu gốc, mã cấu trúc phải có trong kho) — không gọi AI
 * lúc chạy, nên không tốn quota và cho kết quả như nhau ở mọi lần mở.
 *
 * Khoá = mã câu: `set-07-03` (bộ đề) hoặc `dict-12` (kho cũ). Câu không có mục ở
 * đây (câu dịch, câu người dùng tự viết) thì `sentence-explain.ts` dựng bằng luật.
 *
 * Dạng mỗi mục (khoá viết tắt để file gọn):
 *   c — khối câu [mã vai trò, văn bản] · s — mã cấu trúc (đầu = chính)
 *   n — một câu ghi chú · x — 2 câu mẫu cùng khuôn [en, vi]
 *   y — từ khoá [cụm, tương đương…, nghĩa] · r — 2 cách viết lại [en, nhãn]
 */
export type SentenceNote = {
  c: [string, string][];
  s: string[];
  n: string;
  x: [string, string][];
  y: string[][];
  r: [string, string][];
};

export const SENTENCE_NOTES: Readonly<Record<string, SentenceNote>> = Object.freeze({
  ...(b1 as unknown as Record<string, SentenceNote>),
  ...(b2 as unknown as Record<string, SentenceNote>),
  ...(b3 as unknown as Record<string, SentenceNote>),
  ...(b4 as unknown as Record<string, SentenceNote>),
  ...(b5 as unknown as Record<string, SentenceNote>),
  ...(b6 as unknown as Record<string, SentenceNote>),
  ...(b7 as unknown as Record<string, SentenceNote>),
  ...(b8 as unknown as Record<string, SentenceNote>),
});
