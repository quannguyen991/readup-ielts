/**
 * Học tiếng Trung: bài NGỮ PHÁP và bài HỘI THOẠI theo cấp HSK (1–6).
 * Nội dung do Band 9 tự biên soạn; khung điểm ngữ pháp theo đại cương HSK của CLEC/CTI,
 * chủ đề hội thoại theo chủ đề chung của các giáo trình (không chép nội dung sách nào).
 */
export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;
export const HSK_LEVELS: readonly HskLevel[] = [1, 2, 3, 4, 5, 6];

/** Một câu tiếng Trung: chữ Hán, pinyin có dấu, nghĩa tiếng Việt. */
export type ZhLine = {
  zh: string;
  py: string;
  vi: string;
  /** Đoạn trong `zh` cần tô nổi (khớp đúng một chuỗi con). */
  mark?: string;
};

export type ZhMistake = { wrong: string; right: string; why: string };

export type ZhGrammarStep = {
  label: string;
  title: string;
  body: string;
  formula?: string;
  bullets?: string[];
  examples?: ZhLine[];
  mistakes?: ZhMistake[];
};

export type ZhQuizItem = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export type ZhGrammarLesson = {
  id: string;
  level: HskLevel;
  order: number;
  /** Tên điểm ngữ pháp bằng tiếng Việt, ví dụ "Câu chữ 把". */
  title: string;
  /** Tên bằng chữ Hán, ví dụ "把字句". */
  titleZh: string;
  summary: string;
  minutes: number;
  steps: ZhGrammarStep[];
  quiz: ZhQuizItem[];
};

export type ZhDialogueLine = ZhLine & { who: string };

export type ZhDialogue = {
  id: string;
  level: HskLevel;
  order: number;
  title: string;
  titleZh: string;
  /** Chủ đề chung, ví dụ "Mua sắm". */
  topic: string;
  /** Bối cảnh một câu bằng tiếng Việt. */
  scene: string;
  lines: ZhDialogueLine[];
  keyWords: { zh: string; py: string; vi: string }[];
  /** Điểm ngữ pháp xuất hiện (id bài ngữ pháp, nếu có). */
  grammarIds?: string[];
  minutes: number;
  quiz: ZhQuizItem[];
};
