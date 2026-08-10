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
          // Bài dán tay không đi qua normalizeArticle nên không có tier.
          passageTier: null,
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
    { name: `${STORAGE_PREFIX}user-articles`, storage: storage<UserArticleState>(), version: 1 },
  ),
);
