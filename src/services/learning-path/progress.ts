/**
 * LỘ TRÌNH HỌC — bài nào đã xong, bài nào nên học tiếp. Hàm thuần, test được.
 *
 * Luật "xong" của bộ từ, chương SAT Math và bộ đề Toán dùng CHUNG với bài giao
 * của Lớp học (`services/classes/assignments.ts`) — một bài không thể "xong" ở
 * chỗ này mà "chưa làm" ở chỗ kia. Các loại còn lại đọc thẳng từ kho học trên
 * máy người học:
 *
 *   read        — có một lượt làm bài đọc đó (study.sessions.articleId).
 *                 Đã mở đọc (study.progress > 0) thì là đang làm.
 *   dictation   — có một buổi chép chính tả gắn đúng bộ đề (sentence.sessions.setId).
 *   translate   — có một buổi dịch câu gắn đúng bộ (sentence.sessions.setId).
 *   write       — có một bài nộp cho đúng đề (writing.submissions.promptId).
 *   speak       — có một lượt trả lời (không bỏ qua) câu hỏi THUỘC đúng chủ đề
 *                 và đúng phần thi: mã câu Part 1 là `<chủ đề>-n`, Part 2 là mã
 *                 thẻ đề, Part 3 là `<thẻ đề>-p3-n` (`services/speaking/bank.ts`).
 *   math-lesson / rw-lesson — người học bấm "đã học xong" ở cuối bài lý thuyết
 *                 (useLessonStore, khoá `math:` / `verbal:` + kỹ năng).
 *   rw-set      — đã trả lời ≥ 80% số câu của bộ (sat_rw.attempts theo mã câu).
 *   sat-vocab   — có một mức quiz đạt ≥ 80% (sat_quiz.best).
 *
 * Bài đọc song ngữ (`bilingual`) KHÔNG để lại dấu vết nào trong kho học, nên
 * người học tự đánh dấu — và giao diện ghi rõ là tự đánh dấu. Không bao giờ
 * suy đoán "chắc là xong rồi".
 */
import {
  assignmentStatus,
  CHAPTER_PASS_RATIO,
  type Resolvers,
  type StudentData,
} from '@/services/classes/assignments';
import type { PathLevel, PathNode, PathTarget, PathTargetKind } from '@/data/learning-path/types';

export type NodeState = 'done' | 'started' | 'todo';

export type NodeStatus = {
  state: NodeState;
  /** true = app tự đo; false = chỉ người học tự đánh dấu được. */
  auto: boolean;
  /** Đã xong vì người học tự đánh dấu (chỉ có ở loại không đo được). */
  manual?: boolean;
  have?: number;
  need?: number;
};

/** Loại bài app không đo được — phải tự đánh dấu. */
export const MANUAL_KINDS: readonly PathTargetKind[] = ['bilingual'];

export function isAutoKind(kind: PathTargetKind): boolean {
  return !MANUAL_KINDS.includes(kind);
}

/** Tỉ lệ câu đã trả lời để coi một bộ câu SAT Verbal là xong. */
export const RW_SET_DONE_RATIO = 0.8;
/** Ngưỡng một mức quiz từ vựng SAT được coi là qua — cùng ngưỡng "qua mức" của chương SAT Math. */
export const SAT_QUIZ_PASS_RATIO = CHAPTER_PASS_RATIO;

/** Dữ liệu học trên máy người học mà lộ trình cần đọc. Thiếu nhánh nào thì coi như chưa làm gì ở đó. */
export type PathData = StudentData & {
  study?: StudentData['study'] & {
    sessions?: { articleId?: string }[] | null;
    progress?: Record<string, { percentCompleted?: number } | undefined> | null;
  };
  sentence?: { sessions?: { mode?: string; setId?: string }[] | null } | null;
  writing?: { submissions?: { promptId?: string }[] | null } | null;
  /** useLessonStore.done — khoá `math:<skill>` / `verbal:<skill>`. */
  lessons?: Record<string, string> | null;
  /** useSatRwStore.attempts — khoá theo mã câu. */
  satRw?: Record<string, unknown> | null;
  /** useSatQuizStore.best — khoá `<slug>:<mức>`. */
  satQuiz?: Record<string, { score: number; total: number } | undefined> | null;
  /** Dấu tự đánh dấu của người học, theo mã bài. */
  manual?: Record<string, true> | null;
};

export type PathResolvers = Resolvers & {
  /** Bài đọc theo slug → mã bài trong kho. */
  articleId: (slug: string) => string | undefined;
  /** Mã các câu của một bộ SAT Verbal; undefined nếu bộ không còn. */
  rwSetQuestions: (setId: string) => readonly string[] | undefined;
};

const EPOCH = '1970-01-01T00:00:00.000Z';

/** Câu trả lời Speaking này có thuộc đúng chủ đề + phần thi của bài không. */
export function speakingAnswerMatches(target: Extract<PathTarget, { kind: 'speak' }>, questionId: string, part?: number): boolean {
  if (target.part === 'p1') return questionId.startsWith(`${target.topic}-`) && (part === undefined || part === 1);
  if (target.part === 'p2') return questionId === target.topic;
  return questionId.startsWith(`${target.topic}-p3-`);
}

/** Trạng thái một bài với dữ liệu học hiện có. */
export function nodeStatus(node: PathNode, d: PathData, r: PathResolvers): NodeStatus {
  const t = node.target;
  const auto = isAutoKind(t.kind);
  if (!auto) return d.manual?.[node.id] ? { state: 'done', auto, manual: true } : { state: 'todo', auto };

  const fromAssignment = (kind: 'vocab_deck' | 'sat_chapter' | 'math_set', ref: string): NodeStatus => {
    const s = assignmentStatus({ kind, ref, created_at: EPOCH }, { ...d, synced: true }, r);
    return { state: s.state === 'done' ? 'done' : s.state === 'started' ? 'started' : 'todo', auto, have: s.have, need: s.need };
  };

  switch (t.kind) {
    case 'vocab':
      return fromAssignment('vocab_deck', t.slug);
    case 'sat-chapter':
      return fromAssignment('sat_chapter', t.id);
    case 'math-set':
      return fromAssignment('math_set', t.set);
    case 'read': {
      const id = r.articleId(t.slug);
      if (!id) return { state: 'todo', auto };
      if ((d.study?.sessions ?? []).some((s) => s?.articleId === id)) return { state: 'done', auto };
      return { state: (d.study?.progress?.[id]?.percentCompleted ?? 0) > 0 ? 'started' : 'todo', auto };
    }
    case 'dictation':
    case 'translate': {
      const mode = t.kind === 'dictation' ? 'dictation' : 'translation';
      const done = (d.sentence?.sessions ?? []).some((s) => s?.mode === mode && s.setId === t.set);
      return { state: done ? 'done' : 'todo', auto };
    }
    case 'write': {
      const done = (d.writing?.submissions ?? []).some((s) => s?.promptId === t.prompt);
      return { state: done ? 'done' : 'todo', auto };
    }
    case 'speak': {
      const done = (d.speaking?.attempts ?? []).some((a) =>
        (a?.answers ?? []).some((x) => {
          const ans = x as { questionId?: string; part?: number; skipped?: boolean } | null;
          return !!ans && !ans.skipped && typeof ans.questionId === 'string' && speakingAnswerMatches(t, ans.questionId, ans.part);
        }),
      );
      return { state: done ? 'done' : 'todo', auto };
    }
    case 'math-lesson':
      return { state: d.lessons?.[`math:${t.skill}`] ? 'done' : 'todo', auto };
    case 'rw-lesson':
      return { state: d.lessons?.[`verbal:${t.skill}`] ? 'done' : 'todo', auto };
    case 'rw-set': {
      const ids = r.rwSetQuestions(t.set);
      if (!ids || ids.length === 0) return { state: 'todo', auto };
      const answered = ids.filter((id) => !!d.satRw?.[id]).length;
      const need = Math.ceil(ids.length * RW_SET_DONE_RATIO);
      return { state: answered >= need ? 'done' : answered > 0 ? 'started' : 'todo', auto, have: answered, need };
    }
    case 'sat-vocab': {
      const bests = Object.entries(d.satQuiz ?? {})
        .filter(([k, v]) => k.startsWith(`${t.slug}:`) && !!v && v.total > 0)
        .map(([, v]) => v!);
      if (bests.some((v) => v.score / v.total >= SAT_QUIZ_PASS_RATIO)) return { state: 'done', auto };
      return { state: bests.length > 0 ? 'started' : 'todo', auto };
    }
    default:
      return { state: 'todo', auto };
  }
}

export type LevelProgress = {
  statuses: Record<string, NodeStatus>;
  /** Bài nên học tiếp: bài CHƯA XONG đầu tiên theo thứ tự lộ trình; null khi xong hết. */
  next: PathNode | null;
  done: number;
  total: number;
  parts: Record<string, { done: number; total: number }>;
};

/**
 * Bài kế tiếp. Không khoá bài nào — người học nhảy cóc thoải mái — nhưng gợi ý
 * luôn là chỗ trống SỚM NHẤT, để ai bỏ dở Part 1 vẫn được dẫn về Part 1.
 * Bài đang làm dở cũng là "chưa xong", nên được chọn trước bài chưa mở.
 */
export function nextNode(level: PathLevel, statuses: Record<string, NodeStatus>): PathNode | null {
  for (const part of level.parts) for (const n of part.nodes) if (statuses[n.id]?.state !== 'done') return n;
  return null;
}

export function levelProgress(level: PathLevel, d: PathData, r: PathResolvers): LevelProgress {
  const statuses: Record<string, NodeStatus> = {};
  const parts: LevelProgress['parts'] = {};
  let done = 0;
  let total = 0;
  for (const part of level.parts) {
    let pd = 0;
    for (const n of part.nodes) {
      const s = nodeStatus(n, d, r);
      statuses[n.id] = s;
      if (s.state === 'done') pd += 1;
    }
    parts[part.id] = { done: pd, total: part.nodes.length };
    done += pd;
    total += part.nodes.length;
  }
  return { statuses, next: nextNode(level, statuses), done, total, parts };
}
