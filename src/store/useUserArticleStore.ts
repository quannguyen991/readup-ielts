import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import commonWords from '@/data/common-words.json';
import type { Article } from '@/data/articles';
import { analyzeText } from '@/services/ingest/readability';

/**
 * Bài do người dùng tự dán vào. Dùng chung mọi tính năng với bài cào sẵn:
 * tra từ, highlight, sinh đề, chat.
 */
const COMMON = new Set(commonWords as string[]);

type UserArticleState = {
  articles: Record<string, Article>;
  addFromText: (text: string, title?: string) => string;
  remove: (id: string) => void;
};

export const useUserArticleStore = create<UserArticleState>()(
  persist(
    (set) => ({
      articles: {},

      addFromText: (text, title) => {
        const id = `user-${uid()}`;
        const paragraphs = text
          .split(/\n{2,}/)
          .map((p) => p.replace(/\s+/g, ' ').trim())
          .filter((p) => p.split(/\s+/).length >= 8);

        const body = paragraphs.join('\n\n');
        const analysis = analyzeText(body, COMMON);

        const resolvedTitle =
          title?.trim() ||
          (paragraphs[0] ?? text).split(/\s+/).slice(0, 8).join(' ') ||
          'Văn bản của tôi';

        const article: Article = {
          id,
          externalId: id,
          title: resolvedTitle,
          slug: id,
          sourceName: 'Văn bản của tôi',
          sourceUrl: '',
          topic: 'society',
          track: 'academic',
          // Bài dán tay không thuộc kỳ thi nào; xếp vào IELTS vì đó là mặc
          // định của app, và không có tier vì không đi qua normalizeArticle.
          exam: 'ielts',
          satTextType: null,
          passageTier: null,
          // Không nằm trong seed nên không thuộc chunk nào; toàn văn giữ ngay
          // trong store này.
          chunk: null,
          licenseType: 'user_pasted',
          attribution: null,
          publishedAt: new Date().toISOString(),
          summary: paragraphs[0]?.slice(0, 200) ?? null,
          bodyText: body,
          paragraphs,
          thumbnailUrl: null,
          cefrLevel: analysis.cefr,
          bandRange: analysis.bandRange,
          wordCount: analysis.wordCount,
          estMinutes: analysis.estMinutes,
          readabilityScore: analysis.fkGrade,
          rareWordRatio: analysis.rareWordRatio,
        };

        set((state) => ({ articles: { ...state.articles, [id]: article } }));
        return id;
      },

      remove: (id) =>
        set((state) => {
          const articles = { ...state.articles };
          delete articles[id];
          return { articles };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}user-articles`,
      storage: storage<UserArticleState>(),
      // v2: Article có thêm exam / satTextType / chunk. KHÁC useQuestionStore ở
      // chỗ đây là nội dung người dùng tự dán — vứt đi là mất bài của họ, nên
      // phải vá field thiếu chứ không được bỏ state cũ.
      version: 2,
      migrate: (persisted) => {
        const state = persisted as UserArticleState | undefined;
        if (!state?.articles) return { articles: {} } as UserArticleState;

        const articles = Object.fromEntries(
          Object.entries(state.articles).map(([id, value]) => {
            // Bài lưu từ bản cũ thiếu hẳn mấy field này, dù kiểu Article nói là
            // có — nên phải đọc qua Partial rồi bù mặc định.
            const article = value as Partial<Article>;
            return [
              id,
              {
                ...article,
                exam: article.exam ?? 'ielts',
                satTextType: article.satTextType ?? null,
                passageTier: article.passageTier ?? null,
                chunk: article.chunk ?? null,
              } as Article,
            ];
          }),
        );

        return { ...state, articles } as UserArticleState;
      },
    },
  ),
);
