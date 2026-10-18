import { useMemo } from 'react';

import { getWritingPromptById } from '@/data/writing-repository';
import { ALL_LESSONS } from '@/services/hub/grammar-course';
import { buildActivityFeed, type FeedItem } from './feed';
import { useHubStore } from '@/store/useHubStore';
import { useListeningStore } from '@/store/useListeningStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useWritingStore } from '@/store/useWritingStore';

/**
 * Lịch sử hoạt động của người học, lấy thẳng từ các kho đã lưu (và đã đồng bộ).
 * Không có bản sao nào: mọi dòng đều đọc từ kho gốc mỗi lần đổi.
 */
export function useActivityFeed(): FeedItem[] {
  const sessions = useStudyStore((s) => s.sessions);
  const listening = useListeningStore((s) => s.attempts);
  const speaking = useSpeakingStore((s) => s.attempts);
  const writing = useWritingStore((s) => s.submissions);
  const lessonsDone = useHubStore((s) => s.lessonsDone);
  const doneByDay = useHubStore((s) => s.doneByDay);

  return useMemo(
    () =>
      buildActivityFeed({
        sessions,
        listening: listening.map((a) => ({
          id: a.id,
          title: a.title,
          score: a.score,
          total: a.total,
          band: a.band,
          finishedAt: a.finishedAt,
        })),
        speaking: speaking.map((a) => ({ id: a.id, titleVi: a.titleVi, typed: a.typed, finishedAt: a.finishedAt })),
        writing: writing.map((w) => ({
          id: w.id,
          promptLabel: writingLabel(w.promptId, w.drillPart),
          wordCount: w.wordCount,
          submittedAt: w.submittedAt,
        })),
        lessons: Object.entries(lessonsDone).map(([id, at]) => ({
          id,
          title: ALL_LESSONS.find((l) => l.id === id)?.title ?? id,
          at,
        })),
        dailyDone: Object.fromEntries(Object.entries(doneByDay).map(([day, ids]) => [day, ids.length])),
      }),
    [sessions, listening, speaking, writing, lessonsDone, doneByDay],
  );
}

/** Tên bài viết hiển thị: dạng đề và đầu đề. Đề đã bị xoá khỏi kho thì chỉ còn dạng đề. */
function writingLabel(promptId: string, drillPart: string | null): string {
  const prompt = getWritingPromptById(promptId);
  const task = prompt?.task === 'ielts_task1' ? 'Task 1' : prompt?.task === 'ielts_task2' ? 'Task 2' : 'Writing';
  const head = prompt ? prompt.promptText.replace(/\s+/g, ' ').trim().slice(0, 56) : '';
  const drill = drillPart ? ` · luyện ${drillPart}` : '';
  return head ? `${task}${drill}: ${head}${prompt && prompt.promptText.length > 56 ? '…' : ''}` : `${task}${drill}`;
}
