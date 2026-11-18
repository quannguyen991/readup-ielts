import type { DrillMap, DrillSet, DrillSetQuestion } from '@/data/drill-sets';
import { optionsOf } from '@/data/drill-sets';
import { getExplain, type ExplainEntry } from '@/data/drill-sets/explain';
import { IELTS_QUESTION_TYPES } from '@/data/ielts-question-types';

/**
 * Mô hình phòng thi IELTS trên máy: một đề gồm các PHẦN (Part), mỗi phần có bài đọc hoặc bài nghe và các NHÓM câu hỏi
 * (Questions 1–6, Questions 7–13…), mỗi nhóm có chỉ dẫn đúng kiểu đề thật. Hàm thuần, dựng từ DrillSet.
 */

export type ExamSkill = 'reading' | 'listening';

/** Cách trả lời một câu: chọn một (radio), chọn trong danh sách (select), điền vào chỗ trống trong câu (gap), gõ câu trả lời (answer). */
export type ExamItemKind = 'radio' | 'select' | 'gap' | 'answer';

export type ExamItem = {
  /** Số câu trong cả đề (1…40). */
  n: number;
  typeId: string;
  kind: ExamItemKind;
  prompt: string;
  options?: string[];
  answer: string;
  why: string;
  quote?: string;
  /** Lời giải 3 bước, nếu đã có. */
  ex?: ExplainEntry | null;
};

export type ExamGroup = {
  typeId: string;
  from: number;
  to: number;
  /** "Questions 1–6". */
  heading: string;
  /** Các dòng chỉ dẫn, dòng đầu in đậm. */
  instruction: string[];
  /** Giới hạn từ của dạng điền ("NO MORE THAN THREE WORDS"). */
  wordLimit?: string;
  /** Giải nghĩa nhãn (TRUE if the statement agrees…). */
  legend?: string[];
  /** Hộp danh sách dùng chung cho cả nhóm (List of Headings, tên các nhà nghiên cứu…). */
  optionsBox?: { title: string; items: string[] };
  map?: DrillMap;
  items: ExamItem[];
};

export type ExamParagraph = { label: string | null; text: string };

export type ExamPart = {
  key: string;
  /** "Part 1". */
  label: string;
  /** "Read the text and answer questions 1–10." */
  subtitle: string;
  passageTitle?: string;
  paragraphs?: ExamParagraph[];
  /** Kịch bản "Tên: lời thoại" cho bài nghe. */
  script?: string;
  groups: ExamGroup[];
  from: number;
  to: number;
};

export const rangeLabel = (a: number, b: number) => (a === b ? `Question ${a}` : `Questions ${a}–${b}`);

const QUOTE_FIX = /^["“]|["”]$/g;

/** Tách bài đọc thành đoạn; đoạn bắt đầu bằng "A." hoặc "A " được gắn nhãn chữ cái. */
export function splitParagraphs(text: string): ExamParagraph[] {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = /^([A-H])\.\s+([\s\S]+)$/.exec(p);
      return m ? { label: m[1]!, text: m[2]! } : { label: null, text: p };
    });
}

const THREE = 'NO MORE THAN THREE WORDS';
const THREE_NUM = 'NO MORE THAN THREE WORDS AND/OR A NUMBER';

type InstrCtx = { a: number; b: number; skill: ExamSkill; setOptions?: string[] };

/** Chỉ dẫn từng dạng, theo cách viết của đề thật. */
function instructionFor(typeId: string, c: InstrCtx): Pick<ExamGroup, 'instruction' | 'wordLimit' | 'legend'> {
  const rng = `${c.a}–${c.b}`;
  const text = c.skill === 'reading' ? 'the text' : 'the recording';
  switch (typeId) {
    case 'reading-tfng':
      return {
        instruction: [`Do the following statements agree with the information given in the text?`, `In boxes ${rng} on your answer sheet, choose`],
        legend: ['TRUE — if the statement agrees with the information', 'FALSE — if the statement contradicts the information', 'NOT GIVEN — if there is no information on this'],
      };
    case 'reading-ynng':
      return {
        instruction: [`Do the following statements agree with the claims of the writer in the text?`, `In boxes ${rng} on your answer sheet, choose`],
        legend: ['YES — if the statement agrees with the claims of the writer', 'NO — if the statement contradicts the claims of the writer', 'NOT GIVEN — if it is impossible to say what the writer thinks about this'],
      };
    case 'reading-matching-headings':
      return { instruction: ['Choose the correct heading for each paragraph from the list of headings below.', `Write the correct heading for questions ${rng}.`] };
    case 'reading-matching-info':
      return { instruction: [`The text has paragraphs lettered A–F.`, 'Which paragraph contains the following information?', `Choose the correct letter for questions ${rng}. You may use any letter more than once.`] };
    case 'reading-matching-features':
      return { instruction: ['Look at the following statements and the list below.', `Match each statement with the correct person or option from the list for questions ${rng}.`, 'You may use any option more than once.'] };
    case 'reading-matching-endings':
      return { instruction: [`Complete each sentence with the correct ending.`, `Choose the correct ending for questions ${rng} from the options given. Each ending can be used only once in the real test.`] };
    case 'reading-multiple-choice':
    case 'listening-mcq':
      return { instruction: ['Choose the correct letter, A, B, C or D.', `Write your answers for questions ${rng}.`] };
    case 'reading-sentence-completion':
    case 'listening-sentence-completion':
      return { instruction: [`Complete the sentences below.`, `Choose ${c.skill === 'reading' ? THREE : THREE_NUM} from ${text} for each answer.`], wordLimit: c.skill === 'reading' ? THREE : THREE_NUM };
    case 'reading-summary-completion':
      return { instruction: ['Complete the summary below.', `Choose ${THREE} from the text for each answer.`], wordLimit: THREE };
    case 'reading-table-flow-completion':
    case 'listening-table-completion':
      return { instruction: ['Complete the notes / table / flow-chart below.', `Choose ${c.skill === 'reading' ? THREE : THREE_NUM} from ${text} for each answer.`], wordLimit: c.skill === 'reading' ? THREE : THREE_NUM };
    case 'reading-short-answer':
    case 'listening-short-answer':
      return { instruction: ['Answer the questions below.', `Choose ${THREE_NUM} from ${text} for each answer.`], wordLimit: THREE_NUM };
    case 'listening-form-completion':
      return { instruction: ['Complete the form / notes below.', `Write ${THREE_NUM} for each answer.`], wordLimit: THREE_NUM };
    case 'listening-map-labelling':
      return { instruction: ['Label the map below.', `Write the correct letter, A–F, next to questions ${rng}.`] };
    case 'listening-matching':
      return { instruction: ['Choose the correct answer for each question from the options given.', `Write the correct option for questions ${rng}.`] };
    default:
      return { instruction: [`Answer questions ${rng}.`] };
  }
}

/** Danh sách "hộp dùng chung" của nhóm, nếu dạng có. */
function boxFor(typeId: string, set: DrillSet): ExamGroup['optionsBox'] | undefined {
  if (typeId === 'reading-matching-features' && set.options) return { title: 'List of Options', items: set.options };
  if (typeId === 'reading-matching-info' && set.options) return { title: 'Paragraphs', items: set.options };
  return undefined;
}

function kindOf(typeId: string, q: DrillSetQuestion, opts: string[] | undefined): ExamItemKind {
  if (typeId === 'reading-tfng' || typeId === 'reading-ynng') return 'radio';
  if (opts) {
    if (typeId === 'reading-multiple-choice' || typeId === 'listening-mcq' || typeId === 'listening-matching') return 'radio';
    return 'select';
  }
  return q.prompt.includes('____') ? 'gap' : 'answer';
}

/** Chữ của câu hỏi hiện trên màn: bỏ phần "(Paragraph 3)" thừa của dạng nối tiêu đề. */
function promptText(typeId: string, q: DrillSetQuestion): string {
  if (typeId === 'reading-matching-headings') {
    const m = /\(Paragraph (\d+)\)/.exec(q.prompt);
    return m ? `Paragraph ${m[1]}` : q.prompt;
  }
  return q.prompt.replace(QUOTE_FIX, '');
}

export function toItems(typeId: string, set: DrillSet, qs: DrillSetQuestion[], startN: number): ExamItem[] {
  return qs.map((q, i) => {
    const ex = q.ex !== undefined ? q.ex : getExplain(typeId, set.id, set.questions.indexOf(q));
    const opts = optionsOf(typeId, set, q);
    return {
      n: startN + i,
      typeId,
      kind: kindOf(typeId, q, opts),
      prompt: promptText(typeId, q),
      options: opts,
      answer: q.answer,
      why: q.why,
      quote: q.quote,
      ex,
    };
  });
}

function makeGroup(typeId: string, skill: ExamSkill, set: DrillSet, qs: DrillSetQuestion[], startN: number, map?: DrillMap): ExamGroup {
  const a = startN;
  const b = startN + qs.length - 1;
  const ins = instructionFor(typeId, { a, b, skill, setOptions: set.options });
  return { typeId, from: a, to: b, heading: rangeLabel(a, b), ...ins, optionsBox: boxFor(typeId, set), map, items: toItems(typeId, set, qs, startN) };
}

/** Một set luyện theo dạng thành MỘT phần: các câu nhóm lại theo bản đồ (map labelling) hoặc thành một nhóm duy nhất. */
export function partFromSet(typeId: string, set: DrillSet, skill: ExamSkill, startN = 1, label = 'Part 1'): ExamPart {
  const qs = set.questions;
  const groups: ExamGroup[] = [];
  if (typeId === 'listening-map-labelling' && set.maps?.length) {
    let n = startN;
    set.maps.forEach((map, mi) => {
      const sub = qs.filter((q) => (q.mapIndex ?? 0) === mi);
      if (sub.length) {
        groups.push(makeGroup(typeId, skill, set, sub, n, map));
        n += sub.length;
      }
    });
  } else {
    groups.push(makeGroup(typeId, skill, set, qs, startN));
  }
  const to = startN + qs.length - 1;
  const base: ExamPart = {
    key: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    subtitle: skill === 'reading' ? `Read the text and answer questions ${startN}–${to}.` : `Listen and answer questions ${startN}–${to}.`,
    groups,
    from: startN,
    to,
  };
  if (skill === 'listening') return { ...base, script: set.context };
  if (typeId === 'reading-matching-headings') {
    return { ...base, passageTitle: set.title, paragraphs: qs.map((q, i) => ({ label: `Paragraph ${i + 1}`, text: q.context ?? '' })) };
  }
  return { ...base, passageTitle: set.title, paragraphs: splitParagraphs(set.context ?? '') };
}

/** Bài tổng hợp (nhiều phần, mỗi phần một dạng) thành các phần liên tiếp có số câu nối nhau. */
export function partsFromMixed(skill: ExamSkill, test: DrillSet): ExamPart[] {
  const byPart = new Map<string, DrillSetQuestion[]>();
  for (const q of test.questions) {
    const k = q.part ?? 'Part 1';
    byPart.set(k, [...(byPart.get(k) ?? []), q]);
  }
  const parts: ExamPart[] = [];
  let n = 1;
  let p = 1;
  for (const [, qs] of byPart) {
    const typeId = qs[0]!.typeId!;
    const first = qs[0]!;
    // Mỗi phần dựng như một set nhỏ có bài đọc/kịch bản của chính nó.
    const sub: DrillSet = {
      id: `${test.id}-p${p}`,
      title: IELTS_QUESTION_TYPES.find((t) => t.id === typeId)?.titleEn ?? typeId,
      topic: '',
      context: skill === 'reading' ? first.passage : first.script,
      options: undefined,
      questions: qs,
    };
    // Phương án chung của set (nối đối tượng/đoạn văn) đã được chép vào từng câu: gom lại thành hộp chung.
    if (typeId === 'reading-matching-features' || typeId === 'reading-matching-info') sub.options = first.options;
    const part = partFromSet(typeId, sub, skill, n, `Part ${p}`);
    // Phần của bài tổng hợp lấy tiêu đề bài đọc từ dạng, và đoạn văn bài đọc riêng của phần.
    parts.push({ ...part, passageTitle: part.passageTitle ?? sub.title });
    n += qs.length;
    p += 1;
  }
  return parts;
}

export function totalQuestions(parts: ExamPart[]): number {
  return parts.reduce((s, p) => s + (p.to - p.from + 1), 0);
}

export function allItems(parts: ExamPart[]): ExamItem[] {
  return parts.flatMap((p) => p.groups.flatMap((g) => g.items));
}
