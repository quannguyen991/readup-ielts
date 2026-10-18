import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import { addSubmission, submissionsForPrompt, writingProgress } from './writing-history';
import { useStudyStore } from './useStudyStore';
import { countWords } from '@/lib/writing/word-count';
import type {
  DrillPart,
  WritingEvaluation,
  WritingMode,
  WritingSubmission,
} from '@/lib/writing/types';

/**
 * Bài viết của người học: bản nháp đang gõ, bài đã nộp, và bản chấm.
 *
 * Lưu cục bộ vì dự án chưa có đăng nhập — cùng cách `useStudyStore` đang làm.
 * Bản nháp lưu riêng theo từng đề (và từng phần drill) để mở lại đúng bài dở,
 * và chỉ xoá khi nộp: đóng tab giữa chừng không được mất bài đang viết.
 *
 * KHÔNG import file này từ `*.test.ts`. Nó kéo theo `persist.ts` → `react-native`,
 * mà esbuild của `tsx` không transform được RN ngoài Metro (`Unexpected "typeof"`
 * ở `react-native/index.js`). Đã thử. Vì vậy toàn bộ phần tính toán nằm ở
 * `writing-history.ts` — file thuần, không đụng RN, và là chỗ được test.
 */

type DraftKey = string;

/** Bài mẫu đã sinh, khoá theo `promptId:targetBand`. */
export type StoredModelEssay = {
  promptId: string;
  targetBand: number;
  bodyText: string;
  wordCount: number;
  verifiedLow: number | null;
  verifiedHigh: number | null;
};

type WritingState = {
  drafts: Record<DraftKey, { text: string; updatedAt: string }>;
  submissions: WritingSubmission[];
  evaluations: WritingEvaluation[];
  /** Sinh bài mẫu tốn ba lượt gọi model, nên sinh xong là giữ lại. */
  modelEssays: Record<string, StoredModelEssay>;

  saveDraft: (promptId: string, drillPart: DrillPart | null, text: string) => void;
  getDraft: (promptId: string, drillPart: DrillPart | null) => string;
  clearDraft: (promptId: string, drillPart: DrillPart | null) => void;

  submit: (input: {
    promptId: string;
    mode: WritingMode;
    drillPart: DrillPart | null;
    bodyText: string;
    durationSeconds: number;
  }) => WritingSubmission;

  saveEvaluation: (evaluation: WritingEvaluation) => void;
  saveModelEssay: (essay: StoredModelEssay) => void;
  getModelEssay: (promptId: string, targetBand: number) => StoredModelEssay | undefined;
};

/**
 * Một đề có thể có nhiều bản nháp song song: bản viết cả bài, và bản của từng
 * phần drill. Khoá phải phân biệt được chúng, nếu không luyện overview sẽ đè
 * mất bài đang viết dở.
 */
const draftKey = (promptId: string, drillPart: DrillPart | null): DraftKey =>
  drillPart ? `${promptId}:${drillPart}` : promptId;

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      drafts: {},
      submissions: [],
      evaluations: [],
      modelEssays: {},

      saveDraft: (promptId, drillPart, text) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [draftKey(promptId, drillPart)]: { text, updatedAt: new Date().toISOString() },
          },
        })),

      getDraft: (promptId, drillPart) => get().drafts[draftKey(promptId, drillPart)]?.text ?? '',

      clearDraft: (promptId, drillPart) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[draftKey(promptId, drillPart)];
          return { drafts: next };
        }),

      submit: (input) => {
        const submission: WritingSubmission = {
          id: uid(),
          promptId: input.promptId,
          mode: input.mode,
          drillPart: input.drillPart,
          bodyText: input.bodyText,
          // Đếm lại ở đây thay vì tin con số màn hình truyền xuống: màn hình có
          // thể đang hiển thị số đếm của lần gõ trước.
          wordCount: countWords(input.bodyText),
          durationSeconds: input.durationSeconds,
          submittedAt: new Date().toISOString(),
        };
        set((s) => ({ submissions: addSubmission(s.submissions, submission) }));
        get().clearDraft(input.promptId, input.drillPart);
        // Bài viết tính vào thời gian học và vào chuỗi ngày, như mọi việc khác.
        const study = useStudyStore.getState();
        const minutes = Math.round(input.durationSeconds / 60);
        if (minutes > 0) study.logStudyTime('practice', Math.min(minutes, 60));
        study.logEvent();
        return submission;
      },

      saveEvaluation: (evaluation) =>
        set((s) => ({
          evaluations: [
            evaluation,
            ...s.evaluations.filter((e) => e.submissionId !== evaluation.submissionId),
          ],
        })),

      saveModelEssay: (essay) =>
        set((s) => ({
          modelEssays: { ...s.modelEssays, [`${essay.promptId}:${essay.targetBand}`]: essay },
        })),

      getModelEssay: (promptId, targetBand) => get().modelEssays[`${promptId}:${targetBand}`],
    }),
    { name: `${STORAGE_PREFIX}writing`, storage: storage() },
  ),
);

/** Chọn lọc dùng ở màn Progress và Dashboard. */
export const selectWritingProgress = (s: WritingState) =>
  writingProgress(s.submissions, s.evaluations);

export const selectSubmissionsForPrompt = (promptId: string) => (s: WritingState) =>
  submissionsForPrompt(s.submissions, promptId);
