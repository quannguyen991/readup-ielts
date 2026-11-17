import SEED from './seed/essays/index.json';
import READING_A from './seed/essays/reading-a.json';
import READING_B from './seed/essays/reading-b.json';
import READING_C from './seed/essays/reading-c.json';
import READING_D from './seed/essays/reading-d.json';

/**
 * BÀI ESSAY DÀI để dịch từng câu (Việt → Anh): 4–6 đoạn, 24–32 câu, mỗi câu tiếng Việt có
 * một bản dịch mẫu một–một. Soạn một lần (không gọi AI lúc chạy); người học dịch lần lượt
 * từng câu, câu đang dịch được tô sáng giữa cả đoạn để giữ mạch văn.
 */

export type EssayLevel = 'B1' | 'B2' | 'C1';

export type EssaySentence = { vi: string; en: string; paragraph: number };

export type Essay = {
  id: string;
  title: string;
  titleEn: string;
  level: EssayLevel;
  topic: string;
  blurb: string;
  kind: 'story' | 'essay' | 'reading';
  /** Số câu của từng đoạn, theo thứ tự. */
  paragraphSizes: number[];
  sentences: EssaySentence[];
};

type Seed = {
  id: string;
  title: string;
  titleEn: string;
  level: EssayLevel;
  topic: string;
  blurb: string;
  kind: 'story' | 'essay' | 'reading';
  paragraphs: { vi: string; en: string }[][];
};

/** Passage IELTS Reading (Cambridge) dùng làm bài dịch; có thể thêm id vào đây để tạm ẩn một passage. */
const SKIP_READING = new Set<string>();
const READING = [...(READING_A as Seed[]), ...(READING_B as Seed[]), ...(READING_C as Seed[]), ...(READING_D as Seed[])].filter((e) => !SKIP_READING.has(e.id));

/** "rd-cam15-t1-p2" → "Cambridge IELTS 15 · Test 1 · Passage 2"; bài khác thì không có nguồn. */
export function essaySource(id: string): string | null {
  const m = /^rd-cam(\d+)-t(\d+)-p(\d+)$/.exec(id);
  return m ? `Cambridge IELTS ${m[1]} · Test ${m[2]} · Passage ${m[3]}` : null;
}

export const ESSAYS: Essay[] = [...(SEED as Seed[]), ...READING].map((e) => ({
  id: e.id,
  title: e.title,
  titleEn: e.titleEn,
  level: e.level,
  topic: e.topic,
  blurb: e.blurb,
  kind: e.kind,
  paragraphSizes: e.paragraphs.map((p) => p.length),
  sentences: e.paragraphs.flatMap((p, pi) => p.map((s) => ({ vi: s.vi, en: s.en, paragraph: pi }))),
}));

export function getEssay(id: string): Essay | undefined {
  return ESSAYS.find((e) => e.id === id);
}

/** Mã câu dùng để ghi tiến độ: `es-01:7`. */
export const essayItemId = (essayId: string, index: number): string => `${essayId}:${index}`;
