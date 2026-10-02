import { splitSentences } from '@/services/ingest/readability';
import { overlapRatio } from '@/services/proofloop/probe-validity';
import type { QuestionType } from '@/types/database';
import { countWords } from './grade';
import { FORM_TYPES, LIST_MATCH_TYPES, specOf } from './ielts-types';
import type { GeneratedQuestion, QuestionForm } from './types';
import { verifyQuestion } from './verify';

/**
 * Dựng một KHỐI câu hỏi có cấu trúc từ JSON do model trả về, và kiểm nó.
 *
 * Hàm thuần, không gọi mạng — nên test được hết bằng ca cụ thể. Đây là chỗ giữ
 * chuẩn cho các dạng mà bộ sinh bằng luật không dựng nổi (nối tiêu đề, nối đặc
 * điểm, nối vế câu, chọn nhiều đáp án, bảng / sơ đồ / ghi chú):
 *
 *   - đáp án điền từ phải là chữ NGUYÊN VĂN trong bài, không quá giới hạn số từ;
 *   - đáp án chọn / nối phải là một phương án có thật, không trùng giữa các câu
 *     khi dạng đó đòi vậy (mỗi tiêu đề dùng một lần);
 *   - số tiêu đề / vế câu phải NHIỀU HƠN số câu;
 *   - ô trống `{{k}}` của khuôn phải đủ, không thừa, không trùng;
 *   - câu dẫn chứng phải có thật trong bài, và chỉ số đoạn lấy từ chỗ tìm được.
 *
 * Nhóm (Choose TWO, bảng, sơ đồ…) là TOÀN BỘ HOẶC KHÔNG: một chỗ trống hỏng làm cả
 * khuôn vô nghĩa, nên không giữ nửa vời. Dạng nối thì loại từng câu hỏng.
 */

export type RawQuestion = {
  prompt?: unknown;
  answer?: unknown;
  accept?: unknown;
  evidence_text?: unknown;
  explanation?: unknown;
  lesson_tip?: unknown;
};

export type RawBlock = {
  instruction?: unknown;
  word_limit?: unknown;
  options?: unknown;
  form?: unknown;
  prompt?: unknown;
  answers?: unknown;
  evidence_text?: unknown;
  explanation?: unknown;
  lesson_tip?: unknown;
  questions?: unknown;
};

export type BuildContext = {
  articleId: string;
  paragraphs: string[];
  /** Số thứ tự câu đầu của khối trong cả bộ (đếm từ 0), dùng cho id. */
  startIndex: number;
  /** Mã khối, để `groupId` không trùng giữa các khối cùng bộ. */
  blockKey: string;
};

export type BlockResult = { questions: GeneratedQuestion[]; problems: string[] };

const BLANK_TOKEN = /\{\{\s*(\d+)\s*\}\}/g;

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
}

const letterOf = (i: number) => String.fromCharCode(65 + i);

/** Tìm chỉ số đoạn chứa câu trích (nguyên văn, sau chuẩn hoá). -1 nếu không có. */
export function findParagraph(evidence: string, paragraphs: string[]): number {
  const needle = norm(evidence);
  if (needle.length < 8) return -1;
  return paragraphs.findIndex((p) => norm(p).includes(needle));
}

/**
 * Câu trong bài chứa đáp án (tách theo từ nguyên, không khớp giữa từ).
 * Dùng khi model không đưa được câu dẫn nguyên văn cho một chỗ trống.
 */
export function sentenceContaining(
  answer: string,
  paragraphs: string[],
): { text: string; paragraphIndex: number } | null {
  const a = norm(answer);
  if (!a) return null;
  const word = new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
  for (let i = 0; i < paragraphs.length; i += 1) {
    for (const s of splitSentences(paragraphs[i] as string)) {
      if (word.test(norm(s))) return { text: s, paragraphIndex: i };
    }
  }
  return null;
}

/** Phương án model trả về → phương án chuẩn (khớp không phân biệt hoa thường). */
function canonicalOption(answer: string, options: string[]): string | null {
  const a = norm(answer);
  const hit = options.find((o) => norm(o) === a);
  if (hit) return hit;
  // Cho phép đáp án là chữ cái ("C") trỏ vào danh sách.
  if (/^[A-Za-z]$/.test(answer.trim())) {
    const i = answer.trim().toUpperCase().charCodeAt(0) - 65;
    return options[i] ?? null;
  }
  return null;
}

function uniqueNorm(list: string[]): boolean {
  return new Set(list.map(norm)).size === list.length;
}

function mk(
  ctx: BuildContext,
  index: number,
  type: QuestionType,
  base: {
    prompt: string;
    options: string[] | null;
    correctAnswer: string;
    evidenceText: string;
    evidenceParagraphIndex: number;
    explanation: string;
    lessonTip: string | null;
  },
  extra: Partial<GeneratedQuestion> = {},
): GeneratedQuestion {
  return {
    id: `${ctx.articleId}-b${ctx.blockKey}-${index + 1}`,
    orderIndex: ctx.startIndex + index,
    type,
    prompt: base.prompt,
    instruction: null,
    options: base.options,
    correctAnswer: base.correctAnswer,
    evidenceText: base.evidenceText,
    evidenceParagraphIndex: base.evidenceParagraphIndex,
    explanation: base.explanation,
    lessonTip: base.lessonTip,
    ...extra,
  };
}

const FORM_KIND: Partial<Record<QuestionType, QuestionForm['kind']>> = {
  summary_completion: 'summary',
  note_completion: 'notes',
  table_completion: 'table',
  flow_chart_completion: 'flow',
  diagram_label_completion: 'diagram',
};

/** Giới hạn số từ: model khai, kẹp trong [1, 3]; mặc định 2. */
function wordLimitOf(raw: RawBlock): number {
  const n = typeof raw.word_limit === 'number' ? raw.word_limit : Number(raw.word_limit);
  if (!Number.isFinite(n)) return 2;
  return Math.min(3, Math.max(1, Math.round(n)));
}

export function buildBlock(type: QuestionType, raw: RawBlock, ctx: BuildContext): BlockResult {
  switch (type) {
    case 'matching_headings':
      return buildHeadings(raw, ctx);
    case 'matching_features':
      return buildFeatures(raw, ctx);
    case 'matching_sentence_endings':
      return buildEndings(raw, ctx);
    case 'multiple_choice_multi':
      return buildMulti(raw, ctx);
    case 'summary_completion':
    case 'note_completion':
    case 'table_completion':
    case 'flow_chart_completion':
    case 'diagram_label_completion':
      return buildForm(type, raw, ctx);
    default:
      return { questions: [], problems: [`dạng ${type} không dựng bằng khối cấu trúc`] };
  }
}

function rawQuestions(raw: RawBlock): RawQuestion[] {
  return Array.isArray(raw.questions) ? (raw.questions as RawQuestion[]).filter((q) => q && typeof q === 'object') : [];
}

/* ----------------------------------------------------------- nối tiêu đề */

function buildHeadings(raw: RawBlock, ctx: BuildContext): BlockResult {
  const problems: string[] = [];
  const options = strList(raw.options);
  const items = rawQuestions(raw);

  if (!uniqueNorm(options)) problems.push('danh sách tiêu đề có tiêu đề trùng nhau');
  if (options.length < items.length + 2) problems.push(`cần nhiều tiêu đề hơn số đoạn hỏi (có ${options.length} tiêu đề cho ${items.length} đoạn)`);

  const built: { q: GeneratedQuestion; para: number }[] = [];
  const usedAnswers = new Set<string>();
  const usedParas = new Set<number>();

  items.forEach((it) => {
    const answer = canonicalOption(str(it.answer), options);
    const evidence = str(it.evidence_text);
    const para = findParagraph(evidence, ctx.paragraphs);
    if (!answer || para === -1) return;
    if (usedAnswers.has(norm(answer)) || usedParas.has(para)) return;
    // Tiêu đề phải TÓM Ý, không chép chữ mở đầu của đoạn.
    const opening = (ctx.paragraphs[para] as string).split(/\s+/).slice(0, 14).join(' ');
    if (overlapRatio(answer, opening) > 0.7) {
      problems.push(`bỏ: tiêu đề "${answer}" chép chữ mở đầu của đoạn ${letterOf(para)}`);
      return;
    }
    usedAnswers.add(norm(answer));
    usedParas.add(para);
    built.push({
      para,
      q: mk(ctx, 0, 'matching_headings', {
        prompt: `Paragraph ${letterOf(para)}`,
        options,
        correctAnswer: answer,
        evidenceText: evidence,
        evidenceParagraphIndex: para,
        explanation: str(it.explanation),
        lessonTip: str(it.lesson_tip) || null,
      }),
    });
  });

  // Đề thật xếp theo thứ tự đoạn.
  built.sort((a, b) => a.para - b.para);
  const questions = built.map((b, i) => ({
    ...b.q,
    id: `${ctx.articleId}-b${ctx.blockKey}-${i + 1}`,
    orderIndex: ctx.startIndex + i,
  }));

  if (questions.length < 3) problems.push('không đủ 3 câu nối tiêu đề hợp lệ');
  if (options.length <= questions.length) problems.push('số tiêu đề không nhiều hơn số câu');
  return finish(questions, problems, ctx, false);
}

/* ------------------------------------------------------------ nối đặc điểm */

function buildFeatures(raw: RawBlock, ctx: BuildContext): BlockResult {
  const problems: string[] = [];
  const options = strList(raw.options);
  if (options.length < 3 || options.length > 7) problems.push('danh sách người / vật phải có 3–7 mục');
  if (!uniqueNorm(options)) problems.push('danh sách có mục trùng nhau');

  const questions: GeneratedQuestion[] = [];
  for (const it of rawQuestions(raw)) {
    const answer = canonicalOption(str(it.answer), options);
    const evidence = str(it.evidence_text);
    const para = findParagraph(evidence, ctx.paragraphs);
    const prompt = str(it.prompt);
    if (!answer || para === -1 || !prompt) continue;
    questions.push(
      mk(ctx, questions.length, 'matching_features', {
        prompt,
        options,
        correctAnswer: answer,
        evidenceText: evidence,
        evidenceParagraphIndex: para,
        explanation: str(it.explanation),
        lessonTip: str(it.lesson_tip) || null,
      }),
    );
  }
  if (questions.length < 3) problems.push('không đủ 3 câu nối đặc điểm hợp lệ');
  if (new Set(questions.map((q) => norm(q.correctAnswer))).size < 2) problems.push('mọi câu cùng một đáp án');
  return finish(questions, problems, ctx, false);
}

/* ------------------------------------------------------------ nối vế câu */

function buildEndings(raw: RawBlock, ctx: BuildContext): BlockResult {
  const problems: string[] = [];
  const options = strList(raw.options);
  const items = rawQuestions(raw);
  if (!uniqueNorm(options)) problems.push('danh sách vế sau có mục trùng nhau');
  if (options.length < items.length + 2) problems.push('cần nhiều vế sau hơn số câu');

  const questions: GeneratedQuestion[] = [];
  const used = new Set<string>();
  for (const it of items) {
    const answer = canonicalOption(str(it.answer), options);
    const evidence = str(it.evidence_text);
    const para = findParagraph(evidence, ctx.paragraphs);
    const prompt = str(it.prompt);
    if (!answer || para === -1 || prompt.split(/\s+/).length < 3) continue;
    if (used.has(norm(answer))) continue;
    used.add(norm(answer));
    questions.push(
      mk(ctx, questions.length, 'matching_sentence_endings', {
        prompt,
        options,
        correctAnswer: answer,
        evidenceText: evidence,
        evidenceParagraphIndex: para,
        explanation: str(it.explanation),
        lessonTip: str(it.lesson_tip) || null,
      }),
    );
  }
  if (questions.length < 3) problems.push('không đủ 3 câu nối vế câu hợp lệ');
  if (options.length <= questions.length) problems.push('số vế sau không nhiều hơn số câu');
  return finish(questions, problems, ctx, false);
}

/* --------------------------------------------------------- chọn nhiều đáp án */

function buildMulti(raw: RawBlock, ctx: BuildContext): BlockResult {
  const problems: string[] = [];
  const options = strList(raw.options);
  const prompt = str(raw.prompt);
  if (options.length < 5 || options.length > 7) problems.push('Choose TWO cần 5–7 phương án');
  if (!uniqueNorm(options)) problems.push('phương án trùng nhau');
  if (!prompt) problems.push('thiếu câu hỏi');

  const answersRaw = Array.isArray(raw.answers) ? raw.answers : [];
  const picked: { text: string; evidence: string }[] = [];
  for (const a of answersRaw) {
    const isObj = a && typeof a === 'object';
    const text = canonicalOption(isObj ? str((a as RawQuestion).answer) : str(a), options);
    const evidence = isObj ? str((a as RawQuestion).evidence_text) : '';
    if (text) picked.push({ text, evidence: evidence || str(raw.evidence_text) });
  }
  const distinct = new Set(picked.map((p) => norm(p.text)));
  if (distinct.size !== picked.length) problems.push('đáp án đúng trùng nhau');
  if (picked.length < 2 || picked.length > 3) problems.push('cần 2 hoặc 3 đáp án đúng');
  if (options.length > 0 && picked.length >= options.length - 1) problems.push('quá nhiều đáp án đúng so với phương án');

  // Sắp theo thứ tự phương án để câu đầu nhóm là đáp án đứng trước.
  picked.sort((a, b) => options.indexOf(a.text) - options.indexOf(b.text));
  const groupId = `${ctx.articleId}-g${ctx.blockKey}`;
  const questions: GeneratedQuestion[] = [];
  for (const p of picked) {
    let evidence = p.evidence;
    let para = evidence ? findParagraph(evidence, ctx.paragraphs) : -1;
    if (para === -1) {
      // Không có câu dẫn nguyên văn: lấy câu trong bài giống phương án nhất.
      const best = bestSentenceFor(p.text, ctx.paragraphs);
      if (best) {
        evidence = best.text;
        para = best.paragraphIndex;
      }
    }
    if (para === -1) {
      problems.push(`không tìm được câu dẫn trong bài cho "${p.text.slice(0, 40)}"`);
      continue;
    }
    questions.push(
      mk(
        ctx,
        questions.length,
        'multiple_choice_multi',
        {
          prompt,
          options,
          correctAnswer: p.text,
          evidenceText: evidence,
          evidenceParagraphIndex: para,
          explanation: str(raw.explanation),
          lessonTip: str(raw.lesson_tip) || null,
        },
        { groupId },
      ),
    );
  }
  if (questions.length !== picked.length) problems.push('mất câu dẫn của đáp án đúng');
  return finish(questions, problems, ctx, true);
}

function bestSentenceFor(text: string, paragraphs: string[]): { text: string; paragraphIndex: number } | null {
  let best: { text: string; paragraphIndex: number; score: number } | null = null;
  paragraphs.forEach((p, i) => {
    for (const s of splitSentences(p)) {
      const score = overlapRatio(text, s);
      if (score > (best?.score ?? 0.34)) best = { text: s, paragraphIndex: i, score };
    }
  });
  return best;
}

/* --------------------------------------------- bảng / sơ đồ / ghi chú / tóm tắt */

function parseForm(raw: unknown): { title: string; lines: string[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as { title?: unknown; lines?: unknown };
  const lines = strList(f.lines);
  if (lines.length === 0) return null;
  return { title: str(f.title), lines };
}

function buildForm(type: QuestionType, raw: RawBlock, ctx: BuildContext): BlockResult {
  const problems: string[] = [];
  const form = parseForm(raw.form);
  const items = rawQuestions(raw);
  const limit = wordLimitOf(raw);
  const bank = strList(raw.options);
  const kind = FORM_KIND[type] as QuestionForm['kind'];

  if (!form) return { questions: [], problems: ['thiếu khuôn (form.lines)'] };

  // Ô trống: mỗi {{k}} đúng một lần, k = 1..N.
  const found: number[] = [];
  for (const line of form.lines) for (const m of line.matchAll(BLANK_TOKEN)) found.push(Number(m[1]));
  const n = items.length;
  const wanted = Array.from({ length: n }, (_, i) => i + 1);
  if (n < 3) problems.push('cần ít nhất 3 chỗ trống');
  if (found.length !== n || !wanted.every((k) => found.filter((f) => f === k).length === 1)) {
    problems.push(`ô trống {{k}} không khớp ${n} đáp án (thấy ${found.join(',') || 'không có'})`);
  }

  if (kind === 'table') {
    const cells = form.lines.map((l) => l.split('|').map((c) => c.trim()).filter((c, i, a) => !(c === '' && (i === 0 || i === a.length - 1))));
    const width = cells[0]?.length ?? 0;
    if (form.lines.length < 3 || width < 2 || !cells.every((c) => c.length === width)) {
      problems.push('bảng phải có tiêu đề cột và các hàng cùng số ô');
    }
  } else if (kind === 'flow' && form.lines.length < 4) {
    problems.push('sơ đồ quy trình cần ít nhất 4 bước');
  } else if (kind === 'notes' && form.lines.length < 4) {
    problems.push('ghi chú cần ít nhất 4 dòng');
  }

  if (bank.length > 0) {
    if (!uniqueNorm(bank)) problems.push('bảng từ có từ trùng nhau');
    if (bank.length < n + 2) problems.push('bảng từ phải nhiều hơn số chỗ trống');
    if (bank.length > 12) problems.push('bảng từ quá dài (tối đa 12 từ)');
  }

  const groupId = `${ctx.articleId}-g${ctx.blockKey}`;
  const questions: GeneratedQuestion[] = [];
  const seenAnswers = new Set<string>();

  items.forEach((it, i) => {
    const k = i + 1;
    let answer = str(it.answer);
    if (bank.length > 0) answer = canonicalOption(answer, bank) ?? '';
    if (!answer) {
      problems.push(`chỗ trống ${k}: thiếu đáp án${bank.length ? ' hoặc đáp án ngoài bảng từ' : ''}`);
      return;
    }
    if (countWords(answer) > limit) {
      problems.push(`chỗ trống ${k}: "${answer}" dài hơn ${limit} từ`);
      return;
    }
    if (seenAnswers.has(norm(answer))) {
      problems.push(`chỗ trống ${k}: đáp án "${answer}" lặp lại`);
      return;
    }
    seenAnswers.add(norm(answer));

    let evidence = str(it.evidence_text);
    let para = evidence ? findParagraph(evidence, ctx.paragraphs) : -1;
    if (para === -1 || !norm(evidence).includes(norm(answer))) {
      // Câu dẫn của model không chứa đáp án / không nguyên văn: tự tìm câu có đáp án.
      const hit = sentenceContaining(answer, ctx.paragraphs);
      if (!hit) {
        problems.push(`chỗ trống ${k}: "${answer}" không có trong bài`);
        return;
      }
      evidence = hit.text;
      para = hit.paragraphIndex;
    }

    const context = form.lines.find((l) => new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`).test(l)) ?? '';
    const prompt = context
      .replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`), '________')
      .replace(BLANK_TOKEN, '…')
      .replace(/\|/g, ' · ')
      .replace(/^[\s·]+|[\s·]+$/g, '')
      .replace(/\s+/g, ' ');

    const accept = strList(it.accept).filter((a) => countWords(a) <= limit && passageHas(a, ctx.paragraphs));
    questions.push(
      mk(
        ctx,
        questions.length,
        type,
        {
          prompt: prompt || `________ (${k})`,
          options: bank.length > 0 ? bank : null,
          correctAnswer: answer,
          evidenceText: evidence,
          evidenceParagraphIndex: para,
          explanation: str(it.explanation),
          lessonTip: str(it.lesson_tip) || null,
        },
        {
          groupId,
          maxWords: limit,
          ...(accept.length > 0 ? { accept } : {}),
          ...(questions.length === 0
            ? { form: { kind, ...(form.title ? { title: form.title } : {}), lines: form.lines } }
            : {}),
        },
      ),
    );
  });

  if (questions.length !== n) problems.push(`chỉ dựng được ${questions.length}/${n} chỗ trống`);
  return finish(questions, problems, ctx, true);
}

function passageHas(text: string, paragraphs: string[]): boolean {
  const n = norm(text);
  return n.length > 0 && paragraphs.some((p) => norm(p).includes(n));
}

/* ------------------------------------------------------------------- chung */

/**
 * Qua `verifyQuestion` từng câu rồi chốt. `whole` = nhóm toàn-hoặc-không: một câu
 * hỏng là cả khối hỏng. Không phải nhóm thì chỉ bỏ câu hỏng.
 */
function finish(
  questions: GeneratedQuestion[],
  problems: string[],
  ctx: BuildContext,
  whole: boolean,
): BlockResult {
  const kept: GeneratedQuestion[] = [];
  for (const q of questions) {
    const verdict = verifyQuestion(q, ctx.paragraphs);
    if (verdict.ok) kept.push(q);
    else problems.push(`câu "${q.prompt.slice(0, 50)}": ${verdict.reason}`);
  }
  if (whole && kept.length !== questions.length) return { questions: [], problems };
  // Nhóm có `form` ở câu đầu: nếu câu đầu bị loại thì nhóm đã bị loại cả (whole).
  const hard = problems.filter((p) => !p.startsWith('câu "') && !p.startsWith('bỏ: '));
  if (hard.length > 0 && (whole || LIST_MATCH_TYPES.has(kept[0]?.type as QuestionType))) {
    return { questions: [], problems };
  }
  return { questions: kept.map((q, i) => ({ ...q, orderIndex: ctx.startIndex + i })), problems };
}

/** Khối này có phải nhóm một khuôn (câu cùng `groupId`) không. */
export function isGroupType(type: QuestionType): boolean {
  return FORM_TYPES.has(type) || type === 'summary_completion' || type === 'multiple_choice_multi';
}

export function minQuestionsOf(type: QuestionType): number {
  return specOf(type)?.minCount ?? 3;
}
