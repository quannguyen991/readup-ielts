import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { Article } from '@/data/articles';
import { generateOfflineQuestionSet } from '@/services/questions/offline-generator';
import type { QuestionSet } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

/**
 * Bộ đề đã sinh, cache theo articleId để mở lại không phải gọi AI lần nữa.
 * Ưu tiên Claude qua /api/questions; lỗi hoặc chưa có key thì dùng bộ offline.
 */
type QuestionState = {
  sets: Record<string, QuestionSet>;
  loading: Record<string, boolean>;
  lastError: string | null;

  ensureSet: (article: Article, options?: { force?: boolean }) => Promise<QuestionSet>;
  focusSet: (article: Article, type: QuestionType) => Promise<QuestionSet>;
  getSet: (articleId: string) => QuestionSet | undefined;
};

async function requestAiSet(
  article: Article,
  options: { count?: number; focusType?: QuestionType } = {},
): Promise<QuestionSet | null> {
  try {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, ...options }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as QuestionSet;
    return data.questions?.length > 0 ? data : null;
  } catch {
    return null;
  }
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      sets: {},
      loading: {},
      lastError: null,

      ensureSet: async (article, options = {}) => {
        const cached = get().sets[article.id];
        if (cached && !options.force) return cached;

        set((state) => ({ loading: { ...state.loading, [article.id]: true } }));

        const aiSet = await requestAiSet(article);
        const questionSet = aiSet ?? generateOfflineQuestionSet(article);

        set((state) => ({
          sets: { ...state.sets, [article.id]: questionSet },
          loading: { ...state.loading, [article.id]: false },
          lastError: aiSet ? null : 'Đang dùng bộ đề offline (chưa cấu hình Claude API).',
        }));

        return questionSet;
      },

      focusSet: async (article, type) => {
        const aiSet = await requestAiSet(article, { focusType: type, count: 8 });
        const questionSet =
          aiSet ?? {
            ...generateOfflineQuestionSet(article),
            questions: generateOfflineQuestionSet(article).questions.filter(
              (q) => q.type === type,
            ),
          };

        set((state) => ({ sets: { ...state.sets, [article.id]: questionSet } }));
        return questionSet;
      },

      getSet: (articleId) => get().sets[articleId],
    }),
    {
      name: `${STORAGE_PREFIX}questions`,
      storage: storage<QuestionState>(),
      // v2: bài SAT giờ sinh đề bằng bộ SAT. Bộ đề IELTS đã cache từ trước vẫn
      // nằm trong storage và được trả về trước khi kịp sinh lại, nên một trích
      // đoạn Jane Austen hiện ra 11 câu Matching Headings — đã gặp thật. Không
      // khai migrate là có chủ ý: bộ đề sinh lại được từ bài, vứt đi là xong,
      // không mất gì của người dùng.
      //
      // v3: bộ đề IELTS offline viết lại hẳn — bỏ bốn dạng giải được bằng đối
      // chiếu chuỗi. Không bump thì người đã mở bài trước đó vẫn nhận đúng bộ
      // đề dễ cũ từ cache, sửa cũng như không.
      version: 3,
      partialize: (state) => ({ sets: state.sets }) as QuestionState,
    },
  ),
);
