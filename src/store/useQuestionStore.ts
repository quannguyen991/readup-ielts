import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { Article } from '@/data/articles';
import { generateOfflineQuestionSet } from '@/services/questions/offline-generator';
import type { QuestionSet } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

/**
 * Bộ đề đã sinh, cache theo articleId để mở lại không phải gọi AI lần nữa.
 * Ưu tiên bộ sinh AI qua /api/questions; gọi hỏng thì dùng bộ offline.
 */
type QuestionState = {
  sets: Record<string, QuestionSet>;
  loading: Record<string, boolean>;
  lastError: string | null;

  ensureSet: (
    article: Article,
    options?: { force?: boolean; types?: QuestionType[] },
  ) => Promise<QuestionSet>;
  focusSet: (article: Article, type: QuestionType) => Promise<QuestionSet>;
  getSet: (articleId: string) => QuestionSet | undefined;
};

/**
 * Bài của kho seed mang id dạng UUID; bài người dùng tạo mang tiền tố riêng.
 *
 * Kiểm bằng tiền tố chứ không gọi ngược lên kho: hàm này chạy ở client, mà kho
 * seed thì nặng vài trăm KB — nạp nó chỉ để hỏi một câu hỏi có/không là quá đắt.
 */
function isSeedArticle(id: string): boolean {
  return !id.startsWith('user-') && !id.startsWith('yt-');
}

async function requestAiSet(
  article: Article,
  options: { count?: number; focusType?: QuestionType; types?: QuestionType[] } = {},
): Promise<QuestionSet | null> {
  try {
    /*
      Có hạn chờ, và hạn đó phải DÀI HƠN cả phía máy chủ.

      Sinh 12 câu mất 20-21 giây đo trên production, nên hạn phải nới hơn thế
      nhiều. Không đặt hạn thì một request treo sẽ để cờ `loading` bật mãi và
      panel câu hỏi đứng ở "0 / 0" không bao giờ đổi — người dùng không biết là
      đang chờ hay đã hỏng.
    */
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      /*
        Bài KHÔNG nằm trong kho seed thì phải gửi kèm toàn văn.

        Máy chủ tra bài theo id trong kho; văn bản người dùng tự dán chỉ tồn tại
        trên máy họ nên tra không ra, và trước đây lượt gọi ấy nhận 404 rồi âm
        thầm rơi về bộ sinh offline — chỉ làm được một dạng câu. Tức là tính năng
        "dán văn bản rồi làm đề" chưa bao giờ thật sự dùng AI.
      */
      body: JSON.stringify({
        articleId: article.id,
        ...options,
        ...(isSeedArticle(article.id)
          ? {}
          : {
              passage: {
                title: article.title,
                paragraphs: article.paragraphs,
                cefrLevel: article.cefrLevel,
              },
            }),
      }),
      signal: AbortSignal.timeout(75_000),
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
        /*
          Cache khớp khi CÙNG BÀI VÀ CÙNG ĐƠN HÀNG DẠNG CÂU.

          Đổi bộ lọc "Loại câu hỏi" rồi mở lại đúng bài đó phải ra đề khác. Nếu
          chỉ so theo articleId thì bộ lọc trông như không có tác dụng — thao tác
          xong mà màn hình y nguyên là dấu hiệu app hỏng, dù nó chỉ đang trả cache.
        */
        const wanted = options.types?.length ? [...options.types].sort().join(',') : '';

        /*
          BỘ ĐỀ OFFLINE KHÔNG ĐƯỢC TÍNH LÀ CACHE HỢP LỆ.

          Đây là lỗi làm người dùng chỉ thấy Multiple Choice, và nó nằm ở cache
          chứ không ở bộ sinh. Bộ offline chỉ làm được một dạng câu; nó là đường
          lùi khi gọi AI hỏng. Nhưng bản trước cache nó y như cache bộ đề AI, nên
          MỘT lần gọi hỏng — mạng chớp một nhịp, hàm serverless khởi động lạnh —
          là bài đó bị ghim vào bộ đề yếu VĨNH VIỄN: mọi lần mở sau đều gặp cache
          và không bao giờ thử lại AI nữa.

          Đã thấy đúng thế trên production: bài Great Barrier Reef nằm trong
          storage với `generatedBy: 'offline'`, 12 câu Multiple Choice, trong khi
          gọi thẳng endpoint thì trả về đủ bốn dạng trong 20 giây.

          Nay gặp cache offline thì vẫn thử AI lại. Hỏng nữa thì giữ nguyên bộ
          offline — không mất gì, vì nó đã có sẵn trong tay.
        */
        const sameOrder = (cached?.requestedTypes ?? '') === wanted;
        const usable = cached && sameOrder && cached.generatedBy !== 'offline';
        if (usable && !options.force) return cached;

        set((state) => ({ loading: { ...state.loading, [article.id]: true } }));

        const aiSet = await requestAiSet(article, options.types?.length ? { types: options.types } : {});

        // Gọi AI hỏng mà đã có bộ offline đúng đơn hàng thì dùng lại, khỏi sinh
        // lại một bộ y hệt.
        const fallback = cached && sameOrder ? cached : generateOfflineQuestionSet(article);
        const questionSet = { ...(aiSet ?? fallback), requestedTypes: wanted };

        set((state) => ({
          sets: { ...state.sets, [article.id]: questionSet },
          loading: { ...state.loading, [article.id]: false },
          lastError: aiSet ? null : 'Không gọi được AI, đang dùng bộ đề offline.',
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
      //
      // v4: bộ đề nay mang thêm `requestedTypes`. Bộ cũ trong storage không có
      // trường đó nên sẽ khớp với đơn hàng rỗng và không bao giờ khớp với một
      // bộ lọc dạng câu — đúng ý, nhưng bump cho sạch.
      version: 4,
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
