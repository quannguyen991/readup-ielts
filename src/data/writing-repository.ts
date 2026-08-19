import seed from './seed/writing/index.json';
import type { Task1Chart, Task2Essay, WritingPrompt, WritingTask } from '@/lib/writing/types';

/**
 * Kho đề Writing.
 *
 * Nguồn hiện tại là seed JSON tĩnh, cùng lý do như kho bài đọc: app dùng được
 * ngay cả khi chưa cấu hình Supabase. Khi chuyển sang Supabase thì chỉ ruột các
 * hàm dưới đây đổi, chữ ký giữ nguyên — nên màn hình không phải sửa gì.
 *
 * Khác kho bài đọc ở một điểm: đề Writing nhẹ (không có toàn văn bài đọc kèm
 * theo) nên không cần tách index và chunk, nạp thẳng một file là đủ.
 */

export const WRITING_PROMPTS: WritingPrompt[] = seed as unknown as WritingPrompt[];

export type WritingPromptFilters = {
  task?: WritingTask;
  chartKind?: Task1Chart;
  essayKind?: Task2Essay;
  topicSlug?: string;
  /** Lấy mọi đề có band mục tiêu không vượt quá mức này. */
  maxBand?: number;
  search?: string;
};

export function getWritingPromptById(id: string): WritingPrompt | undefined {
  return WRITING_PROMPTS.find((p) => p.id === id);
}

export function filterWritingPrompts(filters: WritingPromptFilters = {}): WritingPrompt[] {
  const search = filters.search?.trim().toLowerCase();

  return WRITING_PROMPTS.filter((p) => {
    if (filters.task && p.task !== filters.task) return false;
    if (filters.chartKind && p.chartKind !== filters.chartKind) return false;
    if (filters.essayKind && p.essayKind !== filters.essayKind) return false;
    if (filters.topicSlug && p.topicSlug !== filters.topicSlug) return false;
    if (filters.maxBand != null && p.difficultyBand > filters.maxBand) return false;
    if (search && !p.promptText.toLowerCase().includes(search)) return false;
    return true;
  });
}

export function writingLibraryStats(): { total: number; byTask: Record<WritingTask, number> } {
  const byTask: Record<WritingTask, number> = { ielts_task1: 0, ielts_task2: 0 };
  for (const p of WRITING_PROMPTS) byTask[p.task] += 1;
  return { total: WRITING_PROMPTS.length, byTask };
}
