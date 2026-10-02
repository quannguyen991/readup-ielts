import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { getArticleById, type Article } from '@/data/articles';
import { buildMixedRuleQuestionSet, buildRuleQuestionSet } from '@/services/questions/build-set';
import { generateOfflineQuestionSet } from '@/services/questions/offline-generator';
import type { MixBlock } from '@/services/questions/ielts-types';
import { generateMixSet, type MixResult } from '@/services/questions/remote';
import type { QuestionSet } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

/**
 * Bộ đề của một bài, giữ lại theo articleId.
 *
 * KHÔNG CÒN GỌI MẠNG. Trước đây mỗi lần mở bài là một lượt gọi AI: chờ hai mươi
 * giây trước khi thấy câu đầu tiên, và mỗi lần gọi lại ra một bộ khác — nên
 * "làm lại đề cũ" thật ra là làm một đề mới, không so được hai lần làm. Gọi
 * hỏng thì rơi xuống bộ đường lùi chỉ có một dạng câu, và bộ ấy bị cache lại
 * vĩnh viễn.
 *
 * Nay đề dựng bằng luật ngay trên máy: hiện ra tức thì, cùng một bài thì lần nào
 * cũng ra đúng bộ đề ấy, và không tốn một lượt gọi nào. Cache vẫn giữ, nhưng chỉ
 * để khỏi dựng lại — mất cache thì dựng lại ra y hệt.
 */
/** Tiến độ tạo đề theo bộ trộn: bao nhiêu khối đã xong trong tổng số. */
export type MixProgress = { done: number; total: number };

type QuestionState = {
  sets: Record<string, QuestionSet>;
  loading: Record<string, boolean>;
  /** Bài nào đang tạo đề theo bộ trộn (không persist). */
  generating: Record<string, MixProgress | undefined>;
  lastError: string | null;

  ensureSet: (
    article: Article,
    options?: { force?: boolean; types?: QuestionType[] },
  ) => Promise<QuestionSet>;
  focusSet: (article: Article, type: QuestionType) => Promise<QuestionSet>;
  /** Bộ trộn dạng cho nhánh luyện xen kẽ — cố tình KHÔNG đi thành khối. */
  mixedSet: (article: Article) => Promise<QuestionSet>;
  getSet: (articleId: string) => QuestionSet | undefined;
  /**
   * Tạo đề theo bộ trộn dạng bài (nối tiêu đề, bảng, Choose TWO…). Mỗi khối một lượt
   * gọi song song nên `generating` cập nhật theo từng khối. Thành công thì bộ mới
   * thay bộ cũ của bài và được giữ lại.
   */
  generateSet: (
    article: Article,
    blocks: MixBlock[],
    options?: { fetchImpl?: typeof fetch },
  ) => Promise<MixResult>;
  /** Bỏ bộ đã tạo, quay về bộ mặc định dựng bằng luật. */
  clearSet: (articleId: string) => void;
};

/** Vị trí passage suy ra từ mức khó đã gán cho bài. */
function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  return tier === 'p3' ? 3 : tier === 'p2' ? 2 : 1;
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      sets: {},
      loading: {},
      generating: {},
      lastError: null,

      ensureSet: async (article, options = {}) => {
        const cached = get().sets[article.id];
        /*
          Cache khớp khi CÙNG BÀI VÀ CÙNG ĐƠN HÀNG DẠNG CÂU.

          Đổi bộ lọc "Loại câu hỏi" rồi mở lại đúng bài đó phải ra đề khác. Nếu
          chỉ so theo articleId thì bộ lọc trông như không có tác dụng — thao tác
          xong mà màn hình y nguyên là dấu hiệu app hỏng, dù nó chỉ đang trả cache.
        */
        const wanted = options.types?.length ? [...options.types].sort().join(',') : '';
        if (cached && (cached.requestedTypes ?? '') === wanted && !options.force) return cached;
        // Bộ người học đã TẠO theo bộ trộn không bị bộ mặc định đè khi mở lại bài.
        if (cached?.requestedTypes?.startsWith('mix:') && !options.types?.length && !options.force) return cached;

        /*
          Dựng ngay, không bật cờ chờ.

          Dựng bằng luật xong trong vài mili giây, nên bật `loading` rồi tắt chỉ
          làm panel câu hỏi chớp một nhịp trắng — người dùng đọc ra là app giật.
        */
        const questionSet: QuestionSet = {
          ...(options.types?.length
            ? buildRuleQuestionSet(
                { id: article.id, title: article.title, paragraphs: article.paragraphs },
                {
                  position: positionOf(article.passageTier),
                  blocks: options.types.map((type) => ({ type, count: 4 })),
                },
              )
            : generateOfflineQuestionSet(article)),
          requestedTypes: wanted,
        };

        set((state) => ({
          sets: { ...state.sets, [article.id]: questionSet },
          loading: { ...state.loading, [article.id]: false },
          lastError: null,
        }));

        return questionSet;
      },

      focusSet: async (article, type) => {
        const questionSet = buildRuleQuestionSet(
          { id: article.id, title: article.title, paragraphs: article.paragraphs },
          { position: positionOf(article.passageTier), blocks: [{ type, count: 8 }] },
        );
        set((state) => ({ sets: { ...state.sets, [article.id]: questionSet } }));
        return questionSet;
      },

      mixedSet: async (article) => {
        const questionSet = buildMixedRuleQuestionSet({
          id: article.id,
          title: article.title,
          paragraphs: article.paragraphs,
        });
        set((state) => ({ sets: { ...state.sets, [article.id]: questionSet } }));
        return questionSet;
      },

      getSet: (articleId) => get().sets[articleId],

      generateSet: async (article, blocks, options = {}) => {
        set((state) => ({ generating: { ...state.generating, [article.id]: { done: 0, total: blocks.length } } }));
        try {
          const result = await generateMixSet(
            {
              id: article.id,
              title: article.title,
              paragraphs: article.paragraphs,
              passageTier: article.passageTier,
              inLibrary: !article.id.startsWith('user-') && Boolean(getArticleById(article.id)),
            },
            blocks,
            {
              ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
              onProgress: (done, total) =>
                set((state) => ({ generating: { ...state.generating, [article.id]: { done, total } } })),
            },
          );
          if (result.set) {
            const next = result.set;
            set((state) => ({ sets: { ...state.sets, [article.id]: next } }));
          }
          return result;
        } finally {
          set((state) => ({ generating: { ...state.generating, [article.id]: undefined } }));
        }
      },

      clearSet: (articleId) =>
        set((state) => {
          const next = { ...state.sets };
          delete next[articleId];
          return { sets: next };
        }),
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
      //
      // v4: bộ đề nay mang thêm `requestedTypes`. Bộ cũ trong storage không có
      // trường đó nên sẽ khớp với đơn hàng rỗng và không bao giờ khớp với một
      // bộ lọc dạng câu — đúng ý, nhưng bump cho sạch.
      //
      // v5: đề IELTS nay dựng bằng luật và đi thành khối. Bộ AI cũ trong storage
      // trộn lẫn các dạng trong một passage — đúng cái phải bỏ. Không bump thì
      // người đã mở bài trước đó vẫn nhận đề trộn từ cache và không bao giờ thấy
      // bộ mới.
      version: 5,
      /*
        Khai `migrate` dù nó chỉ VỨT dữ liệu cũ.

        Không khai thì zustand in cảnh báo "State loaded from storage couldn't be
        migrated since no migrate function was provided" vào console mỗi lần mở
        app — một dòng đỏ gây lo cho việc vốn đang chạy đúng, và nó lẫn vào giữa
        những lỗi thật.

        Vứt là đúng ở đây: bộ đề sinh lại được từ chính bài đọc, nên bỏ cache cũ
        không mất gì của người học. Viết ra thành ý định rõ ràng thay vì để
        zustand đoán.
      */
      migrate: () => ({ sets: {} }) as QuestionState,
      partialize: (state) => ({ sets: state.sets }) as QuestionState,
    },
  ),
);
