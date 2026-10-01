import { createContext, useContext } from 'react';

import type { Mark } from './highlight-model';

/**
 * Trạng thái công cụ của phòng thi cho CÂU ĐANG MỞ — phương án đã gạch, vệt tô
 * trên đoạn văn. Khung (`SatExamShell`) giữ trạng thái theo mã câu; phần câu hỏi
 * (đoạn văn, phương án) đọc qua context nên màn chạy bài không phải chuyền tay.
 *
 * Ngoài khung thì `useExamTools()` trả `null` — cùng component phương án vẫn vẽ
 * được ở màn xem lại, chỉ không có nút gạch.
 */
export type ExamTools = {
  questionKey: string;
  /** Chế độ loại trừ (nút ABC) đang bật. */
  eliminate: boolean;
  struck: readonly number[];
  toggleStrike: (index: number) => void;
  /** Bôi đen đoạn văn là mở bảng tô màu. */
  highlightOn: boolean;
  marks: readonly Mark[];
  setMarks: (update: (prev: Mark[]) => Mark[]) => void;
};

export const ExamToolsContext = createContext<ExamTools | null>(null);

export function useExamTools(): ExamTools | null {
  return useContext(ExamToolsContext);
}
