import type { QuestionType } from '@/types/database';
import { RULE_SUPPORTED_TYPES } from './blueprint';
import { buildRuleQuestionSet } from './build-set';
import { IELTS_TYPES_ALL, type MixBlock } from './ielts-types';
import { blocksKey } from './mix';
import type { GeneratedQuestion, QuestionSet } from './types';
import { blanksIn } from '@/components/reader/exam/form-lines';

/**
 * Tạo bộ đề theo bộ trộn dạng bài do người học chọn.
 *
 * MỖI KHỐI MỘT LƯỢT GỌI, SONG SONG. Làm vậy vì hai lẽ: (1) có tiến độ THẬT — mỗi khối
 * về là một nấc, thay vì một thanh quay không biết bao giờ xong; (2) mỗi khối hỏng
 * độc lập — một dạng khó không kéo cả đề xuống, và máy chủ còn cache chung được từng
 * khối cho người mở sau.
 *
 * KHỐI HỎNG THÌ LÙI VỀ BỘ DỰNG BẰNG LUẬT khi dạng đó luật làm được (T/F/NG, trắc
 * nghiệm, điền từ, nối đoạn…). Dạng luật không làm nổi (nối tiêu đề, bảng, sơ đồ…)
 * được báo là chưa tạo được, chứ không bịa một bản kém.
 *
 * Không rò chi tiết nhà cung cấp: lỗi từ máy chủ chỉ mang câu chung; ở đây không in
 * ra thêm gì.
 */

export type MixArticle = {
  id: string;
  title: string;
  paragraphs: string[];
  passageTier?: string | null;
  /** Bài trong kho (máy chủ tra được theo id) hay bài tự dán (phải gửi kèm toàn văn). */
  inLibrary: boolean;
};

export type MixResult = {
  set: QuestionSet | null;
  /** Dạng không dựng nổi (cả AI lẫn luật đều không ra). */
  failed: QuestionType[];
  /** Có khối nào phải lùi về bộ dựng bằng luật không. */
  usedFallback: boolean;
  /** Lời nhắn chung cho người học khi không có gì để dùng. */
  message?: string;
};

export type MixHooks = {
  /** Gọi mỗi khi một khối xong (thành công hay không). */
  onProgress?: (done: number, total: number, doneType: QuestionType) => void;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  /** Hạn chờ mỗi khối (ms). */
  timeoutMs?: number;
};

function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  return tier === 'p3' ? 3 : tier === 'p2' ? 2 : 1;
}

const STR = (v: unknown) => typeof v === 'string';

/**
 * Lọc lại đáp án của máy chủ: không tin hình dạng. Câu thiếu trường bắt buộc, dạng
 * không phải IELTS, nhóm thiếu thành viên đều bị bỏ.
 */
export function sanitizeRemote(list: unknown, expectType: QuestionType): GeneratedQuestion[] {
  if (!Array.isArray(list)) return [];
  const out: GeneratedQuestion[] = [];
  for (const raw of list) {
    const q = raw as Partial<GeneratedQuestion> | null;
    if (!q || typeof q !== 'object') continue;
    if (!STR(q.id) || !STR(q.prompt) || !STR(q.correctAnswer) || !STR(q.evidenceText)) continue;
    if (!STR(q.type) || !(IELTS_TYPES_ALL as readonly string[]).includes(q.type as string)) continue;
    // Khối đặt dạng nào thì chỉ nhận dạng ấy (cho phép lô phẳng mix dạng thì bỏ qua bước này).
    if (q.type !== expectType) continue;
    if (q.options != null && !(Array.isArray(q.options) && q.options.every(STR))) continue;
    out.push({
      id: q.id as string,
      orderIndex: 0,
      type: q.type as QuestionType,
      prompt: q.prompt as string,
      instruction: STR(q.instruction) ? (q.instruction as string) : null,
      options: (q.options as string[] | null | undefined) ?? null,
      correctAnswer: q.correctAnswer as string,
      evidenceText: q.evidenceText as string,
      evidenceParagraphIndex: Number.isInteger(q.evidenceParagraphIndex) ? (q.evidenceParagraphIndex as number) : 0,
      explanation: STR(q.explanation) ? (q.explanation as string) : '',
      lessonTip: STR(q.lessonTip) ? (q.lessonTip as string) : null,
      ...(STR(q.groupId) ? { groupId: q.groupId as string } : {}),
      ...(q.form && typeof q.form === 'object' && Array.isArray((q.form as { lines?: unknown }).lines) ? { form: q.form } : {}),
      ...(typeof q.maxWords === 'number' ? { maxWords: q.maxWords } : {}),
      ...(Array.isArray(q.accept) ? { accept: q.accept.map(String) } : {}),
    });
  }

  // Nhóm phải trọn: khuôn có n ô thì phải có đủ n câu, nếu không bỏ cả nhóm.
  const groups = new Map<string, GeneratedQuestion[]>();
  for (const q of out) if (q.groupId) groups.set(q.groupId, [...(groups.get(q.groupId) ?? []), q]);
  const bad = new Set<string>();
  for (const [gid, members] of groups) {
    const form = members.find((m) => m.form)?.form;
    if (form) {
      const blanks = blanksIn(form.lines);
      if (blanks.length !== members.length) bad.add(gid);
    } else if (!(members[0]?.type === 'multiple_choice_multi' && members.length >= 2)) {
      // Nhóm không có khuôn chỉ hợp lệ khi là Choose TWO / THREE đủ thành viên.
      bad.add(gid);
    }
  }
  return out.filter((q) => !q.groupId || !bad.has(q.groupId));
}

async function fetchBlock(
  article: MixArticle,
  block: MixBlock,
  hooks: MixHooks,
): Promise<GeneratedQuestion[]> {
  const f = hooks.fetchImpl ?? fetch;
  const timeout = AbortSignal.timeout(hooks.timeoutMs ?? 58_000);
  const signal = hooks.signal ? AbortSignal.any([hooks.signal, timeout]) : timeout;
  const res = await f('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articleId: article.id,
      blocks: [block],
      ...(article.inLibrary ? {} : { passage: { title: article.title, paragraphs: article.paragraphs } }),
    }),
    signal,
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const body = (await res.json()) as { questions?: unknown };
  const list = sanitizeRemote(body.questions, block.type);
  if (list.length === 0) throw new Error('empty');
  return list;
}

export async function generateMixSet(
  article: MixArticle,
  blocks: MixBlock[],
  hooks: MixHooks = {},
): Promise<MixResult> {
  let done = 0;
  let usedFallback = false;
  let remoteBlocks = 0;

  const results = await Promise.all(
    blocks.map(async (block): Promise<GeneratedQuestion[]> => {
      let questions: GeneratedQuestion[] = [];
      try {
        questions = await fetchBlock(article, block, hooks);
        remoteBlocks += 1;
      } catch {
        // Luật làm được dạng này thì lùi về; không thì để trống và báo thiếu.
        if ((RULE_SUPPORTED_TYPES as readonly string[]).includes(block.type)) {
          try {
            questions = buildRuleQuestionSet(
              { id: article.id, title: article.title, paragraphs: article.paragraphs },
              { position: positionOf(article.passageTier), blocks: [block] },
            ).questions;
            if (questions.length > 0) usedFallback = true;
          } catch {
            questions = [];
          }
        }
      }
      done += 1;
      hooks.onProgress?.(done, blocks.length, block.type);
      return questions;
    }),
  );

  const failed: QuestionType[] = [];
  const merged: GeneratedQuestion[] = [];
  results.forEach((qs, i) => {
    const block = blocks[i] as MixBlock;
    if (qs.length === 0) {
      failed.push(block.type);
      return;
    }
    for (const q of qs) {
      merged.push({
        ...q,
        // Mỗi khối là một lượt gọi riêng nên id / nhóm có thể trùng giữa các khối.
        id: `${q.id}@${i}`,
        ...(q.groupId ? { groupId: `${q.groupId}@${i}` } : {}),
        orderIndex: merged.length,
      });
    }
  });

  if (merged.length === 0) {
    return {
      set: null,
      failed,
      usedFallback,
      message: 'Chưa tạo được đề lúc này. Thử lại sau ít phút.',
    };
  }

  const anyRemote = remoteBlocks > 0;
  return {
    set: {
      articleId: article.id,
      title: `Bộ đề: ${article.title}`,
      generatedBy: anyRemote ? 'ai' : 'offline',
      model: anyRemote ? 'mix' : 'rule-engine',
      createdAt: new Date().toISOString(),
      requestedTypes: blocksKey(blocks),
      questions: merged,
      ...(failed.length > 0 ? { failedTypes: failed } : {}),
    },
    failed,
    usedFallback,
  };
}
