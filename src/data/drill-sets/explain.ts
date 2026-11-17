import e0 from './explain/listening-form-completion.json';
import e1 from './explain/listening-map-labelling.json';
import e2 from './explain/listening-matching.json';
import e3 from './explain/listening-mcq.json';
import e4 from './explain/listening-sentence-completion.json';
import e5 from './explain/listening-short-answer.json';
import e6 from './explain/listening-table-completion.json';
import e7 from './explain/reading-matching-endings.json';
import e8 from './explain/reading-matching-features.json';
import e9 from './explain/reading-matching-headings.json';
import e10 from './explain/reading-matching-info.json';
import e11 from './explain/reading-multiple-choice.json';
import e12 from './explain/reading-sentence-completion.json';
import e13 from './explain/reading-short-answer.json';
import e14 from './explain/reading-summary-completion.json';
import e15 from './explain/reading-table-flow-completion.json';
import e16 from './explain/reading-tfng.json';
import e17 from './explain/reading-ynng.json';

/** Lời giải 3 bước của một câu (kiểu "Giải thích đáp án"): hiểu câu hỏi, keyword được paraphrase, so sánh và đối chiếu. */
export type ExplainEntry = {
  /** Bước 1 · Hiểu câu hỏi. */
  u: string;
  /** Bước 2 · Cặp keyword: cụm trong câu hỏi ↔ cụm trong bài (nguyên văn) + ghi chú quan hệ. */
  k: Array<{ q: string; p: string; n: string }>;
  /** Bước 3 · So sánh và đối chiếu, kết luận và bẫy. */
  c: string;
};

type ExplainFile = Record<string, Array<ExplainEntry | null>>;

/** Sinh bằng `node scripts/ielts/gen-drill-explain.mjs`; câu nào chưa có lời giải 3 bước thì trả null (giao diện dùng lời giải ngắn `why`). */
const BY_TYPE: Record<string, ExplainFile> = {
  'listening-form-completion': e0 as ExplainFile,
  'listening-map-labelling': e1 as ExplainFile,
  'listening-matching': e2 as ExplainFile,
  'listening-mcq': e3 as ExplainFile,
  'listening-sentence-completion': e4 as ExplainFile,
  'listening-short-answer': e5 as ExplainFile,
  'listening-table-completion': e6 as ExplainFile,
  'reading-matching-endings': e7 as ExplainFile,
  'reading-matching-features': e8 as ExplainFile,
  'reading-matching-headings': e9 as ExplainFile,
  'reading-matching-info': e10 as ExplainFile,
  'reading-multiple-choice': e11 as ExplainFile,
  'reading-sentence-completion': e12 as ExplainFile,
  'reading-short-answer': e13 as ExplainFile,
  'reading-summary-completion': e14 as ExplainFile,
  'reading-table-flow-completion': e15 as ExplainFile,
  'reading-tfng': e16 as ExplainFile,
  'reading-ynng': e17 as ExplainFile,
};

export function getExplain(typeId: string, setId: string, questionIndex: number): ExplainEntry | null {
  const num = setId.slice(typeId.length + 1);
  return BY_TYPE[typeId]?.[num]?.[questionIndex] ?? null;
}

export function explainCount(typeId: string): number {
  const f = BY_TYPE[typeId] ?? {};
  return Object.values(f).reduce((n, arr) => n + arr.filter(Boolean).length, 0);
}
