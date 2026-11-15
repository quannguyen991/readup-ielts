import { EAST_ASIAN_VOCAB_BOOKS } from '@/data/east-asian-vocab';

import type { Bi } from './types';

/**
 * LỘ TRÌNH TIẾNG TRUNG (HSK 1–6) VÀ TIẾNG NHẬT (JLPT N5–N1).
 *
 * Khác lộ trình IELTS/SAT (viết tay từng bài), phần này SINH từ kho từ vựng thật:
 * mỗi cấp có 9 chủ đề (Part), mỗi chủ đề gồm các buổi học tối đa 50 từ. Mọi bài
 * trỏ tới đúng một buổi học có thật (`/vocabulary/topic/<slug>`), nên "xong" đo
 * bằng luật bộ từ dùng chung (xem `services/learning-path/progress.ts`) — không
 * có bài giả, không có link gãy.
 *
 * Nguồn: Trung dùng "Ôn từ vựng HSK 2.0" (6 cấp × 9 chủ đề); Nhật dùng "Từ vựng
 * ôn JLPT" (5 cấp × 9 chủ đề). Sách HSK 3.0 và các bộ Irodori gắn vào cấp tương
 * ứng ở dạng "sách đi kèm".
 */

export type EaLang = 'zh' | 'ja';

export type EaNode = {
  /** Mã bài, duy nhất. */
  id: string;
  /** Slug buổi học trong kho từ vựng. */
  slug: string;
  title: Bi;
  words: number;
  minutes: number;
};

export type EaPart = {
  id: string;
  title: Bi;
  blurb: Bi;
  nodes: EaNode[];
  words: number;
};

export type EaBook = { slug: string; title: Bi; blurb: Bi };

export type EaLevel = {
  id: string;
  lang: EaLang;
  /** Nhãn cấp, vd. "HSK 3", "N4". */
  label: string;
  /** Chữ Hán số (một, ba…) làm con dấu của cấp. */
  seal: string;
  title: Bi;
  blurb: Bi;
  /** Mục tiêu cuối cấp, một câu. */
  goal: Bi;
  parts: EaPart[];
  words: number;
  /** Sách đi kèm (Irodori, HSK 3.0…). */
  books: EaBook[];
};

const b = (vi: string, en: string): Bi => ({ vi, en });

const THEME_BLURB: Record<string, Bi> = {
  'People, Family and Relationships': b('Gọi tên người thân, bạn bè và các mối quan hệ.', 'Name family, friends and relationships.'),
  'Time, Calendar and Daily Life': b('Nói về giờ giấc, ngày tháng và nhịp sống hằng ngày.', 'Talk about time, dates and daily routine.'),
  'Food, Shopping and Money': b('Gọi món, mua sắm và trả giá.', 'Order food, shop and talk about money.'),
  'Home and Everyday Objects': b('Đồ vật trong nhà và quanh mình.', 'Objects around the home.'),
  'Places, Transport and Travel': b('Hỏi đường, đi lại và du lịch.', 'Ask directions, get around and travel.'),
  'Study, Work and Communication': b('Học tập, công việc và trao đổi.', 'Study, work and communication.'),
  'Health, Weather and Nature': b('Sức khỏe, thời tiết và thiên nhiên.', 'Health, weather and nature.'),
  'Numbers, Position and Function Words': b('Số đếm, vị trí và những từ nối câu.', 'Numbers, position and function words.'),
  'Actions, Descriptions and Ideas': b('Động từ, tính từ và ý niệm trừu tượng.', 'Verbs, adjectives and abstract ideas.'),
};

const ZH_META: Record<number, { seal: string; title: Bi; blurb: Bi; goal: Bi }> = {
  1: { seal: '一', title: b('Khai mở', 'First steps'), blurb: b('Pinyin, thanh điệu và những câu đầu tiên.', 'Pinyin, tones and your first sentences.'), goal: b('Tự giới thiệu và hỏi đáp những câu cơ bản nhất.', 'Introduce yourself and handle the simplest exchanges.') },
  2: { seal: '二', title: b('Cửa nhà', 'Home ground'), blurb: b('Mua sắm, hỏi đường, nói về gia đình.', 'Shopping, directions and family.'), goal: b('Xử lý tình huống quen thuộc hằng ngày.', 'Handle familiar everyday situations.') },
  3: { seal: '三', title: b('Phố thị', 'City life'), blurb: b('Hội thoại hằng ngày và bài đọc ngắn.', 'Daily conversation and short readings.'), goal: b('Giao tiếp trôi chảy ở chủ đề quen.', 'Communicate smoothly on familiar topics.') },
  4: { seal: '四', title: b('Cầu vồng', 'Rainbow bridge'), blurb: b('Thảo luận, trình bày quan điểm, đọc bài dài.', 'Discuss, give opinions, read longer texts.'), goal: b('Thảo luận nhiều chủ đề và đọc văn bản dài.', 'Discuss many topics and read longer texts.') },
  5: { seal: '五', title: b('Núi cao', 'High peaks'), blurb: b('Báo chí, văn viết và sắc thái diễn đạt.', 'News, written style and nuance.'), goal: b('Đọc báo, xem phim và viết bài mạch lạc.', 'Read news, watch films and write coherently.') },
  6: { seal: '六', title: b('Đỉnh Thái', 'Summit'), blurb: b('Thành ngữ, văn phong học thuật, từ hiếm.', 'Idioms, academic style and rare words.'), goal: b('Hiểu gần như mọi văn bản và diễn đạt tinh tế.', 'Understand nearly any text and express yourself with finesse.') },
};

const JA_META: Record<number, { seal: string; title: Bi; blurb: Bi; goal: Bi }> = {
  5: { seal: '五', title: b('Khởi hành', 'Departure'), blurb: b('Chào hỏi, số đếm và những mẫu câu đầu tiên.', 'Greetings, numbers and first patterns.'), goal: b('Tự giới thiệu và hỏi đáp những câu cơ bản nhất.', 'Introduce yourself and handle the simplest exchanges.') },
  4: { seal: '四', title: b('Sống ở Nhật', 'Living in Japan'), blurb: b('Mua sắm, đi lại, nhờ vả và nói về dự định.', 'Shopping, getting around, requests and plans.'), goal: b('Xử lý tình huống thường ngày ở Nhật.', 'Handle everyday situations in Japan.') },
  3: { seal: '三', title: b('Giao tiếp tự nhiên', 'Natural speech'), blurb: b('Kính ngữ, công việc và tin tức đơn giản.', 'Keigo, work and simple news.'), goal: b('Hiểu hội thoại tốc độ gần tự nhiên.', 'Follow near-natural-speed conversation.') },
  2: { seal: '二', title: b('Làm việc', 'At work'), blurb: b('Văn bản công việc và báo chí.', 'Business texts and newspapers.'), goal: b('Làm việc bằng tiếng Nhật và đọc báo.', 'Work in Japanese and read the news.') },
  1: { seal: '一', title: b('Bậc thầy', 'Mastery'), blurb: b('Đọc sâu, sắc thái và văn phong trang trọng.', 'Deep reading, nuance and formal register.'), goal: b('Hiểu văn bản phức tạp, trừu tượng.', 'Understand complex, abstract writing.') },
};

type RawTopic = (typeof EAST_ASIAN_VOCAB_BOOKS)[number]['topics'][number];

function buildLevels(bookSlug: string, lang: EaLang, prefix: string, ids: number[], meta: Record<number, { seal: string; title: Bi; blurb: Bi; goal: Bi }>, labelOf: (n: number) => string, books: (n: number) => EaBook[]): EaLevel[] {
  const book = EAST_ASIAN_VOCAB_BOOKS.find((x) => x.slug === bookSlug);
  if (!book) return [];
  return ids.map((n) => {
    const label = labelOf(n);
    const key = label.startsWith(prefix) ? label : `${prefix} ${label}`;
    const topics: RawTopic[] = book.topics.filter((t) => t.name.startsWith(`${key} · `));
    const parts: EaPart[] = topics.map((t, ti) => {
      const theme = t.name.split(' · ').slice(1).join(' · ');
      const themeVi = t.nameVi.split(' · ').slice(1).join(' · ');
      const nodes: EaNode[] = t.lessons.map((l, li) => ({
        id: `ea-${lang}-${n}-${ti + 1}-${li + 1}`,
        slug: l.slug,
        title: b(`Buổi ${String(li + 1).padStart(2, '0')}`, `Lesson ${String(li + 1).padStart(2, '0')}`),
        words: l.words.length,
        minutes: Math.max(5, Math.round(l.words.length * 0.5)),
      }));
      return {
        id: `ea-${lang}-${n}-p${ti + 1}`,
        title: b(themeVi, theme),
        blurb: THEME_BLURB[theme] ?? b('', ''),
        nodes,
        words: nodes.reduce((s, x) => s + x.words, 0),
      };
    });
    const m = meta[n]!;
    return { id: `ea-${lang}-${n}`, lang, label, seal: m.seal, title: m.title, blurb: m.blurb, goal: m.goal, parts, words: parts.reduce((s, p) => s + p.words, 0), books: books(n) };
  });
}

const HSK_BOOKS = (n: number): EaBook[] => [{ slug: 'book-hsk-3-0', title: b('HSK 3.0 · bản đầy đủ', 'HSK 3.0 · full list'), blurb: b(`Danh sách chuẩn mới, có phần HSK ${Math.min(n, 6)}.`, 'The newer standard list.') }];

const IRODORI: Record<number, EaBook[]> = {
  5: [
    { slug: 'book-irodori-starter', title: b('Irodori · Sơ cấp', 'Irodori · Starter'), blurb: b('Hội thoại đời sống, có tranh minh họa.', 'Everyday dialogues.') },
    { slug: 'book-irodori-elementary-1', title: b('Irodori · Sơ cấp 1', 'Irodori · Elementary 1'), blurb: b('Mở rộng mẫu câu thường dùng.', 'More common patterns.') },
  ],
  4: [{ slug: 'book-irodori-elementary-2', title: b('Irodori · Sơ cấp 2', 'Irodori · Elementary 2'), blurb: b('Nhờ vả, dự định, kinh nghiệm.', 'Requests, plans, experience.') }],
  3: [{ slug: 'book-irodori-pre-intermediate', title: b('Irodori · Tiền trung cấp', 'Irodori · Pre-intermediate'), blurb: b('Tình huống làm việc và du lịch.', 'Work and travel situations.') }],
  2: [],
  1: [],
};

export const ZH_LEVELS: readonly EaLevel[] = buildLevels('book-hsk-2-0-community', 'zh', 'HSK', [1, 2, 3, 4, 5, 6], ZH_META, (n) => `HSK ${n}`, HSK_BOOKS);
export const JA_LEVELS: readonly EaLevel[] = buildLevels('book-jlpt-open-vocabulary', 'ja', 'JLPT', [5, 4, 3, 2, 1], JA_META, (n) => `N${n}`, (n) => IRODORI[n] ?? []);

export function eaLevels(lang: EaLang): readonly EaLevel[] {
  return lang === 'zh' ? ZH_LEVELS : JA_LEVELS;
}

export function eaNodesOf(level: EaLevel): EaNode[] {
  return level.parts.flatMap((p) => p.nodes);
}

export function eaLevelById(id: string | null | undefined): EaLevel | undefined {
  if (!id) return undefined;
  return [...ZH_LEVELS, ...JA_LEVELS].find((l) => l.id === id);
}

export function eaNodeHref(node: EaNode): string {
  return `/vocabulary/topic/${encodeURIComponent(node.slug)}`;
}
